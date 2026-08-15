import Link from 'next/link'
import { ArrowLeft, Check, CreditCard, ShieldCheck, Sparkles } from 'lucide-react'
import { requirePortalUser } from '@/lib/portal/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPaidPlanKey } from '@/lib/stripe/server'
import { absoluteMarketingUrl } from '@/lib/deployment'

const planCopy = {
  starter: { name: 'Studio', price: '£49', benefits: ['100 Intelligence HQ runs', '250 grounded questions', '25 knowledge files', '5 member seats'] },
  pro: { name: 'Scale', price: '£149', benefits: ['500 Intelligence HQ runs', '2,000 grounded questions', '250 knowledge files', '20 member seats'] },
} as const

export default async function SubscribePage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: requestedPlan } = await searchParams
  const plan = isPaidPlanKey(requestedPlan) ? requestedPlan : 'starter'
  const user = await requirePortalUser(`/billing/subscribe?plan=${plan}`)
  const copy = planCopy[plan]
  const admin = createAdminClient()
  const { data: shellData, error: shellError } = await admin.rpc('get_portal_shell', {
    p_clerk_user_id: user.userId,
  })
  if (shellError) throw shellError
  const organizationId = (shellData as any)?.accounts?.[0]?.id
  if (!organizationId) throw new Error('No billable workspace was found.')

  const { data: organization, error } = await admin
    .from('organizations')
    .select('name, plan, organization_subscriptions(provider_customer_id, provider_subscription_id, status)')
    .eq('id', organizationId)
    .single()
  if (error) throw error

  const subscription = Array.isArray(organization?.organization_subscriptions)
    ? organization.organization_subscriptions[0]
    : organization?.organization_subscriptions

  return <main className="min-h-screen bg-orange-50 px-5 py-10 text-orange-950 sm:py-16">
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-4"><Link href={absoluteMarketingUrl('/pricing')} className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700"><ArrowLeft className="h-4 w-4" /> Pricing</Link><span className="inline-flex items-center gap-2 text-xs font-semibold text-orange-950/50"><ShieldCheck className="h-4 w-4 text-[#ff6600]" /> Secured by Stripe</span></div>
      <section className="mt-8 grid overflow-hidden rounded-[32px] border border-orange-100 bg-white shadow-[0_30px_90px_-45px_rgba(194,65,0,.45)] lg:grid-cols-[1fr_.8fr]">
        <div className="p-7 sm:p-10"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ff6600] text-white"><Sparkles className="h-5 w-5" /></span><p className="mt-7 text-xs font-black uppercase tracking-[.2em] text-orange-600">Upgrade {organization?.name || 'your workspace'}</p><h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">{copy.name}</h1><div className="mt-4 flex items-end gap-2"><span className="text-4xl font-semibold">{copy.price}</span><span className="pb-1 text-sm text-orange-950/45">per month</span></div><p className="mt-5 max-w-xl text-sm leading-6 text-orange-950/55">Your tenant data stays in place. Stripe manages payment; signed webhooks update this workspace’s server-side entitlements.</p><ul className="mt-7 grid gap-3 sm:grid-cols-2">{copy.benefits.map((benefit) => <li key={benefit} className="flex items-center gap-2 text-sm"><span className="grid h-6 w-6 place-items-center rounded-full bg-orange-100 text-[#ff6600]"><Check className="h-3.5 w-3.5" /></span>{benefit}</li>)}</ul></div>
        <aside className="flex flex-col justify-between bg-orange-950 p-7 text-white sm:p-10"><div><CreditCard className="h-7 w-7 text-orange-300" /><h2 className="mt-5 text-xl font-semibold">Production billing</h2><p className="mt-3 text-sm leading-6 text-white/55">Checkout opens on Stripe’s hosted payment page. We never receive or store card details.</p><dl className="mt-7 space-y-3 text-xs"><div className="flex justify-between border-b border-white/10 pb-3"><dt className="text-white/45">Workspace</dt><dd>{organization?.name}</dd></div><div className="flex justify-between border-b border-white/10 pb-3"><dt className="text-white/45">Current plan</dt><dd className="capitalize">{organization?.plan || 'free'}</dd></div><div className="flex justify-between"><dt className="text-white/45">Billing</dt><dd>Monthly · GBP</dd></div></dl></div>{subscription?.provider_customer_id ? <form action="/api/billing/portal" method="post"><button className="mt-8 h-12 w-full rounded-xl bg-white px-5 text-sm font-bold text-orange-950 transition hover:bg-orange-50">Manage billing</button></form> : <form action="/api/billing/checkout" method="post"><input type="hidden" name="plan" value={plan} /><button className="mt-8 h-12 w-full rounded-xl bg-[#ff6600] px-5 text-sm font-bold text-white transition hover:bg-[#e95d00]">Continue to secure checkout</button></form>}</aside>
      </section>
    </div>
  </main>
}
