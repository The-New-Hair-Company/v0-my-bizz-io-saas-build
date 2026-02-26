/**
 * Core ingestion pipeline: parse → chunk → embed → upsert to document_chunks.
 * Called from the ingest API route or background job.
 */

import { createClient } from '@/lib/supabase/server'
import { parseFile } from './fileParsers'
import { chunkText } from './chunker'
import { embedBatch } from '@/lib/ai/embeddings/provider'
import { sha256 } from '@/lib/ai/embeddings/hash'

const MAX_ATTEMPTS = 3

export type IngestResult = {
  documentId: string
  chunksCreated: number
  chunksSkipped: number
  durationMs: number
  error?: string
}

/**
 * Full ingestion pipeline for a single document.
 * Idempotent: skips chunks whose content_hash already exists for this document.
 */
export async function ingestDocument(documentId: string): Promise<IngestResult> {
  const start = Date.now()
  const supabase = await createClient()

  // 1. Load document metadata
  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (docErr || !doc) {
    return {
      documentId,
      chunksCreated: 0,
      chunksSkipped: 0,
      durationMs: Date.now() - start,
      error: docErr?.message ?? 'Document not found',
    }
  }

  // 2. Guard: check attempt count and status
  if (doc.ingest_attempts >= MAX_ATTEMPTS) {
    return {
      documentId,
      chunksCreated: 0,
      chunksSkipped: 0,
      durationMs: Date.now() - start,
      error: `Max attempts (${MAX_ATTEMPTS}) reached`,
    }
  }

  // 3. Mark as processing
  await supabase
    .from('documents')
    .update({
      ingest_status: 'processing',
      ingest_attempts: doc.ingest_attempts + 1,
      ingest_error: null,
    })
    .eq('id', documentId)

  try {
    // 4. Download file from Supabase Storage
    if (!doc.storage_path) throw new Error('No storage_path on document')

    const { data: fileData, error: storageErr } = await supabase.storage
      .from('documents')
      .download(doc.storage_path)

    if (storageErr || !fileData) {
      throw new Error(`Storage download failed: ${storageErr?.message}`)
    }

    // 5. Parse file to text
    const buffer = await fileData.arrayBuffer()
    const parsed = await parseFile(buffer, doc.mime_type ?? 'text/plain', doc.title)

    if (!parsed.text) {
      throw new Error('Parsed text is empty — unsupported format or blank document')
    }

    // 6. Chunk text
    const chunks = chunkText(parsed.text)

    if (chunks.length === 0) {
      throw new Error('No chunks produced from document text')
    }

    // 7. Load existing hashes for this document (idempotency)
    const { data: existingChunks } = await supabase
      .from('document_chunks')
      .select('content_hash')
      .eq('document_id', documentId)

    const existingHashes = new Set((existingChunks ?? []).map((c) => c.content_hash))

    // 8. Compute hashes and filter to new chunks
    const chunksWithHashes = await Promise.all(
      chunks.map(async (chunk) => ({
        chunk,
        hash: await sha256(chunk.content),
      })),
    )

    const newChunks = chunksWithHashes.filter(({ hash }) => !existingHashes.has(hash))
    const skipped = chunksWithHashes.length - newChunks.length

    if (newChunks.length === 0) {
      // All chunks already indexed — mark as ready
      await supabase
        .from('documents')
        .update({ ingest_status: 'ready', chunk_count: chunks.length })
        .eq('id', documentId)

      return {
        documentId,
        chunksCreated: 0,
        chunksSkipped: skipped,
        durationMs: Date.now() - start,
      }
    }

    // 9. Embed new chunks in batches
    const embeddings = await embedBatch(newChunks.map(({ chunk }) => chunk.content))

    // 10. Upsert chunks into document_chunks
    const rows = newChunks.map(({ chunk, hash }, i) => ({
      document_id: documentId,
      organization_id: doc.organization_id,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      token_count_est: chunk.tokenCountEst,
      embedding: embeddings[i],
      content_hash: hash,
      metadata: {
        ...chunk.metadata,
        ...parsed.metadata,
        pageCount: parsed.pageCount,
      },
    }))

    const { error: insertErr } = await supabase
      .from('document_chunks')
      .upsert(rows, { onConflict: 'document_id,chunk_index' })

    if (insertErr) throw new Error(`Chunk insert failed: ${insertErr.message}`)

    // 11. Mark document as ready
    const totalChunks = (existingChunks?.length ?? 0) + newChunks.length
    await supabase
      .from('documents')
      .update({
        ingest_status: 'ready',
        chunk_count: totalChunks,
        ingest_error: null,
      })
      .eq('id', documentId)

    return {
      documentId,
      chunksCreated: newChunks.length,
      chunksSkipped: skipped,
      durationMs: Date.now() - start,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)

    await supabase
      .from('documents')
      .update({
        ingest_status: 'failed',
        ingest_error: errorMsg,
      })
      .eq('id', documentId)

    return {
      documentId,
      chunksCreated: 0,
      chunksSkipped: 0,
      durationMs: Date.now() - start,
      error: errorMsg,
    }
  }
}
