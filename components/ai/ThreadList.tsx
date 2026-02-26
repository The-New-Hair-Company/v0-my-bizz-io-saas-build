'use client'

import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export type AIThread = {
  id: string
  title: string
  agent_type: string
  created_at: string
  updated_at: string
}

interface ThreadListProps {
  threads: AIThread[]
  activeThreadId?: string | null
  onSelect: (threadId: string) => void
  onNew: () => void
  onDelete?: (threadId: string) => void
  loading?: boolean
}

export function ThreadList({
  threads,
  activeThreadId,
  onSelect,
  onNew,
  onDelete,
  loading = false,
}: ThreadListProps) {
  return (
    <div className="flex h-full flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-medium text-sidebar-foreground">Conversations</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={onNew}
          className="h-7 w-7 p-0 text-sidebar-foreground hover:bg-sidebar-accent"
          aria-label="New conversation"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Thread list */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-2">
          {loading && threads.length === 0 && (
            <div className="space-y-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-sidebar-accent"
                />
              ))}
            </div>
          )}

          {!loading && threads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Start a new one to get help
              </p>
            </div>
          )}

          {threads.map((thread) => (
            <div key={thread.id} className="group relative">
              <button
                onClick={() => onSelect(thread.id)}
                className={cn(
                  'w-full rounded-lg px-3 py-2.5 text-left transition-colors',
                  activeThreadId === thread.id
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent',
                )}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">
                      {thread.title}
                    </p>
                    <p
                      className={cn(
                        'mt-0.5 text-xs',
                        activeThreadId === thread.id
                          ? 'text-sidebar-primary-foreground/70'
                          : 'text-muted-foreground',
                      )}
                    >
                      {formatDistanceToNow(new Date(thread.updated_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </button>

              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(thread.id)
                  }}
                  className={cn(
                    'absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 opacity-0 transition-opacity',
                    'text-muted-foreground hover:text-destructive',
                    'group-hover:opacity-100',
                    activeThreadId === thread.id && 'text-sidebar-primary-foreground/70 hover:text-sidebar-primary-foreground',
                  )}
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
