import { Activity, Cable, CheckCircle2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/portal/auth'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/portal/PageHeader'
import { RecordDialog } from '@/components/portal/RecordDialog'
import { StatusSelect } from '@/components/portal/StatusSelect'

const providers = [
  { provider: 'clerk', name: 'Clerk', description: 'Identity, sessions and invitations' },
  { provider: 'supabase', name: 'Supabase', description: 'Tenant data, RLS and storage' },
  { provider: 'vercel', name: 'Vercel', description: 'Production delivery and observability' },
  { provider: 'resend', name: 'Resend', description: 'Transactional email and campaigns' },
  { provider: 'stripe', name: 'Stripe', description: 'Billing and subscriptions' },
  { provider: 'slack', name: 'Slack', description: 'Team alerts and activity' },
]

export default async function IntegrationsPage() {
  const user = await requirePortalUser()
  const supabase = await createClient()
  const [{ data: integrations }, { data: assigned }] = await Promise.all([
    supabase.from('integrations').select('*, organizations(name)').order('provider'),
    supabase.from('members').select('organization_id, role, organizations(name, source)').eq('user_id', user.userId),
  ])
  const adminAccounts = (assigned ?? []).filter((item: any) => ['owner','admin'].includes(item.role))
  const records: any[] = integrations ?? []
  return <div className="min-h-screen"><PageHeader eyebrow="Connected systems" title="Integration fabric" description="A tenant-aware control plane for data flows into and out of Agency OS.">{adminAccounts.length > 0 && <RecordDialog resource="integration" title="Connect an integration" description="Create a connection record in the selected client workspace." triggerLabel="Add connection" fixedData={{ status: 'connected', configuration: {} }} fields={[{ name: 'organization_id', label: 'Client account', type: 'select', required: true, options: adminAccounts.map((item: any) => ({ value: item.organization_id, label: item.organizations?.name ?? 'Account' })) }, { name: 'provider', label: 'Provider', type: 'select', required: true, options: providers.map((item) => ({ value: item.provider, label: item.name })) }, { name: 'display_name', label: 'Connection name', required: true }]} />}</PageHeader><main className="mx-auto max-w-[1400px] p-5 sm:p-8 lg:p-10"><div className="grid gap-4 sm:grid-cols-3"><Metric label="Connected" value={records.filter((item) => item.status === 'connected').length} icon={CheckCircle2} /><Metric label="Needs attention" value={records.filter((item) => item.status === 'attention').length} icon={Activity} /><Metric label="Available providers" value={providers.length} icon={Cable} /></div><section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{providers.map((provider) => { const providerRecords = records.filter((item) => item.provider === provider.provider); return <article key={provider.provider} className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--agency-accent)] text-white"><Cable className="h-5 w-5" /></span><Badge variant="secondary">{providerRecords.length} tenants</Badge></div><h2 className="mt-5 font-semibold text-orange-950">{provider.name}</h2><p className="mt-1 text-sm text-orange-950/50">{provider.description}</p><div className="mt-5 space-y-3">{providerRecords.map((record) => <div key={record.id} className="rounded-xl bg-orange-50/70 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-orange-950">{record.display_name}</p><p className="mt-0.5 text-[10px] text-orange-950/45">{record.organizations?.name}</p></div><StatusSelect resource="integration" id={record.id} value={record.status} options={[{ value: 'connected', label: 'Connected' }, { value: 'attention', label: 'Attention' }, { value: 'disabled', label: 'Disabled' }]} /></div></div>)}{!providerRecords.length && <p className="text-xs text-orange-950/35">Not configured for an assigned tenant.</p>}</div></article> })}</section></main></div>
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof RefreshCw }) { return <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-orange-950/50">{label}</p><Icon className="h-4 w-4 text-[var(--agency-accent)]" /></div><p className="mt-2 text-3xl font-semibold text-orange-950">{value}</p></div> }
