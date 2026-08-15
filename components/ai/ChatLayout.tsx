'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Loader2, Plus, Scale, SendHorizonal, Sparkles, Trash2, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Thread = { id: string; title: string; updated_at: string }
type Message = { id: string; role: 'user' | 'assistant'; content: string }
type Source = { id: string; title: string; excerpt: string; score: number; kind: string; url?: string | null; category?: string | null }

export function ChatLayout({ agentType, organizationId }: { agentType: 'startup_lawyer' | 'cofounder'; organizationId: string }) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  const isLawyer = agentType === 'startup_lawyer'

  const loadThreads = useCallback(async () => {
    const response = await fetch(`/api/ai/threads?organizationId=${organizationId}&agentType=${agentType}`)
    const data = await response.json()
    setThreads(data.threads ?? [])
  }, [organizationId, agentType])

  useEffect(() => { loadThreads() }, [loadThreads])
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, busy])

  async function selectThread(threadId: string) {
    setActiveThreadId(threadId)
    setSources([])
    setError('')
    const response = await fetch(`/api/ai/threads/${threadId}/messages`)
    const data = await response.json()
    setMessages((data.messages ?? []).map((message: Message) => ({ id: message.id, role: message.role, content: message.content })))
  }

  async function send() {
    const message = input.trim()
    if (!message || busy) return
    setInput('')
    setError('')
    setUpgradeRequired(false)
    setBusy(true)
    setMessages((current) => [...current, { id: `local-${Date.now()}`, role: 'user', content: message }])

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, threadId: activeThreadId, organizationId, agentType }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? 'I could not complete that answer. Please try again.')
        setUpgradeRequired(response.status === 402 || data.code === 'PLAN_LIMIT_REACHED')
        return
      }
      setActiveThreadId(data.threadId)
      setMessages((current) => [...current, data.message])
      setSources(data.sources ?? [])
      loadThreads()
    } catch {
      setError('The connection dropped before I could finish. Your question is still here — please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function removeThread(threadId: string) {
    await fetch(`/api/ai/threads?threadId=${threadId}`, { method: 'DELETE' })
    if (activeThreadId === threadId) {
      setActiveThreadId(null)
      setMessages([])
      setSources([])
    }
    loadThreads()
  }

  function newConversation() {
    setActiveThreadId(null)
    setMessages([])
    setSources([])
    setError('')
  }

  const prompts = isLawyer
    ? ['Can the company pay a dividend?', 'What should directors record before a major decision?', 'I have an interest in a supplier — what should I do?']
    : ['What should we prioritise this week?', 'Where is delivery most at risk?', 'Turn this account evidence into three next actions']

  return (
    <div className="flex h-screen min-h-[720px] overflow-hidden bg-[#fff8f2]">
      <aside className="hidden w-64 shrink-0 border-r border-white/20 bg-[var(--agency-accent)] text-white md:flex md:flex-col">
        <div className="flex items-center justify-between border-b border-white/20 p-4">
          <div>
            <p className="text-xs font-semibold">Conversations</p>
            <p className="mt-0.5 text-[10px] text-white/60">Private to this workspace</p>
          </div>
          <Button size="icon" variant="ghost" aria-label="New conversation" className="text-white hover:bg-white/15 hover:text-white" onClick={newConversation}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {threads.map((thread) => (
              <div key={thread.id} className="group flex items-center gap-1">
                <button onClick={() => selectThread(thread.id)} className={cn('min-w-0 flex-1 rounded-xl px-3 py-3 text-left text-xs hover:bg-white/15', activeThreadId === thread.id && 'bg-white text-[var(--agency-accent)]')}>
                  <span className="block truncate font-medium">{thread.title}</span>
                </button>
                <button onClick={() => removeThread(thread.id)} aria-label={`Delete ${thread.title}`} className="rounded-lg p-2 text-white/50 opacity-0 hover:bg-white/10 hover:text-white group-hover:opacity-100 focus:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t border-white/20 p-4">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/60">Knowledge</p>
            <p className="mt-2 text-xs font-semibold">{isLawyer ? 'Companies Act + workspace' : 'Workspace evidence'}</p>
            <p className="mt-1 text-[10px] leading-4 text-white/60">Sources stay visible with the answer</p>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-orange-100 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--agency-accent)] text-white">
              {isLawyer ? <Scale className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </span>
            <div>
              <h1 className="text-sm font-semibold text-orange-950">{isLawyer ? 'Company law assistant' : 'AI cofounder'}</h1>
              <p className="text-[10px] text-orange-950/45">{isLawyer ? 'UK company guidance with cited sources' : 'Practical decisions from workspace evidence'}</p>
            </div>
          </div>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-semibold text-orange-800">SOURCE GROUNDED</span>
        </header>

        <div className="flex min-h-0 flex-1">
          <ScrollArea className="flex-1">
            <div className="mx-auto max-w-3xl space-y-5 px-5 py-8">
              {!messages.length ? (
                <div className="py-8 text-center">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-100 text-[var(--agency-accent)]">
                    {isLawyer ? <Scale className="h-7 w-7" /> : <Sparkles className="h-7 w-7" />}
                  </span>
                  <h2 className="mt-5 text-2xl font-semibold tracking-tight text-orange-950">
                    {isLawyer ? 'Explain the situation in your own words.' : 'Bring me the decision, not a perfect prompt.'}
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-orange-950/55">
                    {isLawyer
                      ? 'I’ll connect the issue to the Companies Act 2006, current Companies House guidance and your approved company documents, then turn it into a practical next step.'
                      : 'I’ll read the strongest signals in this workspace, give you a clear recommendation and tell you what evidence could change it.'}
                  </p>
                  {isLawyer ? (
                    <p className="mx-auto mt-4 max-w-xl rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs leading-5 text-orange-900">
                      General information only. This assistant is not a solicitor, does not provide legal advice and is not a substitute for a qualified solicitor reviewing your circumstances.
                    </p>
                  ) : null}
                  <div className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-3">
                    {prompts.map((prompt) => (
                      <button key={prompt} onClick={() => setInput(prompt)} className="rounded-xl border border-orange-100 bg-white p-3 text-left text-xs leading-5 text-orange-950/70 transition hover:border-orange-300 hover:shadow-sm">
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {messages.map((message) => (
                <div key={message.id} className={cn('flex gap-3', message.role === 'user' && 'flex-row-reverse')}>
                  <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-xl', message.role === 'user' ? 'bg-orange-100 text-orange-800' : 'bg-[var(--agency-accent)] text-white')}>
                    {message.role === 'user' ? <UserRound className="h-4 w-4" /> : isLawyer ? <Scale className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </span>
                  <div className={cn('max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6', message.role === 'user' ? 'bg-orange-100 text-orange-950' : 'border border-orange-100 bg-white text-orange-950 shadow-sm')}>
                    {message.content}
                  </div>
                </div>
              ))}

              {busy ? (
                <div className="flex items-center gap-3 text-sm text-orange-950/50">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--agency-accent)]" />
                  {isLawyer ? 'Checking the relevant law and workspace evidence…' : 'Reading the strongest workspace signals…'}
                </div>
              ) : null}
              {error ? (
                <div className="rounded-xl bg-orange-100 p-3 text-sm text-orange-900">
                  {error}
                  {upgradeRequired ? <Link href="/pricing" className="ml-2 font-bold underline">Compare plans</Link> : null}
                </div>
              ) : null}
              {sources.length ? <div className="xl:hidden"><SourceList sources={sources} compact /></div> : null}
              <div ref={bottom} />
            </div>
          </ScrollArea>

          {sources.length ? (
            <aside className="hidden w-80 shrink-0 border-l border-orange-100 bg-white xl:block">
              <div className="border-b border-orange-100 p-4">
                <h2 className="text-sm font-semibold text-orange-950">Sources used</h2>
                <p className="mt-1 text-[10px] text-orange-950/45">Numbered to match the answer</p>
              </div>
              <SourceList sources={sources} />
            </aside>
          ) : null}
        </div>

        <div className="border-t border-orange-100 bg-white p-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-orange-200 bg-white p-2 shadow-lg shadow-orange-950/5 focus-within:border-orange-400">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    send()
                  }
                }}
                className="min-h-11 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                placeholder={isLawyer ? 'Describe the company-law question…' : 'What decision are you working through?'}
              />
              <Button size="icon" aria-label="Send message" className="agency-button h-10 w-10 shrink-0 rounded-xl" onClick={send} disabled={busy || !input.trim()}>
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-[10px] text-orange-950/40">
              {isLawyer
                ? 'General information only — not legal advice or a replacement for a solicitor.'
                : 'Decision support grounded in your workspace. Verify financial and legal decisions with a qualified professional.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function SourceList({ sources, compact = false }: { sources: Source[]; compact?: boolean }) {
  return (
    <div className={cn('space-y-3', compact ? 'mt-3 rounded-2xl border border-orange-100 bg-white p-3' : 'p-4')}>
      {compact ? <p className="text-xs font-semibold text-orange-950">Sources used</p> : null}
      {sources.map((source, index) => (
        <article key={source.id} className="rounded-xl border border-orange-100 p-3">
          <div className="flex items-start gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-800">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold leading-5 text-orange-950">{source.title}</p>
              <p className="mt-1 line-clamp-3 text-[10px] leading-4 text-orange-950/50">{source.excerpt}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[9px] uppercase tracking-[.12em] text-orange-700">{source.category?.replaceAll('_', ' ') || source.kind}</p>
                {source.url ? (
                  <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-700 hover:text-orange-900">
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
