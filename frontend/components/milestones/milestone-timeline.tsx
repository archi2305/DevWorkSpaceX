'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { milestoneService, MilestoneStats } from '@/services/milestone'
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface MilestoneTimelineProps {
  milestoneId: string
}

export function MilestoneTimeline({ milestoneId }: MilestoneTimelineProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['milestone-stats', milestoneId],
    queryFn: () => milestoneService.getMilestoneStats(milestoneId)
  })

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Loading timeline...</div>
  }

  if (!stats) {
    return <div className="p-4 text-center text-muted-foreground">No timeline data available</div>
  }

  const getTimelineIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'Upcoming': return <Clock className="h-4 w-4 text-blue-500" />
      case 'Overdue': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Calendar className="h-4 w-4 text-gray-500" />
    }
  }

  const getTimelineStatus = (point: any) => {
    if (point.status === 'Completed') return 'Completed'
    if (point.date && new Date(point.date) < new Date()) return 'Overdue'
    return 'Upcoming'
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Timeline</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />
        
        {/* Timeline points */}
        <div className="space-y-6">
          {stats.timeline.map((point, index) => {
            const status = getTimelineStatus(point)
            return (
              <div key={index} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background border border-white/10">
                  {getTimelineIcon(status)}
                </div>
                
                {/* Timeline content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{point.label}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                      status === 'Overdue' ? 'bg-red-500/10 text-red-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {status}
                    </span>
                  </div>
                  {point.date && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(point.date), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress summary */}
      <div className="mt-6 p-4 rounded-lg border border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-muted-foreground">{stats.completion_percentage}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${stats.completion_percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{stats.completed_tasks} completed</span>
          <span>{stats.remaining_tasks} remaining</span>
        </div>
      </div>
    </div>
  )
}
