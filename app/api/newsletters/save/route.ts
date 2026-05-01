// app/api/newsletters/save/route.ts
// Creates a new campaign or updates an existing draft.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// slug generation is handled inline

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      campaign_id?: string
      title: string
      subject: string
      preview_text?: string
      from_name?: string
      from_email?: string
      reply_to?: string
      list_id?: string
      hero_image_url?: string
      design_json?: Record<string, unknown>
    }

    const {
      campaign_id, title, subject, preview_text,
      from_name = 'Online2Day',
      from_email = 'news@online2day.co.uk',
      reply_to,
      list_id,
      hero_image_url,
      design_json,
    } = body

    const now = new Date().toISOString()

    if (campaign_id) {
      // Update existing draft
      const { data: existing, error } = await supabase
        .from('newsletter_campaigns')
        .select('status')
        .eq('id', campaign_id)
        .single()

      if (error || !existing) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      if (!['draft', 'scheduled'].includes(existing.status)) {
        return NextResponse.json({ error: 'Can only edit draft or scheduled campaigns' }, { status: 409 })
      }

      await supabase
        .from('newsletter_campaigns')
        .update({ title, subject, preview_text, from_name, from_email, reply_to, list_id, updated_at: now })
        .eq('id', campaign_id)

      // Insert new version
      if (design_json || hero_image_url) {
        await supabase.from('newsletter_campaign_versions').insert({
          campaign_id,
          design_json: design_json ?? null,
          hero_image_url: hero_image_url ?? null,
          created_by: user.id,
        })
      }

      return NextResponse.json({ campaign_id, action: 'updated' })
    }

    // Create new campaign
    const slug = `${toSlug(title)}-${Date.now()}`
    const { data: campaign, error: createErr } = await supabase
      .from('newsletter_campaigns')
      .insert({
        slug,
        title,
        subject,
        preview_text: preview_text ?? null,
        from_name,
        from_email,
        reply_to: reply_to ?? null,
        list_id: list_id ?? null,
        status: 'draft',
        created_by: user.id,
      })
      .select('id')
      .single()

    if (createErr || !campaign) {
      return NextResponse.json({ error: createErr?.message ?? 'Failed to create campaign' }, { status: 500 })
    }

    // Insert initial version placeholder
    if (design_json || hero_image_url) {
      await supabase.from('newsletter_campaign_versions').insert({
        campaign_id: campaign.id,
        design_json: design_json ?? null,
        hero_image_url: hero_image_url ?? null,
        created_by: user.id,
      })
    }

    return NextResponse.json({ campaign_id: campaign.id, action: 'created' }, { status: 201 })
  } catch (err) {
    console.error('[newsletters/save]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
