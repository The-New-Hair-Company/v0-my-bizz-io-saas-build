'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export type FormField = {
  name: string
  label: string
  type?: 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select'
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  required?: boolean
  defaultValue?: string
}

export function RecordDialog({
  resource,
  title,
  description,
  triggerLabel,
  fields,
  fixedData,
}: {
  resource: string
  title: string
  description: string
  triggerLabel: string
  fields: FormField[]
  fixedData?: Record<string, unknown>
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selects, setSelects] = useState<Record<string, string>>(() => Object.fromEntries(fields.filter((field) => field.type === 'select' && field.defaultValue).map((field) => [field.name, field.defaultValue!])))

  async function submit(formData: FormData) {
    setSubmitting(true)
    setError('')
    const data: Record<string, unknown> = { ...fixedData }
    for (const field of fields) {
      const raw = field.type === 'select' ? selects[field.name] : String(formData.get(field.name) ?? '').trim()
      if (raw === '') data[field.name] = null
      else if (field.type === 'number') data[field.name] = Number(raw)
      else data[field.name] = raw
    }

    const response = await fetch('/api/portal/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource, data }),
    })
    const payload = await response.json()
    setSubmitting(false)
    if (!response.ok) {
      setError(payload.error ?? 'The record could not be saved.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="agency-button"><Plus className="mr-2 h-4 w-4" />{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="border-orange-100 sm:max-w-xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        <form action={submit} className="mt-2 grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === 'select' ? (
                <Select value={selects[field.name] ?? ''} onValueChange={(value) => setSelects((current) => ({ ...current, [field.name]: value }))}>
                  <SelectTrigger id={field.name} className="mt-2"><SelectValue placeholder={field.placeholder ?? `Choose ${field.label.toLowerCase()}`} /></SelectTrigger>
                  <SelectContent>{field.options?.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea id={field.name} name={field.name} className="mt-2 min-h-28" placeholder={field.placeholder} required={field.required} defaultValue={field.defaultValue} />
              ) : (
                <Input id={field.name} name={field.name} className="mt-2" type={field.type ?? 'text'} placeholder={field.placeholder} required={field.required} defaultValue={field.defaultValue} />
              )}
            </div>
          ))}
          {error && <p className="sm:col-span-2 rounded-lg bg-orange-50 p-3 text-sm text-orange-900">{error}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button className="agency-button" disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

