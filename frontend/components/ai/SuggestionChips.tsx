'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

interface SuggestionChipsProps {
  onSelect: (prompt: string) => void
}

const suggestions = [
  'How do I scale this database tables setup?',
  'Explain the authentication flow here',
  'What are the deployment risks?',
  'Recommend some caching strategies'
]

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="space-y-2.5 p-4 text-left">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        <Sparkles className="h-3 w-3 text-primary" /> Suggested Questions
      </div>
      <div className="flex flex-col gap-2">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(s)}
            className="w-full text-left p-3 rounded-xl border border-white/5 bg-white/[0.005] hover:bg-white/[0.015] hover:border-primary/20 text-xs text-muted-foreground hover:text-white transition-all cursor-pointer"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
