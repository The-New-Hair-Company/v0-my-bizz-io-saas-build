import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { DomainClerkProvider } from '@/components/auth/DomainClerkProvider'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mybizz.io'),
  title: {
    default: 'MyBizz — Intelligence OS for digital businesses',
    template: '%s | MyBizz',
  },
  description: 'Tenant-secured operating intelligence, grounded assistants and an Agency OS that turns live business evidence into the next best move.',
  openGraph: {
    type: 'website',
    siteName: 'MyBizz',
    title: 'MyBizz — Your agency. Now intelligent.',
    description: 'Explainable operating intelligence with real evidence, hard tenant boundaries and zero paid model tokens.',
    images: [{ url: '/mybizz-intelligence-social.png', width: 1672, height: 941, alt: 'Abstract orange and white MyBizz intelligence engine' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyBizz — Your agency. Now intelligent.',
    description: 'Explainable operating intelligence with real evidence and zero paid model tokens.',
    images: ['/mybizz-intelligence-social.png'],
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
    <DomainClerkProvider>
      <html lang="en">
        <body className="font-sans antialiased">
          {children}
          <Analytics />
        </body>
      </html>
    </DomainClerkProvider>
  )
}
