import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Enqueue one send job per active, non-suppressed subscriber in the
 * campaign's list. Idempotent: duplicate (campaign_id, subscriber_id)
 * pairs are silently ignored.
 */
export async function enqueueCampaign(
  campaignId: string,
): Promise<{ enqueued: number }> {
  const supabase = getServiceClient()

  const { data: campaign, error: campaignErr } = await supabase
    .from('newsletter_campaigns')
    .select('id, list_id, scheduled_at')
    .eq('id', campaignId)
    .single()

  if (campaignErr || !campaign) throw new Error('Campaign not found')
  if (!campaign.list_id) throw new Error('Campaign has no subscriber list')

  // All active members of the list with active subscriber status
  const { data: memberships, error: memberErr } = await supabase
    .from('newsletter_list_memberships')
    .select('subscriber_id, newsletter_subscribers!inner(id, email, status)')
    .eq('list_id', campaign.list_id)
    .eq('status', 'active')
    .eq('newsletter_subscribers.status', 'active')

  if (memberErr) throw new Error(`Failed to fetch subscribers: ${memberErr.message}`)
  if (!memberships || memberships.length === 0) return { enqueued: 0 }

  // Filter out globally suppressed addresses
  const emails = (memberships as any[]).map((m) => m.newsletter_subscribers.email as string)
  const { data: suppressed } = await supabase
    .from('newsletter_suppression_list')
    .select('email')
    .in('email', emails)

  const suppressedSet = new Set<string>((suppressed ?? []).map((s: any) => s.email as string))

  const scheduledFor = campaign.scheduled_at ?? new Date().toISOString()

  const jobs = (memberships as any[])
    .filter((m) => !suppressedSet.has(m.newsletter_subscribers.email as string))
    .map((m) => ({
      campaign_id: campaignId,
      subscriber_id: m.subscriber_id as string,
      status: 'queued',
      scheduled_for: scheduledFor,
      attempts: 0,
    }))

  if (jobs.length === 0) return { enqueued: 0 }

  const { error: insertErr } = await supabase
    .from('newsletter_send_jobs')
    .upsert(jobs, { onConflict: 'campaign_id,subscriber_id', ignoreDuplicates: true })

  if (insertErr) throw new Error(`Failed to enqueue send jobs: ${insertErr.message}`)

  return { enqueued: jobs.length }
}
