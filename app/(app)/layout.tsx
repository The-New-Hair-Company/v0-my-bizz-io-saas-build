import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's current organization
  const { data: memberships } = await supabase
    .from('members')
    .select('organization_id, organizations(name)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar user={user} organization={memberships?.organizations} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
