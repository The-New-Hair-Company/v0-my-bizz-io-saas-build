import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getSupabasePublicConfig } from '@/lib/supabase/config'
import { buildRetrievalQuery, composeGroundedAnswer, type GroundedSource } from '@/lib/ai/grounded'

const schema = z.object({ message: z.string().trim().min(2).max(600) })

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Ask a short question about MyBizz.' }, { status: 422 })
  const { url, publishableKey } = getSupabasePublicConfig()
  const supabase = createSupabaseClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await supabase.rpc('search_grounded_knowledge', { query_text: buildRetrievalQuery(parsed.data.message), p_organization_id: null, match_count: 5 })
  if (error) return Response.json({ error: 'The knowledge assistant is briefly unavailable.' }, { status: 503 })
  const sources = (data ?? []) as GroundedSource[]
  return Response.json({ answer: composeGroundedAnswer(parsed.data.message, sources, 'public'), sources: sources.map((source) => ({ id: source.source_id, title: source.title, score: source.score })) })
}
