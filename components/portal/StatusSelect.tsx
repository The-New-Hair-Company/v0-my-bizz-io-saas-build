'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function StatusSelect({ resource, id, field = 'status', value, options }: { resource: string; id: string; field?: string; value: string; options: Array<{ value: string; label: string }> }) {
  const router = useRouter()
  const [current, setCurrent] = useState(value)
  const [saving, setSaving] = useState(false)

  async function update(next: string) {
    setCurrent(next)
    setSaving(true)
    const response = await fetch('/api/portal/records', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource, id, data: { [field]: next } }),
    })
    setSaving(false)
    if (!response.ok) setCurrent(value)
    else router.refresh()
  }

  return <Select value={current} onValueChange={update} disabled={saving}><SelectTrigger className="h-8 w-[132px] border-orange-100 bg-white text-xs capitalize"><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
}

