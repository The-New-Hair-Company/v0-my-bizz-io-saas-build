'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Globe2, Layers3, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const steps = [
  { title: 'Your business', eyebrow: 'Foundation' },
  { title: 'The brief', eyebrow: 'Scope' },
  { title: 'Creative direction', eyebrow: 'Experience' },
  { title: 'Review', eyebrow: 'Submit' },
]

const projectOptions = ['Marketing website', 'E-commerce', 'Web application', 'Brand system', 'SEO & growth', 'Ongoing support']
const integrationOptions = ['CRM', 'Payments', 'Booking', 'Email marketing', 'Analytics', 'Member portal']

type IntakeForm = {
  contactName: string; email: string; phone: string; companyName: string; currentWebsite: string
  companySize: string; industry: string; projectTypes: string[]; budgetRange: string; targetLaunch: string
  goals: string; painPoints: string; designDirection: string; competitors: string
  requiredIntegrations: string[]; contentReadiness: string; notes: string
  marketingConsent: boolean; privacyAccepted: boolean; website: string
}

const initialForm: IntakeForm = {
  contactName: '', email: '', phone: '', companyName: '', currentWebsite: '', companySize: '', industry: '',
  projectTypes: [], budgetRange: '', targetLaunch: '', goals: '', painPoints: '', designDirection: '', competitors: '',
  requiredIntegrations: [], contentReadiness: '', notes: '', marketingConsent: false, privacyAccepted: false, website: '',
}

export default function IntakePage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step])
  const update = <K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) => setForm((current) => ({ ...current, [key]: value }))
  const toggle = (key: 'projectTypes' | 'requiredIntegrations', value: string) => {
    const current = form[key]
    update(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
  }

  function validateCurrentStep() {
    if (step === 0 && (!form.contactName || !form.email || !form.companyName || !form.industry)) return 'Complete the required business details.'
    if (step === 1 && (!form.projectTypes.length || !form.budgetRange || !form.targetLaunch || form.goals.trim().length < 20)) return 'Add a service, budget, timing and a little more detail about the goal.'
    if (step === 3 && !form.privacyAccepted) return 'Please accept the privacy notice before submitting.'
    return ''
  }

  function next() {
    const message = validateCurrentStep()
    if (message) return setError(message)
    setError('')
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  async function submit() {
    const message = validateCurrentStep()
    if (message) return setError(message)
    setStatus('submitting')
    setError('')
    const response = await fetch('/api/intake', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) })
    const result = await response.json()
    if (!response.ok) {
      setStatus('idle')
      setError(result.error ?? 'Something went wrong. Please try again.')
      return
    }
    setReference(result.reference)
    setStatus('success')
  }

  if (status === 'success') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07111f] px-6 py-16 text-white">
        <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl sm:p-14">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-400 text-slate-950"><Check className="h-8 w-8" /></div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Brief received</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">We’re already thinking about it.</h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-300">Your client workspace has been created and the MyBizz team can now review the full brief. We’ll come back with a focused next step.</p>
          <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reference</p>
            <p className="mt-1 font-mono text-lg text-emerald-300">{reference}</p>
          </div>
          <Button asChild className="mt-8 bg-white text-slate-950 hover:bg-slate-100"><Link href="/">Back to MyBizz</Link></Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-semibold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400 text-slate-950"><Sparkles className="h-4 w-4" /></span> MyBizz</Link>
          <div className="flex items-center gap-2 text-xs text-slate-400"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Encrypted project intake</div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[340px_1fr] lg:py-16">
        <aside className="lg:sticky lg:top-10 lg:h-fit">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Start a project</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em]">Give us the signal. We’ll shape the system.</h1>
          <p className="mt-5 leading-7 text-slate-400">A thoughtful brief lets us move faster, challenge assumptions and design around the outcome—not just the deliverables.</p>
          <div className="mt-10 hidden space-y-1 lg:block">
            {steps.map((item, index) => (
              <button key={item.title} onClick={() => index < step && setStep(index)} className={`flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition ${index === step ? 'bg-white/10' : 'text-slate-500'}`}>
                <span className={`grid h-8 w-8 place-items-center rounded-full border text-xs ${index < step ? 'border-emerald-400 bg-emerald-400 text-slate-950' : index === step ? 'border-white text-white' : 'border-white/15'}`}>{index < step ? <Check className="h-4 w-4" /> : index + 1}</span>
                <span><span className="block text-[10px] uppercase tracking-[0.2em]">{item.eyebrow}</span><span className={`mt-0.5 block text-sm font-medium ${index === step ? 'text-white' : ''}`}>{item.title}</span></span>
              </button>
            ))}
          </div>
        </aside>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1929] shadow-2xl shadow-black/30">
          <div className="h-1 bg-white/5"><div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
          <div className="p-6 sm:p-10 lg:p-12">
            <div className="mb-9 flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Step {step + 1} · {steps[step].eyebrow}</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">{steps[step].title}</h2></div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">{Math.round(progress)}%</span>
            </div>

            {step === 0 && <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Your name" required><Input value={form.contactName} onChange={(e) => update('contactName', e.target.value)} placeholder="Alex Morgan" /></Field>
              <Field label="Work email" required><Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="alex@company.com" /></Field>
              <Field label="Company name" required><Input value={form.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder="Northstar Studio" /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+44 20 0000 0000" /></Field>
              <Field label="Industry" required><Input value={form.industry} onChange={(e) => update('industry', e.target.value)} placeholder="Professional services" /></Field>
              <Field label="Team size"><Select value={form.companySize} onChange={(value) => update('companySize', value)} options={['1–5', '6–20', '21–50', '51–200', '200+']} /></Field>
              <div className="sm:col-span-2"><Field label="Current website"><div className="relative"><Globe2 className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><Input className="pl-10" type="url" value={form.currentWebsite} onChange={(e) => update('currentWebsite', e.target.value)} placeholder="https://yourcompany.com" /></div></Field></div>
              <input className="hidden" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update('website', e.target.value)} />
            </div>}

            {step === 1 && <div className="space-y-8">
              <ChoiceGrid label="What are we building?" values={projectOptions} selected={form.projectTypes} onToggle={(value) => toggle('projectTypes', value)} />
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Investment range" required><Select value={form.budgetRange} onChange={(value) => update('budgetRange', value)} options={['£2k–£5k', '£5k–£10k', '£10k–£25k', '£25k–£50k', '£50k+']} /></Field>
                <Field label="Ideal launch" required><Select value={form.targetLaunch} onChange={(value) => update('targetLaunch', value)} options={['Within 4 weeks', '1–2 months', '3–4 months', '5–6 months', 'Flexible']} /></Field>
              </div>
              <Field label="What must this project achieve?" required><Textarea className="min-h-32" value={form.goals} onChange={(e) => update('goals', e.target.value)} placeholder="Tell us about the commercial outcome, the audience and what success looks like…" /></Field>
              <Field label="What is getting in the way today?"><Textarea value={form.painPoints} onChange={(e) => update('painPoints', e.target.value)} placeholder="Low conversion, difficult CMS, unclear positioning…" /></Field>
            </div>}

            {step === 2 && <div className="space-y-8">
              <Field label="How should the experience feel?"><Textarea className="min-h-28" value={form.designDirection} onChange={(e) => update('designDirection', e.target.value)} placeholder="Confident, editorial and distinctly premium. Avoid generic SaaS visuals…" /></Field>
              <Field label="References or competitors"><Textarea value={form.competitors} onChange={(e) => update('competitors', e.target.value)} placeholder="Share URLs, brands you admire, or competitors we should understand." /></Field>
              <ChoiceGrid label="Required integrations" values={integrationOptions} selected={form.requiredIntegrations} onToggle={(value) => toggle('requiredIntegrations', value)} />
              <Field label="Content readiness"><Select value={form.contentReadiness} onChange={(value) => update('contentReadiness', value)} options={['Ready to go', 'Mostly ready', 'Needs refinement', 'Needs full copy & content support']} /></Field>
              <Field label="Anything else we should know?"><Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Internal constraints, stakeholder context or technical requirements…" /></Field>
            </div>}

            {step === 3 && <div className="space-y-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewCard label="Business" value={`${form.companyName} · ${form.industry}`} />
                <ReviewCard label="Contact" value={`${form.contactName} · ${form.email}`} />
                <ReviewCard label="Scope" value={form.projectTypes.join(', ')} />
                <ReviewCard label="Parameters" value={`${form.budgetRange} · ${form.targetLaunch}`} />
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Primary outcome</p><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-200">{form.goals}</p></div>
              <label className="flex cursor-pointer gap-3 rounded-xl border border-white/10 p-4 text-sm text-slate-300"><input type="checkbox" checked={form.privacyAccepted} onChange={(e) => update('privacyAccepted', e.target.checked)} className="mt-0.5 accent-emerald-400" /><span>I agree that MyBizz may process this information to review and respond to my project enquiry. <span className="text-emerald-300">Required</span></span></label>
              <label className="flex cursor-pointer gap-3 px-4 text-sm text-slate-400"><input type="checkbox" checked={form.marketingConsent} onChange={(e) => update('marketingConsent', e.target.checked)} className="mt-0.5 accent-emerald-400" /><span>Send me occasional, genuinely useful digital growth insights.</span></label>
            </div>}

            {error && <div className="mt-7 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

            <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-7">
              <Button variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || status === 'submitting'} className="text-slate-300 hover:bg-white/10 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
              {step < steps.length - 1 ? <Button onClick={next} className="bg-emerald-400 text-slate-950 hover:bg-emerald-300">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button onClick={submit} disabled={status === 'submitting'} className="bg-emerald-400 text-slate-950 hover:bg-emerald-300">{status === 'submitting' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating workspace</> : <>Submit project brief <CheckCircle2 className="ml-2 h-4 w-4" /></>}</Button>}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="text-sm text-slate-300">{label}{required && <span className="ml-1 text-emerald-300">*</span>}</Label>{children}</div>
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-md border border-white/10 bg-[#111f31] px-3 text-sm text-white outline-none focus:border-emerald-400"><option value="">Select an option</option>{options.map((option) => <option key={option}>{option}</option>)}</select>
}

function ChoiceGrid({ label, values, selected, onToggle }: { label: string; values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <div><Label className="text-sm text-slate-300">{label}</Label><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{values.map((value) => { const active = selected.includes(value); return <button type="button" key={value} onClick={() => onToggle(value)} className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition ${active ? 'border-emerald-400/60 bg-emerald-400/10 text-white' : 'border-white/10 bg-white/[0.025] text-slate-400 hover:border-white/25'}`}><span className={`grid h-7 w-7 place-items-center rounded-lg ${active ? 'bg-emerald-400 text-slate-950' : 'bg-white/5'}`}>{active ? <Check className="h-4 w-4" /> : <Layers3 className="h-4 w-4" />}</span>{value}</button> })}</div></div>
}

function ReviewCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p><p className="mt-2 text-sm leading-6 text-slate-200">{value || 'Not supplied'}</p></div>
}
