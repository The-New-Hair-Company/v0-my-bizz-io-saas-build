import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig } from './config'

export function createClient(accessToken?: () => Promise<string | null>) {
  const { publishableKey, url } = getSupabasePublicConfig()

  return createSupabaseClient(url, publishableKey, {
    accessToken,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
