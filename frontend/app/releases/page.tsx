'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import { releaseService, Release } from '@/services/release'
import { projectService } from '@/services/project'
import { taskService, TaskResponse } from '@/services/task'
import {
  Rocket,
  Calendar,
  Layers,
  Loader,
  Plus,
  Trash2,
  ChevronRight,
  Clock,
  Archive,
  BookOpen,
  LayoutGrid,
  CheckCircle2,
  History,
  GitCommit,
  Tag,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

export default function ReleasesPage() {
  const queryClient = useQueryClient()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  
  // Create Release State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newVersion, setNewVersion] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newStatus, setNewStatus] = useState('Draft')

  // Load Projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects()
  })

  // Load Releases
  const { data: releases = [], isLoading: loadingReleases } = useQuery({
    queryKey: ['releases', selectedProjectId],
    queryFn: () => releaseService.getReleases(selectedProjectId),
    enabled: !!selectedProjectId
  })

  // Load Project Tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', { project_id: selectedProjectId }],
    queryFn: () => taskService.getTasks(selectedProjectId),
    enabled: !!selectedProjectId
  })

  // Mutations
  const createReleaseMutation = useMutation({
    mutationFn: (data: { project_id: string; version: string; title: string; release_notes?: string; status?: string }) =>
      releaseService.createRelease(data),
    onSuccess: () => {
      setIsCreateOpen(false)
      setNewVersion('')
      setNewTitle('')
      setNewNotes('')
      setNewStatus('Draft')
      queryClient.invalidateQueries({ queryKey: ['releases', selectedProjectId] })
    }
  })

  const updateReleaseMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Release> }) =>
      releaseService.updateRelease(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases', selectedProjectId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: selectedProjectId }] })
    }
  })

  const deleteReleaseMutation = useMutation({
    mutationFn: releaseService.deleteRelease,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases', selectedProjectId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: selectedProjectId }] })
    }
  })

  const assignTaskMutation = useMutation({
    mutationFn: (data: { releaseId: string; taskId: string }) =>
      releaseService.assignTasksToRelease(data.releaseId, [data.taskId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: selectedProjectId }] })
      queryClient.invalidateQueries({ queryKey: ['releases', selectedProjectId] })
    }
  })

  const removeTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskService.updateTask(taskId, { release_id: null } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: selectedProjectId }] })
      queryClient.invalidateQueries({ queryKey: ['releases', selectedProjectId] })
    }
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newVersion.trim() || !newTitle.trim()) return
    createReleaseMutation.mutate({
      project_id: selectedProjectId,
      version: newVersion,
      title: newTitle,
      release_notes: newNotes || undefined,
      status: newStatus
    })
  }

  // Group releases
  const upcomingReleases = releases.filter(r => r.status !== 'Released')
  const completedReleases = releases.filter(r => r.status === 'Released')
  const unallocatedTasks = tasks.filter(t => !t.release_id)

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        
        {/* Header Block */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <Rocket className="h-6 w-6 text-[#5BB98C]" /> Release Management
            </h1>
            <p className="text-xs text-[#A7ADB5] mt-1">Plan upcoming releases, organize versions, and write changelogs.</p>
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
                className="px-4 py-2.5 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Plus className="h-4 w-4" /> Create Version
              </button>
            )}
          </div>
        </div>

        {!selectedProjectId ? (
          <div className="border border-dashed border-white/[0.06] rounded-2xl p-12 text-center space-y-2 bg-[#171A1D]/20">
            <Rocket className="h-10 w-10 text-[#7E848C] mx-auto opacity-40 animate-pulse" />
            <p className="text-sm font-semibold text-white">No Project Selected</p>
            <p className="text-xs text-[#A7ADB5]">Select a project above to inspect version targets and changelogs.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Column: Releases List & Timelines */}
            <div className="lg:col-span-2 space-y-8">
              
              {loadingReleases ? (
                <div className="flex justify-center py-10"><Loader className="h-6 w-6 text-[#5BB98C] animate-spin" /></div>
              ) : (
                <>
                  {/* Section 1: Upcoming Versions */}
                  <div className="space-y-4">
                    <h2 className="text-sm font-extrabold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                      <Tag className="h-4 w-4 text-[#5BB98C]" /> Upcoming Releases ({upcomingReleases.length})
                    </h2>

                    <div className="space-y-4">
                      {upcomingReleases.map((rel) => {
                        const relTasks = tasks.filter(t => t.release_id === rel.id)
                        const completedCount = relTasks.filter(t => t.completed).length
                        const pct = relTasks.length > 0 ? Math.round((completedCount / relTasks.length) * 100) : 0

                        return (
                          <div key={rel.id} className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 space-y-4 hover:border-white/10 transition-all shadow-sm">
                            <div className="flex items-start justify-between gap-3 border-b border-white/[0.04] pb-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-blue-500/10 text-blue-400">
                                    {rel.version}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-white/5 text-[#A7ADB5]">
                                    {rel.status}
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold text-white mt-1">{rel.title}</h3>
                                {rel.release_notes && (
                                  <div className="text-[11px] text-[#A7ADB5] bg-[#111315]/40 border border-white/[0.04] rounded-lg p-2.5 mt-2 font-mono whitespace-pre-wrap">
                                    {rel.release_notes}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => updateReleaseMutation.mutate({ id: rel.id, updates: { status: 'Released' } })}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#5BB98C] text-[#111315] hover:bg-[#5BB98C]/90 transition-all text-[10px] font-bold shadow-sm"
                                >
                                  Release Version
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Delete version? Tasks will return to backlog.')) {
                                      deleteReleaseMutation.mutate(rel.id)
                                    }
                                  }}
                                  className="p-2 rounded hover:bg-red-500/10 text-[#7E848C] hover:text-[#EB5757]"
                                  title="Delete Version"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-[#A7ADB5] font-semibold">
                                  <span>Task Scope Ready</span>
                                  <span className="text-[#5BB98C]">{pct}%</span>
                                </div>
                                <div className="w-full bg-[#1D2024] border border-white/[0.04] h-2 rounded-full overflow-hidden">
                                  <div className="bg-[#5BB98C] h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                              <div className="text-[9px] text-[#7E848C] md:text-right">
                                Scheduled version tasks: {relTasks.length} ({completedCount} completed)
                              </div>
                            </div>

                            {/* Release Scope list */}
                            <div className="space-y-1.5 pt-2">
                              <h4 className="text-[9px] font-extrabold text-[#7E848C] uppercase tracking-wider">Release Scope Tasks</h4>
                              {relTasks.map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-2.5 bg-[#1D2024]/80 border border-white/[0.02] rounded-xl">
                                  <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${t.completed ? 'bg-[#5BB98C]' : 'bg-[#F2C94C]'}`} />
                                    <span className="text-xs text-white">{t.title}</span>
                                  </div>
                                  <button
                                    onClick={() => removeTaskMutation.mutate(t.id)}
                                    className="text-[9px] font-bold text-[#EB5757] hover:text-red-400"
                                  >
                                    Evict
                                  </button>
                                </div>
                              ))}
                              {relTasks.length === 0 && (
                                <p className="text-[10px] text-[#7E848C] italic">No tasks allocated to this version yet.</p>
                              )}
                            </div>

                          </div>
                        )
                      })}
                      {upcomingReleases.length === 0 && (
                        <p className="text-xs text-[#7E848C] italic">No upcoming versions planned.</p>
                      )}
                    </div>
                  </div>

                  {/* Section 2: Completed Releases Timeline */}
                  <div className="space-y-4 pt-4">
                    <h2 className="text-sm font-extrabold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                      <History className="h-4 w-4 text-[#5BB98C]" /> Release History Timeline
                    </h2>

                    <div className="relative border-l border-white/[0.06] ml-4 pl-6 space-y-6">
                      {completedReleases.map((rel) => {
                        const relTasks = tasks.filter(t => t.release_id === rel.id)
                        return (
                          <div key={rel.id} className="relative group text-left">
                            {/* Visual Timeline Node */}
                            <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#111315] border-2 border-[#5BB98C]">
                              <CheckCircle className="h-2 w-2 text-[#5BB98C] fill-[#5BB98C]" />
                            </span>

                            <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-4.5 space-y-2 hover:border-[#5BB98C]/30 transition-all duration-200 shadow-sm">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] bg-[#5BB98C]/10 text-[#5BB98C] px-2 py-0.5 rounded font-extrabold uppercase">
                                    {rel.version}
                                  </span>
                                  <h3 className="text-xs font-bold text-white">{rel.title}</h3>
                                </div>
                                <span className="text-[9px] text-[#7E848C] flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> Released: {rel.released_at ? new Date(rel.released_at).toLocaleDateString() : 'Unknown'}
                                </span>
                              </div>

                              {rel.release_notes && (
                                <p className="text-xs text-[#A7ADB5] bg-[#111315]/40 border border-white/[0.04] p-3 rounded-xl font-mono whitespace-pre-wrap">
                                  {rel.release_notes}
                                </p>
                              )}

                              <div className="text-[9px] text-[#7E848C] pt-1">
                                Shipments: {relTasks.length} deliverables completed successfully.
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {completedReleases.length === 0 && (
                        <p className="text-xs text-[#7E848C] italic pl-2">No versions successfully released yet.</p>
                      )}
                    </div>
                  </div>

                </>
              )}

            </div>

            {/* Right Column: Unallocated Backlog Scope */}
            <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 space-y-4 h-fit">
              <div>
                <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-1.5">
                  <LayoutGrid className="h-4 w-4 text-[#5BB98C]" /> Unallocated Scope
                </h2>
                <p className="text-[10px] text-[#A7ADB5] mt-1">Assign backlog tasks to version release candidates.</p>
              </div>

              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {unallocatedTasks.map((task) => (
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
                            assignTaskMutation.mutate({ releaseId: e.target.value, taskId: task.id })
                          }
                        }}
                        defaultValue=""
                        className="bg-[#171A1D] border border-white/[0.06] text-[9px] text-white px-2 py-1 rounded-md cursor-pointer outline-none"
                      >
                        <option value="">Ship version...</option>
                        {upcomingReleases.map(r => (
                          <option key={r.id} value={r.id}>{r.version}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {unallocatedTasks.length === 0 && (
                  <p className="text-xs text-[#7E848C] italic py-6 text-center">All tasks mapped to releases!</p>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Create Version Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-left">
          <div className="w-full max-w-md bg-[#171A1D] border border-white/[0.06] rounded-2xl p-6 relative">
            <h3 className="text-base font-bold text-white mb-4">Plan Release Version</h3>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A7ADB5] uppercase">Version Tag</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. v1.2.0"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A7ADB5] uppercase">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2.5 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Unreleased">Unreleased</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A7ADB5] uppercase">Release Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Feature Drop"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A7ADB5] uppercase">Release Notes (Markdown)</label>
                <textarea
                  placeholder="Summarize shipped features, bug fixes, and upgrade notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none resize-none font-mono"
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
                  disabled={createReleaseMutation.isPending}
                  className="px-4 py-2 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold rounded-xl text-xs cursor-pointer"
                >
                  {createReleaseMutation.isPending ? 'Creating...' : 'Plan Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
