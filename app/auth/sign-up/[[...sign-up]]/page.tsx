import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { absoluteApplicationUrl, absoluteMarketingUrl, safeApplicationRedirect } from '@/lib/deployment'

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  const params = await searchParams
  const destination = safeApplicationRedirect(params.redirect_url)
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-5 py-12">
      <div className="w-full max-w-md">
        <Link href={absoluteMarketingUrl('/')} className="mb-8 flex items-center justify-center gap-2 text-lg font-semibold text-white">
          <Building2 className="h-5 w-5 text-emerald-400" /> MyBizz
        </Link>
        <SignUp
          path="/auth/sign-up"
          routing="path"
          signInUrl={absoluteApplicationUrl('/auth/login')}
          forceRedirectUrl={destination}
          appearance={{ elements: { rootBox: 'w-full', cardBox: 'w-full', card: 'w-full' } }}
        />
      </div>
    </main>
  )
}
