'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2.5 mr-auto">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white animate-pulse">
        <Sparkles className="h-3 w-3" />
      </div>
      <div className="flex items-center gap-1.5 p-3 px-4 rounded-2xl rounded-tl-none bg-white/[0.02] border border-white/5 w-fit">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
      </div>
    </div>
  )
}
