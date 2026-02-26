import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('organizationId')
  const agentType = searchParams.get('agentType')

  if (!orgId) return Response.json({ error: 'organizationId required' }, { status: 400 })

  let query = supabase
    .from('ai_threads')
    .select('id, title, agent_type, created_at, updated_at')
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (agentType) {
    query = query.eq('agent_type', agentType)
  }

  const { data, error } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ threads: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { organizationId, agentType, title } = await req.json()
  if (!organizationId) return Response.json({ error: 'organizationId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('ai_threads')
    .insert({
      organization_id: organizationId,
      created_by: user.id,
      agent_type: agentType ?? 'startup_lawyer',
      title: title ?? 'New conversation',
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ thread: data }, { status: 201 })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const threadId = searchParams.get('threadId')
  if (!threadId) return Response.json({ error: 'threadId required' }, { status: 400 })

  const { error } = await supabase
    .from('ai_threads')
    .delete()
    .eq('id', threadId)
    .eq('created_by', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
