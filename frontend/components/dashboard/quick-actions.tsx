'use client'

import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { Plus, CheckSquare, FileText, Sparkles } from 'lucide-react'

const actions = [
  {
    id: 1,
    icon: Plus,
    label: 'Create Project',
    description: 'Start a new project',
  },
  {
    id: 2,
    icon: CheckSquare,
    label: 'Create Task',
    description: 'Add a new task',
  },
  {
    id: 3,
    icon: FileText,
    label: 'Generate Docs',
    description: 'Auto-generate documentation',
  },
  {
    id: 4,
    icon: Sparkles,
    label: 'Ask AI',
    description: 'Get AI assistance',
  },
]

export function QuickActions() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {actions.map((action, i) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative overflow-hidden rounded-xl border border-border bg-card p-4
                transition-all hover:border-primary hover:shadow-md
              `}
            >
              <motion.div
                className="absolute inset-0 bg-primary/5"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />

              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3"
                >
                  <Icon className="h-5 w-5 text-primary" />
                </motion.div>

                <p className="text-sm font-semibold text-foreground text-left">{action.label}</p>
                <p className="text-xs text-muted-foreground text-left mt-1">{action.description}</p>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
