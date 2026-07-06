'use client'

import { motion } from 'framer-motion'
import React from 'react'

interface PremiumCardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  onClick?: () => void
  delay?: number
}

export function PremiumCard({
  children,
  className = '',
  hoverable = true,
  onClick,
  delay = 0,
}: PremiumCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={hoverable ? { scale: 1.02, y: -6 } : undefined}
      onClick={onClick}
      className={`
        relative rounded-2xl border border-border/50 bg-card p-6 text-card-foreground
        backdrop-blur-sm shadow-sm transition-all duration-300 ease-out
        dark:border-border/40 dark:shadow-md dark:shadow-primary/5
        ${hoverable ? 'cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 dark:hover:shadow-primary/15' : ''}
        ${className}
      `}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 pointer-events-none"
        style={hoverable ? { opacity: 'var(--tw-opacity)' } : {}}
      />
      {children}
    </motion.div>
  )
}
