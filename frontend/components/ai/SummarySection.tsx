'use client'

import React from 'react'

interface SummarySectionProps {
  totalFeatures: number
  totalTables: number
  totalEndpoints: number
  totalMilestones: number
  totalModules: number
}

export function SummarySection({
  totalFeatures,
  totalTables,
  totalEndpoints,
  totalMilestones,
  totalModules
}: SummarySectionProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-left">
      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
        <span className="text-xs text-muted-foreground uppercase font-semibold">Features</span>
        <p className="text-2xl font-bold text-white mt-1">{totalFeatures}</p>
      </div>
      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
        <span className="text-xs text-muted-foreground uppercase font-semibold">Tables</span>
        <p className="text-2xl font-bold text-white mt-1">{totalTables}</p>
      </div>
      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
        <span className="text-xs text-muted-foreground uppercase font-semibold">Endpoints</span>
        <p className="text-2xl font-bold text-white mt-1">{totalEndpoints}</p>
      </div>
      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
        <span className="text-xs text-muted-foreground uppercase font-semibold">Milestones</span>
        <p className="text-2xl font-bold text-white mt-1">{totalMilestones}</p>
      </div>
      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors col-span-2 md:col-span-1">
        <span className="text-xs text-muted-foreground uppercase font-semibold">Modules</span>
        <p className="text-2xl font-bold text-white mt-1">{totalModules}</p>
      </div>
    </div>
  )
}
