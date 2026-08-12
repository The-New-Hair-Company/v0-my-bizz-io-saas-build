import Link from 'next/link'
import { ArrowRight, BrainCircuit, Database, FileText, MessageSquare, ShieldCheck, Users2, Zap } from 'lucide-react'
import { requirePortalUser } from '@/lib/portal/auth'
import { getActiveOrganization } from '@/lib/portal/context'
import { createClient } from '@/lib/supabase/server'
import { getEntitlementSummary } from '@/lib/ai/entitlements'
import { PageHeader } from '@/components/portal/PageHeader'
import { Button } from '@/components/ui/button'

export default async function AIUsagePage() {
  const user = await requirePortalUser()
  const membership = await getActiveOrganization(user.userId)
  const supabase = await createClient()
  const orgId = membership?.organization_id
  if (!orgId) return <div className="min-h-screen"><PageHeader eyebrow="Intelligence controls" title="No active workspace" description="Choose an assigned account to inspect its controls." /></div>

  const [threads, messages, documents, chunks, runs, members, entitlement] = await Promise.all([
    supabase.from('ai_threads').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('ai_messages').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('document_chunks').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('ai_runs').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('members').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    getEntitlementSummary(orgId),
  ])

  return <div className="min-h-screen"><PageHeader eyebrow="Intelligence controls" title="Usage, evidence and access" description="Commercial limits and retrieval coverage for the active tenant." badge={`${entitlement.displayName} · £0 model spend`}><Button asChild className="bg-[#ff6600] text-white hover:bg-[#e95d00]"><Link href="/pricing?source=usage">Compare plans <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></PageHeader><main className="mx-auto max-w-[1500px] space-y-6 p-5 sm:p-8 lg:p-10">
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Intelligence runs" value={`${entitlement.intelligenceRuns.used} / ${formatLimit(entitlement.intelligenceRuns.limit)}`} icon={BrainCircuit} detail="Monthly decision briefs" /><Metric label="Grounded questions" value={`${entitlement.groundedChat.used} / ${formatLimit(entitlement.groundedChat.limit)}`} icon={MessageSquare} detail={`${messages.count ?? 0} messages retained`} /><Metric label="Knowledge files" value={`${documents.count ?? 0} / ${formatLimit(entitlement.maxDocuments)}`} icon={FileText} detail={`${chunks.count ?? 0} indexed passages`} /><Metric label="Member seats" value={`${members.count ?? 0} / ${formatLimit(entitlement.maxSeats)}`} icon={Users2} detail="Database-authorised members" /></section>
    <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]"><div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ff6600]">Current commercial policy</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">{entitlement.displayName}</h2><p className="mt-2 text-sm text-orange-950/50">Limits are checked by an atomic Postgres function before a run or grounded question is created.</p></div><Database className="h-6 w-6 text-[#ff6600]" /></div><div className="mt-7 space-y-5"><UsageBar label="Intelligence HQ" used={entitlement.intelligenceRuns.used} limit={entitlement.intelligenceRuns.limit} /><UsageBar label="Grounded assistant" used={entitlement.groundedChat.used} limit={entitlement.groundedChat.limit} /><UsageBar label="Knowledge files" used={documents.count ?? 0} limit={entitlement.maxDocuments} /><UsageBar label="Member seats" used={members.count ?? 0} limit={entitlement.maxSeats} /></div><div className="mt-7 flex flex-col justify-between gap-4 rounded-2xl bg-orange-50 p-5 sm:flex-row sm:items-center"><div><h3 className="text-sm font-semibold">Need more operating capacity?</h3><p className="mt-1 text-xs text-orange-950/50">Studio starts at £49/month with 100 intelligence runs and five seats.</p></div><Button asChild className="shrink-0 bg-orange-950 text-white hover:bg-orange-900"><Link href="/pricing?source=usage-card">View plans</Link></Button></div></div>
      <div className="rounded-3xl bg-orange-950 p-7 text-white"><ShieldCheck className="h-7 w-7 text-orange-400" /><p className="mt-8 text-[10px] font-bold uppercase tracking-[.18em] text-white/40">Inference & isolation</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">Evidence first.<br />Tenant by tenant.</h2><div className="mt-8 space-y-4 text-sm text-white/65"><Control icon={ShieldCheck} text="Clerk identity + Supabase Row Level Security" /><Control icon={Database} text="Atomic database quota enforcement" /><Control icon={FileText} text="Tenant-scoped source retrieval" /><Control icon={Zap} text="Zero external model calls or paid tokens" /><Control icon={BrainCircuit} text={`${runs.count ?? 0} stored intelligence runs with audit trails`} /></div><div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/40">History retention</p><p className="mt-2 text-2xl font-semibold">{entitlement.historyDays >= 3650 ? 'Full' : `${entitlement.historyDays} days`}</p><p className="mt-1 text-[11px] text-white/40">Plan-governed intelligence history</p></div></div></section>
  </main></div>
}

function formatLimit(value: number) { return value > 100000 ? '∞' : value.toLocaleString('en-GB') }
function Metric({ label, value, icon: Icon, detail }: { label: string; value: string; icon: typeof Zap; detail: string }) { return <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-orange-950/50">{label}</p><Icon className="h-4 w-4 text-[var(--agency-accent)]" /></div><p className="mt-2 text-2xl font-semibold text-orange-950">{value}</p><p className="mt-2 text-[10px] text-orange-950/40">{detail}</p></div> }
function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) { const unlimited = limit > 100000; const percentage = unlimited ? Math.min(8, used) : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100)); return <div><div className="flex justify-between text-xs"><span className="font-medium">{label}</span><span className="text-orange-950/40">{used.toLocaleString('en-GB')} / {formatLimit(limit)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-100"><div className="h-full rounded-full bg-[#ff6600]" style={{ width: `${percentage}%` }} /></div></div> }
function Control({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) { return <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10"><Icon className="h-3.5 w-3.5 text-orange-300" /></span><span>{text}</span></div> }
