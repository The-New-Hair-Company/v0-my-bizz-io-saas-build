import Link from 'next/link'
import { ArrowRight, Building2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PricingPage() {
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
            <Link href="/pricing" className="text-sm font-medium text-foreground">
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
            {'Simple, transparent pricing'}
          </h1>
          <p className="mb-8 text-lg text-muted-foreground text-balance leading-relaxed">
            {'Start free, upgrade when you need more. All plans include AI assistance and core features.'}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {/* Starter */}
          <div className="flex flex-col rounded-lg border border-border bg-card p-8">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-bold">{'Starter'}</h3>
              <p className="text-sm text-muted-foreground">{'Perfect for solo founders'}</p>
            </div>
            <div className="mb-6">
              <div className="mb-2 flex items-baseline">
                <span className="text-4xl font-bold">{'$29'}</span>
                <span className="ml-2 text-muted-foreground">{'/month'}</span>
              </div>
              <p className="text-sm text-muted-foreground">{'Billed monthly'}</p>
            </div>
            <Link href="/auth/sign-up" className="mb-6">
              <Button variant="outline" className="w-full">
                {'Start Free Trial'}
              </Button>
            </Link>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'1 organization'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'Unlimited AI chat messages'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'Deadline tracking & reminders'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'Document storage (1GB)'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'State-specific guidance'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'Email support'}</span>
              </li>
            </ul>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-lg border-2 border-primary bg-card p-8 shadow-lg">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
              {'Most Popular'}
            </div>
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-bold">{'Pro'}</h3>
              <p className="text-sm text-muted-foreground">{'For growing teams'}</p>
            </div>
            <div className="mb-6">
              <div className="mb-2 flex items-baseline">
                <span className="text-4xl font-bold">{'$99'}</span>
                <span className="ml-2 text-muted-foreground">{'/month'}</span>
              </div>
              <p className="text-sm text-muted-foreground">{'Billed monthly or $950/year'}</p>
            </div>
            <Link href="/auth/sign-up" className="mb-6">
              <Button className="w-full transition-all duration-200 hover:scale-105">
                {'Start Free Trial'}
              </Button>
            </Link>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="font-semibold">{'Everything in Starter, plus:'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'Up to 5 organizations'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'Team collaboration (up to 10 users)'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'Document storage (10GB)'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'AI document generation'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'Priority email support'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'Audit logs'}</span>
              </li>
            </ul>
          </div>

          {/* Enterprise */}
          <div className="flex flex-col rounded-lg border border-border bg-card p-8">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-bold">{'Enterprise'}</h3>
              <p className="text-sm text-muted-foreground">{'For large organizations'}</p>
            </div>
            <div className="mb-6">
              <div className="mb-2 flex items-baseline">
                <span className="text-4xl font-bold">{'Custom'}</span>
              </div>
              <p className="text-sm text-muted-foreground">{'Contact us for pricing'}</p>
            </div>
            <Link href="mailto:sales@mybizz.io" className="mb-6">
              <Button variant="outline" className="w-full">
                {'Contact Sales'}
              </Button>
            </Link>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="font-semibold">{'Everything in Pro, plus:'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'Unlimited organizations'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'Unlimited users'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'Custom storage limits'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'SSO & advanced security'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'Dedicated account manager'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'Custom integrations'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{'SLA & 24/7 phone support'}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
              {'Frequently asked questions'}
            </h2>
            <div className="space-y-8">
              <div>
                <h3 className="mb-2 text-lg font-semibold">{'What happens during the free trial?'}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {'You get full access to all Pro features for 14 days. No credit card required. After the trial, you can choose a plan or downgrade to Starter.'}
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold">{'Can I change plans later?'}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {'Yes, you can upgrade or downgrade at any time. Changes take effect on your next billing cycle.'}
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold">{'What payment methods do you accept?'}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {'We accept all major credit cards (Visa, Mastercard, American Express) and ACH for annual plans.'}
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold">{'Is my data secure?'}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {'Absolutely. We use bank-level encryption, regular security audits, and comply with SOC 2 standards. Your data is always encrypted at rest and in transit.'}
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold">{'Can I cancel anytime?'}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {'Yes, you can cancel anytime with no penalties. You'll have access until the end of your billing period.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl text-balance">
              {'Ready to get started?'}
            </h2>
            <p className="mb-8 text-lg text-muted-foreground text-balance">
              {'Try MyBizz free for 14 days. No credit card required.'}
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
