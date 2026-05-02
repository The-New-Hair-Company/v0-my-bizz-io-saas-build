'use client'

import { useState } from 'react'
import {
  Puzzle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Settings,
  RefreshCw,
  AlertTriangle,
  Plus,
  Search,
  Zap,
  Mail,
  MessageSquare,
  Calendar,
  BarChart2,
  Globe,
  Users,
  CreditCard,
  Bell,
} from 'lucide-react'

type IntegrationStatus = 'connected' | 'disconnected' | 'error'

type Integration = {
  id: string
  name: string
  category: string
  description: string
  icon: React.ReactNode
  status: IntegrationStatus
  lastSync?: string
  plan: 'free' | 'pro' | 'enterprise'
}

const card: React.CSSProperties = { background: 'rgba(11,17,28,0.94)', border: '1px solid rgba(116,147,196,0.15)', borderRadius: 12 }
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(116,147,196,0.2)', background: 'rgba(11,17,28,0.8)', color: '#9aa5b6', cursor: 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' as const }
const btnBlue: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.45)', background: 'linear-gradient(135deg, rgba(37,99,235,0.35), rgba(37,99,235,0.15))', color: '#8ab4ff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }

const mockIntegrations: Integration[] = [
  { id: 'i1', name: 'Resend', category: 'Email', description: 'Transactional email delivery for campaigns and sequences.', icon: <Mail size={20} style={{ color: '#3b82f6' }} />, status: 'connected', lastSync: '2 min ago', plan: 'pro' },
  { id: 'i2', name: 'Google Analytics 4', category: 'Analytics', description: 'Track traffic, conversions and visitor behaviour.', icon: <BarChart2 size={20} style={{ color: '#f59e0b' }} />, status: 'connected', lastSync: '15 min ago', plan: 'free' },
  { id: 'i3', name: 'Calendly', category: 'Scheduling', description: 'Auto-book discovery calls and demos from your CRM.', icon: <Calendar size={20} style={{ color: '#8b5cf6' }} />, status: 'disconnected', plan: 'pro' },
  { id: 'i4', name: 'WhatsApp Business', category: 'Messaging', description: 'Send and receive WhatsApp messages from the CRM inbox.', icon: <MessageSquare size={20} style={{ color: '#22c55e' }} />, status: 'connected', lastSync: '1h ago', plan: 'pro' },
  { id: 'i5', name: 'Stripe', category: 'Payments', description: 'Accept payments and track MRR inside Online2Day.', icon: <CreditCard size={20} style={{ color: '#6366f1' }} />, status: 'error', lastSync: '2d ago', plan: 'enterprise' },
  { id: 'i6', name: 'Supabase', category: 'Database', description: 'Your primary data store — powers all CRM features.', icon: <Zap size={20} style={{ color: '#3ecf8e' }} />, status: 'connected', lastSync: 'Live', plan: 'free' },
  { id: 'i7', name: 'Slack', category: 'Notifications', description: 'Get real-time alerts for new leads, replies, and requests.', icon: <Bell size={20} style={{ color: '#e01e5a' }} />, status: 'disconnected', plan: 'pro' },
  { id: 'i8', name: 'HubSpot', category: 'CRM Sync', description: 'Bi-directional sync of contacts and deal stages.', icon: <Users size={20} style={{ color: '#f97316' }} />, status: 'disconnected', plan: 'enterprise' },
  { id: 'i9', name: 'Google Search Console', category: 'SEO', description: 'Pull ranking data and search performance into your dashboard.', icon: <Globe size={20} style={{ color: '#4285f4' }} />, status: 'connected', lastSync: '6h ago', plan: 'free' },
]

const statusConfig: Record<IntegrationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  connected: { label: 'Connected', color: '#22c55e', icon: <CheckCircle2 size={13} /> },
  disconnected: { label: 'Not connected', color: '#64748b', icon: <XCircle size={13} /> },
  error: { label: 'Error', color: '#ef4444', icon: <AlertTriangle size={13} /> },
}

const planBadge: Record<Integration['plan'], { label: string; color: string }> = {
  free: { label: 'Free', color: '#22c55e' },
  pro: { label: 'Pro', color: '#3b82f6' },
  enterprise: { label: 'Enterprise', color: '#8b5cf6' },
}

export default function IntegrationsPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const categories = ['all', ...Array.from(new Set(mockIntegrations.map((i) => i.category)))]

  const filtered = mockIntegrations.filter((i) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.description.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter !== 'all' && i.category !== categoryFilter) return false
    if (statusFilter !== 'all' && i.status !== statusFilter) return false
    return true
  })

  const connected = mockIntegrations.filter((i) => i.status === 'connected').length

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#f5f8ff' }}>Integrations</h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#738094' }}>Connect your tools to supercharge the CRM workflow.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24, maxWidth: 600 }}>
        {[
          { label: 'Connected', value: connected.toString(), color: '#22c55e', icon: <CheckCircle2 size={15} /> },
          { label: 'Available', value: mockIntegrations.length.toString(), color: '#3b82f6', icon: <Puzzle size={15} /> },
          { label: 'Errors', value: mockIntegrations.filter((i) => i.status === 'error').length.toString(), color: '#ef4444', icon: <AlertTriangle size={15} /> },
        ].map((s) => (
          <div key={s.label} style={{ ...card, padding: '16px 18px' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}><span style={{ color: s.color }}>{s.icon}</span><span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#738094' }}>{s.label}</span></div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#f5f8ff' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4a6080', pointerEvents: 'none' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search integrations…" style={{ background: 'rgba(8,12,19,0.7)', border: '1px solid rgba(116,147,196,0.22)', borderRadius: 8, padding: '9px 12px 9px 32px', fontSize: 13, color: '#f5f8ff', outline: 'none', width: '100%' }} />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ ...btnGhost, cursor: 'pointer', WebkitAppearance: 'none' } as React.CSSProperties}>
          {categories.map((c) => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...btnGhost, cursor: 'pointer', WebkitAppearance: 'none' } as React.CSSProperties}>
          <option value="all">All Status</option>
          <option value="connected">Connected</option>
          <option value="disconnected">Disconnected</option>
          <option value="error">Error</option>
        </select>
        <button style={{ ...btnBlue, marginLeft: 'auto' }}><Plus size={15} /> Request Integration</button>
      </div>

      {/* Integration grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {filtered.map((integration) => {
          const sc = statusConfig[integration.status]
          const pb = planBadge[integration.plan]
          return (
            <div key={integration.id} style={{ ...card, padding: '20px', transition: '160ms ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.28)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(116,147,196,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(8,12,19,0.8)', border: '1px solid rgba(116,147,196,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {integration.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f5f8ff' }}>{integration.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: `${pb.color}18`, color: pb.color, border: `1px solid ${pb.color}28` }}>{pb.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#738094' }}>{integration.category}</div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${sc.color}18`, color: sc.color, border: `1px solid ${sc.color}28`, flexShrink: 0 }}>
                  {sc.icon} {sc.label}
                </div>
              </div>

              <p style={{ margin: '0 0 14px', fontSize: 13, color: '#738094', lineHeight: 1.5 }}>{integration.description}</p>

              {integration.lastSync && (
                <div style={{ fontSize: 11, color: '#4a6080', marginBottom: 14 }}>
                  Last sync: <span style={{ color: '#738094' }}>{integration.lastSync}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                {integration.status === 'connected' ? (
                  <>
                    <button style={{ ...btnGhost, fontSize: 12, padding: '6px 12px' }}><Settings size={13} /> Configure</button>
                    <button style={{ ...btnGhost, fontSize: 12, padding: '6px 10px', color: '#4a6080' }}><RefreshCw size={13} /></button>
                  </>
                ) : integration.status === 'error' ? (
                  <>
                    <button style={{ ...btnGhost, fontSize: 12, padding: '6px 12px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}><AlertTriangle size={13} /> Fix Error</button>
                    <button style={{ ...btnGhost, fontSize: 12, padding: '6px 10px', color: '#4a6080' }}><ExternalLink size={13} /></button>
                  </>
                ) : (
                  <button style={{ ...btnBlue, fontSize: 12, padding: '6px 14px', flex: 1, justifyContent: 'center' }}>
                    <Plus size={13} /> Connect
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#738094' }}>
          <Puzzle size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 15, fontWeight: 600 }}>No integrations match your filters</div>
          <button onClick={() => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all') }}
            style={{ marginTop: 12, background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 13 }}>
            Reset filters
          </button>
        </div>
      )}
    </div>
  )
}
