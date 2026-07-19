'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, User } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-2.5 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
    >
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] ${
        isUser ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white'
      }`}>
        {isUser ? <User className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
      </div>
      <div className={`p-3 rounded-2xl text-xs text-left leading-relaxed ${
        isUser ? 'bg-primary/10 text-white rounded-tr-none border border-primary/20' : 'bg-white/[0.02] text-muted-foreground rounded-tl-none border border-white/5'
      }`}>
        <p className="whitespace-pre-line">{message.content}</p>
      </div>
    </motion.div>
  )
}
