import { ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/portal/auth'
import { PageHeader } from '@/components/portal/PageHeader'
import { PreferenceForm } from '@/components/portal/PreferenceForm'

export default async function SettingsPage() {
  const user = await requirePortalUser()
  const supabase = await createClient()
  const [{ data: preferences }, { data: membership }] = await Promise.all([
    supabase.from('member_preferences').select('*').eq('user_id', user.userId).maybeSingle(),
    supabase.from('members').select('organization_id').eq('user_id', user.userId).order('created_at').limit(1).maybeSingle(),
  ])
  return <div className="min-h-screen"><PageHeader eyebrow="Personalisation" title="Workspace settings" description="Control the look, density and signal level of your Agency OS." badge="Saved per user" /><main className="mx-auto grid max-w-[1200px] gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_320px] lg:p-10"><PreferenceForm preferences={preferences} activeOrganizationId={membership?.organization_id} /><aside className="h-fit rounded-2xl border border-orange-100 bg-orange-50 p-6"><ShieldCheck className="h-6 w-6 text-[var(--agency-accent)]" /><h2 className="mt-4 font-semibold text-orange-950">Identity security</h2><p className="mt-2 text-sm leading-6 text-orange-950/60">Sign-in, session management and connected identities are protected by Clerk. Database access is evaluated again by Supabase for every tenant record.</p><dl className="mt-5 space-y-3 text-xs"><div><dt className="text-orange-950/45">Signed in as</dt><dd className="mt-1 font-medium text-orange-950">{user.email}</dd></div><div><dt className="text-orange-950/45">Portal role</dt><dd className="mt-1 font-medium text-orange-950">{user.isAdmin ? 'Agency administrator' : 'Assigned member'}</dd></div></dl></aside></main></div>
}
