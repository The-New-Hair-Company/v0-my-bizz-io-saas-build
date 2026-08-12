'use client'

import { useState } from 'react'
import { ArrowUp, Bot, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Message = { role: 'user' | 'assistant'; content: string; sources?: string[] }

export function PublicAssistant() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Hi — I’m the MyBizz knowledge assistant. Ask how intake, delivery, security or Agency OS works.' }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  async function ask(question = input) {
    const message = question.trim()
    if (!message || busy) return
    setInput('')
    setBusy(true)
    setMessages((current) => [...current, { role: 'user', content: message }])
    const response = await fetch('/api/public-assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) })
    const data = await response.json()
    setBusy(false)
    setMessages((current) => [...current, { role: 'assistant', content: response.ok ? data.answer : data.error, sources: data.sources?.map((source: any) => source.title) }])
  }

  return <div className="overflow-hidden rounded-[28px] border border-orange-200 bg-white shadow-[0_35px_100px_-35px_rgba(168,55,0,.38)]"><div className="flex items-center justify-between border-b border-orange-100 px-5 py-4"><div className="flex items-center gap-3"><span className="relative grid h-10 w-10 place-items-center rounded-xl bg-[#ff6600] text-white"><Bot className="h-5 w-5" /><span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-orange-300" /></span><div><p className="text-sm font-bold text-orange-950">MyBizz intelligence</p><p className="text-[10px] font-medium uppercase tracking-[.16em] text-orange-700">Grounded · instant · no token cost</p></div></div><Sparkles className="h-5 w-5 text-orange-300" /></div><div className="h-[360px] space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#fff_0%,#fff8f1_100%)] p-5">{messages.map((message, index) => <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-md bg-[#ff6600] text-white' : 'rounded-bl-md border border-orange-100 bg-white text-orange-950 shadow-sm'}`}><p className="whitespace-pre-wrap">{message.content}</p>{message.sources?.length ? <p className="mt-3 border-t border-orange-100 pt-2 text-[10px] font-semibold uppercase tracking-[.12em] text-orange-600">Sources · {message.sources.join(' · ')}</p> : null}</div></div>)}{busy && <div className="flex items-center gap-2 text-xs text-orange-700"><Loader2 className="h-4 w-4 animate-spin" />Searching approved knowledge…</div>}</div><div className="border-t border-orange-100 p-4"><div className="flex gap-2"><Input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') ask() }} className="h-11 rounded-xl border-orange-200 bg-orange-50/50" placeholder="Ask about the platform…" /><Button size="icon" className="h-11 w-11 shrink-0 rounded-xl bg-[#ff6600] text-white hover:bg-[#e95d00]" onClick={() => ask()} disabled={busy || !input.trim()}><ArrowUp className="h-4 w-4" /></Button></div><div className="mt-3 flex flex-wrap gap-2">{['How is my data secured?', 'What happens after intake?', 'Does the AI use paid tokens?'].map((prompt) => <button key={prompt} onClick={() => ask(prompt)} className="rounded-full border border-orange-100 bg-white px-3 py-1.5 text-[10px] font-medium text-orange-800 hover:border-orange-300">{prompt}</button>)}</div></div></div>
}

