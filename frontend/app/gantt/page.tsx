'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, GitBranch, Grid, Loader, ZoomIn } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { milestoneService, Milestone } from '@/services/milestone'
import { projectService, ProjectResponse } from '@/services/project'
import { taskService, TaskResponse } from '@/services/task'
import type Gantt from 'frappe-gantt'
import type { FrappeGanttTask, FrappeGanttViewMode } from 'frappe-gantt'
import './globals.css'

type ZoomLevel = 'Day' | 'Week' | 'Month' | 'Quarter'

type DependencyResponse = {
  id: string
  task_id: string
  depends_on_id: string
  dependency_type: string
}

const zoomLevels: ZoomLevel[] = ['Day', 'Week', 'Month', 'Quarter']

function isDateOnly(value?: string | null) {
  return !!value && /^\d{4}-\d{2}-\d{2}/.test(value)
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function safeDate(value?: string | null, fallback = new Date()) {
  if (!value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date
}

function taskStart(task: TaskResponse) {
  if (isDateOnly(task.start_date)) return safeDate(task.start_date)
  return safeDate(task.created_at)
}

function taskEnd(task: TaskResponse) {
  const start = taskStart(task)
  if (isDateOnly(task.due_date)) {
    const due = safeDate(task.due_date, addDays(start, 1))
    return due <= start ? addDays(start, 1) : due
  }
  const estimatedDays = Math.max(1, Math.ceil((task.estimated_time || 8) / 8))
  return addDays(start, estimatedDays)
}

function progressForTasks(tasks: TaskResponse[]) {
  if (tasks.length === 0) return 0
  const completed = tasks.filter((task) => task.completed || ['Done', 'Completed', 'Closed'].includes(task.status)).length
  return Math.round((completed / tasks.length) * 100)
}

function bounds(dates: Date[]) {
  if (!dates.length) {
    const today = new Date()
    return { start: today, end: addDays(today, 1) }
  }
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
  const start = sorted[0]
  const end = sorted[sorted.length - 1]
  return { start, end: end <= start ? addDays(start, 1) : end }
}

function quarterView(): FrappeGanttViewMode {
  return {
    name: 'Quarter',
    padding: '6m',
    step: '3m',
    column_width: 160,
    date_format: 'YYYY-MM',
    lower_text: (date) => `Q${Math.floor(date.getMonth() / 3) + 1}`,
    upper_text: (date, previousDate) => (!previousDate || date.getFullYear() !== previousDate.getFullYear() ? String(date.getFullYear()) : ''),
    snap_at: '7d',
  }
}

export default function GanttPage() {
  const queryClient = useQueryClient()
  const ganttHostRef = useRef<HTMLDivElement | null>(null)
  const ganttRef = useRef<Gantt | null>(null)
  const latestRowsRef = useRef<FrappeGanttTask[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all')
  const [zoom, setZoom] = useState<ZoomLevel>('Week')
  const [selectedRow, setSelectedRow] = useState<FrappeGanttTask | null>(null)

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  })

  const visibleProjects = useMemo(() => {
    return selectedProjectId === 'all'
      ? projects.filter((project) => !project.is_archived)
      : projects.filter((project) => project.id === selectedProjectId)
  }, [projects, selectedProjectId])

  const visibleProjectIds = visibleProjects.map((project) => project.id)

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks', { gantt_project_id: selectedProjectId }],
    queryFn: () => taskService.getTasks(selectedProjectId === 'all' ? undefined : selectedProjectId),
    enabled: selectedProjectId === 'all' || !!selectedProjectId,
  })

  const milestoneQueries = useQueries({
    queries: visibleProjectIds.map((projectId) => ({
      queryKey: ['milestones', projectId, false],
      queryFn: () => milestoneService.getMilestones(projectId, { is_archived: false }),
      enabled: !!projectId,
    })),
  })

  const dependencyQueries = useQueries({
    queries: visibleProjectIds.map((projectId) => ({
      queryKey: ['project-dependencies', projectId],
      queryFn: () => taskService.getProjectDependencies(projectId) as Promise<DependencyResponse[]>,
      enabled: !!projectId,
    })),
  })

  const milestones = milestoneQueries.flatMap((query) => query.data || [])
  const dependencies = dependencyQueries.flatMap((query) => query.data || [])
  const loadingMilestones = milestoneQueries.some((query) => query.isLoading)
  const loadingDependencies = dependencyQueries.some((query) => query.isLoading)

  const updateTaskDatesMutation = useMutation({
    mutationFn: ({ taskId, start, end }: { taskId: string; start: string; end: string }) =>
      taskService.updateTask(taskId, { start_date: start, due_date: end }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const rows = useMemo<FrappeGanttTask[]>(() => {
    const taskByProject = new Map<string, TaskResponse[]>()
    tasks.forEach((task) => {
      if (!task.project_id || task.is_archived) return
      const bucket = taskByProject.get(task.project_id) || []
      bucket.push(task)
      taskByProject.set(task.project_id, bucket)
    })

    const dependencyMap = dependencies.reduce<Record<string, string[]>>((acc, dep) => {
      if (dep.dependency_type === 'blocked_by' || dep.dependency_type === 'relates') {
        acc[dep.task_id] = [...(acc[dep.task_id] || []), dep.depends_on_id]
      }
      return acc
    }, {})

    const projectRows = visibleProjects.map((project: ProjectResponse) => {
      const projectTasks = taskByProject.get(project.id) || []
      const projectMilestones = milestones.filter((milestone) => milestone.project_id === project.id)
      const projectDates = [
        ...projectTasks.flatMap((task) => [taskStart(task), taskEnd(task)]),
        ...projectMilestones.map((milestone) => safeDate(milestone.due_date, safeDate(milestone.created_at))),
        safeDate(project.created_at),
        project.due_date ? safeDate(project.due_date) : null,
      ].filter(Boolean) as Date[]
      const projectBounds = bounds(projectDates)

      return {
        id: `project:${project.id}`,
        sourceId: project.id,
        name: `Project: ${project.name}`,
        start: toDateOnly(projectBounds.start),
        end: toDateOnly(projectBounds.end),
        progress: project.progress || progressForTasks(projectTasks),
        custom_class: 'project-row',
        type: 'project',
      }
    })

    const milestoneRows = milestones.map((milestone: Milestone) => {
      const milestoneTasks = tasks.filter((task) => task.milestone_id === milestone.id)
      const start = milestoneTasks.length ? bounds(milestoneTasks.flatMap((task) => [taskStart(task), taskEnd(task)])).start : safeDate(milestone.created_at)
      const end = milestone.due_date ? safeDate(milestone.due_date, addDays(start, 1)) : addDays(start, 1)
      return {
        id: `milestone:${milestone.id}`,
        sourceId: milestone.id,
        name: `Milestone: ${milestone.title}`,
        start: toDateOnly(start),
        end: toDateOnly(end <= start ? addDays(start, 1) : end),
        progress: milestone.progress_percentage ?? progressForTasks(milestoneTasks),
        custom_class: 'milestone-row',
        type: 'milestone',
      }
    })

    const taskRows = tasks
      .filter((task) => !task.is_archived)
      .map((task) => {
        const blocked = (dependencyMap[task.id] || []).some((blockingId) => !tasks.find((candidate) => candidate.id === blockingId)?.completed)
        return {
          id: `task:${task.id}`,
          sourceId: task.id,
          name: task.title,
          start: toDateOnly(taskStart(task)),
          end: toDateOnly(taskEnd(task)),
          progress: task.completed ? 100 : task.status === 'In Progress' ? 50 : 0,
          dependencies: (dependencyMap[task.id] || []).map((depId) => `task:${depId}`),
          custom_class: `task-row${blocked ? ' blocked' : ''}`,
          type: 'task',
          project: task.project_id || undefined,
        }
      })

    return [...projectRows, ...milestoneRows, ...taskRows]
  }, [dependencies, milestones, projects, tasks, visibleProjects])

  useEffect(() => {
    latestRowsRef.current = rows
  }, [rows])

  useEffect(() => {
    let cancelled = false

    async function renderGantt() {
      if (!ganttHostRef.current) return
      ganttHostRef.current.innerHTML = ''
      if (rows.length === 0) return

      const { default: FrappeGantt } = await import('frappe-gantt')
      if (cancelled || !ganttHostRef.current) return

      ganttRef.current = new FrappeGantt(ganttHostRef.current, rows, {
        view_mode: zoom,
        view_modes: [
          { name: 'Day', step: '1d', column_width: 42, date_format: 'YYYY-MM-DD', lower_text: 'D', upper_text: 'MMMM', snap_at: '1d' },
          { name: 'Week', step: '7d', column_width: 120, date_format: 'YYYY-MM-DD', lower_text: 'D MMM', upper_text: 'YYYY', snap_at: '1d' },
          { name: 'Month', step: '1m', column_width: 120, date_format: 'YYYY-MM', lower_text: 'MMMM', upper_text: 'YYYY', snap_at: '7d' },
          quarterView(),
        ],
        readonly_progress: true,
        move_dependencies: true,
        view_mode_select: false,
        popup_on: 'click',
        container_height: 640,
        bar_height: 28,
        padding: 22,
        scroll_to: 'today',
        on_click: (task) => setSelectedRow(task),
        on_date_change: (task, start, end) => {
          if (task.type !== 'task' || !task.sourceId) {
            ganttRef.current?.refresh(latestRowsRef.current)
            return
          }
          updateTaskDatesMutation.mutate({
            taskId: task.sourceId,
            start: toDateOnly(start),
            end: toDateOnly(end),
          })
        },
        on_progress_change: (task, progress) => {
          // Progress is read-only for now
          ganttRef.current?.refresh(latestRowsRef.current)
        },
        popup: (ctx: any) => {
          const task = ctx.task as FrappeGanttTask
          const kind = task.type === 'task' ? 'Task' : task.type === 'milestone' ? 'Milestone' : 'Project'
          return `<div class="details-container"><h5>${kind}</h5><p>${task.name}</p><p>${task.start} - ${task.end}</p><p>Progress: ${Math.round(task.progress || 0)}%</p></div>`
        },
      })
    }

    renderGantt()

    return () => {
      cancelled = true
      if (ganttHostRef.current) ganttHostRef.current.innerHTML = ''
    }
  }, [rows, zoom])

  const isLoading = loadingProjects || loadingTasks || loadingMilestones || loadingDependencies

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6 text-left">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-[#F5F5F5]">
              <Grid className="h-6 w-6 text-[#5BB98C]" /> Gantt Chart
            </h1>
            <p className="mt-1 text-xs text-[#A7ADB5]">Projects, milestones, tasks, and PostgreSQL-backed dependencies in one interactive timeline.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              className="rounded-xl border border-white/[0.06] bg-[#171A1D] px-3.5 py-2.5 text-xs text-[#F5F5F5] outline-none"
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            <div className="flex items-center rounded-xl border border-white/[0.06] bg-[#171A1D] p-1">
              {zoomLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setZoom(level)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase transition-colors ${
                    zoom === level ? 'bg-[#5BB98C] text-[#111315]' : 'text-[#A7ADB5] hover:text-white'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-white/[0.06] bg-[#171A1D] p-4">
            <p className="text-[10px] font-bold uppercase text-[#7E848C]">Projects</p>
            <p className="mt-1 text-2xl font-bold text-white">{visibleProjects.length}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#171A1D] p-4">
            <p className="text-[10px] font-bold uppercase text-[#7E848C]">Milestones</p>
            <p className="mt-1 text-2xl font-bold text-white">{milestones.length}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#171A1D] p-4">
            <p className="text-[10px] font-bold uppercase text-[#7E848C]">Tasks</p>
            <p className="mt-1 text-2xl font-bold text-white">{tasks.length}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#171A1D] p-4">
            <p className="text-[10px] font-bold uppercase text-[#7E848C]">Dependencies</p>
            <p className="mt-1 text-2xl font-bold text-white">{dependencies.length}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#171A1D] shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-[#111315]/60 px-4 py-3">
            <span className="flex items-center gap-2 text-xs text-[#A7ADB5]">
              <CalendarDays className="h-4 w-4 text-[#5BB98C]" />
              Drag task bars to move dates. Resize task bars to change duration. Project and milestone rows are read-only.
            </span>
            <span className="flex items-center gap-2 text-xs text-[#A7ADB5]">
              <GitBranch className="h-4 w-4 text-[#5BB98C]" /> Dependency arrows are loaded from PostgreSQL.
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#A7ADB5]">
              <Loader className="h-5 w-5 animate-spin text-[#5BB98C]" /> Loading Gantt data...
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <ZoomIn className="mx-auto h-10 w-10 text-[#7E848C]" />
              <p className="mt-3 text-sm font-semibold text-white">No timeline data available.</p>
              <p className="mt-1 text-xs text-[#A7ADB5]">Create projects, milestones, and tasks to populate the chart.</p>
            </div>
          ) : (
            <div className="gantt-container overflow-auto">
              <div ref={ganttHostRef} />
            </div>
          )}
        </section>

        {selectedRow && (
          <section className="rounded-xl border border-white/[0.06] bg-[#171A1D] p-4">
            <p className="text-[10px] font-bold uppercase text-[#7E848C]">Selected</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white">
              <span className="font-bold">{selectedRow.name}</span>
              <span className="text-[#A7ADB5]">{selectedRow.start} to {selectedRow.end}</span>
              <span className="text-[#5BB98C]">{Math.round(selectedRow.progress || 0)}%</span>
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  )
}
