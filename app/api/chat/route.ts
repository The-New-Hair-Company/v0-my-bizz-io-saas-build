import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { buildRetrievalQuery, composeGroundedAnswer, type GroundedSource } from '@/lib/ai/grounded'

const schema = z.object({
  messages: z.array(z.object({ role: z.string(), content: z.string() })).min(1),
  chatId: z.string().uuid().optional().nullable(),
  organizationId: z.string().uuid(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 422 })
  const supabase = await createClient()
  const { organizationId, chatId, messages } = parsed.data
  const { data: membership } = await supabase.from('members').select('organization_id').eq('organization_id', organizationId).eq('user_id', session.userId).maybeSingle()
  if (!membership) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const question = [...messages].reverse().find((message) => message.role === 'user')?.content ?? messages.at(-1)!.content
  const { data, error } = await supabase.rpc('search_grounded_knowledge', { query_text: buildRetrievalQuery(question), p_organization_id: organizationId, match_count: 6 })
  if (error) return Response.json({ error: error.message }, { status: 400 })
  const answer = composeGroundedAnswer(question, (data ?? []) as GroundedSource[], 'startup_lawyer')
  if (chatId) {
    await supabase.from('messages').insert([{ chat_id: chatId, role: 'user', content: question }, { chat_id: chatId, role: 'assistant', content: answer }])
    await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId)
  }
  return Response.json({ message: { role: 'assistant', content: answer }, mode: 'local_retrieval', tokens: 0 })
}
