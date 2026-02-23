'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, LayoutDashboard, MessageSquare, FileText, Calendar, CheckSquare, Settings, LogOut } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Deadlines', href: '/dashboard/deadlines', icon: Calendar },
  { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
]

const settingsNavigation = [
  { name: 'Company Profile', href: '/dashboard/company', icon: Building2 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface AppSidebarProps {
  user: {
    email?: string
  }
  organization: any
}

export function AppSidebar({ user, organization }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-sidebar-primary" />
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">MyBizz</span>
            <span className="text-xs text-sidebar-foreground/60">
              {organization?.name || 'My Company'}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="mb-2 flex items-center gap-3 rounded-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            {user.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 text-sm">
            <div className="font-medium text-sidebar-foreground">{user.email}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
