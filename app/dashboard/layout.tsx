import { CrmSidebar } from '@/components/crm/CrmSidebar'

export default function CrmDashboardLayout({ children }: { children: React.ReactNode }) {
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
