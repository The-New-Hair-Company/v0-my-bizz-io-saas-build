import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('organizationId')
  const days = Math.min(parseInt(searchParams.get('days') ?? '30', 10), 90)

  if (!orgId) return Response.json({ error: 'organizationId required' }, { status: 400 })

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().slice(0, 10)

  const { data: usage, error } = await supabase
    .from('ai_usage_daily')
    .select('date, tokens_in, tokens_out, cost_est_usd, requests')
    .eq('organization_id', orgId)
    .gte('date', sinceStr)
    .order('date', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Aggregate totals
  const totals = (usage ?? []).reduce(
    (acc, row) => ({
      tokens_in: acc.tokens_in + (row.tokens_in ?? 0),
      tokens_out: acc.tokens_out + (row.tokens_out ?? 0),
      cost_est_usd: acc.cost_est_usd + Number(row.cost_est_usd ?? 0),
      requests: acc.requests + (row.requests ?? 0),
    }),
    { tokens_in: 0, tokens_out: 0, cost_est_usd: 0, requests: 0 },
  )

  // Get plan limits
  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single()

  const { data: limits } = await supabase
    .from('plan_limits')
    .select('daily_tokens_limit, monthly_tokens_limit, agents_allowed')
    .eq('plan_key', org?.plan ?? 'free')
    .single()

  return Response.json({ daily: usage ?? [], totals, limits })
}
