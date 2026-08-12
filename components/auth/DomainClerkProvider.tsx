import { ClerkProvider } from '@clerk/nextjs'
import { headers } from 'next/headers'
import {
  absoluteApplicationUrl,
  isMarketingHost,
} from '@/lib/deployment'

export async function DomainClerkProvider({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')

  // The marketing site has no authentication dependency. Keeping Clerk off
  // these hosts prevents auth cookies and client configuration crossing the
  // public/application boundary.
  if (isMarketingHost(host)) return children

  return (
    <ClerkProvider
      signInUrl={absoluteApplicationUrl('/auth/login')}
      signUpUrl={absoluteApplicationUrl('/auth/sign-up')}
      signInFallbackRedirectUrl={absoluteApplicationUrl('/dashboard')}
      signUpFallbackRedirectUrl={absoluteApplicationUrl('/dashboard')}
    >
      {children}
    </ClerkProvider>
  )
}
