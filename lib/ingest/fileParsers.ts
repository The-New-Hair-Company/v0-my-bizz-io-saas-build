/**
 * Extract plain text from uploaded file buffers.
 * Supported: PDF (via pdfjs-dist), DOCX (via mammoth), TXT/CSV (raw).
 * Falls back to empty string if extraction fails rather than throwing.
 */

export type ParsedFile = {
  text: string
  pageCount?: number
  wordCount: number
  metadata: Record<string, string>
}

/**
 * Parse a file buffer given its MIME type.
 */
export async function parseFile(
  buffer: ArrayBuffer,
  mimeType: string,
  fileName: string,
): Promise<ParsedFile> {
  const mime = mimeType.toLowerCase()

  if (mime === 'application/pdf') {
    return parsePdf(buffer, fileName)
  }

  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword'
  ) {
    return parseDocx(buffer, fileName)
  }

  if (mime === 'text/plain' || mime === 'text/csv' || mime.startsWith('text/')) {
    return parsePlainText(buffer, fileName)
  }

  // Unknown type — try treating as UTF-8 text
  return parsePlainText(buffer, fileName)
}

async function parsePdf(buffer: ArrayBuffer, fileName: string): Promise<ParsedFile> {
  try {
    // Dynamic import to avoid bundling pdfjs-dist unless needed
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs').catch(() => null)

    if (!pdfjsLib) {
      // pdfjs not available — return empty with warning
      console.warn('[ingest] pdfjs-dist not available, skipping PDF text extraction')
      return { text: '', wordCount: 0, metadata: { fileName, parseError: 'pdfjs unavailable' } }
    }

    const uint8 = new Uint8Array(buffer)
    const doc = await pdfjsLib.getDocument({ data: uint8 }).promise
    const pageCount = doc.numPages
    const textParts: string[] = []

    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
      textParts.push(pageText.trim())
    }

    const text = textParts.join('\n\n').replace(/\s{3,}/g, '  ').trim()
    return {
      text,
      pageCount,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      metadata: { fileName, pageCount: String(pageCount) },
    }
  } catch (err) {
    console.error('[ingest] PDF parse error:', err)
    return { text: '', wordCount: 0, metadata: { fileName, parseError: String(err) } }
  }
}

async function parseDocx(buffer: ArrayBuffer, fileName: string): Promise<ParsedFile> {
  try {
    const mammoth = await import('mammoth').catch(() => null)

    if (!mammoth) {
      console.warn('[ingest] mammoth not available, skipping DOCX text extraction')
      return { text: '', wordCount: 0, metadata: { fileName, parseError: 'mammoth unavailable' } }
    }

    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
    const text = result.value.trim()
    return {
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      metadata: { fileName },
    }
  } catch (err) {
    console.error('[ingest] DOCX parse error:', err)
    return { text: '', wordCount: 0, metadata: { fileName, parseError: String(err) } }
  }
}

function parsePlainText(buffer: ArrayBuffer, fileName: string): ParsedFile {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer).trim()
  return {
    text,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    metadata: { fileName },
  }
}
