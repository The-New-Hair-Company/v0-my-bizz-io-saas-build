import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { Building2, ShieldCheck } from 'lucide-react'
import { absoluteApplicationUrl, absoluteMarketingUrl, safeApplicationRedirect } from '@/lib/deployment'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  const params = await searchParams
  const destination = safeApplicationRedirect(params.redirect_url)
  return (
    <main className="grid min-h-screen bg-[#07111f] lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden border-r border-white/10 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,211,176,0.18),transparent_34%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.14),transparent_30%)]" />
        <Link href={absoluteMarketingUrl('/')} className="relative flex items-center gap-3 text-lg font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-slate-950">
            <Building2 className="h-5 w-5" />
          </span>
          MyBizz
        </Link>
        <div className="relative max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure agency operations
          </div>
          <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
            Every client account, project signal and next move—one command centre.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Built for high-velocity web teams that need clarity from first brief to launch.
          </p>
        </div>
        <p className="relative text-sm text-slate-500">Protected by Clerk and tenant-scoped database policies.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-white lg:hidden">
            <Link href={absoluteMarketingUrl('/')} className="flex items-center gap-2 font-semibold"><Building2 className="h-5 w-5 text-emerald-400" /> MyBizz</Link>
          </div>
          <SignIn
            path="/auth/login"
            routing="path"
            signUpUrl={absoluteApplicationUrl('/auth/sign-up')}
            forceRedirectUrl={destination}
            appearance={{
              elements: {
                rootBox: 'w-full',
                cardBox: 'w-full shadow-2xl shadow-black/30',
                card: 'w-full border border-white/10 bg-white',
              },
            }}
          />
        </div>
      </section>
    </main>
  )
}
