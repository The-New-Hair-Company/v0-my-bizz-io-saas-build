import { NextResponse } from 'next/server'
import { requirePortalUser } from '@/lib/portal/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getApplicationOrigin } from '@/lib/deployment'
import { isPaidPlanKey, stripePaymentLinkForPlan } from '@/lib/stripe/server'

export async function POST(request: Request) {
  if (request.headers.get('origin') !== getApplicationOrigin()) {
    return Response.json({ error: 'Invalid checkout origin.' }, { status: 403 })
  }

  const user = await requirePortalUser()
  const form = await request.formData()
  const plan = form.get('plan')
  if (!isPaidPlanKey(plan)) return Response.json({ error: 'Unknown plan.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: membership, error } = await admin
    .from('members')
    .select('organization_id')
    .eq('user_id', user.userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()
  if (error) throw error

  // Stripe returns this reference in checkout.session.completed. It is the
  // tenant UUID, never an authorization credential or customer secret.
  const checkout = stripePaymentLinkForPlan(plan)
  checkout.searchParams.set('client_reference_id', membership.organization_id)
  checkout.searchParams.set('locale', 'en-GB')
  if (user.email) checkout.searchParams.set('locked_prefilled_email', user.email)
  return NextResponse.redirect(checkout, 303)
}
