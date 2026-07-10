'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import { sprintService, Sprint, SprintStats } from '@/services/sprint'
import { projectService } from '@/services/project'
import { taskService, TaskResponse } from '@/services/task'
import {
  Zap,
  Calendar,
  Goal,
  Loader,
  Plus,
  Play,
  CheckCircle,
  FolderKanban,
  Trash2,
  ChevronRight,
  TrendingDown,
  ArrowRight,
  Clock,
  User,
  ArrowLeftRight
} from 'lucide-react'

export default function SprintsPage() {
  const queryClient = useQueryClient()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  
  // Create Sprint Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newSprintName, setNewSprintName] = useState('')
  const [newSprintGoal, setNewSprintGoal] = useState('')
  const [newSprintDuration, setNewSprintDuration] = useState(2)

  // Load Projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects()
  })

  // Load Sprints for selected Project
  const { data: sprints = [], isLoading: loadingSprints } = useQuery({
    queryKey: ['sprints', selectedProjectId],
    queryFn: () => sprintService.getSprints(selectedProjectId),
    enabled: !!selectedProjectId
  })

  // Load all project tasks to isolate Backlog vs Sprint allocations
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks', { project_id: selectedProjectId }],
    queryFn: () => taskService.getTasks(selectedProjectId),
    enabled: !!selectedProjectId
  })

  // Mutations
  const createSprintMutation = useMutation({
    mutationFn: (data: { project_id: string; name: string; goal?: string; duration_weeks: number }) =>
      sprintService.createSprint(data),
    onSuccess: () => {
      setIsCreateOpen(false)
      setNewSprintName('')
      setNewSprintGoal('')
      setNewSprintDuration(2)
      queryClient.invalidateQueries({ queryKey: ['sprints', selectedProjectId] })
    }
  })

  const updateSprintMutation = useMutation({
    mutationFn: (data: { id: string; status: 'Active' | 'Completed'; duration_weeks?: number }) =>
      sprintService.updateSprint(data.id, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', selectedProjectId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: selectedProjectId }] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-unified'] })
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to update sprint status.')
    }
  })

  const assignTaskMutation = useMutation({
    mutationFn: (data: { sprintId: string; taskId: string }) =>
      sprintService.addTasksToSprint(data.sprintId, [data.taskId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: selectedProjectId }] })
      queryClient.invalidateQueries({ queryKey: ['sprints', selectedProjectId] })
    }
  })

  const removeTaskMutation = useMutation({
    mutationFn: (data: { sprintId: string; taskId: string }) =>
      sprintService.removeTaskFromSprint(data.sprintId, data.taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: selectedProjectId }] })
      queryClient.invalidateQueries({ queryKey: ['sprints', selectedProjectId] })
    }
  })

  const deleteSprintMutation = useMutation({
    mutationFn: (id: string) => sprintService.deleteSprint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', selectedProjectId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: selectedProjectId }] })
    }
  })

  // Group sprints by status
  const activeSprint = sprints.find((s) => s.status === 'Active')
  const plannedSprints = sprints.filter((s) => s.status === 'Planned')
  const completedSprints = sprints.filter((s) => s.status === 'Completed')

  // Filter tasks into Backlog (unassigned) and Sprint allocations
  const backlogTasks = tasks.filter((t) => !t.sprint_id)

  // Fetch stats for active sprint
  const { data: activeStats } = useQuery<SprintStats>({
    queryKey: ['sprint-stats', activeSprint?.id],
    queryFn: () => sprintService.getSprintStats(activeSprint!.id),
    enabled: !!activeSprint?.id
  })

  const handleCreateSprintSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSprintName.trim()) return
    createSprintMutation.mutate({
      project_id: selectedProjectId,
      name: newSprintName,
      goal: newSprintGoal || undefined,
      duration_weeks: newSprintDuration
    })
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <Zap className="h-6 w-6 text-[#5BB98C]" /> Agile Sprint Planner
            </h1>
            <p className="text-xs text-[#A7ADB5] mt-1">Structure project cycles, define goals, and monitor sprint velocity.</p>
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
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2.5 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create Sprint
              </button>
            )}
          </div>
        </div>

        {!selectedProjectId ? (
          <div className="border border-dashed border-white/[0.06] rounded-2xl p-12 text-center space-y-2">
            <FolderKanban className="h-10 w-10 text-[#7E848C] mx-auto opacity-40" />
            <p className="text-sm font-semibold text-white">No Project Selected</p>
            <p className="text-xs text-[#A7ADB5]">Choose a project from the dropdown filter to manage sprints.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sprints Board Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Active Sprint Section */}
              {activeSprint ? (
                <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
                    <div>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#5BB98C]/10 text-[#5BB98C] border border-[#5BB98C]/20 uppercase">
                        Active Sprint
                      </span>
                      <h2 className="text-base font-bold text-[#F5F5F5] mt-1.5">{activeSprint.name}</h2>
                      {activeSprint.goal && (
                        <p className="text-xs text-[#A7ADB5] flex items-center gap-1.5 mt-1">
                          <Goal className="h-3.5 w-3.5 text-[#5BB98C]" /> Goal: {activeSprint.goal}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => updateSprintMutation.mutate({ id: activeSprint.id, status: 'Completed' })}
                      className="px-3.5 py-1.5 bg-[#5BB98C]/10 hover:bg-[#5BB98C]/20 text-[#5BB98C] border border-[#5BB98C]/20 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Complete Sprint
                    </button>
                  </div>

                  {activeStats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Metric cards */}
                      <div className="bg-[#1D2024] p-3.5 rounded-xl border border-white/[0.04]">
                        <span className="text-[10px] text-[#A7ADB5] block">Completion Rate</span>
                        <span className="text-xl font-bold text-white mt-1 block">{activeStats.completion_percentage}%</span>
                        <div className="w-full bg-[#2E3339] h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-[#5BB98C] h-1.5 rounded-full transition-all" style={{ width: `${activeStats.completion_percentage}%` }} />
                        </div>
                      </div>

                      <div className="bg-[#1D2024] p-3.5 rounded-xl border border-white/[0.04]">
                        <span className="text-[10px] text-[#A7ADB5] block">Allocated Work</span>
                        <span className="text-xl font-bold text-white mt-1 block">{activeStats.total_tasks} Tasks</span>
                        <span className="text-[9px] text-[#7E848C] mt-1 block">{activeStats.completed_tasks} completed / {activeStats.remaining_tasks} remaining</span>
                      </div>

                      {/* Burndown chart */}
                      <div className="bg-[#1D2024] p-3.5 rounded-xl border border-white/[0.04] flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#A7ADB5]">Burndown Trend</span>
                          <TrendingDown className="h-3 w-3 text-[#5BB98C]" />
                        </div>
                        <div className="flex items-end gap-1.5 h-10 mt-2">
                          {activeStats.burndown.map((pt, idx) => (
                            <div
                              key={idx}
                              title={`${pt.day}: ${pt.remaining} tasks remaining`}
                              className="bg-[#5BB98C] w-full rounded-t-sm transition-all hover:bg-[#5BB98C]/80 cursor-pointer"
                              style={{ height: `${Math.max(10, (pt.remaining / Math.max(activeStats.total_tasks, 1)) * 100)}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Sprint Tasks */}
                  <div className="space-y-2 mt-4">
                    <h3 className="text-xs font-bold text-[#A7ADB5]">Sprint Backlog Tasks</h3>
                    {tasks.filter((t) => t.sprint_id === activeSprint.id).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-[#1D2024] border border-white/[0.04] rounded-xl hover:border-white/10 transition-all"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              task.completed ? 'bg-[#5BB98C]/10 text-[#5BB98C]' : 'bg-[#F2C94C]/10 text-[#F2C94C]'
                            }`}>
                              {task.status}
                            </span>
                            {task.assignee && (
                              <span className="text-[9px] text-[#7E848C] flex items-center gap-0.5">
                                <User className="h-2.5 w-2.5" /> {task.assignee.full_name}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => removeTaskMutation.mutate({ sprintId: activeSprint.id, taskId: task.id })}
                          className="p-1 rounded-lg hover:bg-white/5 text-[#7E848C] hover:text-[#EB5757] transition-all cursor-pointer"
                          title="Evict to Project Backlog"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {tasks.filter((t) => t.sprint_id === activeSprint.id).length === 0 && (
                      <p className="text-xs text-[#7E848C] italic py-3 text-center">No tasks currently allocated. Drag or assign tasks from project backlog.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-6 text-center space-y-2">
                  <Play className="h-7 w-7 text-[#7E848C] mx-auto opacity-40" />
                  <p className="text-xs font-bold text-white">No Active Sprint</p>
                  <p className="text-[10px] text-[#A7ADB5]">Ready to start? Select a planned sprint below to run the cycle.</p>
                </div>
              )}

              {/* Planned/Backlog Sprints */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">Planned Milestones ({plannedSprints.length})</h2>
                {plannedSprints.map((sprint) => {
                  const sprintTasks = tasks.filter((t) => t.sprint_id === sprint.id)
                  return (
                    <div key={sprint.id} className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-white">{sprint.name}</h3>
                          <p className="text-[10px] text-[#7E848C] mt-0.5">Duration: {sprint.duration_weeks} Weeks | Goal: {sprint.goal || 'No goal set'}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateSprintMutation.mutate({ id: sprint.id, status: 'Active' })}
                            className="px-2.5 py-1 bg-[#5BB98C]/10 hover:bg-[#5BB98C]/20 border border-[#5BB98C]/20 text-[#5BB98C] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Start Sprint
                          </button>
                          <button
                            onClick={() => deleteSprintMutation.mutate(sprint.id)}
                            className="p-1 rounded-lg hover:bg-white/5 text-[#7E848C] hover:text-[#EB5757] transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Tasks list */}
                      <div className="space-y-1.5">
                        {sprintTasks.map((t) => (
                          <div key={t.id} className="flex items-center justify-between p-2.5 bg-[#1D2024] rounded-lg border border-white/[0.02]">
                            <span className="text-[11px] text-[#F5F5F5]">{t.title}</span>
                            <button
                              onClick={() => removeTaskMutation.mutate({ sprintId: sprint.id, taskId: t.id })}
                              className="text-[9px] font-bold text-[#A7ADB5] hover:text-white"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        {sprintTasks.length === 0 && (
                          <p className="text-[10px] text-[#7E848C] italic text-center py-2">No tasks allocated to this sprint.</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Completed Sprints list */}
              {completedSprints.length > 0 && (
                <div className="pt-4 border-t border-white/[0.06] space-y-2">
                  <h3 className="text-xs font-bold text-[#A7ADB5] uppercase tracking-wider">Completed Sprints ({completedSprints.length})</h3>
                  <div className="space-y-2">
                    {completedSprints.map((s) => (
                      <div key={s.id} className="p-3.5 bg-[#171A1D] border border-white/[0.04] rounded-xl flex items-center justify-between opacity-70">
                        <div>
                          <p className="text-xs font-bold text-[#F5F5F5]">{s.name}</p>
                          <p className="text-[9px] text-[#7E848C]">Duration: {s.duration_weeks} Weeks | Completed: {s.end_date?.slice(0,10)}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[8px] bg-white/5 border border-white/10 text-white font-bold uppercase">Completed</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Backlog Column Drawer */}
            <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-[#F5F5F5]">Project Backlog</h2>
                <p className="text-[10px] text-[#A7ADB5] mt-1">Unassigned workspace tasks ready for sprint allocation.</p>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {backlogTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-[#1D2024] border border-white/[0.04] rounded-xl hover:border-white/10 transition-all flex flex-col gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{task.title}</p>
                      {task.due_date && (
                        <span className="text-[9px] text-[#7E848C] flex items-center gap-0.5 mt-1">
                          <Clock className="h-2.5 w-2.5" /> Due: {task.due_date}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/[0.04] pt-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        task.priority === 'High' || task.priority === 'Urgent'
                          ? 'bg-[#EB5757]/10 text-[#EB5757]'
                          : 'bg-[#7E848C]/10 text-[#7E848C]'
                      }`}>
                        {task.priority}
                      </span>

                      {/* Allocator options */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            assignTaskMutation.mutate({ sprintId: e.target.value, taskId: task.id })
                          }
                        }}
                        defaultValue=""
                        className="bg-[#171A1D] border border-white/[0.06] text-[9px] text-white px-2 py-1 rounded-md outline-none cursor-pointer hover:bg-[#23272B]"
                      >
                        <option value="">Move to...</option>
                        {sprints.filter(s => s.status !== 'Completed').map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {backlogTasks.length === 0 && (
                  <p className="text-xs text-[#7E848C] italic text-center py-6">No backlog tasks. Create a task to allocate.</p>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Create Sprint Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-left">
          <div className="w-full max-w-md bg-[#171A1D] border border-white/[0.06] rounded-2xl p-6 relative">
            <h3 className="text-base font-bold text-white mb-4">Create Sprint Backlog</h3>
            
            <form onSubmit={handleCreateSprintSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A7ADB5] uppercase">Sprint Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 1: Foundation Setup"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A7ADB5] uppercase">Sprint Goal</label>
                <textarea
                  placeholder="What is the objective of this sprint?"
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A7ADB5] uppercase">Duration (Weeks)</label>
                <select
                  value={newSprintDuration}
                  onChange={(e) => setNewSprintDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] text-xs text-white rounded-xl outline-none"
                >
                  <option value={1}>1 Week</option>
                  <option value={2}>2 Weeks (Default)</option>
                  <option value={3}>3 Weeks</option>
                  <option value={4}>4 Weeks</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-white/[0.06] hover:bg-[#23272B] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSprintMutation.isPending}
                  className="px-4 py-2 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {createSprintMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
