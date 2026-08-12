import { createClient } from '@/lib/supabase/server'
import { enqueueIngest } from '@/lib/jobs/inlineQueue'
import { auth } from '@clerk/nextjs/server'

export const maxDuration = 60

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const session = await auth()
  if (!session.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createClient()

  const { documentId } = await params

  // Verify the document belongs to an org the user is a member of
  const { data: doc } = await supabase
    .from('documents')
    .select('id, organization_id, ingest_status')
    .eq('id', documentId)
    .single()

  if (!doc) {
    return Response.json({ error: 'Document not found' }, { status: 404 })
  }

  const { data: membership } = await supabase
    .from('members')
    .select('organization_id')
    .eq('user_id', session.userId)
    .eq('organization_id', doc.organization_id)
    .single()

  if (!membership) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Run ingestion
  const result = await enqueueIngest(documentId)

  if (result.error) {
    return Response.json({ success: false, result }, { status: 500 })
  }

  return Response.json({ success: true, result })
}
