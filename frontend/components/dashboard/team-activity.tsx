'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { AvatarGroup } from '../ui/avatar-group'
import { useDashboardData } from '@/hooks/useDashboardData'

export function TeamActivity() {
  // Consume dashboard unified query
  const { data: dashboardData, isLoading, error } = useDashboardData()
  const teamMembers = dashboardData?.teamMembers || []
  const recentActivities = dashboardData?.recentActivities || []

  const getRelativeTime = (isoString: string) => {
    try {
      const now = new Date()
      const past = new Date(isoString)
      const diffMs = now.getTime() - past.getTime()
      
      const diffMins = Math.floor(diffMs / (60 * 1000))
      const diffHours = Math.floor(diffMs / (60 * 60 * 1000))
      
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} min ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      return past.toLocaleDateString()
    } catch (e) {
      return 'Some time ago'
    }
  }

  const onlineCount = teamMembers.filter((m) => m.is_online).length

  return (
    <PremiumCard>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground text-left">Team Activity</h2>
        <p className="text-sm text-muted-foreground text-left">What your team is working on</p>
      </div>

      {isLoading ? (
        // Skeleton Loader
        <div className="mt-6 space-y-4">
          <div className="h-10 bg-[#18181b]/30 rounded-lg animate-pulse" />
          <div className="h-16 bg-[#18181b]/30 rounded-lg animate-pulse" />
        </div>
      ) : error ? (
        <div className="mt-6 text-sm text-red-400 p-4 border border-red-500/10 bg-red-500/5 rounded-lg">
          Failed to load team activity logs.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3 text-left">Team Members</h3>
            <AvatarGroup avatars={teamMembers} max={6} />
            <p className="text-xs text-muted-foreground mt-2 text-left">{onlineCount} member{onlineCount > 1 ? 's' : ''} online</p>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-foreground mb-3 text-left">Recent Updates</h3>
            {recentActivities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">No updates recorded</p>
            ) : (
              <div className="space-y-2">
                {recentActivities.slice(0, 4).map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-left truncate">
                        <span className="font-medium text-foreground">Workspace </span>
                        <span className="text-muted-foreground"> {activity.action.toLowerCase()} </span>
                        <span className="font-medium text-foreground">{activity.target_name || ''}</span>
                      </p>
                    </div>
                    <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">
                      {getRelativeTime(activity.created_at)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PremiumCard>
  )
}
