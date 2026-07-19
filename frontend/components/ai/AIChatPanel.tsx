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

export function AIChatPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to newest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Real respond logic
  const handleSend = async (text: string) => {
    const userMsg: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: text
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const response = await generateChat(text)
      const aiMsg: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: response.reply
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err: any) {
      console.error(err)
      const errMsg = err.response?.data?.detail || 'Architect Chat failed. Please try again.'
      const aiErrorMsg: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: `⚠️ Error: ${errMsg}`
      }
      setMessages((prev) => [...prev, aiErrorMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[650px] rounded-2xl border border-white/5 bg-[#0d0d0e]/60 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <ChatHeader />

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-white/10"
      >
        {messages.length === 0 ? (
          <SuggestionChips onSelect={handleSend} />
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        {loading && <TypingIndicator />}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  )
}
