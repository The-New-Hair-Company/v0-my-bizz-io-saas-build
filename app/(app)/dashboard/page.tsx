import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, AlertCircle, CheckCircle2, Calendar, FileText, MessageSquare, Clock } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's organization
  const { data: membership } = await supabase
    .from('members')
    .select('organization_id, role, organizations(*)')
    .eq('user_id', user.id)
    .single()

  const organizationId = membership?.organization_id

  // Get upcoming deadlines
  const { data: upcomingDeadlines, count: deadlineCount } = await supabase
    .from('filings')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .gte('due_date', new Date().toISOString().split('T')[0])
    .order('due_date', { ascending: true })
    .limit(5)

  // Get pending tasks
  const { data: pendingTasks, count: taskCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .in('status', ['todo', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(5)

  // Get recent documents
  const { count: documentCount } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  // Get recent chats
  const { count: chatCount } = await supabase
    .from('chats')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const stats = [
    {
      label: 'Upcoming Deadlines',
      value: deadlineCount || 0,
      icon: Calendar,
      href: '/dashboard/deadlines',
      color: 'text-chart-1',
    },
    {
      label: 'Pending Tasks',
      value: taskCount || 0,
      icon: CheckCircle2,
      href: '/dashboard/tasks',
      color: 'text-chart-2',
    },
    {
      label: 'Documents',
      value: documentCount || 0,
      icon: FileText,
      href: '/dashboard/documents',
      color: 'text-chart-3',
    },
    {
      label: 'Chat Sessions',
      value: chatCount || 0,
      icon: MessageSquare,
      href: '/dashboard/chat',
      color: 'text-chart-4',
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {'Welcome back, '}{user.email?.split('@')[0]}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="p-6 transition-all duration-200 hover:border-primary/50 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/chat">
            <Button variant="outline" className="h-auto w-full flex-col items-start p-4 text-left">
              <MessageSquare className="mb-2 h-5 w-5 text-primary" />
              <div className="font-semibold">Ask AI</div>
              <div className="text-xs text-muted-foreground">Get compliance guidance</div>
            </Button>
          </Link>
          <Link href="/dashboard/documents">
            <Button variant="outline" className="h-auto w-full flex-col items-start p-4 text-left">
              <FileText className="mb-2 h-5 w-5 text-primary" />
              <div className="font-semibold">Upload Document</div>
              <div className="text-xs text-muted-foreground">Add a new file</div>
            </Button>
          </Link>
          <Link href="/dashboard/deadlines">
            <Button variant="outline" className="h-auto w-full flex-col items-start p-4 text-left">
              <Calendar className="mb-2 h-5 w-5 text-primary" />
              <div className="font-semibold">View Calendar</div>
              <div className="text-xs text-muted-foreground">See all deadlines</div>
            </Button>
          </Link>
          <Link href="/dashboard/company">
            <Button variant="outline" className="h-auto w-full flex-col items-start p-4 text-left">
              <CheckCircle2 className="mb-2 h-5 w-5 text-primary" />
              <div className="font-semibold">Update Profile</div>
              <div className="text-xs text-muted-foreground">Company information</div>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming Deadlines</h2>
            <Link href="/dashboard/deadlines">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="mt-0.5">
                    {deadline.priority === 'critical' || deadline.priority === 'high' ? (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{deadline.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Due: {new Date(deadline.due_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
            </div>
          )}
        </Card>

        {/* Pending Tasks */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pending Tasks</h2>
            <Link href="/dashboard/tasks">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          {pendingTasks && pendingTasks.length > 0 ? (
            <div className="space-y-4">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="mt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    {task.due_date && (
                      <div className="text-sm text-muted-foreground">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No pending tasks</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
