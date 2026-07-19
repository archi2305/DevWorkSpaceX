'use client'

import React from 'react'
import { CheckCircle2 } from 'lucide-react'

interface GenerationProgressProps {
  step: 'idle' | 'project-plan' | 'milestone' | 'database' | 'api' | 'architecture' | 'ready'
}

export function GenerationProgress({ step }: GenerationProgressProps) {
  if (step === 'idle' || step === 'ready') return null

  return (
    <div className="p-8 rounded-2xl border border-white/5 bg-[#09090b] text-center flex flex-col items-center justify-center space-y-6 shadow-xl">
      <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <div className="space-y-2 text-center">
        <p className="text-sm font-semibold text-white">Generating Complete Blueprint...</p>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <div className={`flex items-center gap-2 justify-center ${step === 'project-plan' ? 'text-primary font-bold animate-pulse' : 'text-muted-foreground'}`}>
            <span>{step !== 'project-plan' ? '✓' : ''} Project Plan</span>
            {step !== 'project-plan' && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
          </div>
          <div className={`flex items-center gap-2 justify-center ${step === 'database' ? 'text-primary font-bold animate-pulse' : 'text-muted-foreground'}`}>
            <span>{step !== 'project-plan' && step !== 'milestone' && step !== 'database' ? '✓' : ''} Generating Database...</span>
            {step !== 'project-plan' && step !== 'milestone' && step !== 'database' && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
          </div>
          <div className={`flex items-center gap-2 justify-center ${step === 'api' ? 'text-primary font-bold animate-pulse' : 'text-muted-foreground'}`}>
            <span>{step !== 'project-plan' && step !== 'milestone' && step !== 'database' && step !== 'api' ? '✓' : ''} Generating APIs...</span>
            {step !== 'project-plan' && step !== 'milestone' && step !== 'database' && step !== 'api' && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
          </div>
          <div className={`flex items-center gap-2 justify-center ${step === 'architecture' ? 'text-primary font-bold animate-pulse' : 'text-muted-foreground'}`}>
            <span>{step !== 'project-plan' && step !== 'milestone' && step !== 'database' && step !== 'api' && step !== 'architecture' ? '✓' : ''} Generating Architecture...</span>
            {step !== 'project-plan' && step !== 'milestone' && step !== 'database' && step !== 'api' && step !== 'architecture' && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
          </div>
          <div className={`flex items-center gap-2 justify-center ${step === 'milestone' ? 'text-primary font-bold animate-pulse' : 'text-muted-foreground'}`}>
            <span>{step !== 'project-plan' && step !== 'milestone' ? '✓' : ''} Generating Milestones...</span>
            {step !== 'project-plan' && step !== 'milestone' && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
          </div>
        </div>
      </div>
    </div>
  )
}
