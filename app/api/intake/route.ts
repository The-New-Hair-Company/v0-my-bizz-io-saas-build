import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const intakeSchema = z.object({
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().default(''),
  companyName: z.string().trim().min(2).max(160),
  currentWebsite: z.union([z.literal(''), z.string().trim().url().max(500)]).default(''),
  companySize: z.string().trim().max(60).default(''),
  industry: z.string().trim().min(2).max(120),
  projectTypes: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
  budgetRange: z.string().trim().min(1).max(80),
  targetLaunch: z.string().trim().min(1).max(80),
  goals: z.string().trim().min(20).max(4000),
  painPoints: z.string().trim().max(3000).default(''),
  designDirection: z.string().trim().max(2000).default(''),
  competitors: z.string().trim().max(2000).default(''),
  requiredIntegrations: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  contentReadiness: z.string().trim().max(120).default(''),
  notes: z.string().trim().max(3000).default(''),
  marketingConsent: z.boolean().default(false),
  privacyAccepted: z.literal(true),
  website: z.string().max(0).optional(), // honeypot
})

const requestWindows = new Map<string, number[]>()

function isRateLimited(ip: string) {
  const now = Date.now()
  const cutoff = now - 60 * 60 * 1000
  const recent = (requestWindows.get(ip) ?? []).filter((time) => time > cutoff)
  recent.push(now)
  requestWindows.set(ip, recent)
  return recent.length > 5
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 52)
}

function createReference() {
  return `MB-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 })
  }

  const parsed = intakeSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please review the highlighted information.', fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true, reference: createReference() })
  }

  const data = parsed.data
  const admin = createAdminClient()
  const reference = createReference()
  const slug = `${slugify(data.companyName) || 'client'}-${reference.slice(-4).toLowerCase()}`

  const { data: organization, error: organizationError } = await admin
    .from('organizations')
    .insert({
      name: data.companyName,
      slug,
      lifecycle_stage: 'lead',
      account_status: 'active',
      primary_contact_name: data.contactName,
      primary_contact_email: data.email.toLowerCase(),
      primary_contact_phone: data.phone || null,
      website: data.currentWebsite || null,
      industry: data.industry,
      company_size: data.companySize || null,
      service_lines: data.projectTypes,
      source: 'website-intake',
      onboarding_progress: 20,
      health_score: 80,
    })
    .select('id')
    .single()

  if (organizationError) {
    console.error('[intake] organization insert failed', organizationError.code)
    return NextResponse.json({ error: 'We could not save your brief. Please try again.' }, { status: 500 })
  }

  const { error: intakeError } = await admin.from('intake_submissions').insert({
    organization_id: organization.id,
    reference_code: reference,
    contact_name: data.contactName,
    email: data.email.toLowerCase(),
    phone: data.phone || null,
    company_name: data.companyName,
    current_website: data.currentWebsite || null,
    company_size: data.companySize || null,
    industry: data.industry,
    project_types: data.projectTypes,
    budget_range: data.budgetRange,
    target_launch: data.targetLaunch,
    goals: data.goals,
    pain_points: data.painPoints || null,
    design_direction: data.designDirection || null,
    competitors: data.competitors || null,
    required_integrations: data.requiredIntegrations,
    content_readiness: data.contentReadiness || null,
    notes: data.notes || null,
    marketing_consent: data.marketingConsent,
    privacy_accepted: data.privacyAccepted,
    metadata: { sourceIpRecorded: Boolean(ip), userAgent: request.headers.get('user-agent') },
  })

  if (intakeError) {
    await admin.from('organizations').delete().eq('id', organization.id)
    console.error('[intake] submission insert failed', intakeError.code)
    return NextResponse.json({ error: 'We could not save your brief. Please try again.' }, { status: 500 })
  }

  const { data: applicationAdministrators } = await admin
    .from('application_administrators')
    .select('clerk_user_id')
    .eq('status', 'active')
  const adminIds = (applicationAdministrators ?? []).map((administrator) => administrator.clerk_user_id)

  if (adminIds.length) {
    const { error: assignmentError } = await admin.from('members').upsert(
      adminIds.map((userId) => ({ organization_id: organization.id, user_id: userId, role: 'owner' })),
      { onConflict: 'organization_id,user_id' },
    )
    if (assignmentError) console.error('[intake] admin assignment failed', assignmentError.code)
  }

  await admin.from('account_activity').insert({
    organization_id: organization.id,
    activity_type: 'intake_submitted',
    title: 'New project brief received',
    description: `${data.contactName} submitted ${data.projectTypes.join(', ')} requirements.`,
    metadata: { reference },
  })

  return NextResponse.json({ ok: true, reference }, { status: 201 })
}
