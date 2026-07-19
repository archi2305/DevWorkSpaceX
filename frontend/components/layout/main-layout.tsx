'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { TopNav } from './top-nav'
import { FloatingAIPanel } from '@/components/ai/floating-panel'
import { CommandPalette } from '@/components/search/command-palette'
import { NotificationCenter } from '@/components/notifications/notification-center'

import { InteractiveBackground } from '@/components/ui/InteractiveBackground'
import { motion } from 'framer-motion'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <InteractiveBackground />
      <Sidebar />
      <TopNav onNotificationClick={() => setIsNotificationOpen(true)} />
      <main className="ml-64 mt-20 p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>
      <FloatingAIPanel />
      <CommandPalette />
      <NotificationCenter 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
      />
    </div>
  )
}
