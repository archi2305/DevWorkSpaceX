'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

interface SuggestionChipsProps {
  onSelect: (prompt: string) => void
}

const suggestions = [
  'Explain my architecture',
  'Review my database',
  'Improve my API design',
  'Generate JWT authentication',
  'Deployment advice',
  'Security review',
  'Explain this milestone',
  'Optimize this project'
]

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="space-y-3.5 p-4 text-left">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
        <Sparkles className="h-3.5 w-3.5 text-primary" /> Suggested Prompts
      </div>
      <div className="grid grid-cols-2 gap-2">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(s)}
            className="w-full text-left p-3 rounded-xl border border-white/5 bg-white/[0.005] hover:bg-white/[0.015] hover:border-primary/20 text-xs text-muted-foreground hover:text-white transition-all cursor-pointer truncate"
            title={s}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
