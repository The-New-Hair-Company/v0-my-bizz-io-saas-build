import type { EmailProvider, EmailProviderSendInput, EmailProviderSendResult } from '@/types/newsletter'

class ResendEmailProvider implements EmailProvider {
  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async send(input: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    const body: Record<string, unknown> = {
      from: input.from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }

    if (input.reply_to) body.reply_to = input.reply_to
    if (input.headers) body.headers = input.headers
    if (input.tags) {
      body.tags = Object.entries(input.tags).map(([name, value]) => ({ name, value }))
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(`Resend API error ${res.status}: ${(err as { message?: string }).message ?? res.statusText}`)
    }

    const data = await res.json() as { id: string }
    return { providerMessageId: data.id }
  }
}

export function getEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY environment variable is not set')
  return new ResendEmailProvider(apiKey)
}
