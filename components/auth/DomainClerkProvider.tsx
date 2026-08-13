import { ClerkProvider } from '@clerk/nextjs'
import { absoluteApplicationUrl } from '@/lib/deployment'

export function ApplicationClerkProvider({ children }: { children: React.ReactNode }) {
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
