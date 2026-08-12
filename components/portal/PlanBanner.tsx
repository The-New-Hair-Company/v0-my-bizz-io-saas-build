import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export function PlanBanner({ used, limit }: { used: number; limit: number }) {
  if (limit > 3) return null
  const remaining = Math.max(limit - used, 0)
  return <div className="border-b border-orange-200 bg-orange-50 px-4 py-2.5 text-orange-950">
    <div className="mx-auto flex max-w-[1650px] flex-col justify-between gap-2 text-xs sm:flex-row sm:items-center">
      <div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-lg bg-[#ff6600] text-white"><Sparkles className="h-3 w-3" /></span><span><strong>Explorer workspace:</strong> {remaining} of {limit} Intelligence HQ run{limit === 1 ? '' : 's'} remaining this month.</span></div>
      <Link href="/pricing?source=dashboard-banner" className="inline-flex items-center font-semibold text-orange-700 hover:text-orange-900">Compare plans <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
    </div>
  </div>
}
