import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const session = await auth()
  if (!session.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createClient()

  const { threadId } = await params

  // Fetch messages + citations in one query via join
  const { data: messages, error } = await supabase
    .from('ai_messages')
    .select(`
      id,
      role,
      content,
      token_usage,
      created_at,
      ai_citations (
        id,
        chunk_id,
        document_id,
        score,
        documents (
          id,
          title,
          mime_type
        )
      )
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ messages })
}
