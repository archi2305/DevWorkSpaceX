'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timeLogService, TimeLog } from '@/services/time-log'
import { Clock, Calendar, Plus, RotateCcw, Award } from 'lucide-react'

interface TimeLogsManagerProps {
  projectId?: string
  taskId?: string
  sprintId?: string
}

export function TimeLogsManager({ projectId, taskId, sprintId }: TimeLogsManagerProps) {
  const queryClient = useQueryClient()
  const [manualDesc, setManualDesc] = useState('')
  const [manualStart, setManualStart] = useState('')
  const [manualEnd, setManualEnd] = useState('')
  const [manualError, setManualError] = useState<string | null>(null)

  // Query logs list
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['time-logs', { project_id: projectId, task_id: taskId, sprint_id: sprintId }],
    queryFn: () => timeLogService.getTimeLogs({
      project_id: projectId,
      task_id: taskId,
      sprint_id: sprintId
    })
  })

  // Query totals
  const { data: totals } = useQuery({
    queryKey: ['time-totals', { project_id: projectId, task_id: taskId, sprint_id: sprintId }],
    queryFn: () => timeLogService.getTimeTotals({
      project_id: projectId,
      task_id: taskId,
      sprint_id: sprintId
    })
  })

  // Mutation to log manual entry
  const manualLogMutation = useMutation({
    mutationFn: (data: {
      task_id?: string
      project_id?: string
      sprint_id?: string
      start_time: string
      end_time: string
      description?: string
    }) => timeLogService.logManualTime(data),
    onSuccess: () => {
      setManualDesc('')
      setManualStart('')
      setManualEnd('')
      setManualError(null)
      queryClient.invalidateQueries({ queryKey: ['time-logs'] })
      queryClient.invalidateQueries({ queryKey: ['time-totals'] })
      queryClient.invalidateQueries({ queryKey: ['productivity-report'] })
    },
    onError: (err: any) => {
      setManualError(err.response?.data?.detail || 'Manual time logging failed.')
    }
  })

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualStart || !manualEnd) return
    setManualError(null)
    
    manualLogMutation.mutate({
      project_id: projectId,
      task_id: taskId,
      sprint_id: sprintId,
      start_time: new Date(manualStart).toISOString(),
      end_time: new Date(manualEnd).toISOString(),
      description: manualDesc || undefined
    })
  }

  const formatHours = (seconds: number) => {
    const hours = seconds / 3600
    return `${hours.toFixed(2)}h`
  }

  return (
    <div className="space-y-6 text-left text-xs">
      
      {/* Time Totals Row */}
      {totals && (
        <div className="grid grid-cols-3 gap-3">
          {taskId && (
            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#171A1D]">
              <span className="text-[10px] text-[#A7ADB5] font-bold uppercase tracking-wider block">Task Logged</span>
              <span className="text-lg font-extrabold text-white mt-1 block">{formatHours(totals.total_task_seconds)}</span>
            </div>
          )}
          {sprintId && (
            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#171A1D]">
              <span className="text-[10px] text-[#A7ADB5] font-bold uppercase tracking-wider block">Sprint Logged</span>
              <span className="text-lg font-extrabold text-white mt-1 block">{formatHours(totals.total_sprint_seconds)}</span>
            </div>
          )}
          {projectId && (
            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#171A1D]">
              <span className="text-[10px] text-[#A7ADB5] font-bold uppercase tracking-wider block">Project Logged</span>
              <span className="text-lg font-extrabold text-white mt-1 block">{formatHours(totals.total_project_seconds)}</span>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Form */}
      <div className="rounded-xl border border-white/[0.06] bg-[#171A1D] p-5 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/[0.06] pb-2">
          <Plus className="h-4 w-4 text-[#5BB98C]" /> Log Manual Entry
        </h3>

        {manualError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {manualError}
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-[#A7ADB5]">Start Time</label>
              <input
                type="datetime-local"
                required
                value={manualStart}
                onChange={(e) => setManualStart(e.target.value)}
                className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] text-xs text-white rounded-lg outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-[#A7ADB5]">End Time</label>
              <input
                type="datetime-local"
                required
                value={manualEnd}
                onChange={(e) => setManualEnd(e.target.value)}
                className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] text-xs text-white rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-[#A7ADB5]">Description</label>
            <input
              type="text"
              placeholder="e.g. Design review meeting, backend refactoring"
              value={manualDesc}
              onChange={(e) => setManualDesc(e.target.value)}
              className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] text-xs text-white rounded-lg outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={manualLogMutation.isPending}
            className="px-4 py-2 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold rounded-lg transition-colors cursor-pointer"
          >
            {manualLogMutation.isPending ? 'Logging...' : 'Log Time'}
          </button>
        </form>
      </div>

      {/* Time Logs History List */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Time Logs History</h3>
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {logs.map((log) => (
            <div key={log.id} className="p-3.5 rounded-xl border border-white/[0.06] bg-[#171A1D]/60 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{log.description || 'Time Log Segment'}</p>
                <span className="text-[10px] text-[#7E848C]">
                  {new Date(log.start_time).toLocaleString()}
                </span>
              </div>
              <span className="text-xs font-bold text-[#5BB98C] bg-[#5BB98C]/10 border border-[#5BB98C]/20 px-2.5 py-0.5 rounded-full">
                {formatHours(log.duration_seconds || 0)}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-xs text-[#7E848C] italic text-center py-6">No time logs history found.</p>
          )}
        </div>
      </div>

    </div>
  )
}
