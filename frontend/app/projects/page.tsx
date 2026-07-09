'use client'

import React from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { ContinueWorking } from '@/components/dashboard/continue-working'

export default function ProjectsListingPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <ContinueWorking />
      </div>
    </MainLayout>
  )
}
