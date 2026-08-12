import { Badge } from '@/components/ui/badge'

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  badge,
}: {
  eyebrow: string
  title: string
  description: string
  children?: React.ReactNode
  badge?: string
}) {
  return (
    <header className="border-b border-orange-100 bg-white px-5 py-7 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--agency-accent)]">{eyebrow}</p>
            {badge && <Badge className="border-0 bg-orange-50 text-orange-800 hover:bg-orange-50">{badge}</Badge>}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-orange-950 sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-orange-950/55">{description}</p>
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </header>
  )
}

