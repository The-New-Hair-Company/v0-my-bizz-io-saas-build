'use client'

import type { DashboardSection } from './types'
import { NewsletterDashboard } from '@/components/newsletter/NewsletterDashboard'

interface CrmDashboardProps {
  section: DashboardSection
}

export function CrmDashboard({ section }: CrmDashboardProps) {
  if (section === 'newsletters') {
    return <NewsletterDashboard />
  }

  // Placeholder for future sections (leads, videos, emails, messages, etc.)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 320,
        color: '#738094',
        fontSize: 15,
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <span style={{ fontSize: 32, opacity: 0.3 }}>🚧</span>
      <span>
        <strong style={{ color: '#9aa5b6', textTransform: 'capitalize' }}>{section}</strong>{' '}
        dashboard coming soon.
      </span>
    </div>
  )
}
