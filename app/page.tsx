import Link from 'next/link'
import { ArrowRight, Check, FileCheck2, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PublicAssistant } from '@/components/marketing/PublicAssistant'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-orange-950">
      <nav className="sticky top-0 z-50 border-b border-orange-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3" aria-label="MyBizz home">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ff6600] text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-base font-black tracking-tight">mybizz.io</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" className="hidden text-orange-950 hover:bg-orange-50 sm:inline-flex" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button variant="ghost" className="text-orange-950 hover:bg-orange-50" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button className="bg-[#ff6600] text-white hover:bg-[#e95d00]" asChild>
              <Link href="/auth/sign-up">Start free</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden border-b border-orange-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,102,0,.13),transparent_28%),radial-gradient(circle_at_85%_80%,rgba(255,153,51,.11),transparent_28%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-14 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:py-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-800">
                <MessageCircle className="h-3.5 w-3.5" /> Work starts with a conversation
              </div>
              <h1 className="mt-6 text-5xl font-black leading-[.96] tracking-[-.06em] sm:text-6xl xl:text-7xl">
                Tell us what you need.
                <span className="mt-2 block text-[#ff6600]">MyBizz makes it clear.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-orange-950/65">
                Ask a question, share a brief or bring a document. MyBizz gives you a useful answer and turns the next step into organised work.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" className="h-12 bg-[#ff6600] px-6 text-white hover:bg-[#e95d00]" asChild>
                  <a href="#ask-mybizz">Try the chat <ArrowRight className="ml-2 h-4 w-4" /></a>
                </Button>
                <Button size="lg" variant="outline" className="h-12 border-orange-200 px-6 text-orange-950 hover:bg-orange-50" asChild>
                  <Link href="/auth/sign-up">Create a workspace</Link>
                </Button>
              </div>
              <div className="mt-8 space-y-2 text-sm text-orange-950/55">
                {['No card to start', 'Answers show their source', 'Each client workspace stays separate'].map((item) => (
                  <p key={item} className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-orange-100 text-[#ff6600]"><Check className="h-3 w-3" /></span>
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div id="ask-mybizz" className="scroll-mt-24">
              <PublicAssistant />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#ff6600]">Simple on purpose</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl">One conversation. Three useful outcomes.</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-3xl border border-orange-100 bg-white p-7 shadow-[0_18px_55px_-42px_rgba(154,52,0,.5)]">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-[#ff6600]"><step.icon className="h-5 w-5" /></span>
                  <span className="text-xs font-black text-orange-300">0{index + 1}</span>
                </div>
                <h3 className="mt-6 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-orange-950/55">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-orange-200 bg-orange-50">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 px-5 py-14 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-bold text-[#ff6600]">Ready when you are</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">Bring one real question.</h2>
              <p className="mt-2 text-sm text-orange-950/55">Your first workspace is free. Start with the work already on your mind.</p>
            </div>
            <Button size="lg" className="h-12 bg-[#ff6600] px-6 text-white hover:bg-[#e95d00]" asChild>
              <Link href="/auth/sign-up">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-8 text-xs text-orange-950/45 sm:flex-row">
          <span>© 2026 MyBizz</span>
          <span>Clear answers. Organised action.</span>
        </div>
      </footer>
    </div>
  )
}

const steps = [
  {
    title: 'Ask naturally',
    description: 'Describe the goal in your own words. There is no giant form to decode before you can begin.',
    icon: MessageCircle,
  },
  {
    title: 'See the evidence',
    description: 'The answer is grounded in approved knowledge and your workspace documents, with the source kept visible.',
    icon: FileCheck2,
  },
  {
    title: 'Move with confidence',
    description: 'Turn the answer into a brief, task or decision while every client account remains securely separated.',
    icon: ShieldCheck,
  },
]
