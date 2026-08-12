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

function configuredAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isConfiguredAdmin(userId: string, email?: string | null) {
  return configuredAdminIds().has(userId) || Boolean(email && configuredAdminEmails().has(email.toLowerCase()))
}

async function ensureWorkspace(userId: string, email: string | null | undefined, displayName: string) {
  const isAdmin = isConfiguredAdmin(userId, email)

  const admin = createAdminClient()
  const { data: existingMembership, error: membershipError } = await admin
    .from('members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (membershipError) throw membershipError
  if (existingMembership) return

  if (isAdmin) {
    const { data: internalOrganization } = await admin
      .from('organizations')
      .select('id')
      .eq('source', 'internal')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (internalOrganization) {
      const { error } = await admin.from('members').upsert(
        { organization_id: internalOrganization.id, user_id: userId, role: 'owner' },
        { onConflict: 'organization_id,user_id' },
      )
      if (error) throw error
      return
    }
  }

  const workspaceName = isAdmin ? 'MyBizz Agency' : `${displayName}'s workspace`
  const slugBase = (isAdmin ? 'mybizz-agency' : displayName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 42) || 'workspace'
  const slug = isAdmin ? slugBase : `${slugBase}-${userId.slice(-8).toLowerCase()}`
  const plan = isAdmin ? 'enterprise' : 'free'

  const { data: organization, error: organizationError } = await admin
    .from('organizations')
    .upsert({
      name: workspaceName,
      slug,
      lifecycle_stage: isAdmin ? 'active' : 'onboarding',
      account_status: 'active',
      source: isAdmin ? 'internal' : 'self_serve',
      primary_contact_email: email,
      created_by: userId,
      onboarding_progress: isAdmin ? 100 : 10,
      health_score: isAdmin ? 100 : 70,
      plan,
    }, { onConflict: 'slug' })
    .select('id')
    .single()

  if (organizationError) throw organizationError

  const { error: memberError } = await admin.from('members').upsert(
    { organization_id: organization.id, user_id: userId, role: 'owner' },
    { onConflict: 'organization_id,user_id' },
  )

  if (memberError) throw memberError

  const { error: subscriptionError } = await admin.from('organization_subscriptions').upsert(
    { organization_id: organization.id, plan_key: plan, status: 'active', provider: 'manual' },
    { onConflict: 'organization_id' },
  )
  if (subscriptionError) throw subscriptionError
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
  const displayName = user?.firstName ?? user?.fullName ?? email?.split('@')[0] ?? 'MyBizz'
  await ensureWorkspace(session.userId, email, displayName)

  return {
    userId: session.userId,
    email,
    name:
      user?.fullName ??
      user?.firstName ??
      email?.split('@')[0] ??
      'Portal user',
    imageUrl: user?.imageUrl ?? null,
    isAdmin: isConfiguredAdmin(session.userId, email),
  }
}
