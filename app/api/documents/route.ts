import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  documentType: z.string().trim().min(1).max(80),
  fileSize: z.number().int().min(1).max(25 * 1024 * 1024),
  mimeType: z.string().trim().max(160),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid document' }, { status: 422 })
  const input = parsed.data
  const supabase = await createClient()
  const [{ data: membership }, { data: organization }, { count: documentCount }] = await Promise.all([
    supabase.from('members').select('organization_id').eq('organization_id', input.organizationId).eq('user_id', session.userId).maybeSingle(),
    supabase.from('organizations').select('plan, plan_limits(max_docs)').eq('id', input.organizationId).single(),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('organization_id', input.organizationId),
  ])
  if (!membership) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const plan = Array.isArray((organization as any)?.plan_limits) ? (organization as any).plan_limits[0] : (organization as any)?.plan_limits
  const limit = Number(plan?.max_docs ?? 1)
  if ((documentCount ?? 0) >= limit) {
    return Response.json({ error: `This workspace has reached its ${limit}-file knowledge allowance.`, code: 'PLAN_LIMIT_REACHED', upgradeUrl: '/pricing?source=document-limit' }, { status: 402 })
  }

  const { data: document, error } = await supabase.from('documents').insert({
    organization_id: input.organizationId,
    title: input.title,
    document_type: input.documentType,
    file_size: input.fileSize,
    mime_type: input.mimeType || 'text/plain',
    uploaded_by: session.userId,
    ingest_status: 'queued',
  }).select().single()
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ document }, { status: 201 })
}
