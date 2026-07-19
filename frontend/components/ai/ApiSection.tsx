'use client'

import React from 'react'
import { Code, Folder } from 'lucide-react'
import { ApiDesignResponse } from '@/services/ai'

interface ApiSectionProps {
  apiDesign: ApiDesignResponse
}

export function ApiSection({ apiDesign }: ApiSectionProps) {
  return (
    <div className="space-y-4 text-left">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Code className="h-4.5 w-4.5 text-primary" /> API Design
      </h3>
      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.005] max-w-md space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Base URL:</span>
          <code className="text-white bg-white/5 px-2 py-0.5 rounded">{apiDesign.base_url}</code>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Authentication:</span>
          <span className="text-primary bg-primary/10 px-2 py-0.5 rounded font-bold text-[10px]">JWT BEARER</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {apiDesign.resources?.map((res, rIdx) => (
          <div key={rIdx} className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Folder className="h-4 w-4 text-primary" /> {res.name}
            </h4>
            <div className="space-y-2">
              {res.endpoints?.map((e, eIdx) => {
                const isGet = e.method === 'GET'
                const isPost = e.method === 'POST'
                const isDelete = e.method === 'DELETE'
                return (
                  <div key={eIdx} className="p-3 rounded-lg bg-white/[0.01] border border-white/5 flex items-center gap-3">
                    <span className={`w-14 text-[9px] py-1 rounded text-center font-bold shrink-0 ${isGet ? 'bg-green-500/10 text-green-500' : isPost ? 'bg-blue-500/10 text-blue-500' : isDelete ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {e.method}
                    </span>
                    <div className="space-y-0.5 text-left">
                      <code className="text-xs text-white font-mono">{e.path}</code>
                      <p className="text-[10px] text-muted-foreground">{e.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
