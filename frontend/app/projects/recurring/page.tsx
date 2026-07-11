'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Repeat,
  Play,
  Pause,
  SkipForward,
  Clock,
  Plus,
  Loader,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react'
import { recurringTaskService, RecurringTask } from '@/services/recurring-task'
import { projectService } from '@/services/project'

export default function RecurringTasksPage() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [pattern, setPattern] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Custom'>('Daily')
  const [interval, setInterval] = useState(1)
  const [nextRun, setNextRun] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [activeHistoryTaskId, setActiveHistoryTaskId] = useState<string | null>(null)

  // 1. Fetch Datasets
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['recurring-tasks-configs'],
    queryFn: recurringTaskService.getRecurringTasks
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects()
  })

  const { data: historyLogs = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['recurring-task-history', activeHistoryTaskId],
    queryFn: () => recurringTaskService.getHistory(activeHistoryTaskId!),
    enabled: !!activeHistoryTaskId
  })

  // 2. Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => recurringTaskService.createRecurringTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks-configs'] })
      setTitle('')
      setDesc('')
    }
  })

  const pauseMutation = useMutation({
    mutationFn: (id: string) => recurringTaskService.pauseRecurrence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks-configs'] })
    }
  })

  const resumeMutation = useMutation({
    mutationFn: (id: string) => recurringTaskService.resumeRecurrence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks-configs'] })
    }
  })

  const skipMutation = useMutation({
    mutationFn: (id: string) => recurringTaskService.skipRecurrence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks-configs'] })
    }
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !nextRun) return

    createMutation.mutate({
      title,
      description: desc || undefined,
      recurrence_pattern: pattern,
      recurrence_interval: interval,
      next_run_at: new Date(nextRun).toISOString(),
      project_id: selectedProjectId || undefined
    })
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 text-left">
        
        {/* Header Section */}
        <div className="border-b border-white/[0.06] pb-5">
          <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
            <Repeat className="h-6 w-6 text-[#5BB98C]" /> Recurring Schedules
          </h1>
          <p className="text-xs text-[#A7ADB5] mt-1">Configure automated task creation rules, pause schedules, skip runs, and monitor logs synced to calendar timelines.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Side */}
          <div className="space-y-6">
            <div className="border border-white/[0.06] bg-[#171A1D] rounded-2xl p-5 space-y-4 shadow-md">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#5BB98C]" /> Create Recurrence Rule
              </h3>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#A7ADB5] font-bold uppercase block">Task Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Generate Weekly Release Report"
                    className="w-full bg-[#121416] border border-white/[0.08] text-white px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#5BB98C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#A7ADB5] font-bold uppercase block">Description</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Provide auto-generated details..."
                    className="w-full bg-[#121416] border border-white/[0.08] text-white px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#5BB98C] h-16 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#A7ADB5] font-bold uppercase block">Project Context</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-[#121416] border border-white/[0.08] text-white px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#5BB98C]"
                  >
                    <option value="">No Project Linkage</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#A7ADB5] font-bold uppercase block">Pattern</label>
                    <select
                      value={pattern}
                      onChange={(e) => setPattern(e.target.value as any)}
                      className="w-full bg-[#121416] border border-white/[0.08] text-white px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#5BB98C]"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#A7ADB5] font-bold uppercase block">Interval</label>
                    <input
                      type="number"
                      min={1}
                      value={interval}
                      onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#121416] border border-white/[0.08] text-white px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#5BB98C]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#A7ADB5] font-bold uppercase block">First Execution Run</label>
                  <input
                    type="datetime-local"
                    required
                    value={nextRun}
                    onChange={(e) => setNextRun(e.target.value)}
                    className="w-full bg-[#121416] border border-white/[0.08] text-white px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#5BB98C]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold py-2.5 text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  Create Schedule
                </button>
              </form>
            </div>
          </div>

          {/* List side */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="border border-white/[0.06] bg-[#171A1D] rounded-2xl p-5 space-y-4 shadow-md">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Recurrences</h3>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader className="h-5 w-5 text-[#5BB98C] animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {configs.map((cf) => (
                    <div key={cf.id} className="py-4 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-xs font-bold text-white block">{cf.title}</span>
                          <span className="text-[10px] text-[#A7ADB5] block mt-0.5">
                            Pattern: <strong className="text-white">{cf.recurrence_pattern} (every {cf.recurrence_interval} step)</strong> • Next: <strong className="text-white">{new Date(cf.next_run_at).toLocaleString()}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {cf.is_active ? (
                            <button
                              onClick={() => pauseMutation.mutate(cf.id)}
                              className="p-1.5 rounded-lg border border-white/[0.08] hover:bg-white/5 text-yellow-400 transition-colors cursor-pointer"
                              title="Pause scheduling"
                            >
                              <Pause className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => resumeMutation.mutate(cf.id)}
                              className="p-1.5 rounded-lg border border-white/[0.08] hover:bg-white/5 text-green-400 transition-colors cursor-pointer"
                              title="Resume scheduling"
                            >
                              <Play className="h-3.5 w-3.5 animate-pulse" />
                            </button>
                          )}
                          <button
                            onClick={() => skipMutation.mutate(cf.id)}
                            className="p-1.5 rounded-lg border border-white/[0.08] hover:bg-white/5 text-blue-400 transition-colors cursor-pointer"
                            title="Skip next cycle"
                          >
                            <SkipForward className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setActiveHistoryTaskId(cf.id)}
                            className="p-1.5 rounded-lg border border-white/[0.08] hover:bg-white/5 text-white transition-colors cursor-pointer"
                            title="View log histories"
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {configs.length === 0 && (
                    <div className="py-12 text-[#7E848C] text-xs text-center">
                      No recurring task patterns defined.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* History logs panel */}
            {activeHistoryTaskId && (
              <div className="border border-white/[0.06] bg-[#171A1D] rounded-2xl p-5 space-y-4 shadow-md">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Execution History Logs</span>
                  <button
                    onClick={() => setActiveHistoryTaskId(null)}
                    className="text-[10px] text-[#A7ADB5] hover:text-white"
                  >
                    Close
                  </button>
                </h3>

                {loadingHistory ? (
                  <div className="flex justify-center py-6">
                    <Loader className="h-4 w-4 text-[#5BB98C] animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {historyLogs.map((log) => (
                      <div key={log.id} className="p-3 border border-white/[0.06] bg-[#1A1D20] rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            log.status === 'Generated' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {log.status}
                          </span>
                          <span className="text-[10px] text-white">Target Run: {new Date(log.run_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    {historyLogs.length === 0 && (
                      <div className="text-center text-xs text-[#7E848C] py-6">
                        No execution logs recorded yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </MainLayout>
  )
}
