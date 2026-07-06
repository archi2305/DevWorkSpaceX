'use client'

import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { AvatarGroup } from '../ui/avatar-group'

const teamMembers = [
  { initials: 'AR', name: 'Archi Dev' },
  { initials: 'SL', name: 'Sarah Lee' },
  { initials: 'JD', name: 'John Doe' },
  { initials: 'MC', name: 'Maria Chen' },
  { initials: 'DJ', name: 'David Jo' },
  { initials: 'ES', name: 'Emma Smith' },
]

const recentActivity = [
  { member: 'Sarah Lee', action: 'updated', target: 'Design System', time: '5 min ago' },
  { member: 'John Doe', action: 'reviewed', target: 'API Documentation', time: '23 min ago' },
  { member: 'Maria Chen', action: 'completed', target: 'Mobile Components', time: '1 hour ago' },
  { member: 'David Jo', action: 'started', target: 'Database Migration', time: '2 hours ago' },
]

export function TeamActivity() {
  return (
    <PremiumCard>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Team Activity</h2>
        <p className="text-sm text-muted-foreground">What your team is working on</p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Team Members</h3>
          <AvatarGroup avatars={teamMembers} max={6} />
          <p className="text-xs text-muted-foreground mt-2">{teamMembers.length} members online</p>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Recent Updates</h3>
          <div className="space-y-2">
            {recentActivity.map((activity, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium text-foreground">{activity.member}</span>
                    <span className="text-muted-foreground"> {activity.action} </span>
                    <span className="font-medium text-foreground">{activity.target}</span>
                  </p>
                </div>
                <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PremiumCard>
  )
}
