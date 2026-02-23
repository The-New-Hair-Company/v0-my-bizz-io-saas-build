import Link from 'next/link'
import { ArrowRight, CheckCircle2, MessageSquare, FileText, Calendar, Shield, Sparkles, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
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
            <Link href="/product" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>AI-powered compliance automation</span>
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-balance md:text-6xl md:leading-tight">
            {'Stay compliant. '}
            <span className="text-primary">Focus on building.</span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground text-balance md:text-xl leading-relaxed">
            {'MyBizz helps startups manage regulatory filings, deadlines, and documents with AI. '} 
            {'Stop worrying about compliance and focus on what matters.'}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/sign-up">
              <Button size="lg" className="w-full transition-all duration-200 hover:scale-105 sm:w-auto">
                {'Get Started Free'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/product">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {'See How It Works'}
              </Button>
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Free 14-day trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              {'Everything you need for compliance'}
            </h2>
            <p className="text-lg text-muted-foreground text-balance">
              {'Powerful features designed for growing startups'}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<MessageSquare className="h-8 w-8" />}
              title="AI Assistant"
              description="Chat with our AI to get instant answers about compliance requirements, filing deadlines, and regulatory changes."
            />
            <FeatureCard
              icon={<FileText className="h-8 w-8" />}
              title="Document Management"
              description="Store and organize all your compliance documents in one secure place. Generate forms automatically with AI."
            />
            <FeatureCard
              icon={<Calendar className="h-8 w-8" />}
              title="Deadline Tracking"
              description="Never miss a filing deadline again. Get smart reminders and track all your compliance obligations in one view."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="State-Specific Guidance"
              description="Get tailored compliance guidance for your state and industry. Stay up to date with local regulations."
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="Automated Workflows"
              description="Let AI extract key information from conversations and documents to keep your company profile current."
            />
            <FeatureCard
              icon={<Building2 className="h-8 w-8" />}
              title="Company Dashboard"
              description="See all your compliance status at a glance. Track tasks, deadlines, and documents in one unified dashboard."
            />
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-12 text-3xl font-bold tracking-tight md:text-4xl text-balance">
              {'Trusted by ambitious startups'}
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-6 transition-all duration-200 hover:border-primary/50">
                <div className="mb-4 text-4xl font-bold text-primary">{'98%'}</div>
                <div className="text-sm text-muted-foreground">{'On-time filings'}</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-6 transition-all duration-200 hover:border-primary/50">
                <div className="mb-4 text-4xl font-bold text-primary">{'<5min'}</div>
                <div className="text-sm text-muted-foreground">{'Average response time'}</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-6 transition-all duration-200 hover:border-primary/50">
                <div className="mb-4 text-4xl font-bold text-primary">{'24/7'}</div>
                <div className="text-sm text-muted-foreground">{'AI assistance available'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl text-balance">
              {'Ready to simplify compliance?'}
            </h2>
            <p className="mb-8 text-lg text-muted-foreground text-balance">
              {'Join hundreds of startups staying compliant with MyBizz. Start your free trial today.'}
            </p>
            <Link href="/auth/sign-up">
              <Button size="lg" className="transition-all duration-200 hover:scale-105">
                {'Start Free Trial'}
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
                <li>
                  <Link href="/auth/sign-up" className="transition-colors hover:text-foreground">
                    Sign up
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
                <li>
                  <Link href="/resources/guides" className="transition-colors hover:text-foreground">
                    Guides
                  </Link>
                </li>
                <li>
                  <Link href="/resources/blog" className="transition-colors hover:text-foreground">
                    Blog
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

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group rounded-lg border border-border bg-card p-6 transition-all duration-200 hover:border-primary/50 hover:shadow-lg">
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary transition-all duration-200 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
