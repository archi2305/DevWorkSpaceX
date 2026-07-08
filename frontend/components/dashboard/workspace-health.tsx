'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { Users, CheckCircle2, Briefcase } from 'lucide-react'
import { useDashboardData } from '@/hooks/useDashboardData'

export function WorkspaceHealth() {
  // Consume dashboard unified query
  const { data: dashboardData, isLoading, error } = useDashboardData()
  const metrics = dashboardData?.workspaceHealth

  const healthMetrics = [
    {
      id: 1,
      icon: Users,
      label: 'Team Members',
      value: metrics ? String(metrics.registered_users) : '0',
      change: 'Registered users',
      status: 'good',
    },
    {
      id: 2,
      icon: CheckCircle2,
      label: 'Tasks Completed',
      value: metrics ? String(metrics.completed_tasks) : '0',
      change: metrics ? `Pending: ${metrics.pending_tasks}` : '',
      status: 'good',
    },
    {
      id: 3,
      icon: Briefcase,
      label: 'Active Projects',
      value: metrics ? String(metrics.active_projects) : '0',
      change: metrics ? `Completion Rate: ${metrics.completion_rate}%` : 'On track',
      status: 'good',
    },
  ]

  return (
    <PremiumCard>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Workspace Health</h2>
        <p className="text-sm text-muted-foreground">Overview of your workspace</p>
      </div>

      {error ? (
        <div className="mt-6 text-sm text-red-400 p-4 border border-red-500/10 bg-red-500/5 rounded-lg">
          Failed to load dashboard metrics.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {healthMetrics.map((metric, i) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-lg border border-border/50 bg-gradient-to-br from-primary/5 to-transparent p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 + 0.1 }}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                  </motion.div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-200">
                    ✓
                  </span>
                </div>

                <p className="text-xs text-muted-foreground text-left">{metric.label}</p>
                {isLoading ? (
                  <div className="mt-2 h-7 bg-[#27272a] rounded w-12 animate-pulse" />
                ) : (
                  <p className="mt-1 text-2xl font-bold text-foreground text-left">{metric.value}</p>
                )}
                {isLoading ? (
                  <div className="mt-2 h-3 bg-[#27272a] rounded w-20 animate-pulse" />
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground text-left">{metric.change}</p>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </PremiumCard>
  )
}
