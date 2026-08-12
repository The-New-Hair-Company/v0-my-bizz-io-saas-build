import { FileCheck2, FileStack, Search, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/portal/auth'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/portal/PageHeader'
import { DocumentUploader } from '@/components/portal/DocumentUploader'

export default async function DocumentsPage() {
  const user = await requirePortalUser()
  const supabase = await createClient()
  const [{ data: documents }, { data: memberships }] = await Promise.all([
    supabase.from('documents').select('*, organizations(name)').order('created_at', { ascending: false }),
    supabase.from('members').select('organization_id, organizations(name, source)').eq('user_id', user.userId),
  ])
  const items: any[] = documents ?? []
  const accounts = (memberships ?? []).filter((item: any) => item.organizations?.source !== 'internal').map((item: any) => ({ id: item.organization_id, name: item.organizations?.name ?? 'Account' }))
  return <div className="min-h-screen"><PageHeader eyebrow="Knowledge" title="Document intelligence vault" description="Tenant-isolated files, locally indexed for grounded answers without paid AI tokens."><DocumentUploader accounts={accounts} /></PageHeader><main className="mx-auto max-w-[1500px] p-5 sm:p-8 lg:p-10">
    <div className="grid gap-4 sm:grid-cols-3"><Metric label="Files" value={items.length} icon={FileStack} /><Metric label="Ready for retrieval" value={items.filter((item) => item.ingest_status === 'ready').length} icon={FileCheck2} /><Metric label="Indexed passages" value={items.reduce((sum, item) => sum + Number(item.chunk_count ?? 0), 0)} icon={Sparkles} /></div>
    <div className="mt-6 rounded-2xl border border-orange-100 bg-white p-3 shadow-sm"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-orange-900/30" /><Input className="border-0 bg-orange-50/60 pl-10 shadow-none" placeholder="Search the tenant knowledge vault" /></div></div>
    <section className="mt-5 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">{items.length ? <div className="divide-y divide-orange-50">{items.map((document) => <article key={document.id} className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_180px_130px_120px] md:items-center"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-[var(--agency-accent)]"><FileStack className="h-4 w-4" /></span><div><h2 className="text-sm font-semibold text-orange-950">{document.title}</h2><p className="mt-1 text-xs text-orange-950/50">{document.organizations?.name} · {document.mime_type || 'File'}</p></div></div><Badge variant="secondary" className="w-fit capitalize">{document.document_type}</Badge><Badge className={document.ingest_status === 'ready' ? 'w-fit border-0 bg-orange-600 text-white' : 'w-fit border-0 bg-orange-50 text-orange-900'}>{document.ingest_status}</Badge><p className="text-xs text-orange-950/45">{document.chunk_count ?? 0} passages</p></article>)}</div> : <div className="p-16 text-center"><FileStack className="mx-auto h-8 w-8 text-orange-200" /><h2 className="mt-4 font-semibold">The vault is empty</h2><p className="mt-2 text-sm text-orange-950/50">Upload a PDF, Word document, text or Markdown file.</p></div>}</section>
  </main></div>
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof FileStack }) { return <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-orange-950/50">{label}</p><Icon className="h-4 w-4 text-[var(--agency-accent)]" /></div><p className="mt-2 text-3xl font-semibold text-orange-950">{value}</p></div> }
