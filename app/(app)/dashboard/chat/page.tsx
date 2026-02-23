'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from 'ai/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send, Plus, MessageSquare, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ChatPage() {
  const [chats, setChats] = useState<any[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      chatId: currentChatId,
      organizationId,
    },
  })

  useEffect(() => {
    loadChats()
    loadOrganization()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadOrganization = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (membership) {
      setOrganizationId(membership.organization_id)
    }
  }

  const loadChats = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return

    const { data } = await supabase
      .from('chats')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .order('updated_at', { ascending: false })

    if (data) {
      setChats(data)
      if (data.length > 0 && !currentChatId) {
        setCurrentChatId(data[0].id)
      }
    }
  }

  const createNewChat = async () => {
    if (!organizationId) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('chats')
      .insert({
        organization_id: organizationId,
        title: `Chat ${new Date().toLocaleDateString()}`,
        created_by: user.id,
      })
      .select()
      .single()

    if (data && !error) {
      setChats([data, ...chats])
      setCurrentChatId(data.id)
    }
  }

  return (
    <div className="flex h-screen">
      {/* Chat Sidebar */}
      <div className="w-64 border-r border-border bg-muted/30 p-4">
        <Button 
          onClick={createNewChat} 
          className="mb-4 w-full"
          disabled={!organizationId}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
        <div className="space-y-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setCurrentChatId(chat.id)}
              className={`w-full rounded-lg p-3 text-left text-sm transition-colors ${
                currentChatId === chat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{chat.title}</span>
              </div>
              <div className="mt-1 text-xs opacity-70">
                {new Date(chat.created_at).toLocaleDateString()}
              </div>
            </button>
          ))}
          {chats.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No chats yet. Create one to get started!
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col">
        {currentChatId || messages.length > 0 ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.length === 0 && (
                  <Card className="p-8 text-center">
                    <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h2 className="mb-2 text-lg font-semibold">
                      How can I help with compliance today?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Ask me anything about filing requirements, deadlines, or regulatory guidance.
                    </p>
                  </Card>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg bg-muted p-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-border bg-background p-4">
              <form
                onSubmit={handleSubmit}
                className="mx-auto flex max-w-3xl gap-2"
              >
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask about compliance requirements..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <Card className="max-w-md p-8 text-center">
              <MessageSquare className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h2 className="mb-2 text-xl font-semibold">Start a conversation</h2>
              <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                Create a new chat to get AI-powered compliance guidance tailored to your business.
              </p>
              <Button onClick={createNewChat} disabled={!organizationId}>
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
