'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import { projectService } from '@/services/project'
import { milestoneService } from '@/services/milestone'
import { taskService, TaskResponse } from '@/services/task'
import {
  Calendar,
  Layers,
  Loader,
  Plus,
  ChevronRight,
  Clock,
  LayoutGrid,
  Sparkles,
  Columns,
  Grid,
  ChevronLeft,
  Info,
  Maximize2,
  Minimize2,
  Activity
} from 'lucide-react'

type ZoomLevel = 'week' | 'month' | 'quarter'

export default function GanttPage() {
  const queryClient = useQueryClient()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [zoom, setZoom] = useState<ZoomLevel>('month')
  
  // Date viewport range (dynamic)
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d
  })

  // Load Projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects()
  })

  // Load Milestones
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', selectedProjectId],
    queryFn: () => milestoneService.getMilestones(selectedProjectId, { is_archived: false }),
    enabled: !!selectedProjectId
  })

  // Load Tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', { project_id: selectedProjectId }],
    queryFn: () => taskService.getTasks(selectedProjectId),
    enabled: !!selectedProjectId
  })

  // Load Dependencies
  const { data: projectDependencies = [] } = useQuery({
    queryKey: ['project-dependencies', selectedProjectId],
    queryFn: () => taskService.getProjectDependencies(selectedProjectId),
    enabled: !!selectedProjectId
  })

  // Mutation to update task dates
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<TaskResponse> }) =>
      taskService.updateTask(taskId, updates as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: selectedProjectId }] })
    }
  })

  // Setup viewport days
  const daysCount = zoom === 'week' ? 14 : zoom === 'month' ? 30 : 90
  const dayWidth = zoom === 'week' ? 50 : zoom === 'month' ? 24 : 10

  const timelineDays: Date[] = []
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    timelineDays.push(d)
  }

  const shiftStartDate = (days: number) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + days)
    setStartDate(d)
  }

  // Helper to calculate X offset and width
  const getTimelineCoords = (itemStart: Date, itemEnd: Date) => {
    const timelineStartMs = startDate.getTime()
    const itemStartMs = itemStart.getTime()
    const itemEndMs = itemEnd.getTime()

    const diffStartDays = (itemStartMs - timelineStartMs) / (1000 * 60 * 60 * 24)
    const durationDays = (itemEndMs - itemStartMs) / (1000 * 60 * 60 * 24)

    const left = Math.max(0, diffStartDays * dayWidth)
    const width = Math.max(dayWidth, durationDays * dayWidth)

    return { left, width, visible: diffStartDays + durationDays >= 0 && diffStartDays <= daysCount }
  }

  // Dragging states
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)
  const dragStartX = useRef<number>(0)
  const dragStartLeft = useRef<number>(0)

  const handleDragStart = (e: React.MouseEvent, taskId: string, currentLeft: number) => {
    setDragTaskId(taskId)
    dragStartX.current = e.clientX
    dragStartLeft.current = currentLeft
  }

  const handleDragMove = (e: React.MouseEvent) => {
    if (!dragTaskId) return
    // Real-time drag positioning is normally handled by CSS transforms,
    // but to be clean, we can calculate delta days directly on release.
  }

  const handleDragEnd = (e: React.MouseEvent, task: TaskResponse) => {
    if (!dragTaskId) return
    const deltaX = e.clientX - dragStartX.current
    const deltaDays = Math.round(deltaX / dayWidth)

    if (deltaDays !== 0) {
      const currentStart = task.created_at ? new Date(task.created_at) : new Date()
      const currentDue = task.due_date ? new Date(task.due_date) : new Date()
      
      currentStart.setDate(currentStart.getDate() + deltaDays)
      currentDue.setDate(currentDue.getDate() + deltaDays)

      updateTaskMutation.mutate({
        taskId: task.id,
        updates: {
          due_date: currentDue.toISOString().split('T')[0]
        } as any
      })
    }
    setDragTaskId(null)
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <Grid className="h-6 w-6 text-[#5BB98C]" /> Gantt Chart Timeline
            </h1>
            <p className="text-xs text-[#A7ADB5] mt-1">Cross-project milestones dependencies, task timelines, and releases mapping.</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#171A1D] text-xs text-[#F5F5F5] outline-none cursor-pointer hover:bg-[#23272B] focus:border-[#5BB98C]"
            >
              <option value="">Select Project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {selectedProjectId && (
              <div className="flex items-center bg-[#171A1D] border border-white/[0.06] rounded-xl p-1">
                {(['week', 'month', 'quarter'] as ZoomLevel[]).map((z) => (
                  <button
                    key={z}
                    onClick={() => setZoom(z)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      zoom === z ? 'bg-[#5BB98C] text-[#111315]' : 'text-[#A7ADB5] hover:text-white'
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {!selectedProjectId ? (
          <div className="border border-dashed border-white/[0.06] rounded-2xl p-12 text-center space-y-2 bg-[#171A1D]/20">
            <Grid className="h-10 w-10 text-[#7E848C] mx-auto opacity-40 animate-pulse" />
            <p className="text-sm font-semibold text-white">No Project Selected</p>
            <p className="text-xs text-[#A7ADB5]">Choose a project from the dropdown filter to render the Gantt chart.</p>
          </div>
        ) : (
          <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col shadow-lg">
            
            {/* View Navigation controls */}
            <div className="p-4 border-b border-white/[0.06] bg-[#111315]/40 flex items-center justify-between gap-4">
              <span className="text-xs text-[#A7ADB5] flex items-center gap-1.5">
                <Info className="h-4 w-4 text-[#5BB98C]" />
                Drag any task timeline bar horizontally to shift dates dynamically.
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => shiftStartDate(-7)}
                  className="p-1.5 rounded border border-white/[0.06] hover:bg-[#1D2024] text-white cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-white font-bold">
                  {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
                  {timelineDays[timelineDays.length - 1]?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <button
                  onClick={() => shiftStartDate(7)}
                  className="p-1.5 rounded border border-white/[0.06] hover:bg-[#1D2024] text-white cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Timeline Workspace Grid */}
            <div className="overflow-x-auto" onMouseMove={handleDragMove}>
              <div className="min-w-max flex flex-col">
                
                {/* 1. Header Row */}
                <div className="flex border-b border-white/[0.06]">
                  {/* Left Label cell */}
                  <div className="w-64 border-r border-white/[0.06] p-4 bg-[#111315] text-[10px] font-extrabold text-[#7E848C] uppercase tracking-wider sticky left-0 z-10">
                    Tasks / Milestones
                  </div>
                  {/* Timeline Days cells */}
                  <div className="flex">
                    {timelineDays.map((day, idx) => (
                      <div
                        key={idx}
                        style={{ width: dayWidth }}
                        className={`flex-shrink-0 text-center py-3 border-r border-white/[0.02] text-[9px] font-semibold flex flex-col justify-center ${
                          day.getDay() === 0 || day.getDay() === 6 ? 'bg-[#1D2024]/40 text-[#7E848C]' : 'text-white'
                        }`}
                      >
                        <span>{day.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                        <span className="font-bold text-[10px] mt-0.5">{day.getDate()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Milestones Timeline rows */}
                {milestones.map((ms) => {
                  const msStart = ms.created_at ? new Date(ms.created_at) : new Date()
                  const msEnd = ms.due_date ? new Date(ms.due_date) : new Date()
                  const coords = getTimelineCoords(msStart, msEnd)

                  return (
                    <div key={ms.id} className="flex border-b border-white/[0.04] bg-[#111315]/10 hover:bg-[#1D2024]/30 transition-colors">
                      {/* Left Name */}
                      <div className="w-64 border-r border-white/[0.06] p-3 text-left sticky left-0 bg-[#171A1D] z-10 truncate flex items-center gap-1.5 shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-orange-400" />
                        <span className="text-[11px] font-bold text-white truncate" title={ms.title}>{ms.title}</span>
                      </div>
                      {/* Gantt Bar Lane */}
                      <div className="flex relative items-center h-12 w-full">
                        {coords.visible && (
                          <div
                            style={{ left: coords.left, width: coords.width }}
                            className="absolute h-6 rounded-lg bg-orange-400/10 border border-orange-400/30 flex items-center justify-center px-2 shadow-sm pointer-events-none"
                          >
                            <span className="text-[8px] font-extrabold text-orange-400 uppercase truncate">Milestone</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* 3. Tasks Timeline rows */}
                {tasks.map((task) => {
                  const tStart = task.created_at ? new Date(task.created_at) : new Date()
                  const tEnd = task.due_date ? new Date(task.due_date) : new Date()
                  // Expand start date if equal to end date
                  if (tStart.getTime() === tEnd.getTime()) {
                    tEnd.setDate(tEnd.getDate() + 1)
                  }
                  
                  const coords = getTimelineCoords(tStart, tEnd)

                  // Check if task is blocked
                  const isBlocked = projectDependencies.some(d => 
                    d.task_id === task.id && 
                    d.dependency_type === 'blocked_by' && 
                    !(tasks.find(t => t.id === d.depends_on_id)?.completed)
                  )

                  return (
                    <div key={task.id} className="flex border-b border-white/[0.04] hover:bg-[#1D2024]/30 transition-colors">
                      {/* Left Label */}
                      <div className="w-64 border-r border-white/[0.06] p-3 text-left sticky left-0 bg-[#171A1D] z-10 truncate flex items-center gap-2 shadow-sm">
                        <span className={`h-2 w-2 rounded-full ${task.completed ? 'bg-[#5BB98C]' : 'bg-[#F2C94C]'}`} />
                        <span className="text-[11px] font-medium text-white truncate" title={task.title}>{task.title}</span>
                      </div>
                      {/* Gantt Bar Lane */}
                      <div className="flex relative items-center h-12 w-full">
                        {coords.visible && (
                          <div
                            onMouseDown={(e) => handleDragStart(e, task.id, coords.left)}
                            onMouseUp={(e) => handleDragEnd(e, task)}
                            style={{ left: coords.left, width: coords.width }}
                            className={`absolute h-7 rounded-lg flex items-center justify-between px-2.5 shadow-md cursor-grab active:cursor-grabbing border select-none transition-shadow ${
                              task.completed 
                                ? 'bg-[#5BB98C]/15 border-[#5BB98C]/30 text-[#5BB98C]' 
                                : isBlocked 
                                  ? 'bg-[#EB5757]/15 border-[#EB5757]/30 text-[#EB5757]' 
                                  : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                            }`}
                          >
                            <span className="text-[9px] font-bold truncate pr-1">{task.title}</span>
                            <span className="text-[8px] font-extrabold uppercase opacity-80">{task.priority}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {tasks.length === 0 && milestones.length === 0 && (
                  <div className="flex border-b border-white/[0.04]">
                    <div className="w-64 border-r border-white/[0.06] p-8 text-[#7E848C]" />
                    <div className="p-8 text-xs text-[#7E848C] italic">No active milestones or tasks to schedule.</div>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

      </div>
    </MainLayout>
  )
}
