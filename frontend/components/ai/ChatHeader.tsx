'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

export function ChatHeader() {
  return (
    <div className="flex items-center gap-2.5 p-4 border-b border-white/5 bg-white/[0.01]">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div className="text-left">
        <h4 className="text-xs font-bold text-white">AI Architect Copilot</h4>
        <span className="text-[10px] text-[#5bb98c] font-semibold flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5bb98c] inline-block animate-pulse" />
          Active Session
        </span>
      </div>
    </div>
  )
}
