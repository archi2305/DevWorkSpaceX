'use client'

import React from 'react'

interface OverviewSectionProps {
  title: string
  description: string
  projectType: string
  difficulty: string
  timeline: string
  preferredStack: string
}

export function OverviewSection({
  title,
  description,
  projectType,
  difficulty,
  timeline,
  preferredStack
}: OverviewSectionProps) {
  return (
    <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-primary/10 via-card/50 to-primary/5 p-6 md:p-8 space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">{projectType}</span>
        <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">{difficulty}</span>
        <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">{timeline}</span>
        {preferredStack && (
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider">Stack: {preferredStack}</span>
        )}
      </div>
      <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{title}</h2>
      <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-4xl">{description}</p>
    </div>
  )
}
