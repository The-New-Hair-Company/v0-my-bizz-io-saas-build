import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarClock, ExternalLink, FileStack, Globe2, Mail, MapPin, Phone, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/portal/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RecordDialog } from '@/components/portal/RecordDialog'

export default async function AccountDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  await requirePortalUser()
  const { accountId } = await params
  const supabase = await createClient()
  const [accountResult, intakeResult, projectsResult, tasksResult, documentsResult, activityResult] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', accountId).single(),
    supabase.from('intake_submissions').select('*').eq('organization_id', accountId).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('client_projects').select('*').eq('organization_id', accountId).order('updated_at', { ascending: false }),
    supabase.from('tasks').select('*').eq('organization_id', accountId).order('created_at', { ascending: false }).limit(8),
    supabase.from('documents').select('id, title, document_type, created_at').eq('organization_id', accountId).order('created_at', { ascending: false }).limit(6),
    supabase.from('account_activity').select('*').eq('organization_id', accountId).order('created_at', { ascending: false }).limit(8),
  ])
  if (!accountResult.data) notFound()
  const account: any = accountResult.data
  const intake: any = intakeResult.data
  const projects: any[] = projectsResult.data ?? []
  const tasks: any[] = tasksResult.data ?? []
  const documents: any[] = documentsResult.data ?? []
  const activity: any[] = activityResult.data ?? []

  return <div className="min-h-screen"><div className="border-b border-orange-100 bg-white px-5 py-6 sm:px-8 lg:px-10"><div className="mx-auto max-w-[1500px]"><Link href="/dashboard/accounts" className="inline-flex items-center text-xs text-orange-950/50 hover:text-orange-950"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Client accounts</Link><div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-center"><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--agency-accent)] text-lg font-semibold text-white">{initials(account.name)}</span><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-semibold tracking-[-0.04em] text-orange-950">{account.name}</h1><Badge className="capitalize">{account.lifecycle_stage}</Badge></div><p className="mt-1 text-sm text-orange-950/50">{account.industry ?? 'Industry not supplied'} · {account.company_size ?? 'Team size pending'}</p></div></div><div className="flex gap-2">{account.primary_contact_email && <Button variant="outline" asChild><a href={`mailto:${account.primary_contact_email}`}><Mail className="mr-2 h-4 w-4" /> Contact</a></Button>}<RecordDialog resource="project" title="Create delivery project" description={`Open a project for ${account.name}.`} triggerLabel="Create project" fixedData={{ organization_id: account.id, status: 'discovery', progress: 0 }} fields={[{ name: 'name', label: 'Project name', required: true }, { name: 'project_type', label: 'Project type', required: true }, { name: 'budget', label: 'Budget', type: 'number' }, { name: 'target_launch', label: 'Target launch', type: 'date' }]} /></div></div></div></div>
    <main className="mx-auto max-w-[1500px] space-y-6 p-5 sm:p-8 lg:p-10">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Account health" value={`${account.health_score ?? 75}%`} detail={account.account_status} /><Stat label="Onboarding" value={`${account.onboarding_progress ?? 0}%`} detail="Workspace completion" /><Stat label="Live projects" value={String(projects.filter((item) => !['complete','on_hold'].includes(item.status)).length)} detail={`${projects.length} total`} /><Stat label="Open actions" value={String(tasks.filter((item) => !['done','cancelled'].includes(item.status)).length)} detail="Across this account" /></section>
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <Panel title="Project brief" subtitle={intake?.reference_code ?? 'No brief submitted'}>{intake ? <div className="space-y-6"><p className="text-base leading-7 text-orange-900">{intake.goals}</p><div className="grid gap-4 sm:grid-cols-2"><BriefItem label="Scope" value={intake.project_types?.join(', ')} /><BriefItem label="Investment" value={intake.budget_range} /><BriefItem label="Target launch" value={intake.target_launch} /><BriefItem label="Content" value={intake.content_readiness} /></div>{intake.pain_points && <BriefItem label="Current friction" value={intake.pain_points} />}</div> : <p className="text-sm text-orange-950/50">No intake brief is attached to this account.</p>}</Panel>
          <Panel title="Delivery roadmap" subtitle={`${projects.length} projects`}>{projects.length ? <div className="space-y-4">{projects.map((project) => <div key={project.id} className="rounded-xl border border-orange-50 bg-orange-50 p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">{project.name}</p><p className="mt-1 text-xs capitalize text-orange-950/50">{project.project_type} · {project.status}</p></div><span className="text-sm font-semibold">{project.progress}%</span></div><div className="mt-4 h-1.5 rounded-full bg-orange-200"><div className="h-full rounded-full bg-orange-300" style={{ width: `${project.progress}%` }} /></div></div>)}</div> : <div className="py-8 text-center"><Sparkles className="mx-auto h-6 w-6 text-orange-200" /><p className="mt-3 text-sm text-orange-950/50">Turn the approved brief into a delivery roadmap.</p></div>}</Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Client contact"><div className="space-y-4 text-sm"><Contact icon={Mail} value={account.primary_contact_email} /><Contact icon={Phone} value={account.primary_contact_phone} /><Contact icon={Globe2} value={account.website} link /><Contact icon={MapPin} value={[account.city, account.country].filter(Boolean).join(', ')} /></div></Panel>
          <Panel title="Recent activity">{activity.length ? <div className="space-y-4">{activity.map((item) => <div key={item.id} className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-300" /><div><p className="text-sm font-medium">{item.title}</p><p className="mt-0.5 text-xs leading-5 text-orange-950/50">{item.description}</p></div></div>)}</div> : <p className="text-sm text-orange-950/50">No recorded activity yet.</p>}</Panel>
          <Panel title="Workspace assets" subtitle={`${documents.length} recent`}><div className="space-y-3">{documents.map((document) => <div key={document.id} className="flex items-center gap-3 rounded-xl bg-orange-50 p-3"><FileStack className="h-4 w-4 text-orange-900/35" /><div className="min-w-0"><p className="truncate text-sm font-medium">{document.title}</p><p className="text-[10px] uppercase tracking-wide text-orange-900/35">{document.document_type}</p></div></div>)}{!documents.length && <p className="text-sm text-orange-950/50">No documents uploaded.</p>}</div></Panel>
        </div>
      </section>
    </main>
  </div>
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-orange-100 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-orange-50 px-6 py-5"><h2 className="font-semibold">{title}</h2>{subtitle && <span className="text-xs text-orange-900/35">{subtitle}</span>}</div><div className="p-6">{children}</div></section> }
function Stat({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"><p className="text-xs text-orange-950/50">{label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{value}</p><p className="mt-2 text-[11px] capitalize text-orange-900/35">{detail}</p></div> }
function BriefItem({ label, value }: { label: string; value?: string }) { return <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-900/35">{label}</p><p className="mt-1 text-sm leading-6 text-orange-900">{value || 'Not supplied'}</p></div> }
function Contact({ icon: Icon, value, link }: { icon: typeof Mail; value?: string; link?: boolean }) { if (!value) return null; const content = <><Icon className="h-4 w-4 text-orange-900/35" /><span className="truncate">{value}</span>{link && <ExternalLink className="ml-auto h-3 w-3 text-orange-200" />}</>; return link ? <a href={value} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-orange-700">{content}</a> : <div className="flex items-center gap-3">{content}</div> }
function initials(value: string) { return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() }
