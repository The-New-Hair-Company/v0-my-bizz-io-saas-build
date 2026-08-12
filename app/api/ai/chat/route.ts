import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { buildRetrievalQuery, composeGroundedAnswer, type GroundedSource } from '@/lib/ai/grounded'

const requestSchema = z.object({
  message: z.string().trim().min(2).max(4000),
  threadId: z.string().uuid().optional().nullable(),
  organizationId: z.string().uuid(),
  agentType: z.enum(['startup_lawyer', 'cofounder']).default('startup_lawyer'),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createClient()
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 422 })
  const { message, organizationId, agentType } = parsed.data

  const { data: membership } = await supabase.from('members').select('organization_id').eq('user_id', session.userId).eq('organization_id', organizationId).maybeSingle()
  if (!membership) return Response.json({ error: 'Forbidden' }, { status: 403 })

  let threadId = parsed.data.threadId
  if (threadId) {
    const { data: thread } = await supabase.from('ai_threads').select('id').eq('id', threadId).eq('organization_id', organizationId).maybeSingle()
    if (!thread) return Response.json({ error: 'Conversation not found' }, { status: 404 })
  } else {
    const { data: thread, error } = await supabase.from('ai_threads').insert({ organization_id: organizationId, created_by: session.userId, agent_type: agentType, title: message.slice(0, 80) }).select('id').single()
    if (error) return Response.json({ error: error.message }, { status: 400 })
    threadId = thread.id
  }

  const { data: sources, error: searchError } = await supabase.rpc('search_grounded_knowledge', { query_text: buildRetrievalQuery(message), p_organization_id: organizationId, match_count: 6 })
  if (searchError) return Response.json({ error: searchError.message }, { status: 400 })
  const groundedSources = (sources ?? []) as GroundedSource[]
  const answer = composeGroundedAnswer(message, groundedSources, agentType)

  const { error: userMessageError } = await supabase.from('ai_messages').insert({ thread_id: threadId, organization_id: organizationId, role: 'user', content: message, token_usage: { mode: 'local_retrieval', tokens: 0 } })
  if (userMessageError) return Response.json({ error: userMessageError.message }, { status: 400 })
  const { data: assistantMessage, error: assistantError } = await supabase.from('ai_messages').insert({ thread_id: threadId, organization_id: organizationId, role: 'assistant', content: answer, token_usage: { mode: 'local_retrieval', tokens: 0 } }).select('id').single()
  if (assistantError) return Response.json({ error: assistantError.message }, { status: 400 })

  const documentSources = groundedSources.filter((source) => source.source_kind === 'document' && source.document_id)
  if (documentSources.length) await supabase.from('ai_citations').insert(documentSources.map((source) => ({ message_id: assistantMessage.id, chunk_id: source.source_id, document_id: source.document_id, organization_id: organizationId, quote: source.content.slice(0, 500), score: source.score })))
  await supabase.from('ai_threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId)

  return Response.json({ threadId, message: { id: assistantMessage.id, role: 'assistant', content: answer }, sources: groundedSources.map((source) => ({ id: source.source_id, title: source.title, excerpt: source.content.slice(0, 240), score: source.score, kind: source.source_kind })) })
}
