'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Bell, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/hooks/useAuth'

export function TopNav() {
  const { theme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const userInitials = user ? getInitials(user.full_name) : 'U'

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed right-0 top-0 left-64 z-30 border-b border-border bg-card/80 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        {/* Search */}
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="flex-1"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search... (⌘K)"
              className={`
                w-full rounded-lg border border-input bg-background/50 pl-10 pr-4 py-2.5
                text-sm placeholder-muted-foreground transition-all
                focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20
              `}
            />
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              inline-flex items-center gap-2 rounded-lg border border-input px-3 py-2.5
              text-sm font-medium text-foreground transition-all
              hover:border-primary hover:bg-primary/5
            `}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            className="relative rounded-lg p-2.5 hover:bg-muted transition-colors"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          </motion.button>

          {isMounted && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg p-2.5 hover:bg-muted transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground" />
              )}
            </motion.button>
          )}

          {user?.profile_image ? (
            <img
              src={user.profile_image}
              alt={user.full_name}
              className="ml-2 h-9 w-9 rounded-full object-cover cursor-pointer hover:scale-105 transition-transform"
            />
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground cursor-pointer"
            >
              {userInitials}
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  )
}
