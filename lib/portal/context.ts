import 'server-only'
import { createClient } from '@/lib/supabase/server'

export async function getActiveOrganization(userId: string) {
  const supabase = await createClient()
  const [{ data: preference }, { data: memberships }] = await Promise.all([
    supabase.from('member_preferences').select('active_organization_id').eq('user_id', userId).maybeSingle(),
    supabase.from('members').select('organization_id, role, organizations(*)').eq('user_id', userId).order('created_at'),
  ])
  const items: any[] = memberships ?? []
  const preferred = items.find((item) => item.organization_id === preference?.active_organization_id)
  const external = items.find((item) => item.organizations?.source !== 'internal')
  return preferred ?? external ?? items[0] ?? null
}

