'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { Users, CheckCircle2, Briefcase } from 'lucide-react'
import { dashboardService, DashboardSummaryResponse } from '@/services/dashboard'

export function WorkspaceHealth() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await dashboardService.getSummary()
        setSummary(data)
      } catch (err: any) {
        setError('Failed to load dashboard metrics.')
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

  const healthMetrics = [
    {
      id: 1,
      icon: Users,
      label: 'Team Members',
      value: summary ? String(summary.team_members) : '0',
      change: 'Registered users',
      status: 'good',
    },
    {
      id: 2,
      icon: CheckCircle2,
      label: 'Tasks Completed',
      value: summary ? String(summary.completed_tasks) : '0',
      change: summary ? `Pending: ${summary.pending_tasks}` : '',
      status: 'good',
    },
    {
      id: 3,
      icon: Briefcase,
      label: 'Active Projects',
      value: summary ? String(summary.active_projects) : '0',
      change: 'On track',
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
          {error}
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

                <p className="text-xs text-muted-foreground">{metric.label}</p>
                {loading ? (
                  <div className="mt-2 h-7 bg-[#27272a] rounded w-12 animate-pulse" />
                ) : (
                  <p className="mt-1 text-2xl font-bold text-foreground">{metric.value}</p>
                )}
                {loading ? (
                  <div className="mt-2 h-3 bg-[#27272a] rounded w-20 animate-pulse" />
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">{metric.change}</p>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </PremiumCard>
  )
}
