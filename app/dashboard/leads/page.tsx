'use client'

import { useState, useMemo } from 'react'
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  ChevronDown,
  MoreHorizontal,
  X,
  CheckCircle2,
  Clock,
  Star,
  Phone,
  Mail,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Edit3,
  Trash2,
  Eye,
  Table2,
  FileJson,
} from 'lucide-react'
import { format } from 'date-fns'

type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost'

type Lead = {
  id: string
  name: string
  company: string
  email: string
  phone?: string
  stage: LeadStage
  score: number
  owner: string
  ownerInitials: string
  source: string
  value: string
  lastActivity: string
  nextAction: string
  tags: string[]
}

const mockLeads: Lead[] = [
  { id: 'l1', name: 'Sarah Mitchell', company: 'Digital Pro', email: 'sarah@digitalpro.co.uk', phone: '+44 7700 900001', stage: 'Qualified', score: 87, owner: 'James T.', ownerInitials: 'JT', source: 'Website', value: '£4,800/yr', lastActivity: '2h ago', nextAction: 'Send proposal', tags: ['Hot lead', 'SEO'] },
  { id: 'l2', name: 'Mike Johnson', company: 'Hair Plus', email: 'mike@hairplus.com', stage: 'Proposal Sent', score: 74, owner: 'Sarah K.', ownerInitials: 'SK', source: 'Referral', value: '£3,200/yr', lastActivity: '1d ago', nextAction: 'Follow-up call', tags: ['Warm'] },
  { id: 'l3', name: 'Emma Clarke', company: 'Bloom Florist', email: 'emma@bloom.co.uk', phone: '+44 7700 900003', stage: 'Negotiation', score: 91, owner: 'James T.', ownerInitials: 'JT', source: 'LinkedIn', value: '£6,000/yr', lastActivity: '30m ago', nextAction: 'Close deal', tags: ['Hot lead', 'Local SEO'] },
  { id: 'l4', name: 'Tom Ridley', company: 'Growth Co', email: 'tom@growthco.io', stage: 'New', score: 42, owner: 'Emma L.', ownerInitials: 'EL', source: 'Google Ads', value: '£2,400/yr', lastActivity: '3d ago', nextAction: 'Qualify call', tags: ['Cold'] },
  { id: 'l5', name: 'Priya Shah', company: 'Salon Suite', email: 'priya@salonsuite.co.uk', stage: 'Contacted', score: 63, owner: 'Sarah K.', ownerInitials: 'SK', source: 'Website', value: '£3,600/yr', lastActivity: '5h ago', nextAction: 'Discovery call booked', tags: ['Warm', 'Salon'] },
  { id: 'l6', name: 'David Chen', company: 'TechStart', email: 'david@techstart.io', stage: 'Won', score: 95, owner: 'James T.', ownerInitials: 'JT', source: 'Referral', value: '£8,400/yr', lastActivity: '1w ago', nextAction: 'Onboard', tags: ['Client'] },
]

const stageColors: Record<LeadStage, string> = {
  New: '#64748b',
  Contacted: '#3b82f6',
  Qualified: '#8b5cf6',
  'Proposal Sent': '#f59e0b',
  Negotiation: '#ec4899',
  Won: '#22c55e',
  Lost: '#ef4444',
}

const card: React.CSSProperties = { background: 'rgba(11,17,28,0.94)', border: '1px solid rgba(116,147,196,0.15)', borderRadius: 12 }
const inputSt: React.CSSProperties = { background: 'rgba(8,12,19,0.7)', border: '1px solid rgba(116,147,196,0.22)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#f5f8ff', outline: 'none', width: '100%' }
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(116,147,196,0.2)', background: 'rgba(11,17,28,0.8)', color: '#9aa5b6', cursor: 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' as const }
const btnBlue: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.45)', background: 'linear-gradient(135deg, rgba(37,99,235,0.35), rgba(37,99,235,0.15))', color: '#8ab4ff', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' as const }

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}

export default function LeadsPage() {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showExport, setShowExport] = useState(false)

  const filtered = useMemo(() => mockLeads.filter((l) => {
    if (search) {
      const q = search.toLowerCase()
      if (!l.name.toLowerCase().includes(q) && !l.company.toLowerCase().includes(q) && !l.email.toLowerCase().includes(q)) return false
    }
    if (stageFilter !== 'all' && l.stage !== stageFilter) return false
    return true
  }), [search, stageFilter])

  const stages: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']

  const pipelineValue = mockLeads
    .filter((l) => l.stage !== 'Lost')
    .reduce((s, l) => s + parseInt(l.value.replace(/[^0-9]/g, '')), 0)

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#f5f8ff' }}>Leads</h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#738094' }}>Track, qualify and convert every lead in your pipeline.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Leads', value: mockLeads.length.toString(), color: '#3b82f6', icon: <Users size={15} /> },
          { label: 'Pipeline Value', value: `£${(pipelineValue / 1000).toFixed(0)}k/yr`, color: '#22c55e', icon: <TrendingUp size={15} /> },
          { label: 'Won this month', value: mockLeads.filter((l) => l.stage === 'Won').length.toString(), color: '#8b5cf6', icon: <CheckCircle2 size={15} /> },
          { label: 'Avg lead score', value: Math.round(mockLeads.reduce((s, l) => s + l.score, 0) / mockLeads.length).toString(), color: '#f59e0b', icon: <Star size={15} /> },
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads…" style={{ ...inputSt, paddingLeft: 32 }} />
        </div>
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={{ ...btnGhost, cursor: 'pointer', WebkitAppearance: 'none' } as React.CSSProperties}>
          <option value="all">All Stages</option>
          {stages.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowExport((v) => !v)} style={btnGhost}><Download size={14} /> Export <ChevronDown size={12} /></button>
          {showExport && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 50, ...card, padding: 6, width: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              {[
                { label: 'Export as CSV', action: () => { const headers = ['Name', 'Company', 'Email', 'Stage', 'Score', 'Owner', 'Value', 'Source']; const rows = filtered.map((l) => [l.name, l.company, l.email, l.stage, l.score, l.owner, l.value, l.source]); triggerDownload([headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'), 'leads.csv', 'text/csv') } },
                { label: 'Export as JSON', action: () => triggerDownload(JSON.stringify(filtered, null, 2), 'leads.json', 'application/json') },
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
        <button style={{ ...btnBlue, marginLeft: 'auto' }}><Plus size={15} /> Add Lead</button>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(116,147,196,0.14)' }}>
              {['Contact', 'Stage', 'Score', 'Owner', 'Value', 'Last Activity', 'Next Action', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#738094', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr key={lead.id} style={{ borderBottom: '1px solid rgba(116,147,196,0.08)', cursor: 'pointer', transition: '120ms' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(59,130,246,0.04)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                onClick={() => setSelectedLead(lead)}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {lead.ownerInitials}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f5f8ff' }}>{lead.name}</div>
                      <div style={{ fontSize: 11, color: '#738094' }}>{lead.company}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${stageColors[lead.stage]}1a`, color: stageColors[lead.stage], border: `1px solid ${stageColors[lead.stage]}33` }}>
                    {lead.stage}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, background: 'rgba(116,147,196,0.1)', borderRadius: 3, height: 6, width: 60, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${lead.score}%`, background: lead.score > 80 ? '#22c55e' : lead.score > 60 ? '#f59e0b' : '#ef4444', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: lead.score > 80 ? '#22c55e' : lead.score > 60 ? '#f59e0b' : '#ef4444' }}>{lead.score}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', color: '#9aa5b6' }}>{lead.owner}</td>
                <td style={{ padding: '14px 16px', color: '#22c55e', fontWeight: 600 }}>{lead.value}</td>
                <td style={{ padding: '14px 16px', color: '#738094' }}>{lead.lastActivity}</td>
                <td style={{ padding: '14px 16px', color: '#8ab4ff', fontSize: 12 }}>{lead.nextAction}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={(e) => { e.stopPropagation() }} style={{ ...btnGhost, padding: '4px 7px', border: 'none', color: '#3b82f6' }}><Mail size={13} /></button>
                    <button onClick={(e) => { e.stopPropagation() }} style={{ ...btnGhost, padding: '4px 7px', border: 'none', color: '#22c55e' }}><Phone size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#738094' }}>
            <Users size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
            <div>No leads match your filters.</div>
          </div>
        )}
      </div>

      {/* Lead detail slide-over */}
      {selectedLead && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(4,7,12,0.65)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSelectedLead(null)}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 400, background: '#0b111c', borderLeft: '1px solid rgba(116,147,196,0.2)', padding: 28, overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f5f8ff' }}>{selectedLead.name}</div>
                <div style={{ fontSize: 13, color: '#738094' }}>{selectedLead.company}</div>
              </div>
              <button onClick={() => setSelectedLead(null)} style={{ ...btnGhost, padding: '5px 8px', border: 'none', color: '#738094' }}><X size={15} /></button>
            </div>
            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${stageColors[selectedLead.stage]}1a`, color: stageColors[selectedLead.stage], border: `1px solid ${stageColors[selectedLead.stage]}33` }}>
              {selectedLead.stage}
            </span>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Email', value: selectedLead.email },
                { label: 'Phone', value: selectedLead.phone ?? '—' },
                { label: 'Owner', value: selectedLead.owner },
                { label: 'Source', value: selectedLead.source },
                { label: 'Value', value: selectedLead.value },
                { label: 'Last Activity', value: selectedLead.lastActivity },
                { label: 'Next Action', value: selectedLead.nextAction },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4a6080', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: '#c4d4e8' }}>{item.value}</div>
                </div>
              ))}

              {selectedLead.tags.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4a6080', marginBottom: 6 }}>Tags</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedLead.tags.map((tag) => (
                      <span key={tag} style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.12)', color: '#8ab4ff', border: '1px solid rgba(59,130,246,0.22)' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              <button style={{ ...btnBlue, flex: 1, justifyContent: 'center' }}><Mail size={13} /> Send Email</button>
              <button style={{ ...btnGhost, flex: 1, justifyContent: 'center' }}><Phone size={13} /> Log Call</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
