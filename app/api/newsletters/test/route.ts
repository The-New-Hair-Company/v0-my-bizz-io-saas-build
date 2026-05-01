// app/api/newsletters/test/route.ts
// Sends a test email to specified addresses (admin only).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEmailProvider } from '@/lib/email/provider'
import { renderCampaignEmail } from '@/lib/email/render'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth guard
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaign_id, to } = await req.json() as { campaign_id: string; to: string[] }

    if (!campaign_id || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: 'campaign_id and to[] are required' }, { status: 400 })
    }

    // Fetch campaign + latest version
    const { data: campaign, error: campaignErr } = await supabase
      .from('newsletter_campaigns')
      .select('*, newsletter_campaign_versions(id, html, text_fallback, hero_image_url)')
      .eq('id', campaign_id)
      .order('created_at', { referencedTable: 'newsletter_campaign_versions', ascending: false })
      .limit(1, { referencedTable: 'newsletter_campaign_versions' })
      .single()

    if (campaignErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const provider = getEmailProvider()
    const version = campaign.newsletter_campaign_versions?.[0] ?? null
    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://online2day.co.uk'

    const { html, text } = await renderCampaignEmail({
      version: version ?? { id: '', campaign_id, html: null, text_fallback: null, design_json: null, hero_image_url: null, created_by: null, created_at: new Date().toISOString() },
      subject: `[TEST] ${campaign.subject}`,
      previewText: campaign.preview_text,
      unsubscribeUrl: `${BASE_URL}/unsubscribe/test-token`,
      webVersionUrl: `${BASE_URL}/newsletter/${campaign.slug ?? campaign_id}`,
      recipientEmail: to[0],
    })

    const results: Array<{ email: string; ok: boolean; error?: string }> = []

    for (const email of to) {
      try {
        await provider.send({
          to: email,
          from: `${campaign.from_name} <${campaign.from_email}>`,
          subject: `[TEST] ${campaign.subject}`,
          html,
          text,
          headers: { 'X-Newsletter-Test': 'true' },
        })
        results.push({ email, ok: true })
      } catch (err) {
        results.push({ email, ok: false, error: err instanceof Error ? err.message : 'Send failed' })
      }
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error('[newsletters/test]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
