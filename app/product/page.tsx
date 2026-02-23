import Link from 'next/link'
import { ArrowRight, Building2, MessageSquare, FileText, Calendar, Sparkles, Clock, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <Building2 className="h-6 w-6 text-primary" />
            <span>MyBizz</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/product" className="text-sm font-medium text-foreground">
              Product
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link href="/resources" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Resources
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm" className="transition-all duration-200 hover:scale-105">
                Start Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-balance md:text-5xl">
            {'Compliance automation built for startups'}
          </h1>
          <p className="mb-8 text-lg text-muted-foreground text-balance leading-relaxed">
            {'MyBizz combines AI assistance, deadline tracking, and document management to keep your startup compliant without the hassle.'}
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="transition-all duration-200 hover:scale-105">
              {'Try MyBizz Free'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">{'How it works'}</h2>
            <p className="text-lg text-muted-foreground text-balance">{'Three simple steps to compliance peace of mind'}</p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {'1'}
              </div>
              <h3 className="mb-3 text-xl font-semibold">{'Set up your company'}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {'Tell our AI about your business. It extracts key details and builds your compliance profile automatically.'}
              </p>
            </div>
            <div className="text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {'2'}
              </div>
              <h3 className="mb-3 text-xl font-semibold">{'Get personalized guidance'}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {'Receive state-specific deadlines, filing requirements, and reminders tailored to your business.'}
              </p>
            </div>
            <div className="text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {'3'}
              </div>
              <h3 className="mb-3 text-xl font-semibold">{'Stay on track'}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {'Track tasks, store documents, and chat with AI anytime you have compliance questions.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Deep Dive */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">{'Powerful features'}</h2>
          </div>
          <div className="mx-auto max-w-6xl space-y-20">
            <FeatureShowcase
              icon={<MessageSquare className="h-10 w-10" />}
              title="AI Compliance Assistant"
              description="Get instant answers to compliance questions. Our AI understands state regulations, filing requirements, and deadlines. Ask anything from entity formation to annual reports."
              features={[
                'Natural language chat interface',
                'Extracts facts automatically from conversations',
                'State and industry-specific guidance',
                '24/7 availability',
              ]}
              reverse={false}
            />
            <FeatureShowcase
              icon={<Calendar className="h-10 w-10" />}
              title="Smart Deadline Tracking"
              description="Never miss a filing deadline again. See all your obligations in calendar, timeline, and list views. Get intelligent reminders based on your schedule."
              features={[
                'Multiple view options (calendar, timeline, list)',
                'Customizable notifications',
                'Priority flagging for critical filings',
                'Historical tracking',
              ]}
              reverse={true}
            />
            <FeatureShowcase
              icon={<FileText className="h-10 w-10" />}
              title="Document Management"
              description="Store incorporation documents, bylaws, contracts, and filing confirmations in one secure place. Upload documents or let AI generate forms for you."
              features={[
                'Secure cloud storage',
                'Organized by type and date',
                'AI-powered document generation',
                'Easy sharing with team members',
              ]}
              reverse={false}
            />
          </div>
        </div>
      </section>

      {/* Why MyBizz */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">{'Why startups choose MyBizz'}</h2>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6">
              <Clock className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">{'Save time'}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {'Spend minutes, not hours, on compliance. Let AI handle the research and reminders.'}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <Zap className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">{'Reduce errors'}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {'Automated tracking and AI guidance help you avoid costly mistakes and missed deadlines.'}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <Users className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">{'Scale with confidence'}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {'Add team members, track multiple entities, and stay compliant as you grow.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl text-balance">
              {'Start your free trial today'}
            </h2>
            <p className="mb-8 text-lg text-muted-foreground text-balance">
              {'No credit card required. 14-day free trial. Cancel anytime.'}
            </p>
            <Link href="/auth/sign-up">
              <Button size="lg" className="transition-all duration-200 hover:scale-105">
                {'Get Started Free'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Building2 className="h-6 w-6 text-primary" />
                <span>MyBizz</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {'AI-powered compliance for startups'}
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold">Product</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="/product" className="transition-colors hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="transition-colors hover:text-foreground">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold">Resources</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="/resources" className="transition-colors hover:text-foreground">
                    All Resources
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold">Legal</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="transition-colors hover:text-foreground">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="transition-colors hover:text-foreground">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            {'© 2026 MyBizz. All rights reserved.'}
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureShowcase({
  icon,
  title,
  description,
  features,
  reverse,
}: {
  icon: React.ReactNode
  title: string
  description: string
  features: string[]
  reverse: boolean
}) {
  return (
    <div className={`grid gap-12 md:grid-cols-2 md:items-center ${reverse ? 'md:flex-row-reverse' : ''}`}>
      <div className={reverse ? 'md:order-2' : ''}>
        <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-4 text-primary">
          {icon}
        </div>
        <h3 className="mb-4 text-2xl font-bold">{title}</h3>
        <p className="mb-6 text-muted-foreground leading-relaxed">{description}</p>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <span className="text-sm leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={`rounded-lg border border-border bg-muted/50 p-8 ${reverse ? 'md:order-1' : ''}`}>
        <div className="flex aspect-video items-center justify-center text-muted-foreground">
          <span className="text-sm">{'[Feature Screenshot]'}</span>
        </div>
      </div>
    </div>
  )
}
