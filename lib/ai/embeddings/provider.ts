import { embed } from 'ai'

export const EMBEDDING_MODEL = 'openai/text-embedding-3-small'
export const EMBEDDING_DIMENSIONS = 1536

/**
 * Embed a single string, returns a Float32Array-compatible number[].
 * Uses the Vercel AI Gateway — no provider package needed.
 */
export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: text,
  })
  return embedding
}

/**
 * Batch-embed up to 100 strings at once to reduce latency.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  // Process in parallel with a concurrency cap of 5 to avoid rate limits
  const CONCURRENCY = 5
  const results: number[][] = []
  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    const batch = texts.slice(i, i + CONCURRENCY)
    const embeddings = await Promise.all(batch.map((t) => embedText(t)))
    results.push(...embeddings)
  }
  return results
}
