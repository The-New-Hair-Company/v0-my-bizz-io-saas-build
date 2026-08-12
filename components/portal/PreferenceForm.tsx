'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const palette = ['#ff6600', '#f04400', '#ff8a00', '#d97706', '#ea580c', '#c2410c', '#9a3412', '#7c2d12']

export function PreferenceForm({ preferences, activeOrganizationId }: { preferences: any; activeOrganizationId?: string }) {
  const router = useRouter()
  const [accent, setAccent] = useState(preferences?.accent_color ?? '#ff6600')
  const [compact, setCompact] = useState(Boolean(preferences?.compact_mode))
  const [email, setEmail] = useState(preferences?.email_notifications ?? true)
  const [deadlines, setDeadlines] = useState(preferences?.deadline_notifications ?? true)
  const [digest, setDigest] = useState(preferences?.weekly_digest ?? true)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const response = await fetch('/api/portal/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resource: 'preference', data: { active_organization_id: activeOrganizationId || null, accent_color: accent, theme_mode: 'light', compact_mode: compact, email_notifications: email, deadline_notifications: deadlines, weekly_digest: digest } }) })
    setSaving(false)
    if (response.ok) router.refresh()
  }

  return <div className="space-y-6"><section className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-[var(--agency-accent)]"><Palette className="h-4 w-4" /></span><div><h2 className="font-semibold text-orange-950">Workspace colour</h2><p className="text-xs text-orange-950/50">Your dashboard accent is personal and saved to your profile.</p></div></div><div className="mt-6 flex flex-wrap gap-3">{palette.map((colour) => <button type="button" key={colour} onClick={() => setAccent(colour)} className="h-11 w-11 rounded-full border-4 transition" style={{ background: colour, borderColor: accent === colour ? '#431407' : '#fff' }} aria-label={`Use ${colour}`} />)}<label className="grid h-11 w-11 cursor-pointer place-items-center overflow-hidden rounded-full border border-orange-200 bg-white text-xs font-bold text-orange-800">+<input type="color" className="invisible absolute" value={accent} onChange={(event) => setAccent(event.target.value)} /></label></div></section><section className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"><h2 className="font-semibold text-orange-950">Experience and notifications</h2><div className="mt-5 divide-y divide-orange-50"><Toggle label="Compact workspace" description="Reduce spacing in information-dense views." value={compact} onChange={setCompact} /><Toggle label="Email notifications" description="Receive important account activity." value={email} onChange={setEmail} /><Toggle label="Deadline alerts" description="Receive reminders before tracked deadlines." value={deadlines} onChange={setDeadlines} /><Toggle label="Weekly portfolio digest" description="A weekly summary across assigned accounts." value={digest} onChange={setDigest} /></div></section><Button className="agency-button" onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save preferences</Button></div>
}

function Toggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void }) { return <div className="flex items-center justify-between gap-6 py-4"><div><Label>{label}</Label><p className="mt-1 text-xs text-orange-950/50">{description}</p></div><Switch checked={value} onCheckedChange={onChange} /></div> }

