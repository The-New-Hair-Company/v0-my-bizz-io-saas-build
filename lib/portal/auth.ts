import 'server-only'

import { auth, currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { absoluteApplicationUrl, assertProductionEnvironment } from '@/lib/deployment'

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

function isBootstrapCandidate(userId: string, email: string | null, emailVerified: boolean) {
  const verifiedEmailMatch = Boolean(
    email && emailVerified && configuredAdminEmails().has(email.toLowerCase()),
  )

  // Production deliberately ignores development Clerk user IDs. A verified
  // address is used once to claim the primary administrator record; every
  // authorization decision after that uses the persisted Clerk user ID.
  if (process.env.VERCEL_ENV === 'production') return verifiedEmailMatch
  return configuredAdminIds().has(userId) || verifiedEmailMatch
}

async function syncUserProfile(
  userId: string,
  email: string | null,
  displayName: string,
  imageUrl: string | null,
) {
  const admin = createAdminClient()
  const now = new Date().toISOString()
  const { error } = await admin.from('user_profiles').upsert({
    clerk_user_id: userId,
    primary_email: email,
    display_name: displayName,
    image_url: imageUrl,
    status: 'active',
    last_seen_at: now,
    updated_at: now,
  }, { onConflict: 'clerk_user_id' })
  if (error) throw error
}

export async function isApplicationAdmin(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('application_administrators')
    .select('clerk_user_id')
    .eq('clerk_user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

async function bootstrapApplicationAdmin(
  userId: string,
  email: string | null,
  displayName: string,
  imageUrl: string | null,
  emailVerified: boolean,
) {
  if (!isBootstrapCandidate(userId, email, emailVerified)) return false

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('bootstrap_application_admin', {
    p_clerk_user_id: userId,
    p_email: email,
    p_display_name: displayName,
    p_image_url: imageUrl,
  })
  if (error) throw error

  const result = Array.isArray(data) ? data[0] : data
  return Boolean(result?.is_application_admin)
}

async function ensureWorkspace(
  userId: string,
  email: string | null,
  displayName: string,
  isAdmin: boolean,
) {
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
    const { data: administrator, error: administratorError } = await admin
      .from('application_administrators')
      .select('organization_id')
      .eq('clerk_user_id', userId)
      .eq('status', 'active')
      .single()
    if (administratorError) throw administratorError

    const { error } = await admin.from('members').upsert(
      { organization_id: administrator.organization_id, user_id: userId, role: 'owner' },
      { onConflict: 'organization_id,user_id' },
    )
    if (error) throw error
    return
  }

  const workspaceName = `${displayName}'s workspace`
  const slugBase = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 42) || 'workspace'
  const slug = `${slugBase}-${userId.slice(-8).toLowerCase()}`

  const { data: organization, error: organizationError } = await admin
    .from('organizations')
    .upsert({
      name: workspaceName,
      slug,
      lifecycle_stage: 'onboarding',
      account_status: 'active',
      source: 'self_serve',
      primary_contact_email: email,
      created_by: userId,
      onboarding_progress: 10,
      health_score: 70,
      plan: 'free',
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
    { organization_id: organization.id, plan_key: 'free', status: 'active', provider: 'manual' },
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
  if (error) throw error

  for (const invite of invites ?? []) {
    const { error: memberError } = await admin.from('members').upsert(
      { organization_id: invite.organization_id, user_id: userId, role: invite.role },
      { onConflict: 'organization_id,user_id' },
    )
    if (memberError) throw memberError

    const { error: inviteError } = await admin
      .from('team_invites')
      .update({ status: 'accepted', accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', invite.id)
    if (inviteError) throw inviteError
  }
}

export async function requirePortalUser() {
  assertProductionEnvironment()
  const session = await auth()
  if (!session.userId) return session.redirectToSignIn({ returnBackUrl: absoluteApplicationUrl('/dashboard') })

  const user = await currentUser()
  const primaryEmail = user?.primaryEmailAddress
  const email = primaryEmail?.emailAddress ?? null
  const emailVerified = primaryEmail?.verification?.status === 'verified'
  const displayName = user?.firstName ?? user?.fullName ?? email?.split('@')[0] ?? 'MyBizz'
  const imageUrl = user?.imageUrl ?? null

  await syncUserProfile(session.userId, email, displayName, imageUrl)
  let isAdmin = await isApplicationAdmin(session.userId)
  if (!isAdmin) {
    isAdmin = await bootstrapApplicationAdmin(
      session.userId,
      email,
      displayName,
      imageUrl,
      emailVerified,
    )
  }

  await acceptPendingInvites(session.userId, email)
  await ensureWorkspace(session.userId, email, displayName, isAdmin)

  return {
    userId: session.userId,
    email,
    name: user?.fullName ?? user?.firstName ?? email?.split('@')[0] ?? 'Portal user',
    imageUrl,
    isAdmin,
  }
}
