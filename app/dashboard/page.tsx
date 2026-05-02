'use client'

import Link from 'next/link'
import {
  Users,
  Video,
  Mail,
  MessageSquare,
  Globe,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  BarChart2,
} from 'lucide-react'

const card: React.CSSProperties = {
  background: 'rgba(11,17,28,0.94)',
  border: '1px solid rgba(116,147,196,0.15)',
  borderRadius: 12,
}

const sections = [
  {
    href: '/dashboard/leads',
    icon: Users,
    color: '#3b82f6',
    label: 'Leads',
    description: 'Track and qualify every prospect in your pipeline.',
    stat: '24 active',
    badge: '+3 this week',
  },
  {
    href: '/dashboard/videos',
    icon: Video,
    color: '#8b5cf6',
    label: 'Videos',
    description: 'Manage video assets across awareness to close.',
    stat: '6 videos',
    badge: '74% avg watch',
  },
  {
    href: '/dashboard/emails',
    icon: Mail,
    color: '#22c55e',
    label: 'Emails',
    description: 'Send, test and track emails that move leads forward.',
    stat: '6 templates',
    badge: '34% avg open',
  },
  {
    href: '/dashboard/messages',
    icon: MessageSquare,
    color: '#f59e0b',
    label: 'Messages',
    description: 'Manage all client conversations in one inbox.',
    stat: '4 unread',
    badge: 'High priority',
  },
  {
    href: '/dashboard/site-requests',
    icon: Globe,
    color: '#ec4899',
    label: 'Site Requests',
    description: 'Track website change requests from clients.',
    stat: '8 open',
    badge: '2 urgent',
  },
]

const recentActivity = [
  { icon: <CheckCircle2 size={14} style={{ color: '#22c55e' }} />, text: 'Email "Video Follow-up" launched to 142 contacts', time: '1h ago' },
  { icon: <Users size={14} style={{ color: '#3b82f6' }} />, text: 'New lead: Sarah from Digital Pro added', time: '2h ago' },
  { icon: <MessageSquare size={14} style={{ color: '#f59e0b' }} />, text: 'New message from Hair Plus — reply needed', time: '3h ago' },
  { icon: <Globe size={14} style={{ color: '#ec4899' }} />, text: 'Site request submitted by Bloom Florist', time: '5h ago' },
  { icon: <Video size={14} style={{ color: '#8b5cf6' }} />, text: 'Video "Platform Overview" reached 1,000 views', time: '1d ago' },
]

export default function CrmOverviewPage() {
  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#f5f8ff' }}>CRM Overview</h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#738094' }}>
          Your entire client pipeline at a glance — from first contact to loyal customer.
        </p>
      </div>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Pipeline Value', value: '£142,000', delta: '+12%', color: '#3b82f6' },
          { label: 'Leads this month', value: '34', delta: '+8', color: '#22c55e' },
          { label: 'Avg response time', value: '2.4h', delta: '-18%', color: '#8b5cf6' },
          { label: 'Conversion rate', value: '18%', delta: '+3%', color: '#f59e0b' },
        ].map((m) => (
          <div key={m.label} style={{ ...card, padding: '18px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#738094', marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#f5f8ff', marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: m.color }}>{m.delta} vs last month</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Section cards */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9aa5b6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Quick Access
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {sections.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                style={{ ...card, padding: '20px', textDecoration: 'none', display: 'block', transition: '160ms ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = `${s.color}44` }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(116,147,196,0.15)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}18`, border: `1px solid ${s.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={18} style={{ color: s.color }} />
                  </div>
                  <ArrowRight size={14} style={{ color: '#4a6080' }} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f5f8ff', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: '#738094', marginBottom: 12, lineHeight: 1.5 }}>{s.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.stat}</span>
                  <span style={{ fontSize: 11, color: '#4a6080' }}>{s.badge}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9aa5b6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Recent Activity
          </div>
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            {recentActivity.map((a, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
                  borderBottom: i < recentActivity.length - 1 ? '1px solid rgba(116,147,196,0.08)' : 'none',
                }}
              >
                <div style={{ marginTop: 1, flexShrink: 0 }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#c4d4e8', lineHeight: 1.5 }}>{a.text}</div>
                  <div style={{ fontSize: 11, color: '#4a6080', marginTop: 3 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline health */}
          <div style={{ ...card, padding: 18, marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9aa5b6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Pipeline Health
            </div>
            {[
              { label: 'Awareness', count: 12, color: '#3b82f6' },
              { label: 'Consideration', count: 8, color: '#8b5cf6' },
              { label: 'Proposal Sent', count: 4, color: '#f59e0b' },
              { label: 'Negotiation', count: 2, color: '#ec4899' },
              { label: 'Won', count: 6, color: '#22c55e' },
            ].map((stage) => (
              <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 90, fontSize: 11, color: '#738094', textAlign: 'right' }}>{stage.label}</div>
                <div style={{ flex: 1, background: 'rgba(116,147,196,0.1)', borderRadius: 3, height: 16, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(stage.count / 12) * 100}%`, background: stage.color, borderRadius: 3 }} />
                </div>
                <div style={{ width: 20, fontSize: 12, fontWeight: 700, color: stage.color }}>{stage.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
