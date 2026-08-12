// app/api/newsletters/send-worker/route.ts
// Processes one batch of queued newsletter send jobs.
// Trigger via Vercel Cron (add to vercel.json) or call manually.
//
// vercel.json cron config:
// {
//   "crons": [
//     { "path": "/api/newsletters/send-worker", "schedule": "* * * * *" }
//   ]
// }

import { NextRequest, NextResponse } from 'next/server'
import { processBatch } from '@/lib/queue/processBatch'
import { auth } from '@clerk/nextjs/server'
import { isApplicationAdmin } from '@/lib/portal/auth'

// Vercel Cron sends a request with Authorization: Bearer <CRON_SECRET>
// Manual admin calls also accepted (authenticated via Supabase session elsewhere)
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  if (!CRON_SECRET) return NextResponse.json({ error: 'Worker is not configured' }, { status: 503 })
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const campaignId = req.nextUrl.searchParams.get('campaign_id') ?? undefined

  try {
    const { sent, failed } = await processBatch(campaignId)
    return NextResponse.json({ sent, failed, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('[send-worker]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Worker error' }, { status: 500 })
  }
}

// Also support POST for manual admin triggers from the dashboard
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const hasCronSecret = Boolean(CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`)
  if (!hasCronSecret) {
    const session = await auth()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!(await isApplicationAdmin(session.userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { campaign_id } = await req.json().catch(() => ({}))

  try {
    const { sent, failed } = await processBatch(campaign_id as string | undefined)
    return NextResponse.json({ sent, failed })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Worker error' }, { status: 500 })
  }
}
