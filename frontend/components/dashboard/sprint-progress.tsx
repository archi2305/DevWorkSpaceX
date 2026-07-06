'use client'

import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { ProgressBar } from '../ui/progress-bar'

export function SprintProgress() {
  const sprintStats = {
    name: 'Sprint 24',
    startDate: 'Mar 10',
    endDate: 'Mar 23',
    completed: 12,
    total: 18,
    velocity: 42,
  }

  const metrics = [
    { label: 'Completed', value: sprintStats.completed, max: sprintStats.total, color: 'success' as const },
    { label: 'Remaining', value: sprintStats.total - sprintStats.completed, max: sprintStats.total, color: 'warning' as const },
  ]

  const progressPercentage = Math.round((sprintStats.completed / sprintStats.total) * 100)

  return (
    <PremiumCard>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{sprintStats.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {sprintStats.startDate} — {sprintStats.endDate}
            </p>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-right"
          >
            <div className="text-3xl font-bold text-primary">{progressPercentage}%</div>
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
            value={sprintStats.completed}
            max={sprintStats.total}
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
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {metric.value}
                <span className="text-xs text-muted-foreground font-normal ml-1">/{metric.max}</span>
              </p>
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
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Team Velocity</p>
              <p className="mt-2 text-3xl font-bold text-primary">{sprintStats.velocity}</p>
              <p className="text-xs text-muted-foreground mt-1">Story points/sprint</p>
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
