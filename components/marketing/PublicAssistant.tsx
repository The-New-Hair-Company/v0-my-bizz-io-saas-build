'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Bot, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Message = { role: 'user' | 'assistant'; content: string; sources?: string[] }

const starters = [
  'What happens after I share a brief?',
  'How does MyBizz answer from my documents?',
  'How do you keep client accounts private?',
]

export function PublicAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi — tell me what you want to get done. I can show you how MyBizz turns a conversation into an organised brief, secure client work and a clear next step.',
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, busy])

  async function ask(question = input) {
    const message = question.trim()
    if (!message || busy) return
    setInput('')
    setBusy(true)
    setMessages((current) => [...current.slice(-7), { role: 'user', content: message }])

    try {
      const response = await fetch('/api/public-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await response.json()
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: response.ok ? data.answer : data.error || 'I could not answer that just now. Please try again.',
          sources: response.ok ? data.sources?.map((source: { title: string }) => source.title) : undefined,
        },
      ])
    } catch {
      setMessages((current) => [...current, { role: 'assistant', content: 'I lost the connection for a moment. Please try that question again.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-[30px] border border-orange-200 bg-white shadow-[0_32px_90px_-38px_rgba(194,65,0,.42)]">
      <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="relative grid h-10 w-10 place-items-center rounded-2xl bg-[#ff6600] text-white">
            <Bot className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-orange-300" />
          </span>
          <div>
            <p className="text-sm font-bold text-orange-950">Ask MyBizz</p>
            <p className="text-xs text-orange-800/60">A useful answer, then a clear next step</p>
          </div>
        </div>
        <Sparkles className="h-5 w-5 text-orange-400" aria-hidden="true" />
      </div>

      <div className="h-[360px] space-y-4 overflow-y-auto bg-gradient-to-b from-white to-orange-50/60 p-5 sm:h-[400px] sm:p-6" aria-live="polite">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[82%] ${message.role === 'user' ? 'rounded-br-md bg-[#ff6600] text-white' : 'rounded-bl-md border border-orange-100 bg-white text-orange-950 shadow-sm'}`}>
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.sources?.length ? (
                <p className="mt-3 border-t border-orange-100 pt-2 text-[10px] font-semibold uppercase tracking-[.12em] text-orange-600">
                  Based on {message.sources.slice(0, 2).join(' · ')}
                </p>
              ) : null}
            </div>
          </div>
        ))}
        {busy ? (
          <div className="flex items-center gap-2 text-xs text-orange-700">
            <Loader2 className="h-4 w-4 animate-spin" /> Finding the most useful answer…
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-orange-100 p-4 sm:p-5">
        {messages.length === 1 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {starters.map((prompt) => (
              <button key={prompt} onClick={() => ask(prompt)} className="rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-left text-[11px] font-medium text-orange-900 transition hover:border-orange-400 hover:bg-white">
                {prompt}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex gap-2 rounded-2xl border border-orange-200 bg-orange-50/60 p-1.5 focus-within:border-orange-400 focus-within:bg-white">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') ask()
            }}
            className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
            placeholder="Ask a question…"
            aria-label="Ask MyBizz a question"
          />
          <Button size="icon" aria-label="Send question" className="h-11 w-11 shrink-0 rounded-xl bg-[#ff6600] text-white hover:bg-[#e95d00]" onClick={() => ask()} disabled={busy || !input.trim()}>
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
