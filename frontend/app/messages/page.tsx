'use client'

import React from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { MessageSquare } from 'lucide-react'

export default function MessagesPage() {
  return (
    <MainLayout>
      <div className="flex min-h-[70vh] flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.01] p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-white">No Messages Yet</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Connect with team members and start collaborating on active projects inside your workspace.
        </p>
      </div>
    </MainLayout>
  )
}
