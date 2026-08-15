import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'
import {
  absoluteApplicationUrl,
  absoluteMarketingUrl,
  assertProductionEnvironment,
  isApplicationApi,
  isApplicationHost,
  isApplicationPage,
  isMarketingHost,
  isMarketingPage,
  getApplicationOrigin,
} from '@/lib/deployment'

const applicationAuthentication = clerkMiddleware(
  async (auth, request) => {
    const { pathname } = request.nextUrl
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/crm') || pathname.startsWith('/billing')) {
      const session = await auth()
      if (!session.userId) return session.redirectToSignIn({ returnBackUrl: request.url })
    }
  },
  (request) => ({
    authorizedParties: isApplicationHost(request.nextUrl.hostname) || process.env.VERCEL_ENV === 'production'
      ? [getApplicationOrigin()]
      : [request.nextUrl.origin],
    signInUrl: absoluteApplicationUrl('/auth/login'),
    signUpUrl: absoluteApplicationUrl('/auth/sign-up'),
  }),
)

/**
 * Keep Clerk completely off the public website's hot path. Marketing pages are
 * static and cacheable; running an authentication handshake for every image,
 * landing page and pricing visit added latency and spread an auth failure across
 * both domains. Clerk is invoked only where request-scoped auth() data is needed.
 */
export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  try {
    assertProductionEnvironment()
  } catch {
    return new NextResponse('Application configuration unavailable.', { status: 503 })
  }

  const hostname = request.headers.get('x-forwarded-host')
    ?? request.headers.get('host')
    ?? request.nextUrl.hostname
  const { pathname, search } = request.nextUrl

  if (isMarketingHost(hostname)) {
    if (isApplicationApi(pathname)) return new NextResponse('Not found', { status: 404 })
    if (isApplicationPage(pathname)) {
      return NextResponse.redirect(absoluteApplicationUrl(`${pathname}${search}`), 307)
    }
    return NextResponse.next()
  }

  if (isApplicationHost(hostname)) {
    if (isMarketingPage(pathname)) {
      return NextResponse.redirect(
        pathname === '/'
          ? absoluteApplicationUrl('/dashboard')
          : absoluteMarketingUrl(`${pathname}${search}`),
        307,
      )
    }

    // Stripe authenticates this endpoint with its signed webhook payload.
    if (pathname === '/api/billing/webhook') return NextResponse.next()
  }

  return applicationAuthentication(request, event)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
