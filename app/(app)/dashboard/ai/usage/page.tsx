'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Zap, MessageSquare, DollarSign, TrendingUp } from 'lucide-react'

type UsageDay = {
  date: string
  tokens_in: number
  tokens_out: number
  cost_est_usd: number
  requests: number
}

type Totals = {
  tokens_in: number
  tokens_out: number
  cost_est_usd: number
  requests: number
}

type Limits = {
  daily_tokens_limit: number
  monthly_tokens_limit: number
  agents_allowed: string[]
} | null

export default function AIUsagePage() {
  const [daily, setDaily] = useState<UsageDay[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [limits, setLimits] = useState<Limits>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: membership } = await supabase
        .from('members')
        .select('organization_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .single()

      if (!membership) return

      const res = await fetch(
        `/api/ai/usage?organizationId=${membership.organization_id}&days=30`,
      )
      const json = await res.json()
      setDaily(json.daily ?? [])
      setTotals(json.totals ?? null)
      setLimits(json.limits ?? null)
      setLoading(false)
    }
    load()
  }, [])

  const chartData = daily.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    tokens: d.tokens_in + d.tokens_out,
    requests: d.requests,
  }))

  const totalTokens = (totals?.tokens_in ?? 0) + (totals?.tokens_out ?? 0)
  const monthlyLimit = limits?.monthly_tokens_limit ?? 0
  const usagePct = monthlyLimit > 0 ? Math.min((totalTokens / monthlyLimit) * 100, 100) : 0

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">AI Usage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Token consumption and cost estimates for the past 30 days.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              icon={<Zap className="h-4 w-4" />}
              label="Total tokens"
              value={totalTokens.toLocaleString()}
              sub={
                monthlyLimit > 0
                  ? `${usagePct.toFixed(1)}% of monthly limit`
                  : undefined
              }
            />
            <StatCard
              icon={<MessageSquare className="h-4 w-4" />}
              label="Requests"
              value={(totals?.requests ?? 0).toLocaleString()}
              sub="last 30 days"
            />
            <StatCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Est. cost"
              value={`$${(totals?.cost_est_usd ?? 0).toFixed(4)}`}
              sub="USD, 30 days"
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Daily limit"
              value={(limits?.daily_tokens_limit ?? 0).toLocaleString()}
              sub="tokens/day"
            />
          </div>

          {/* Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Daily token usage</CardTitle>
              <CardDescription>Combined prompt + completion tokens per day</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  No usage data in this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="tokens" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Agents allowed */}
          {limits?.agents_allowed && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agents on your plan</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {limits.agents_allowed.map((agent: string) => (
                  <Badge key={agent} variant="secondary" className="capitalize">
                    {agent.replace('_', ' ')}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}
