'use client'

import { Sidebar } from './sidebar'
import { TopNav } from './top-nav'
import { FloatingAIPanel } from '@/components/ai/floating-panel'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopNav />
      <main className="ml-64 mt-20 p-6">{children}</main>
      <FloatingAIPanel />
    </div>
  )
}
