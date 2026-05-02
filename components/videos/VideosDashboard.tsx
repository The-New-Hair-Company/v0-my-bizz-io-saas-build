'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Video,
  Plus,
  Search,
  X,
  Edit3,
  Trash2,
  Eye,
  Play,
  Link as LinkIcon,
  Upload,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  MoreHorizontal,
  Copy,
  Star,
  BarChart2,
  ChevronDown,
  Download,
  Filter,
  Grid,
  List,
  Youtube,
  Globe,
  ExternalLink,
  Send,
  Zap,
  ArrowLeft,
  Save,
  AlertCircle,
  FileText,
  Table2,
  FileJson,
} from 'lucide-react'
import { format } from 'date-fns'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type VideoStatus = 'active' | 'draft' | 'archived'

type VideoRecord = {
  id: string
  title: string
  description: string
  thumbnailUrl?: string
  embedUrl?: string
  sourceUrl: string
  type: 'youtube' | 'vimeo' | 'upload' | 'loom'
  duration: string
  funnelStage: string
  owner: string
  ownerInitials: string
  audience: string
  cta: string
  ctaUrl: string
  status: VideoStatus
  views: number
  watchRate: number
  replies: number
  shares: number
  lastViewed: string
  createdAt: Date
  featured: boolean
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const mockVideos: VideoRecord[] = [
  {
    id: 'v1',
    title: 'Online2Day Platform Overview',
    description: 'Full walkthrough of our website + SEO platform for local SMBs. Covers the dashboard, SEO tools, and lead capture.',
    thumbnailUrl: undefined,
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    sourceUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    type: 'youtube',
    duration: '3:42',
    funnelStage: 'Awareness',
    owner: 'James T.',
    ownerInitials: 'JT',
    audience: 'Cold Prospects',
    cta: 'Book Free Demo',
    ctaUrl: 'https://online2day.co.uk/book',
    status: 'active',
    views: 1284,
    watchRate: 74,
    replies: 31,
    shares: 18,
    lastViewed: '2h ago',
    createdAt: new Date('2026-04-10T09:00:00Z'),
    featured: true,
  },
  {
    id: 'v2',
    title: 'Client Success Story — Hair Plus',
    description: 'How Hair Plus went from 3 leads/month to 28 leads/month using Online2Day SEO and automated follow-up.',
    thumbnailUrl: undefined,
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    sourceUrl: 'https://youtube.com/watch?v=example2',
    type: 'youtube',
    duration: '5:15',
    funnelStage: 'Consideration',
    owner: 'Sarah K.',
    ownerInitials: 'SK',
    audience: 'Warm Prospects',
    cta: 'See More Case Studies',
    ctaUrl: 'https://online2day.co.uk/case-studies',
    status: 'active',
    views: 892,
    watchRate: 81,
    replies: 47,
    shares: 22,
    lastViewed: '45m ago',
    createdAt: new Date('2026-04-18T10:00:00Z'),
    featured: false,
  },
  {
    id: 'v3',
    title: 'Personalised Proposal — Bloom Florist',
    description: 'Bespoke walkthrough of a proposal created specifically for Bloom Florist. Shows pricing, timeline and expected results.',
    thumbnailUrl: undefined,
    embedUrl: undefined,
    sourceUrl: 'https://loom.com/share/example3',
    type: 'loom',
    duration: '8:03',
    funnelStage: 'Proposal Sent',
    owner: 'James T.',
    ownerInitials: 'JT',
    audience: 'Active Leads',
    cta: 'Accept Proposal',
    ctaUrl: 'https://online2day.co.uk/proposals/bloom',
    status: 'active',
    views: 4,
    watchRate: 96,
    replies: 2,
    shares: 0,
    lastViewed: '1d ago',
    createdAt: new Date('2026-04-30T14:00:00Z'),
    featured: false,
  },
  {
    id: 'v4',
    title: 'What is Local SEO? (Quick Explainer)',
    description: 'A 90-second explainer breaking down what local SEO is, why it matters, and how Online2Day makes it simple.',
    thumbnailUrl: undefined,
    embedUrl: 'https://player.vimeo.com/video/123456789',
    sourceUrl: 'https://vimeo.com/123456789',
    type: 'vimeo',
    duration: '1:28',
    funnelStage: 'Awareness',
    owner: 'Emma L.',
    ownerInitials: 'EL',
    audience: 'Cold Prospects',
    cta: 'Get Free SEO Audit',
    ctaUrl: 'https://online2day.co.uk/seo-audit',
    status: 'active',
    views: 3401,
    watchRate: 88,
    replies: 12,
    shares: 64,
    lastViewed: '10m ago',
    createdAt: new Date('2026-03-15T11:00:00Z'),
    featured: true,
  },
  {
    id: 'v5',
    title: 'Onboarding Welcome Video',
    description: 'Sent to every new client on day one. Introduces the team, explains the first 30 days, and sets expectations.',
    thumbnailUrl: undefined,
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    sourceUrl: 'https://youtube.com/watch?v=example5',
    type: 'youtube',
    duration: '4:11',
    funnelStage: 'Won',
    owner: 'Emma L.',
    ownerInitials: 'EL',
    audience: 'New Clients',
    cta: 'Book Kick-off Call',
    ctaUrl: 'https://online2day.co.uk/kickoff',
    status: 'active',
    views: 78,
    watchRate: 92,
    replies: 19,
    shares: 3,
    lastViewed: '3d ago',
    createdAt: new Date('2026-02-20T09:00:00Z'),
    featured: false,
  },
  {
    id: 'v6',
    title: 'Re-engagement — "Still Thinking It Over?"',
    description: 'A warm, personal video sent to leads who went quiet after a proposal. Addresses common objections.',
    thumbnailUrl: undefined,
    embedUrl: undefined,
    sourceUrl: 'https://loom.com/share/example6',
    type: 'loom',
    duration: '2:55',
    funnelStage: 'Nurture',
    owner: 'Sarah K.',
    ownerInitials: 'SK',
    audience: 'Cold Leads',
    cta: 'Let\'s Chat',
    ctaUrl: 'https://online2day.co.uk/book',
    status: 'draft',
    views: 0,
    watchRate: 0,
    replies: 0,
    shares: 0,
    lastViewed: '—',
    createdAt: new Date('2026-05-01T16:00:00Z'),
    featured: false,
  },
]

const ALL_STAGES = ['Awareness', 'Consideration', 'Proposal Sent', 'Meeting Set', 'Won', 'Nurture']
const ALL_OWNERS = ['James T.', 'Sarah K.', 'Emma L.']
const ALL_AUDIENCES = ['Cold Prospects', 'Warm Prospects', 'Active Leads', 'New Clients', 'Cold Leads', 'Booked Leads']

// ─── HELPERS ──────────────────────────────────────────────────────────────────

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

function statusConfig(status: VideoStatus) {
  const map: Record<VideoStatus, { label: string; color: string }> = {
    active: { label: 'Active', color: '#22c55e' },
    draft: { label: 'Draft', color: '#64748b' },
    archived: { label: 'Archived', color: '#ef4444' },
  }
  return map[status]
}

function typeIcon(type: VideoRecord['type']) {
  const map = {
    youtube: <Youtube size={12} style={{ color: '#ef4444' }} />,
    vimeo: <Video size={12} style={{ color: '#00adef' }} />,
    loom: <Play size={12} style={{ color: '#8b5cf6' }} />,
    upload: <Upload size={12} style={{ color: '#f59e0b' }} />,
  }
  return map[type]
}

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

function exportCSV(data: VideoRecord[]) {
  const headers = ['Title', 'Owner', 'Audience', 'Stage', 'Type', 'Duration', 'Views', 'Watch Rate', 'Replies', 'CTA', 'Status']
  const rows = data.map((v) => [v.title, v.owner, v.audience, v.funnelStage, v.type, v.duration, v.views, `${v.watchRate}%`, v.replies, v.cta, v.status])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  triggerDownload(csv, `videos-export-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv')
}

function exportJSON(data: VideoRecord[]) {
  triggerDownload(JSON.stringify(data.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() })), null, 2), `videos-export-${format(new Date(), 'yyyy-MM-dd')}.json`, 'application/json')
}

// ─── VIDEO EDITOR ─────────────────────────────────────────────────────────────

function VideoEditor({
  video,
  onSave,
  onBack,
}: {
  video: VideoRecord | null
  onSave: (v: Partial<VideoRecord>) => void
  onBack: () => void
}) {
  const isNew = !video
  const [title, setTitle] = useState(video?.title ?? '')
  const [desc, setDesc] = useState(video?.description ?? '')
  const [sourceUrl, setSourceUrl] = useState(video?.sourceUrl ?? '')
  const [type, setType] = useState<VideoRecord['type']>(video?.type ?? 'youtube')
  const [duration, setDuration] = useState(video?.duration ?? '')
  const [stage, setStage] = useState(video?.funnelStage ?? 'Awareness')
  const [audience, setAudience] = useState(video?.audience ?? 'Cold Prospects')
  const [cta, setCta] = useState(video?.cta ?? '')
  const [ctaUrl, setCtaUrl] = useState(video?.ctaUrl ?? '')
  const [owner, setOwner] = useState(video?.owner ?? 'James T.')
  const [status, setStatus] = useState<VideoStatus>(video?.status ?? 'draft')
  const [featured, setFeatured] = useState(video?.featured ?? false)
  const [activeTab, setActiveTab] = useState<'details' | 'preview' | 'analytics'>('details')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const getEmbedUrl = (url: string, t: VideoRecord['type']) => {
    if (t === 'youtube') {
      const match = url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?]+)/)
      if (match) return `https://www.youtube.com/embed/${match[1]}`
    }
    if (t === 'vimeo') {
      const match = url.match(/vimeo\.com\/(\d+)/)
      if (match) return `https://player.vimeo.com/video/${match[1]}`
    }
    return url
  }

  const embedUrl = getEmbedUrl(sourceUrl, type)

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    onSave({ title, description: desc, sourceUrl, type, duration, funnelStage: stage, audience, cta, ctaUrl, owner, status, featured })
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onBack() }, 1200)
  }

  const tabs: Array<{ key: typeof activeTab; label: string }> = [
    { key: 'details', label: 'Details' },
    { key: 'preview', label: 'Preview' },
    { key: 'analytics', label: 'Analytics' },
  ]

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ ...btnGhost, padding: '7px 12px', fontSize: 13 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span style={{ color: '#4a6080', fontSize: 13 }}>/</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#f5f8ff' }}>{isNew ? 'Add Video' : title || 'Untitled Video'}</span>
          {!isNew && (
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${statusConfig(status).color}1a`, color: statusConfig(status).color, border: `1px solid ${statusConfig(status).color}33` }}>
              {statusConfig(status).label}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setStatus('draft'); handleSave() }}
            style={{ ...btnGhost, fontSize: 13 }}
          >
            Save as Draft
          </button>
          <button onClick={handleSave} disabled={saving || saved} style={{ ...btnBlue, background: saved ? 'rgba(34,197,94,0.2)' : btnBlue.background, borderColor: saved ? 'rgba(34,197,94,0.4)' : undefined, color: saved ? '#22c55e' : '#8ab4ff' }}>
            {saving ? <><Clock size={13} /> Saving…</> : saved ? <><CheckCircle2 size={13} /> Saved!</> : <><Save size={13} /> Save & Publish</>}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(116,147,196,0.14)', marginBottom: 24 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: 'transparent',
              color: activeTab === tab.key ? '#8ab4ff' : '#738094',
              borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: -1, transition: '140ms',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Left: main fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field label="Video Title">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Platform Overview 2026" style={inputSt} />
            </Field>

            <Field label="Description">
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What this video covers and when to use it…" rows={4} style={{ ...inputSt, resize: 'vertical' }} />
            </Field>

            <Field label="Video Source">
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {(['youtube', 'vimeo', 'loom', 'upload'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${type === t ? '#3b82f6' : 'rgba(116,147,196,0.2)'}`,
                      background: type === t ? 'rgba(59,130,246,0.15)' : 'transparent',
                      color: type === t ? '#8ab4ff' : '#738094', textTransform: 'capitalize',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {type !== 'upload' ? (
                <input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder={
                    type === 'youtube' ? 'https://youtube.com/watch?v=...'
                    : type === 'vimeo' ? 'https://vimeo.com/123456789'
                    : 'https://loom.com/share/...'
                  }
                  style={inputSt}
                />
              ) : (
                <div
                  style={{
                    border: '2px dashed rgba(116,147,196,0.25)', borderRadius: 10, padding: '28px 24px',
                    textAlign: 'center', cursor: 'pointer', color: '#4a6080', fontSize: 13,
                  }}
                  onClick={() => {}}
                >
                  <Upload size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <div>Click to upload or drag &amp; drop</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>MP4, MOV, WebM — max 500MB</div>
                </div>
              )}
            </Field>

            <Field label="Call-to-Action Button">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#738094', marginBottom: 4 }}>Button Text</label>
                  <input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="e.g. Book Free Demo" style={inputSt} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#738094', marginBottom: 4 }}>Button URL</label>
                  <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://..." style={inputSt} />
                </div>
              </div>
            </Field>
          </div>

          {/* Right: settings sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...card, padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9aa5b6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                Video Settings
              </div>
              <Field label="Funnel Stage">
                <select value={stage} onChange={(e) => setStage(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                  {ALL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Target Audience">
                <select value={audience} onChange={(e) => setAudience(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                  {ALL_AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Owner">
                <select value={owner} onChange={(e) => setOwner(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                  {ALL_OWNERS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Duration">
                <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 3:42" style={inputSt} />
              </Field>
              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value as VideoStatus)} style={{ ...inputSt, cursor: 'pointer' }}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>

              {/* Featured toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(116,147,196,0.1)' }}>
                <span style={{ fontSize: 13, color: '#9aa5b6' }}>Featured video</span>
                <button
                  onClick={() => setFeatured((v) => !v)}
                  style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: featured ? '#3b82f6' : 'rgba(116,147,196,0.2)',
                    position: 'relative', transition: '200ms ease',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 3, left: featured ? 20 : 3, width: 16, height: 16,
                    borderRadius: '50%', background: '#fff', transition: '200ms ease',
                  }} />
                </button>
              </div>
            </div>

            {sourceUrl && type !== 'upload' && (
              <div style={{ ...card, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9aa5b6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Quick Preview
                </div>
                <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
                  <iframe
                    src={embedUrl}
                    title="Video preview"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {cta && (
                  <div style={{ marginTop: 10, textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600 }}>
                      {cta} →
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ ...card, padding: 24 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#f5f8ff' }}>{title || 'Untitled Video'}</h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#738094', lineHeight: 1.6 }}>{desc || 'No description added yet.'}</p>

            {sourceUrl && type !== 'upload' ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 10, overflow: 'hidden', background: '#000', marginBottom: 16 }}>
                <iframe
                  src={embedUrl}
                  title={title}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div style={{ paddingBottom: '56.25%', position: 'relative', borderRadius: 10, background: 'rgba(8,12,19,0.8)', border: '1px solid rgba(116,147,196,0.15)', marginBottom: 16 }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: '#4a6080' }}>
                  <Play size={36} style={{ opacity: 0.4 }} />
                  <span style={{ fontSize: 13 }}>Add a video URL to see preview</span>
                </div>
              </div>
            )}

            {cta && (
              <div style={{ textAlign: 'center' }}>
                <a href={ctaUrl || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#3b82f6', color: '#fff', padding: '12px 28px', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                  {cta} →
                </a>
              </div>
            )}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(116,147,196,0.1)', display: 'flex', gap: 16, fontSize: 12, color: '#4a6080', flexWrap: 'wrap' }}>
              <span>Stage: <strong style={{ color: '#8ab4ff' }}>{stage}</strong></span>
              <span>Audience: <strong style={{ color: '#8ab4ff' }}>{audience}</strong></span>
              <span>Duration: <strong style={{ color: '#8ab4ff' }}>{duration || 'TBD'}</strong></span>
              <span>Owner: <strong style={{ color: '#8ab4ff' }}>{owner}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          {isNew || !video ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#4a6080' }}>
              <BarChart2 size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 15 }}>Analytics will appear after the video goes live.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Total Views', value: video.views.toLocaleString(), color: '#3b82f6', icon: <Eye size={15} /> },
                  { label: 'Watch Rate', value: `${video.watchRate}%`, color: '#22c55e', icon: <Play size={15} /> },
                  { label: 'Replies', value: video.replies.toString(), color: '#8b5cf6', icon: <Send size={15} /> },
                  { label: 'Shares', value: video.shares.toString(), color: '#f59e0b', icon: <TrendingUp size={15} /> },
                ].map((m) => (
                  <div key={m.label} style={{ ...card, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', gap: 6, color: m.color, marginBottom: 6 }}>{m.icon}<span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#738094' }}>{m.label}</span></div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ ...card, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f8ff', marginBottom: 16 }}>Watch Completion Funnel</div>
                {[
                  { label: 'Started watching', pct: 100, color: '#3b82f6' },
                  { label: 'Reached 25%', pct: 88, color: '#60a5fa' },
                  { label: 'Reached 50%', pct: video.watchRate, color: '#22c55e' },
                  { label: 'Reached 75%', pct: Math.round(video.watchRate * 0.85), color: '#8b5cf6' },
                  { label: 'Completed (100%)', pct: Math.round(video.watchRate * 0.7), color: '#f59e0b' },
                  { label: 'Clicked CTA', pct: Math.round((video.replies / Math.max(video.views, 1)) * 100), color: '#ec4899' },
                ].map((bar) => (
                  <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 140, fontSize: 12, color: '#9aa5b6', textAlign: 'right' }}>{bar.label}</div>
                    <div style={{ flex: 1, background: 'rgba(116,147,196,0.1)', borderRadius: 4, height: 20, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${bar.pct}%`, background: bar.color, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{bar.pct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9aa5b6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── VIDEO CARD ───────────────────────────────────────────────────────────────

function VideoCard({ video, onEdit }: { video: VideoRecord; onEdit: () => void }) {
  const [showMenu, setShowMenu] = useState(false)
  const sc = statusConfig(video.status)

  return (
    <div
      style={{ ...card, overflow: 'hidden', transition: '160ms ease', cursor: 'pointer' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.3)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(116,147,196,0.15)' }}
    >
      {/* Thumbnail / embed preview */}
      <div
        style={{ position: 'relative', paddingBottom: '52%', background: 'rgba(4,8,16,0.8)', cursor: 'pointer' }}
        onClick={onEdit}
      >
        {video.embedUrl ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,16,0.9)' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(59,130,246,0.3)', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={20} style={{ color: '#8ab4ff', marginLeft: 2 }} />
            </div>
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
            <Video size={28} style={{ color: '#4a6080' }} />
            <span style={{ fontSize: 11, color: '#4a6080' }}>Draft — no embed yet</span>
          </div>
        )}
        {video.featured && (
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(245,158,11,0.9)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
            ★ Featured
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>
          {video.duration}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f5f8ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{video.title}</div>
            <div style={{ fontSize: 11, color: '#738094', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              {typeIcon(video.type)} {video.type}
              <span style={{ color: '#2a3a4a' }}>·</span>
              {video.funnelStage}
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: `${sc.color}1a`, color: sc.color, border: `1px solid ${sc.color}33`, flexShrink: 0 }}>
            {sc.label}
          </span>
        </div>

        <div style={{ fontSize: 12, color: '#738094', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
          {video.description}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 12, fontSize: 12 }}>
          <span style={{ color: '#738094' }}>👁 <strong style={{ color: '#f5f8ff' }}>{video.views.toLocaleString()}</strong> views</span>
          <span style={{ color: '#738094' }}>▶ <strong style={{ color: '#22c55e' }}>{video.watchRate}%</strong> watch</span>
          <span style={{ color: '#738094' }}>↩ <strong style={{ color: '#8b5cf6' }}>{video.replies}</strong> replies</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={onEdit} style={{ ...btnBlue, fontSize: 12, padding: '6px 12px', flex: 1, justifyContent: 'center' }}>
            <Edit3 size={13} /> Edit
          </button>
          {video.embedUrl && (
            <a href={video.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnGhost, fontSize: 12, padding: '6px 10px', textDecoration: 'none' }}>
              <ExternalLink size={13} />
            </a>
          )}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu((v) => !v)} style={{ ...btnGhost, padding: '6px 8px', border: 'none', color: '#738094' }}>
              <MoreHorizontal size={14} />
            </button>
            {showMenu && (
              <div style={{ position: 'absolute', right: 0, bottom: '100%', marginBottom: 4, ...card, padding: 6, width: 160, zIndex: 20, boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}>
                {[
                  { icon: <Copy size={13} />, label: 'Duplicate' },
                  { icon: <Send size={13} />, label: 'Send in email' },
                  { icon: <Star size={13} />, label: video.featured ? 'Unfeature' : 'Feature' },
                  { icon: <Trash2 size={13} />, label: 'Delete', color: '#ef4444' },
                ].map((item) => (
                  <button key={item.label} onClick={() => setShowMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: item.color ?? '#9aa5b6', textAlign: 'left' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(116,147,196,0.08)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export function VideosDashboard() {
  const [view, setView] = useState<'grid' | 'edit'>('grid')
  const [editingVideo, setEditingVideo] = useState<VideoRecord | null | 'new'>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [showExport, setShowExport] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    return mockVideos.filter((v) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!v.title.toLowerCase().includes(q) && !v.description.toLowerCase().includes(q) && !v.owner.toLowerCase().includes(q) && !v.audience.toLowerCase().includes(q)) return false
      }
      if (filterStage !== 'all' && v.funnelStage !== filterStage) return false
      if (filterStatus !== 'all' && v.status !== filterStatus) return false
      return true
    })
  }, [searchQuery, filterStage, filterStatus])

  const handleEdit = (video: VideoRecord) => {
    setEditingVideo(video)
    setView('edit')
  }

  const handleNew = () => {
    setEditingVideo('new')
    setView('edit')
  }

  const handleSave = (updated: Partial<VideoRecord>) => {
    // In a real app, this would call Supabase
    console.log('Saving video:', updated)
  }

  const handleBack = () => {
    setView('grid')
    setEditingVideo(null)
  }

  if (view === 'edit') {
    return (
      <VideoEditor
        video={editingVideo === 'new' ? null : editingVideo}
        onSave={handleSave}
        onBack={handleBack}
      />
    )
  }

  const totalViews = mockVideos.reduce((s, v) => s + v.views, 0)
  const avgWatch = Math.round(mockVideos.filter((v) => v.views > 0).reduce((s, v) => s + v.watchRate, 0) / mockVideos.filter((v) => v.views > 0).length)

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#f5f8ff' }}>Videos</h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#738094' }}>
          Manage video assets across your sales funnel — from cold outreach to onboarding.
        </p>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Videos', value: mockVideos.length.toString(), color: '#3b82f6', icon: <Video size={15} /> },
          { label: 'Total Views', value: totalViews.toLocaleString(), color: '#22c55e', icon: <Eye size={15} /> },
          { label: 'Avg Watch Rate', value: `${avgWatch}%`, color: '#8b5cf6', icon: <Play size={15} /> },
          { label: 'Active', value: mockVideos.filter((v) => v.status === 'active').length.toString(), color: '#f59e0b', icon: <CheckCircle2 size={15} /> },
        ].map((s) => (
          <div key={s.label} style={{ ...card, padding: '16px 18px' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <span style={{ color: s.color }}>{s.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#738094' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f5f8ff' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4a6080', pointerEvents: 'none' }} />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search videos…" style={{ ...inputSt, paddingLeft: 32 }} />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a6080', display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>

        <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} style={{ ...btnGhost, cursor: 'pointer', WebkitAppearance: 'none', paddingRight: 24 } as React.CSSProperties}>
          <option value="all">All Stages</option>
          {ALL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...btnGhost, cursor: 'pointer', WebkitAppearance: 'none', paddingRight: 24 } as React.CSSProperties}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        {/* Export */}
        <div ref={exportRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowExport((v) => !v)} style={btnGhost}>
            <Download size={14} /> Export <ChevronDown size={12} />
          </button>
          {showExport && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 50, ...card, padding: 6, width: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              {[
                { icon: <Table2 size={14} />, label: 'Export as CSV', action: () => exportCSV(filtered) },
                { icon: <FileJson size={14} />, label: 'Export as JSON', action: () => exportJSON(filtered) },
              ].map((opt) => (
                <button key={opt.label} onClick={() => { opt.action(); setShowExport(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#c4d4e8', textAlign: 'left' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.1)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
                  <span style={{ color: '#3b82f6' }}>{opt.icon}</span>{opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layout toggle */}
        <div style={{ display: 'flex', gap: 2, background: 'rgba(11,17,28,0.8)', borderRadius: 8, padding: 3, border: '1px solid rgba(116,147,196,0.15)' }}>
          {(['grid', 'list'] as const).map((l) => (
            <button key={l} onClick={() => setLayout(l)} style={{ padding: '5px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: layout === l ? 'rgba(59,130,246,0.2)' : 'transparent', color: layout === l ? '#8ab4ff' : '#738094' }}>
              {l === 'grid' ? <Grid size={14} /> : <List size={14} />}
            </button>
          ))}
        </div>

        <button onClick={handleNew} style={{ ...btnBlue, marginLeft: 'auto' }}>
          <Plus size={15} /> Add Video
        </button>
      </div>

      {/* Results */}
      <div style={{ fontSize: 12, color: '#4a6080', marginBottom: 14 }}>
        {filtered.length === mockVideos.length ? `${mockVideos.length} videos` : `${filtered.length} of ${mockVideos.length} videos matching filters`}
      </div>

      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: layout === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
          gap: 16,
        }}>
          {filtered.map((video) => (
            <VideoCard key={video.id} video={video} onEdit={() => handleEdit(video)} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#738094' }}>
          <Video size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 15, fontWeight: 600 }}>No videos match your filters</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            <button onClick={() => { setSearchQuery(''); setFilterStage('all'); setFilterStatus('all') }}
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 13 }}>
              Reset filters
            </button>
            {' '}or add your first video.
          </div>
        </div>
      )}
    </div>
  )
}
