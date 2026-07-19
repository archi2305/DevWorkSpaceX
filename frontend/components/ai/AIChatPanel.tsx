'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChatHeader } from './ChatHeader'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { SuggestionChips } from './SuggestionChips'
import { TypingIndicator } from './TypingIndicator'
import { generateChat } from '@/services/ai'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AIChatPanelProps {
  blueprint?: any
}

export function AIChatPanel({ blueprint: propBlueprint }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [activeBlueprint, setActiveBlueprint] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (propBlueprint) {
      setActiveBlueprint(propBlueprint)
    } else {
      const saved = localStorage.getItem('devworkspace_active_blueprint')
      if (saved) {
        setActiveBlueprint(JSON.parse(saved))
      }
    }
  }, [propBlueprint])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSend = async (text: string) => {
    const userMsg: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: text
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const response = await generateChat(text, activeBlueprint)
      const aiMsg: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: response.reply
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err: any) {
      console.error(err)
      const aiErrorMsg: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: "Sorry, I couldn't process your request. Please try again."
      }
      setMessages((prev) => [...prev, aiErrorMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[650px] rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all glow-card">
      <ChatHeader />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="space-y-4 text-center py-6">
            <span className="text-2xl">✨</span>
            <p className="text-xs text-muted-foreground">Ask anything about your architecture design...</p>
            <SuggestionChips onSelect={handleSend} />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}
        {loading && <TypingIndicator />}
      </div>

      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  )
}
