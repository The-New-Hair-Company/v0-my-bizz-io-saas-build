/**
 * Compute a SHA-256 hex digest of a string.
 * Used as the embedding cache key in document_chunks.content_hash.
 * Works in both Node.js (via crypto) and Edge runtimes (via SubtleCrypto).
 */
export async function sha256(text: string): Promise<string> {
  // Node.js / server environment
  if (typeof process !== 'undefined' && process.versions?.node) {
    const { createHash } = await import('node:crypto')
    return createHash('sha256').update(text, 'utf8').digest('hex')
  }
  // Edge / browser environment
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
