'use client'

import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { TimelineItem } from '../ui/timeline-item'
import { FileText, MessageCircle, Users, GitBranch, Zap } from 'lucide-react'

const activities = [
  {
    icon: <FileText className="h-4 w-4" />,
    title: 'Created project milestone',
    description: 'Milestone v1.2.0 added to E-Commerce Platform',
    timestamp: '2 hours ago',
  },
  {
    icon: <MessageCircle className="h-4 w-4" />,
    title: 'New comment on design proposal',
    description: 'Sarah commented on your design mockups',
    timestamp: '4 hours ago',
  },
  {
    icon: <Users className="h-4 w-4" />,
    title: 'Team member invited',
    description: 'John Doe was added to your workspace',
    timestamp: '1 day ago',
  },
  {
    icon: <GitBranch className="h-4 w-4" />,
    title: 'Code pushed to main branch',
    description: 'API improvements in E-Commerce Platform',
    timestamp: '2 days ago',
  },
  {
    icon: <Zap className="h-4 w-4" />,
    title: 'Performance improvements deployed',
    description: 'Database query optimizations go live',
    timestamp: '3 days ago',
  },
]

export function RecentActivity() {
  return (
    <PremiumCard>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Recent Workspace Activity</h2>
        <p className="text-sm text-muted-foreground">Latest updates from your team</p>
      </div>

      <div className="mt-6 space-y-0">
        {activities.map((activity, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <TimelineItem
              icon={activity.icon}
              title={activity.title}
              description={activity.description}
              timestamp={activity.timestamp}
              isLast={i === activities.length - 1}
            />
          </motion.div>
        ))}
      </div>
    </PremiumCard>
  )
}
