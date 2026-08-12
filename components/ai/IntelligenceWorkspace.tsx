'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Activity, ArrowRight, BrainCircuit, CheckCircle2, ChevronRight, CircleGauge, Database, FileSearch, Gauge, Loader2, LockKeyhole, Network, Radar, ShieldCheck, Sparkles, Target, TriangleAlert, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { IntelligenceReport, IntelligenceWorkflowKey } from '@/lib/ai/intelligence'

type Workflow = {
  workflow_key: IntelligenceWorkflowKey
  name: string
  short_name: string
  category: string
  description: string
  prompt_hint: string
  cadence: string
}

type Usage = {
  planKey: string
  displayName: string
  intelligenceRuns: { used: number; limit: number }
  groundedChat: { used: number; limit: number }
  maxDocuments: number
  maxSeats: number
  historyDays: number
}

type StoredRun = { id: string; workflow_key: IntelligenceWorkflowKey; headline: string | null; confidence: number | null; created_at: string; output: IntelligenceReport }

const workflowIcons = {
  'weekly-priorities': Target,
  'delivery-risk': Radar,
  'growth-brief': Activity,
  'readiness-review': ShieldCheck,
}

export function IntelligenceWorkspace({ organizationId, organizationName, workflows, usage, recentRuns }: { organizationId: string; organizationName: string; workflows: Workflow[]; usage: Usage; recentRuns: StoredRun[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<IntelligenceWorkflowKey>(workflows[0]?.workflow_key ?? 'weekly-priorities')
  const [report, setReport] = useState<IntelligenceReport | null>(recentRuns[0]?.output ?? null)
  const [activeRunId, setActiveRunId] = useState<string | null>(recentRuns[0]?.id ?? null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [remaining, setRemaining] = useState(Math.max(usage.intelligenceRuns.limit - usage.intelligenceRuns.used, 0))
  const currentWorkflow = workflows.find((workflow) => workflow.workflow_key === selected)
  const usedPercent = Math.min(100, Math.round((usage.intelligenceRuns.used / Math.max(usage.intelligenceRuns.limit, 1)) * 100))
  const allowanceLabel = usage.intelligenceRuns.limit > 100000 ? 'Unlimited' : `${remaining} left`
  const scoreDegrees = useMemo(() => (report?.score ?? 0) * 3.6, [report?.score])

  async function runIntelligence() {
    setRunning(true)
    setError(null)
    setUpgradeRequired(false)
    try {
      const response = await fetch('/api/ai/intelligence', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ organizationId, workflowKey: selected, question: currentWorkflow?.prompt_hint }),
      })
      const payload = await response.json()
      if (!response.ok) {
        setUpgradeRequired(response.status === 402 || payload.code === 'PLAN_LIMIT_REACHED')
        throw new Error(payload.error ?? 'The intelligence run could not be completed.')
      }
      setReport(payload.run.report)
      setActiveRunId(payload.run.id)
      setRemaining(payload.usage.remaining)
      router.refresh()
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'The intelligence run could not be completed.')
    } finally {
      setRunning(false)
    }
  }

  return <div className="min-h-screen bg-[#fff8f2] text-orange-950">
    <header className="border-b border-orange-100 bg-white px-5 py-5 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1650px] flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em] text-orange-950/40"><span>Agency OS</span><ChevronRight className="h-3 w-3" /><span className="text-[var(--agency-accent)]">Intelligence HQ</span></div>
          <div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold tracking-[-.04em] sm:text-3xl">Operating intelligence for {organizationName}</h1><Badge className="border-0 bg-orange-100 text-orange-800 hover:bg-orange-100"><span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff6600]" />Live evidence</Badge></div>
          <p className="mt-1.5 max-w-3xl text-sm text-orange-950/50">A zero-token decision engine that retrieves tenant data, scores operating signals and builds an auditable action brief.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden min-w-48 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-2.5 sm:block"><div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.15em] text-orange-950/45"><span>{usage.displayName} plan</span><span>{allowanceLabel}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#ff6600]" style={{ width: `${usage.intelligenceRuns.limit > 100000 ? 8 : usedPercent}%` }} /></div></div>
          <Button onClick={runIntelligence} disabled={running} className="h-12 bg-[#ff6600] px-5 text-white shadow-lg shadow-orange-600/20 hover:bg-[#e95d00]">{running ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysing evidence</> : <><Sparkles className="mr-2 h-4 w-4" /> Run intelligence</>}</Button>
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-[1650px] space-y-6 p-5 sm:p-8 lg:p-10">
      <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {workflows.map((workflow) => { const Icon = workflowIcons[workflow.workflow_key]; const isActive = selected === workflow.workflow_key; return <button key={workflow.workflow_key} onClick={() => setSelected(workflow.workflow_key)} className={`group rounded-2xl border p-5 text-left transition ${isActive ? 'border-[#ff6600] bg-[#ff6600] text-white shadow-xl shadow-orange-600/15' : 'border-orange-100 bg-white hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md'}`}><div className="flex items-start justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl ${isActive ? 'bg-white text-[#ff6600]' : 'bg-orange-50 text-[#ff6600]'}`}><Icon className="h-4 w-4" /></span><span className={`text-[9px] font-bold uppercase tracking-[.18em] ${isActive ? 'text-white/60' : 'text-orange-950/35'}`}>{workflow.cadence}</span></div><h2 className="mt-5 text-sm font-semibold">{workflow.name}</h2><p className={`mt-2 text-xs leading-5 ${isActive ? 'text-white/70' : 'text-orange-950/45'}`}>{workflow.description}</p></button> })}
      </section>

      {(error || upgradeRequired) && <section className="flex flex-col justify-between gap-4 rounded-2xl border border-orange-300 bg-orange-50 p-5 sm:flex-row sm:items-center"><div className="flex gap-3"><TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" /><div><h2 className="text-sm font-semibold">{upgradeRequired ? 'Your Explorer allowance is complete' : 'Intelligence run paused'}</h2><p className="mt-1 text-xs text-orange-950/55">{error}</p></div></div>{upgradeRequired && <Button asChild className="bg-[#ff6600] text-white hover:bg-[#e95d00]"><Link href="/pricing?source=intelligence-limit">Compare plans <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}</section>}

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.55fr)_420px]">
        <div className="min-w-0 overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-orange-100 px-6 py-5 sm:flex-row sm:items-center lg:px-8"><div><div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-[#ff6600]" /><h2 className="text-sm font-semibold">Decision brief</h2>{activeRunId && <span className="font-mono text-[9px] uppercase text-orange-950/30">Run {activeRunId.slice(0, 8)}</span>}</div><p className="mt-1 text-xs text-orange-950/45">{currentWorkflow?.prompt_hint}</p></div><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-orange-950/40"><LockKeyhole className="h-3.5 w-3.5 text-[#ff6600]" />RLS isolated<span className="h-3 w-px bg-orange-200" />0 paid tokens</div></div>
          {running ? <EngineRunning /> : report ? <Report report={report} scoreDegrees={scoreDegrees} /> : <EmptyReport onRun={runIntelligence} />}
        </div>

        <aside className="space-y-6">
          <EngineStatus report={report} running={running} />
          <div className="overflow-hidden rounded-3xl bg-orange-950 text-white shadow-xl shadow-orange-950/10"><div className="border-b border-white/10 p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Evidence graph</p><h2 className="mt-2 text-lg font-semibold">Tenant signal coverage</h2></div><Network className="h-5 w-5 text-orange-400" /></div></div><div className="p-6">{report ? <div className="space-y-4">{report.coverage.map((item) => <div key={item.label} className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${item.status === 'live' ? 'bg-[#ff6600] shadow-[0_0_12px_rgba(255,102,0,.8)]' : 'border border-white/30'}`} /><span className="flex-1 text-xs text-white/65">{item.label}</span><span className="font-mono text-xs text-white">{item.count}</span></div>)}</div> : <p className="text-sm leading-6 text-white/55">Run a workflow to map live projects, actions, deadlines, files and activity.</p>}<div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-white/45"><Database className="h-3.5 w-3.5" />Inference mode</div><p className="mt-2 text-sm font-medium">Deterministic RAG</p><p className="mt-1 text-[11px] leading-5 text-white/45">Postgres retrieval + rules engine + auditable citations. No external model call.</p></div></div></div>
          <div className="rounded-3xl border border-orange-100 bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-950/35">Recent analyses</p><h2 className="mt-2 text-sm font-semibold">Run history</h2></div><Link href="/dashboard/ai/usage" className="text-xs font-semibold text-[#ff6600]">Controls</Link></div><div className="mt-4 space-y-2">{recentRuns.length ? recentRuns.slice(0, 4).map((run) => <button key={run.id} onClick={() => { setReport(run.output); setActiveRunId(run.id); setSelected(run.workflow_key) }} className="flex w-full items-center gap-3 rounded-xl border border-orange-50 px-3 py-3 text-left hover:bg-orange-50"><span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-100"><FileSearch className="h-3.5 w-3.5 text-orange-700" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{run.headline ?? 'Intelligence run'}</span><span className="mt-0.5 block text-[9px] text-orange-950/35">{new Date(run.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></span><span className="font-mono text-[10px] text-orange-700">{run.confidence ?? 0}%</span></button>) : <p className="rounded-xl border border-dashed border-orange-200 p-5 text-center text-xs text-orange-950/40">Your evidence-backed run history will appear here.</p>}</div></div>
        </aside>
      </section>
    </main>
  </div>
}

function Report({ report, scoreDegrees }: { report: IntelligenceReport; scoreDegrees: number }) {
  return <div className="p-6 lg:p-8">
    <div className="grid gap-8 xl:grid-cols-[220px_1fr] xl:items-center"><div className="flex justify-center"><div className="relative grid h-44 w-44 place-items-center rounded-full" style={{ background: `conic-gradient(#ff6600 ${scoreDegrees}deg, #ffedd5 ${scoreDegrees}deg)` }}><div className="grid h-36 w-36 place-items-center rounded-full bg-white text-center"><div><p className="text-5xl font-semibold tracking-[-.06em]">{report.score}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[.18em] text-orange-950/35">{report.scoreLabel}</p></div></div></div></div><div><div className="flex items-center gap-2"><Badge className="border-0 bg-orange-100 text-orange-800 hover:bg-orange-100">{report.confidence}% confidence</Badge><Badge variant="outline" className="border-orange-200 text-orange-700">{report.sources.length} sources</Badge></div><h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-.045em] sm:text-4xl">{report.headline}</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-orange-950/55">{report.narrative}</p></div></div>
    <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{report.scorecard.map((item) => <div key={item.label} className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-orange-950/40">{item.label}</p><Gauge className="h-3.5 w-3.5 text-[#ff6600]" /></div><p className="mt-3 text-2xl font-semibold">{item.value}<span className="text-xs text-orange-950/30">/100</span></p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#ff6600]" style={{ width: `${item.value}%` }} /></div><p className="mt-2 text-[10px] text-orange-950/35">{item.detail}</p></div>)}</div>
    <div className="mt-8 grid gap-8 xl:grid-cols-2"><section><div className="flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-[.16em] text-orange-950/45">Ranked signals</h3><span className="text-[9px] text-orange-950/30">Explainable by source</span></div><div className="mt-3 space-y-3">{report.signals.slice(0, 4).map((signal) => <article key={signal.title} className="rounded-2xl border border-orange-100 p-4"><div className="flex items-start gap-3"><span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${signal.type === 'risk' ? 'bg-orange-100 text-orange-700' : signal.type === 'opportunity' ? 'bg-[#ff6600] text-white' : 'bg-orange-950 text-white'}`}>{signal.type === 'risk' ? <TriangleAlert className="h-3.5 w-3.5" /> : signal.type === 'opportunity' ? <Zap className="h-3.5 w-3.5" /> : <CircleGauge className="h-3.5 w-3.5" />}</span><div><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-semibold">{signal.title}</h4><span className="text-[9px] font-bold uppercase tracking-[.12em] text-orange-600">{signal.severity}</span></div><p className="mt-1.5 text-xs leading-5 text-orange-950/50">{signal.detail}</p></div></div></article>)}</div></section><section><div className="flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-[.16em] text-orange-950/45">Recommended moves</h3><span className="text-[9px] text-orange-950/30">Impact ordered</span></div><div className="mt-3 overflow-hidden rounded-2xl border border-orange-100">{report.priorities.map((priority, index) => <article key={priority.title} className="grid grid-cols-[28px_1fr] gap-3 border-b border-orange-50 p-4 last:border-0"><span className="grid h-7 w-7 place-items-center rounded-full bg-orange-950 text-[10px] font-bold text-white">{index + 1}</span><div><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold">{priority.title}</h4><Badge variant="secondary" className="bg-orange-50 text-[9px] text-orange-700">{priority.impact}</Badge></div><p className="mt-1.5 text-xs leading-5 text-orange-950/50">{priority.rationale}</p><p className="mt-2 text-[9px] font-semibold uppercase tracking-[.12em] text-orange-950/35">{priority.owner} · {priority.horizon}</p></div></article>)}</div></section></div>
    <section className="mt-8 rounded-2xl bg-orange-950 p-5 text-white"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-white/40">Evidence trail</p><h3 className="mt-1 text-sm font-semibold">Sources that changed the answer</h3></div><FileSearch className="h-5 w-5 text-orange-400" /></div><div className="mt-4 grid gap-2 lg:grid-cols-2">{report.sources.slice(0, 6).map((source) => <div key={`${source.source_kind}-${source.source_id}`} className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="flex items-center justify-between gap-3"><span className="truncate text-xs font-medium">{source.title}</span><span className="font-mono text-[9px] text-orange-300">{Math.round(source.relevance * 100)}%</span></div><p className="mt-1 truncate text-[10px] text-white/40">{source.source_kind} · {source.excerpt}</p></div>)}</div></section>
  </div>
}

function EngineStatus({ report, running }: { report: IntelligenceReport | null; running: boolean }) { const items = ['Authorise tenant boundary', 'Retrieve operational records', 'Rank signals and exceptions', 'Compose decision brief']; return <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-950/35">Signal engine</p><h2 className="mt-2 text-lg font-semibold">{running ? 'Analysis in progress' : report ? 'Last run completed' : 'Ready to analyse'}</h2></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${running ? 'bg-[#ff6600] text-white' : 'bg-orange-50 text-[#ff6600]'}`}><BrainCircuit className={`h-5 w-5 ${running ? 'animate-pulse' : ''}`} /></span></div><div className="mt-6 space-y-1">{items.map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl px-3 py-2.5"><span className={`grid h-6 w-6 place-items-center rounded-full ${running && index === 2 ? 'bg-[#ff6600] text-white' : report ? 'bg-orange-100 text-orange-700' : 'border border-orange-200 text-orange-300'}`}>{running && index === 2 ? <Loader2 className="h-3 w-3 animate-spin" /> : report ? <CheckCircle2 className="h-3 w-3" /> : <span className="text-[9px]">{index + 1}</span>}</span><span className="text-xs text-orange-950/55">{item}</span></div>)}</div><div className="mt-5 flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3"><span className="text-[10px] font-semibold uppercase tracking-[.12em] text-orange-950/40">External model calls</span><span className="font-mono text-sm font-semibold text-orange-700">0</span></div></div> }
function EngineRunning() { return <div className="grid min-h-[720px] place-items-center p-8"><div className="max-w-md text-center"><div className="relative mx-auto h-36 w-36"><span className="absolute inset-0 animate-ping rounded-full border border-orange-300" /><span className="absolute inset-5 animate-pulse rounded-full bg-orange-100" /><span className="absolute inset-10 grid place-items-center rounded-full bg-[#ff6600] text-white shadow-xl shadow-orange-600/30"><BrainCircuit className="h-8 w-8" /></span></div><h2 className="mt-8 text-2xl font-semibold tracking-tight">Building the evidence graph</h2><p className="mt-3 text-sm leading-6 text-orange-950/50">Authorising this tenant, retrieving live operating records and converting exceptions into a ranked decision brief.</p></div></div> }
function EmptyReport({ onRun }: { onRun: () => void }) { return <div className="grid min-h-[720px] place-items-center p-8"><div className="max-w-lg text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-100 text-[#ff6600]"><BrainCircuit className="h-7 w-7" /></span><p className="mt-6 text-[10px] font-bold uppercase tracking-[.2em] text-[#ff6600]">Intelligence layer online</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">Turn operating data into the next best move.</h2><p className="mt-4 text-sm leading-7 text-orange-950/50">Choose a workflow and run a tenant-secured analysis. The output will show its sources, confidence and recommended actions.</p><Button onClick={onRun} className="mt-7 bg-[#ff6600] text-white hover:bg-[#e95d00]">Run first brief <ArrowRight className="ml-2 h-4 w-4" /></Button></div></div> }
