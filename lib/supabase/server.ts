import { auth } from '@clerk/nextjs/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig } from './config'

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const session = await auth()
  const { publishableKey, url } = getSupabasePublicConfig()

  const client = createSupabaseClient(url, publishableKey, {
    accessToken: async () => session.getToken(),
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return client
}
