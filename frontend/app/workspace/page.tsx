'use client'

import React from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Briefcase, Settings } from 'lucide-react'
import { ExportDialog } from '@/components/export/export-dialog'

export default function WorkspacePage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Workspace</h1>
              <p className="text-sm text-muted-foreground">Manage your workspace settings and data</p>
            </div>
          </div>
          <ExportDialog />
        </div>

        {/* Workspace Overview Card */}
        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.01] p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Workspace Overview</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Overview of configuration options, active integrations, and shared repositories.
            Use the Export button to download your workspace data in various formats.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
            <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="text-2xl font-bold text-primary mb-1">Export</div>
              <div className="text-xs text-muted-foreground">Download workspace data</div>
            </div>
            <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="text-2xl font-bold text-primary mb-1">JSON</div>
              <div className="text-xs text-muted-foreground">Structured data format</div>
            </div>
            <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="text-2xl font-bold text-primary mb-1">Excel</div>
              <div className="text-xs text-muted-foreground">Spreadsheet format</div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
