'use client'

import { useState, useMemo } from 'react'
import {
  Globe,
  Search,
  Plus,
  Download,
  ChevronDown,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Edit3,
  Trash2,
  MoreHorizontal,
  Table2,
  FileJson,
  ArrowRight,
  TrendingUp,
  Users,
} from 'lucide-react'
import { format } from 'date-fns'

type RequestPriority = 'High' | 'Medium' | 'Low'
type RequestStage = 'Submitted' | 'In Review' | 'In Progress' | 'Completed' | 'On Hold'

type SiteRequest = {
  id: string
  title: string
  company: string
  type: string
  priority: RequestPriority
  stage: RequestStage
  owner: string
  description: string
  lastActivity: string
  value: string
  createdAt: Date
}

const mockRequests: SiteRequest[] = [
  { id: 'sr1', title: 'Homepage hero section redesign', company: 'Hair Plus', type: 'Design Change', priority: 'High', stage: 'In Progress', owner: 'James T.', description: 'Client wants a new hero with a video background and updated CTA copy. Must reflect their recent rebrand.', lastActivity: '2h ago', value: '£450', createdAt: new Date('2026-04-30T09:00:00Z') },
  { id: 'sr2', title: 'Add contact form to About page', company: 'Digital Pro', type: 'Feature Add', priority: 'Medium', stage: 'In Review', owner: 'Sarah K.', description: 'Simple contact form with name, email, message, and GDPR consent checkbox. Route to sarah@digitalpro.co.uk.', lastActivity: '1d ago', value: '£200', createdAt: new Date('2026-04-28T11:00:00Z') },
  { id: 'sr3', title: 'SEO meta tags update — 12 pages', company: 'Bloom Florist', type: 'SEO', priority: 'High', stage: 'Completed', owner: 'Emma L.', description: 'Update title tags and meta descriptions for all product pages based on keyword research.', lastActivity: '3d ago', value: '£350', createdAt: new Date('2026-04-20T14:00:00Z') },
  { id: 'sr4', title: 'Fix broken product image links', company: 'Salon Suite', type: 'Bug Fix', priority: 'High', stage: 'Submitted', owner: 'James T.', description: 'Several product images returning 404. Appears to be from a recent server migration. Needs urgent fix.', lastActivity: '30m ago', value: '£150', createdAt: new Date('2026-05-02T07:00:00Z') },
  { id: 'sr5', title: 'Add Google Analytics 4 tracking', company: 'Growth Co', type: 'Integration', priority: 'Medium', stage: 'On Hold', owner: 'Sarah K.', description: 'Client needs GA4 + Google Ads conversion tracking set up before their ad campaign launches next month.', lastActivity: '1w ago', value: '£300', createdAt: new Date('2026-04-15T10:00:00Z') },
  { id: 'sr6', title: 'Blog post upload — May batch', company: 'Digital Pro', type: 'Content', priority: 'Low', stage: 'Completed', owner: 'Emma L.', description: '4 blog posts to upload with images, SEO titles, and internal links as per the content brief.', lastActivity: '5d ago', value: '£120', createdAt: new Date('2026-04-22T09:00:00Z') },
]

const stageColors: Record<RequestStage, string> = {
  'Submitted': '#64748b',
  'In Review': '#3b82f6',
  'In Progress': '#f59e0b',
  'Completed': '#22c55e',
  'On Hold': '#ef4444',
}

const priorityColors: Record<RequestPriority, string> = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' }

const card: React.CSSProperties = { background: 'rgba(11,17,28,0.94)', border: '1px solid rgba(116,147,196,0.15)', borderRadius: 12 }
const inputSt: React.CSSProperties = { background: 'rgba(8,12,19,0.7)', border: '1px solid rgba(116,147,196,0.22)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#f5f8ff', outline: 'none', width: '100%' }
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(116,147,196,0.2)', background: 'rgba(11,17,28,0.8)', color: '#9aa5b6', cursor: 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' as const }
const btnBlue: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.45)', background: 'linear-gradient(135deg, rgba(37,99,235,0.35), rgba(37,99,235,0.15))', color: '#8ab4ff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}

export default function SiteRequestsPage() {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selected, setSelected] = useState<SiteRequest | null>(null)
  const [showExport, setShowExport] = useState(false)

  const filtered = useMemo(() => mockRequests.filter((r) => {
    if (search) {
      const q = search.toLowerCase()
      if (!r.title.toLowerCase().includes(q) && !r.company.toLowerCase().includes(q)) return false
    }
    if (stageFilter !== 'all' && r.stage !== stageFilter) return false
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false
    return true
  }), [search, stageFilter, priorityFilter])

  const stages: RequestStage[] = ['Submitted', 'In Review', 'In Progress', 'Completed', 'On Hold']
  const totalValue = filtered.reduce((s, r) => s + parseInt(r.value.replace(/[^0-9]/g, '')), 0)

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#f5f8ff' }}>Site Requests</h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#738094' }}>Track and manage all website change requests from clients.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Open Requests', value: mockRequests.filter((r) => r.stage !== 'Completed').length.toString(), color: '#3b82f6', icon: <Globe size={15} /> },
          { label: 'In Progress', value: mockRequests.filter((r) => r.stage === 'In Progress').length.toString(), color: '#f59e0b', icon: <Clock size={15} /> },
          { label: 'Completed', value: mockRequests.filter((r) => r.stage === 'Completed').length.toString(), color: '#22c55e', icon: <CheckCircle2 size={15} /> },
          { label: 'Total Value', value: `£${mockRequests.reduce((s, r) => s + parseInt(r.value.replace(/[^0-9]/g, '')), 0).toLocaleString()}`, color: '#8b5cf6', icon: <TrendingUp size={15} /> },
        ].map((s) => (
          <div key={s.label} style={{ ...card, padding: '16px 18px' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}><span style={{ color: s.color }}>{s.icon}</span><span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#738094' }}>{s.label}</span></div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f5f8ff' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4a6080', pointerEvents: 'none' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests…" style={{ ...inputSt, paddingLeft: 32 }} />
        </div>
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={{ ...btnGhost, cursor: 'pointer', WebkitAppearance: 'none' } as React.CSSProperties}>
          <option value="all">All Stages</option>
          {stages.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ ...btnGhost, cursor: 'pointer', WebkitAppearance: 'none' } as React.CSSProperties}>
          <option value="all">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowExport((v) => !v)} style={btnGhost}><Download size={14} /> Export <ChevronDown size={12} /></button>
          {showExport && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 50, ...card, padding: 6, width: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              {[
                { label: 'Export as CSV', action: () => { const h = ['Title', 'Company', 'Type', 'Priority', 'Stage', 'Owner', 'Value']; const r = filtered.map((x) => [x.title, x.company, x.type, x.priority, x.stage, x.owner, x.value]); triggerDownload([h, ...r].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n'), 'site-requests.csv', 'text/csv') } },
                { label: 'Export as JSON', action: () => triggerDownload(JSON.stringify(filtered.map((x) => ({ ...x, createdAt: x.createdAt.toISOString() })), null, 2), 'site-requests.json', 'application/json') },
              ].map((opt) => (
                <button key={opt.label} onClick={() => { opt.action(); setShowExport(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#c4d4e8' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.1)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
                  <Table2 size={14} style={{ color: '#3b82f6' }} /> {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button style={{ ...btnBlue, marginLeft: 'auto' }}><Plus size={15} /> New Request</button>
      </div>

      {/* Kanban-style columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, overflowX: 'auto' }}>
        {stages.map((stage) => {
          const stageReqs = filtered.filter((r) => r.stage === stage)
          return (
            <div key={stage} style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: stageColors[stage] }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#9aa5b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stage}</span>
                <span style={{ fontSize: 11, color: '#4a6080', marginLeft: 'auto' }}>{stageReqs.length}</span>
              </div>
              {stageReqs.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelected(req)}
                  style={{ ...card, padding: '14px', cursor: 'pointer', transition: '140ms' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `${stageColors[stage]}44` }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(116,147,196,0.15)' }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f5f8ff', marginBottom: 4, lineHeight: 1.4 }}>{req.title}</div>
                  <div style={{ fontSize: 11, color: '#738094', marginBottom: 8 }}>{req.company}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: `${priorityColors[req.priority]}18`, color: priorityColors[req.priority] }}>{req.priority}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>{req.value}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#4a6080', marginTop: 6 }}>{req.lastActivity}</div>
                </div>
              ))}
              {stageReqs.length === 0 && (
                <div style={{ ...card, padding: '20px', textAlign: 'center', color: '#2a3a4a', fontSize: 12, borderStyle: 'dashed' }}>
                  No requests
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(4,7,12,0.65)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSelected(null)}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 420, background: '#0b111c', borderLeft: '1px solid rgba(116,147,196,0.2)', padding: 28, overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f5f8ff', marginBottom: 4, lineHeight: 1.4 }}>{selected.title}</div>
                <div style={{ fontSize: 12, color: '#738094' }}>{selected.company} · {selected.type}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ ...btnGhost, padding: '5px 8px', border: 'none', color: '#738094', flexShrink: 0 }}><X size={15} /></button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${stageColors[selected.stage]}1a`, color: stageColors[selected.stage], border: `1px solid ${stageColors[selected.stage]}33` }}>{selected.stage}</span>
              <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${priorityColors[selected.priority]}1a`, color: priorityColors[selected.priority] }}>{selected.priority} priority</span>
            </div>

            <div style={{ ...card, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4a6080', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Description</div>
              <div style={{ fontSize: 13, color: '#c4d4e8', lineHeight: 1.6 }}>{selected.description}</div>
            </div>

            {[
              { label: 'Owner', value: selected.owner },
              { label: 'Value', value: selected.value },
              { label: 'Last Activity', value: selected.lastActivity },
              { label: 'Created', value: format(selected.createdAt, 'd MMM yyyy') },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(116,147,196,0.08)' }}>
                <span style={{ fontSize: 12, color: '#4a6080' }}>{item.label}</span>
                <span style={{ fontSize: 12, color: '#c4d4e8', fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button style={{ ...btnBlue, flex: 1, justifyContent: 'center' }}><Edit3 size={13} /> Edit Request</button>
              <button style={{ ...btnGhost }}><CheckCircle2 size={13} /> Mark Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
