import { redirect } from 'next/navigation'
import { IntelligenceWorkspace } from '@/components/ai/IntelligenceWorkspace'
import { getEntitlementSummary } from '@/lib/ai/entitlements'
import { requirePortalUser } from '@/lib/portal/auth'
import { getActiveOrganization } from '@/lib/portal/context'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Intelligence HQ — MyBizz',
  description: 'Tenant-secured operating intelligence with explainable evidence and zero paid model tokens.',
}

export default async function IntelligencePage() {
  const user = await requirePortalUser()
  const membership = await getActiveOrganization(user.userId)
  if (!membership) redirect('/dashboard')

  const organizationId = membership.organization_id
  const supabase = await createClient()
  const [{ data: workflows, error: workflowError }, { data: recentRuns }, usage] = await Promise.all([
    supabase.from('ai_workflows').select('workflow_key, name, short_name, category, description, prompt_hint, cadence').eq('active', true).order('sort_order'),
    supabase.from('ai_runs').select('id, workflow_key, headline, confidence, created_at, output').eq('organization_id', organizationId).eq('status', 'completed').order('created_at', { ascending: false }).limit(8),
    getEntitlementSummary(organizationId),
  ])
  if (workflowError) throw workflowError

  return <IntelligenceWorkspace
    organizationId={organizationId}
    organizationName={membership.organizations?.name ?? 'your workspace'}
    workflows={(workflows ?? []) as any}
    usage={usage}
    recentRuns={(recentRuns ?? []) as any}
  />
}
