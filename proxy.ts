import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
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

export default clerkMiddleware(
  async (auth, request) => {
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
      return
    }

    if (isApplicationHost(hostname)) {
      if (isMarketingPage(pathname)) {
        if (pathname === '/') {
          const session = await auth()
          return NextResponse.redirect(
            absoluteApplicationUrl(session.userId ? '/dashboard' : '/auth/login'),
            307,
          )
        }
        return NextResponse.redirect(absoluteMarketingUrl(`${pathname}${search}`), 307)
      }

      if ((pathname.startsWith('/dashboard') || pathname.startsWith('/crm'))) {
        const session = await auth()
        if (!session.userId) return session.redirectToSignIn({ returnBackUrl: request.url })
      }
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

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
