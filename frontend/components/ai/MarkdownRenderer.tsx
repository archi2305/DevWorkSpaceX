'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import { CodeBlock } from './CodeBlock'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          const isInline = !className
          if (isInline) {
            return (
              <code className="bg-white/5 text-primary px-1.5 py-0.5 rounded font-mono text-[10px]" {...props}>
                {children}
              </code>
            )
          }
          return (
            <CodeBlock
              language={match ? match[1] : ''}
              code={String(children).replace(/\n$/, '')}
            />
          )
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-3 border border-white/5 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">{children}</table>
            </div>
          )
        },
        thead({ children }) {
          return <thead className="bg-white/[0.02] border-b border-white/5 font-bold text-white">{children}</thead>
        },
        th({ children }) {
          return <th className="p-2">{children}</th>
        },
        td({ children }) {
          return <td className="p-2 border-b border-white/5 last:border-b-0">{children}</td>
        },
        ul({ children }) {
          return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
        },
        blockquote({ children }) {
          return <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground my-2">{children}</blockquote>
        },
        h1({ children }) {
          return <h1 className="text-base font-bold text-white my-3">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-sm font-bold text-white my-2">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-xs font-bold text-white my-2">{children}</h3>
        }
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
