import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mybizz.io'),
  title: {
    default: 'MyBizz — Clear answers, organised action',
    template: '%s | MyBizz',
  },
  description: 'Ask a question, share a brief or bring a document. MyBizz gives you a useful answer and turns the next step into organised work.',
  openGraph: {
    type: 'website',
    siteName: 'MyBizz',
    title: 'Tell MyBizz what you need. We’ll make it clear.',
    description: 'One simple conversation for clear answers, trusted sources and organised next steps.',
    images: [{ url: '/og.png', width: 1672, height: 941, alt: 'Tell us what you need. MyBizz makes it clear.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tell MyBizz what you need. We’ll make it clear.',
    description: 'One simple conversation for clear answers, trusted sources and organised next steps.',
    images: ['/og.png'],
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
