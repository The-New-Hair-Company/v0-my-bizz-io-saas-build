// app/crm/newsletters/page.tsx
import { CrmDashboard } from '@/components/crm-dashboard/crm-dashboard'

export const metadata = {
  title: 'Newsletters | Online2Day Dashboard',
  description: 'Create, schedule, and track branded newsletter campaigns.',
}

export default function CrmNewslettersPage() {
  return <CrmDashboard section="newsletters" />
}
