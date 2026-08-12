import Link from 'next/link'
import { ArrowUpRight, Inbox, Mail, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/portal/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function IntakesPage() {
  await requirePortalUser()
  const supabase = await createClient()
  const { data } = await supabase.from('intake_submissions').select('*, organizations(name, lifecycle_stage)').order('submitted_at', { ascending: false })
  const intakes: any[] = data ?? []
  return <div className="min-h-screen p-5 sm:p-8 lg:p-10"><div className="mx-auto max-w-[1400px]"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">New business</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Intake inbox</h1><p className="mt-2 text-sm text-slate-500">Structured briefs captured directly from the website.</p></div><Button asChild variant="outline"><Link href="/start" target="_blank">Preview wizard <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-3"><MiniStat label="New" value={intakes.filter((item) => item.status === 'new').length} /><MiniStat label="In review" value={intakes.filter((item) => item.status === 'in_review').length} /><MiniStat label="Total captured" value={intakes.length} /></div>
    <div className="mt-6 space-y-4">{intakes.length ? intakes.map((intake) => <Link key={intake.id} href={`/dashboard/accounts/${intake.organization_id}`} className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex flex-col gap-5 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{intake.company_name}</h2><Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">{intake.status}</Badge><span className="font-mono text-[10px] text-slate-400">{intake.reference_code}</span></div><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{intake.goals}</p><div className="mt-3 flex flex-wrap gap-2">{intake.project_types?.map((type: string) => <Badge key={type} variant="secondary">{type}</Badge>)}</div></div><div className="grid shrink-0 gap-2 text-xs text-slate-500 sm:grid-cols-2 lg:w-72 lg:grid-cols-1"><span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {intake.email}</span>{intake.phone && <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {intake.phone}</span>}<span>{intake.budget_range} · {intake.target_launch}</span></div></div></Link>) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center"><Inbox className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-4 font-semibold">Inbox clear</h2><p className="mt-2 text-sm text-slate-500">New submissions will land here with a linked client account.</p></div>}</div>
  </div></div>
}

function MiniStat({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div> }
