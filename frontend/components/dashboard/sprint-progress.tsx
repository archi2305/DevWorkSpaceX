'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { ProgressBar } from '../ui/progress-bar'
import { useDashboardData } from '@/hooks/useDashboardData'

export function SprintProgress() {
  // Consume dashboard unified query
  const { data: dashboardData, isLoading, error } = useDashboardData()
  const sprint = dashboardData?.sprint

  const getFormattedDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch (e) {
      return ''
    }
  }

  const completed = sprint?.completed_tasks || 0
  const total = sprint?.total_tasks || 0
  const velocity = sprint?.velocity || 0
  const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0

  const metrics = [
    { label: 'Completed', value: completed, max: total, color: 'success' as const },
    { label: 'Remaining', value: total - completed, max: total, color: 'warning' as const },
  ]

  return (
    <PremiumCard>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            {isLoading ? (
              <div className="h-6 bg-[#18181b]/30 rounded w-24 animate-pulse" />
            ) : (
              <h2 className="text-lg font-semibold text-foreground text-left">{sprint?.name || 'Active Sprint'}</h2>
            )}
            {isLoading ? (
              <div className="h-4 bg-[#18181b]/30 rounded w-32 mt-2 animate-pulse" />
            ) : (
              <p className="text-sm text-muted-foreground mt-1 text-left">
                {sprint ? `${getFormattedDate(sprint.start_date)} — ${getFormattedDate(sprint.end_date)}` : 'Sprints cycle dates'}
              </p>
            )}
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-right"
          >
            {isLoading ? (
              <div className="h-8 bg-[#18181b]/30 rounded w-16 animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-primary">{progressPercentage}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Complete</p>
          </motion.div>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="origin-left"
        >
          <ProgressBar
            value={completed}
            max={total || 1}
            showPercentage={false}
            size="lg"
            color="primary"
          />
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.1, duration: 0.4 }}
              className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/8 to-transparent p-4 hover:border-primary/40 transition-all duration-200"
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-left">{metric.label}</p>
              {isLoading ? (
                <div className="h-8 bg-[#18181b]/30 rounded w-12 mt-2 animate-pulse" />
              ) : (
                <p className="mt-2 text-2xl font-bold text-foreground text-left">
                  {metric.value}
                  <span className="text-xs text-muted-foreground font-normal ml-1">/{metric.max}</span>
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/12 to-primary/5 p-5 hover:border-primary/50 hover:shadow-md hover:shadow-primary/10 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-left">Team Velocity</p>
              {isLoading ? (
                <div className="h-9 bg-[#18181b]/30 rounded w-16 mt-2 animate-pulse" />
              ) : (
                <p className="mt-2 text-3xl font-bold text-primary text-left">{velocity}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1 text-left">Story points/sprint</p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl"
            >
              📈
            </motion.div>
          </div>
        </motion.div>
      </div>
    </PremiumCard>
  )
}
