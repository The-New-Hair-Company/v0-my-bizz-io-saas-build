import Link from 'next/link'
import { ArrowUpRight, Building2, ChevronRight, Filter, Search, Users2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/portal/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function AccountsPage() {
  await requirePortalUser()
  const supabase = await createClient()
  const { data } = await supabase.from('organizations').select('*, client_projects(id, status, progress), intake_submissions(id, status)').order('last_activity_at', { ascending: false })
  const accounts = (data ?? []).filter((account: any) => account.source !== 'internal')

  return <div className="min-h-screen p-5 sm:p-8 lg:p-10"><div className="mx-auto max-w-[1500px]">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Portfolio</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Client accounts</h1><p className="mt-2 text-sm text-slate-500">Every assigned relationship, brief and delivery signal in one view.</p></div><Button asChild className="bg-[#0b1726] text-white"><Link href="/start" target="_blank">Share intake <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button></div>
    <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="border-0 bg-slate-50 pl-10 shadow-none" placeholder="Search accounts, contacts or industries" /></div><Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filters</Button></div>
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden grid-cols-[1.45fr_0.7fr_0.7fr_0.7fr_0.4fr] gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 md:grid"><span>Account</span><span>Lifecycle</span><span>Delivery</span><span>Health</span><span /></div>
      <div className="divide-y divide-slate-100">{accounts.length ? accounts.map((account: any) => <Link key={account.id} href={`/dashboard/accounts/${account.id}`} className="grid gap-4 px-6 py-5 hover:bg-slate-50 md:grid-cols-[1.45fr_0.7fr_0.7fr_0.7fr_0.4fr] md:items-center"><div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-xs font-semibold text-white">{initials(account.name)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{account.name}</p><p className="truncate text-xs text-slate-500">{account.primary_contact_name ?? 'Contact pending'} · {account.industry ?? 'Industry pending'}</p></div></div><div><Badge variant="secondary" className="capitalize">{account.lifecycle_stage}</Badge></div><div className="text-sm"><span className="font-semibold">{account.client_projects?.length ?? 0}</span><span className="ml-1 text-xs text-slate-400">projects</span></div><div><div className="flex max-w-28 items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-slate-100"><div className={`h-full rounded-full ${(account.health_score ?? 75) < 60 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${account.health_score ?? 75}%` }} /></div><span className="text-xs font-semibold">{account.health_score ?? 75}</span></div></div><ChevronRight className="hidden h-4 w-4 justify-self-end text-slate-300 md:block" /></Link>) : <div className="p-14 text-center"><Building2 className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-4 font-semibold">No assigned accounts yet</h2><p className="mt-2 text-sm text-slate-500">A completed intake automatically creates and assigns the account.</p></div>}</div>
    </div>
    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400"><Users2 className="h-3.5 w-3.5" /> Database policies return only accounts assigned to your Clerk identity.</div>
  </div></div>
}

function initials(value: string) { return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() }
