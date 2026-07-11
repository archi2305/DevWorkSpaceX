'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Trash2,
  RefreshCw,
  Folder,
  CheckSquare,
  AlertTriangle,
  RotateCcw,
  Loader
} from 'lucide-react'
import { projectService } from '@/services/project'
import { taskService } from '@/services/task'

export default function ArchivesPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks'>('projects')

  // 1. Fetch Trashed Items
  const { data: trashedProjects = [], isLoading: loadingProjects, refetch: refetchProjects } = useQuery({
    queryKey: ['trashed-projects'],
    queryFn: projectService.getTrashedProjects
  })

  const { data: trashedTasks = [], isLoading: loadingTasks, refetch: refetchTasks } = useQuery({
    queryKey: ['trashed-tasks'],
    queryFn: taskService.getTrashedTasks
  })

  // 2. Mutations
  const restoreProjectMutation = useMutation({
    mutationFn: (id: string) => projectService.restoreProjectFromTrash(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trashed-projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })

  const permDeleteProjectMutation = useMutation({
    mutationFn: (id: string) => projectService.permanentDeleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trashed-projects'] })
    }
  })

  const restoreTaskMutation = useMutation({
    mutationFn: (id: string) => taskService.restoreTaskFromTrash(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trashed-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })

  const permDeleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskService.permanentDeleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trashed-tasks'] })
    }
  })

  const handleManualSync = () => {
    refetchProjects()
    refetchTasks()
  }

  const isLoading = loadingProjects || loadingTasks

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header section */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5 text-left">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-red-400" /> Trash & Recovery
            </h1>
            <p className="text-xs text-[#A7ADB5] mt-1">Review soft-deleted projects or tasks, recover items within 30 days, or permanently empty them.</p>
          </div>

          <button
            onClick={handleManualSync}
            className="p-2.5 rounded-xl border border-white/[0.06] bg-[#171A1D] hover:bg-[#23272B] text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Info card */}
        <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-2xl flex items-start gap-3 text-left">
          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-white">Retention Period (30 Days)</h4>
            <p className="text-[10px] text-[#A7ADB5] mt-1 leading-relaxed">
              Trashed items are retained for exactly 30 days. After this interval, the automatic scheduler permanently empties them from PostgreSQL databases.
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-4 border-b border-white/[0.06] pb-3 text-left">
          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-1 text-xs font-bold cursor-pointer transition-colors ${
              activeTab === 'projects' ? 'text-[#5BB98C] border-b-2 border-[#5BB98C]' : 'text-[#7E848C] hover:text-white'
            }`}
          >
            Deleted Projects ({trashedProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-1 text-xs font-bold cursor-pointer transition-colors ${
              activeTab === 'tasks' ? 'text-[#5BB98C] border-b-2 border-[#5BB98C]' : 'text-[#7E848C] hover:text-white'
            }`}
          >
            Deleted Tasks ({trashedTasks.length})
          </button>
        </div>

        {/* Content list */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader className="h-6 w-6 text-[#5BB98C] animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            
            {/* Deleted Projects */}
            {activeTab === 'projects' && (
              <div className="grid grid-cols-1 gap-3">
                {trashedProjects.map((p) => (
                  <div key={p.id} className="p-4 border border-white/[0.06] bg-[#171A1D] rounded-2xl flex flex-wrap items-center justify-between gap-4 text-left shadow-md">
                    <div className="flex items-center gap-3">
                      <Folder className="h-5 w-5 text-red-400" />
                      <div>
                        <span className="text-xs font-bold text-white">{p.name}</span>
                        {p.deleted_at && (
                          <span className="text-[9px] text-[#7E848C] block mt-0.5">
                            Deleted: {new Date(p.deleted_at).toLocaleDateString()} (Auto-purges soon)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => restoreProjectMutation.mutate(p.id)}
                        className="px-3 py-1.5 border border-white/[0.08] hover:bg-[#1D2024] text-white text-[10px] font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" /> Restore
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Permanently delete project? This cannot be undone.')) {
                            permDeleteProjectMutation.mutate(p.id)
                          }
                        }}
                        className="px-3 py-1.5 border border-red-500/20 hover:bg-red-500/10 text-red-400 text-[10px] font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                ))}
                {trashedProjects.length === 0 && (
                  <div className="py-12 border border-dashed border-white/10 rounded-2xl text-[#7E848C] text-xs">
                    No soft-deleted projects in trash.
                  </div>
                )}
              </div>
            )}

            {/* Deleted Tasks */}
            {activeTab === 'tasks' && (
              <div className="grid grid-cols-1 gap-3">
                {trashedTasks.map((t) => (
                  <div key={t.id} className="p-4 border border-white/[0.06] bg-[#171A1D] rounded-2xl flex flex-wrap items-center justify-between gap-4 text-left shadow-md">
                    <div className="flex items-center gap-3">
                      <CheckSquare className="h-5 w-5 text-red-400" />
                      <div>
                        <span className="text-xs font-bold text-white">{t.title}</span>
                        {t.deleted_at && (
                          <span className="text-[9px] text-[#7E848C] block mt-0.5">
                            Deleted: {new Date(t.deleted_at).toLocaleDateString()} (Auto-purges soon)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => restoreTaskMutation.mutate(t.id)}
                        className="px-3 py-1.5 border border-white/[0.08] hover:bg-[#1D2024] text-white text-[10px] font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" /> Restore
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Permanently delete task? This cannot be undone.')) {
                            permDeleteTaskMutation.mutate(t.id)
                          }
                        }}
                        className="px-3 py-1.5 border border-red-500/20 hover:bg-red-500/10 text-red-400 text-[10px] font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                ))}
                {trashedTasks.length === 0 && (
                  <div className="py-12 border border-dashed border-white/10 rounded-2xl text-[#7E848C] text-xs">
                    No soft-deleted tasks in trash.
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </MainLayout>
  )
}
