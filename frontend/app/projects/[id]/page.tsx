'use client'

import React, { useState, useEffect, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Calendar, User as UserIcon, Trash2, Edit3, 
  CheckCircle, Clock, AlertCircle, X, LayoutGrid, CheckSquare, 
  Sparkles, Layers 
} from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useAuth } from '@/hooks/useAuth'

interface PageProps {
  params: Promise<{ id: string }>
}

const colors = ['blue', 'green', 'yellow', 'purple', 'red', 'indigo', 'pink', 'orange', 'teal']
const icons = ['🚀', '🎨', '💻', '🔒', '📊', '⚡', '🤖', '🌍', '🛠️']

const colorClasses: Record<string, { bg: string, text: string, border: string, dot: string }> = {
  blue: { bg: 'bg-blue-500/10 hover:bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  green: { bg: 'bg-emerald-500/10 hover:bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  yellow: { bg: 'bg-yellow-500/10 hover:bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/20', dot: 'bg-yellow-500' },
  purple: { bg: 'bg-purple-500/10 hover:bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-500' },
  red: { bg: 'bg-red-500/10 hover:bg-red-500/15', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-500' },
  indigo: { bg: 'bg-indigo-500/10 hover:bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/20', dot: 'bg-indigo-500' },
  pink: { bg: 'bg-pink-500/10 hover:bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/20', dot: 'bg-pink-500' },
  orange: { bg: 'bg-orange-500/10 hover:bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-500' },
  teal: { bg: 'bg-teal-500/10 hover:bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/20', dot: 'bg-teal-500' },
}

export default function ProjectDetailsPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  
  const { 
    currentProject, 
    loading, 
    error, 
    fetchProjectById, 
    updateProject, 
    deleteProject 
  } = useProjectStore()

  // Editing state
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor] = useState('blue')
  const [editIcon, setEditIcon] = useState('🚀')
  const [editStatus, setEditStatus] = useState('In Progress')
  const [editProgress, setEditProgress] = useState(0)
  
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjectById(id).then((proj) => {
      // Sync form parameters
      setEditName(proj.name)
      setEditDescription(proj.description || '')
      setEditColor(proj.color || 'blue')
      setEditIcon(proj.icon || '🚀')
      setEditStatus(proj.status)
      setEditProgress(proj.progress)
    }).catch(() => {})
  }, [id, fetchProjectById])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return

    setSaveLoading(true)
    setSaveError(null)
    try {
      await updateProject(id, {
        name: editName,
        description: editDescription || null,
        color: editColor,
        icon: editIcon,
        status: editStatus,
        progress: Number(editProgress),
      })
      setIsEditOpen(false)
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to update project details.'
      setSaveError(errMsg)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDelete = async () => {
    setSaveLoading(true)
    try {
      await deleteProject(id)
      setIsDeleteOpen(false)
      // Redirect back to dashboard
      router.push('/')
    } catch (err: any) {
      alert('Delete operation failed.')
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-foreground p-8 flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading project details...</p>
      </div>
    )
  }

  if (error || !currentProject) {
    return (
      <div className="min-h-screen bg-[#09090b] text-foreground p-8 flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-lg font-semibold text-white">Project Not Found</h2>
        <p className="text-sm text-muted-foreground">{error || 'This project does not exist or you lack access permissions.'}</p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Go back to Dashboard
        </button>
      </div>
    )
  }

  const themeClass = colorClasses[currentProject.color || 'blue'] || colorClasses.blue
  const isOwner = user?.id === currentProject.owner_id

  return (
    <div className="min-h-screen bg-[#09090b] text-foreground p-8 space-y-8">
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
            <span className="text-3xl">{currentProject.icon || '🚀'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">{currentProject.name}</h1>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${themeClass.text} ${themeClass.border} ${themeClass.bg}`}>
                  {currentProject.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Created {new Date(currentProject.created_at).toLocaleDateString()}
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
              onClick={() => setIsDeleteOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/25 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Main Grid details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Details Description Card */}
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">About Project</h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {currentProject.description || 'No description provided for this project.'}
            </p>
            
            {/* Progress Visual */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overall Progress</span>
                <span className="text-sm font-bold text-primary">{currentProject.progress}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/[0.04] overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentProject.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-primary rounded-full shadow"
                />
              </div>
            </div>
          </div>

          {/* Kanban Section Mockup */}
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
                  
                  {/* Empty Column */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/5 rounded-lg">
                    <Layers className="h-6 w-6 text-[#27272a] mb-2" />
                    <p className="text-[11px] text-muted-foreground">No tasks here yet</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar details */}
        <div className="space-y-6">
          {/* Metadata Sidebar Card */}
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
                  {currentProject.status}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-muted-foreground">Team Size</span>
                <span className="font-semibold text-white">{currentProject.members?.length || 1} members</span>
              </div>
            </div>
          </div>

          {/* Upcoming Tasks Mockup Card */}
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-left">Upcoming Project Tasks</h2>
            
            <div className="flex flex-col items-center justify-center text-center py-6">
              <CheckSquare className="h-8 w-8 text-[#27272a] mb-2" />
              <p className="text-xs text-muted-foreground">No upcoming deadlines assigned</p>
            </div>
          </div>

          {/* Recent Activity Mockup Card */}
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-left">Recent Activity</h2>
            
            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Project initialized</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">By Owner • {new Date(currentProject.created_at).toLocaleDateString()}</p>
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

              <h3 className="text-lg font-semibold text-white mb-2">Edit Project Settings</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Modify your workspace project properties.
              </p>

              <form onSubmit={handleUpdate} className="space-y-4">
                {saveError && (
                  <div className="p-3 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    {saveError}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label htmlFor="epname" className="text-xs font-medium text-white">Project Name</label>
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
                  <label htmlFor="epdesc" className="text-xs font-medium text-white">Description</label>
                  <textarea
                    id="epdesc"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Project description"
                    rows={3}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                  />
                </div>

                {/* Status & Progress Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="epstatus" className="text-xs font-medium text-white">Status</label>
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
                    <label htmlFor="epprogress" className="text-xs font-medium text-white">Progress ({editProgress}%)</label>
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
                </div>

                {/* Icon selection */}
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
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
                    {saveLoading ? 'Saving...' : 'Save Changes'}
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
                Are you sure you want to delete <span className="text-white font-bold">&quot;{currentProject.name}&quot;</span>? This action is permanent and deletes all associated workspace metadata.
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
                  {saveLoading ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
