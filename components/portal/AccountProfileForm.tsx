'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const fields = [
  ['name', 'Company name'], ['industry', 'Industry'], ['company_size', 'Company size'],
  ['primary_contact_name', 'Primary contact'], ['primary_contact_email', 'Contact email'],
  ['primary_contact_phone', 'Contact phone'], ['website', 'Website'],
] as const

export function AccountProfileForm({ account, editable }: { account: any; editable: boolean }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  async function save(formData: FormData) {
    setSaving(true)
    const data = Object.fromEntries(fields.map(([name]) => [name, String(formData.get(name) ?? '').trim() || null]))
    const response = await fetch('/api/portal/records', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resource: 'account', id: account.id, data }) })
    setSaving(false)
    setMessage(response.ok ? 'Company profile saved.' : 'The profile could not be saved.')
    if (response.ok) router.refresh()
  }
  return <form action={save} className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"><div className="grid gap-5 sm:grid-cols-2">{fields.map(([name, label]) => <div key={name}><Label htmlFor={name}>{label}</Label><Input id={name} name={name} className="mt-2" type={name.includes('email') ? 'email' : 'text'} defaultValue={account[name] ?? ''} disabled={!editable} /></div>)}</div>{message && <p className="mt-4 text-xs text-orange-700">{message}</p>}{editable && <Button className="agency-button mt-6" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save company profile</Button>}</form>
}

