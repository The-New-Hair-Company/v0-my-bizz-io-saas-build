// app/api/email-events/click/route.ts
// Logs click events and redirects to the destination URL.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const campaignId = searchParams.get('c')
  const subscriberId = searchParams.get('s')
  const destination = searchParams.get('url')

  // Always redirect even if logging fails
  const safeDestination = destination && destination.startsWith('http') ? destination : 'https://online2day.co.uk'

  if (campaignId && subscriberId && destination) {
    try {
      const supabase = getServiceClient()
      await supabase.from('newsletter_email_events').insert({
        campaign_id: campaignId,
        subscriber_id: subscriberId,
        event_type: 'clicked',
        metadata: { link: destination, source: 'redirect' },
      })
      await supabase
        .from('newsletter_subscribers')
        .update({ last_engaged_at: new Date().toISOString() })
        .eq('id', subscriberId)
    } catch {
      // Log failure silently — don't block the redirect
    }
  }

  return NextResponse.redirect(safeDestination, 302)
}
