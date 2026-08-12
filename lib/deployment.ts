const DEFAULT_APPLICATION_ORIGIN = 'https://app.mybizz.io'
const DEFAULT_MARKETING_ORIGIN = 'https://www.mybizz.io'

const MARKETING_HOSTS = new Set(['mybizz.io', 'www.mybizz.io'])
const APPLICATION_HOSTS = new Set(['app.mybizz.io'])

const APPLICATION_PAGE_PREFIXES = ['/dashboard', '/crm', '/auth']
const APPLICATION_API_PREFIXES = [
  '/api/ai',
  '/api/chat',
  '/api/documents',
  '/api/portal',
  '/api/newsletters/save',
  '/api/newsletters/schedule',
  '/api/newsletters/test',
]
const MARKETING_PAGE_PREFIXES = ['/product', '/pricing', '/start', '/contact', '/newsletter', '/unsubscribe']

function normalizedHostname(hostname: string | null | undefined) {
  return (hostname ?? '').split(':')[0].trim().toLowerCase()
}

function normalizedOrigin(value: string | undefined, fallback: string) {
  const candidate = value?.trim() || fallback
  const url = new URL(candidate)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Deployment origins must use HTTP or HTTPS.')
  return url.origin
}

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function getApplicationOrigin() {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production' && process.env.VERCEL_URL) {
    return normalizedOrigin(`https://${process.env.VERCEL_URL}`, DEFAULT_APPLICATION_ORIGIN)
  }
  return normalizedOrigin(process.env.NEXT_PUBLIC_APP_URL, DEFAULT_APPLICATION_ORIGIN)
}

export function getMarketingOrigin() {
  return normalizedOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_MARKETING_URL, DEFAULT_MARKETING_ORIGIN)
}

export function isMarketingHost(hostname: string | null | undefined) {
  return MARKETING_HOSTS.has(normalizedHostname(hostname))
}

export function isApplicationHost(hostname: string | null | undefined) {
  return APPLICATION_HOSTS.has(normalizedHostname(hostname))
}

export function isApplicationPage(pathname: string) {
  return matchesPrefix(pathname, APPLICATION_PAGE_PREFIXES)
}

export function isApplicationApi(pathname: string) {
  return matchesPrefix(pathname, APPLICATION_API_PREFIXES)
}

export function isMarketingPage(pathname: string) {
  return pathname === '/' || matchesPrefix(pathname, MARKETING_PAGE_PREFIXES)
}

export function absoluteApplicationUrl(pathname = '/') {
  return new URL(pathname, `${getApplicationOrigin()}/`).toString()
}

export function absoluteMarketingUrl(pathname = '/') {
  return new URL(pathname, `${getMarketingOrigin()}/`).toString()
}

export function assertProductionEnvironment() {
  if (process.env.VERCEL_ENV !== 'production') return

  const required = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ADMIN_EMAILS',
  ] as const
  const missing = required.filter((name) => !process.env[name]?.trim())
  if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(', ')}`)

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_')) {
    throw new Error('Production requires a Clerk production publishable key.')
  }
  if (!process.env.CLERK_SECRET_KEY?.startsWith('sk_live_')) {
    throw new Error('Production requires a Clerk production secret key.')
  }
  if (new URL(getApplicationOrigin()).hostname !== 'app.mybizz.io') {
    throw new Error('NEXT_PUBLIC_APP_URL must be https://app.mybizz.io in production.')
  }
  if (!MARKETING_HOSTS.has(new URL(getMarketingOrigin()).hostname)) {
    throw new Error('NEXT_PUBLIC_SITE_URL must use mybizz.io or www.mybizz.io in production.')
  }
}
