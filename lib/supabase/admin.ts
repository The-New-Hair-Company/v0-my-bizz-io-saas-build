import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig } from './config'
import { assertProductionEnvironment } from '@/lib/deployment'

export function createAdminClient() {
  assertProductionEnvironment()
  const { url } = getSupabasePublicConfig()
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secretKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-only portal operations.')
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
