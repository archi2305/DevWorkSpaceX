'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PremiumCard } from '../ui/premium-card'
import { AnimatedBadge } from '../ui/animated-badge'
import { FolderKanban, Trash2, Archive, ArchiveRestore } from 'lucide-react'
import { projectService } from '@/services/project'
import { useProjectStore } from '@/store/useProjectStore'
import { useAuth } from '@/hooks/useAuth'

const colorClasses: Record<string, { bg: string; text: string; border: string; dot: string; fromTo: string }> = {
  blue: { bg: 'bg-blue-500/10 hover:bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-500', fromTo: 'from-blue-500 to-blue-500/80' },
  green: { bg: 'bg-emerald-500/10 hover:bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500', fromTo: 'from-emerald-500 to-emerald-500/80' },
  yellow: { bg: 'bg-yellow-500/10 hover:bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/20', dot: 'bg-yellow-500', fromTo: 'from-yellow-500 to-yellow-500/80' },
  purple: { bg: 'bg-purple-500/10 hover:bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-500', fromTo: 'from-purple-500 to-purple-500/80' },
  red: { bg: 'bg-red-500/10 hover:bg-red-500/15', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-500', fromTo: 'from-red-500 to-red-500/80' },
  indigo: { bg: 'bg-indigo-500/10 hover:bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/20', dot: 'bg-indigo-500', fromTo: 'from-indigo-500 to-indigo-500/80' },
  pink: { bg: 'bg-pink-500/10 hover:bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/20', dot: 'bg-pink-500', fromTo: 'from-pink-500 to-pink-500/80' },
  orange: { bg: 'bg-orange-500/10 hover:bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-500', fromTo: 'from-orange-500 to-orange-500/80' },
  teal: { bg: 'bg-teal-500/10 hover:bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/20', dot: 'bg-teal-500', fromTo: 'from-teal-500 to-teal-500/80' },
}

export function ContinueWorking() {
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  // Consume filters from global store
  const { searchQuery, sortBy, statusFilter, viewArchived, setSortBy, setStatusFilter, setViewArchived } = useProjectStore()

  // Dedicated query to list projects with active filters
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects', { search: searchQuery, sort_by: sortBy, status_filter: statusFilter, is_archived: viewArchived }],
    queryFn: () => projectService.getProjects({
      search: searchQuery || undefined,
      sort_by: sortBy || undefined,
      status_filter: statusFilter || undefined,
      is_archived: viewArchived,
    }),
  })

  // Deletion Modal triggers
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleteTargetName, setDeleteTargetName] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Archiving triggers
  const [archivingId, setArchivingId] = useState<string | null>(null)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleDeleteTrigger = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    setDeleteTargetId(id)
    setDeleteTargetName(name)
  }

  const handleArchiveTrigger = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setArchivingId(id)
    try {
      await projectService.archiveProject(id)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      console.error('Archive action failed', err)
    } finally {
      setArchivingId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return
    setDeleting(true)
    try {
      await projectService.deleteProject(deleteTargetId)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDeleteTargetId(null)
    } catch (err) {
      alert('Delete operation failed.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtering header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-4">
        <div className="text-left">
          <h2 className="text-xl font-semibold text-foreground">Workspace Projects</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage, filter, and organize project milestones</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Archive Toggle */}
          <button
            onClick={() => setViewArchived(!viewArchived)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              viewArchived
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'border-white/5 hover:bg-white/5 text-muted-foreground'
            }`}
          >
            {viewArchived ? 'Viewing Archived' : 'View Archive'}
          </button>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-white/5 bg-[#18181b] text-xs text-white outline-none focus:border-primary cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Sort Menu */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-white/5 bg-[#18181b] text-xs text-white outline-none focus:border-primary cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most_progress">Most Progress</option>
            <option value="least_progress">Least Progress</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        // Skeleton Loader
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
          {[1, 2, 3].map((placeholder) => (
            <div key={placeholder} className="flex-shrink-0 w-80 animate-pulse">
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 space-y-5 h-[180px]">
                <div className="h-4 bg-[#27272a] rounded w-2/3" />
                <div className="space-y-2">
                  <div className="h-3 bg-[#27272a] rounded w-1/3" />
                  <div className="h-2 bg-[#27272a] rounded w-full" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="flex -space-x-2">
                    <div className="h-7 w-7 rounded-full bg-[#27272a]" />
                    <div className="h-7 w-7 rounded-full bg-[#27272a]" />
                  </div>
                  <div className="h-7 bg-[#27272a] rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-red-400 p-4 border border-red-500/10 bg-red-500/5 rounded-lg">
          Failed to load projects list.
        </div>
      ) : projects.length === 0 ? (
        // Target Empty States
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-white/5 bg-white/[0.01] p-6 text-center">
          <FolderKanban className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium text-foreground">
            {viewArchived
              ? 'Archived Empty'
              : searchQuery
              ? 'No Search Results'
              : 'No Projects Yet'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
            {viewArchived
              ? 'You do not have any archived projects in this workspace.'
              : searchQuery
              ? `We couldn't find any projects matching "${searchQuery}".`
              : 'Get started by creating a new project from the Quick Actions menu.'}
          </p>
        </div>
      ) : (
        // Projects list slider
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
          {projects.map((project, i) => {
            const themeClass = colorClasses[project.color || 'blue'] || colorClasses.blue
            const isOwner = user?.id === project.owner_id
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0 w-80 cursor-pointer"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <PremiumCard hoverable>
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-2xl mt-0.5 flex-shrink-0">{project.icon || '🚀'}</span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground text-base truncate w-32 text-left">{project.name}</h3>
                          <p className="text-[10px] text-muted-foreground mt-1 font-medium text-left">
                            Created {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <AnimatedBadge variant="success">{project.status}</AnimatedBadge>
                        <span className="text-[10px] rounded px-1.5 py-0.5 border border-white/5 bg-white/[0.02] text-muted-foreground">
                          {project.visibility}
                        </span>
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-xs text-muted-foreground text-left line-clamp-2 h-8 leading-snug">
                        {project.description}
                      </p>
                    )}

                    <motion.div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Progress</span>
                        <span className="text-xs font-bold text-zinc-300">{project.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          className={`h-full bg-gradient-to-r ${themeClass.fromTo} rounded-full`}
                        />
                      </div>
                    </motion.div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.03]">
                      <div className="flex -space-x-1.5">
                        {project.members?.slice(0, 2).map((member) => (
                          member.profile_image ? (
                            <img
                              key={member.id}
                              src={member.profile_image}
                              alt={member.full_name}
                              className="h-6 w-6 rounded-full border-2 border-[#18181b] object-cover shadow-sm"
                            />
                          ) : (
                            <div
                              key={member.id}
                              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#18181b] bg-gradient-to-br from-primary/30 to-primary/10 text-[9px] font-bold text-primary shadow-sm"
                            >
                              {getInitials(member.full_name)}
                            </div>
                          )
                        ))}
                        {(project.members?.length || 1) > 2 && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#18181b] bg-muted text-[9px] font-bold text-muted-foreground shadow-sm">
                            +{(project.members?.length || 1) - 2}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {isOwner && (
                          <>
                            <button
                              onClick={(e) => handleArchiveTrigger(e, project.id)}
                              disabled={archivingId === project.id}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-400 transition-all cursor-pointer"
                              title={project.is_archived ? 'Restore' : 'Archive'}
                            >
                              {project.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={(e) => handleDeleteTrigger(e, project.id, project.name)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-all duration-200"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {deleteTargetId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-[#09090b] p-6 shadow-2xl text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Delete Project?</h3>
              <p className="text-xs text-muted-foreground mb-6 text-center">
                Are you sure you want to delete <span className="text-white font-bold">&quot;{deleteTargetName}&quot;</span>? This action is permanent and deletes all associated workspace metadata.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTargetId(null)}
                  disabled={deleting}
                  className="flex-1 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 text-xs transition-all cursor-pointer"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
