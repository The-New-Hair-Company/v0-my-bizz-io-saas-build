import { CheckCircle2, Circle, Clock3, ListChecks } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/portal/auth'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/portal/PageHeader'
import { RecordDialog } from '@/components/portal/RecordDialog'
import { StatusSelect } from '@/components/portal/StatusSelect'

export default async function TasksPage() {
  const user = await requirePortalUser()
  const supabase = await createClient()
  const [{ data: tasks }, { data: memberships }] = await Promise.all([
    supabase.from('tasks').select('*, organizations(name)').order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('members').select('organization_id, organizations(name, source)').eq('user_id', user.userId),
  ])
  const items: any[] = tasks ?? []
  const accounts = (memberships ?? []).filter((item: any) => item.organizations?.source !== 'internal')
  return <div className="min-h-screen"><PageHeader eyebrow="Execution" title="Action centre" description="Accountable work across every assigned client account."><RecordDialog resource="task" title="Create action" description="Assign a priority and deadline inside a client workspace." triggerLabel="New task" fixedData={{ status: 'todo' }} fields={[{ name: 'organization_id', label: 'Client account', type: 'select', required: true, options: accounts.map((item: any) => ({ value: item.organization_id, label: item.organizations?.name ?? 'Account' })) }, { name: 'title', label: 'Action', required: true }, { name: 'priority', label: 'Priority', type: 'select', defaultValue: 'medium', options: ['low','medium','high','urgent'].map((value) => ({ value, label: value })) }, { name: 'due_date', label: 'Due date', type: 'date' }, { name: 'description', label: 'Context', type: 'textarea' }]} /></PageHeader><main className="mx-auto max-w-[1500px] p-5 sm:p-8 lg:p-10">
    <div className="grid gap-4 sm:grid-cols-3"><Metric label="To do" value={items.filter((i) => i.status === 'todo').length} icon={Circle} /><Metric label="In progress" value={items.filter((i) => i.status === 'in_progress').length} icon={Clock3} /><Metric label="Done" value={items.filter((i) => i.status === 'done').length} icon={CheckCircle2} /></div>
    <section className="mt-6 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">{items.length ? <div className="divide-y divide-orange-50">{items.map((task) => <article key={task.id} className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_180px_140px_140px] md:items-center"><div><div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-orange-950">{task.title}</h2><Badge variant="secondary" className="capitalize">{task.priority}</Badge></div><p className="mt-1 text-xs text-orange-950/50">{task.organizations?.name}{task.description ? ` · ${task.description}` : ''}</p></div><p className="text-xs text-orange-950/55">{task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB') : 'No deadline'}</p><StatusSelect resource="task" id={task.id} value={task.status} options={[{ value: 'todo', label: 'To do' }, { value: 'in_progress', label: 'In progress' }, { value: 'done', label: 'Done' }, { value: 'cancelled', label: 'Cancelled' }]} /><span className="text-right text-[10px] uppercase tracking-[.16em] text-orange-900/35">Tenant scoped</span></article>)}</div> : <div className="p-16 text-center"><ListChecks className="mx-auto h-8 w-8 text-orange-200" /><h2 className="mt-4 font-semibold">No actions yet</h2><p className="mt-2 text-sm text-orange-950/50">Create the first accountable next step.</p></div>}</section>
  </main></div>
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Circle }) { return <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-orange-950/50">{label}</p><Icon className="h-4 w-4 text-[var(--agency-accent)]" /></div><p className="mt-2 text-3xl font-semibold text-orange-950">{value}</p></div> }
