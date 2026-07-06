'use client'

import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { Sparkles, ArrowRight } from 'lucide-react'

export function AISuggestions() {
  const suggestions = [
    {
      id: 1,
      title: 'Optimize Database Queries',
      description: 'Your recent queries could benefit from indexing. I found 3 slow queries.',
      action: 'Review',
      icon: '⚡',
    },
    {
      id: 2,
      title: 'Update Dependencies',
      description: 'New versions available for 5 packages. Security updates included.',
      action: 'Update',
      icon: '📦',
    },
  ]

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
            <h2 className="text-lg font-semibold text-foreground">AI Suggestions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Smart recommendations for your workspace</p>
          </div>
        </motion.div>

        <div className="space-y-3">
          {suggestions.map((suggestion, i) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
              className="flex items-start justify-between rounded-xl border border-primary/20 bg-gradient-to-r from-primary/8 to-transparent p-4 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/12 hover:to-transparent transition-all duration-200 group"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                  <span className="text-lg group-hover:scale-110 transition-transform duration-200">{suggestion.icon}</span>
                  {suggestion.title}
                </div>
                <p className="text-sm text-muted-foreground leading-snug">{suggestion.description}</p>
              </div>
              <motion.button
                whileHover={{ x: 6 }}
                className="ml-3 flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors duration-200 whitespace-nowrap"
              >
                {suggestion.action}
                <ArrowRight className="h-3 w-3" />
              </motion.button>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          className="w-full rounded-xl border border-primary/30 bg-gradient-to-r from-primary/8 to-transparent px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/50 hover:shadow-md hover:shadow-primary/10 transition-all duration-200"
        >
          View all suggestions
        </motion.button>
      </div>
    </PremiumCard>
  )
}
