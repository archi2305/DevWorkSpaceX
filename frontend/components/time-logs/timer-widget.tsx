'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timeLogService, TimeLog } from '@/services/time-log'
import { projectService } from '@/services/project'
import { taskService } from '@/services/task'
import { Play, Pause, Square, Clock, Loader, AlertCircle } from 'lucide-react'

export function TimerWidget() {
  const queryClient = useQueryClient()
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [description, setDescription] = useState('')
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Query all logs to find if there is an active running timer
  const { data: allLogs = [], isLoading } = useQuery({
    queryKey: ['time-logs', 'all'],
    queryFn: () => timeLogService.getTimeLogs()
  })

  // Load projects list
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects()
  })

  // Load tasks list if a project is selected
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', selectedProjectId],
    queryFn: () => taskService.getTasks(selectedProjectId),
    enabled: !!selectedProjectId
  })

  const activeTimer = allLogs.find((log) => log.is_running)

  // Sync state with backend active timer
  useEffect(() => {
    if (activeTimer) {
      setIsRunning(true)
      setSelectedTaskId(activeTimer.task_id || '')
      setSelectedProjectId(activeTimer.project_id || '')
      setDescription(activeTimer.description || '')

      const start = new Date(activeTimer.start_time).getTime()
      const updateSeconds = () => {
        const diff = Math.floor((Date.now() - start) / 1000)
        setSeconds(Math.max(0, diff))
      }
      updateSeconds()

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = setInterval(updateSeconds, 1000)
    } else {
      setIsRunning(false)
      setSeconds(0)
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [activeTimer])

  // Mutation to start timer
  const startMutation = useMutation({
    mutationFn: (data: { task_id?: string; project_id?: string; description?: string }) =>
      timeLogService.startTimer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-logs'] })
    }
  })

  // Mutation to stop timer
  const stopMutation = useMutation({
    mutationFn: () => timeLogService.stopTimer(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-logs'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDescription('')
    }
  })

  const handleStart = () => {
    startMutation.mutate({
      task_id: selectedTaskId || undefined,
      project_id: selectedProjectId || undefined,
      description: description || undefined
    })
  }

  const handleStop = () => {
    stopMutation.mutate()
  }

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':')
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-[#171A1D] border border-white/[0.06] px-4 py-3 rounded-2xl shadow-xl">
        <Loader className="h-3.5 w-3.5 animate-spin text-[#5BB98C]" />
        <span className="text-[10px] text-[#A7ADB5]">Syncing Timer...</span>
      </div>
    )
  }

  return (
    <div className="w-full bg-[#171A1D] border border-white/[0.06] rounded-2xl p-4 space-y-3.5 text-left text-xs shadow-md">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#5BB98C]" /> Time Tracker
        </span>
        {isRunning && (
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </div>

      {/* Inputs when timer is idle */}
      {!isRunning && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-2 py-1.5 border border-white/[0.06] bg-[#1D2024] text-[10px] text-white rounded-lg outline-none cursor-pointer"
            >
              <option value="">Any Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={selectedTaskId}
              disabled={!selectedProjectId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="px-2 py-1.5 border border-white/[0.06] bg-[#1D2024] text-[10px] text-white rounded-lg outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="">Any Task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="What are you working on?..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-1.5 border border-white/[0.06] bg-[#1D2024] rounded-lg text-[10px] text-white outline-none focus:border-[#5BB98C]"
          />
        </div>
      )}

      {/* Running Segment Details */}
      {isRunning && activeTimer && (
        <div className="p-2 bg-[#1D2024] border border-white/[0.04] rounded-xl text-[10px] text-[#A7ADB5] space-y-1">
          <div className="flex justify-between items-center text-white font-bold">
            <span>{description || 'Timer Segment'}</span>
            <span className="text-[9px] uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-extrabold">Active</span>
          </div>
          {activeTimer.project_id && (
            <p>Project ID: {activeTimer.project_id.slice(0, 8)}...</p>
          )}
        </div>
      )}

      {/* Controls & Clock */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-xl font-extrabold text-white tracking-widest font-mono">
          {formatTime(seconds)}
        </div>

        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={startMutation.isPending}
              className="p-2 bg-[#5BB98C]/15 border border-[#5BB98C]/30 text-[#5BB98C] rounded-xl hover:bg-[#5BB98C]/25 transition-colors cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={stopMutation.isPending}
              className="p-2 bg-[#EB5757]/15 border border-[#EB5757]/30 text-[#EB5757] rounded-xl hover:bg-[#EB5757]/25 transition-colors cursor-pointer"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
