import Link from 'next/link'
import { ArrowUpRight, Building2, CalendarClock, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, FileStack, Gauge, Inbox, Layers3, MoreHorizontal, Plus, Sparkles, TrendingUp, Users2 } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePortalUser } from '@/lib/portal/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RecordDialog } from '@/components/portal/RecordDialog'

export default async function DashboardPage() {
  const user = await requirePortalUser()
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('get_dashboard_snapshot', {
    p_clerk_user_id: user.userId,
  })
  if (error) throw error
  const snapshot = (data ?? {}) as Record<string, any[]>

  const organizations = (snapshot.organizations ?? []).filter((organization: any) => organization.source !== 'internal')
  const intakes = snapshot.intakes ?? []
  const projects = snapshot.projects ?? []
  const tasks = snapshot.tasks ?? []
  const activity = snapshot.activity ?? []
  const activeAccounts = organizations.filter((organization: any) => ['active', 'onboarding'].includes(organization.lifecycle_stage)).length
  const pipelineValue = organizations.reduce((sum: number, organization: any) => sum + Number(organization.estimated_value ?? 0), 0)
  const openTasks = tasks.filter((task: any) => !['done', 'cancelled'].includes(task.status)).length
  const attentionAccounts = organizations.filter((organization: any) => organization.account_status === 'at_risk' || organization.health_score < 60).length
  const pipelineStages = ['lead', 'discovery', 'proposal', 'onboarding', 'active']
  const stageCounts = pipelineStages.map((stage) => ({ stage, count: organizations.filter((organization: any) => organization.lifecycle_stage === stage).length }))
  const maxStage = Math.max(1, ...stageCounts.map((item) => item.count))

  return (
    <div className="min-h-screen text-orange-950">
      <header className="border-b border-orange-100 bg-white px-5 py-5 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><div className="flex items-center gap-2 text-xs font-medium text-orange-950/50"><span>Agency OS</span><ChevronRight className="h-3 w-3" /><span className="text-orange-950">Command centre</span></div><h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Good {dayPeriod()}, {user.name.split(' ')[0]}.</h1><p className="mt-1 text-sm text-orange-950/50">Here’s the signal across your client portfolio.</p></div>
          <div className="flex items-center gap-2"><Button variant="outline" asChild><Link href="/start" target="_blank"><ArrowUpRight className="mr-2 h-4 w-4" /> Open intake</Link></Button><RecordDialog resource="account" title="Create client account" description="Open a tenant and assign yourself as owner." triggerLabel="New account" fixedData={{ lifecycle_stage: 'lead' }} fields={[{ name: 'name', label: 'Company name', required: true }, { name: 'primary_contact_name', label: 'Contact name' }, { name: 'primary_contact_email', label: 'Contact email', type: 'email' }, { name: 'industry', label: 'Industry' }]} /></div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-7 p-5 sm:p-8 lg:p-10">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Building2} label="Active accounts" value={String(activeAccounts)} detail={`${organizations.length} total portfolio`} tone="emerald" />
          <Metric icon={CircleDollarSign} label="Pipeline value" value={currency(pipelineValue)} detail="Weighted client opportunity" tone="cyan" />
          <Metric icon={CheckCircle2} label="Open actions" value={String(openTasks)} detail={`${tasks.filter((task: any) => task.priority === 'urgent').length} urgent`} tone="violet" />
          <Metric icon={Gauge} label="Needs attention" value={String(attentionAccounts)} detail={attentionAccounts ? 'Review client health' : 'Portfolio healthy'} tone="amber" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
          <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-orange-50 px-6 py-5"><div><h2 className="font-semibold">Account portfolio</h2><p className="mt-1 text-xs text-orange-950/50">Commercial status, delivery health and next action</p></div><Button variant="ghost" size="sm" asChild><Link href="/dashboard/accounts">View all <ChevronRight className="ml-1 h-4 w-4" /></Link></Button></div>
            {organizations.length ? <div className="divide-y divide-slate-100">{organizations.slice(0, 6).map((organization: any) => <AccountRow key={organization.id} organization={organization} />)}</div> : <EmptyPortfolio />}
          </div>

          <div className="rounded-2xl bg-[#ff6600] p-6 text-white shadow-xl shadow-slate-900/10">
            <div className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-orange-100">Pipeline velocity</p><h2 className="mt-2 text-xl font-semibold">From signal to launch</h2></div><TrendingUp className="h-5 w-5 text-orange-100" /></div>
            <div className="mt-8 space-y-5">{stageCounts.map((item, index) => <div key={item.stage}><div className="mb-2 flex items-center justify-between text-xs"><span className="capitalize text-orange-900/35">{item.stage}</span><span className="font-semibold">{item.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-orange-100 to-white" style={{ width: `${item.count ? Math.max(14, (item.count / maxStage) * 100) : 0}%`, opacity: 1 - index * 0.08 }} /></div></div>)}</div>
            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-6"><div className="rounded-xl bg-white/[0.05] p-4"><p className="text-2xl font-semibold">{intakes.filter((item: any) => item.status === 'new').length}</p><p className="mt-1 text-xs text-orange-950/50">New briefs</p></div><div className="rounded-xl bg-white/[0.05] p-4"><p className="text-2xl font-semibold">{projects.filter((item: any) => !['complete', 'on_hold'].includes(item.status)).length}</p><p className="mt-1 text-xs text-orange-950/50">Live projects</p></div></div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-orange-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-orange-50 px-6 py-5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-orange-700"><Inbox className="h-4 w-4" /></span><div><h2 className="font-semibold">Intake inbox</h2><p className="text-xs text-orange-950/50">New business signals</p></div></div><Badge variant="secondary">{intakes.length} recent</Badge></div>
            <div className="divide-y divide-orange-50">{intakes.length ? intakes.slice(0, 5).map((intake: any) => <div key={intake.id} className="flex items-center gap-4 px-6 py-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-sm font-semibold text-orange-900">{initials(intake.company_name)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{intake.company_name}</p><p className="truncate text-xs text-orange-950/50">{intake.project_types?.join(' · ') || intake.industry}</p></div><div className="text-right"><Badge className="bg-orange-50 text-orange-700 hover:bg-orange-50">{intake.status}</Badge><p className="mt-1 text-[10px] text-orange-900/35">{relativeTime(intake.submitted_at)}</p></div></div>) : <div className="p-10 text-center text-sm text-orange-950/50">New project briefs will appear here.</div>}</div>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-orange-50 px-6 py-5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-orange-700"><Clock3 className="h-4 w-4" /></span><div><h2 className="font-semibold">Activity stream</h2><p className="text-xs text-orange-950/50">Latest portfolio movement</p></div></div><MoreHorizontal className="h-5 w-5 text-orange-900/35" /></div>
            <div className="p-6">{activity.length ? <div className="space-y-5">{activity.map((item: any, index: number) => <div key={item.id} className="relative flex gap-4">{index < activity.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%+4px)] w-px bg-orange-200" />}<span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full border border-orange-100 bg-white"><span className="h-2 w-2 rounded-full bg-orange-300" /></span><div className="min-w-0 pb-1"><p className="text-sm font-medium">{item.title}</p><p className="mt-0.5 text-xs leading-5 text-orange-950/50">{item.organizations?.name}{item.description ? ` · ${item.description}` : ''}</p><p className="mt-1 text-[10px] uppercase tracking-wide text-orange-900/35">{relativeTime(item.created_at)}</p></div></div>)}</div> : <div className="py-8 text-center"><Sparkles className="mx-auto h-7 w-7 text-orange-200" /><p className="mt-3 text-sm text-orange-950/50">Portfolio activity will build as your team works.</p></div>}</div>
          </div>
        </section>
      </main>
    </div>
  )
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: typeof Building2; label: string; value: string; detail: string; tone: 'emerald' | 'cyan' | 'violet' | 'amber' }) {
  const tones = { emerald: 'bg-orange-50 text-orange-700', cyan: 'bg-orange-50 text-orange-700', violet: 'bg-orange-50 text-orange-700', amber: 'bg-orange-50 text-orange-800' }
  return <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-orange-950/50">{label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{value}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-4 w-4" /></span></div><p className="mt-4 flex items-center gap-1 text-[11px] text-orange-900/35"><ArrowUpRight className="h-3 w-3" /> {detail}</p></div>
}

function AccountRow({ organization }: { organization: any }) {
  const health = organization.health_score ?? 75
  return <Link href={`/dashboard/accounts/${organization.id}`} className="grid items-center gap-4 px-6 py-4 transition hover:bg-orange-50 sm:grid-cols-[1.5fr_0.8fr_0.8fr_auto]"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ff6600] text-xs font-semibold text-white">{initials(organization.name)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{organization.name}</p><p className="truncate text-xs text-orange-950/50">{organization.industry ?? organization.primary_contact_email ?? 'Client account'}</p></div></div><div><p className="text-[10px] uppercase tracking-wide text-orange-900/35">Stage</p><Badge variant="secondary" className="mt-1 capitalize">{organization.lifecycle_stage}</Badge></div><div><div className="flex items-center justify-between text-[10px]"><span className="text-orange-900/35">Health</span><span className="font-semibold">{health}%</span></div><div className="mt-2 h-1.5 w-24 rounded-full bg-orange-100"><div className={`h-full rounded-full ${health < 60 ? 'bg-orange-500' : 'bg-orange-300'}`} style={{ width: `${health}%` }} /></div></div><ChevronRight className="hidden h-4 w-4 text-orange-200 sm:block" /></Link>
}

function EmptyPortfolio() {
  return <div className="px-8 py-14 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-100 text-orange-950/50"><Layers3 className="h-6 w-6" /></span><h3 className="mt-4 font-semibold">Your portfolio is ready for its first signal</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-orange-950/50">Send the project intake link to a prospect. Their answers will create an assigned client account automatically.</p><Button asChild className="mt-5 bg-[#ff6600] text-white"><Link href="/start" target="_blank">Open intake wizard</Link></Button></div>
}

function initials(value: string) { return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() }
function currency(value: number) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value) }
function relativeTime(value: string) { const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000)); if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h ago`; return `${Math.floor(hours / 24)}d ago` }
function dayPeriod() { const hour = new Date().getHours(); return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening' }
