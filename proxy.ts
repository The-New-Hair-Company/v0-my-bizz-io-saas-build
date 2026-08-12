import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware(
  () => {},
  (request) => ({
    authorizedParties: process.env.VERCEL_ENV === 'production'
      ? ['https://www.mybizz.io', 'https://mybizz.io']
      : [request.nextUrl.origin],
  }),
)

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
