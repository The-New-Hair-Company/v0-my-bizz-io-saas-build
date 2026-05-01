// app/newsletter/[slug]/page.tsx
// Public web-hosted version of each campaign — shareable, SEO-friendly.
// Rendered server-side from stored campaign HTML.

import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

async function fetchCampaign(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data } = await supabase
    .from('newsletter_campaigns')
    .select('id, title, subject, preview_text, sent_at, newsletter_campaign_versions(html, hero_image_url)')
    .eq('slug', slug)
    .eq('status', 'sent') // only show sent campaigns publicly
    .order('created_at', { referencedTable: 'newsletter_campaign_versions', ascending: false })
    .limit(1, { referencedTable: 'newsletter_campaign_versions' })
    .single()

  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const campaign = await fetchCampaign(slug)
  if (!campaign) return { title: 'Newsletter | Online2Day' }
  return {
    title: `${campaign.subject} | Online2Day Newsletter`,
    description: campaign.preview_text ?? '',
    openGraph: {
      title: campaign.subject,
      description: campaign.preview_text ?? '',
      images: campaign.newsletter_campaign_versions?.[0]?.hero_image_url
        ? [{ url: campaign.newsletter_campaign_versions[0].hero_image_url }]
        : [],
    },
  }
}

export default async function NewsletterWebVersionPage({ params }: Props) {
  const { slug } = await params
  const campaign = await fetchCampaign(slug)
  if (!campaign) notFound()

  const version = campaign.newsletter_campaign_versions?.[0]
  const htmlBody = version?.html ?? '<p>No content available.</p>'
  const heroUrl = version?.hero_image_url

  const sentDate = campaign.sent_at
    ? new Date(campaign.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f1f5f9',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        padding: '32px 16px',
      }}
    >
      {/* Top bar */}
      <div style={{ maxWidth: 600, margin: '0 auto 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="https://online2day.co.uk" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>
          ← online2day.co.uk
        </Link>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Web version</span>
      </div>

      {/* Email container */}
      <div
        style={{
          maxWidth: 600,
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {/* Brand bar */}
        <div style={{ background: '#05070b', padding: '20px 32px' }}>
          <div style={{ color: '#3b82f6', fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em' }}>Online2Day</div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>Helping businesses get found online</div>
        </div>

        {heroUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroUrl} alt={campaign.subject} style={{ width: '100%', display: 'block' }} />
        )}

        <div style={{ padding: '32px 32px 0' }}>
          {sentDate && (
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{sentDate}</div>
          )}
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 16px', lineHeight: 1.3 }}>
            {campaign.subject}
          </h1>
        </div>

        {/* Body — sanitised HTML from campaign version */}
        <div
          style={{ padding: '0 32px 32px', fontSize: 15, lineHeight: 1.7, color: '#334155' }}
          dangerouslySetInnerHTML={{ __html: htmlBody.replace(/{{[^}]+}}/g, '') }}
        />

        {/* Footer */}
        <div
          style={{
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            padding: '24px 32px',
            textAlign: 'center',
            fontSize: 12,
            color: '#94a3b8',
          }}
        >
          <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>Online2Day</div>
          <div style={{ marginBottom: 12 }}>Helping UK businesses get found, seen, and chosen online.</div>
          <Link href="https://online2day.co.uk" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Visit Website
          </Link>
          {' · '}
          <Link href="https://online2day.co.uk/privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}
