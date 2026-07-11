'use client'

import { motion } from 'framer-motion'
import { MainLayout } from '@/components/layout/main-layout'
import { ContinueWorking } from '@/components/dashboard/continue-working'
import { AISuggestions } from '@/components/dashboard/ai-suggestions'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks'
import { SprintProgress } from '@/components/dashboard/sprint-progress'
import { MilestonesProgress } from '@/components/dashboard/milestones-progress'
import { TeamActivity } from '@/components/dashboard/team-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { WorkspaceHealth } from '@/components/dashboard/workspace-health'
import { useAuth } from '@/hooks/useAuth'
import { useDashboardData } from '@/hooks/useDashboardData'

export default function Page() {
  const { user, isLoading: authLoading } = useAuth()
  // Mount unified dashboard React Query fetcher
  const { data: dashboardData, isLoading: dashLoading } = useDashboardData()
  
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  const displayName = dashboardData?.user?.full_name || user?.full_name || 'Engineer'

  return (
    <MainLayout>
      {/* Premium Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 right-40 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl float-animation-1" />
        <div className="absolute bottom-40 left-20 w-72 h-72 bg-gradient-to-tr from-primary/8 to-transparent rounded-full blur-3xl float-animation-2" />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-gradient-to-b from-secondary/5 to-transparent rounded-full blur-3xl opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="space-y-6"
        >
          <div className="space-y-3">
            <h1 className="text-5xl font-bold text-foreground tracking-tight">
              {greeting}, {displayName} 👋
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Welcome back. Here&apos;s what&apos;s happening in your workspace.
            </p>
          </div>

          {/* Hero Search */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/8 via-card to-primary/5 p-4 shadow-sm hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 transition-all duration-300"
          >
            <span className="text-2xl">✨</span>
            <input
              type="text"
              placeholder="Ask AI to help you..."
              className="flex-1 bg-transparent text-base placeholder-muted-foreground outline-none text-foreground"
            />
            <kbd className="rounded-lg bg-muted/80 px-2 py-1 text-xs font-semibold text-muted-foreground">
              ⌘↵
            </kbd>
          </motion.div>
        </motion.div>

        {/* Suggestion Chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-2 flex-wrap"
        >
          {['Create new project', 'Review pull requests', 'Check team updates'].map((chip, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="rounded-full border border-primary/20 bg-gradient-to-r from-primary/8 to-primary/5 px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:shadow-md hover:shadow-primary/15 transition-all duration-200"
            >
              {chip}
            </motion.button>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="space-y-8">
          {/* Continue Working */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ContinueWorking />
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-8"
            >
              <AISuggestions />
              <RecentActivity />
            </motion.div>

            {/* Right Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-8"
            >
              <UpcomingTasks />
              <SprintProgress />
              <MilestonesProgress />
            </motion.div>
          </div>

          {/* Team and Health */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <TeamActivity />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <WorkspaceHealth />
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <QuickActions />
          </motion.div>
        </div>
      </div>
    </MainLayout>
  )
}
