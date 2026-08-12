import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/portal/auth'
import { PortalTheme } from '@/components/portal/PortalTheme'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortalUser()
  const supabase = await createClient()
  const [{ data: memberships }, { data: preferences }] = await Promise.all([
    supabase
      .from('members')
      .select('role, organization_id, organizations(id, name, slug, lifecycle_stage)')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('member_preferences')
      .select('accent_color, compact_mode')
      .eq('user_id', user.userId)
      .maybeSingle(),
  ])

  const accounts = (memberships ?? []).map((membership: any) => ({
    id: membership.organization_id,
    name: Array.isArray(membership.organizations) ? membership.organizations[0]?.name : membership.organizations?.name,
    slug: Array.isArray(membership.organizations) ? membership.organizations[0]?.slug : membership.organizations?.slug,
    stage: Array.isArray(membership.organizations) ? membership.organizations[0]?.lifecycle_stage : membership.organizations?.lifecycle_stage,
    role: membership.role,
  }))

  return (
    <PortalTheme accentColor={preferences?.accent_color ?? '#ff6600'} compactMode={preferences?.compact_mode}>
      <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#fff8f2]">
        <AppSidebar user={user} accounts={accounts} />
        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-30 flex h-14 items-center border-b border-orange-100 bg-white/90 px-4 backdrop-blur-xl lg:hidden">
            <SidebarTrigger />
            <span className="ml-3 text-sm font-semibold text-orange-950">MyBizz Command Centre</span>
          </div>
          {children}
        </main>
      </div>
      </SidebarProvider>
    </PortalTheme>
  )
}
