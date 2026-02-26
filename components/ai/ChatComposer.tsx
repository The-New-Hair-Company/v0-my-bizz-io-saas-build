'use client'

import { useRef, type FormEvent } from 'react'
import { SendHorizonal, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ChatComposerProps {
  input: string
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  onStop?: () => void
  isLoading: boolean
  placeholder?: string
  disabled?: boolean
}

export function ChatComposer({
  input,
  onInputChange,
  onSubmit,
  onStop,
  isLoading,
  placeholder = 'Ask a question…',
  disabled = false,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && input.trim()) {
        const form = textareaRef.current?.closest('form')
        form?.requestSubmit()
      }
    }
  }

  return (
    <div className="border-t border-border bg-background px-4 py-4">
      <form onSubmit={onSubmit} className="mx-auto max-w-2xl">
        <div
          className={cn(
            'flex items-end gap-2 rounded-xl border border-input bg-background px-3 py-2 shadow-sm',
            'transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30',
            disabled && 'opacity-60',
          )}
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className={cn(
              'max-h-[200px] min-h-[36px] flex-1 resize-none border-0 bg-transparent p-0 shadow-none',
              'focus-visible:ring-0 focus-visible:ring-offset-0',
              'text-sm leading-relaxed placeholder:text-muted-foreground/60',
            )}
            aria-label="Message input"
          />

          {isLoading ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onStop}
              className="mb-0.5 h-8 w-8 flex-shrink-0 rounded-lg p-0"
              aria-label="Stop generation"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || disabled}
              className="mb-0.5 h-8 w-8 flex-shrink-0 rounded-lg p-0"
              aria-label="Send message"
            >
              <SendHorizonal className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
          AI responses are informational only and not legal advice. Shift+Enter for new line.
        </p>
      </form>
    </div>
  )
}
