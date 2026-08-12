import { CrmSidebar } from '@/components/crm/CrmSidebar'
import { requirePortalUser } from '@/lib/portal/auth'
import { redirect } from 'next/navigation'

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortalUser()
  if (!user.isAdmin) redirect('/dashboard')
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#07090e',
        color: '#f5f8ff',
        fontFamily: 'inherit',
      }}
    >
      <CrmSidebar />
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>{children}</main>
    </div>
  )
}
