'use client'

import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { AnimatedBadge } from '../ui/animated-badge'
import { ChevronRight } from 'lucide-react'

const projects = [
  {
    id: 1,
    name: 'E-Commerce Platform',
    status: 'In Progress',
    progress: 65,
    team: ['AR', 'JD', 'SL'],
  },
  {
    id: 2,
    name: 'Mobile App Redesign',
    status: 'In Progress',
    progress: 42,
    team: ['AR', 'ES'],
  },
  {
    id: 3,
    name: 'Design System v2',
    status: 'Review',
    progress: 88,
    team: ['AR', 'MC', 'DJ', 'SL'],
  },
  {
    id: 4,
    name: 'API Documentation',
    status: 'Pending',
    progress: 20,
    team: ['JD'],
  },
]

export function ContinueWorking() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Continue Where You Left Off</h2>
          <p className="text-sm text-muted-foreground mt-1">Your active projects and latest updates</p>
        </div>
        <motion.button
          whileHover={{ x: 4 }}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View all <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 + i * 0.08, duration: 0.5 }}
            className="flex-shrink-0 w-80"
          >
            <PremiumCard hoverable>
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-base">{project.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">Assigned to you</p>
                  </div>
                  <AnimatedBadge variant="success">{project.status}</AnimatedBadge>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Progress</span>
                    <span className="text-sm font-bold text-primary">{project.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden shadow-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{ duration: 1.2, delay: 0.55 + i * 0.08, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full shadow-lg shadow-primary/30"
                    />
                  </div>
                </motion.div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex -space-x-2">
                    {project.team.slice(0, 2).map((member) => (
                      <motion.div
                        key={member}
                        whileHover={{ scale: 1.15, zIndex: 10 }}
                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-gradient-to-br from-primary/30 to-primary/10 text-xs font-bold text-primary shadow-sm"
                      >
                        {member}
                      </motion.div>
                    ))}
                    {project.team.length > 2 && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-bold text-muted-foreground shadow-sm">
                        +{project.team.length - 2}
                      </div>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-all duration-200"
                  >
                    Open
                  </motion.button>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
