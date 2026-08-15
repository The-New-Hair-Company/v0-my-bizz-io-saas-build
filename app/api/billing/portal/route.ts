import { NextResponse } from 'next/server'
import { requirePortalUser } from '@/lib/portal/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getApplicationOrigin } from '@/lib/deployment'
import { stripeRequest } from '@/lib/stripe/server'

type PortalSession = { url: string }

export async function POST(request: Request) {
  if (request.headers.get('origin') !== getApplicationOrigin()) {
    return Response.json({ error: 'Invalid billing origin.' }, { status: 403 })
  }
  const user = await requirePortalUser()
  const admin = createAdminClient()
  const { data: shellData, error: shellError } = await admin.rpc('get_portal_shell', {
    p_clerk_user_id: user.userId,
  })
  if (shellError) throw shellError
  const organizationId = (shellData as any)?.accounts?.[0]?.id
  if (!organizationId) return Response.json({ error: 'No billable workspace was found.' }, { status: 404 })

  const { data: subscription, error } = await admin
    .from('organization_subscriptions')
    .select('provider_customer_id')
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (error) throw error
  if (!subscription?.provider_customer_id) return Response.json({ error: 'No Stripe customer is linked to this workspace.' }, { status: 404 })

  // A secret key gives an already-authenticated customer a direct portal
  // session. Until one is configured, Stripe's no-code portal verifies the
  // customer's email before granting billing access.
  if (!process.env.STRIPE_SECRET_KEY) {
    const portal = new URL(process.env.STRIPE_CUSTOMER_PORTAL_URL ?? '')
    if (portal.protocol !== 'https:' || portal.hostname !== 'billing.stripe.com') {
      throw new Error('Stripe customer portal is not configured.')
    }
    return NextResponse.redirect(portal, 303)
  }

  const session = await stripeRequest<PortalSession>('/billing_portal/sessions', new URLSearchParams({
    customer: subscription.provider_customer_id,
    return_url: `${getApplicationOrigin()}/dashboard/settings`,
  }))
  return NextResponse.redirect(session.url, 303)
}
