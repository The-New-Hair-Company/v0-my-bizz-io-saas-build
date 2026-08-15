import Link from 'next/link'
import { CheckCircle2, Clock3, ShieldCheck } from 'lucide-react'
import { notFound } from 'next/navigation'
import { requirePortalUser } from '@/lib/portal/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertStripeConfiguration, stripeRequest } from '@/lib/stripe/server'

type CheckoutSession = {
  client_reference_id: string | null
  customer_email?: string | null
  customer_details?: { email?: string | null } | null
  payment_status: 'paid' | 'unpaid' | 'no_payment_required'
  status: 'open' | 'complete' | 'expired'
  metadata?: { plan_key?: string }
}

export const metadata = {
  title: 'Billing confirmed — MyBizz',
  robots: { index: false, follow: false },
}

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id: sessionId } = await searchParams
  if (!sessionId?.startsWith('cs_')) notFound()

  const user = await requirePortalUser(`/billing/success?session_id=${encodeURIComponent(sessionId)}`)
  assertStripeConfiguration()
  const session = await stripeRequest<CheckoutSession>(
    `/checkout/sessions/${encodeURIComponent(sessionId)}`,
    new URLSearchParams(),
    { method: 'GET' },
  )

  if (!session.client_reference_id) notFound()
  const admin = createAdminClient()
  const { data: membership, error } = await admin
    .from('members')
    .select('organization_id')
    .eq('organization_id', session.client_reference_id)
    .eq('user_id', user.userId)
    .maybeSingle()
  if (error) throw error
  if (!membership) notFound()

  const confirmed = session.status === 'complete'
    && (session.payment_status === 'paid' || session.payment_status === 'no_payment_required')
  const planName = session.metadata?.plan_key === 'pro' ? 'Scale' : 'Studio'
  const email = session.customer_details?.email ?? session.customer_email ?? user.email

  return (
    <main className="grid min-h-screen place-items-center bg-orange-50 px-5 py-12 text-orange-950">
      <section className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-orange-100 bg-white shadow-[0_30px_90px_-45px_rgba(194,65,0,.45)]">
        <div className="bg-[#ff6600] px-7 py-9 text-white sm:px-10">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#ff6600]">
            {confirmed ? <CheckCircle2 className="h-7 w-7" /> : <Clock3 className="h-7 w-7" />}
          </span>
          <p className="mt-7 text-xs font-black uppercase tracking-[.2em] text-white/70">
            {confirmed ? 'Payment confirmed' : 'Confirmation in progress'}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">
            {confirmed ? `${planName} is ready.` : 'Stripe is confirming your plan.'}
          </h1>
        </div>
        <div className="p-7 sm:p-10">
          <p className="text-sm leading-7 text-orange-950/60">
            {confirmed
              ? `Your ${planName} subscription is linked to this workspace. The signed Stripe webhook is applying the new limits now.`
              : 'No action is needed. Stripe will finish the payment and update this workspace through a signed webhook.'}
          </p>
          {email && <p className="mt-3 text-xs text-orange-950/40">Billing confirmation: {email}</p>}
          <div className="mt-7 flex items-center gap-2 rounded-2xl bg-orange-50 p-4 text-xs font-semibold text-orange-800">
            <ShieldCheck className="h-4 w-4 text-[#ff6600]" />
            Card data is handled by Stripe and never enters MyBizz systems.
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-[#ff6600] px-6 text-sm font-bold text-white transition hover:bg-[#e95d00]">
              Open your workspace
            </Link>
            <Link href="/dashboard/settings" className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-orange-200 px-6 text-sm font-bold text-orange-800 transition hover:bg-orange-50">
              Billing settings
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
