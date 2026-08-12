import { auth, currentUser } from '@clerk/nextjs/server'
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

  // Compatibility for existing server modules while the portal uses Clerk as
  // the source of identity. Database authorization still uses the Clerk JWT.
  const clerkUser = session.userId ? await currentUser() : null
  ;(client.auth as any).getUser = async () => ({
    data: {
      user: clerkUser
        ? ({
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress ?? undefined,
            user_metadata: {
              full_name: clerkUser.fullName,
            },
          } as never)
        : null,
    },
    error: null,
  })

  return client
}
