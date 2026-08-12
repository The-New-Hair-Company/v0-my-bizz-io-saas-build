import { AlertTriangle, CalendarClock, CheckCircle2, Clock3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/portal/auth'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/portal/PageHeader'
import { RecordDialog } from '@/components/portal/RecordDialog'
import { StatusSelect } from '@/components/portal/StatusSelect'

export default async function DeadlinesPage() {
  const user = await requirePortalUser()
  const supabase = await createClient()
  const [{ data: filings }, { data: memberships }] = await Promise.all([
    supabase.from('filings').select('*, organizations(name)').order('due_date'),
    supabase.from('members').select('organization_id, organizations(name, source)').eq('user_id', user.userId),
  ])
  const items: any[] = filings ?? []
  const accounts = (memberships ?? []).filter((item: any) => item.organizations?.source !== 'internal')
  const today = new Date().toISOString().slice(0, 10)
  const overdue = items.filter((item) => item.status !== 'filed' && item.due_date < today)
  return <div className="min-h-screen"><PageHeader eyebrow="Compliance" title="Deadline radar" description="Every filing and immovable date, ranked by urgency."><RecordDialog resource="deadline" title="Add deadline" description="Create a tracked filing obligation for an assigned account." triggerLabel="New deadline" fixedData={{ status: 'upcoming' }} fields={[{ name: 'organization_id', label: 'Client account', type: 'select', required: true, options: accounts.map((item: any) => ({ value: item.organization_id, label: item.organizations?.name ?? 'Account' })) }, { name: 'title', label: 'Deadline title', required: true }, { name: 'filing_type', label: 'Filing type', required: true }, { name: 'jurisdiction', label: 'Jurisdiction', required: true }, { name: 'due_date', label: 'Due date', type: 'date', required: true }, { name: 'description', label: 'Notes', type: 'textarea' }]} /></PageHeader><main className="mx-auto max-w-[1500px] p-5 sm:p-8 lg:p-10">
    <div className="grid gap-4 sm:grid-cols-3"><Metric label="Overdue" value={overdue.length} icon={AlertTriangle} /><Metric label="Open" value={items.filter((i) => !['filed'].includes(i.status)).length} icon={Clock3} /><Metric label="Filed" value={items.filter((i) => i.status === 'filed').length} icon={CheckCircle2} /></div>
    <section className="mt-6 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">{items.length ? <div className="divide-y divide-orange-50">{items.map((item) => { const late = item.status !== 'filed' && item.due_date < today; return <article key={item.id} className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_180px_150px_140px] md:items-center"><div><div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-orange-950">{item.title}</h2>{late && <Badge className="bg-orange-600 text-white">Overdue</Badge>}</div><p className="mt-1 text-xs text-orange-950/50">{item.organizations?.name} · {item.jurisdiction} · {item.filing_type}</p></div><p className="text-sm font-semibold text-orange-950">{new Date(item.due_date).toLocaleDateString('en-GB')}</p><StatusSelect resource="deadline" id={item.id} value={item.status} options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'in_progress', label: 'In progress' }, { value: 'filed', label: 'Filed' }, { value: 'overdue', label: 'Overdue' }]} /><span className="text-right text-[10px] uppercase tracking-[.16em] text-orange-900/35">RLS protected</span></article> })}</div> : <div className="p-16 text-center"><CalendarClock className="mx-auto h-8 w-8 text-orange-200" /><h2 className="mt-4 font-semibold">Nothing on the radar</h2><p className="mt-2 text-sm text-orange-950/50">Add the first compliance or delivery deadline.</p></div>}</section>
  </main></div>
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Clock3 }) { return <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-orange-950/50">{label}</p><Icon className="h-4 w-4 text-[var(--agency-accent)]" /></div><p className="mt-2 text-3xl font-semibold text-orange-950">{value}</p></div> }
