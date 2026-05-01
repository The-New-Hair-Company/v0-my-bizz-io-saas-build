import type { NewsletterCampaignVersion } from '@/types/newsletter'

interface RenderParams {
  version: NewsletterCampaignVersion
  subject: string
  previewText?: string | null
  unsubscribeUrl: string
  webVersionUrl: string
  recipientEmail: string
}

export async function renderCampaignEmail(params: RenderParams): Promise<{ html: string; text: string }> {
  const { version, subject, previewText, unsubscribeUrl, webVersionUrl } = params

  const bodyHtml = version.html ?? '<p>No content available for this email.</p>'
  const textContent = version.text_fallback ?? stripHtml(bodyHtml)

  const html = buildEmailHtml({
    subject,
    previewText,
    bodyHtml,
    heroImageUrl: version.hero_image_url,
    unsubscribeUrl,
    webVersionUrl,
  })

  const text = buildPlainText({ textContent, unsubscribeUrl, webVersionUrl })

  return { html, text }
}

function buildEmailHtml(params: {
  subject: string
  previewText?: string | null
  bodyHtml: string
  heroImageUrl?: string | null
  unsubscribeUrl: string
  webVersionUrl: string
}): string {
  const { subject, previewText, bodyHtml, heroImageUrl, unsubscribeUrl, webVersionUrl } = params

  const previewSnippet = previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(previewText)}</div>`
    : ''

  const heroBlock = heroImageUrl
    ? `<tr><td style="padding:0;"><img src="${escapeHtml(heroImageUrl)}" alt="" width="600" style="width:100%;max-width:600px;display:block;border:0;" /></td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${previewSnippet}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f4f5;">
    <tr><td style="padding:24px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" align="center" style="margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        ${heroBlock}
        <tr><td style="padding:32px 40px;color:#1a1a1a;font-size:16px;line-height:1.65;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 40px;background-color:#f9f9fb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;line-height:1.6;">
          <p style="margin:0 0 6px;">
            <a href="${escapeHtml(webVersionUrl)}" style="color:#6b7280;text-decoration:underline;">View in browser</a>
          </p>
          <p style="margin:0;">
            <a href="${escapeHtml(unsubscribeUrl)}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildPlainText(params: {
  textContent: string
  unsubscribeUrl: string
  webVersionUrl: string
}): string {
  return `${params.textContent}

---
View in browser: ${params.webVersionUrl}
Unsubscribe: ${params.unsubscribeUrl}`
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
