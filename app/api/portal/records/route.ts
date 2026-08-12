import { auth } from '@clerk/nextjs/server'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isApplicationAdmin } from '@/lib/portal/auth'
import { absoluteApplicationUrl } from '@/lib/deployment'

const id = z.string().uuid()
const optionalDate = z.string().trim().max(32).optional().nullable()

const schemas = {
  project: z.object({
    organization_id: id,
    name: z.string().trim().min(2).max(160),
    project_type: z.string().trim().min(2).max(80),
    status: z.enum(['discovery', 'strategy', 'design', 'development', 'qa', 'launch', 'support', 'complete', 'on_hold']).default('discovery'),
    progress: z.coerce.number().int().min(0).max(100).default(0),
    budget: z.coerce.number().min(0).optional().nullable(),
    target_launch: optionalDate,
  }),
  task: z.object({
    organization_id: id,
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(4000).optional().nullable(),
    status: z.enum(['todo', 'in_progress', 'done', 'cancelled']).default('todo'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    due_date: optionalDate,
    assigned_to: z.string().trim().max(200).optional().nullable(),
  }),
  deadline: z.object({
    organization_id: id,
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(4000).optional().nullable(),
    filing_type: z.string().trim().min(2).max(100),
    jurisdiction: z.string().trim().min(2).max(100),
    due_date: z.string().trim().min(8).max(32),
    status: z.enum(['upcoming', 'in_progress', 'filed', 'overdue']).default('upcoming'),
  }),
  integration: z.object({
    organization_id: id,
    provider: z.string().trim().min(2).max(80),
    display_name: z.string().trim().min(2).max(120),
    status: z.enum(['available', 'connected', 'attention', 'disabled']).default('connected'),
    configuration: z.record(z.string(), z.unknown()).default({}),
  }),
  invite: z.object({
    organization_id: id,
    email: z.string().trim().email().max(320),
    role: z.enum(['owner', 'admin', 'member']).default('member'),
  }),
  preference: z.object({
    active_organization_id: id.optional().nullable(),
    accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#ff6600'),
    theme_mode: z.enum(['light', 'dark', 'system']).default('light'),
    compact_mode: z.boolean().default(false),
    email_notifications: z.boolean().default(true),
    deadline_notifications: z.boolean().default(true),
    weekly_digest: z.boolean().default(true),
  }),
  account: z.object({
    name: z.string().trim().min(2).max(160),
    primary_contact_name: z.string().trim().max(160).optional().nullable(),
    primary_contact_email: z.string().trim().email().optional().nullable(),
    industry: z.string().trim().max(120).optional().nullable(),
    lifecycle_stage: z.enum(['lead', 'discovery', 'proposal', 'onboarding', 'active', 'paused', 'churned']).default('lead'),
  }),
} as const

type Resource = keyof typeof schemas

async function actor() {
  const session = await auth()
  if (!session.userId) return null
  return { userId: session.userId, supabase: await createClient() }
}

async function assigned(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, organizationId: string, admin = false) {
  let query = supabase
    .from('members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
  if (admin) query = query.in('role', ['owner', 'admin'])
  const { data } = await query.maybeSingle()
  return Boolean(data)
}

export async function POST(request: Request) {
  const current = await actor()
  if (!current) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const resource = body?.resource as Resource
  if (!resource || !(resource in schemas)) return Response.json({ error: 'Unsupported resource' }, { status: 400 })

  const parsed = schemas[resource].safeParse(body.data)
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 422 })
  const data: any = parsed.data

  if (resource === 'account') {
    if (!(await isApplicationAdmin(current.userId))) return Response.json({ error: 'Forbidden' }, { status: 403 })
    const admin = createAdminClient()
    const slugBase = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'account'
    const { data: account, error } = await admin.from('organizations').insert({
      ...data,
      slug: `${slugBase}-${randomBytes(3).toString('hex')}`,
      source: 'manual',
      created_by: current.userId,
      account_status: 'active',
      health_score: 75,
    }).select().single()
    if (error) return Response.json({ error: error.message }, { status: 400 })
    const { error: memberError } = await admin.from('members').insert({ organization_id: account.id, user_id: current.userId, role: 'owner' })
    if (memberError) return Response.json({ error: memberError.message }, { status: 400 })
    return Response.json({ record: account }, { status: 201 })
  }

  const organizationId = data.organization_id ?? data.active_organization_id
  if (organizationId && !(await assigned(current.supabase, current.userId, organizationId, resource === 'invite' || resource === 'integration'))) {
    return Response.json({ error: 'You do not have access to this account' }, { status: 403 })
  }

  let table = ''
  let payload: Record<string, unknown> = data
  if (resource === 'project') {
    table = 'client_projects'
    payload = { ...data, owner_id: current.userId }
  } else if (resource === 'task') {
    table = 'tasks'
    payload = { ...data, created_by: current.userId }
  } else if (resource === 'deadline') {
    table = 'filings'
    payload = { ...data, created_by: current.userId }
  } else if (resource === 'integration') {
    const { data: record, error } = await current.supabase.from('integrations').upsert({
      ...data,
      connected_by: current.userId,
      connected_at: data.status === 'connected' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,provider' }).select().single()
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json({ record }, { status: 201 })
  } else if (resource === 'invite') {
    const [{ data: organization }, { count: seatCount }] = await Promise.all([
      current.supabase.from('organizations').select('plan, plan_limits(max_seats)').eq('id', data.organization_id).single(),
      current.supabase.from('members').select('id', { count: 'exact', head: true }).eq('organization_id', data.organization_id),
    ])
    const plan = Array.isArray((organization as any)?.plan_limits) ? (organization as any).plan_limits[0] : (organization as any)?.plan_limits
    if ((seatCount ?? 0) >= Number(plan?.max_seats ?? 1)) {
      return Response.json({ error: 'This workspace has reached its seat allowance.', code: 'PLAN_LIMIT_REACHED', upgradeUrl: '/pricing?source=seat-limit' }, { status: 402 })
    }
    const { data: record, error } = await current.supabase.from('team_invites').insert({
      ...data,
      email: data.email.toLowerCase(),
      invited_by: current.userId,
      token: randomBytes(24).toString('base64url'),
    }).select().single()
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json({ record, inviteUrl: absoluteApplicationUrl(`/auth/sign-up?invite=${record.token}`) }, { status: 201 })
  } else if (resource === 'preference') {
    const { data: record, error } = await current.supabase.from('member_preferences').upsert({
      ...data,
      user_id: current.userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' }).select().single()
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json({ record }, { status: 201 })
  }

  const { data: record, error } = await current.supabase.from(table).insert(payload).select().single()
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ record }, { status: 201 })
}

const updateFields: Record<string, string[]> = {
  project: ['name', 'project_type', 'status', 'progress', 'budget', 'target_launch'],
  task: ['title', 'description', 'status', 'priority', 'due_date', 'assigned_to'],
  deadline: ['title', 'description', 'status', 'due_date', 'filing_date', 'confirmation_number'],
  intake: ['status', 'assigned_to', 'notes'],
  account: ['name', 'primary_contact_name', 'primary_contact_email', 'primary_contact_phone', 'industry', 'company_size', 'lifecycle_stage', 'account_status', 'health_score', 'onboarding_progress', 'website'],
  member: ['role'],
  integration: ['status', 'configuration', 'last_sync_at'],
  invite: ['status', 'role'],
}

const tableFor: Record<string, string> = {
  project: 'client_projects', task: 'tasks', deadline: 'filings', intake: 'intake_submissions',
  account: 'organizations', member: 'members', integration: 'integrations', invite: 'team_invites',
}

export async function PATCH(request: Request) {
  const current = await actor()
  if (!current) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const resource = String(body?.resource ?? '')
  const recordId = z.string().uuid().safeParse(body?.id)
  if (!recordId.success || !tableFor[resource]) return Response.json({ error: 'Invalid request' }, { status: 400 })

  const permitted = updateFields[resource] ?? []
  const updates = Object.fromEntries(Object.entries(body.data ?? {}).filter(([key]) => permitted.includes(key)))
  if (!Object.keys(updates).length) return Response.json({ error: 'No supported fields supplied' }, { status: 422 })
  ;(updates as any).updated_at = new Date().toISOString()

  const { data, error } = await current.supabase.from(tableFor[resource]).update(updates).eq('id', recordId.data).select().single()
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ record: data })
}

export async function DELETE(request: Request) {
  const current = await actor()
  if (!current) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const resource = searchParams.get('resource') ?? ''
  const recordId = z.string().uuid().safeParse(searchParams.get('id'))
  if (!recordId.success || !tableFor[resource] || resource === 'account') return Response.json({ error: 'Invalid request' }, { status: 400 })
  const { error } = await current.supabase.from(tableFor[resource]).delete().eq('id', recordId.data)
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ success: true })
}
