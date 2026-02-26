'use client'

import { useEffect, useRef } from 'react'
import { type Message } from 'ai/react'
import { Loader2, Scale, User, BrainCircuit } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatStreamProps {
  messages: Message[]
  isLoading: boolean
  agentType?: string
}

export function ChatStream({ messages, isLoading, agentType = 'startup_lawyer' }: ChatStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const AgentIcon = agentType === 'cofounder' ? BrainCircuit : Scale

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <AgentIcon className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            {agentType === 'cofounder' ? 'AI Cofounder' : 'AI Startup Lawyer'}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {agentType === 'cofounder'
              ? 'Ask me about strategy, fundraising, go-to-market, or anything to move your company forward.'
              : 'Ask me about incorporation, annual compliance, contracts, regulatory requirements, or any legal question.'}
          </p>
          <p className="mt-3 text-xs text-muted-foreground/70">
            Responses are grounded in your document vault where available.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {message.role === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <AgentIcon className="h-4 w-4" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                message.role === 'user'
                  ? 'rounded-tr-sm bg-primary text-primary-foreground'
                  : 'rounded-tl-sm bg-muted text-foreground',
              )}
            >
              <MessageContent content={message.content} />
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-row gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <AgentIcon className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}

/**
 * Render message content with basic markdown-like formatting.
 * Keeps citations [1] [2] inline. No heavy markdown library needed.
 */
function MessageContent({ content }: { content: string }) {
  // Split on code blocks first, then process each segment
  const segments = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-2 whitespace-pre-wrap break-words">
      {segments.map((seg, i) => {
        if (seg.startsWith('```')) {
          const code = seg.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg bg-background/60 p-3 font-mono text-xs"
            >
              <code>{code}</code>
            </pre>
          )
        }
        return <span key={i}>{seg}</span>
      })}
    </div>
  )
}
