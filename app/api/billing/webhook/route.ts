import { createAdminClient } from '@/lib/supabase/admin'
import {
  isPaidPlanKey,
  planForStripePaymentLink,
  planForStripePrice,
  stripeSubscriptionStatus,
  verifyStripeWebhookSignature,
} from '@/lib/stripe/server'

type StripeObject = Record<string, any>
type StripeEvent = { id: string; type: string; data: { object: StripeObject } }

function stringId(value: unknown) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && typeof (value as any).id === 'string') return (value as any).id
  return null
}

export async function POST(request: Request) {
  const payload = await request.text()
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
  if (!verifyStripeWebhookSignature(payload, request.headers.get('stripe-signature'), secret)) {
    return Response.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  const event = JSON.parse(payload) as StripeEvent
  const object = event.data.object
  let organizationId: string | null = null
  let planKey: string | null = null
  let status = 'cancelled'
  let customerId: string | null = null
  let subscriptionId: string | null = null
  let priceId: string | null = null
  let periodStart: string | null = null
  let periodEnd: string | null = null
  let cancelAtPeriodEnd = false
  const admin = createAdminClient()

  if (event.type === 'checkout.session.completed') {
    organizationId = object.client_reference_id ?? object.metadata?.organization_id ?? null
    planKey = object.metadata?.plan_key ?? planForStripePaymentLink(stringId(object.payment_link))
    status = object.payment_status === 'paid' || object.payment_status === 'no_payment_required' ? 'active' : 'past_due'
    customerId = stringId(object.customer)
    subscriptionId = stringId(object.subscription)
    priceId = isPaidPlanKey(planKey) ? (planKey === 'starter' ? process.env.STRIPE_STUDIO_PRICE_ID ?? null : process.env.STRIPE_SCALE_PRICE_ID ?? null) : null
  } else if (event.type.startsWith('customer.subscription.')) {
    organizationId = object.metadata?.organization_id ?? null
    planKey = object.metadata?.plan_key ?? null
    status = event.type === 'customer.subscription.deleted' ? 'cancelled' : stripeSubscriptionStatus(object.status)
    customerId = stringId(object.customer)
    subscriptionId = stringId(object.id)
    const item = object.items?.data?.[0]
    priceId = stringId(item?.price)
    planKey = planKey ?? planForStripePrice(priceId)
    const start = object.current_period_start ?? item?.current_period_start
    const end = object.current_period_end ?? item?.current_period_end
    periodStart = start ? new Date(start * 1000).toISOString() : null
    periodEnd = end ? new Date(end * 1000).toISOString() : null
    cancelAtPeriodEnd = Boolean(object.cancel_at_period_end)
  } else {
    return Response.json({ received: true })
  }

  // Payment Link-created subscriptions don't carry custom metadata. Resolve
  // later lifecycle events through the Stripe IDs persisted at checkout.
  if (!organizationId && (subscriptionId || customerId)) {
    let query = admin.from('organization_subscriptions').select('organization_id')
    query = subscriptionId
      ? query.eq('provider_subscription_id', subscriptionId)
      : query.eq('provider_customer_id', customerId as string)
    const { data: existing, error: lookupError } = await query.limit(1).maybeSingle()
    if (lookupError) throw lookupError
    organizationId = existing?.organization_id ?? null
  }

  if (!organizationId || !isPaidPlanKey(planKey)) {
    return Response.json({ error: 'Billing metadata is incomplete.' }, { status: 400 })
  }

  const { error } = await admin.rpc('apply_stripe_subscription_event', {
    p_event_id: event.id,
    p_event_type: event.type,
    p_organization_id: organizationId,
    p_plan_key: planKey,
    p_status: status,
    p_customer_id: customerId,
    p_subscription_id: subscriptionId,
    p_price_id: priceId,
    p_period_start: periodStart,
    p_period_end: periodEnd,
    p_cancel_at_period_end: cancelAtPeriodEnd,
  })
  if (error) throw error
  return Response.json({ received: true })
}
