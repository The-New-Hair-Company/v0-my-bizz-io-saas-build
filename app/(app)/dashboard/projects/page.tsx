import { CalendarClock, FolderKanban } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/portal/auth'
import { Badge } from '@/components/ui/badge'

const stages = ['discovery', 'strategy', 'design', 'development', 'qa', 'launch']

export default async function ProjectsPage() {
  await requirePortalUser()
  const supabase = await createClient()
  const { data } = await supabase.from('client_projects').select('*, organizations(name)').order('updated_at', { ascending: false })
  const projects: any[] = data ?? []
  return <div className="min-h-screen p-5 sm:p-8 lg:p-10"><div className="mx-auto max-w-[1600px]"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Delivery</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Project control room</h1><p className="mt-2 text-sm text-slate-500">A live view from strategy through launch.</p>
    <div className="mt-8 overflow-x-auto pb-4"><div className="grid min-w-[1200px] grid-cols-6 gap-4">{stages.map((stage) => { const stageProjects = projects.filter((project) => project.status === stage); return <section key={stage}><div className="mb-3 flex items-center justify-between px-1"><h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{stage}</h2><Badge variant="secondary">{stageProjects.length}</Badge></div><div className="space-y-3">{stageProjects.map((project) => <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100"><FolderKanban className="h-4 w-4 text-slate-500" /></span><span className="text-xs font-semibold">{project.progress}%</span></div><h3 className="mt-4 text-sm font-semibold">{project.name}</h3><p className="mt-1 text-xs text-slate-500">{project.organizations?.name}</p><div className="mt-4 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${project.progress}%` }} /></div>{project.target_launch && <p className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-400"><CalendarClock className="h-3 w-3" /> {new Date(project.target_launch).toLocaleDateString('en-GB')}</p>}</article>)}{!stageProjects.length && <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400">No projects</div>}</div></section> })}</div></div>
  </div></div>
}
