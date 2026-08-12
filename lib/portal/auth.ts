import 'server-only'

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

function configuredAdminIds() {
  return new Set(
    (process.env.ADMIN_CLERK_USER_IDS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  )
}

export function isConfiguredAdmin(userId: string) {
  return configuredAdminIds().has(userId)
}

async function ensureAdminWorkspace(userId: string, email?: string | null) {
  if (!isConfiguredAdmin(userId)) return

  const admin = createAdminClient()
  const { count, error: membershipError } = await admin
    .from('members')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (membershipError) throw membershipError
  if ((count ?? 0) > 0) return

  const { data: organization, error: organizationError } = await admin
    .from('organizations')
    .insert({
      name: 'MyBizz Agency',
      slug: 'mybizz-agency',
      lifecycle_stage: 'active',
      account_status: 'active',
      source: 'internal',
      primary_contact_email: email,
      created_by: userId,
      onboarding_progress: 100,
      health_score: 100,
    })
    .select('id')
    .single()

  if (organizationError) throw organizationError

  const { error: memberError } = await admin.from('members').insert({
    organization_id: organization.id,
    user_id: userId,
    role: 'owner',
  })

  if (memberError) throw memberError
}

async function acceptPendingInvites(userId: string, email?: string | null) {
  if (!email) return

  const admin = createAdminClient()
  const { data: invites, error } = await admin
    .from('team_invites')
    .select('id, organization_id, role')
    .ilike('email', email)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())

  // The first deployment can briefly run before the Agency OS migration is
  // applied. Treat a missing invite table as no invitation, not an auth error.
  if (error) return

  for (const invite of invites ?? []) {
    const { error: memberError } = await admin.from('members').upsert(
      {
        organization_id: invite.organization_id,
        user_id: userId,
        role: invite.role,
      },
      { onConflict: 'organization_id,user_id' },
    )
    if (memberError) throw memberError

    const { error: inviteError } = await admin
      .from('team_invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invite.id)
    if (inviteError) throw inviteError
  }
}

export async function requirePortalUser() {
  const session = await auth()
  if (!session.userId) redirect('/auth/login')

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? null
  await acceptPendingInvites(session.userId, email)
  await ensureAdminWorkspace(session.userId, email)

  return {
    userId: session.userId,
    email,
    name:
      user?.fullName ??
      user?.firstName ??
      email?.split('@')[0] ??
      'Portal user',
    imageUrl: user?.imageUrl ?? null,
    isAdmin: isConfiguredAdmin(session.userId),
  }
}
