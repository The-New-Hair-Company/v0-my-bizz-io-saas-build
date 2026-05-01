// app/api/email-events/webhook/route.ts
// Handles provider webhooks (Resend, and optionally SES via SNS).
// Writes bounces, complaints, opens, clicks back to Supabase.
// Service-role key bypasses RLS for write access.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for webhook writes (bypasses RLS)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// Resend webhook event shape
interface ResendWebhookEvent {
  type: string
  created_at: string
  data: {
    email_id?: string
    from?: string
    to?: string | string[]
    subject?: string
    tags?: Array<{ name: string; value: string }>
    bounce?: { type: string; message: string }
    click?: { link: string }
  }
}

function getTag(tags: Array<{ name: string; value: string }> | undefined, name: string): string | undefined {
  return tags?.find((t) => t.name === name)?.value
}

// Map Resend event types to our internal event types
const EVENT_TYPE_MAP: Record<string, string> = {
  'email.sent': 'delivered',
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.unsubscribed': 'unsubscribed',
}

export async function POST(req: NextRequest) {
  // Verify webhook signature if Resend signing key is configured
  const signingSecret = process.env.RESEND_WEBHOOK_SECRET
  if (signingSecret) {
    const sig = req.headers.get('svix-signature') ?? req.headers.get('resend-signature')
    if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    // TODO: verify HMAC-SHA256 signature with signingSecret
    // Resend uses svix for webhook delivery — see https://resend.com/docs/dashboard/webhooks/introduction
  }

  let event: ResendWebhookEvent
  try {
    event = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const eventType = EVENT_TYPE_MAP[event.type]

  if (!eventType) {
    // Unknown event — ack to avoid retries
    return NextResponse.json({ ok: true, skipped: event.type })
  }

  const tags = event.data.tags ?? []
  const campaignId = getTag(tags, 'campaign_id')
  const subscriberId = getTag(tags, 'subscriber_id')
  const emailId = event.data.email_id

  // Log event
  await supabase.from('newsletter_email_events').insert({
    campaign_id: campaignId ?? null,
    subscriber_id: subscriberId ?? null,
    event_type: eventType,
    metadata: {
      provider_event: event.type,
      email_id: emailId,
      bounce: event.data.bounce,
      click_link: event.data.click?.link,
    },
    occurred_at: event.created_at,
  })

  // Handle bounces — update subscriber status + add to suppression
  if (eventType === 'bounced' && subscriberId) {
    await supabase
      .from('newsletter_subscribers')
      .update({ status: 'bounced', updated_at: new Date().toISOString() })
      .eq('id', subscriberId)

    const { data: sub } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('id', subscriberId)
      .single()

    if (sub?.email) {
      await supabase.from('newsletter_suppression_list').upsert({
        email: sub.email,
        reason: 'bounce',
        source: 'resend_webhook',
      }, { onConflict: 'email' })
    }

    // Update send job status
    if (campaignId) {
      await supabase
        .from('newsletter_send_jobs')
        .update({ status: 'bounced' })
        .eq('campaign_id', campaignId)
        .eq('subscriber_id', subscriberId)
    }
  }

  // Handle complaints
  if (eventType === 'complained' && subscriberId) {
    await supabase
      .from('newsletter_subscribers')
      .update({ status: 'complained', updated_at: new Date().toISOString() })
      .eq('id', subscriberId)

    const { data: sub } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('id', subscriberId)
      .single()

    if (sub?.email) {
      await supabase.from('newsletter_suppression_list').upsert({
        email: sub.email,
        reason: 'complaint',
        source: 'resend_webhook',
      }, { onConflict: 'email' })
    }
  }

  // Handle unsubscribes via provider (List-Unsubscribe-Post)
  if (eventType === 'unsubscribed' && subscriberId) {
    await supabase
      .from('newsletter_subscribers')
      .update({ status: 'unsubscribed', updated_at: new Date().toISOString() })
      .eq('id', subscriberId)
  }

  return NextResponse.json({ ok: true, event: eventType })
}

// ─────────────────────────────────────────
// Open tracking pixel
// ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const campaignId = searchParams.get('c')
  const subscriberId = searchParams.get('s')

  if (campaignId && subscriberId) {
    const supabase = getServiceClient()
    await supabase.from('newsletter_email_events').insert({
      campaign_id: campaignId,
      subscriber_id: subscriberId,
      event_type: 'opened',
      metadata: { source: 'pixel' },
    })

    // Update last_engaged_at
    await supabase
      .from('newsletter_subscribers')
      .update({ last_engaged_at: new Date().toISOString() })
      .eq('id', subscriberId)
  }

  // Return 1×1 transparent GIF
  const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
  return new NextResponse(gif, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
    },
  })
}
