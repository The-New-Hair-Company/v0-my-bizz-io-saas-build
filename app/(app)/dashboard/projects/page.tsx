import { CalendarClock, FolderKanban } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/portal/auth'
import { Badge } from '@/components/ui/badge'
import { RecordDialog } from '@/components/portal/RecordDialog'
import { PageHeader } from '@/components/portal/PageHeader'

const stages = ['discovery', 'strategy', 'design', 'development', 'qa', 'launch']

export default async function ProjectsPage() {
  const user = await requirePortalUser()
  const supabase = await createClient()
  const [{ data }, { data: memberships }] = await Promise.all([
    supabase.from('client_projects').select('*, organizations(name)').order('updated_at', { ascending: false }),
    supabase.from('members').select('organization_id, organizations(name, source)').eq('user_id', user.userId),
  ])
  const projects: any[] = data ?? []
  const accounts = (memberships ?? []).filter((item: any) => item.organizations?.source !== 'internal')
  return <div className="min-h-screen"><PageHeader eyebrow="Delivery" title="Project control room" description="A live, tenant-safe view from strategy through launch."><RecordDialog resource="project" title="Create delivery project" description="Open a project inside an assigned client account." triggerLabel="New project" fixedData={{ status: 'discovery', progress: 0 }} fields={[{ name: 'organization_id', label: 'Client account', type: 'select', required: true, options: accounts.map((item: any) => ({ value: item.organization_id, label: item.organizations?.name ?? 'Account' })) }, { name: 'name', label: 'Project name', required: true }, { name: 'project_type', label: 'Project type', required: true, placeholder: 'Website, portal, brand…' }, { name: 'budget', label: 'Budget', type: 'number' }, { name: 'target_launch', label: 'Target launch', type: 'date' }]} /></PageHeader><div className="mx-auto max-w-[1600px] p-5 sm:p-8 lg:p-10">
    <div className="mt-8 overflow-x-auto pb-4"><div className="grid min-w-[1200px] grid-cols-6 gap-4">{stages.map((stage) => { const stageProjects = projects.filter((project) => project.status === stage); return <section key={stage}><div className="mb-3 flex items-center justify-between px-1"><h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-950/50">{stage}</h2><Badge variant="secondary">{stageProjects.length}</Badge></div><div className="space-y-3">{stageProjects.map((project) => <article key={project.id} className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-100"><FolderKanban className="h-4 w-4 text-orange-950/50" /></span><span className="text-xs font-semibold">{project.progress}%</span></div><h3 className="mt-4 text-sm font-semibold">{project.name}</h3><p className="mt-1 text-xs text-orange-950/50">{project.organizations?.name}</p><div className="mt-4 h-1.5 rounded-full bg-orange-100"><div className="h-full rounded-full bg-orange-300" style={{ width: `${project.progress}%` }} /></div>{project.target_launch && <p className="mt-4 flex items-center gap-1.5 text-[10px] text-orange-900/35"><CalendarClock className="h-3 w-3" /> {new Date(project.target_launch).toLocaleDateString('en-GB')}</p>}</article>)}{!stageProjects.length && <div className="rounded-2xl border border-dashed border-orange-200 p-6 text-center text-xs text-orange-900/35">No projects</div>}</div></section> })}</div></div>
  </div></div>
}
