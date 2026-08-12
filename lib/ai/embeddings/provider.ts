export const EMBEDDING_MODEL = 'openai/text-embedding-3-small'
export const EMBEDDING_DIMENSIONS = 1536

/**
 * Embed a single string, returns a Float32Array-compatible number[].
 * Uses the Vercel AI Gateway — no provider package needed.
 */
export async function embedText(text: string): Promise<number[]> {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0)
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? []
  for (const word of words) {
    let hash = 2166136261
    for (let i = 0; i < word.length; i += 1) hash = Math.imul(hash ^ word.charCodeAt(i), 16777619)
    const index = Math.abs(hash) % EMBEDDING_DIMENSIONS
    vector[index] += hash & 1 ? -1 : 1
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1
  return vector.map((value) => value / norm)
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
