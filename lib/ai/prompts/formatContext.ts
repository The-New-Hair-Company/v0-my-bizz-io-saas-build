import type { RetrievedChunk } from '@/lib/ai/retrieval/retrieveChunks'

/**
 * Format retrieved chunks into a structured context block for the system prompt.
 * Each chunk is numbered [1], [2] … matching the citation references in the reply.
 */
export function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return ''

  const lines: string[] = [
    '---',
    'RELEVANT CONTEXT FROM COMPANY DOCUMENTS',
    '(Cite sources using [1], [2] … at the end of relevant sentences.)',
    '---',
  ]

  chunks.forEach((chunk, i) => {
    const label = `[${i + 1}]`
    const docInfo = chunk.metadata?.fileName
      ? ` (${chunk.metadata.fileName})`
      : ''
    lines.push(`\n${label}${docInfo}\n${chunk.content}`)
  })

  lines.push('\n---')
  return lines.join('\n')
}

/**
 * Build a lightweight citation map from retrieved chunks so the API route
 * can persist ai_citations rows after the LLM reply.
 */
export function buildCitationMap(
  chunks: RetrievedChunk[],
): Map<number, { chunkId: string; documentId: string; score: number }> {
  const map = new Map<number, { chunkId: string; documentId: string; score: number }>()
  chunks.forEach((chunk, i) => {
    map.set(i + 1, {
      chunkId: chunk.id,
      documentId: chunk.documentId,
      score: chunk.score,
    })
  })
  return map
}
