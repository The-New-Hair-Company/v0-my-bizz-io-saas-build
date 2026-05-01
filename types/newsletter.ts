// types/newsletter.ts
// TypeScript types for the Online2Day Newsletter System

export type SubscriberStatus = 'active' | 'unsubscribed' | 'bounced' | 'complained'
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
export type SendJobStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'bounced' | 'unsubscribed'
export type EmailEventType =
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'unsubscribed'
  | 'failed'

export interface NewsletterSubscriber {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  company: string | null
  status: SubscriberStatus
  source: string | null
  last_engaged_at: string | null
  created_at: string
  updated_at: string
}

export interface NewsletterList {
  id: string
  name: string
  description: string | null
  created_at: string
  _count?: number
}

export interface NewsletterCampaign {
  id: string
  slug: string | null
  title: string
  subject: string
  preview_text: string | null
  from_name: string
  from_email: string
  reply_to: string | null
  list_id: string | null
  status: CampaignStatus
  scheduled_at: string | null
  sent_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  latest_version?: NewsletterCampaignVersion | null
  _stats?: CampaignStats
}

export interface NewsletterCampaignVersion {
  id: string
  campaign_id: string
  html: string | null
  text_fallback: string | null
  design_json: Record<string, unknown> | null
  hero_image_url: string | null
  created_by: string | null
  created_at: string
}

export interface NewsletterSendJob {
  id: string
  campaign_id: string
  subscriber_id: string
  provider_message_id: string | null
  status: SendJobStatus
  attempts: number
  last_error: string | null
  scheduled_for: string | null
  sent_at: string | null
}

export interface NewsletterEmailEvent {
  id: string
  campaign_id: string | null
  subscriber_id: string | null
  event_type: EmailEventType
  metadata: Record<string, unknown> | null
  occurred_at: string
}

export interface CampaignStats {
  total: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
  unsubscribed: number
  open_rate: number
  click_rate: number
  bounce_rate: number
}

// API request/response shapes
export interface CreateCampaignInput {
  title: string
  subject: string
  preview_text?: string
  from_name?: string
  from_email?: string
  reply_to?: string
  list_id?: string
}

export interface UpdateCampaignVersionInput {
  campaign_id: string
  html?: string
  text_fallback?: string
  design_json?: Record<string, unknown>
  hero_image_url?: string
}

export interface ScheduleCampaignInput {
  campaign_id: string
  scheduled_at: string // ISO string
}

export interface TestSendInput {
  campaign_id: string
  to: string[]
}

export interface WebhookEvent {
  type: string
  created_at: string
  data: {
    email_id?: string
    from?: string
    to?: string | string[]
    subject?: string
    tags?: Record<string, string>
    bounce?: { type: string; message: string }
    click?: { link: string }
  }
}

// Provider abstraction
export interface EmailProviderSendInput {
  to: string
  from: string
  reply_to?: string
  subject: string
  html: string
  text: string
  headers?: Record<string, string>
  tags?: Record<string, string>
}

export interface EmailProviderSendResult {
  providerMessageId: string
}

export interface EmailProvider {
  send(input: EmailProviderSendInput): Promise<EmailProviderSendResult>
}
