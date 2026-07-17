'use client'

import React, { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { quickActionService } from '@/services/quick-action'
import { Zap, Database, CheckSquare, Trash2, CheckCircle } from 'lucide-react'

export default function QuickActionsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleSeed = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await quickActionService.seedWorkspace()
      setResult(`${res.message} Generated Project ID: ${res.project_id}. Seeded ${res.tasks_seeded} tasks.`)
    } catch (err) {
      console.error(err)
      setResult('Failed to seed workspace.')
    } finally {
      setLoading(false)
    }
  }

  const handleMacro = async (macroName: string) => {
    setLoading(true)
    setResult(null)
    try {
      const res = await quickActionService.triggerMacro(macroName)
      setResult(`${res.message} Actions run: ${res.actions_run.join(', ')}`)
    } catch (err) {
      console.error(err)
      setResult('Failed to run macro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-primary/10 via-card/50 to-primary/5 p-6 md:p-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">Quick Actions & Diagnostics</h1>
            <p className="text-sm text-muted-foreground">
              Run database macros, trigger automations, or quickly seed workspace test items.
            </p>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Seed Workspace Card */}
          <div className="p-6 rounded-2xl border border-white/5 bg-[#171a1d]/60 backdrop-blur-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-white">Seed Test Data</h3>
              <p className="text-xs text-muted-foreground">
                Populates the workspace with a sample project, 5 testing tasks, and 1 milestone.
              </p>
            </div>
            <button
              onClick={handleSeed}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all"
            >
              {loading ? 'Running...' : 'Seed Data'}
            </button>
          </div>

          {/* Mark All Done Card */}
          <div className="p-6 rounded-2xl border border-white/5 bg-[#171a1d]/60 backdrop-blur-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-white">Complete All Tasks</h3>
              <p className="text-xs text-muted-foreground">
                Sets the status of all your assigned active tasks to 'Completed' ('Done').
              </p>
            </div>
            <button
              onClick={() => handleMacro('mark_all_done')}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-sm transition-all"
            >
              {loading ? 'Running...' : 'Run Macro'}
            </button>
          </div>

          {/* Clear Empty Card */}
          <div className="p-6 rounded-2xl border border-white/5 bg-[#171a1d]/60 backdrop-blur-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Trash2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-white">Prune Empty Projects</h3>
              <p className="text-xs text-muted-foreground">
                Deletes all empty projects owned by you that do not contain any tasks.
              </p>
            </div>
            <button
              onClick={() => handleMacro('clear_empty_projects')}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-sm transition-all"
            >
              {loading ? 'Running...' : 'Run Macro'}
            </button>
          </div>
        </div>

        {/* Result log */}
        {result && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-2.5 text-sm text-white">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Log Status:</span>
              <p className="text-muted-foreground mt-1 font-mono text-xs">{result}</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
