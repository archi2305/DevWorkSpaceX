'use client'

import { motion } from 'framer-motion'

interface AvatarGroupProps {
  avatars: Array<{
    src?: string
    initials: string
    name: string
  }>
  max?: number
}

export function AvatarGroup({ avatars, max = 3 }: AvatarGroupProps) {
  const displayed = avatars.slice(0, max)
  const remaining = Math.max(0, avatars.length - max)

  return (
    <div className="flex items-center -space-x-2">
      {displayed.map((avatar, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="relative"
        >
          <div
            className={`
              flex h-8 w-8 items-center justify-center rounded-full border-2 border-background
              bg-primary text-xs font-semibold text-primary-foreground
              dark:border-card
            `}
            title={avatar.name}
          >
            {avatar.src ? (
              <img src={avatar.src} alt={avatar.name} className="h-full w-full rounded-full object-cover" />
            ) : (
              avatar.initials
            )}
          </div>
        </motion.div>
      ))}
      {remaining > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`
            flex h-8 w-8 items-center justify-center rounded-full border-2 border-background
            bg-muted text-xs font-semibold text-muted-foreground
            dark:border-card
          `}
          title={`+${remaining} more`}
        >
          +{remaining}
        </motion.div>
      )}
    </div>
  )
}
