/**
 * Semantic retrieval: embed the user query → call match_chunks RPC → return top-K.
 * Capped at 6 chunks; total context budget ~3000 tokens.
 */

import { createClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/ai/embeddings/provider'

export const MAX_CHUNKS = 6
export const MATCH_THRESHOLD = 0.55
export const MAX_CONTEXT_TOKENS = 3000
export const APPROX_CHARS_PER_TOKEN = 4

export type RetrievedChunk = {
  id: string
  documentId: string
  chunkIndex: number
  content: string
  metadata: Record<string, unknown>
  score: number
}

/**
 * Retrieve the most relevant document chunks for a user query.
 * Scoped to the given organization_id via RPC + RLS.
 *
 * @param query   The user's raw message text
 * @param orgId   The org whose vault to search
 * @param docIds  Optional: limit search to specific document IDs
 */
export async function retrieveChunks(
  query: string,
  orgId: string,
  docIds?: string[],
): Promise<RetrievedChunk[]> {
  if (!query.trim()) return []

  const supabase = await createClient()

  // Embed the query
  const embedding = await embedText(query)

  // Call the match_chunks DB function
  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: embedding,
    org_id: orgId,
    match_count: MAX_CHUNKS,
    match_threshold: MATCH_THRESHOLD,
  })

  if (error) {
    console.error('[retrieval] match_chunks RPC error:', error.message)
    return []
  }

  let chunks = (data ?? []) as RetrievedChunk[]

  // Optionally filter to requested document IDs (server-side safety)
  if (docIds && docIds.length > 0) {
    chunks = chunks.filter((c) => docIds.includes(c.documentId))
  }

  // Trim to context budget
  let tokensSoFar = 0
  const trimmed: RetrievedChunk[] = []
  for (const chunk of chunks) {
    const chunkTokens = Math.ceil(chunk.content.length / APPROX_CHARS_PER_TOKEN)
    if (tokensSoFar + chunkTokens > MAX_CONTEXT_TOKENS) break
    trimmed.push(chunk)
    tokensSoFar += chunkTokens
  }

  return trimmed
}
