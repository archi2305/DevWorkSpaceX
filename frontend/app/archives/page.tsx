'use client'

import React from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { projectService } from '@/services/project'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { PremiumCard } from '@/components/ui/premium-card'
import { useRouter } from 'next/navigation'

export default function ArchivesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch archived projects list
  const { data: archivedProjects = [], isLoading } = useQuery({
    queryKey: ['projects', { is_archived: true }],
    queryFn: () => projectService.getProjects({ is_archived: true }),
  })

  const handleRestore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await projectService.archiveProject(id)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      alert('Failed to restore project.')
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to permanently delete this project?')) return
    try {
      await projectService.deleteProject(id)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      alert('Failed to delete project.')
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="text-left border-b border-white/5 pb-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">Archived Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Review or restore archived milestones</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : archivedProjects.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.01] p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 mb-4">
              <Archive className="h-6 w-6 text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold text-white">Archives Empty</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              You do not have any archived projects in this workspace.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="cursor-pointer"
              >
                <PremiumCard hoverable>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-xl mt-0.5">{project.icon || '🚀'}</span>
                      <div className="min-w-0 text-left">
                        <h3 className="font-semibold text-foreground text-sm truncate">{project.name}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Archived {new Date(project.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => handleRestore(project.id, e)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-400 transition-all cursor-pointer"
                        title="Restore Project"
                      >
                        <ArchiveRestore className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </PremiumCard>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
