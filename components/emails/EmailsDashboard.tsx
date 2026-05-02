'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Search,
  CalendarDays,
  Filter,
  Download,
  ChevronDown,
  Mail,
  Video,
  Eye,
  Send,
  Zap,
  GitBranch,
  Upload,
  ClipboardList,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileJson,
  Table2,
  CheckCircle2,
  Clock,
  PenLine,
  AlertCircle,
  MoreHorizontal,
  Plus,
  Users,
  ArrowRight,
  Lightbulb,
  BarChart2,
  Trash2,
  Edit3,
  Copy,
  Star,
  TrendingUp,
  Link as LinkIcon,
} from 'lucide-react'
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type EmailStatus = 'active' | 'draft' | 'scheduled' | 'paused'

type EmailTemplate = {
  id: string
  template: string
  description: string
  owner: string
  ownerInitials: string
  audience: string
  stage: string
  subject: string
  sent: number
  opens: number
  replies: number
  cta: string
  ctaRec: string
  lastEdited: Date
  status: EmailStatus
  icon: 'email' | 'video'
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const mockEmails: EmailTemplate[] = [
  {
    id: 'e1',
    template: 'Video Follow-up',
    description: 'Used for warm prospects after first contact',
    owner: 'James T.',
    ownerInitials: 'JT',
    audience: 'Warm Prospects',
    stage: 'Consideration',
    subject: "Following up — here's the video I mentioned",
    sent: 142,
    opens: 98,
    replies: 23,
    cta: 'Book a Call',
    ctaRec: 'Pair with a personalised video to lift reply rate and move leads to meeting booked.',
    lastEdited: new Date('2026-05-02T07:30:00Z'),
    status: 'active',
    icon: 'video',
  },
  {
    id: 'e2',
    template: 'Cold Outreach',
    description: 'First touch for new prospect segments',
    owner: 'Sarah K.',
    ownerInitials: 'SK',
    audience: 'Cold Prospects',
    stage: 'Awareness',
    subject: 'Quick question about your website',
    sent: 890,
    opens: 534,
    replies: 67,
    cta: 'Schedule Call',
    ctaRec: "A/B test subject lines — your current open rate has room to grow with curiosity-led hooks.",
    lastEdited: new Date('2026-05-01T14:00:00Z'),
    status: 'active',
    icon: 'email',
  },
  {
    id: 'e3',
    template: 'Proposal Follow-up',
    description: 'Chases sent proposals after 3 days of silence',
    owner: 'James T.',
    ownerInitials: 'JT',
    audience: 'Active Leads',
    stage: 'Proposal Sent',
    subject: 'Your proposal — any questions?',
    sent: 56,
    opens: 49,
    replies: 18,
    cta: 'Review Proposal',
    ctaRec: 'Include a testimonial from a similar industry client to increase close-rate confidence.',
    lastEdited: new Date('2026-04-28T11:00:00Z'),
    status: 'scheduled',
    icon: 'email',
  },
  {
    id: 'e4',
    template: 'Onboarding Welcome',
    description: 'Sent immediately after a new client signs',
    owner: 'Emma L.',
    ownerInitials: 'EL',
    audience: 'New Clients',
    stage: 'Won',
    subject: "Welcome to Online2Day — here's what happens next",
    sent: 34,
    opens: 33,
    replies: 12,
    cta: 'Book Kick-off Call',
    ctaRec: 'Link directly to the project portal so clients self-serve from day one.',
    lastEdited: new Date('2026-04-25T09:00:00Z'),
    status: 'active',
    icon: 'email',
  },
  {
    id: 'e5',
    template: 'Re-engagement',
    description: 'Reactivates leads dormant for 30+ days',
    owner: 'Sarah K.',
    ownerInitials: 'SK',
    audience: 'Cold Leads',
    stage: 'Nurture',
    subject: "Still thinking it over? Here's something that might help",
    sent: 201,
    opens: 88,
    replies: 9,
    cta: 'See Case Study',
    ctaRec: 'Segment by industry for 2× relevance and include a specific stat from their sector.',
    lastEdited: new Date('2026-04-20T16:00:00Z'),
    status: 'draft',
    icon: 'email',
  },
  {
    id: 'e6',
    template: 'Meeting Confirmation',
    description: 'Confirms a booked meeting with prep resources',
    owner: 'Emma L.',
    ownerInitials: 'EL',
    audience: 'Booked Leads',
    stage: 'Meeting Set',
    subject: "Your Online2Day meeting is confirmed ✓",
    sent: 78,
    opens: 76,
    replies: 14,
    cta: 'Add to Calendar',
    ctaRec: 'Add a pre-meeting questionnaire link to qualify intent before the call.',
    lastEdited: new Date('2026-04-15T10:00:00Z'),
    status: 'paused',
    icon: 'email',
  },
]

const ALL_OWNERS = ['James T.', 'Sarah K.', 'Emma L.']
const ALL_AUDIENCES = ['Warm Prospects', 'Cold Prospects', 'Active Leads', 'New Clients', 'Cold Leads', 'Booked Leads']
const ALL_STAGES = ['Awareness', 'Consideration', 'Proposal Sent', 'Meeting Set', 'Won', 'Nurture']

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatRelative(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return format(date, 'd MMM yyyy')
}

function statusConfig(status: EmailStatus) {
  const map: Record<EmailStatus, { label: string; color: string; icon: React.ReactNode }> = {
    active: { label: 'Active', color: '#22c55e', icon: <CheckCircle2 size={11} /> },
    draft: { label: 'Draft', color: '#64748b', icon: <PenLine size={11} /> },
    scheduled: { label: 'Scheduled', color: '#f59e0b', icon: <Clock size={11} /> },
    paused: { label: 'Paused', color: '#ef4444', icon: <AlertCircle size={11} /> },
  }
  return map[status]
}

function openRate(opens: number, sent: number) {
  if (!sent) return '0%'
  return `${Math.round((opens / sent) * 100)}%`
}

function replyRate(replies: number, sent: number) {
  if (!sent) return '0%'
  return `${Math.round((replies / sent) * 100)}%`
}

// ─── EXPORT FUNCTIONS ─────────────────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function exportCSV(data: EmailTemplate[]) {
  const headers = ['Template', 'Owner', 'Audience', 'Stage', 'Subject', 'Sent', 'Opens', 'Open Rate', 'Replies', 'Reply Rate', 'CTA', 'Status', 'Last Edited']
  const rows = data.map((e) => [
    e.template, e.owner, e.audience, e.stage, e.subject,
    e.sent, e.opens, openRate(e.opens, e.sent),
    e.replies, replyRate(e.replies, e.sent),
    e.cta, e.status, format(e.lastEdited, 'yyyy-MM-dd'),
  ])
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  triggerDownload(csv, `emails-export-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv')
}

function exportJSON(data: EmailTemplate[]) {
  const json = JSON.stringify(
    data.map((e) => ({ ...e, lastEdited: e.lastEdited.toISOString() })),
    null,
    2,
  )
  triggerDownload(json, `emails-export-${format(new Date(), 'yyyy-MM-dd')}.json`, 'application/json')
}

function exportExcel(data: EmailTemplate[]) {
  const headers = ['Template', 'Owner', 'Audience', 'Stage', 'Subject', 'Sent', 'Opens', 'Open Rate', 'Replies', 'CTA', 'Status', 'Last Edited']
  const rows = data.map((e) => [
    e.template, e.owner, e.audience, e.stage, e.subject,
    e.sent, e.opens, openRate(e.opens, e.sent),
    e.replies, e.cta, e.status, format(e.lastEdited, 'yyyy-MM-dd'),
  ])
  const tsv = [headers, ...rows].map((row) => row.join('\t')).join('\n')
  triggerDownload(tsv, `emails-export-${format(new Date(), 'yyyy-MM-dd')}.xls`, 'application/vnd.ms-excel')
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'rgba(11,17,28,0.94)',
  border: '1px solid rgba(116,147,196,0.15)',
  borderRadius: 12,
}

const inputSt: React.CSSProperties = {
  background: 'rgba(8,12,19,0.7)',
  border: '1px solid rgba(116,147,196,0.22)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13,
  color: '#f5f8ff',
  outline: 'none',
  width: '100%',
}

const btnGhost: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid rgba(116,147,196,0.2)',
  background: 'rgba(11,17,28,0.8)',
  color: '#9aa5b6',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  whiteSpace: 'nowrap' as const,
  transition: '120ms ease',
}

const btnBlue: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid rgba(59,130,246,0.45)',
  background: 'linear-gradient(135deg, rgba(37,99,235,0.35), rgba(37,99,235,0.15))',
  color: '#8ab4ff',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap' as const,
}

// ─── MULTI-DATE PICKER ────────────────────────────────────────────────────────

function MultiDatePicker({
  selected,
  onChange,
  maxDates,
}: {
  selected: Date[]
  onChange: (dates: Date[]) => void
  maxDates: number
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const toggleDate = (day: Date) => {
    const alreadySelected = selected.some((d) => isSameDay(d, day))
    if (alreadySelected) {
      onChange(selected.filter((d) => !isSameDay(d, day)))
    } else if (selected.length < maxDates) {
      onChange([...selected, day])
    }
  }

  return (
    <div style={{ width: 280 }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          style={{ ...btnGhost, padding: '4px 8px', fontSize: 12 }}
        >
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f5f8ff' }}>
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          style={{ ...btnGhost, padding: '4px 8px', fontSize: 12 }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#4a6080', fontWeight: 700, padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {days.map((day) => {
          const isSelected = selected.some((d) => isSameDay(d, day))
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
          const isDisabled = !isCurrentMonth
          return (
            <button
              key={day.toISOString()}
              onClick={() => !isDisabled && toggleDate(day)}
              disabled={isDisabled}
              style={{
                padding: '5px 2px',
                borderRadius: 6,
                border: 'none',
                cursor: isDisabled ? 'default' : 'pointer',
                fontSize: 12,
                fontWeight: isSelected ? 700 : 400,
                background: isSelected
                  ? '#3b82f6'
                  : isToday(day)
                  ? 'rgba(59,130,246,0.12)'
                  : 'transparent',
                color: isSelected ? '#fff' : isDisabled ? '#2a3a4a' : isToday(day) ? '#8ab4ff' : '#c4d4e8',
                transition: '100ms ease',
              }}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      {/* Selection info */}
      <div style={{ marginTop: 10, fontSize: 11, color: '#4a6080', textAlign: 'center' }}>
        {selected.length} / {maxDates} dates selected
      </div>

      {selected.length > 0 && (
        <button
          onClick={() => onChange([])}
          style={{ ...btnGhost, width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 12, padding: '6px' }}
        >
          Clear all dates
        </button>
      )}
    </div>
  )
}

// ─── MODALS ───────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(4,7,12,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ ...card, width: '100%', maxWidth: 560, maxHeight: '85vh', overflow: 'auto', padding: 28, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#f5f8ff' }}>{title}</h2>
          <button onClick={onClose} style={{ ...btnGhost, padding: '5px 8px', border: 'none', color: '#738094' }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9aa5b6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputSt, cursor: 'pointer', WebkitAppearance: 'none' }}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function ModalFooter({ onCancel, onSubmit, label }: { onCancel: () => void; onSubmit: () => void; label: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(116,147,196,0.12)' }}>
      <button onClick={onCancel} style={btnGhost}>Cancel</button>
      <button onClick={onSubmit} style={btnBlue}>{label}</button>
    </div>
  )
}

// New Campaign Modal
function NewCampaignModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [template, setTemplate] = useState('Video Follow-up')
  const [audience, setAudience] = useState('Warm Prospects')
  const [fromName, setFromName] = useState('Online2Day')
  const [fromEmail, setFromEmail] = useState('hello@online2day.co.uk')
  const [schedule, setSchedule] = useState('')
  const [done, setDone] = useState(false)

  const handleCreate = () => {
    if (!name || !subject) return
    setDone(true)
    setTimeout(onClose, 1600)
  }

  return (
    <Modal title="New Campaign" onClose={onClose}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#22c55e' }}>
          <CheckCircle2 size={40} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f8ff' }}>Campaign created!</div>
          <div style={{ fontSize: 13, color: '#738094', marginTop: 6 }}>Redirecting to editor…</div>
        </div>
      ) : (
        <>
          <ModalField label="Campaign Name (internal)">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="May 2026 Warm Prospect Push" style={inputSt} />
          </ModalField>
          <ModalField label="Subject Line">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What subscribers will see in their inbox" style={inputSt} />
          </ModalField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ModalField label="Base Template">
              <SelectInput value={template} onChange={setTemplate} options={mockEmails.map((e) => e.template)} />
            </ModalField>
            <ModalField label="Audience">
              <SelectInput value={audience} onChange={setAudience} options={ALL_AUDIENCES} />
            </ModalField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ModalField label="From Name">
              <input value={fromName} onChange={(e) => setFromName(e.target.value)} style={inputSt} />
            </ModalField>
            <ModalField label="From Email">
              <input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} style={inputSt} />
            </ModalField>
          </div>
          <ModalField label="Schedule Date (optional — leave blank to save as draft)">
            <input type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} style={inputSt} />
          </ModalField>
          <ModalFooter onCancel={onClose} onSubmit={handleCreate} label="Create Campaign →" />
        </>
      )}
    </Modal>
  )
}

// Create Template Modal
function CreateTemplateModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [subject, setSubject] = useState('')
  const [preview, setPreview] = useState('')
  const [audience, setAudience] = useState('Warm Prospects')
  const [stage, setStage] = useState('Consideration')
  const [cta, setCta] = useState('')
  const [body, setBody] = useState('')
  const [done, setDone] = useState(false)

  const handleSave = () => {
    if (!name || !subject) return
    setDone(true)
    setTimeout(onClose, 1400)
  }

  return (
    <Modal title="Create Email Template" onClose={onClose}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#22c55e' }}>
          <CheckCircle2 size={40} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f8ff' }}>Template saved!</div>
        </div>
      ) : (
        <>
          <ModalField label="Template Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Video Follow-up v2" style={inputSt} />
          </ModalField>
          <ModalField label="Description (internal)">
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="When and how this template is used" style={inputSt} />
          </ModalField>
          <ModalField label="Subject Line">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="The subject subscribers see" style={inputSt} />
          </ModalField>
          <ModalField label="Preview Text (inbox snippet)">
            <input value={preview} onChange={(e) => setPreview(e.target.value)} placeholder="Under 90 characters" style={inputSt} />
          </ModalField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ModalField label="Audience">
              <SelectInput value={audience} onChange={setAudience} options={ALL_AUDIENCES} />
            </ModalField>
            <ModalField label="Funnel Stage">
              <SelectInput value={stage} onChange={setStage} options={ALL_STAGES} />
            </ModalField>
          </div>
          <ModalField label="Call-to-Action Text">
            <input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="e.g. Book a Call, See Case Study" style={inputSt} />
          </ModalField>
          <ModalField label="Email Body (HTML or plain text)">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email content here…"
              rows={6}
              style={{ ...inputSt, resize: 'vertical' }}
            />
          </ModalField>
          <ModalFooter onCancel={onClose} onSubmit={handleSave} label="Save Template" />
        </>
      )}
    </Modal>
  )
}

// Start Sequence Modal
function StartSequenceModal({ onClose }: { onClose: () => void }) {
  const [seqName, setSeqName] = useState('')
  const [trigger, setTrigger] = useState('Contact added to list')
  const [steps] = useState([
    { delay: 'Immediately', type: 'Email', template: 'Cold Outreach' },
    { delay: '3 days later', type: 'Email', template: 'Video Follow-up' },
    { delay: '7 days later', type: 'Email', template: 'Proposal Follow-up' },
  ])
  const [done, setDone] = useState(false)

  return (
    <Modal title="Start Email Sequence" onClose={onClose}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#22c55e' }}>
          <CheckCircle2 size={40} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f8ff' }}>Sequence activated!</div>
        </div>
      ) : (
        <>
          <ModalField label="Sequence Name">
            <input value={seqName} onChange={(e) => setSeqName(e.target.value)} placeholder="e.g. Warm Prospect 3-Step" style={inputSt} />
          </ModalField>
          <ModalField label="Trigger">
            <SelectInput
              value={trigger}
              onChange={setTrigger}
              options={['Contact added to list', 'Form submitted', 'Meeting booked', 'Proposal sent', 'No reply after 5 days', 'Lead score reached 80']}
            />
          </ModalField>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9aa5b6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Sequence Steps
            </label>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', ...card, marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f8ff' }}>{step.template}</div>
                  <div style={{ fontSize: 11, color: '#738094' }}>{step.delay}</div>
                </div>
                <span style={{ fontSize: 11, color: '#3b82f6' }}>{step.type}</span>
              </div>
            ))}
            <button style={{ ...btnGhost, fontSize: 12, padding: '7px 12px', width: '100%', justifyContent: 'center', marginTop: 4 }}>
              <Plus size={13} /> Add Step
            </button>
          </div>

          <ModalFooter onCancel={onClose} onSubmit={() => { setDone(true); setTimeout(onClose, 1400) }} label="Launch Sequence" />
        </>
      )}
    </Modal>
  )
}

// Send Test Email Modal
function SendTestEmailModal({ onClose }: { onClose: () => void }) {
  const [to, setTo] = useState('')
  const [template, setTemplate] = useState('Video Follow-up')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!to) return
    setSending(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSending(false)
    setSent(true)
    setTimeout(onClose, 1500)
  }

  return (
    <Modal title="Send Test Email" onClose={onClose}>
      {sent ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#22c55e' }}>
          <Send size={40} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f8ff' }}>Test sent to {to}</div>
        </div>
      ) : (
        <>
          <div style={{ padding: '12px 14px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 8, fontSize: 12, color: '#738094', marginBottom: 20 }}>
            Test emails render real HTML with mock tracking and unsubscribe links.
          </div>
          <ModalField label="Template">
            <SelectInput value={template} onChange={setTemplate} options={mockEmails.map((e) => e.template)} />
          </ModalField>
          <ModalField label="Recipient Email">
            <input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="your@email.com" style={inputSt} />
          </ModalField>
          <ModalFooter
            onCancel={onClose}
            onSubmit={handleSend}
            label={sending ? 'Sending…' : 'Send Test Email'}
          />
        </>
      )}
    </Modal>
  )
}

// Import Contacts Modal
function ImportContactsModal({ onClose }: { onClose: () => void }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.csv')) setFile(f)
  }

  return (
    <Modal title="Import Contacts" onClose={onClose}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#22c55e' }}>
          <Users size={40} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f8ff' }}>Import queued!</div>
          <div style={{ fontSize: 13, color: '#738094', marginTop: 6 }}>Contacts will appear within 2 minutes.</div>
        </div>
      ) : (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#3b82f6' : file ? '#22c55e' : 'rgba(116,147,196,0.25)'}`,
              borderRadius: 10,
              padding: '36px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'rgba(59,130,246,0.05)' : 'transparent',
              marginBottom: 16,
              transition: '160ms ease',
            }}
          >
            <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f) }} />
            <Upload size={28} style={{ color: file ? '#22c55e' : '#4a6080', marginBottom: 10 }} />
            {file ? (
              <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>{file.name}</div>
            ) : (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#c4d4e8' }}>Drop CSV here or click to browse</div>
                <div style={{ fontSize: 12, color: '#4a6080', marginTop: 6 }}>Required columns: email, first_name (optional: company, phone)</div>
              </>
            )}
          </div>

          {file && (
            <div style={{ padding: '12px 14px', ...card, marginBottom: 16, fontSize: 13 }}>
              <div style={{ color: '#9aa5b6', marginBottom: 4, fontWeight: 600 }}>Column Mapping Preview</div>
              {['email → email', 'first_name → first_name', 'company → company'].map((m) => (
                <div key={m} style={{ color: '#738094', fontSize: 12, padding: '3px 0', borderBottom: '1px solid rgba(116,147,196,0.08)' }}>✓ {m}</div>
              ))}
            </div>
          )}

          <ModalFooter onCancel={onClose} onSubmit={() => { if (file) { setDone(true); setTimeout(onClose, 1600) } }} label="Import Contacts" />
        </>
      )}
    </Modal>
  )
}

// Log Activity Modal
function LogActivityModal({ onClose }: { onClose: () => void }) {
  const [contact, setContact] = useState('')
  const [type, setType] = useState('Email sent')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [done, setDone] = useState(false)

  const handleLog = () => {
    if (!contact) return
    setDone(true)
    setTimeout(onClose, 1400)
  }

  return (
    <Modal title="Log Activity" onClose={onClose}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#22c55e' }}>
          <CheckCircle2 size={40} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f8ff' }}>Activity logged!</div>
        </div>
      ) : (
        <>
          <ModalField label="Contact Name or Email">
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g. Sarah from Digital Pro" style={inputSt} />
          </ModalField>
          <ModalField label="Activity Type">
            <SelectInput
              value={type}
              onChange={setType}
              options={['Email sent', 'Email replied', 'Call made', 'Meeting held', 'Proposal sent', 'Note added', 'Demo given', 'Follow-up scheduled']}
            />
          </ModalField>
          <ModalField label="Date & Time">
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} style={inputSt} />
          </ModalField>
          <ModalField label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key points, outcomes, next steps…"
              rows={4}
              style={{ ...inputSt, resize: 'vertical' }}
            />
          </ModalField>
          <ModalFooter onCancel={onClose} onSubmit={handleLog} label="Log Activity" />
        </>
      )}
    </Modal>
  )
}

// Preview Email Modal
function PreviewEmailModal({ template, onClose }: { template: EmailTemplate; onClose: () => void }) {
  return (
    <Modal title={`Preview — ${template.template}`} onClose={onClose}>
      <div style={{ marginBottom: 14, padding: '10px 14px', ...card, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div><span style={{ color: '#738094' }}>From: </span><span style={{ color: '#f5f8ff' }}>Online2Day &lt;hello@online2day.co.uk&gt;</span></div>
        <div><span style={{ color: '#738094' }}>To: </span><span style={{ color: '#f5f8ff' }}>{template.audience}</span></div>
        <div><span style={{ color: '#738094' }}>Subject: </span><span style={{ color: '#f5f8ff' }}>{template.subject}</span></div>
      </div>
      <div style={{ border: '1px solid rgba(116,147,196,0.16)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ background: '#1e293b', padding: '8px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
          {['#ef4444', '#f59e0b', '#22c55e'].map((c) => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
          ))}
          <span style={{ fontSize: 11, color: '#4a6080', marginLeft: 8 }}>Email Preview</span>
        </div>
        <div style={{ background: '#f1f5f9', padding: '0 24px 24px' }}>
          <div style={{ background: '#05070b', padding: '16px 20px', margin: '20px 0 0', borderRadius: '8px 8px 0 0' }}>
            <div style={{ color: '#3b82f6', fontSize: 16, fontWeight: 700 }}>Online2Day</div>
          </div>
          <div style={{ background: '#fff', padding: '24px 20px' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{template.subject}</h2>
            <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
              Hi [First Name],<br /><br />
              {template.description} This email drives recipients towards: <strong>{template.cta}</strong>.<br /><br />
              <em style={{ color: '#94a3b8' }}>Full email body is composed in the campaign editor and compiled to email-safe HTML on send.</em>
            </p>
            <div style={{ marginTop: 20 }}>
              <a href="#" style={{ background: '#3b82f6', color: '#fff', padding: '10px 20px', borderRadius: 6, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                {template.cta} →
              </a>
            </div>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px 20px', textAlign: 'center', fontSize: 11, color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
            Online2Day · <span style={{ color: '#3b82f6' }}>Unsubscribe</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── FILTERS PANEL ────────────────────────────────────────────────────────────

type Filters = {
  status: string
  owner: string
  audience: string
  stage: string
}

function FiltersPanel({
  filters,
  onChange,
  onClose,
  onReset,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  onClose: () => void
  onReset: () => void
}) {
  const activeCount = Object.values(filters).filter((v) => v !== 'all').length

  return (
    <div
      style={{
        position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 6,
        ...card, padding: 20, width: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#f5f8ff' }}>
          Filters {activeCount > 0 && <span style={{ color: '#3b82f6', fontSize: 12 }}>({activeCount} active)</span>}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {activeCount > 0 && (
            <button onClick={onReset} style={{ ...btnGhost, fontSize: 11, padding: '4px 8px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
              Reset
            </button>
          )}
          <button onClick={onClose} style={{ ...btnGhost, padding: '4px 7px', border: 'none' }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {[
        { key: 'status' as keyof Filters, label: 'Status', options: ['all', 'active', 'draft', 'scheduled', 'paused'] },
        { key: 'owner' as keyof Filters, label: 'Owner', options: ['all', ...ALL_OWNERS] },
        { key: 'audience' as keyof Filters, label: 'Audience', options: ['all', ...ALL_AUDIENCES] },
        { key: 'stage' as keyof Filters, label: 'Funnel Stage', options: ['all', ...ALL_STAGES] },
      ].map(({ key, label, options }) => (
        <div key={key} style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#9aa5b6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            {label}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => onChange({ ...filters, [key]: opt })}
                style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: `1px solid ${filters[key] === opt ? '#3b82f6' : 'rgba(116,147,196,0.2)'}`,
                  background: filters[key] === opt ? 'rgba(59,130,246,0.2)' : 'transparent',
                  color: filters[key] === opt ? '#8ab4ff' : '#9aa5b6',
                  textTransform: opt === 'all' ? 'capitalize' : 'none',
                }}
              >
                {opt === 'all' ? 'All' : opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── EMAIL CARD ───────────────────────────────────────────────────────────────

function EmailCard({
  email,
  onPreview,
  onTestSend,
}: {
  email: EmailTemplate
  onPreview: () => void
  onTestSend: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [launched, setLaunched] = useState(false)
  const sc = statusConfig(email.status)

  const handleLaunch = async () => {
    setLaunching(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLaunching(false)
    setLaunched(true)
    setTimeout(() => setLaunched(false), 2000)
  }

  return (
    <div
      style={{
        ...card,
        padding: '0',
        overflow: 'hidden',
        transition: '160ms ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.3)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(116,147,196,0.15)' }}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 20px' }}>
        {/* Icon */}
        <div
          style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: email.icon === 'video' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.12)',
            border: `1px solid ${email.icon === 'video' ? 'rgba(139,92,246,0.25)' : 'rgba(59,130,246,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {email.icon === 'video'
            ? <Video size={18} style={{ color: '#8b5cf6' }} />
            : <Mail size={18} style={{ color: '#3b82f6' }} />
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#f5f8ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {email.template}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${sc.color}1a`, color: sc.color, border: `1px solid ${sc.color}33`, flexShrink: 0 }}>
              {sc.icon} {sc.label}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#738094', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {email.description}
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: '#738094' }}>
            <MetaChip label="Owner" value={email.owner} initials={email.ownerInitials} />
            <MetaChip label="Audience" value={email.audience} />
            <MetaChip label="Stage" value={email.stage} />
            <MetaChip label="Edited" value={formatRelative(email.lastEdited)} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, flexShrink: 0, alignItems: 'center' }}>
          <Stat label="Sent" value={email.sent.toLocaleString()} />
          <Stat label="Opens" value={openRate(email.opens, email.sent)} accent="#22c55e" />
          <Stat label="Replies" value={replyRate(email.replies, email.sent)} />
        </div>
      </div>

      {/* CTA Recommendation (inline, replaces the floating tooltip) */}
      <div style={{
        margin: '0 20px', marginBottom: 12, padding: '8px 12px',
        background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 8,
        display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <Lightbulb size={13} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 12, color: '#c4a55a', lineHeight: 1.5 }}>
          <strong style={{ color: '#f59e0b' }}>Recommended CTA: </strong>{email.ctaRec}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
        borderTop: '1px solid rgba(116,147,196,0.1)',
        background: 'rgba(4,8,15,0.4)',
      }}>
        <button onClick={onPreview} style={{ ...btnGhost, fontSize: 12, padding: '6px 12px', color: '#9aa5b6' }}>
          <Eye size={13} /> Preview email
        </button>
        <button onClick={onTestSend} style={{ ...btnGhost, fontSize: 12, padding: '6px 12px', color: '#9aa5b6' }}>
          <Send size={13} /> Send test
        </button>
        <button
          onClick={handleLaunch}
          style={{
            ...btnBlue, fontSize: 12, padding: '6px 14px',
            background: launched ? 'rgba(34,197,94,0.2)' : btnBlue.background,
            borderColor: launched ? 'rgba(34,197,94,0.4)' : btnBlue.borderColor,
            color: launched ? '#22c55e' : '#8ab4ff',
            opacity: launching ? 0.7 : 1,
          }}
        >
          {launching ? <><Clock size={13} /> Launching…</> : launched ? <><CheckCircle2 size={13} /> Launched!</> : <><Zap size={13} /> Launch campaign</>}
        </button>
        <button style={{ ...btnGhost, fontSize: 12, padding: '6px 12px', color: '#9aa5b6' }}>
          <GitBranch size={13} /> Create sequence
        </button>

        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            style={{ ...btnGhost, padding: '6px 8px', border: 'none', color: '#738094' }}
          >
            <MoreHorizontal size={15} />
          </button>
          {showMenu && (
            <div style={{ position: 'absolute', right: 0, bottom: '100%', marginBottom: 4, ...card, padding: 6, width: 160, zIndex: 20, boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}>
              {[
                { icon: <Edit3 size={13} />, label: 'Edit template' },
                { icon: <Copy size={13} />, label: 'Duplicate' },
                { icon: <BarChart2 size={13} />, label: 'View analytics' },
                { icon: <Star size={13} />, label: 'Mark as featured' },
                { icon: <Trash2 size={13} />, label: 'Delete', color: '#ef4444' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setShowMenu(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px',
                    borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer',
                    fontSize: 12, color: item.color ?? '#9aa5b6', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(116,147,196,0.08)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetaChip({ label, value, initials }: { label: string; value: string; initials?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {initials && (
        <span style={{
          width: 18, height: 18, borderRadius: '50%', background: '#1d4ed8',
          fontSize: 9, fontWeight: 700, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>{initials}</span>
      )}
      <span style={{ color: '#4a6080' }}>{label}:</span>
      <span style={{ color: '#c4d4e8', fontWeight: 500 }}>{value}</span>
    </span>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 40 }}>
      <div style={{ fontSize: 10, color: '#4a6080', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: accent ?? '#f5f8ff' }}>{value}</div>
    </div>
  )
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export function EmailsDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showCreateAdd, setShowCreateAdd] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [previewEmail, setPreviewEmail] = useState<EmailTemplate | null>(null)
  const [testSendEmail, setTestSendEmail] = useState<EmailTemplate | null>(null)

  const [filters, setFilters] = useState<Filters>({ status: 'all', owner: 'all', audience: 'all', stage: 'all' })

  const activeFilterCount = Object.values(filters).filter((v) => v !== 'all').length

  // Close popovers on outside click
  const filtersRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const createRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setShowFilters(false)
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false)
      if (createRef.current && !createRef.current.contains(e.target as Node)) setShowCreateAdd(false)
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setShowDatePicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    return mockEmails.filter((e) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !e.template.toLowerCase().includes(q) &&
          !e.subject.toLowerCase().includes(q) &&
          !e.audience.toLowerCase().includes(q) &&
          !e.owner.toLowerCase().includes(q) &&
          !e.description.toLowerCase().includes(q)
        ) return false
      }
      if (selectedDates.length > 0 && !selectedDates.some((d) => isSameDay(d, e.lastEdited))) return false
      if (filters.status !== 'all' && e.status !== filters.status) return false
      if (filters.owner !== 'all' && e.owner !== filters.owner) return false
      if (filters.audience !== 'all' && e.audience !== filters.audience) return false
      if (filters.stage !== 'all' && e.stage !== filters.stage) return false
      return true
    })
  }, [searchQuery, selectedDates, filters])

  const createOptions = [
    { key: 'campaign', icon: <Mail size={15} />, label: 'New campaign', desc: 'Build and send a one-off email' },
    { key: 'template', icon: <FileText size={15} />, label: 'Create template', desc: 'Save a reusable email design' },
    { key: 'sequence', icon: <GitBranch size={15} />, label: 'Start sequence', desc: 'Automate a multi-step journey' },
    { key: 'test', icon: <Send size={15} />, label: 'Send test email', desc: 'Preview in a real inbox' },
    { key: 'import', icon: <Upload size={15} />, label: 'Import contacts', desc: 'Upload CSV to add subscribers' },
    { key: 'log', icon: <ClipboardList size={15} />, label: 'Log activity', desc: 'Record an offline touchpoint' },
  ]

  const summaryStats = useMemo(() => ({
    totalSent: mockEmails.reduce((s, e) => s + e.sent, 0),
    avgOpen: Math.round(mockEmails.reduce((s, e) => s + (e.sent ? (e.opens / e.sent) * 100 : 0), 0) / mockEmails.length),
    avgReply: Math.round(mockEmails.reduce((s, e) => s + (e.sent ? (e.replies / e.sent) * 100 : 0), 0) / mockEmails.length),
    templates: mockEmails.length,
  }), [])

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#f5f8ff' }}>Emails</h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#738094' }}>
          Send, test and track emails that move leads closer to sale.
        </p>
      </div>

      {/* Summary stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Sent', value: summaryStats.totalSent.toLocaleString(), icon: <Send size={15} />, color: '#3b82f6' },
          { label: 'Avg Open Rate', value: `${summaryStats.avgOpen}%`, icon: <Eye size={15} />, color: '#22c55e' },
          { label: 'Avg Reply Rate', value: `${summaryStats.avgReply}%`, icon: <TrendingUp size={15} />, color: '#8b5cf6' },
          { label: 'Templates', value: summaryStats.templates.toString(), icon: <FileText size={15} />, color: '#f59e0b' },
        ].map((s) => (
          <div key={s.label} style={{ ...card, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.color, marginBottom: 6 }}>
              {s.icon}
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#738094' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f5f8ff' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4a6080', pointerEvents: 'none' }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates, subjects, owners…"
            style={{ ...inputSt, paddingLeft: 32 }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a6080', display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Date picker */}
        <div ref={dateRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDatePicker((v) => !v)}
            style={{
              ...btnGhost,
              color: selectedDates.length > 0 ? '#8ab4ff' : '#9aa5b6',
              borderColor: selectedDates.length > 0 ? 'rgba(59,130,246,0.4)' : 'rgba(116,147,196,0.2)',
              background: selectedDates.length > 0 ? 'rgba(59,130,246,0.1)' : btnGhost.background,
            }}
          >
            <CalendarDays size={14} />
            {selectedDates.length > 0 ? `${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} selected` : 'Filter by date'}
          </button>
          {showDatePicker && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 50, ...card, padding: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <MultiDatePicker selected={selectedDates} onChange={setSelectedDates} maxDates={10} />
            </div>
          )}
        </div>

        {/* Filters */}
        <div ref={filtersRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowFilters((v) => !v); setShowExport(false); setShowCreateAdd(false) }}
            style={{
              ...btnGhost,
              color: activeFilterCount > 0 ? '#8ab4ff' : '#9aa5b6',
              borderColor: activeFilterCount > 0 ? 'rgba(59,130,246,0.4)' : 'rgba(116,147,196,0.2)',
              background: activeFilterCount > 0 ? 'rgba(59,130,246,0.1)' : btnGhost.background,
            }}
          >
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{ background: '#3b82f6', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '0 5px', minWidth: 16, textAlign: 'center' }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          {showFilters && (
            <FiltersPanel
              filters={filters}
              onChange={setFilters}
              onClose={() => setShowFilters(false)}
              onReset={() => setFilters({ status: 'all', owner: 'all', audience: 'all', stage: 'all' })}
            />
          )}
        </div>

        {/* Export */}
        <div ref={exportRef} style={{ position: 'relative' }}>
          <button onClick={() => { setShowExport((v) => !v); setShowFilters(false); setShowCreateAdd(false) }} style={btnGhost}>
            <Download size={14} /> Export <ChevronDown size={12} />
          </button>
          {showExport && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 50, ...card, padding: 6, width: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              {[
                { icon: <Table2 size={14} />, label: 'Export as CSV', action: () => exportCSV(filtered) },
                { icon: <FileJson size={14} />, label: 'Export as JSON', action: () => exportJSON(filtered) },
                { icon: <FileText size={14} />, label: 'Export as Excel (.xls)', action: () => exportExcel(filtered) },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => { opt.action(); setShowExport(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px',
                    borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer',
                    fontSize: 13, color: '#c4d4e8', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.1)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <span style={{ color: '#3b82f6' }}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
              <div style={{ padding: '6px 12px 4px', fontSize: 11, color: '#4a6080' }}>
                Exporting {filtered.length} of {mockEmails.length} records
              </div>
            </div>
          )}
        </div>

        {/* Create / Add */}
        <div ref={createRef} style={{ position: 'relative', marginLeft: 'auto' }}>
          <button onClick={() => { setShowCreateAdd((v) => !v); setShowFilters(false); setShowExport(false) }} style={btnBlue}>
            <Plus size={15} /> Create / Add <ChevronDown size={12} />
          </button>
          {showCreateAdd && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 50, ...card, padding: 6, width: 240, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              {createOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setActiveModal(opt.key); setShowCreateAdd(false) }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', padding: '9px 12px',
                    borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.08)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <span style={{ color: '#3b82f6', marginTop: 1, flexShrink: 0 }}>{opt.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f8ff' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: '#4a6080', marginTop: 1 }}>{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active date chips */}
      {selectedDates.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {selectedDates.map((d) => (
            <span key={d.toISOString()} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20, fontSize: 12,
              background: 'rgba(59,130,246,0.12)', color: '#8ab4ff',
              border: '1px solid rgba(59,130,246,0.25)',
            }}>
              {format(d, 'd MMM yyyy')}
              <button onClick={() => setSelectedDates(selectedDates.filter((sd) => !isSameDay(sd, d)))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', display: 'flex', padding: 0 }}>
                <X size={11} />
              </button>
            </span>
          ))}
          <button onClick={() => setSelectedDates([])} style={{ ...btnGhost, padding: '3px 10px', fontSize: 12, color: '#4a6080' }}>
            Clear all
          </button>
        </div>
      )}

      {/* Results count */}
      <div style={{ fontSize: 12, color: '#4a6080', marginBottom: 14 }}>
        {filtered.length === mockEmails.length
          ? `${mockEmails.length} email templates`
          : `${filtered.length} of ${mockEmails.length} templates matching filters`}
      </div>

      {/* Email cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length > 0 ? (
          filtered.map((email) => (
            <EmailCard
              key={email.id}
              email={email}
              onPreview={() => setPreviewEmail(email)}
              onTestSend={() => { setTestSendEmail(email); setActiveModal('test') }}
            />
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#738094' }}>
            <Mail size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: 15, fontWeight: 600 }}>No emails match your filters</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Try clearing filters or{' '}
              <button onClick={() => { setFilters({ status: 'all', owner: 'all', audience: 'all', stage: 'all' }); setSearchQuery(''); setSelectedDates([]) }}
                style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 13, padding: 0 }}>
                reset all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal === 'campaign' && <NewCampaignModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'template' && <CreateTemplateModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'sequence' && <StartSequenceModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'test' && <SendTestEmailModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'import' && <ImportContactsModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'log' && <LogActivityModal onClose={() => setActiveModal(null)} />}
      {previewEmail && <PreviewEmailModal template={previewEmail} onClose={() => setPreviewEmail(null)} />}
    </div>
  )
}
