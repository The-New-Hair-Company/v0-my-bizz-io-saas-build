// app/unsubscribe/[token]/page.tsx
// One-click unsubscribe page — RFC 8058 compliant.
// Processes the token on GET (auto-confirmed) and shows confirmation.

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

interface Props {
  params: Promise<{ token: string }>
  searchParams: Promise<{ c?: string }>
}

async function processUnsubscribe(token: string, campaignId?: string): Promise<'ok' | 'already' | 'invalid'> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const crypto = await import('crypto')
  const hash = crypto.createHash('sha256').update(token).digest('hex')

  const { data: tokenRow, error } = await supabase
    .from('newsletter_unsubscribe_tokens')
    .select('id, subscriber_id, used_at, expires_at')
    .eq('token_hash', hash)
    .single()

  if (error || !tokenRow) return 'invalid'
  if (tokenRow.used_at) return 'already'
  if (new Date(tokenRow.expires_at) < new Date()) return 'invalid'

  // Mark token used
  await supabase
    .from('newsletter_unsubscribe_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenRow.id)

  // Update subscriber status
  await supabase
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed', updated_at: new Date().toISOString() })
    .eq('id', tokenRow.subscriber_id)

  // Add to suppression list
  const { data: sub } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .eq('id', tokenRow.subscriber_id)
    .single()

  if (sub?.email) {
    await supabase.from('newsletter_suppression_list').upsert({
      email: sub.email,
      reason: 'unsubscribe',
      source: 'one-click-link',
    }, { onConflict: 'email' })
  }

  // Log event
  await supabase.from('newsletter_email_events').insert({
    campaign_id: campaignId ?? null,
    subscriber_id: tokenRow.subscriber_id,
    event_type: 'unsubscribed',
    metadata: { source: 'one-click-link', token_id: tokenRow.id },
  })

  return 'ok'
}

export default async function UnsubscribePage({ params, searchParams }: Props) {
  const { token } = await params
  const { c: campaignId } = await searchParams

  const result = await processUnsubscribe(token, campaignId)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #05070b 0%, #0d1526 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        padding: '24px',
      }}
    >
      <div
        style={{
          background: 'rgba(11,17,28,0.95)',
          border: '1px solid rgba(116,147,196,0.2)',
          borderRadius: 16,
          padding: '48px 40px',
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {result === 'ok' && (
          <>
            <CheckCircle2 size={48} color="#22c55e" style={{ marginBottom: 20 }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f5f8ff', margin: '0 0 12px' }}>
              You&apos;ve been unsubscribed
            </h1>
            <p style={{ fontSize: 15, color: '#9aa5b6', lineHeight: 1.6, margin: '0 0 28px' }}>
              You won&apos;t receive any more newsletters from Online2Day. This change takes effect immediately.
            </p>
            <p style={{ fontSize: 13, color: '#738094', margin: '0 0 24px' }}>
              Changed your mind? You can re-subscribe on our website at any time.
            </p>
          </>
        )}

        {result === 'already' && (
          <>
            <CheckCircle2 size={48} color="#64748b" style={{ marginBottom: 20 }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f5f8ff', margin: '0 0 12px' }}>
              Already unsubscribed
            </h1>
            <p style={{ fontSize: 15, color: '#9aa5b6', lineHeight: 1.6, margin: '0 0 28px' }}>
              You were already removed from our mailing list. You won&apos;t receive further emails.
            </p>
          </>
        )}

        {result === 'invalid' && (
          <>
            <AlertTriangle size={48} color="#f59e0b" style={{ marginBottom: 20 }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f5f8ff', margin: '0 0 12px' }}>
              Link expired or invalid
            </h1>
            <p style={{ fontSize: 15, color: '#9aa5b6', lineHeight: 1.6, margin: '0 0 28px' }}>
              This unsubscribe link has expired or is invalid. If you need to unsubscribe, please contact us directly.
            </p>
          </>
        )}

        <Link
          href="https://online2day.co.uk"
          style={{
            display: 'inline-block',
            padding: '12px 28px',
            borderRadius: 8,
            background: 'rgba(37,99,235,0.2)',
            border: '1px solid rgba(59,130,246,0.3)',
            color: '#8ab4ff',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ← Return to Online2Day
        </Link>
      </div>
    </div>
  )
}
