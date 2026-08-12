import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { consumeEntitlement } from '@/lib/ai/entitlements'
import { buildIntelligenceReport, intelligenceWorkflowKeys } from '@/lib/ai/intelligence'
import { createClient } from '@/lib/supabase/server'

const requestSchema = z.object({
  organizationId: z.string().uuid(),
  workflowKey: z.enum(intelligenceWorkflowKeys),
  question: z.string().trim().max(500).optional().nullable(),
})

const steps = [
  { step_key: 'scope', label: 'Establish tenant scope', position: 1 },
  { step_key: 'retrieve', label: 'Retrieve operating evidence', position: 2 },
  { step_key: 'reason', label: 'Score risks and opportunities', position: 3 },
  { step_key: 'compose', label: 'Build the decision brief', position: 4 },
]

export async function POST(request: Request) {
  const session = await auth()
  if (!session.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 422 })

  const { organizationId, workflowKey, question } = parsed.data
  const supabase = await createClient()
  const { data: membership } = await supabase
    .from('members')
    .select('organization_id')
    .eq('organization_id', organizationId)
    .eq('user_id', session.userId)
    .maybeSingle()
  if (!membership) return Response.json({ error: 'Forbidden' }, { status: 403 })

  let entitlement
  try {
    entitlement = await consumeEntitlement(organizationId, 'intelligence_run')
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Usage controls are temporarily unavailable.' }, { status: 503 })
  }
  if (!entitlement.allowed) {
    return Response.json({
      error: 'Your monthly Intelligence HQ allowance has been used.',
      code: 'PLAN_LIMIT_REACHED',
      usage: entitlement,
      upgradeUrl: '/pricing?source=intelligence-limit',
    }, { status: 402 })
  }

  const startedAt = Date.now()
  const { data: run, error: runError } = await supabase.from('ai_runs').insert({
    organization_id: organizationId,
    workflow_key: workflowKey,
    status: 'running',
    question: question || null,
    created_by: session.userId,
  }).select('id, created_at').single()
  if (runError) return Response.json({ error: runError.message }, { status: 400 })

  await supabase.from('ai_run_steps').insert(steps.map((step) => ({
    ...step,
    run_id: run.id,
    organization_id: organizationId,
    status: 'running',
    started_at: new Date().toISOString(),
  })))

  try {
    const [organizationResult, projectsResult, tasksResult, deadlinesResult, intakesResult, documentsResult, activityResult, membersResult] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', organizationId).single(),
      supabase.from('client_projects').select('*').eq('organization_id', organizationId).order('updated_at', { ascending: false }).limit(50),
      supabase.from('tasks').select('*').eq('organization_id', organizationId).order('due_date', { ascending: true, nullsFirst: false }).limit(100),
      supabase.from('filings').select('*').eq('organization_id', organizationId).order('due_date', { ascending: true }).limit(50),
      supabase.from('intake_submissions').select('*').eq('organization_id', organizationId).order('submitted_at', { ascending: false }).limit(10),
      supabase.from('documents').select('id, title, document_type, ingest_status, chunk_count, created_at, updated_at').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(50),
      supabase.from('account_activity').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(30),
      supabase.from('members').select('id, role, created_at').eq('organization_id', organizationId).limit(100),
    ])
    if (organizationResult.error || !organizationResult.data) throw organizationResult.error ?? new Error('Workspace not found.')

    const report = buildIntelligenceReport({
      workflowKey,
      question,
      organization: organizationResult.data,
      projects: projectsResult.data ?? [],
      tasks: tasksResult.data ?? [],
      deadlines: deadlinesResult.data ?? [],
      intakes: intakesResult.data ?? [],
      documents: documentsResult.data ?? [],
      activities: activityResult.data ?? [],
      members: membersResult.data ?? [],
    })
    const completedAt = new Date().toISOString()
    const durationMs = Date.now() - startedAt

    const sourceInsert = report.sources.map((source) => ({ ...source, run_id: run.id, organization_id: organizationId }))
    const insightInsert = report.signals.map((signal) => ({
      organization_id: organizationId,
      run_id: run.id,
      insight_type: signal.type,
      title: signal.title,
      summary: signal.detail,
      severity: signal.severity,
      confidence: signal.confidence,
      created_by: session.userId,
    }))
    await Promise.all([
      sourceInsert.length ? supabase.from('ai_run_sources').insert(sourceInsert) : Promise.resolve(),
      insightInsert.length ? supabase.from('ai_insights').insert(insightInsert) : Promise.resolve(),
      supabase.from('ai_run_steps').update({ status: 'completed', completed_at: completedAt }).eq('run_id', run.id),
      supabase.from('ai_runs').update({
        status: 'completed',
        headline: report.headline,
        summary: report.summary,
        output: report,
        confidence: report.confidence,
        source_count: report.sources.length,
        action_count: report.actions.length,
        duration_ms: durationMs,
        completed_at: completedAt,
      }).eq('id', run.id),
    ])

    return Response.json({
      run: { id: run.id, createdAt: run.created_at, workflowKey, report },
      usage: entitlement,
      inference: { mode: 'deterministic-rag', paidTokens: 0, durationMs },
    })
  } catch (error) {
    await Promise.all([
      supabase.from('ai_run_steps').update({ status: 'failed', completed_at: new Date().toISOString() }).eq('run_id', run.id),
      supabase.from('ai_runs').update({ status: 'failed', error_message: error instanceof Error ? error.message.slice(0, 500) : 'Run failed', completed_at: new Date().toISOString() }).eq('id', run.id),
    ])
    return Response.json({ error: 'The intelligence run could not be completed.' }, { status: 500 })
  }
}
