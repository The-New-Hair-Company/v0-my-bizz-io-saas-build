'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useUser } from '@clerk/nextjs'
import { Loader2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function DocumentUploader({ accounts }: { accounts: Array<{ id: string; name: string }> }) {
  const router = useRouter()
  const { session } = useSession()
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [documentType, setDocumentType] = useState('other')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function upload(formData: FormData) {
    const file = formData.get('file') as File | null
    const title = String(formData.get('title') ?? '').trim()
    if (!file || !accountId || !user || !session) return
    setBusy(true)
    setError('')
    const supabase = createClient(async () => session.getToken())
    const { data: document, error: createError } = await supabase.from('documents').insert({
      organization_id: accountId,
      title: title || file.name,
      document_type: documentType,
      file_size: file.size,
      mime_type: file.type || 'text/plain',
      uploaded_by: user.id,
      ingest_status: 'queued',
    }).select().single()
    if (createError || !document) { setError(createError?.message ?? 'Could not create document.'); setBusy(false); return }

    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-')
    const storagePath = `company/${accountId}/docs/${document.id}/${cleanName}`
    const { error: storageError } = await supabase.storage.from('company-documents').upload(storagePath, file, { upsert: false })
    if (storageError) { await supabase.from('documents').delete().eq('id', document.id); setError(storageError.message); setBusy(false); return }

    await supabase.from('documents').update({ storage_path: storagePath, file_url: storagePath }).eq('id', document.id)
    const ingest = await fetch(`/api/documents/${document.id}/ingest`, { method: 'POST' })
    if (!ingest.ok) setError('Uploaded successfully; indexing will retry from the document vault.')
    setBusy(false)
    setOpen(false)
    router.refresh()
  }

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="agency-button"><Upload className="mr-2 h-4 w-4" />Upload document</Button></DialogTrigger><DialogContent className="border-orange-100"><DialogHeader><DialogTitle>Add to the knowledge vault</DialogTitle><DialogDescription>Files stay inside the selected tenant and are indexed locally for grounded retrieval.</DialogDescription></DialogHeader><form action={upload} className="space-y-4"><div><Label>Client account</Label><Select value={accountId} onValueChange={setAccountId}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="document-title">Title</Label><Input id="document-title" name="title" className="mt-2" placeholder="Board minutes, proposal, contract…" /></div><div><Label>Document type</Label><Select value={documentType} onValueChange={setDocumentType}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{['certificate','filing','contract','agreement','policy','other'].map((value) => <SelectItem key={value} value={value} className="capitalize">{value}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="document-file">File</Label><Input id="document-file" name="file" className="mt-2" type="file" accept=".pdf,.docx,.txt,.md" required /></div>{error && <p className="rounded-lg bg-orange-50 p-3 text-sm text-orange-900">{error}</p>}<Button className="agency-button w-full" disabled={busy || !accountId}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Upload and index</Button></form></DialogContent></Dialog>
}
