'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import { milestoneService, Milestone } from '@/services/milestone'
import { projectService } from '@/services/project'
import { taskService, TaskResponse } from '@/services/task'
import {
  Award,
  Calendar,
  Goal,
  Loader,
  Plus,
  Trash2,
  FolderOpen,
  ChevronRight,
  Clock,
  User,
  Archive,
  ArchiveRestore,
  LayoutGrid,
  CheckCircle2,
  Sparkles
} from 'lucide-react'

export default function MilestonesPage() {
  const queryClient = useQueryClient()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  
  // Create Milestone State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDueDate, setNewDueDate] = useState('')

  // Toggle view for archived milestones
  const [showArchived, setShowArchived] = useState(false)

  // Load Projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects()
  })

  // Load Milestones
  const { data: milestones = [], isLoading: loadingMilestones } = useQuery({
    queryKey: ['milestones', selectedProjectId, showArchived],
    queryFn: () => milestoneService.getMilestones(selectedProjectId, { is_archived: showArchived }),
    enabled: !!selectedProjectId
  })

  // Load Project Tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', { project_id: selectedProjectId }],
    queryFn: () => taskService.getTasks(selectedProjectId),
    enabled: !!selectedProjectId
  })

  // Mutations
  const createMilestoneMutation = useMutation({
    mutationFn: (data: { project_id: string; title: string; description?: string; due_date?: string }) =>
      milestoneService.createMilestone(data),
    onSuccess: () => {
      setIsCreateOpen(false)
      setNewTitle('')
      setNewDescription('')
      setNewDueDate('')
      queryClient.invalidateQueries({ queryKey: ['milestones', selectedProjectId] })
    }
  })

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Milestone> }) =>
      milestoneService.updateMilestone(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', selectedProjectId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-unified'] })
    }
  })

  const deleteMilestoneMutation = useMutation({
    mutationFn: milestoneService.deleteMilestone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', selectedProjectId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: selectedProjectId }] })
    }
  })

  const assignTaskMutation = useMutation({
    mutationFn: (data: { milestoneId: string; taskId: string }) =>
      milestoneService.assignTasksToMilestone(data.milestoneId, [data.taskId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: selectedProjectId }] })
      queryClient.invalidateQueries({ queryKey: ['milestones', selectedProjectId] })
    }
  })

  const removeTaskMutation = useMutation({
    // Patch task's milestone_id to null
    mutationFn: (taskId: string) => taskService.updateTask(taskId, { milestone_id: null } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: selectedProjectId }] })
      queryClient.invalidateQueries({ queryKey: ['milestones', selectedProjectId] })
    }
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    createMilestoneMutation.mutate({
      project_id: selectedProjectId,
      title: newTitle,
      description: newDescription || undefined,
      due_date: newDueDate || undefined
    })
  }

  // Backlog tasks not assigned to any milestone
  const backlogTasks = tasks.filter((t) => !t.milestone_id)

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <Award className="h-6 w-6 text-[#5BB98C]" /> Milestones & Release Targets
            </h1>
            <p className="text-xs text-[#A7ADB5] mt-1">Track target milestones, deadlines, and project releases.</p>
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
              <>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs font-semibold text-[#A7ADB5] hover:text-white transition-colors cursor-pointer"
                >
                  {showArchived ? 'Show Active' : 'Show Archived'}
                </button>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-4 py-2.5 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  <Plus className="h-4 w-4" /> Create Milestone
                </button>
              </>
            )}
          </div>
        </div>

        {!selectedProjectId ? (
          <div className="border border-dashed border-white/[0.06] rounded-2xl p-12 text-center space-y-2 bg-[#171A1D]/20">
            <Award className="h-10 w-10 text-[#7E848C] mx-auto opacity-40 animate-pulse" />
            <p className="text-sm font-semibold text-white">No Project Selected</p>
            <p className="text-xs text-[#A7ADB5]">Choose a project from the dropdown filter to manage and view milestones.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Milestones Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {loadingMilestones ? (
                <div className="flex justify-center py-10"><Loader className="h-6 w-6 text-[#5BB98C] animate-spin" /></div>
              ) : milestones.length === 0 ? (
                <div className="border border-dashed border-white/[0.06] rounded-2xl p-12 text-center space-y-2">
                  <FolderOpen className="h-8 w-8 text-[#7E848C]/40 mx-auto" />
                  <p className="text-xs font-bold text-white">No Milestones Stored</p>
                  <p className="text-[10px] text-[#A7ADB5]">Create a milestone to assign tasks and define target timeline cycles.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {milestones.map((ms) => {
                    const milestoneTasks = tasks.filter((t) => t.milestone_id === ms.id)
                    const completedTasks = milestoneTasks.filter((t) => t.completed).length
                    const totalTasks = milestoneTasks.length
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
                    
                    return (
                      <div key={ms.id} className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 space-y-4 hover:border-white/10 transition-all shadow-sm">
                        <div className="flex items-start justify-between gap-3 border-b border-white/[0.04] pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                ms.status === 'Completed' ? 'bg-[#5BB98C]/15 text-[#5BB98C]' : 'bg-orange-500/10 text-orange-400'
                              }`}>
                                {ms.status}
                              </span>
                              {ms.is_archived && (
                                <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-[#7E848C]/25 text-[#7E848C] uppercase">Archived</span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-white mt-1">{ms.title}</h3>
                            <p className="text-[11px] text-[#A7ADB5]">{ms.description || 'No description provided.'}</p>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {ms.status !== 'Completed' && (
                              <button
                                onClick={() => updateMilestoneMutation.mutate({ id: ms.id, updates: { status: 'Completed' } })}
                                className="p-1 rounded bg-[#5BB98C]/10 border border-[#5BB98C]/25 text-[#5BB98C] hover:bg-[#5BB98C]/20 transition-all text-[10px] font-bold"
                                title="Mark Completed"
                              >
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() => updateMilestoneMutation.mutate({ id: ms.id, updates: { is_archived: !ms.is_archived } })}
                              className="p-1.5 rounded hover:bg-white/5 text-[#A7ADB5] hover:text-white"
                              title={ms.is_archived ? 'Restore' : 'Archive'}
                            >
                              {ms.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete milestone? Tasks will return to backlog.')) {
                                  deleteMilestoneMutation.mutate(ms.id)
                                }
                              }}
                              className="p-1.5 rounded hover:bg-red-500/10 text-[#7E848C] hover:text-[#EB5757]"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar & Target Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-[#A7ADB5] font-semibold">
                              <span>Milestone Progress</span>
                              <span className="text-[#5BB98C]">{progress}%</span>
                            </div>
                            <div className="w-full bg-[#1D2024] border border-white/[0.04] h-2 rounded-full overflow-hidden">
                              <div className="bg-[#5BB98C] h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                          </div>

                          <div className="text-[10px] text-[#A7ADB5] md:text-right space-y-0.5">
                            {ms.due_date ? (
                              <span className="flex items-center gap-1.5 md:justify-end">
                                <Calendar className="h-3.5 w-3.5 text-[#5BB98C]" /> Deadline: {new Date(ms.due_date).toLocaleDateString()}
                              </span>
                            ) : (
                              <span>No deadline specified.</span>
                            )}
                            <span className="block text-[9px] text-[#7E848C]">Associated tasks: {totalTasks} ({completedTasks} completed)</span>
                          </div>
                        </div>

                        {/* Associated Tasks list */}
                        <div className="space-y-1.5 pt-2">
                          <h4 className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Milestone Tasks Backlog</h4>
                          {milestoneTasks.map((t) => (
                            <div key={t.id} className="flex items-center justify-between p-2.5 bg-[#1D2024]/80 border border-white/[0.02] rounded-xl hover:border-white/[0.05] transition-all">
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${t.completed ? 'bg-[#5BB98C]' : 'bg-[#F2C94C]'}`} />
                                <span className={`text-xs text-white ${t.completed ? 'line-through opacity-60' : ''}`}>{t.title}</span>
                              </div>
                              <button
                                onClick={() => removeTaskMutation.mutate(t.id)}
                                className="text-[9px] font-bold text-[#EB5757] hover:text-red-400 cursor-pointer"
                              >
                                Evict
                              </button>
                            </div>
                          ))}
                          {milestoneTasks.length === 0 && (
                            <p className="text-[10px] text-[#7E848C] italic py-1">No tasks assigned to this milestone.</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

            </div>

            {/* Backlog / Allocation Drawer */}
            <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 space-y-4 h-fit">
              <div>
                <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-1.5">
                  <LayoutGrid className="h-4 w-4 text-[#5BB98C]" /> Unallocated Tasks
                </h2>
                <p className="text-[10px] text-[#A7ADB5] mt-1">Assign unallocated project tasks to milestones targets.</p>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {backlogTasks.map((task) => (
                  <div key={task.id} className="p-3 bg-[#1D2024]/80 border border-white/[0.04] rounded-xl hover:border-white/10 transition-all flex flex-col gap-2">
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">{task.title}</p>
                      {task.due_date && (
                        <span className="text-[9px] text-[#7E848C] flex items-center gap-0.5 mt-1">
                          <Clock className="h-2.5 w-2.5" /> Due: {task.due_date}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/[0.04] pt-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        task.completed ? 'bg-[#5BB98C]/10 text-[#5BB98C]' : 'bg-[#F2C94C]/10 text-[#F2C94C]'
                      }`}>
                        {task.status}
                      </span>

                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            assignTaskMutation.mutate({ milestoneId: e.target.value, taskId: task.id })
                          }
                        }}
                        defaultValue=""
                        className="bg-[#171A1D] border border-white/[0.06] text-[9px] text-white px-2 py-1 rounded-md cursor-pointer outline-none"
                      >
                        <option value="">Link Milestone...</option>
                        {milestones.filter(m => !m.is_archived).map(m => (
                          <option key={m.id} value={m.id}>{m.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {backlogTasks.length === 0 && (
                  <p className="text-xs text-[#7E848C] italic py-6 text-center">All project tasks assigned to milestones!</p>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Create Milestone Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-left">
          <div className="w-full max-w-md bg-[#171A1D] border border-white/[0.06] rounded-2xl p-6 relative">
            <h3 className="text-base font-bold text-white mb-4">Create Release Milestone</h3>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A7ADB5] uppercase">Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Release Target"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A7ADB5] uppercase">Description</label>
                <textarea
                  placeholder="What scope is targeted for this milestone?"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A7ADB5] uppercase">Target Deadline</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] text-xs text-white rounded-xl outline-none cursor-pointer"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-white/[0.06] hover:bg-[#23272B] text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMilestoneMutation.isPending}
                  className="px-4 py-2 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold rounded-xl text-xs cursor-pointer"
                >
                  {createMilestoneMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
