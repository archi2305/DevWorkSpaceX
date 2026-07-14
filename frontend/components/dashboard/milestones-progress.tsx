'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Award, Calendar, ChevronRight, Loader } from 'lucide-react'
import { milestoneService } from '@/services/milestone'
import { PremiumCard } from '../ui/premium-card'
import { ProgressBar } from '../ui/progress-bar'

function formatDate(value: string | null) {
  if (!value) return 'No due date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No due date'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function MilestonesProgress() {
  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['upcoming-milestones'],
    queryFn: () => milestoneService.getUpcomingMilestones(5),
  })

  return (
    <PremiumCard>
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#5BB98C]" />
            <h3 className="text-sm font-bold text-white">Upcoming Milestones</h3>
          </div>
          <Link href="/milestones" className="flex items-center gap-0.5 text-[10px] font-bold text-[#5BB98C] hover:underline">
            Manage <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader className="h-5 w-5 animate-spin text-[#5BB98C]" />
          </div>
        ) : milestones.length === 0 ? (
          <p className="py-2 text-[11px] italic text-[#7E848C]">No upcoming milestones.</p>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div key={milestone.milestone_id} className="space-y-2 border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="max-w-[220px] truncate text-xs font-bold text-white" title={milestone.title}>
                      {milestone.title}
                    </h4>
                    <span className="mt-0.5 flex items-center gap-1 text-[9px] text-[#A7ADB5]">
                      <Calendar className="h-3 w-3 text-[#5BB98C]" /> {formatDate(milestone.due_date)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#5BB98C]">{Math.round(milestone.completion_percentage)}%</span>
                </div>

                <ProgressBar value={milestone.completed_tasks} max={milestone.total_tasks || 1} showPercentage={false} size="sm" color="primary" />
                <div className="flex justify-between text-[9px] font-semibold text-[#7E848C]">
                  <span>{milestone.status}</span>
                  <span>{milestone.completed_tasks}/{milestone.total_tasks} Tasks Done</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PremiumCard>
  )
}
