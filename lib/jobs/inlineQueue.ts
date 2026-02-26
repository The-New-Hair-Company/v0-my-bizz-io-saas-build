/**
 * Inline (synchronous) job queue for document ingestion.
 * Runs the ingestion in the same process, suitable for development
 * and serverless functions with generous timeouts.
 *
 * For production at scale: replace with Inngest / BullMQ / Vercel Cron.
 */

import { ingestDocument, IngestResult } from '@/lib/ingest/ingestDocument'

/**
 * Enqueue a document for ingestion.
 * Currently runs synchronously; swap body for background task dispatch.
 */
export async function enqueueIngest(documentId: string): Promise<IngestResult> {
  return ingestDocument(documentId)
}
