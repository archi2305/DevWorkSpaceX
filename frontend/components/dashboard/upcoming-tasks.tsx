'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { CheckCircle2, Circle, Calendar, CheckSquare } from 'lucide-react'
import { taskService, TaskResponse } from '@/services/task'

const priorityColors: Record<string, string> = {
  high: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-500/10',
  medium: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-500/10',
  low: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-500/10',
}

export function UpcomingTasks() {
  const [taskList, setTaskList] = useState<TaskResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await taskService.getUpcomingTasks()
        setTaskList(data)
      } catch (err: any) {
        setError('Failed to load tasks.')
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [])

  const toggleTask = async (id: string, currentCompleted: boolean) => {
    try {
      const updated = await taskService.toggleTaskComplete(id, !currentCompleted)
      // Update local state reactively
      setTaskList((prev) =>
        prev.map((task) => (task.id === id ? updated : task))
      )
    } catch (err: any) {
      console.error('Failed to update task state.', err)
    }
  }

  return (
    <PremiumCard>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Upcoming Tasks</h2>
        <p className="text-sm text-muted-foreground">Your assigned tasks and deadlines</p>
      </div>

      {loading ? (
        // Skeleton Loader
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((placeholder) => (
            <div key={placeholder} className="w-full rounded-lg border border-white/5 p-3 flex gap-3 items-center animate-pulse">
              <div className="h-5 w-5 rounded-full bg-[#27272a] flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#27272a] rounded w-2/3" />
                <div className="h-3 bg-[#27272a] rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 text-sm text-red-400 p-4 border border-red-500/10 bg-red-500/5 rounded-lg">
          {error}
        </div>
      ) : taskList.length === 0 ? (
        // Empty State
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center border border-dashed border-white/5 rounded-lg bg-white/[0.005] p-6">
          <CheckSquare className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">No Tasks Assigned</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
            You have caught up with all your deadlines. Nice job!
          </p>
        </div>
      ) : (
        // Tasks List
        <div className="mt-6 space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {taskList.map((task, i) => (
            <motion.button
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => toggleTask(task.id, task.completed)}
              className="group w-full rounded-lg border border-border/50 p-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-1 flex-shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary/50 transition-colors" />
                  )}
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-medium transition-all truncate ${
                        task.completed
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {task.title}
                    </p>
                    <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${priorityColors[task.priority] || priorityColors.medium}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {task.due_date || 'No due date'}
                    <span>•</span>
                    Assigned to you
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </PremiumCard>
  )
}
