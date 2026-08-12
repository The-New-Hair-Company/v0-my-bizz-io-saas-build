'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { Activity, BarChart3, Blocks, Bot, BriefcaseBusiness, Building2, CalendarClock, ChevronDown, CircleGauge, FileStack, FolderKanban, Inbox, LifeBuoy, ListChecks, Settings2, Sparkles, Users2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

const navigation = [
  { name: 'Command centre', href: '/dashboard', icon: CircleGauge },
  { name: 'Client accounts', href: '/dashboard/accounts', icon: Building2 },
  { name: 'Intake inbox', href: '/dashboard/intakes', icon: Inbox },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/dashboard/tasks', icon: ListChecks },
  { name: 'Deadlines', href: '/dashboard/deadlines', icon: CalendarClock },
  { name: 'Documents', href: '/dashboard/documents', icon: FileStack },
]

const intelligence = [
  { name: 'AI startup lawyer', href: '/dashboard/ai/startup-lawyer', icon: Bot },
  { name: 'AI cofounder', href: '/dashboard/ai/cofounder', icon: Sparkles },
  { name: 'Usage & controls', href: '/dashboard/ai/usage', icon: BarChart3 },
]

type SidebarUser = { name: string; email: string | null; imageUrl: string | null; isAdmin: boolean }
type Account = { id: string; name?: string; slug?: string; stage?: string; role: string }

export function AppSidebar({ user, accounts }: { user: SidebarUser; accounts: Account[] }) {
  const pathname = usePathname()
  const primary = accounts.find((account) => account.stage === 'active') ?? accounts[0]

  return (
    <Sidebar className="border-r-0" collapsible="icon">
      <SidebarHeader className="border-b border-white/10 bg-[#081421] p-3 text-white">
        <Link href="/dashboard" className="flex h-11 items-center gap-3 rounded-xl px-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"><BriefcaseBusiness className="h-4 w-4" /></span>
          <span className="group-data-[collapsible=icon]:hidden"><span className="block text-sm font-semibold tracking-tight">MyBizz</span><span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">Agency OS</span></span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger className="mt-2 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-left outline-none hover:bg-white/[0.07] group-data-[collapsible=icon]:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300"><Blocks className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{primary?.name ?? 'Portfolio'}</span><span className="block text-[10px] text-slate-500">{accounts.length} assigned account{accounts.length === 1 ? '' : 's'}</span></span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72" align="start">
            <DropdownMenuLabel>Assigned accounts</DropdownMenuLabel><DropdownMenuSeparator />
            {accounts.map((account) => <DropdownMenuItem key={account.id} asChild><Link href={`/dashboard/accounts/${account.id}`} className="flex justify-between"><span className="truncate">{account.name}</span><Badge variant="secondary" className="text-[10px]">{account.role}</Badge></Link></DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent className="bg-[#081421] px-2 text-slate-300">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-slate-600">Operations</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{navigation.map((item) => <NavItem key={item.href} item={item} pathname={pathname} />)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-slate-600">Intelligence</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{intelligence.map((item) => <NavItem key={item.href} item={item} pathname={pathname} />)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent><SidebarMenu>
            <NavItem item={{ name: 'Team & access', href: '/dashboard/team', icon: Users2 }} pathname={pathname} />
            <NavItem item={{ name: 'Integrations', href: '/dashboard/integrations', icon: Activity }} pathname={pathname} />
            <NavItem item={{ name: 'Settings', href: '/dashboard/settings', icon: Settings2 }} pathname={pathname} />
          </SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 bg-[#081421] p-3 text-white">
        <div className="flex items-center gap-3 rounded-xl p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
          <UserButton appearance={{ elements: { avatarBox: 'h-8 w-8' } }} />
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-medium">{user.name}</p><p className="truncate text-[10px] text-slate-500">{user.email}</p></div>
          {user.isAdmin && <Badge className="bg-emerald-400/10 text-[9px] text-emerald-300 hover:bg-emerald-400/10 group-data-[collapsible=icon]:hidden">ADMIN</Badge>}
        </div>
        <Link href="/contact" className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] text-slate-500 hover:bg-white/5 hover:text-slate-300 group-data-[collapsible=icon]:hidden"><LifeBuoy className="h-3.5 w-3.5" /> Support centre</Link>
      </SidebarFooter>
    </Sidebar>
  )
}

function NavItem({ item, pathname }: { item: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }; pathname: string }) {
  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
  return <SidebarMenuItem><SidebarMenuButton asChild isActive={active} tooltip={item.name} className="h-10 text-slate-400 data-[active=true]:bg-white/10 data-[active=true]:text-white hover:bg-white/[0.06] hover:text-white"><Link href={item.href}><item.icon className="h-4 w-4" /><span>{item.name}</span>{item.name === 'Intake inbox' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />}</Link></SidebarMenuButton></SidebarMenuItem>
}
