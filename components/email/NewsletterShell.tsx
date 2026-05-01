// components/email/NewsletterShell.tsx
// Branded React Email shell — renders email-safe HTML for all newsletter campaigns.
// 600px wide, image-led hero, responsive, Gmail/Outlook/Apple Mail tested.

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface NewsletterShellProps {
  subject: string
  previewText?: string
  heroImageUrl?: string
  bodyHtml?: string
  unsubscribeUrl: string
  webVersionUrl: string
}

const brand = {
  blue: '#3b82f6',
  dark: '#05070b',
  bg: '#f1f5f9',
  text: '#1e293b',
  muted: '#64748b',
}

export function NewsletterShell({
  subject,
  previewText = '',
  heroImageUrl,
  bodyHtml = '',
  unsubscribeUrl,
  webVersionUrl,
}: NewsletterShellProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      </Head>
      {previewText && <Preview>{previewText}</Preview>}
      <Body
        style={{
          backgroundColor: brand.bg,
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          margin: 0,
          padding: '32px 0',
        }}
      >
        {/* Web version + brand header */}
        <Section
          style={{
            maxWidth: 600,
            margin: '0 auto',
            textAlign: 'center',
            paddingBottom: 8,
          }}
        >
          <Text style={{ fontSize: 12, color: brand.muted, margin: 0 }}>
            <Link href={webVersionUrl} style={{ color: brand.muted }}>
              View in browser
            </Link>
          </Text>
        </Section>

        <Container
          style={{
            maxWidth: 600,
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          {/* Brand bar */}
          <Section
            style={{
              backgroundColor: brand.dark,
              padding: '20px 32px',
              textAlign: 'left',
            }}
          >
            <Text
              style={{
                color: brand.blue,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-0.04em',
                margin: 0,
              }}
            >
              Online2Day
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0 0' }}>
              Helping businesses get found online
            </Text>
          </Section>

          {/* Hero image */}
          {heroImageUrl && (
            <Section style={{ padding: 0 }}>
              <Img
                src={heroImageUrl}
                alt={subject}
                width={600}
                style={{ display: 'block', width: '100%', maxWidth: 600 }}
              />
            </Section>
          )}

          {/* Subject line */}
          <Section style={{ padding: '32px 32px 0' }}>
            <Heading
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: brand.text,
                margin: '0 0 16px',
                lineHeight: 1.3,
              }}
            >
              {subject}
            </Heading>
          </Section>

          {/* Body content — injected from design_json compiled HTML */}
          <Section
            style={{ padding: '0 32px 32px' }}
            dangerouslySetInnerHTML={bodyHtml ? { __html: bodyHtml } : undefined}
          />

          <Hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: 0 }} />

          {/* Footer */}
          <Section
            style={{
              backgroundColor: '#f8fafc',
              padding: '24px 32px',
              textAlign: 'center',
            }}
          >
            <Text style={{ fontSize: 13, color: brand.text, fontWeight: 600, margin: '0 0 4px' }}>
              Online2Day
            </Text>
            <Text style={{ fontSize: 12, color: brand.muted, margin: '0 0 16px' }}>
              Helping UK businesses get found, seen, and chosen online.
            </Text>

            <Text style={{ fontSize: 11, color: brand.muted, margin: 0 }}>
              You are receiving this because you subscribed to Online2Day updates.{' '}
              <Link href={unsubscribeUrl} style={{ color: brand.blue }}>
                Unsubscribe
              </Link>{' '}
              ·{' '}
              <Link href="https://online2day.co.uk/privacy" style={{ color: brand.muted }}>
                Privacy Policy
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default NewsletterShell
