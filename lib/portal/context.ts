import 'server-only'
import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveActiveOrganization(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('get_active_organization', {
    p_clerk_user_id: userId,
  })
  if (error) throw error
  return data as any | null
}

export const getActiveOrganization = cache(resolveActiveOrganization)
