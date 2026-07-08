'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckSquare, FileText, Sparkles, X } from 'lucide-react'
import { projectService } from '@/services/project'

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

export function QuickActions() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleActionClick = (id: number) => {
    if (id === 1) {
      setIsModalOpen(true)
    } else {
      alert(`${actions.find((a) => a.id === id)?.label} is currently a placeholder action.`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setError(null)
    setLoading(true)

    try {
      await projectService.createProject({
        name,
        description: description || undefined,
      })
      setIsModalOpen(false)
      setName('')
      setDescription('')
      // Refresh the page to reload projects list and metrics reactively
      window.location.reload()
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to create project.'
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
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

      {/* Create Project Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md rounded-2xl border border-white/5 bg-[#09090b] p-6 shadow-2xl relative"
            >
              {/* Close button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-white/5 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-semibold text-white mb-2">Create New Project</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Define your workspace project attributes to organize your sprint cycle.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="pname" className="text-xs font-medium text-white">
                    Project Name
                  </label>
                  <input
                    id="pname"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mobile Client Redesign"
                    disabled={loading}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white placeholder-[#52525b] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="pdesc" className="text-xs font-medium text-white">
                    Description (Optional)
                  </label>
                  <textarea
                    id="pdesc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Scope outlines user dashboard and navigation flows."
                    disabled={loading}
                    rows={3}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white placeholder-[#52525b] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={loading}
                    className="rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Creating...' : 'Create Project'}
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
