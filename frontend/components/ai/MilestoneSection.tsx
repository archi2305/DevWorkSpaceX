'use client'

import React from 'react'
import { Activity, CheckCircle2 } from 'lucide-react'
import { MilestonePlanResponse } from '@/services/ai'

interface MilestoneSectionProps {
  milestones: string[]
  milestonePlan: MilestonePlanResponse | null
}

export function MilestoneSection({ milestones, milestonePlan }: MilestoneSectionProps) {
  return (
    <div className="space-y-4 text-left">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Activity className="h-4.5 w-4.5 text-primary" /> Milestones
      </h3>
      <div className="relative border-l border-white/10 pl-6 ml-4 space-y-6">
        {milestones.map((m, idx) => (
          <div key={idx} className="relative">
            <span className="absolute -left-[34px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 border border-primary/40 text-xs font-bold text-primary">
              {idx + 1}
            </span>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">{m}</h4>
              {idx === 0 && milestonePlan && (
                <div className="mt-2 p-4 rounded-xl border border-white/5 bg-white/[0.005] max-w-3xl space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{milestonePlan.overview}</p>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Subtasks Detail</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {milestonePlan.subtasks?.map((st, sIdx) => (
                        <div key={sIdx} className="p-3 rounded-lg bg-white/[0.01] border border-white/5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">{st.title}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{st.priority}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{st.description}</p>
                          <span className="text-[9px] text-muted-foreground block">{st.estimated_hours} Hours</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
