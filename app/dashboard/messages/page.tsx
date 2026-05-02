'use client'

import { useState } from 'react'
import {
  MessageSquare,
  Search,
  Send,
  Plus,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  MoreHorizontal,
  Paperclip,
  Smile,
} from 'lucide-react'

type Priority = 'High' | 'Medium' | 'Low'

type Message = {
  id: string
  sender: 'client' | 'agent' | 'note'
  text: string
  time: string
  attachmentLabel?: string
}

type Conversation = {
  id: string
  name: string
  company: string
  preview: string
  time: string
  priority: Priority
  score: number
  channel: string
  status: string
  unread?: number
  messages: Message[]
}

const mockConversations: Conversation[] = [
  {
    id: 'c1', name: 'Sarah Mitchell', company: 'Digital Pro', preview: 'Can we get the SEO audit started this week?',
    time: '2m ago', priority: 'High', score: 87, channel: 'WhatsApp', status: 'open', unread: 2,
    messages: [
      { id: 'm1', sender: 'client', text: 'Hi! Just checking in — when can we expect the SEO audit to start?', time: '10:12 AM' },
      { id: 'm2', sender: 'agent', text: 'Hi Sarah! We can start this Thursday. I\'ll send you a link to the audit portal.', time: '10:45 AM' },
      { id: 'm3', sender: 'client', text: 'Perfect, Thursday works great. Can we get it started this week?', time: '11:03 AM' },
    ],
  },
  {
    id: 'c2', name: 'Mike Johnson', company: 'Hair Plus', preview: 'The new landing page looks fantastic!',
    time: '1h ago', priority: 'Medium', score: 74, channel: 'Email', status: 'open', unread: 1,
    messages: [
      { id: 'm1', sender: 'agent', text: 'Hi Mike, just sent over the updated landing page for your review.', time: 'Yesterday 4:30 PM' },
      { id: 'm2', sender: 'client', text: 'The new landing page looks fantastic! Love the hero section. Just one small tweak — can we make the CTA button green?', time: '9:14 AM' },
    ],
  },
  {
    id: 'c3', name: 'Emma Clarke', company: 'Bloom Florist', preview: 'Can we discuss the proposal terms?',
    time: '3h ago', priority: 'High', score: 91, channel: 'SMS', status: 'open',
    messages: [
      { id: 'm1', sender: 'client', text: 'Hi, I\'ve reviewed the proposal. Can we discuss the payment terms on a quick call?', time: '8:00 AM' },
      { id: 'm2', sender: 'note', text: 'Client interested but wants monthly billing instead of annual. Check if we can accommodate.', time: '8:15 AM' },
    ],
  },
  {
    id: 'c4', name: 'Tom Ridley', company: 'Growth Co', preview: 'Thanks for the info, I\'ll be in touch.',
    time: '2d ago', priority: 'Low', score: 42, channel: 'Email', status: 'closed',
    messages: [
      { id: 'm1', sender: 'agent', text: 'Tom, here are the details you requested about our SEO packages.', time: '2 days ago' },
      { id: 'm2', sender: 'client', text: 'Thanks for the info, I\'ll be in touch when we\'re ready to move forward.', time: '2 days ago' },
    ],
  },
]

const priorityColors: Record<Priority, string> = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' }

const card: React.CSSProperties = { background: 'rgba(11,17,28,0.94)', border: '1px solid rgba(116,147,196,0.15)', borderRadius: 12 }
const inputSt: React.CSSProperties = { background: 'rgba(8,12,19,0.7)', border: '1px solid rgba(116,147,196,0.22)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#f5f8ff', outline: 'none', width: '100%' }
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(116,147,196,0.2)', background: 'rgba(11,17,28,0.8)', color: '#9aa5b6', cursor: 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' as const }
const btnBlue: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.45)', background: 'linear-gradient(135deg, rgba(37,99,235,0.35), rgba(37,99,235,0.15))', color: '#8ab4ff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }

export default function MessagesPage() {
  const [search, setSearch] = useState('')
  const [active, setActive] = useState<Conversation>(mockConversations[0])
  const [reply, setReply] = useState('')
  const [msgs, setMsgs] = useState<Record<string, Message[]>>(() =>
    Object.fromEntries(mockConversations.map((c) => [c.id, c.messages]))
  )

  const conversations = mockConversations.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase())
  )

  const handleSend = () => {
    if (!reply.trim()) return
    const newMsg: Message = { id: `m${Date.now()}`, sender: 'agent', text: reply, time: 'Just now' }
    setMsgs((prev) => ({ ...prev, [active.id]: [...(prev[active.id] ?? []), newMsg] }))
    setReply('')
  }

  const activeMessages = msgs[active.id] ?? []

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', padding: '0' }}>
      {/* Header */}
      <div style={{ padding: '28px 32px 0' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#f5f8ff' }}>Messages</h1>
        <p style={{ margin: '6px 0 20px', fontSize: 14, color: '#738094' }}>All client conversations in one place.</p>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, padding: '0 32px 28px', gap: 16 }}>
        {/* Conversation list */}
        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#4a6080', pointerEvents: 'none' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ ...inputSt, paddingLeft: 28, fontSize: 12 }} />
            </div>
            <button style={{ ...btnBlue, padding: '8px 10px' }}><Plus size={15} /></button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActive(c)}
                style={{
                  ...card, padding: '14px 14px', cursor: 'pointer', transition: '120ms',
                  borderColor: active.id === c.id ? 'rgba(59,130,246,0.4)' : 'rgba(116,147,196,0.15)',
                  background: active.id === c.id ? 'rgba(37,99,235,0.1)' : 'rgba(11,17,28,0.94)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {c.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f5f8ff' }}>{c.name}</span>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        {c.unread && <span style={{ background: '#3b82f6', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 8, padding: '1px 5px' }}>{c.unread}</span>}
                        <span style={{ fontSize: 10, color: '#4a6080' }}>{c.time}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#738094', marginBottom: 4 }}>{c.company} · {c.channel}</div>
                    <div style={{ fontSize: 12, color: '#9aa5b6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.preview}</div>
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: `${priorityColors[c.priority]}18`, color: priorityColors[c.priority] }}>{c.priority}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message thread */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...card, overflow: 'hidden' }}>
          {/* Thread header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(116,147,196,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {active.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f5f8ff' }}>{active.name}</div>
                <div style={{ fontSize: 11, color: '#738094' }}>{active.company} · {active.channel}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...btnGhost, padding: '6px 10px', fontSize: 12 }}><Phone size={13} /> Call</button>
              <button style={{ ...btnGhost, padding: '6px 10px', fontSize: 12 }}><Mail size={13} /> Email</button>
              <button style={{ ...btnGhost, padding: '6px 8px', border: 'none', color: '#738094' }}><MoreHorizontal size={15} /></button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {activeMessages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'agent' ? 'flex-end' : msg.sender === 'note' ? 'center' : 'flex-start' }}>
                {msg.sender === 'note' ? (
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 14px', maxWidth: '80%', fontSize: 12, color: '#c4a55a' }}>
                    📝 Note: {msg.text}
                    <span style={{ display: 'block', fontSize: 10, color: '#7a6030', marginTop: 3 }}>{msg.time}</span>
                  </div>
                ) : (
                  <div style={{ maxWidth: '70%' }}>
                    <div style={{
                      padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.6,
                      background: msg.sender === 'agent' ? 'rgba(37,99,235,0.3)' : 'rgba(11,17,28,0.94)',
                      border: `1px solid ${msg.sender === 'agent' ? 'rgba(59,130,246,0.35)' : 'rgba(116,147,196,0.15)'}`,
                      color: msg.sender === 'agent' ? '#c4d9f5' : '#e2ecf8',
                      borderBottomRightRadius: msg.sender === 'agent' ? 4 : 12,
                      borderBottomLeftRadius: msg.sender === 'client' ? 4 : 12,
                    }}>
                      {msg.text}
                    </div>
                    <div style={{ fontSize: 10, color: '#4a6080', marginTop: 4, textAlign: msg.sender === 'agent' ? 'right' : 'left' }}>{msg.time}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Compose */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(116,147,196,0.1)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={`Reply to ${active.name}… (Enter to send)`}
                rows={2}
                style={{ ...inputSt, resize: 'none', flex: 1 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={handleSend} style={{ ...btnBlue, padding: '10px 14px' }}><Send size={15} /></button>
                <button style={{ ...btnGhost, padding: '8px 12px' }}><Paperclip size={13} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
