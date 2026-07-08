'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { AnimatedBadge } from '../ui/animated-badge'
import { ChevronRight, FolderKanban } from 'lucide-react'
import { projectService, ProjectResponse } from '@/services/project'

export function ContinueWorking() {
  const [projectsList, setProjectsList] = useState<ProjectResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getProjects()
        setProjectsList(data)
      } catch (err: any) {
        setError('Failed to load projects.')
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Continue Where You Left Off</h2>
          <p className="text-sm text-muted-foreground mt-1">Your active projects and latest updates</p>
        </div>
        <motion.button
          whileHover={{ x: 4 }}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View all <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>

      {loading ? (
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
          {error}
        </div>
      ) : projectsList.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-white/5 bg-white/[0.01] p-6 text-center">
          <FolderKanban className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium text-foreground">No Projects Yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
            Get started by creating a new project from the Quick Actions menu.
          </p>
        </div>
      ) : (
        // Projects List
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
          {projectsList.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
              className="flex-shrink-0 w-80"
            >
              <PremiumCard hoverable>
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-base truncate w-48">{project.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1.5 font-medium">Assigned to you</p>
                    </div>
                    <AnimatedBadge variant="success">{project.status}</AnimatedBadge>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Progress</span>
                      <span className="text-sm font-bold text-primary">{project.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden shadow-sm">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 1.2, delay: 0.35 + i * 0.08, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full shadow-lg shadow-primary/30"
                      />
                    </div>
                  </motion.div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 2).map((member) => (
                        member.profile_image ? (
                          <img
                            key={member.id}
                            src={member.profile_image}
                            alt={member.full_name}
                            className="h-7 w-7 rounded-full border-2 border-card object-cover shadow-sm"
                          />
                        ) : (
                          <motion.div
                            key={member.id}
                            whileHover={{ scale: 1.15, zIndex: 10 }}
                            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-gradient-to-br from-primary/30 to-primary/10 text-xs font-bold text-primary shadow-sm"
                          >
                            {getInitials(member.full_name)}
                          </motion.div>
                        )
                      ))}
                      {project.members.length > 2 && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-bold text-muted-foreground shadow-sm">
                          +{project.members.length - 2}
                        </div>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-all duration-200"
                    >
                      Open
                    </motion.button>
                  </div>
                </div>
              </PremiumCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
