'use client'

import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Archive,
  ArchiveRestore,
  Award,
  Calendar,
  CheckCircle2,
  Edit3,
  Loader,
  Plus,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { milestoneService, Milestone } from '@/services/milestone'
import { projectService } from '@/services/project'
import { taskService, TaskResponse } from '@/services/task'

type MilestoneForm = {
  title: string
  description: string
  due_date: string
  status: string
}

const emptyForm: MilestoneForm = {
  title: '',
  description: '',
  due_date: '',
  status: 'Planned',
}

function formatDate(value?: string | null) {
  if (!value) return 'No due date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No due date'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function completed(task: TaskResponse) {
  return task.completed || ['Done', 'Completed', 'Closed'].includes(task.status)
}

export default function MilestonesPage() {
  const queryClient = useQueryClient()
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [form, setForm] = useState<MilestoneForm>(emptyForm)

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  })

  const { data: milestones = [], isLoading: loadingMilestones } = useQuery({
    queryKey: ['milestones', selectedProjectId, showArchived],
    queryFn: () => milestoneService.getMilestones(selectedProjectId, { is_archived: showArchived }),
    enabled: !!selectedProjectId,
  })

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks', { project_id: selectedProjectId }],
    queryFn: () => taskService.getTasks(selectedProjectId),
    enabled: !!selectedProjectId,
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['milestones', selectedProjectId] })
    queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: selectedProjectId }] })
    queryClient.invalidateQueries({ queryKey: ['upcoming-milestones'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      milestoneService.createMilestone({
        project_id: selectedProjectId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
        status: form.status,
      }),
    onSuccess: () => {
      setIsFormOpen(false)
      setForm(emptyForm)
      refresh()
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      milestoneService.updateMilestone(editingMilestone!.id, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        status: form.status,
      } as Partial<Milestone>),
    onSuccess: () => {
      setIsFormOpen(false)
      setEditingMilestone(null)
      setForm(emptyForm)
      refresh()
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (milestone: Milestone) =>
      milestone.is_archived
        ? milestoneService.updateMilestone(milestone.id, { is_archived: false } as Partial<Milestone>)
        : milestoneService.archiveMilestone(milestone.id),
    onSuccess: refresh,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => milestoneService.deleteMilestone(id),
    onSuccess: refresh,
  })

  const assignTaskMutation = useMutation({
    mutationFn: ({ milestoneId, taskId }: { milestoneId: string; taskId: string }) =>
      milestoneService.assignTasksToMilestone(milestoneId, [taskId]),
    onSuccess: refresh,
  })

  const removeTaskMutation = useMutation({
    mutationFn: ({ milestoneId, taskId }: { milestoneId: string; taskId: string }) =>
      milestoneService.removeTaskFromMilestone(milestoneId, taskId),
    onSuccess: refresh,
  })

  const openCreate = () => {
    setEditingMilestone(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  const openEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setForm({
      title: milestone.title,
      description: milestone.description || '',
      due_date: milestone.due_date?.slice(0, 10) || '',
      status: milestone.status,
    })
    setIsFormOpen(true)
  }

  const submitForm = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim() || !selectedProjectId) return
    if (editingMilestone) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  const backlogTasks = tasks.filter((task) => !task.milestone_id && !task.is_archived)

  const renderMilestone = (milestone: Milestone) => {
    const milestoneTasks = tasks.filter((task) => task.milestone_id === milestone.id)
    const completedTasks = milestoneTasks.filter(completed)
    const progress = milestoneTasks.length > 0 ? Math.round((completedTasks.length / milestoneTasks.length) * 100) : 0
    const timeline = [
      { label: 'Created', value: formatDate(milestone.created_at), done: true },
      { label: 'Tasks Assigned', value: `${milestoneTasks.length} tasks`, done: milestoneTasks.length > 0 },
      { label: 'Due Date', value: formatDate(milestone.due_date), done: milestone.status === 'Completed' },
    ]

    return (
      <section key={milestone.id} className="rounded-2xl border border-white/[0.06] bg-[#171A1D] p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.04] pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${
                milestone.status === 'Completed' ? 'bg-[#5BB98C]/15 text-[#5BB98C]' : 'bg-[#F2C94C]/10 text-[#F2C94C]'
              }`}>
                {milestone.status}
              </span>
              {milestone.is_archived && (
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase text-[#A7ADB5]">Archived</span>
              )}
            </div>
            <h2 className="mt-2 text-base font-bold text-white">{milestone.title}</h2>
            <p className="mt-1 text-xs leading-5 text-[#A7ADB5]">{milestone.description || 'No description provided.'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openEdit(milestone)} className="rounded-lg border border-white/[0.06] p-2 text-[#A7ADB5] hover:bg-white/5 hover:text-white" title="Edit milestone">
              <Edit3 className="h-4 w-4" />
            </button>
            {milestone.status !== 'Completed' && (
              <button onClick={() => milestoneService.updateMilestone(milestone.id, { status: 'Completed' } as Partial<Milestone>).then(refresh)} className="rounded-lg border border-[#5BB98C]/20 bg-[#5BB98C]/10 px-3 py-2 text-xs font-bold text-[#5BB98C]">
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> Complete
              </button>
            )}
            <button onClick={() => archiveMutation.mutate(milestone)} className="rounded-lg border border-white/[0.06] p-2 text-[#A7ADB5] hover:bg-white/5 hover:text-[#F2C94C]" title={milestone.is_archived ? 'Restore' : 'Archive'}>
              {milestone.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            </button>
            <button onClick={() => deleteMutation.mutate(milestone.id)} className="rounded-lg border border-white/[0.06] p-2 text-[#A7ADB5] hover:bg-white/5 hover:text-[#EB5757]" title="Delete milestone">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/[0.04] bg-[#1D2024] p-3">
            <p className="text-[10px] uppercase text-[#7E848C]">Progress</p>
            <p className="mt-1 text-xl font-bold text-white">{progress}%</p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-[#1D2024] p-3">
            <p className="text-[10px] uppercase text-[#7E848C]">Tasks</p>
            <p className="mt-1 text-xl font-bold text-white">{completedTasks.length}/{milestoneTasks.length}</p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-[#1D2024] p-3">
            <p className="text-[10px] uppercase text-[#7E848C]">Due Date</p>
            <p className="mt-1 text-sm font-bold text-white">{formatDate(milestone.due_date)}</p>
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[#2E3339]">
          <div className="h-full rounded-full bg-[#5BB98C]" style={{ width: `${progress}%` }} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#A7ADB5]">Assigned Tasks</h3>
            {milestoneTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-[#1D2024] px-3 py-2">
                <div className="min-w-0">
                  <p className={`truncate text-xs font-semibold text-white ${completed(task) ? 'line-through opacity-60' : ''}`}>{task.title}</p>
                  <p className="mt-1 text-[10px] text-[#7E848C]">{task.status} · {task.priority}</p>
                </div>
                <button onClick={() => removeTaskMutation.mutate({ milestoneId: milestone.id, taskId: task.id })} className="text-[10px] font-bold text-[#A7ADB5] hover:text-[#EB5757]">
                  Remove
                </button>
              </div>
            ))}
            {milestoneTasks.length === 0 && (
              <p className="rounded-xl border border-dashed border-white/[0.06] py-5 text-center text-xs text-[#7E848C]">No tasks assigned.</p>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-[#1D2024] p-4">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#A7ADB5]">Timeline</h3>
            <div className="space-y-3">
              {timeline.map((item) => (
                <div key={item.label} className="flex gap-3">
                  <span className={`mt-1 h-2 w-2 rounded-full ${item.done ? 'bg-[#5BB98C]' : 'bg-[#7E848C]'}`} />
                  <div>
                    <p className="text-xs font-bold text-white">{item.label}</p>
                    <p className="text-[10px] text-[#7E848C]">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
              <Award className="h-6 w-6 text-[#5BB98C]" /> Milestones
            </h1>
            <p className="mt-1 text-xs text-[#A7ADB5]">Manage due dates, scope, task assignment, progress, and timelines.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="rounded-xl border border-white/[0.06] bg-[#171A1D] px-3 py-2.5 text-xs text-white outline-none">
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            <button onClick={() => setShowArchived(!showArchived)} disabled={!selectedProjectId} className="rounded-xl border border-white/[0.06] bg-[#1D2024] px-3 py-2.5 text-xs font-semibold text-[#A7ADB5] disabled:opacity-50">
              {showArchived ? 'Show Active' : 'Show Archived'}
            </button>
            <button onClick={openCreate} disabled={!selectedProjectId} className="rounded-xl bg-[#5BB98C] px-4 py-2.5 text-xs font-bold text-[#111315] disabled:opacity-50">
              <Plus className="mr-1 inline h-4 w-4" /> Create Milestone
            </button>
          </div>
        </header>

        {!selectedProjectId ? (
          <div className="rounded-2xl border border-dashed border-white/[0.06] bg-[#171A1D]/20 p-12 text-center">
            <Target className="mx-auto h-10 w-10 text-[#7E848C]" />
            <p className="mt-3 text-sm font-semibold text-white">Select a project to manage milestones.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <main className="space-y-4">
              {loadingMilestones || loadingTasks ? (
                <div className="flex justify-center py-10">
                  <Loader className="h-6 w-6 animate-spin text-[#5BB98C]" />
                </div>
              ) : milestones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.06] p-12 text-center">
                  <p className="text-xs font-bold text-white">No milestones found.</p>
                  <p className="mt-1 text-[10px] text-[#A7ADB5]">Create a milestone to define target scope and timeline.</p>
                </div>
              ) : (
                milestones.map(renderMilestone)
              )}
            </main>

            <aside className="h-fit rounded-2xl border border-white/[0.06] bg-[#171A1D] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">Unassigned Tasks</h2>
                  <p className="mt-1 text-[10px] text-[#A7ADB5]">Assign project tasks to milestones.</p>
                </div>
                <Calendar className="h-5 w-5 text-[#5BB98C]" />
              </div>
              <div className="mt-4 max-h-[680px] space-y-2 overflow-y-auto pr-1">
                {backlogTasks.map((task) => (
                  <div key={task.id} className="rounded-xl border border-white/[0.04] bg-[#1D2024] p-3">
                    <p className="text-xs font-bold text-white">{task.title}</p>
                    <p className="mt-1 text-[10px] text-[#7E848C]">{task.status} · {task.priority}</p>
                    <select
                      defaultValue=""
                      onChange={(event) => {
                        if (event.target.value) {
                          assignTaskMutation.mutate({ milestoneId: event.target.value, taskId: task.id })
                          event.currentTarget.value = ''
                        }
                      }}
                      className="mt-3 w-full rounded-lg border border-white/[0.06] bg-[#171A1D] px-2 py-1.5 text-[10px] text-white outline-none"
                    >
                      <option value="">Assign to milestone</option>
                      {milestones.filter((milestone) => !milestone.is_archived).map((milestone) => (
                        <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
                      ))}
                    </select>
                  </div>
                ))}
                {backlogTasks.length === 0 && (
                  <p className="rounded-xl border border-dashed border-white/[0.06] py-8 text-center text-xs text-[#7E848C]">No unassigned tasks.</p>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={submitForm} className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-[#171A1D] p-6 text-left">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editingMilestone ? 'Edit Milestone' : 'Create Milestone'}</h2>
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-lg p-1 text-[#A7ADB5] hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <label className="space-y-1 block">
                <span className="text-[10px] font-bold uppercase text-[#A7ADB5]">Title</span>
                <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full rounded-xl border border-white/[0.06] bg-[#1D2024] px-3 py-2 text-xs text-white outline-none" />
              </label>
              <label className="space-y-1 block">
                <span className="text-[10px] font-bold uppercase text-[#A7ADB5]">Description</span>
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="w-full resize-none rounded-xl border border-white/[0.06] bg-[#1D2024] px-3 py-2 text-xs text-white outline-none" />
              </label>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1 block">
                  <span className="text-[10px] font-bold uppercase text-[#A7ADB5]">Due Date</span>
                  <input type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} className="w-full rounded-xl border border-white/[0.06] bg-[#1D2024] px-3 py-2 text-xs text-white outline-none" />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[10px] font-bold uppercase text-[#A7ADB5]">Status</span>
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="w-full rounded-xl border border-white/[0.06] bg-[#1D2024] px-3 py-2 text-xs text-white outline-none">
                    <option value="Planned">Planned</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.06] pt-4">
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-white/[0.06] px-4 py-2 text-xs font-bold text-white hover:bg-white/5">Cancel</button>
              <button type="submit" className="rounded-xl bg-[#5BB98C] px-4 py-2 text-xs font-bold text-[#111315]">
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Milestone'}
              </button>
            </div>
          </form>
        </div>
      )}
    </MainLayout>
  )
}
