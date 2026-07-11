'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { PremiumCard } from '../ui/premium-card'
import { ProgressBar } from '../ui/progress-bar'
import { milestoneService } from '@/services/milestone'
import { projectService } from '@/services/project'
import { taskService } from '@/services/task'
import { Award, Calendar, Loader, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export function MilestonesProgress() {
  // Load Projects
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects()
  })

  const targetProjectId = projects[0]?.id

  // Load Milestones
  const { data: milestones = [], isLoading: loadingMilestones } = useQuery({
    queryKey: ['milestones-dashboard', targetProjectId],
    queryFn: () => milestoneService.getMilestones(targetProjectId!, { is_archived: false }),
    enabled: !!targetProjectId
  })

  // Load Tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-dashboard', targetProjectId],
    queryFn: () => taskService.getTasks(targetProjectId!),
    enabled: !!targetProjectId
  })

  const activeMilestones = milestones.filter(m => m.status === 'Active' || m.status === 'Planned').slice(0, 3)

  return (
    <PremiumCard>
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#5BB98C]" />
            <h3 className="text-sm font-bold text-white">Active Milestones</h3>
          </div>
          <Link
            href="/milestones"
            className="text-[10px] font-bold text-[#5BB98C] hover:underline flex items-center gap-0.5"
          >
            Manage <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {(loadingProjects || loadingMilestones) ? (
          <div className="flex justify-center py-4"><Loader className="h-5 w-5 text-[#5BB98C] animate-spin" /></div>
        ) : activeMilestones.length === 0 ? (
          <p className="text-[11px] text-[#7E848C] italic py-2">No active milestones defined for the main project.</p>
        ) : (
          <div className="space-y-4">
            {activeMilestones.map((ms) => {
              const msTasks = tasks.filter(t => t.milestone_id === ms.id)
              const completedCount = msTasks.filter(t => t.completed).length
              const totalCount = msTasks.length
              const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

              return (
                <div key={ms.id} className="space-y-2 border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[180px]" title={ms.title}>{ms.title}</h4>
                      {ms.due_date && (
                        <span className="text-[9px] text-[#A7ADB5] flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3 text-[#5BB98C]" /> Target: {new Date(ms.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#5BB98C]">{percentage}%</span>
                  </div>

                  <ProgressBar
                    value={completedCount}
                    max={totalCount || 1}
                    showPercentage={false}
                    size="sm"
                    color="primary"
                  />
                  <div className="flex justify-between text-[9px] text-[#7E848C] font-semibold">
                    <span>{ms.status}</span>
                    <span>{completedCount}/{totalCount} Tasks Done</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PremiumCard>
  )
}
