import { NextResponse } from 'next/server'
import { requirePortalUser } from '@/lib/portal/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getApplicationOrigin, getMarketingOrigin } from '@/lib/deployment'
import {
  assertStripeConfiguration,
  isPaidPlanKey,
  stripePaymentLinkForPlan,
  stripePriceForPlan,
  stripeRequest,
} from '@/lib/stripe/server'

type CheckoutSession = { url: string | null }

type PortalShell = {
  accounts?: Array<{ id: string }>
}

export async function POST(request: Request) {
  if (request.headers.get('origin') !== getApplicationOrigin()) {
    return Response.json({ error: 'Invalid checkout origin.' }, { status: 403 })
  }

  const user = await requirePortalUser()
  const form = await request.formData()
  const plan = form.get('plan')
  if (!isPaidPlanKey(plan)) return Response.json({ error: 'Unknown plan.' }, { status: 400 })

  // Keep production sales available while Stripe is waiting for its one-time
  // security verification. Payment Links are still Stripe-hosted and the signed
  // webhook applies the exact same tenant entitlement update.
  if (!process.env.STRIPE_SECRET_KEY) {
    const checkout = stripePaymentLinkForPlan(plan)
    checkout.searchParams.set('locale', 'en-GB')
    if (user.email) checkout.searchParams.set('locked_prefilled_email', user.email)

    const admin = createAdminClient()
    const { data: shellData, error } = await admin.rpc('get_portal_shell', {
      p_clerk_user_id: user.userId,
    })
    if (error) throw error
    const organizationId = ((shellData ?? {}) as PortalShell).accounts?.[0]?.id
    if (!organizationId) return Response.json({ error: 'No billable workspace was found.' }, { status: 404 })
    checkout.searchParams.set('client_reference_id', organizationId)
    return NextResponse.redirect(checkout, 303)
  }

  assertStripeConfiguration()

  const admin = createAdminClient()
  const { data: shellData, error: shellError } = await admin.rpc('get_portal_shell', {
    p_clerk_user_id: user.userId,
  })
  if (shellError) throw shellError
  const organizationId = ((shellData ?? {}) as PortalShell).accounts?.[0]?.id
  if (!organizationId) return Response.json({ error: 'No billable workspace was found.' }, { status: 404 })

  const { data: subscription, error: subscriptionError } = await admin
    .from('organization_subscriptions')
    .select('provider_customer_id')
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (subscriptionError) throw subscriptionError

  const priceId = stripePriceForPlan(plan)
  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    client_reference_id: organizationId,
    success_url: `${getApplicationOrigin()}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getMarketingOrigin()}/pricing?checkout=cancelled`,
    locale: 'en-GB',
    billing_address_collection: 'auto',
    allow_promotion_codes: 'true',
    'tax_id_collection[enabled]': 'true',
    'metadata[organization_id]': organizationId,
    'metadata[plan_key]': plan,
    'subscription_data[metadata][organization_id]': organizationId,
    'subscription_data[metadata][plan_key]': plan,
  })
  if (subscription?.provider_customer_id) params.set('customer', subscription.provider_customer_id)
  else if (user.email) params.set('customer_email', user.email)

  const session = await stripeRequest<CheckoutSession>('/checkout/sessions', params, {
    idempotencyKey: `checkout-${organizationId}-${plan}-${Math.floor(Date.now() / 600_000)}`,
  })
  if (!session.url) throw new Error('Stripe did not return a Checkout URL.')
  return NextResponse.redirect(session.url, 303)
}
