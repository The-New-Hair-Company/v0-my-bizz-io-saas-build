// app/api/newsletters/schedule/route.ts
// Validates and schedules a campaign, then enqueues all send jobs.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enqueueCampaign } from '@/lib/queue/enqueueCampaign'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaign_id, scheduled_at } = await req.json() as {
      campaign_id: string
      scheduled_at?: string // ISO string; omit to send immediately
    }

    if (!campaign_id) return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 })

    // Validate campaign is a sendable state
    const { data: campaign, error: campaignErr } = await supabase
      .from('newsletter_campaigns')
      .select('id, status, subject, from_email, list_id, newsletter_campaign_versions(id)')
      .eq('id', campaign_id)
      .single()

    if (campaignErr || !campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    if (['sent', 'sending', 'cancelled'].includes(campaign.status)) {
      return NextResponse.json({ error: `Cannot schedule campaign with status: ${campaign.status}` }, { status: 409 })
    }
    if (!campaign.list_id) return NextResponse.json({ error: 'Campaign must have a subscriber list' }, { status: 422 })
    if (!campaign.subject) return NextResponse.json({ error: 'Campaign must have a subject line' }, { status: 422 })

    // Update scheduled_at and status
    const now = new Date().toISOString()
    const isImmediate = !scheduled_at || new Date(scheduled_at) <= new Date()
    await supabase
      .from('newsletter_campaigns')
      .update({
        status: isImmediate ? 'sending' : 'scheduled',
        scheduled_at: scheduled_at ?? now,
        updated_at: now,
      })
      .eq('id', campaign_id)

    // Enqueue send jobs
    const { enqueued } = await enqueueCampaign(campaign_id)

    return NextResponse.json({
      campaign_id,
      enqueued,
      status: isImmediate ? 'sending' : 'scheduled',
      scheduled_at: scheduled_at ?? now,
    })
  } catch (err) {
    console.error('[newsletters/schedule]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
