'use client'

import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  color?: 'primary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
}

export function ProgressBar({
  value,
  max = 100,
  label,
  color = 'primary',
  size = 'md',
  showPercentage = true,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between gap-2">
        {label && <span className="text-sm font-medium text-foreground">{label}</span>}
        {showPercentage && <span className="text-sm text-muted-foreground">{Math.round(percentage)}%</span>}
      </div>

      <div className={`overflow-hidden rounded-full bg-muted ${sizeClasses[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-300`}
        />
      </div>
    </div>
  )
}
