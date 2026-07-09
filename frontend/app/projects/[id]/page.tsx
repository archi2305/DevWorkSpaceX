'use client'

import React, { useState, useEffect, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, Calendar, User as UserIcon, Trash2, Edit3, 
  Clock, AlertCircle, X, Layers, CheckSquare, 
  Sparkles, FileText, Archive, ArchiveRestore, Star, Pin
} from 'lucide-react'
import { projectService } from '@/services/project'
import { useAuth } from '@/hooks/useAuth'

interface PageProps {
  params: Promise<{ id: string }>
}

const colors = ['blue', 'green', 'yellow', 'purple', 'red', 'indigo', 'pink', 'orange', 'teal']
const icons = ['🚀', '🎨', '💻', '🔒', '📊', '⚡', '🤖', '🌍', '🛠️']

const colorClasses: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', dot: 'bg-yellow-500' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-500' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-500' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', dot: 'bg-indigo-500' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20', dot: 'bg-pink-500' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-500' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', dot: 'bg-teal-500' },
}

export default function ProjectDetailsPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  // Fetch project details using TanStack Query
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProjectById(id),
    retry: 1,
  })

  // Editing modal fields
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor] = useState('blue')
  const [editIcon, setEditIcon] = useState('🚀')
  const [editStatus, setEditStatus] = useState('In Progress')
  const [editPriority, setEditPriority] = useState('Medium')
  const [editProgress, setEditProgress] = useState(0)
  const [editVisibility, setEditVisibility] = useState('Workspace')
  const [editCoverImage, setEditCoverImage] = useState('')
  
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Sync edit form parameters once query resolves
  useEffect(() => {
    if (project) {
      setEditName(project.name)
      setEditDescription(project.description || '')
      setEditColor(project.color || 'blue')
      setEditIcon(project.icon || '🚀')
      setEditStatus(project.status)
      setEditPriority(project.priority)
      setEditProgress(project.progress)
      setEditVisibility(project.visibility)
      setEditCoverImage(project.cover_image || '')
    }
  }, [project])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return

    setSaveLoading(true)
    setSaveError(null)
    try {
      await projectService.updateProject(id, {
        name: editName,
        description: editDescription || null,
        color: editColor,
        icon: editIcon,
        status: editStatus,
        priority: editPriority,
        progress: Number(editProgress),
        visibility: editVisibility,
        cover_image: editCoverImage || null,
      } as any)
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setIsEditOpen(false)
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to update project settings.'
      setSaveError(errMsg)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleArchiveToggle = async () => {
    setSaveLoading(true)
    try {
      if (project?.is_archived) {
        await projectService.restoreProject(id)
      } else {
        await projectService.archiveProject(id)
      }
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err: any) {
      alert('Failed to archive project.')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleFavoriteToggle = async () => {
    try {
      await projectService.favoriteProject(id)
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    } catch (err) {
      console.error('Failed to toggle favorite', err)
    }
  }

  const handlePinToggle = async () => {
    try {
      await projectService.pinProject(id)
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    } catch (err) {
      console.error('Failed to toggle pin', err)
    }
  }

  const handleDelete = async () => {
    setSaveLoading(true)
    try {
      await projectService.deleteProject(id)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setIsDeleteOpen(false)
      router.push('/')
    } catch (err: any) {
      alert('Delete operation failed.')
    } finally {
      setSaveLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-foreground p-8 flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading project details...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#09090b] text-foreground p-8 flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-lg font-semibold text-white">Project Not Found</h2>
        <p className="text-sm text-muted-foreground">This project does not exist or you lack access permissions.</p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Go back to Dashboard
        </button>
      </div>
    )
  }

  const themeClass = colorClasses[project.color || 'blue'] || colorClasses.blue
  const isOwner = user?.id === project.owner_id

  return (
    <div className="min-h-screen bg-[#09090b] text-foreground p-8 space-y-8">
      {/* Cover Image Banner */}
      {project.cover_image && (
        <div className="w-full h-48 rounded-2xl overflow-hidden border border-white/5 relative bg-white/[0.01]">
          <img src={project.cover_image} alt={project.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-muted-foreground hover:bg-white/5 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-3xl">{project.icon || '🚀'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${themeClass.text} ${themeClass.border} ${themeClass.bg}`}>
                  {project.status}
                </span>
                <span className="text-xs rounded-full border border-white/5 bg-white/[0.02] px-2 py-0.5 text-muted-foreground">
                  {project.visibility}
                </span>
                {project.is_archived && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
                    Archived
                  </span>
                )}
                <div className="flex items-center gap-1.5 border-l border-white/10 pl-2.5 ml-1">
                  <button
                    onClick={handleFavoriteToggle}
                    className="text-muted-foreground hover:text-yellow-400 transition-colors"
                  >
                    <Star className={`h-4 w-4 ${project.is_favorite ? 'text-yellow-400 fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handlePinToggle}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Pin className={`h-4 w-4 ${project.is_pinned ? 'text-primary' : ''}`} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit Project
            </button>
            <button
              onClick={handleArchiveToggle}
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                project.is_archived
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-white/[0.02] border-white/5 text-white hover:bg-white/5'
              }`}
            >
              {project.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
              {project.is_archived ? 'Restore' : 'Archive'}
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/25 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* About Project Card */}
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-left">About Project</h2>
            <p className="text-sm text-zinc-300 leading-relaxed text-left">
              {project.description || 'No description provided for this project.'}
            </p>
            
            {/* Progress Visual */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overall Progress</span>
                <span className="text-sm font-bold text-primary">{project.progress}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/[0.04] overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-primary rounded-full shadow"
                />
              </div>
            </div>
          </div>

          {/* Kanban Section Placeholder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sprint Kanban Board</h2>
              <span className="text-xs text-muted-foreground">0 Tasks</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['To Do', 'In Progress', 'Done'].map((column) => (
                <div key={column} className="rounded-xl border border-white/5 bg-white/[0.005] p-4 flex flex-col h-[280px]">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{column}</span>
                    <span className="text-[10px] bg-white/5 text-muted-foreground rounded-full px-2 py-0.5">0</span>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/5 rounded-lg">
                    <Layers className="h-6 w-6 text-[#27272a] mb-2" />
                    <p className="text-[11px] text-muted-foreground font-medium">No tasks here yet</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty Documentation Placeholder */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-left">Documentation Docs</h2>
            <div className="rounded-xl border border-dashed border-white/5 bg-white/[0.002] p-8 flex flex-col items-center justify-center text-center">
              <FileText className="h-8 w-8 text-[#27272a] mb-3" />
              <h3 className="text-xs font-semibold text-white">No Documentation Yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                Create notes, specifications, or guides relating to this workspace scope.
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar details */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-left">Project Metadata</h2>
            
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-muted-foreground">Created by</span>
                <span className="font-semibold text-white flex items-center gap-1">
                  <UserIcon className="h-3 w-3 text-muted-foreground" />
                  {isOwner ? 'You' : 'Workspace Collaborator'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-muted-foreground">Current Status</span>
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${themeClass.dot}`} />
                  {project.status}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-muted-foreground">Priority Level</span>
                <span className="font-semibold text-white uppercase">{project.priority}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-muted-foreground">Visibility Level</span>
                <span className="font-semibold text-white uppercase">{project.visibility}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-muted-foreground">Team Size</span>
                <span className="font-semibold text-white">{project.members?.length || 1} members</span>
              </div>
            </div>
          </div>

          {/* Task Counter */}
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-left">Upcoming Project Tasks</h2>
            <div className="flex flex-col items-center justify-center text-center py-6">
              <CheckSquare className="h-8 w-8 text-[#27272a] mb-2" />
              <p className="text-xs text-muted-foreground">No upcoming deadlines assigned</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-left">Recent Activity</h2>
            
            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="text-left">
                  <p className="text-white font-medium">Project initialized</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">By Owner • {new Date(project.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Project Modal Overlay */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md rounded-2xl border border-white/5 bg-[#09090b] p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsEditOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-white/5 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-semibold text-white mb-2 text-left">Edit Project Settings</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                {saveError && (
                  <div className="p-3 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    {saveError}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label htmlFor="epname" className="text-xs font-medium text-white block text-left">Project Name</label>
                  <input
                    id="epname"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Project name"
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label htmlFor="epdesc" className="text-xs font-medium text-white block text-left">Description</label>
                  <textarea
                    id="epdesc"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Project description"
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                  />
                </div>

                {/* Status & Priority Row */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1.5">
                    <label htmlFor="epstatus" className="text-xs font-medium text-white block">Status</label>
                    <select
                      id="epstatus"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white outline-none focus:border-primary"
                    >
                      <option value="Pending" className="bg-[#09090b]">Pending</option>
                      <option value="In Progress" className="bg-[#09090b]">In Progress</option>
                      <option value="Review" className="bg-[#09090b]">Review</option>
                      <option value="Completed" className="bg-[#09090b]">Completed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="eppriority" className="text-xs font-medium text-white block">Priority</label>
                    <select
                      id="eppriority"
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white outline-none focus:border-primary"
                    >
                      <option value="Low" className="bg-[#09090b]">Low</option>
                      <option value="Medium" className="bg-[#09090b]">Medium</option>
                      <option value="High" className="bg-[#09090b]">High</option>
                      <option value="Urgent" className="bg-[#09090b]">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Progress Slider */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="epprogress" className="text-xs font-medium text-white block">Progress ({editProgress}%)</label>
                  <input
                    id="epprogress"
                    type="range"
                    min="0"
                    max="100"
                    value={editProgress}
                    onChange={(e) => setEditProgress(Number(e.target.value))}
                    className="w-full h-8 accent-primary bg-transparent"
                  />
                </div>

                {/* Visibility selector */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="epvisibility" className="text-xs font-medium text-white block font-medium">Visibility Level</label>
                  <select
                    id="epvisibility"
                    value={editVisibility}
                    onChange={(e) => setEditVisibility(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white outline-none focus:border-primary"
                  >
                    <option value="Workspace" className="bg-[#09090b]">Workspace</option>
                    <option value="Private" className="bg-[#09090b]">Private</option>
                    <option value="Public" className="bg-[#09090b]">Public</option>
                  </select>
                </div>

                {/* Cover Image Input */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="epcover" className="text-xs font-medium text-white block">Cover Image URL</label>
                  <input
                    id="epcover"
                    type="text"
                    value={editCoverImage}
                    onChange={(e) => setEditCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                {/* Icon selection */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-white block">Project Icon</label>
                  <div className="flex gap-2">
                    {icons.map((ico) => (
                      <button
                        key={ico}
                        type="button"
                        onClick={() => setEditIcon(ico)}
                        className={`text-xl p-2 rounded-lg border transition-all cursor-pointer ${
                          editIcon === ico ? 'border-primary bg-primary/10' : 'border-white/5 bg-white/[0.01] hover:bg-white/5'
                        }`}
                      >
                        {ico}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color selection */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-white block">Project Color Theme</label>
                  <div className="flex gap-2">
                    {colors.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setEditColor(col)}
                        className={`h-7 w-7 rounded-full border-2 transition-all cursor-pointer ${
                          colorClasses[col]?.dot
                        } ${
                          editColor === col ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    disabled={saveLoading}
                    className="rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
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
        {isDeleteOpen && (
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
              <p className="text-xs text-muted-foreground mb-6">
                Are you sure you want to delete <span className="text-white font-bold">&quot;{project.name}&quot;</span>? This action is permanent and deletes all associated workspace metadata.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={saveLoading}
                  className="flex-1 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saveLoading}
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
