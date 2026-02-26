/**
 * Split document text into overlapping chunks for vector indexing.
 *
 * Strategy:
 * 1. Split on double-newline paragraph boundaries first
 * 2. If a paragraph exceeds MAX_CHARS, split on sentence boundaries
 * 3. Accumulate chunks with a sliding overlap window
 *
 * Target: ~900 chars per chunk, ~150 char overlap → ~200–250 tokens each.
 */

export const CHUNK_SIZE = 900
export const CHUNK_OVERLAP = 150

export type TextChunk = {
  content: string
  /** estimated token count (rough: chars / 4) */
  tokenCountEst: number
  chunkIndex: number
  metadata: {
    charStart: number
    charEnd: number
  }
}

export function chunkText(text: string): TextChunk[] {
  if (!text.trim()) return []

  const paragraphs = splitIntoParagraphs(text)
  const segments: string[] = []

  for (const para of paragraphs) {
    if (para.length <= CHUNK_SIZE) {
      segments.push(para)
    } else {
      // Split long paragraphs at sentence boundaries
      const sentences = splitIntoSentences(para)
      let current = ''
      for (const sentence of sentences) {
        if ((current + ' ' + sentence).trim().length <= CHUNK_SIZE) {
          current = (current + ' ' + sentence).trim()
        } else {
          if (current) segments.push(current)
          current = sentence
        }
      }
      if (current) segments.push(current)
    }
  }

  // Sliding window across segments to build chunks with overlap
  const chunks: TextChunk[] = []
  let charCursor = 0
  let chunkIndex = 0
  let segmentIdx = 0

  while (segmentIdx < segments.length) {
    let chunkContent = ''
    let startSeg = segmentIdx

    // Build chunk up to CHUNK_SIZE
    while (segmentIdx < segments.length) {
      const sep = chunkContent ? '\n\n' : ''
      const candidate = chunkContent + sep + segments[segmentIdx]
      if (candidate.length > CHUNK_SIZE && chunkContent) break
      chunkContent = candidate
      segmentIdx++
    }

    if (!chunkContent.trim()) {
      segmentIdx++
      continue
    }

    const charStart = charCursor
    const charEnd = charStart + chunkContent.length

    chunks.push({
      content: chunkContent.trim(),
      tokenCountEst: Math.ceil(chunkContent.length / 4),
      chunkIndex: chunkIndex++,
      metadata: { charStart, charEnd },
    })

    charCursor = charEnd

    // Backtrack for overlap: rewind ~CHUNK_OVERLAP chars
    let overlapChars = 0
    while (segmentIdx > startSeg + 1 && overlapChars < CHUNK_OVERLAP) {
      segmentIdx--
      overlapChars += segments[segmentIdx].length
    }
  }

  return chunks
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function splitIntoSentences(text: string): string[] {
  // Split on ., !, ? followed by whitespace/end
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}
