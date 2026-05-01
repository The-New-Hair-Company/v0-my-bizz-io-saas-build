'use client'

// components/newsletter/NewsletterDashboard.tsx
// Full-featured newsletter dashboard — campaign list, editor, subscribers, analytics.
// Matches the dark CRM dashboard aesthetic of the existing site.

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  FileText,
  Globe,
  ImageIcon,
  Inbox,
  Mail,
  MousePointerClick,
  PauseCircle,
  PenLine,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { CampaignStatus, NewsletterCampaign } from '@/types/newsletter'

// ─────────────────────────────────────────
// MOCK DATA (replace with Supabase queries)
// ─────────────────────────────────────────
const mockCampaigns: NewsletterCampaign[] = [
  {
    id: 'c1',
    slug: 'may-2026-update',
    title: 'May 2026 Platform Update',
    subject: 'Your website just got smarter — here\'s what\'s new',
    preview_text: 'Three new features, two case studies, one very good deal.',
    from_name: 'Online2Day',
    from_email: 'news@online2day.co.uk',
    reply_to: null,
    list_id: 'l1',
    status: 'sent',
    scheduled_at: null,
    sent_at: '2026-05-01T09:00:00Z',
    created_by: null,
    created_at: '2026-04-28T10:00:00Z',
    updated_at: '2026-05-01T09:01:00Z',
    _stats: { total: 1842, sent: 1842, delivered: 1798, opened: 1124, clicked: 387, bounced: 44, complained: 2, unsubscribed: 9, open_rate: 62.5, click_rate: 21.5, bounce_rate: 2.4 },
  },
  {
    id: 'c2',
    slug: null,
    title: 'June Client Spotlight',
    subject: 'How The New Hair Company grew leads by 140%',
    preview_text: 'A deep dive into what changed and how it happened.',
    from_name: 'Online2Day',
    from_email: 'news@online2day.co.uk',
    reply_to: null,
    list_id: 'l1',
    status: 'scheduled',
    scheduled_at: '2026-06-03T08:00:00Z',
    sent_at: null,
    created_by: null,
    created_at: '2026-05-01T11:00:00Z',
    updated_at: '2026-05-01T11:00:00Z',
    _stats: undefined,
  },
  {
    id: 'c3',
    slug: null,
    title: 'Summer SEO Guide',
    subject: 'The 7 SEO fixes that move the needle in 2026',
    preview_text: 'Quick wins for service businesses wanting more traffic.',
    from_name: 'Online2Day',
    from_email: 'news@online2day.co.uk',
    reply_to: null,
    list_id: 'l1',
    status: 'draft',
    scheduled_at: null,
    sent_at: null,
    created_by: null,
    created_at: '2026-04-30T14:00:00Z',
    updated_at: '2026-04-30T16:30:00Z',
    _stats: undefined,
  },
]

const mockSubscriberStats = {
  total: 1842,
  active: 1798,
  unsubscribed: 36,
  bounced: 44,
  newThisMonth: 218,
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
const cx = (...c: Array<string | false | undefined | null>) => c.filter(Boolean).join(' ')

function statusBadge(status: CampaignStatus) {
  const map: Record<CampaignStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft:     { label: 'Draft',     color: '#64748b', icon: <PenLine size={11} /> },
    scheduled: { label: 'Scheduled', color: '#f59e0b', icon: <Clock size={11} /> },
    sending:   { label: 'Sending',   color: '#3b82f6', icon: <Send size={11} /> },
    sent:      { label: 'Sent',      color: '#22c55e', icon: <CheckCircle2 size={11} /> },
    cancelled: { label: 'Cancelled', color: '#ef4444', icon: <X size={11} /> },
  }
  const s = map[status] ?? map.draft
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: `${s.color}22`,
        color: s.color,
        border: `1px solid ${s.color}44`,
      }}
    >
      {s.icon} {s.label}
    </span>
  )
}

function pct(n: number) {
  return `${n.toFixed(1)}%`
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─────────────────────────────────────────
// SUB-VIEWS
// ─────────────────────────────────────────

type View = 'campaigns' | 'create' | 'edit' | 'subscribers' | 'analytics'

// ─────────────────────────────────────────
// CAMPAIGN LIST VIEW
// ─────────────────────────────────────────
function CampaignListView({ onEdit, onCreate }: { onEdit: (c: NewsletterCampaign) => void; onCreate: () => void }) {
  const [campaigns] = useState(mockCampaigns)
  const [filter, setFilter] = useState<'all' | CampaignStatus>('all')

  const filtered = campaigns.filter((c) => filter === 'all' || c.status === filter)

  const tabs: Array<{ key: 'all' | CampaignStatus; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Drafts' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'sent', label: 'Sent' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Subscribers', value: mockSubscriberStats.total.toLocaleString(), icon: <Users size={16} />, color: '#3b82f6' },
          { label: 'Active', value: mockSubscriberStats.active.toLocaleString(), icon: <CheckCircle2 size={16} />, color: '#22c55e' },
          { label: 'New This Month', value: `+${mockSubscriberStats.newThisMonth}`, icon: <TrendingUp size={16} />, color: '#8b5cf6' },
          { label: 'Campaigns Sent', value: campaigns.filter((c) => c.status === 'sent').length.toString(), icon: <Send size={16} />, color: '#f59e0b' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'rgba(11,17,28,0.94)',
              border: '1px solid rgba(116,147,196,0.16)',
              borderRadius: 10,
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: stat.color, marginBottom: 8 }}>
              {stat.icon}
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9aa5b6' }}>
                {stat.label}
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#f5f8ff' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {/* Tab filter */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(11,17,28,0.6)', borderRadius: 8, padding: 3, border: '1px solid rgba(116,147,196,0.14)' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                background: filter === t.key ? 'rgba(59,130,246,0.28)' : 'transparent',
                color: filter === t.key ? '#8ab4ff' : '#9aa5b6',
                transition: '160ms ease',
              }}
            >
              {t.label}
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
                {t.key === 'all' ? campaigns.length : campaigns.filter((c) => c.status === t.key).length}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onCreate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 18px',
            borderRadius: 8,
            border: '1px solid rgba(59,130,246,0.4)',
            background: 'linear-gradient(135deg,rgba(37,99,235,0.3),rgba(37,99,235,0.1))',
            color: '#8ab4ff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {/* Campaign cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((campaign) => (
          <div
            key={campaign.id}
            style={{
              background: 'rgba(11,17,28,0.94)',
              border: '1px solid rgba(116,147,196,0.16)',
              borderRadius: 12,
              padding: '18px 20px',
              cursor: 'pointer',
              transition: '160ms ease',
            }}
            onClick={() => onEdit(campaign)}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.38)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(116,147,196,0.16)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  {statusBadge(campaign.status)}
                  <span style={{ fontSize: 12, color: '#738094' }}>{formatDate(campaign.sent_at ?? campaign.scheduled_at ?? campaign.created_at)}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f8ff', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {campaign.title}
                </div>
                <div style={{ fontSize: 13, color: '#9aa5b6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {campaign.subject}
                </div>
              </div>

              {/* Stats (sent campaigns only) */}
              {campaign._stats && (
                <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
                  <Stat icon={<Send size={13} />} label="Sent" value={campaign._stats.sent.toLocaleString()} />
                  <Stat icon={<Eye size={13} />} label="Open" value={pct(campaign._stats.open_rate)} highlight />
                  <Stat icon={<MousePointerClick size={13} />} label="CTR" value={pct(campaign._stats.click_rate)} />
                  <Stat icon={<AlertTriangle size={13} />} label="Bounce" value={pct(campaign._stats.bounce_rate)} dim />
                </div>
              )}

              <ChevronRight size={16} style={{ color: '#738094', flexShrink: 0 }} />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#738094' }}>
            <Inbox size={36} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div style={{ fontSize: 15, fontWeight: 500 }}>No campaigns found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Create your first newsletter campaign to get started.</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ icon, label, value, highlight, dim }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean; dim?: boolean }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 52 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#738094', marginBottom: 2 }}>
        {icon}
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: highlight ? '#22c55e' : dim ? '#ef4444' : '#f5f8ff' }}>{value}</div>
    </div>
  )
}

// ─────────────────────────────────────────
// CAMPAIGN EDITOR VIEW
// ─────────────────────────────────────────
function CampaignEditorView({ campaign, onBack }: { campaign: NewsletterCampaign | null; onBack: () => void }) {
  const isNew = !campaign
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'preview' | 'send'>('content')
  const [subject, setSubject] = useState(campaign?.subject ?? '')
  const [title, setTitle] = useState(campaign?.title ?? '')
  const [previewText, setPreviewText] = useState(campaign?.preview_text ?? '')
  const [fromName, setFromName] = useState(campaign?.from_name ?? 'Online2Day')
  const [fromEmail, setFromEmail] = useState(campaign?.from_email ?? 'news@online2day.co.uk')
  const [heroUrl, setHeroUrl] = useState(campaign?.latest_version?.hero_image_url ?? '')
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testSent, setTestSent] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')

  const tabs = [
    { key: 'content', label: 'Content', icon: <Edit3 size={14} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={14} /> },
    { key: 'preview', label: 'Preview', icon: <Eye size={14} /> },
    { key: 'send', label: 'Send / Schedule', icon: <Send size={14} /> },
  ] as const

  const handleSaveDraft = useCallback(async () => {
    setSaving(true)
    try {
      await fetch('/api/newsletters/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaign?.id, title, subject, preview_text: previewText, from_name: fromName, from_email: fromEmail }),
      })
    } finally {
      setSaving(false)
    }
  }, [campaign?.id, title, subject, previewText, fromName, fromEmail])

  const handleTestSend = useCallback(async () => {
    await fetch('/api/newsletters/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: campaign?.id ?? 'draft', to: [testEmail] }),
    })
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }, [campaign?.id, testEmail])

  const handleSchedule = useCallback(async () => {
    await fetch('/api/newsletters/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: campaign?.id, scheduled_at: scheduleDate }),
    })
    onBack()
  }, [campaign?.id, scheduleDate, onBack])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: '1px solid rgba(116,147,196,0.2)', borderRadius: 6, padding: '6px 12px', color: '#9aa5b6', cursor: 'pointer', fontSize: 13 }}
          >
            ← Back
          </button>
          <span style={{ color: '#738094', fontSize: 13 }}>/</span>
          <span style={{ color: '#f5f8ff', fontSize: 14, fontWeight: 600 }}>
            {isNew ? 'New Campaign' : campaign.title}
          </span>
          {campaign && statusBadge(campaign.status)}
        </div>
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8,
            border: '1px solid rgba(59,130,246,0.3)',
            background: saving ? 'rgba(59,130,246,0.1)' : 'rgba(37,99,235,0.2)',
            color: '#8ab4ff', cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
          }}
        >
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <FileText size={13} />}
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(116,147,196,0.16)', marginBottom: 24 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '10px 18px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: 'transparent',
              color: activeTab === tab.key ? '#8ab4ff' : '#738094',
              borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: -1,
              transition: '160ms ease',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Field label="Campaign Title (internal)">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. May 2026 Newsletter" style={inputStyle} />
          </Field>
          <Field label="Email Subject Line">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What your subscribers will see in their inbox" style={inputStyle} />
          </Field>
          <Field label="Preview Text (shown after subject in inbox)">
            <input value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="One line teaser — keep under 90 characters" style={inputStyle} />
          </Field>
          <Field label="Hero Image URL (CDN or Supabase Storage)">
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={heroUrl} onChange={(e) => setHeroUrl(e.target.value)} placeholder="https://cdn.online2day.co.uk/newsletter/may-2026-hero.jpg" style={{ ...inputStyle, flex: 1 }} />
              <button style={{ ...iconBtnStyle, gap: 6, paddingLeft: 12, paddingRight: 12, fontSize: 13 }}>
                <Upload size={14} /> Upload
              </button>
            </div>
            {heroUrl && (
              <img src={heroUrl} alt="Hero preview" style={{ marginTop: 8, maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(116,147,196,0.2)' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
          </Field>

          {/* Rich text editor placeholder — TipTap is already installed */}
          <Field label="Email Body">
            <div
              style={{
                background: 'rgba(8,12,19,0.6)',
                border: '1px solid rgba(116,147,196,0.2)',
                borderRadius: 8,
                padding: 16,
                minHeight: 240,
                color: '#9aa5b6',
                fontSize: 14,
              }}
            >
              <div style={{ borderBottom: '1px solid rgba(116,147,196,0.12)', paddingBottom: 10, marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['B', 'I', 'U', 'H2', 'Link', 'List', 'Image'].map((btn) => (
                  <button key={btn} style={{ padding: '4px 10px', fontSize: 12, fontWeight: 600, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 5, color: '#8ab4ff', cursor: 'pointer' }}>
                    {btn}
                  </button>
                ))}
              </div>
              <div style={{ color: '#738094', fontStyle: 'italic' }}>
                TipTap rich text editor renders here.<br />
                The design_json is stored in newsletter_campaign_versions and compiled to email-safe HTML on send.
              </div>
            </div>
          </Field>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Field label="From Name">
            <input value={fromName} onChange={(e) => setFromName(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="From Email (must be verified with your provider)">
            <input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Reply-To (optional — defaults to From Email)">
            <input placeholder="hello@online2day.co.uk" style={inputStyle} />
          </Field>
          <Field label="Subscriber List">
            <select style={{ ...inputStyle, cursor: 'pointer' }}>
              <option>Main Newsletter (1,842 active)</option>
              <option>New Subscribers (218)</option>
            </select>
          </Field>
          <Field label="UTM Campaign Tag">
            <input placeholder="may-2026-platform-update" style={inputStyle} />
          </Field>
          <div style={{ padding: 16, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 13, color: '#94a3b8' }}>
            <strong style={{ color: '#8ab4ff' }}>Deliverability checklist:</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['SPF/DKIM/DMARC configured on news.online2day.co.uk', 'All subscribers have given consent', 'Unsubscribe link is included (auto-injected)', 'Plain-text fallback will be auto-generated', 'List-Unsubscribe header injected automatically'].map((item) => (
                <li key={item} style={{ color: '#22c55e' }}>✓ {item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div>
          <div style={{ marginBottom: 16, padding: 12, background: 'rgba(11,17,28,0.8)', border: '1px solid rgba(116,147,196,0.16)', borderRadius: 8, display: 'flex', gap: 20, fontSize: 13 }}>
            <div><span style={{ color: '#738094' }}>From: </span><span style={{ color: '#f5f8ff' }}>{fromName} &lt;{fromEmail}&gt;</span></div>
            <div><span style={{ color: '#738094' }}>Subject: </span><span style={{ color: '#f5f8ff' }}>{subject || 'No subject set'}</span></div>
          </div>
          <div style={{ border: '1px solid rgba(116,147,196,0.16)', borderRadius: 10, overflow: 'hidden', background: '#f1f5f9' }}>
            {/* Simulated email client */}
            <div style={{ background: '#1e293b', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>Email Preview — 600px</span>
            </div>
            <div style={{ padding: '0 40px 40px', maxWidth: 680, margin: '0 auto' }}>
              {/* Brand bar */}
              <div style={{ background: '#05070b', padding: '18px 24px', margin: '24px 0 0', borderRadius: '8px 8px 0 0' }}>
                <div style={{ color: '#3b82f6', fontSize: 20, fontWeight: 700 }}>Online2Day</div>
                <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>Helping businesses get found online</div>
              </div>
              {heroUrl && (
                <img src={heroUrl} alt="Hero" style={{ width: '100%', display: 'block', maxHeight: 280, objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )}
              <div style={{ background: '#ffffff', padding: '28px 24px', borderRadius: heroUrl ? '0' : '0 0 8px 8px' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>{subject || 'Subject line will appear here'}</div>
                <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>
                  Your email body content will appear here, compiled from the rich text editor above.<br /><br />
                  {previewText && <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>{previewText}</span>}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px 24px', borderRadius: '0 0 8px 8px', textAlign: 'center', fontSize: 11, color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
                Online2Day · <span style={{ color: '#3b82f6', cursor: 'pointer' }}>Unsubscribe</span> · <span style={{ color: '#94a3b8', cursor: 'pointer' }}>Privacy Policy</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Tab */}
      {activeTab === 'send' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
          {/* Test send */}
          <div style={{ background: 'rgba(11,17,28,0.94)', border: '1px solid rgba(116,147,196,0.16)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f5f8ff', marginBottom: 4 }}>
              <Mail size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Send Test Email
            </div>
            <div style={{ fontSize: 12, color: '#738094', marginBottom: 14 }}>
              Test renders will use real email HTML with mock unsubscribe/tracking links.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={handleTestSend} style={{ ...iconBtnStyle, paddingLeft: 14, paddingRight: 14, background: testSent ? 'rgba(34,197,94,0.2)' : undefined, color: testSent ? '#22c55e' : undefined }}>
                {testSent ? <><CheckCircle2 size={14} /> Sent!</> : <><Send size={14} /> Send Test</>}
              </button>
            </div>
          </div>

          {/* Schedule */}
          <div style={{ background: 'rgba(11,17,28,0.94)', border: '1px solid rgba(116,147,196,0.16)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f5f8ff', marginBottom: 4 }}>
              <Calendar size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Schedule Campaign
            </div>
            <div style={{ fontSize: 12, color: '#738094', marginBottom: 14 }}>
              Jobs are created for every active subscriber. Batches of 100 are processed by the worker cron.
            </div>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              style={{ ...inputStyle, marginBottom: 10 }}
            />
            <button onClick={handleSchedule} disabled={!scheduleDate} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: '1px solid rgba(59,130,246,0.4)', background: scheduleDate ? 'rgba(37,99,235,0.25)' : 'rgba(37,99,235,0.08)', color: scheduleDate ? '#8ab4ff' : '#4a5568', cursor: scheduleDate ? 'pointer' : 'default', fontWeight: 600, fontSize: 14 }}>
              Schedule Send
            </button>
          </div>

          {/* Send now */}
          <div style={{ background: 'rgba(11,17,28,0.94)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f59e0b', marginBottom: 4 }}>
              <Send size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Send Now
            </div>
            <div style={{ fontSize: 12, color: '#738094', marginBottom: 14 }}>
              Immediately enqueues jobs for all 1,842 active subscribers and begins processing.
            </div>
            <button style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              Send to 1,842 Subscribers
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// SUBSCRIBERS VIEW
// ─────────────────────────────────────────
function SubscribersView() {
  const [query, setQuery] = useState('')
  const mockSubs = [
    { id: '1', email: 'sarah@digitalpro.co.uk', first_name: 'Sarah', company: 'Digital Pro', status: 'active', source: 'website', created_at: '2026-03-12T10:00:00Z' },
    { id: '2', email: 'mike@hairplus.com', first_name: 'Mike', company: 'Hair Plus', status: 'active', source: 'import', created_at: '2026-02-08T09:00:00Z' },
    { id: '3', email: 'jane@salonsuite.co.uk', first_name: 'Jane', company: 'Salon Suite', status: 'unsubscribed', source: 'website', created_at: '2026-01-20T08:00:00Z' },
    { id: '4', email: 'tom@growthco.io', first_name: 'Tom', company: 'Growth Co', status: 'bounced', source: 'manual', created_at: '2026-04-01T14:00:00Z' },
  ].filter((s) => !query || s.email.includes(query) || (s.first_name ?? '').toLowerCase().includes(query.toLowerCase()) || (s.company ?? '').toLowerCase().includes(query.toLowerCase()))

  const statusColor: Record<string, string> = { active: '#22c55e', unsubscribed: '#64748b', bounced: '#ef4444', complained: '#f59e0b' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subscribers by email, name, or company…"
            style={{ ...inputStyle, paddingLeft: 36, width: '100%' }}
          />
          <Users size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#738094' }} />
        </div>
        <button style={{ ...iconBtnStyle, gap: 6, paddingLeft: 12, paddingRight: 12 }}>
          <Upload size={14} /> Import CSV
        </button>
        <button style={{ ...iconBtnStyle, gap: 6, paddingLeft: 12, paddingRight: 12 }}>
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(11,17,28,0.94)', border: '1px solid rgba(116,147,196,0.16)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(116,147,196,0.14)' }}>
              {['Email', 'Name', 'Company', 'Status', 'Source', 'Joined', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#738094' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockSubs.map((sub) => (
              <tr key={sub.id} style={{ borderBottom: '1px solid rgba(116,147,196,0.08)' }}>
                <td style={{ padding: '12px 16px', color: '#8ab4ff' }}>{sub.email}</td>
                <td style={{ padding: '12px 16px', color: '#f5f8ff' }}>{sub.first_name}</td>
                <td style={{ padding: '12px 16px', color: '#9aa5b6' }}>{sub.company}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: `${statusColor[sub.status]}22`, color: statusColor[sub.status] }}>
                    {sub.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#738094' }}>{sub.source}</td>
                <td style={{ padding: '12px 16px', color: '#738094' }}>{formatDate(sub.created_at)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.6 }}>
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// ANALYTICS VIEW
// ─────────────────────────────────────────
function AnalyticsView() {
  const campaign = mockCampaigns[0] // Most recent sent
  const stats = campaign._stats!

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 13, color: '#738094' }}>
        Showing analytics for: <span style={{ color: '#8ab4ff', fontWeight: 600 }}>{campaign.title}</span>
        <span style={{ marginLeft: 12, fontSize: 12, color: '#4a5568' }}>Sent {formatDate(campaign.sent_at)}</span>
      </div>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Delivered', value: stats.delivered.toLocaleString(), sub: `${pct((stats.delivered / stats.sent) * 100)} of sent`, color: '#3b82f6' },
          { label: 'Open Rate', value: pct(stats.open_rate), sub: `${stats.opened.toLocaleString()} opened`, color: '#22c55e' },
          { label: 'Click Rate', value: pct(stats.click_rate), sub: `${stats.clicked.toLocaleString()} clicked`, color: '#8b5cf6' },
          { label: 'Bounced', value: pct(stats.bounce_rate), sub: `${stats.bounced} bounced`, color: '#ef4444' },
        ].map((m) => (
          <div key={m.label} style={{ background: 'rgba(11,17,28,0.94)', border: '1px solid rgba(116,147,196,0.16)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#738094', marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: m.color, marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 12, color: '#738094' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Bar chart visualisation */}
      <div style={{ background: 'rgba(11,17,28,0.94)', border: '1px solid rgba(116,147,196,0.16)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f8ff', marginBottom: 20 }}>Email Funnel</div>
        {[
          { label: 'Sent', value: stats.sent, max: stats.sent, color: '#3b82f6' },
          { label: 'Delivered', value: stats.delivered, max: stats.sent, color: '#60a5fa' },
          { label: 'Opened', value: stats.opened, max: stats.sent, color: '#22c55e' },
          { label: 'Clicked', value: stats.clicked, max: stats.sent, color: '#8b5cf6' },
          { label: 'Bounced', value: stats.bounced, max: stats.sent, color: '#ef4444' },
          { label: 'Unsubscribed', value: stats.unsubscribed, max: stats.sent, color: '#64748b' },
        ].map((bar) => (
          <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div style={{ width: 100, fontSize: 12, color: '#9aa5b6', textAlign: 'right' }}>{bar.label}</div>
            <div style={{ flex: 1, background: 'rgba(116,147,196,0.1)', borderRadius: 4, height: 22, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(bar.value / bar.max) * 100}%`,
                  background: bar.color,
                  borderRadius: 4,
                  transition: '800ms ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                  {bar.value.toLocaleString()}
                </span>
              </div>
            </div>
            <div style={{ width: 44, fontSize: 12, color: bar.color, fontWeight: 700 }}>
              {pct((bar.value / bar.max) * 100)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: 14, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 12, color: '#9aa5b6' }}>
        <strong style={{ color: '#f59e0b' }}>Analytics note:</strong> Open rates are directional — many email clients pre-fetch or block tracking pixels. Rely on click-through rate, reply rate, and downstream conversions as primary success metrics.
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  background: 'rgba(8,12,19,0.7)',
  border: '1px solid rgba(116,147,196,0.22)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 14,
  color: '#f5f8ff',
  outline: 'none',
  width: '100%',
}

const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid rgba(59,130,246,0.3)',
  background: 'rgba(37,99,235,0.12)',
  color: '#8ab4ff',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9aa5b6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────
// ROOT NEWSLETTER DASHBOARD
// ─────────────────────────────────────────
type SubView = 'campaigns' | 'subscribers' | 'analytics'

export function NewsletterDashboard() {
  const [subView, setSubView] = useState<SubView>('campaigns')
  const [editingCampaign, setEditingCampaign] = useState<NewsletterCampaign | null | 'new'>(null)

  const navItems: Array<{ key: SubView; label: string; icon: React.ReactNode }> = [
    { key: 'campaigns', label: 'Campaigns', icon: <Mail size={15} /> },
    { key: 'subscribers', label: 'Subscribers', icon: <Users size={15} /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart2 size={15} /> },
  ]

  if (editingCampaign !== null) {
    return (
      <CampaignEditorView
        campaign={editingCampaign === 'new' ? null : editingCampaign}
        onBack={() => setEditingCampaign(null)}
      />
    )
  }

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(11,17,28,0.6)', borderRadius: 8, padding: 3, border: '1px solid rgba(116,147,196,0.14)' }}>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setSubView(item.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: subView === item.key ? 'rgba(59,130,246,0.28)' : 'transparent',
                color: subView === item.key ? '#8ab4ff' : '#9aa5b6',
                transition: '160ms ease',
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a
            href="/api/newsletters/send-worker"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 7, border: '1px solid rgba(116,147,196,0.2)', background: 'transparent', color: '#738094', fontSize: 12, cursor: 'pointer', textDecoration: 'none' }}
          >
            <RefreshCw size={12} /> Run Worker
          </a>
        </div>
      </div>

      {subView === 'campaigns' && (
        <CampaignListView
          onEdit={(c) => setEditingCampaign(c)}
          onCreate={() => setEditingCampaign('new')}
        />
      )}
      {subView === 'subscribers' && <SubscribersView />}
      {subView === 'analytics' && <AnalyticsView />}
    </div>
  )
}
