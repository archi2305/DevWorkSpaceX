'use client'

import { motion } from 'framer-motion'
import React from 'react'

interface TimelineItemProps {
  icon?: React.ReactNode
  title: string
  description?: string
  timestamp: string
  isFirst?: boolean
  isLast?: boolean
}

export function TimelineItem({
  icon,
  title,
  description,
  timestamp,
  isFirst,
  isLast,
}: TimelineItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex gap-4 pb-6"
    >
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`
            flex h-10 w-10 items-center justify-center rounded-full border-2
            ${
              icon
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-muted text-muted-foreground'
            }
          `}
        >
          {icon || '•'}
        </motion.div>
        {!isLast && (
          <div className="mt-2 h-12 w-0.5 bg-gradient-to-b from-border to-transparent" />
        )}
      </div>

      <div className="flex-1 pt-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <span className="whitespace-nowrap text-xs text-muted-foreground">{timestamp}</span>
        </div>
      </div>
    </motion.div>
  )
}
