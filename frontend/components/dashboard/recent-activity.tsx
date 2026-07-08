'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { TimelineItem } from '../ui/timeline-item'
import { FileText, MessageCircle, Users, GitBranch, Zap, CheckSquare } from 'lucide-react'
import { useDashboardData } from '@/hooks/useDashboardData'

export function RecentActivity() {
  // Consume dashboard unified query
  const { data: dashboardData, isLoading, error } = useDashboardData()
  const activities = dashboardData?.recentActivities || []

  const getIcon = (targetType: string | null) => {
    switch (targetType?.toLowerCase()) {
      case 'project':
        return <FileText className="h-4 w-4" />
      case 'task':
        return <CheckSquare className="h-4 w-4" />
      case 'code':
        return <GitBranch className="h-4 w-4" />
      case 'user':
        return <Users className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  const getRelativeTime = (isoString: string) => {
    try {
      const now = new Date()
      const past = new Date(isoString)
      const diffMs = now.getTime() - past.getTime()
      
      const diffMins = Math.floor(diffMs / (60 * 1000))
      const diffHours = Math.floor(diffMs / (60 * 60 * 1000))
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
      
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} min ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } catch (e) {
      return 'Some time ago'
    }
  }

  return (
    <PremiumCard>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground text-left">Recent Workspace Activity</h2>
        <p className="text-sm text-muted-foreground text-left">Latest updates from your team</p>
      </div>

      {isLoading ? (
        // Skeleton Loader
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((placeholder) => (
            <div key={placeholder} className="h-10 bg-[#18181b]/30 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 text-sm text-red-400 p-4 border border-red-500/10 bg-red-500/5 rounded-lg">
          Failed to load workspace activities.
        </div>
      ) : activities.length === 0 ? (
        <div className="mt-6 text-center py-6 text-xs text-muted-foreground border border-dashed border-white/5 rounded-xl bg-white/[0.005]">
          No Recent Activity
        </div>
      ) : (
        <div className="mt-6 space-y-0">
          {activities.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <TimelineItem
                icon={getIcon(activity.target_type)}
                title={activity.action}
                description={activity.details}
                timestamp={getRelativeTime(activity.created_at)}
                isLast={i === activities.length - 1}
              />
            </motion.div>
          ))}
        </div>
      )}
    </PremiumCard>
  )
}
