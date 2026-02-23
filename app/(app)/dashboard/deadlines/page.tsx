import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertCircle, Plus, Clock } from 'lucide-react'

export default async function DeadlinesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's organization
  const { data: membership } = await supabase
    .from('members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  const organizationId = membership?.organization_id

  // Get all filings
  const { data: filings } = await supabase
    .from('filings')
    .select('*')
    .eq('organization_id', organizationId)
    .order('due_date', { ascending: true })

  // Categorize filings
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcoming = filings?.filter((f) => {
    const dueDate = new Date(f.due_date)
    return dueDate >= today && f.status === 'pending'
  }) || []

  const overdue = filings?.filter((f) => {
    const dueDate = new Date(f.due_date)
    return dueDate < today && f.status === 'pending'
  }) || []

  const completed = filings?.filter((f) => f.status === 'completed') || []

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground'
      case 'high':
        return 'bg-chart-4 text-white'
      case 'medium':
        return 'bg-chart-1 text-white'
      case 'low':
        return 'bg-chart-3 text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-chart-3 text-white'
      case 'in_progress':
        return 'bg-chart-1 text-white'
      case 'pending':
        return 'bg-muted text-muted-foreground'
      case 'overdue':
        return 'bg-destructive text-destructive-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deadlines</h1>
          <p className="text-muted-foreground">Track your compliance filings</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Deadline
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Upcoming</div>
              <div className="mt-2 text-2xl font-bold">{upcoming.length}</div>
            </div>
            <Calendar className="h-8 w-8 text-chart-1" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Overdue</div>
              <div className="mt-2 text-2xl font-bold">{overdue.length}</div>
            </div>
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground">In Progress</div>
              <div className="mt-2 text-2xl font-bold">
                {filings?.filter((f) => f.status === 'in_progress').length || 0}
              </div>
            </div>
            <Clock className="h-8 w-8 text-chart-2" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Completed</div>
              <div className="mt-2 text-2xl font-bold">{completed.length}</div>
            </div>
            <Calendar className="h-8 w-8 text-chart-3" />
          </div>
        </Card>
      </div>

      {/* Overdue Filings */}
      {overdue.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold">Overdue</h2>
          </div>
          <div className="space-y-3">
            {overdue.map((filing) => (
              <Card key={filing.id} className="border-destructive/50 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold">{filing.title}</h3>
                        {filing.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{filing.description}</p>
                        )}
                      </div>
                      <Badge className={getPriorityColor(filing.priority)}>{filing.priority}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {new Date(filing.due_date).toLocaleDateString()}</span>
                      </div>
                      {filing.jurisdiction && (
                        <span className="text-muted-foreground">{filing.jurisdiction}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Filings */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Upcoming</h2>
        {upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.map((filing) => (
              <Card key={filing.id} className="p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold">{filing.title}</h3>
                        {filing.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{filing.description}</p>
                        )}
                      </div>
                      <Badge className={getPriorityColor(filing.priority)}>{filing.priority}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {new Date(filing.due_date).toLocaleDateString()}</span>
                      </div>
                      {filing.jurisdiction && (
                        <span className="text-muted-foreground">{filing.jurisdiction}</span>
                      )}
                      {filing.filing_type && (
                        <Badge variant="outline">{filing.filing_type}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No upcoming deadlines</h3>
            <p className="text-sm text-muted-foreground">
              {"You're all caught up!"}
            </p>
          </Card>
        )}
      </div>

      {/* Completed Filings */}
      {completed.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Completed</h2>
          <div className="space-y-3">
            {completed.slice(0, 5).map((filing) => (
              <Card key={filing.id} className="p-4 opacity-70">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold">{filing.title}</h3>
                      </div>
                      <Badge className={getStatusColor('completed')}>Completed</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {filing.completed_at && (
                        <span>Completed: {new Date(filing.completed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
