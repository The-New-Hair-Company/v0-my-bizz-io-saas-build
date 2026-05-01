import { createClient } from '@supabase/supabase-js'
import { getEmailProvider } from '@/lib/email/provider'
import { renderCampaignEmail } from '@/lib/email/render'
import type { NewsletterCampaignVersion } from '@/types/newsletter'

const BATCH_SIZE = 50

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Process one batch of queued newsletter send jobs.
 * Marks each job as "sending" before attempting, then "sent" or "failed" after.
 * Returns counts of sent and failed for the batch.
 */
export async function processBatch(
  campaignId?: string,
): Promise<{ sent: number; failed: number }> {
  const supabase = getServiceClient()
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://online2day.co.uk'

  // Fetch queued jobs that are due
  let query = supabase
    .from('newsletter_send_jobs')
    .select('id, campaign_id, subscriber_id, attempts')
    .eq('status', 'queued')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(BATCH_SIZE)

  if (campaignId) query = query.eq('campaign_id', campaignId)

  const { data: jobs, error: jobsErr } = await query
  if (jobsErr) throw new Error(`Failed to fetch send jobs: ${jobsErr.message}`)
  if (!jobs || jobs.length === 0) return { sent: 0, failed: 0 }

  // Pre-fetch suppression list for this batch's subscriber emails
  const subscriberIds = jobs.map((j) => j.subscriber_id as string)
  const { data: subscribers } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, status')
    .in('id', subscriberIds)

  const subscriberMap = new Map(
    (subscribers ?? []).map((s: any) => [s.id as string, s as { id: string; email: string; status: string }]),
  )

  const subscriberEmails = (subscribers ?? []).map((s: any) => s.email as string)
  const { data: suppressed } = await supabase
    .from('newsletter_suppression_list')
    .select('email')
    .in('email', subscriberEmails)

  const suppressedSet = new Set<string>((suppressed ?? []).map((s: any) => s.email as string))

  const provider = getEmailProvider()
  let sent = 0
  let failed = 0

  for (const job of jobs as Array<{ id: string; campaign_id: string; subscriber_id: string; attempts: number }>) {
    const subscriber = subscriberMap.get(job.subscriber_id)

    // Mark as sending to prevent double-processing by concurrent workers
    await supabase
      .from('newsletter_send_jobs')
      .update({ status: 'sending', attempts: job.attempts + 1 })
      .eq('id', job.id)

    if (!subscriber || subscriber.status !== 'active' || suppressedSet.has(subscriber.email)) {
      await supabase
        .from('newsletter_send_jobs')
        .update({ status: 'unsubscribed' })
        .eq('id', job.id)
      continue
    }

    try {
      // Fetch campaign + latest version
      const { data: campaign, error: campaignErr } = await supabase
        .from('newsletter_campaigns')
        .select('id, slug, subject, preview_text, from_name, from_email, reply_to, status')
        .eq('id', job.campaign_id)
        .single()

      if (campaignErr || !campaign) throw new Error('Campaign not found')

      const { data: version } = await supabase
        .from('newsletter_campaign_versions')
        .select('id, campaign_id, html, text_fallback, design_json, hero_image_url, created_by, created_at')
        .eq('campaign_id', job.campaign_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const fallbackVersion: NewsletterCampaignVersion = {
        id: '',
        campaign_id: job.campaign_id,
        html: null,
        text_fallback: null,
        design_json: null,
        hero_image_url: null,
        created_by: null,
        created_at: new Date().toISOString(),
      }

      const { html, text } = await renderCampaignEmail({
        version: (version as NewsletterCampaignVersion) ?? fallbackVersion,
        subject: campaign.subject as string,
        previewText: campaign.preview_text as string | null,
        unsubscribeUrl: `${BASE_URL}/unsubscribe/${job.subscriber_id}`,
        webVersionUrl: `${BASE_URL}/newsletter/${(campaign.slug as string) ?? job.campaign_id}`,
        recipientEmail: subscriber.email,
      })

      const result = await provider.send({
        to: subscriber.email,
        from: `${campaign.from_name} <${campaign.from_email}>`,
        reply_to: (campaign.reply_to as string | null) ?? undefined,
        subject: campaign.subject as string,
        html,
        text,
        tags: {
          campaign_id: job.campaign_id,
          subscriber_id: job.subscriber_id,
        },
      })

      await supabase
        .from('newsletter_send_jobs')
        .update({
          status: 'sent',
          provider_message_id: result.providerMessageId,
          sent_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      sent++
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      await supabase
        .from('newsletter_send_jobs')
        .update({ status: 'failed', last_error: errorMsg })
        .eq('id', job.id)
      failed++
    }
  }

  // Mark campaign as sent once all jobs are completed
  if (campaignId) {
    const { count } = await supabase
      .from('newsletter_send_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .in('status', ['queued', 'sending'])

    if (count === 0) {
      await supabase
        .from('newsletter_campaigns')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', campaignId)
    }
  }

  return { sent, failed }
}
