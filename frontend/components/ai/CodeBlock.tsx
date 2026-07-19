'use client'

import React from 'react'
import { CopyButton } from './CopyButton'

interface CodeBlockProps {
  language: string
  code: string
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  // Simple regex-based syntax highlighting logic
  const highlightCode = (src: string) => {
    if (!src) return ''
    const escaped = src
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // Keywords list
    const keywords = /\b(const|let|var|function|return|import|export|from|default|class|extends|if|else|for|while|try|catch|async|await|def|import|from|class|return|self|yield)\b/g
    // Strings
    const strings = /(["'`])(.*?)\1/g
    // Comments
    const comments = /(\/\/.*|#.*|\/\*[\s\S]*?\*\/)/g
    // Numbers
    const numbers = /\b(\d+)\b/g

    let highlighted = escaped
      .replace(comments, '<span class="text-[#7E848C] italic">$1</span>')
      .replace(strings, '<span class="text-[#5BB98C]">$1$2$1</span>')
      .replace(keywords, '<span class="text-primary font-semibold">$1</span>')
      .replace(numbers, '<span class="text-amber-500">$1</span>')

    return highlighted
  }

  return (
    <div className="relative border border-white/5 bg-[#09090b] rounded-xl overflow-hidden my-3">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider select-none">
        <span>{language || 'code'}</span>
        <CopyButton text={code} />
      </div>
      {/* Code body */}
      <pre className="p-4 overflow-x-auto text-xs font-mono text-left leading-relaxed whitespace-pre scrollbar-thin">
        <code
          dangerouslySetInnerHTML={{ __html: highlightCode(code) }}
          className="block"
        />
      </pre>
    </div>
  )
}
