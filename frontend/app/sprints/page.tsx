'use client'

import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Archive,
  Calendar,
  CheckCircle2,
  Edit3,
  Flag,
  ListChecks,
  Play,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { projectService } from '@/services/project'
import { sprintService, Sprint, SprintStats } from '@/services/sprint'
import { taskService, TaskResponse } from '@/services/task'

type SprintFormState = {
  name: string
  goal: string
  description: string
  duration_weeks: number
  start_date: string
  end_date: string
}

const emptyForm: SprintFormState = {
  name: '',
  goal: '',
  description: '',
  duration_weeks: 2,
  start_date: '',
  end_date: '',
}

function formatDate(value?: string | null) {
  if (!value) return 'Not scheduled'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not scheduled'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function taskPoints(tasks: TaskResponse[]) {
  return tasks.reduce((sum, task) => sum + (task.story_points || 0), 0)
}

export default function SprintsPage() {
  const queryClient = useQueryClient()
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null)
  const [form, setForm] = useState<SprintFormState>(emptyForm)

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  })

  const { data: sprints = [], isLoading: sprintsLoading } = useQuery({
    queryKey: ['sprints', selectedProjectId, includeArchived],
    queryFn: () => sprintService.getSprints(selectedProjectId, undefined, includeArchived),
    enabled: !!selectedProjectId,
  })

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', { project_id: selectedProjectId }],
    queryFn: () => taskService.getTasks(selectedProjectId),
    enabled: !!selectedProjectId,
  })

  const activeSprint = sprints.find((sprint) => sprint.status === 'Active' && !sprint.is_archived)
  const plannedSprints = sprints.filter((sprint) => sprint.status === 'Planned' && !sprint.is_archived)
  const completedSprints = sprints.filter((sprint) => sprint.status === 'Completed' && !sprint.is_archived)
  const archivedSprints = sprints.filter((sprint) => sprint.is_archived)
  const backlogTasks = tasks.filter((task) => !task.sprint_id && !task.is_archived)

  const { data: activeStats } = useQuery<SprintStats>({
    queryKey: ['sprint-stats', activeSprint?.id],
    queryFn: () => sprintService.getSprintStats(activeSprint!.id),
    enabled: !!activeSprint?.id,
  })

  const sprintTasksById = useMemo(() => {
    return sprints.reduce<Record<string, TaskResponse[]>>((acc, sprint) => {
      acc[sprint.id] = tasks.filter((task) => task.sprint_id === sprint.id)
      return acc
    }, {})
  }, [sprints, tasks])

  const refreshSprintData = () => {
    queryClient.invalidateQueries({ queryKey: ['sprints', selectedProjectId] })
    queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: selectedProjectId }] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const createSprintMutation = useMutation({
    mutationFn: () =>
      sprintService.createSprint({
        project_id: selectedProjectId,
        name: form.name.trim(),
        goal: form.goal.trim() || undefined,
        description: form.description.trim() || undefined,
        duration_weeks: form.duration_weeks,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : undefined,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : undefined,
      }),
    onSuccess: () => {
      setIsFormOpen(false)
      setForm(emptyForm)
      refreshSprintData()
    },
  })

  const editSprintMutation = useMutation({
    mutationFn: () =>
      sprintService.updateSprint(editingSprint!.id, {
        name: form.name.trim(),
        goal: form.goal.trim() || null,
        description: form.description.trim() || null,
        duration_weeks: form.duration_weeks,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      } as Partial<Sprint>),
    onSuccess: () => {
      setEditingSprint(null)
      setIsFormOpen(false)
      setForm(emptyForm)
      refreshSprintData()
    },
  })

  const startSprintMutation = useMutation({
    mutationFn: (id: string) => sprintService.startSprint(id),
    onSuccess: refreshSprintData,
    onError: (error: any) => alert(error.response?.data?.detail || 'Failed to start sprint.'),
  })

  const completeSprintMutation = useMutation({
    mutationFn: (id: string) => sprintService.completeSprint(id),
    onSuccess: refreshSprintData,
    onError: (error: any) => alert(error.response?.data?.detail || 'Failed to complete sprint.'),
  })

  const archiveSprintMutation = useMutation({
    mutationFn: (id: string) => sprintService.archiveSprint(id),
    onSuccess: refreshSprintData,
    onError: (error: any) => alert(error.response?.data?.detail || 'Failed to archive sprint.'),
  })

  const deleteSprintMutation = useMutation({
    mutationFn: (id: string) => sprintService.deleteSprint(id),
    onSuccess: refreshSprintData,
  })

  const assignTaskMutation = useMutation({
    mutationFn: ({ sprintId, taskId }: { sprintId: string; taskId: string }) =>
      sprintService.addTasksToSprint(sprintId, [taskId]),
    onSuccess: refreshSprintData,
  })

  const removeTaskMutation = useMutation({
    mutationFn: ({ sprintId, taskId }: { sprintId: string; taskId: string }) =>
      sprintService.removeTaskFromSprint(sprintId, taskId),
    onSuccess: refreshSprintData,
  })

  const moveTaskMutation = useMutation({
    mutationFn: ({ sourceSprintId, targetSprintId, taskId }: { sourceSprintId: string; targetSprintId: string; taskId: string }) =>
      sprintService.moveTasksBetweenSprints(sourceSprintId, [taskId], targetSprintId || null),
    onSuccess: refreshSprintData,
  })

  const openCreateForm = () => {
    setEditingSprint(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  const openEditForm = (sprint: Sprint) => {
    setEditingSprint(sprint)
    setForm({
      name: sprint.name,
      goal: sprint.goal || '',
      description: sprint.description || '',
      duration_weeks: sprint.duration_weeks,
      start_date: sprint.start_date?.slice(0, 10) || '',
      end_date: sprint.end_date?.slice(0, 10) || '',
    })
    setIsFormOpen(true)
  }

  const submitForm = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !selectedProjectId) return
    if (editingSprint) {
      editSprintMutation.mutate()
    } else {
      createSprintMutation.mutate()
    }
  }

  const renderTask = (task: TaskResponse, sprint?: Sprint) => (
    <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-[#1D2024] px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-white">{task.title}</p>
        <p className="mt-1 text-[10px] text-[#7E848C]">
          {task.status} · {task.story_points || 0} pts · {task.priority}
        </p>
      </div>
      {sprint ? (
        <div className="flex items-center gap-2">
          <select
            defaultValue=""
            onChange={(event) => {
              moveTaskMutation.mutate({
                sourceSprintId: sprint.id,
                targetSprintId: event.target.value === '__backlog' ? '' : event.target.value,
                taskId: task.id,
              })
              event.currentTarget.value = ''
            }}
            className="rounded-md border border-white/[0.06] bg-[#171A1D] px-2 py-1 text-[10px] text-white outline-none"
          >
            <option value="">Move</option>
            <option value="__backlog">Backlog</option>
            {sprints
              .filter((target) => target.id !== sprint.id && target.status !== 'Completed' && !target.is_archived)
              .map((target) => (
                <option key={target.id} value={target.id}>{target.name}</option>
              ))}
          </select>
          <button
            onClick={() => removeTaskMutation.mutate({ sprintId: sprint.id, taskId: task.id })}
            className="rounded-md p-1 text-[#7E848C] hover:bg-white/5 hover:text-[#EB5757]"
            title="Remove from sprint"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <select
          defaultValue=""
          onChange={(event) => {
            if (event.target.value) {
              assignTaskMutation.mutate({ sprintId: event.target.value, taskId: task.id })
              event.currentTarget.value = ''
            }
          }}
          className="rounded-md border border-white/[0.06] bg-[#171A1D] px-2 py-1 text-[10px] text-white outline-none"
        >
          <option value="">Add to sprint</option>
          {sprints.filter((target) => target.status !== 'Completed' && !target.is_archived).map((target) => (
            <option key={target.id} value={target.id}>{target.name}</option>
          ))}
        </select>
      )}
    </div>
  )

  const renderSprintCard = (sprint: Sprint) => {
    const sprintTasks = sprintTasksById[sprint.id] || []
    const totalPoints = taskPoints(sprintTasks)
    const completedPoints = taskPoints(sprintTasks.filter((task) => task.completed || ['Done', 'Completed'].includes(task.status)))
    const progress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0

    return (
      <section key={sprint.id} className="rounded-xl border border-white/[0.06] bg-[#171A1D] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase text-[#A7ADB5]">
                {sprint.status}
              </span>
              {sprint.is_archived && (
                <span className="rounded-md border border-[#F2C94C]/20 bg-[#F2C94C]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F2C94C]">
                  Archived
                </span>
              )}
            </div>
            <h2 className="mt-2 text-base font-bold text-white">{sprint.name}</h2>
            <p className="mt-1 text-xs text-[#A7ADB5]">{sprint.goal || 'No sprint goal set'}</p>
            <p className="mt-2 text-[10px] text-[#7E848C]">
              {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => openEditForm(sprint)} className="rounded-lg border border-white/[0.06] p-2 text-[#A7ADB5] hover:bg-white/5 hover:text-white" title="Edit sprint">
              <Edit3 className="h-4 w-4" />
            </button>
            {sprint.status === 'Planned' && !sprint.is_archived && (
              <button onClick={() => startSprintMutation.mutate(sprint.id)} className="rounded-lg border border-[#5BB98C]/20 bg-[#5BB98C]/10 px-3 py-2 text-xs font-bold text-[#5BB98C] hover:bg-[#5BB98C]/20">
                <Play className="mr-1 inline h-3.5 w-3.5" /> Start
              </button>
            )}
            {sprint.status === 'Active' && (
              <button onClick={() => completeSprintMutation.mutate(sprint.id)} className="rounded-lg border border-[#5BB98C]/20 bg-[#5BB98C] px-3 py-2 text-xs font-bold text-[#111315] hover:bg-[#5BB98C]/90">
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> Complete
              </button>
            )}
            {sprint.status !== 'Active' && !sprint.is_archived && (
              <button onClick={() => archiveSprintMutation.mutate(sprint.id)} className="rounded-lg border border-white/[0.06] p-2 text-[#A7ADB5] hover:bg-white/5 hover:text-[#F2C94C]" title="Archive sprint">
                <Archive className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => deleteSprintMutation.mutate(sprint.id)} className="rounded-lg border border-white/[0.06] p-2 text-[#A7ADB5] hover:bg-white/5 hover:text-[#EB5757]" title="Delete sprint">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-white/[0.04] bg-[#1D2024] p-3">
            <p className="text-[10px] uppercase text-[#7E848C]">Progress</p>
            <p className="mt-1 text-lg font-bold text-white">{progress}%</p>
          </div>
          <div className="rounded-lg border border-white/[0.04] bg-[#1D2024] p-3">
            <p className="text-[10px] uppercase text-[#7E848C]">Story Points</p>
            <p className="mt-1 text-lg font-bold text-white">{completedPoints}/{totalPoints}</p>
          </div>
          <div className="rounded-lg border border-white/[0.04] bg-[#1D2024] p-3">
            <p className="text-[10px] uppercase text-[#7E848C]">Tasks</p>
            <p className="mt-1 text-lg font-bold text-white">{sprintTasks.length}</p>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#2E3339]">
          <div className="h-full rounded-full bg-[#5BB98C]" style={{ width: `${progress}%` }} />
        </div>

        {sprint.description && <p className="mt-4 text-xs leading-5 text-[#A7ADB5]">{sprint.description}</p>}

        <div className="mt-4 space-y-2">
          {sprintTasks.map((task) => renderTask(task, sprint))}
          {sprintTasks.length === 0 && (
            <p className="rounded-lg border border-dashed border-white/[0.06] py-4 text-center text-xs text-[#7E848C]">
              No tasks in this sprint yet.
            </p>
          )}
        </div>
      </section>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6 text-left">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-[#F5F5F5]">
              <Flag className="h-6 w-6 text-[#5BB98C]" /> Sprint Management
            </h1>
            <p className="mt-1 text-xs text-[#A7ADB5]">Plan, run, complete, and archive project sprints with live story-point metrics.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              className="rounded-lg border border-white/[0.06] bg-[#171A1D] px-3 py-2 text-xs text-white outline-none"
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-xs text-[#A7ADB5]">
              <input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} />
              Archived
            </label>
            <button
              onClick={openCreateForm}
              disabled={!selectedProjectId}
              className="rounded-lg bg-[#5BB98C] px-4 py-2 text-xs font-bold text-[#111315] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="mr-1 inline h-4 w-4" /> Create Sprint
            </button>
          </div>
        </header>

        {!selectedProjectId ? (
          <div className="rounded-xl border border-dashed border-white/[0.08] p-10 text-center">
            <ListChecks className="mx-auto h-9 w-9 text-[#7E848C]" />
            <p className="mt-3 text-sm font-semibold text-white">Select a project to manage sprints.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <main className="space-y-6">
              {activeSprint && activeStats && (
                <section className="rounded-xl border border-[#5BB98C]/20 bg-[#5BB98C]/5 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#5BB98C]">Active Sprint</p>
                      <h2 className="mt-1 text-xl font-bold text-white">{activeStats.name}</h2>
                      <p className="mt-1 text-xs text-[#A7ADB5]">{activeStats.goal || 'No sprint goal set'}</p>
                    </div>
                    <button onClick={() => completeSprintMutation.mutate(activeSprint.id)} className="rounded-lg bg-[#5BB98C] px-4 py-2 text-xs font-bold text-[#111315]">
                      Complete Sprint
                    </button>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-lg border border-white/[0.05] bg-[#171A1D] p-3">
                      <p className="text-[10px] uppercase text-[#7E848C]">Progress</p>
                      <p className="text-xl font-bold text-white">{activeStats.completion_percentage}%</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.05] bg-[#171A1D] p-3">
                      <p className="text-[10px] uppercase text-[#7E848C]">Velocity</p>
                      <p className="text-xl font-bold text-white">{activeStats.velocity}</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.05] bg-[#171A1D] p-3">
                      <p className="text-[10px] uppercase text-[#7E848C]">Remaining Points</p>
                      <p className="text-xl font-bold text-white">{activeStats.remaining_story_points}</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.05] bg-[#171A1D] p-3">
                      <p className="text-[10px] uppercase text-[#7E848C]">Tasks</p>
                      <p className="text-xl font-bold text-white">{activeStats.completed_tasks}/{activeStats.total_tasks}</p>
                    </div>
                  </div>
                </section>
              )}

              {sprintsLoading || tasksLoading ? (
                <div className="rounded-xl border border-white/[0.06] bg-[#171A1D] p-8 text-center text-sm text-[#A7ADB5]">Loading sprint data...</div>
              ) : (
                <>
                  <div className="space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#7E848C]">Active</h2>
                    {activeSprint ? renderSprintCard(activeSprint) : <p className="rounded-xl border border-dashed border-white/[0.06] p-5 text-center text-xs text-[#7E848C]">No active sprint.</p>}
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#7E848C]">Planned ({plannedSprints.length})</h2>
                    {plannedSprints.map(renderSprintCard)}
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#7E848C]">Completed ({completedSprints.length})</h2>
                    {completedSprints.map(renderSprintCard)}
                  </div>
                  {includeArchived && archivedSprints.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#7E848C]">Archived ({archivedSprints.length})</h2>
                      {archivedSprints.map(renderSprintCard)}
                    </div>
                  )}
                </>
              )}
            </main>

            <aside className="rounded-xl border border-white/[0.06] bg-[#171A1D] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">Project Backlog</h2>
                  <p className="mt-1 text-[10px] text-[#A7ADB5]">Tasks not assigned to a sprint.</p>
                </div>
                <Calendar className="h-5 w-5 text-[#5BB98C]" />
              </div>
              <div className="mt-4 max-h-[720px] space-y-2 overflow-y-auto pr-1">
                {backlogTasks.map((task) => renderTask(task))}
                {backlogTasks.length === 0 && (
                  <p className="rounded-lg border border-dashed border-white/[0.06] py-8 text-center text-xs text-[#7E848C]">
                    No backlog tasks available.
                  </p>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={submitForm} className="w-full max-w-xl rounded-xl border border-white/[0.06] bg-[#171A1D] p-6 text-left">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editingSprint ? 'Edit Sprint' : 'Create Sprint'}</h2>
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-lg p-1 text-[#A7ADB5] hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1 md:col-span-2">
                <span className="text-[10px] font-bold uppercase text-[#A7ADB5]">Name</span>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required className="w-full rounded-lg border border-white/[0.06] bg-[#1D2024] px-3 py-2 text-xs text-white outline-none" />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-[10px] font-bold uppercase text-[#A7ADB5]">Goal</span>
                <input value={form.goal} onChange={(event) => setForm({ ...form, goal: event.target.value })} className="w-full rounded-lg border border-white/[0.06] bg-[#1D2024] px-3 py-2 text-xs text-white outline-none" />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-[10px] font-bold uppercase text-[#A7ADB5]">Description</span>
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="w-full resize-none rounded-lg border border-white/[0.06] bg-[#1D2024] px-3 py-2 text-xs text-white outline-none" />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#A7ADB5]">Start Date</span>
                <input type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} className="w-full rounded-lg border border-white/[0.06] bg-[#1D2024] px-3 py-2 text-xs text-white outline-none" />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#A7ADB5]">End Date</span>
                <input type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} className="w-full rounded-lg border border-white/[0.06] bg-[#1D2024] px-3 py-2 text-xs text-white outline-none" />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#A7ADB5]">Duration</span>
                <select value={form.duration_weeks} onChange={(event) => setForm({ ...form, duration_weeks: Number(event.target.value) })} className="w-full rounded-lg border border-white/[0.06] bg-[#1D2024] px-3 py-2 text-xs text-white outline-none">
                  <option value={1}>1 week</option>
                  <option value={2}>2 weeks</option>
                  <option value={3}>3 weeks</option>
                  <option value={4}>4 weeks</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.06] pt-4">
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-lg border border-white/[0.06] px-4 py-2 text-xs font-bold text-white hover:bg-white/5">Cancel</button>
              <button type="submit" className="rounded-lg bg-[#5BB98C] px-4 py-2 text-xs font-bold text-[#111315]">
                {createSprintMutation.isPending || editSprintMutation.isPending ? 'Saving...' : 'Save Sprint'}
              </button>
            </div>
          </form>
        </div>
      )}
    </MainLayout>
  )
}
