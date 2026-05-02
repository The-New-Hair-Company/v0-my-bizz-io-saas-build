'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Video,
  Mail,
  MessageSquare,
  Globe,
  Puzzle,
  Crown,
  Zap,
} from 'lucide-react'

const mainNav = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'Leads', href: '/dashboard/leads', icon: Users },
  { name: 'Videos', href: '/dashboard/videos', icon: Video },
  { name: 'Emails', href: '/dashboard/emails', icon: Mail },
  { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare, badge: 4 },
]

const requestsNav = [
  { name: 'Site Requests', href: '/dashboard/site-requests', icon: Globe },
]

const toolsNav = [
  { name: 'Integrations', href: '/dashboard/integrations', icon: Puzzle },
]

export function CrmSidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: 220,
        minHeight: '100vh',
        background: '#07101d',
        borderRight: '1px solid rgba(116,147,196,0.1)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}
    >
      {/* Brand header */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(116,147,196,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={14} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f5f8ff', lineHeight: 1.2 }}>
              Online2Day
            </div>
            <div style={{ fontSize: 10, color: '#4a6080', marginTop: 1 }}>CRM Dashboard</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, padding: '12px 8px', overflow: 'auto' }}>
        <NavSection label="MAIN" items={mainNav} pathname={pathname} />
        <NavSection label="REQUESTS" items={requestsNav} pathname={pathname} />
        <NavSection label="TOOLS" items={toolsNav} pathname={pathname} />
      </div>

      {/* Pro Plan badge */}
      <div style={{ padding: '0 10px 14px' }}>
        <div
          style={{
            padding: '12px 14px',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))',
            border: '1px solid rgba(59,130,246,0.18)',
            borderRadius: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Crown size={13} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f5f8ff' }}>Pro Plan</span>
          </div>
          <div style={{ fontSize: 11, color: '#5a7499', lineHeight: 1.4 }}>
            Unlimited campaigns &amp; contacts.
          </div>
        </div>
      </div>
    </aside>
  )
}

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  badge?: number
  exact?: boolean
}

function NavSection({
  label,
  items,
  pathname,
}: {
  label: string
  items: NavItem[]
  pathname: string
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#374d6a',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '0 8px',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {items.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.name}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 7,
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#8ab4ff' : '#7a92ad',
              background: isActive ? 'rgba(59,130,246,0.14)' : 'transparent',
              textDecoration: 'none',
              transition: '120ms ease',
              marginBottom: 2,
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = '#c4d9f5'
            }}
            onMouseLeave={(e) => {
              if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = '#7a92ad'
            }}
          >
            <item.icon size={15} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{item.name}</span>
            {item.badge !== undefined && (
              <span
                style={{
                  background: '#3b82f6',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '1px 6px',
                  minWidth: 18,
                  textAlign: 'center',
                }}
              >
                {item.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
