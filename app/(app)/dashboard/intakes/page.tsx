import Link from 'next/link'
import { ArrowUpRight, Inbox, Mail, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/portal/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/portal/PageHeader'
import { StatusSelect } from '@/components/portal/StatusSelect'

export default async function IntakesPage() {
  await requirePortalUser()
  const supabase = await createClient()
  const { data } = await supabase.from('intake_submissions').select('*, organizations(name, lifecycle_stage)').order('submitted_at', { ascending: false })
  const intakes: any[] = data ?? []
  return <div className="min-h-screen"><PageHeader eyebrow="New business" title="Intake inbox" description="Structured briefs captured from the website and scoped to your assigned accounts."><Button asChild variant="outline"><Link href="/start" target="_blank">Preview wizard <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button></PageHeader><div className="mx-auto max-w-[1400px] p-5 sm:p-8 lg:p-10">
    <div className="grid gap-4 sm:grid-cols-3"><MiniStat label="New" value={intakes.filter((item) => item.status === 'new').length} /><MiniStat label="In review" value={intakes.filter((item) => item.status === 'in_review').length} /><MiniStat label="Total captured" value={intakes.length} /></div>
    <div className="mt-6 space-y-4">{intakes.length ? intakes.map((intake) => <article key={intake.id} className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex flex-col gap-5 lg:flex-row lg:items-center"><Link href={`/dashboard/accounts/${intake.organization_id}`} className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold text-orange-950">{intake.company_name}</h2><span className="font-mono text-[10px] text-orange-900/35">{intake.reference_code}</span></div><p className="mt-2 line-clamp-2 text-sm leading-6 text-orange-950/65">{intake.goals}</p><div className="mt-3 flex flex-wrap gap-2">{intake.project_types?.map((type: string) => <Badge key={type} variant="secondary">{type}</Badge>)}</div></Link><div className="grid shrink-0 gap-2 text-xs text-orange-950/55 lg:w-72"><StatusSelect resource="intake" id={intake.id} value={intake.status} options={[{ value: 'new', label: 'New' }, { value: 'in_review', label: 'In review' }, { value: 'qualified', label: 'Qualified' }, { value: 'archived', label: 'Archived' }]} /><span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {intake.email}</span>{intake.phone && <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {intake.phone}</span>}<span>{intake.budget_range} · {intake.target_launch}</span></div></div></article>) : <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-16 text-center"><Inbox className="mx-auto h-8 w-8 text-orange-200" /><h2 className="mt-4 font-semibold">Inbox clear</h2><p className="mt-2 text-sm text-orange-950/55">New submissions will land here with a linked client account.</p></div>}</div>
  </div></div>
}

function MiniStat({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"><p className="text-xs text-orange-950/50">{label}</p><p className="mt-2 text-2xl font-semibold text-orange-950">{value}</p></div> }
