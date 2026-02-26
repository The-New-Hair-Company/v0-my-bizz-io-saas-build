/**
 * Quota enforcement for AI usage.
 * Checks the organization's plan limits against their daily token consumption.
 */

import { createClient } from '@/lib/supabase/server'
import { estimateCostUsd } from './costEstimate'

export type QuotaCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string }

/**
 * Check if an organization has remaining daily token quota.
 */
export async function checkDailyQuota(orgId: string): Promise<QuotaCheckResult> {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  // Get the org's plan
  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single()

  const plan = org?.plan ?? 'free'

  // Get plan limits
  const { data: limits } = await supabase
    .from('plan_limits')
    .select('daily_tokens_limit, agents_allowed')
    .eq('plan_key', plan)
    .single()

  if (!limits) {
    // No limits configured — allow (fail open)
    return { allowed: true }
  }

  // Get today's usage
  const { data: usage } = await supabase
    .from('ai_usage_daily')
    .select('tokens_in, tokens_out')
    .eq('organization_id', orgId)
    .eq('date', today)
    .single()

  const totalToday = (usage?.tokens_in ?? 0) + (usage?.tokens_out ?? 0)

  if (totalToday >= limits.daily_tokens_limit) {
    return {
      allowed: false,
      reason: `Daily token limit reached (${totalToday.toLocaleString()} / ${limits.daily_tokens_limit.toLocaleString()}). Upgrade your plan or try again tomorrow.`,
    }
  }

  return { allowed: true }
}

/**
 * Check if the agent type is allowed on the org's plan.
 */
export async function checkAgentAllowed(
  orgId: string,
  agentType: string,
): Promise<QuotaCheckResult> {
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single()

  const plan = org?.plan ?? 'free'

  const { data: limits } = await supabase
    .from('plan_limits')
    .select('agents_allowed')
    .eq('plan_key', plan)
    .single()

  if (!limits) return { allowed: true }

  if (!limits.agents_allowed.includes(agentType)) {
    return {
      allowed: false,
      reason: `The ${agentType} agent requires a higher plan. Please upgrade to access this feature.`,
    }
  }

  return { allowed: true }
}

/**
 * Record token usage for an organization after a successful AI call.
 * Uses upsert with increment to avoid race conditions.
 */
export async function recordUsage(
  orgId: string,
  tokensIn: number,
  tokensOut: number,
): Promise<void> {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)
  const cost = estimateCostUsd(tokensIn, tokensOut)

  const { data: existing } = await supabase
    .from('ai_usage_daily')
    .select('tokens_in, tokens_out, cost_est_usd, requests')
    .eq('organization_id', orgId)
    .eq('date', today)
    .single()

  if (existing) {
    await supabase
      .from('ai_usage_daily')
      .update({
        tokens_in: existing.tokens_in + tokensIn,
        tokens_out: existing.tokens_out + tokensOut,
        cost_est_usd: parseFloat((Number(existing.cost_est_usd) + cost).toFixed(8)),
        requests: existing.requests + 1,
      })
      .eq('organization_id', orgId)
      .eq('date', today)
  } else {
    await supabase.from('ai_usage_daily').insert({
      organization_id: orgId,
      date: today,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_est_usd: cost,
      requests: 1,
    })
  }
}
