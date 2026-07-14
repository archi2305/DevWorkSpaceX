'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { TopNav } from './top-nav'
import { FloatingAIPanel } from '@/components/ai/floating-panel'
import { CommandPalette } from '@/components/search/command-palette'
import { NotificationCenter } from '@/components/notifications/notification-center'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopNav onNotificationClick={() => setIsNotificationOpen(true)} />
      <main className="ml-64 mt-20 p-6">{children}</main>
      <FloatingAIPanel />
      <CommandPalette />
      <NotificationCenter 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
      />
    </div>
  )
}
