'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckSquare, FileText, Sparkles, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { projectService } from '@/services/project'
import { taskService } from '@/services/task'
import { useDashboardData } from '@/hooks/useDashboardData'

const actions = [
  {
    id: 1,
    icon: Plus,
    label: 'Create Project',
    description: 'Start a new project',
  },
  {
    id: 2,
    icon: CheckSquare,
    label: 'Create Task',
    description: 'Add a new task',
  },
  {
    id: 3,
    icon: FileText,
    label: 'Generate Docs',
    description: 'Auto-generate documentation',
  },
  {
    id: 4,
    icon: Sparkles,
    label: 'Ask AI',
    description: 'Get AI assistance',
  },
]

const colors = ['blue', 'green', 'yellow', 'purple', 'red', 'indigo', 'pink', 'orange', 'teal']
const icons = ['🚀', '🎨', '💻', '🔒', '📊', '⚡', '🤖', '🌍', '🛠️']

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  indigo: 'bg-indigo-500',
  pink: 'bg-pink-500',
  orange: 'bg-orange-500',
  teal: 'bg-teal-500',
}

export function QuickActions() {
  const queryClient = useQueryClient()
  const { data: dashboardData } = useDashboardData()
  const projects = dashboardData?.recentProjects || []
  
  const [activeModal, setActiveModal] = useState<'project' | 'task' | null>(null)
  
  // Project creation fields
  const [pName, setPName] = useState('')
  const [pDesc, setPDesc] = useState('')
  const [pColor, setPColor] = useState('blue')
  const [pIcon, setPIcon] = useState('🚀')
  const [pError, setPError] = useState<string | null>(null)
  const [pLoading, setPLoading] = useState(false)

  // Task creation fields
  const [tTitle, setTTitle] = useState('')
  const [tPriority, setTPriority] = useState('medium')
  const [tDueDate, setTDueDate] = useState('')
  const [tProjectId, setTProjectId] = useState('')
  const [tError, setTError] = useState<string | null>(null)
  const [tLoading, setTLoading] = useState(false)

  const handleActionClick = (id: number) => {
    if (id === 1) {
      setActiveModal('project')
    } else if (id === 2) {
      setActiveModal('task')
    } else {
      alert(`${actions.find((a) => a.id === id)?.label} is currently a placeholder action.`)
    }
  }

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pName.trim()) return

    setPError(null)
    setPLoading(true)

    try {
      await projectService.createProject({
        name: pName,
        description: pDesc || undefined,
        color: pColor,
        icon: pIcon,
        status: 'In Progress',
      })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setActiveModal(null)
      setPName('')
      setPDesc('')
      setPColor('blue')
      setPIcon('🚀')
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to create project.'
      setPError(errMsg)
    } finally {
      setPLoading(false)
    }
  }

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tTitle.trim()) return

    setTError(null)
    setTLoading(true)

    try {
      await taskService.createTask({
        title: tTitle,
        priority: tPriority,
        due_date: tDueDate || undefined,
        project_id: tProjectId || undefined,
      })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setActiveModal(null)
      setTTitle('')
      setTPriority('medium')
      setTDueDate('')
      setTProjectId('')
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to create task.'
      setTError(errMsg)
    } finally {
      setTLoading(false)
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-foreground text-left">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {actions.map((action, i) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleActionClick(action.id)}
              className={`
                relative overflow-hidden rounded-xl border border-border bg-card p-4
                transition-all hover:border-primary hover:shadow-md cursor-pointer
              `}
            >
              <motion.div
                className="absolute inset-0 bg-primary/5"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />

              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3"
                >
                  <Icon className="h-5 w-5 text-primary" />
                </motion.div>

                <p className="text-sm font-semibold text-foreground text-left">{action.label}</p>
                <p className="text-xs text-muted-foreground text-left mt-1">{action.description}</p>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {activeModal === 'project' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md rounded-2xl border border-white/5 bg-[#09090b] p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-white/5 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-semibold text-white mb-2">Create New Project</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Define your workspace project attributes to organize your sprint cycle.
              </p>

              <form onSubmit={handleProjectSubmit} className="space-y-4">
                {pError && (
                  <div className="p-3 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    {pError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="pname" className="text-xs font-medium text-white block text-left">
                    Project Name
                  </label>
                  <input
                    id="pname"
                    type="text"
                    required
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    placeholder="e.g. Mobile Client Redesign"
                    disabled={pLoading}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white placeholder-[#52525b] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="pdesc" className="text-xs font-medium text-white block text-left">
                    Description (Optional)
                  </label>
                  <textarea
                    id="pdesc"
                    value={pDesc}
                    onChange={(e) => setPDesc(e.target.value)}
                    placeholder="e.g. Scope outlines user dashboard and navigation flows."
                    disabled={pLoading}
                    rows={3}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white placeholder-[#52525b] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white block text-left">Project Icon</label>
                  <div className="flex gap-2">
                    {icons.map((ico) => (
                      <button
                        key={ico}
                        type="button"
                        onClick={() => setPIcon(ico)}
                        className={`text-xl p-2 rounded-lg border transition-all cursor-pointer ${
                          pIcon === ico ? 'border-primary bg-primary/10' : 'border-white/5 bg-white/[0.01] hover:bg-white/5'
                        }`}
                      >
                        {ico}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white block text-left">Project Color Theme</label>
                  <div className="flex gap-2">
                    {colors.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setPColor(col)}
                        className={`h-6 w-6 rounded-full border-2 transition-all cursor-pointer ${
                          colorClasses[col]
                        } ${
                          pColor === col ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    disabled={pLoading}
                    className="rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pLoading}
                    className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {pLoading ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <AnimatePresence>
        {activeModal === 'task' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md rounded-2xl border border-white/5 bg-[#09090b] p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-white/5 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-semibold text-white mb-2">Create New Task</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Add an upcoming action item to organize your workflow deadlines.
              </p>

              <form onSubmit={handleTaskSubmit} className="space-y-4">
                {tError && (
                  <div className="p-3 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    {tError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="tname" className="text-xs font-medium text-white block text-left">
                    Task Title
                  </label>
                  <input
                    id="tname"
                    type="text"
                    required
                    value={tTitle}
                    onChange={(e) => setTTitle(e.target.value)}
                    placeholder="e.g. Implement unified endpoint"
                    disabled={tLoading}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white placeholder-[#52525b] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="tprio" className="text-xs font-medium text-white block text-left">
                    Priority
                  </label>
                  <select
                    id="tprio"
                    value={tPriority}
                    onChange={(e) => setTPriority(e.target.value)}
                    disabled={tLoading}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-[#18181b] text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="tdate" className="text-xs font-medium text-white block text-left">
                    Due Date (Optional)
                  </label>
                  <input
                    id="tdate"
                    type="date"
                    value={tDueDate}
                    onChange={(e) => setTDueDate(e.target.value)}
                    disabled={tLoading}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="tproject" className="text-xs font-medium text-white block text-left">
                    Associate with Project (Optional)
                  </label>
                  <select
                    id="tproject"
                    value={tProjectId}
                    onChange={(e) => setTProjectId(e.target.value)}
                    disabled={tLoading}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-[#18181b] text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                  >
                    <option value="">No Project Relation</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.icon || '🚀'} {proj.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    disabled={tLoading}
                    className="rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={tLoading}
                    className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {tLoading ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
