'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PremiumCard } from '../ui/premium-card'
import { AnimatedBadge } from '../ui/animated-badge'
import { 
  FolderKanban, Trash2, Archive, ArchiveRestore, Star, Pin, 
  Copy, Edit3, Grid, List as ListIcon, Calendar, ArrowRight, User as UserIcon, X
} from 'lucide-react'
import { projectService, ProjectResponse } from '@/services/project'
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
  
  // Local advanced project layout filters
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('')
  const [favOnly, setFavOnly] = useState(false)
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [pageSize, setPageSize] = useState(6)

  // Consume text filters from global store
  const { searchQuery, sortBy, statusFilter, viewArchived, setSortBy, setStatusFilter, setViewArchived } = useProjectStore()

  // Load project items using TanStack Query
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects', { 
      search: searchQuery, 
      sort_by: sortBy, 
      status_filter: statusFilter, 
      is_archived: viewArchived,
      priority: priorityFilter,
      visibility: visibilityFilter,
      is_favorite: favOnly || undefined,
      is_pinned: pinnedOnly || undefined
    }],
    queryFn: () => projectService.getProjects({
      search: searchQuery || undefined,
      sort_by: sortBy || undefined,
      status_filter: statusFilter || undefined,
      is_archived: viewArchived,
      priority: priorityFilter || undefined,
      visibility: visibilityFilter || undefined,
      is_favorite: favOnly ? true : undefined,
      is_pinned: pinnedOnly ? true : undefined
    }),
  })

  // Pagination bounds
  const [limit, setLimit] = useState(6)
  const paginatedProjects = projects.slice(0, limit)
  const hasMore = projects.length > limit

  // Action loaders
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleteTargetName, setDeleteTargetName] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Edit settings form fields
  const [editTargetProject, setEditTargetProject] = useState<ProjectResponse | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editStatus, setEditStatus] = useState('Pending')
  const [editPriority, setEditPriority] = useState('Medium')
  const [editVisibility, setEditVisibility] = useState('Workspace')
  const [savingEdit, setSavingEdit] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleFavoriteToggle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await projectService.favoriteProject(id)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      console.error('Favorite action failed', err)
    }
  }

  const handlePinToggle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await projectService.pinProject(id)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      console.error('Pin action failed', err)
    }
  }

  const handleDuplicate = async (e: React.MouseEvent, project: ProjectResponse) => {
    e.stopPropagation()
    try {
      await projectService.createProject({
        name: `${project.name} (Copy)`,
        description: project.description || undefined,
        icon: project.icon || undefined,
        cover_image: project.cover_image || undefined,
        color: project.color || undefined,
        status: project.status,
        priority: project.priority,
        visibility: project.visibility,
      })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      alert('Failed to duplicate project.')
    }
  }

  const handleArchiveToggle = async (e: React.MouseEvent, id: string, currentlyArchived: boolean) => {
    e.stopPropagation()
    try {
      if (currentlyArchived) {
        await projectService.restoreProject(id)
      } else {
        await projectService.archiveProject(id)
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      console.error('Archive action failed', err)
    }
  }

  const handleDeleteTrigger = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    setDeleteTargetId(id)
    setDeleteTargetName(name)
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

  const handleEditTrigger = (e: React.MouseEvent, project: ProjectResponse) => {
    e.stopPropagation()
    setEditTargetProject(project)
    setEditName(project.name)
    setEditDesc(project.description || '')
    setEditStatus(project.status)
    setEditPriority(project.priority)
    setEditVisibility(project.visibility)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTargetProject || !editName.trim()) return
    setSavingEdit(true)
    try {
      await projectService.updateProject(editTargetProject.id, {
        name: editName,
        description: editDesc || null,
        status: editStatus,
        priority: editPriority,
        visibility: editVisibility,
      } as any)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setEditTargetProject(null)
    } catch (err) {
      alert('Failed to update project.')
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtering Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
        <div className="text-left">
          <h2 className="text-lg font-bold text-white">Workspace Projects</h2>
          <p className="text-xs text-muted-foreground">Manage and filter developer workflows</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Grid / List Layout Toggle */}
          <div className="flex border border-white/5 bg-[#18181b] rounded-lg p-0.5 mr-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-muted-foreground'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-muted-foreground'}`}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Fav Filter */}
          <button
            onClick={() => setFavOnly(!favOnly)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${favOnly ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'border-white/5 text-muted-foreground'}`}
            title="Starred Projects"
          >
            <Star className="h-4 w-4 fill-current" />
          </button>

          {/* Pinned Filter */}
          <button
            onClick={() => setPinnedOnly(!pinnedOnly)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${pinnedOnly ? 'bg-primary/10 border-primary/30 text-primary' : 'border-white/5 text-muted-foreground'}`}
            title="Pinned Projects"
          >
            <Pin className="h-4 w-4" />
          </button>

          {/* Archive Toggle */}
          <button
            onClick={() => setViewArchived(!viewArchived)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              viewArchived ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'border-white/5 hover:bg-white/5 text-muted-foreground'
            }`}
          >
            {viewArchived ? 'Viewing Archived' : 'View Archive'}
          </button>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-white/5 bg-[#18181b] text-xs text-white outline-none focus:border-primary cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

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
            <option value="recent">Recently Updated</option>
            <option value="most_progress">Most Progress</option>
            <option value="least_progress">Least Progress</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((placeholder) => (
            <div key={placeholder} className="h-[180px] rounded-xl border border-white/5 bg-white/[0.01] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-red-400 p-4 border border-red-500/10 bg-red-500/5 rounded-lg">
          Failed to load projects list.
        </div>
      ) : paginatedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-white/5 bg-white/[0.01] p-6 text-center">
          <FolderKanban className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium text-foreground">No Projects Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
            Try clearing filters or search queries to load projects list.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedProjects.map((project) => {
            const themeClass = colorClasses[project.color || 'blue'] || colorClasses.blue
            const isOwner = user?.id === project.owner_id
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="cursor-pointer"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <PremiumCard hoverable>
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-2xl mt-0.5 flex-shrink-0">{project.icon || '🚀'}</span>
                        <div className="min-w-0 text-left">
                          <h3 className="font-semibold text-foreground text-sm truncate w-32">{project.name}</h3>
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                            Updated {new Date(project.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => handleFavoriteToggle(e, project.id)}
                          className="text-muted-foreground hover:text-yellow-400 transition-colors"
                        >
                          <Star className={`h-3.5 w-3.5 ${project.is_favorite ? 'text-yellow-400 fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => handlePinToggle(e, project.id)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Pin className={`h-3.5 w-3.5 ${project.is_pinned ? 'text-primary' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-xs text-muted-foreground text-left line-clamp-2 h-8 leading-snug">
                        {project.description}
                      </p>
                    )}

                    {/* Progress Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Progress</span>
                        <span className="text-[11px] font-bold text-zinc-300">{project.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${themeClass.fromTo} rounded-full`} style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>

                    {/* Bottom row attributes */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.03]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] rounded px-1.5 py-0.5 border border-white/5 bg-white/[0.02] text-muted-foreground">
                          {project.visibility}
                        </span>
                        <span className="text-[9px] rounded px-1.5 py-0.5 border border-white/5 bg-white/[0.02] text-muted-foreground">
                          {project.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isOwner && (
                          <div className="flex items-center border-r border-white/5 pr-1.5 mr-1.5 gap-1">
                            <button
                              onClick={(e) => handleEditTrigger(e, project)}
                              className="p-1 hover:bg-white/5 rounded text-muted-foreground hover:text-white"
                              title="Edit Settings"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleDuplicate(e, project)}
                              className="p-1 hover:bg-white/5 rounded text-muted-foreground hover:text-white"
                              title="Duplicate"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleArchiveToggle(e, project.id, project.is_archived)}
                              className="p-1 hover:bg-white/5 rounded text-muted-foreground hover:text-white"
                              title={project.is_archived ? 'Restore' : 'Archive'}
                            >
                              {project.is_archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                            </button>
                            <button
                              onClick={(e) => handleDeleteTrigger(e, project.id, project.name)}
                              className="p-1 hover:bg-white/5 rounded text-muted-foreground hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <span className="text-xs font-bold text-primary">Open →</span>
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              </motion.div>
            )
          })}
        </div>
      ) : (
        // List View Table Layout
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
          <table className="w-full text-sm text-left text-zinc-300">
            <thead className="text-xs uppercase bg-[#18181b] text-zinc-400 border-b border-white/5">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProjects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                    <span className="text-lg">{project.icon || '🚀'}</span>
                    <span>{project.name}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <AnimatedBadge variant="success">{project.status}</AnimatedBadge>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{project.priority}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{project.visibility}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 w-32">
                      <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
                      </div>
                      <span className="text-xs text-zinc-400">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => handleFavoriteToggle(e, project.id)}
                        className={`p-1 rounded hover:bg-white/5 ${project.is_favorite ? 'text-yellow-400' : 'text-zinc-500'}`}
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </button>
                      <button
                        onClick={(e) => handlePinToggle(e, project.id)}
                        className={`p-1 rounded hover:bg-white/5 ${project.is_pinned ? 'text-primary' : 'text-zinc-500'}`}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(e, project)}
                        className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-white"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteTrigger(e, project.id, project.name)}
                        className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Load More Pagination */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setLimit((l) => l + 6)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-xs font-semibold text-white hover:bg-white/5 hover:text-primary transition-all cursor-pointer"
          >
            Load More Projects <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Edit Settings modal */}
      <AnimatePresence>
        {editTargetProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#09090b] p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setEditTargetProject(null)}
                className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-white/5 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-base font-semibold text-white mb-4 text-left">Edit settings for Copy</h3>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white block text-left">Project Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-[#18181b] text-sm text-white focus:border-primary outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white block text-left">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-[#18181b] text-sm text-white focus:border-primary outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white block">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#18181b] text-xs text-white outline-none focus:border-primary"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Review">Review</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white block">Priority</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#18181b] text-xs text-white outline-none focus:border-primary"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-white block">Visibility</label>
                  <select
                    value={editVisibility}
                    onChange={(e) => setEditVisibility(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#18181b] text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="Workspace">Workspace</option>
                    <option value="Private">Private</option>
                    <option value="Public">Public</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setEditTargetProject(null)}
                    disabled={savingEdit}
                    className="rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {deleteTargetId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-[#09090b] p-6 shadow-2xl text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Delete Project?</h3>
              <p className="text-xs text-muted-foreground mb-6">
                Are you sure you want to delete <span className="text-white font-bold">&quot;{deleteTargetName}&quot;</span>? This action is permanent and deletes all associated workspace metadata.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTargetId(null)}
                  disabled={deleting}
                  className="flex-1 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 text-xs font-semibold text-zinc-500 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 text-xs transition-all cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
