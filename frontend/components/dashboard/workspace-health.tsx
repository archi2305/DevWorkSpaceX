'use client'

import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { Users, CheckCircle2, Briefcase } from 'lucide-react'

const healthMetrics = [
  {
    id: 1,
    icon: Users,
    label: 'Team Members',
    value: '6',
    change: '+2 this month',
    status: 'good',
  },
  {
    id: 2,
    icon: CheckCircle2,
    label: 'Tasks Completed',
    value: '43',
    change: '+8 this week',
    status: 'good',
  },
  {
    id: 3,
    icon: Briefcase,
    label: 'Active Projects',
    value: '4',
    change: 'On track',
    status: 'good',
  },
]

export function WorkspaceHealth() {
  return (
    <PremiumCard>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Workspace Health</h2>
        <p className="text-sm text-muted-foreground">Overview of your workspace</p>
      </div>

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
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                  {metric.status === 'good' ? '✓' : '!'}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{metric.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{metric.change}</p>
            </motion.div>
          )
        })}
      </div>
    </PremiumCard>
  )
}
