import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

export type PaidPlanKey = 'starter' | 'pro'

export function isPaidPlanKey(value: unknown): value is PaidPlanKey {
  return value === 'starter' || value === 'pro'
}

export function stripePriceForPlan(plan: PaidPlanKey) {
  const price = plan === 'starter'
    ? process.env.STRIPE_STUDIO_PRICE_ID
    : process.env.STRIPE_SCALE_PRICE_ID
  if (!price?.startsWith('price_')) throw new Error(`Stripe price is not configured for ${plan}.`)
  return price
}

export function stripePaymentLinkForPlan(plan: PaidPlanKey) {
  const raw = plan === 'starter'
    ? process.env.STRIPE_STUDIO_PAYMENT_LINK_URL
    : process.env.STRIPE_SCALE_PAYMENT_LINK_URL
  if (!raw) throw new Error(`Stripe payment link is not configured for ${plan}.`)

  const url = new URL(raw)
  if (url.protocol !== 'https:' || url.hostname !== 'buy.stripe.com') {
    throw new Error(`Stripe payment link is invalid for ${plan}.`)
  }
  return url
}

export function planForStripePrice(priceId: string | null): PaidPlanKey | null {
  if (!priceId) return null
  if (priceId === process.env.STRIPE_STUDIO_PRICE_ID) return 'starter'
  if (priceId === process.env.STRIPE_SCALE_PRICE_ID) return 'pro'
  return null
}

export function planForStripePaymentLink(paymentLinkId: string | null): PaidPlanKey | null {
  if (!paymentLinkId) return null
  if (paymentLinkId === process.env.STRIPE_STUDIO_PAYMENT_LINK_ID) return 'starter'
  if (paymentLinkId === process.env.STRIPE_SCALE_PAYMENT_LINK_ID) return 'pro'
  return null
}

export async function stripeRequest<T>(path: string, params: URLSearchParams): Promise<T> {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret?.startsWith('sk_')) throw new Error('Stripe is not configured.')

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
    cache: 'no-store',
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'Stripe rejected the request.')
  return data as T
}

export function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (!signatureHeader || !secret.startsWith('whsec_')) return false
  const parts = signatureHeader.split(',').map((part) => part.trim().split('=', 2))
  const timestamp = Number(parts.find(([key]) => key === 't')?.[1])
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value)
  if (!Number.isFinite(timestamp) || Math.abs(nowSeconds - timestamp) > 300 || !signatures.length) return false

  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`, 'utf8').digest()
  return signatures.some((candidate) => {
    if (!/^[0-9a-f]{64}$/i.test(candidate)) return false
    const actual = Buffer.from(candidate, 'hex')
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  })
}

export function stripeSubscriptionStatus(value: string) {
  if (value === 'active' || value === 'trialing' || value === 'past_due' || value === 'paused') return value
  return 'cancelled'
}
