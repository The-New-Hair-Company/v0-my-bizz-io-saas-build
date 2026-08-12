import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type EntitlementMetric = 'intelligence_run' | 'grounded_chat'

export type EntitlementResult = {
  allowed: boolean
  used: number
  limit: number
  remaining: number
  planKey: string
}

export async function consumeEntitlement(organizationId: string, metric: EntitlementMetric): Promise<EntitlementResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('consume_ai_entitlement', {
    p_organization_id: organizationId,
    p_metric: metric,
    p_amount: 1,
  })

  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error('The entitlement service returned no result.')

  return {
    allowed: Boolean(row.allowed),
    used: Number(row.used ?? 0),
    limit: Number(row.quota_limit ?? 0),
    remaining: Number(row.remaining ?? 0),
    planKey: String(row.plan_key ?? 'free'),
  }
}

export async function getEntitlementSummary(organizationId: string) {
  const supabase = await createClient()
  const periodStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10)
  const [{ data: organization }, { data: usage }] = await Promise.all([
    supabase
      .from('organizations')
      .select('plan, plan_limits(*)')
      .eq('id', organizationId)
      .single(),
    supabase
      .from('organization_usage_periods')
      .select('metric, used')
      .eq('organization_id', organizationId)
      .eq('period_start', periodStart),
  ])

  const rawPlan = Array.isArray((organization as any)?.plan_limits)
    ? (organization as any).plan_limits[0]
    : (organization as any)?.plan_limits
  const plan = rawPlan ?? {
    plan_key: 'free',
    display_name: 'Explorer',
    intelligence_runs_limit: 3,
    grounded_chat_limit: 5,
    max_docs: 1,
    max_seats: 1,
    history_days: 7,
  }
  const usedByMetric = new Map((usage ?? []).map((row: any) => [row.metric, Number(row.used ?? 0)]))

  return {
    planKey: String(plan.plan_key ?? 'free'),
    displayName: String(plan.display_name ?? 'Explorer'),
    intelligenceRuns: {
      used: usedByMetric.get('intelligence_run') ?? 0,
      limit: Number(plan.intelligence_runs_limit ?? 3),
    },
    groundedChat: {
      used: usedByMetric.get('grounded_chat') ?? 0,
      limit: Number(plan.grounded_chat_limit ?? 5),
    },
    maxDocuments: Number(plan.max_docs ?? 1),
    maxSeats: Number(plan.max_seats ?? 1),
    historyDays: Number(plan.history_days ?? 7),
  }
}
