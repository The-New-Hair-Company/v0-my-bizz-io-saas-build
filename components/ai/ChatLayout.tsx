'use client'

import { useState, useEffect, useCallback } from 'react'
import { useChat } from 'ai/react'
import { createClient } from '@/lib/supabase/client'
import { ThreadList, type AIThread } from './ThreadList'
import { ChatStream } from './ChatStream'
import { ChatComposer } from './ChatComposer'
import { CitationsPanel, type Citation } from './CitationsPanel'
import { Button } from '@/components/ui/button'
import { PanelRightOpen, PanelRightClose } from 'lucide-react'

interface ChatLayoutProps {
  agentType: 'startup_lawyer' | 'cofounder'
  organizationId: string
}

export function ChatLayout({ agentType, organizationId }: ChatLayoutProps) {
  const [threads, setThreads] = useState<AIThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [threadsLoading, setThreadsLoading] = useState(true)
  const [citationsOpen, setCitationsOpen] = useState(false)
  const [citations, setCitations] = useState<Citation[]>([])

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setMessages } =
    useChat({
      api: '/api/ai/chat',
      body: {
        threadId: activeThreadId,
        organizationId,
        agentType,
      },
      onResponse: async (response) => {
        // Capture new threadId from header if thread was created server-side
        const newThreadId = response.headers.get('X-Thread-Id')
        if (newThreadId && newThreadId !== activeThreadId) {
          setActiveThreadId(newThreadId)
          await loadThreads()
        }
      },
      onFinish: () => {
        loadCitationsForThread(activeThreadId)
      },
    })

  const loadThreads = useCallback(async () => {
    setThreadsLoading(true)
    try {
      const res = await fetch(
        `/api/ai/threads?organizationId=${organizationId}&agentType=${agentType}`,
      )
      const json = await res.json()
      setThreads(json.threads ?? [])
    } finally {
      setThreadsLoading(false)
    }
  }, [organizationId, agentType])

  const loadMessages = useCallback(
    async (threadId: string) => {
      const res = await fetch(`/api/ai/threads/${threadId}/messages`)
      const json = await res.json()
      if (json.messages) {
        const formatted = json.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))
        setMessages(formatted)

        // Collect citations from all messages
        const allCitations: Citation[] = json.messages.flatMap(
          (m: any) => m.ai_citations ?? [],
        )
        setCitations(allCitations)
      }
    },
    [setMessages],
  )

  const loadCitationsForThread = useCallback(async (threadId: string | null) => {
    if (!threadId) return
    const res = await fetch(`/api/ai/threads/${threadId}/messages`)
    const json = await res.json()
    if (json.messages) {
      const allCitations: Citation[] = json.messages.flatMap(
        (m: any) => m.ai_citations ?? [],
      )
      setCitations(allCitations)
    }
  }, [])

  useEffect(() => {
    loadThreads()
  }, [loadThreads])

  const handleSelectThread = useCallback(
    async (threadId: string) => {
      setActiveThreadId(threadId)
      setCitations([])
      await loadMessages(threadId)
    },
    [loadMessages],
  )

  const handleNewThread = useCallback(() => {
    setActiveThreadId(null)
    setMessages([])
    setCitations([])
  }, [setMessages])

  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      await fetch(`/api/ai/threads?threadId=${threadId}`, { method: 'DELETE' })
      if (activeThreadId === threadId) handleNewThread()
      setThreads((prev) => prev.filter((t) => t.id !== threadId))
    },
    [activeThreadId, handleNewThread],
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Thread sidebar: hidden on small screens */}
      <aside className="hidden w-56 flex-shrink-0 md:block xl:w-64">
        <ThreadList
          threads={threads}
          activeThreadId={activeThreadId}
          onSelect={handleSelectThread}
          onNew={handleNewThread}
          onDelete={handleDeleteThread}
          loading={threadsLoading}
        />
      </aside>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h1 className="text-sm font-semibold text-foreground">
            {agentType === 'cofounder' ? 'AI Cofounder' : 'AI Startup Lawyer'}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCitationsOpen((v) => !v)}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            {citationsOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
            Sources{citations.length > 0 ? ` (${citations.length})` : ''}
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Messages */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <ChatStream messages={messages} isLoading={isLoading} agentType={agentType} />
            <ChatComposer
              input={input}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onStop={stop}
              isLoading={isLoading}
              placeholder={
                agentType === 'cofounder'
                  ? 'Ask about strategy, fundraising, GTM…'
                  : 'Ask about compliance, filings, contracts…'
              }
            />
          </div>

          {/* Citations panel */}
          {citationsOpen && (
            <aside className="hidden w-72 flex-shrink-0 border-l border-border xl:block">
              <CitationsPanel citations={citations} />
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
