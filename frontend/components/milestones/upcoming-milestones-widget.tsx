'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { milestoneService, MilestoneStats } from '@/services/milestone'
import { Calendar, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export function UpcomingMilestonesWidget() {
  const { data: milestones, isLoading } = useQuery({
    queryKey: ['upcoming-milestones'],
    queryFn: () => milestoneService.getUpcomingMilestones(5),
    refetchInterval: 60000 // Refetch every minute
  })

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const getDaysRemaining = (dueDate: string | null) => {
    if (!dueDate) return null
    const diff = new Date(dueDate).getTime() - new Date().getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  if (isLoading) {
    return (
      <div className="p-6 rounded-lg border border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Upcoming Milestones</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!milestones || milestones.length === 0) {
    return (
      <div className="p-6 rounded-lg border border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Upcoming Milestones</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No upcoming milestones</p>
          <p className="text-sm mt-1">Create milestones to track your project progress</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-lg border border-white/5 bg-white/[0.02]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Upcoming Milestones</h3>
        <Link href="/milestones" className="text-sm text-primary hover:underline flex items-center">
          View all
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      <div className="space-y-3">
        {milestones.map((milestone) => {
          const overdue = isOverdue(milestone.due_date)
          const daysRemaining = getDaysRemaining(milestone.due_date)
          
          return (
            <div
              key={milestone.milestone_id}
              className="p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{milestone.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {milestone.due_date && (
                      <div className={`flex items-center gap-1 ${overdue ? 'text-red-400' : ''}`}>
                        {overdue ? (
                          <AlertCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {overdue ? 'Overdue' : daysRemaining !== null && daysRemaining < 0 ? 'Due today' : `${Math.abs(daysRemaining || 0)} days ${daysRemaining !== null && daysRemaining < 0 ? 'ago' : 'remaining'}`}
                      </div>
                    )}
                    <span>•</span>
                    <span>{milestone.total_tasks} tasks</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{milestone.completion_percentage}%</div>
                  <div className="text-xs text-muted-foreground">
                    {milestone.completed_tasks}/{milestone.total_tasks}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${overdue ? 'bg-red-500' : 'bg-primary'}`}
                  style={{ width: `${milestone.completion_percentage}%` }}
                />
              </div>

              {/* Status badge */}
              <div className="mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  milestone.status === 'Active' ? 'bg-blue-500/10 text-blue-400' :
                  milestone.status === 'Planned' ? 'bg-gray-500/10 text-gray-400' :
                  'bg-green-500/10 text-green-400'
                }`}>
                  {milestone.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
