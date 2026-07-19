'use client'

import React from 'react'
import { Network, Folder, ArrowRight } from 'lucide-react'
import { ArchitectureResponse } from '@/services/ai'

interface ArchitectureSectionProps {
  architecture: ArchitectureResponse
}

export function ArchitectureSection({ architecture }: ArchitectureSectionProps) {
  return (
    <div className="space-y-4 text-left">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Network className="h-4.5 w-4.5 text-primary" /> Architecture
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors col-span-1 md:col-span-2 space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Architecture Style</span>
            <p className="text-sm font-bold text-white">{architecture.architecture_style}</p>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Communication Flow</span>
            <p className="text-xs text-muted-foreground leading-relaxed">{architecture.communication}</p>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider block">External Services</span>
            <div className="flex flex-wrap gap-1.5">
              {architecture.external_services?.map((es, esIdx) => (
                <span key={esIdx} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-white">{es}</span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Modules</span>
            <div className="flex flex-wrap gap-1.5">
              {architecture.modules?.map((m, mIdx) => (
                <span key={mIdx} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono font-bold">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Folder Structures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Folder className="h-4 w-4 text-primary" /> Backend Folder Structure
          </span>
          <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-[10px] font-mono text-muted-foreground overflow-x-auto space-y-1">
            {architecture.folder_structure.backend?.map((bPath, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3 text-primary shrink-0" /> {bPath}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Folder className="h-4 w-4 text-primary" /> Frontend Folder Structure
          </span>
          <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-[10px] font-mono text-muted-foreground overflow-x-auto space-y-1">
            {architecture.folder_structure.frontend?.map((fPath, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3 text-primary shrink-0" /> {fPath}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
