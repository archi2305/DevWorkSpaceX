'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useDashboardData } from '@/hooks/useDashboardData'

export function AISuggestions() {
  // Consume dashboard unified query
  const { data: dashboardData, isLoading, error } = useDashboardData()
  const suggestions = dashboardData?.aiSuggestions || []

  return (
    <PremiumCard className="relative overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl" />
      </div>

      <div className="space-y-5 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-sm"
          >
            <Sparkles className="h-5 w-5 text-primary" />
          </motion.div>
          <div>
            <h2 className="text-lg font-semibold text-foreground text-left">AI Suggestions</h2>
            <p className="text-xs text-muted-foreground mt-0.5 text-left">Smart recommendations for your workspace</p>
          </div>
        </motion.div>

        {isLoading ? (
          // Skeleton Loader
          <div className="space-y-3">
            {[1, 2].map((placeholder) => (
              <div key={placeholder} className="h-16 rounded-xl border border-white/5 bg-[#18181b]/30 p-4 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-sm text-red-400 p-4 border border-red-500/10 bg-red-500/5 rounded-lg">
            Failed to load AI suggestions.
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-white/5 rounded-xl bg-white/[0.005]">
            No Suggestions Available
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion, i) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-start justify-between rounded-xl border border-primary/20 bg-gradient-to-r from-primary/8 to-transparent p-4 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/12 hover:to-transparent transition-all duration-200 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                    <span className="text-lg group-hover:scale-110 transition-transform duration-200">{suggestion.icon}</span>
                    {suggestion.title}
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug text-left">{suggestion.description}</p>
                </div>
                <motion.button
                  whileHover={{ x: 6 }}
                  className="ml-3 flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors duration-200 whitespace-nowrap cursor-pointer"
                >
                  {suggestion.action}
                  <ArrowRight className="h-3 w-3" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          className="w-full rounded-xl border border-primary/30 bg-gradient-to-r from-primary/8 to-transparent px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/50 hover:shadow-md hover:shadow-primary/10 transition-all duration-200 cursor-pointer"
        >
          View all suggestions
        </motion.button>
      </div>
    </PremiumCard>
  )
}
