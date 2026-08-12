import { Building2, ShieldCheck } from 'lucide-react'
import { requirePortalUser } from '@/lib/portal/auth'
import { getActiveOrganization } from '@/lib/portal/context'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/portal/PageHeader'
import { AccountProfileForm } from '@/components/portal/AccountProfileForm'

export default async function CompanyPage() {
  const user = await requirePortalUser()
  const membership = await getActiveOrganization(user.userId)
  if (!membership?.organizations) return <div className="p-10">No assigned company workspace.</div>
  const organization = membership.organizations
  const editable = ['owner', 'admin'].includes(membership.role)
  return <div className="min-h-screen"><PageHeader eyebrow="Tenant profile" title={organization.name} description="The structured company record used across delivery, compliance and grounded assistants." badge={membership.role} /><main className="mx-auto grid max-w-[1300px] gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_320px] lg:p-10"><AccountProfileForm account={organization} editable={editable} /><aside className="space-y-4"><div className="rounded-2xl border border-orange-100 bg-[var(--agency-accent)] p-6 text-white"><Building2 className="h-6 w-6" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-white/60">Lifecycle</p><p className="mt-2 text-2xl font-semibold capitalize">{organization.lifecycle_stage}</p><div className="mt-6 h-2 rounded-full bg-white/20"><div className="h-full rounded-full bg-white" style={{ width: `${organization.onboarding_progress ?? 0}%` }} /></div><p className="mt-2 text-xs text-white/70">{organization.onboarding_progress ?? 0}% onboarding complete</p></div><div className="rounded-2xl border border-orange-100 bg-white p-6"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--agency-accent)]" /><h2 className="font-semibold text-orange-950">Your access</h2></div><Badge className="mt-4 capitalize">{membership.role}</Badge><p className="mt-3 text-xs leading-5 text-orange-950/50">{editable ? 'You can maintain this tenant’s core company profile.' : 'This workspace is read-only for your role.'}</p></div></aside></main></div>
}
