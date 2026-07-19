'use client'

import React, { useState } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSend(value)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!value.trim() || disabled) return
      onSend(value)
      setValue('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-white/5 bg-white/[0.01]">
      <div className="flex items-end gap-2 bg-white/[0.01] border border-white/10 rounded-xl px-3 py-2 focus-within:border-primary/50 transition-colors">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI Architect..."
          disabled={disabled}
          rows={1}
          className="flex-1 max-h-24 bg-transparent outline-none border-none text-xs text-white placeholder-muted-foreground resize-none py-1 align-bottom disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-black hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </form>
  )
}
