import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, Plus, Square } from 'lucide-react'

export default async function TasksPage() {
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

  // Get all tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  const todoTasks = tasks?.filter((t) => t.status === 'todo') || []
  const inProgressTasks = tasks?.filter((t) => t.status === 'in_progress') || []
  const completedTasks = tasks?.filter((t) => t.status === 'completed') || []

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage your action items</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">To Do</div>
          <div className="mt-2 text-2xl font-bold">{todoTasks.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">In Progress</div>
          <div className="mt-2 text-2xl font-bold">{inProgressTasks.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Completed</div>
          <div className="mt-2 text-2xl font-bold">{completedTasks.length}</div>
        </Card>
      </div>

      {/* Task Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* To Do */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">To Do</h2>
          <div className="space-y-3">
            {todoTasks.length > 0 ? (
              todoTasks.map((task) => (
                <Card key={task.id} className="p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <Square className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      </div>
                      {task.description && (
                        <p className="mb-2 text-sm text-muted-foreground">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {task.due_date && (
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        )}
                        <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No tasks to do</p>
              </Card>
            )}
          </div>
        </div>

        {/* In Progress */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">In Progress</h2>
          <div className="space-y-3">
            {inProgressTasks.length > 0 ? (
              inProgressTasks.map((task) => (
                <Card key={task.id} className="border-primary/50 p-4">
                  <div className="flex items-start gap-3">
                    <Square className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <div className="flex-1">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      </div>
                      {task.description && (
                        <p className="mb-2 text-sm text-muted-foreground">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {task.due_date && (
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        )}
                        <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No tasks in progress</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Completed</h2>
          <div className="space-y-3">
            {completedTasks.slice(0, 10).map((task) => (
              <Card key={task.id} className="p-4 opacity-70">
                <div className="flex items-start gap-3">
                  <CheckSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-chart-3" />
                  <div className="flex-1">
                    <h3 className="font-semibold line-through">{task.title}</h3>
                    {task.completed_at && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Completed: {new Date(task.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!tasks || tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckSquare className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">No tasks yet</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Create your first task to get started
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </Card>
      ) : null}
    </div>
  )
}
