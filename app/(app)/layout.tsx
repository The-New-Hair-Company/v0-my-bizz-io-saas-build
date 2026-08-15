import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePortalUser } from '@/lib/portal/auth'
import { PortalTheme } from '@/components/portal/PortalTheme'
import { PlanBanner } from '@/components/portal/PlanBanner'
import { ApplicationClerkProvider } from '@/components/auth/DomainClerkProvider'

type PortalShell = {
  accounts?: Array<{
    id: string
    name: string
    slug: string
    stage: string
    role: string
    source: string
  }>
  preferences?: {
    active_organization_id?: string | null
    accent_color?: string
    compact_mode?: boolean
  }
  entitlement?: {
    intelligenceRuns: { used: number; limit: number }
  } | null
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortalUser()
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('get_portal_shell', { p_clerk_user_id: user.userId })
  if (error) throw error

  const shell = (data ?? {}) as PortalShell
  const accounts = shell.accounts ?? []
  const preferences = shell.preferences
  const entitlement = shell.entitlement

  return (
    <ApplicationClerkProvider>
    <PortalTheme accentColor={preferences?.accent_color ?? '#ff6600'} compactMode={preferences?.compact_mode}>
      <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#fff8f2]">
        <AppSidebar user={user} accounts={accounts} />
        <main className="min-w-0 flex-1">
          {entitlement && <PlanBanner used={entitlement.intelligenceRuns.used} limit={entitlement.intelligenceRuns.limit} />}
          <div className="sticky top-0 z-30 flex h-14 items-center border-b border-orange-100 bg-white/90 px-4 backdrop-blur-xl lg:hidden">
            <SidebarTrigger />
            <span className="ml-3 text-sm font-semibold text-orange-950">MyBizz Command Centre</span>
          </div>
          {children}
        </main>
      </div>
      </SidebarProvider>
    </PortalTheme>
    </ApplicationClerkProvider>
  )
}
