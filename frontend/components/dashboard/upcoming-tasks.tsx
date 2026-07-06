'use client'

import { motion } from 'framer-motion'
import { PremiumCard } from '../ui/premium-card'
import { CheckCircle2, Circle, Calendar } from 'lucide-react'
import { useState } from 'react'

interface Task {
  id: number
  title: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  assignee: string
}

const tasks: Task[] = [
  {
    id: 1,
    title: 'Review API documentation',
    dueDate: 'Today',
    priority: 'high',
    completed: false,
    assignee: 'You',
  },
  {
    id: 2,
    title: 'Update design system components',
    dueDate: 'Tomorrow',
    priority: 'high',
    completed: false,
    assignee: 'Sarah Chen',
  },
  {
    id: 3,
    title: 'Fix mobile responsiveness issues',
    dueDate: 'Mar 15',
    priority: 'medium',
    completed: true,
    assignee: 'You',
  },
  {
    id: 4,
    title: 'Prepare Q1 roadmap presentation',
    dueDate: 'Mar 18',
    priority: 'medium',
    completed: false,
    assignee: 'Team Lead',
  },
  {
    id: 5,
    title: 'Conduct user research interviews',
    dueDate: 'Mar 20',
    priority: 'low',
    completed: false,
    assignee: 'You',
  },
]

const priorityColors = {
  high: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950',
  medium: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950',
  low: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950',
}

export function UpcomingTasks() {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)

  const toggleTask = (id: number) => {
    setLocalTasks(
      localTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }

  return (
    <PremiumCard>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Upcoming Tasks</h2>
        <p className="text-sm text-muted-foreground">Your assigned tasks and deadlines</p>
      </div>

      <div className="mt-6 space-y-2">
        {localTasks.map((task, i) => (
          <motion.button
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => toggleTask(task.id)}
            className="group w-full rounded-lg border border-border/50 p-3 text-left hover:bg-muted/50 transition-colors"
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
                <div className="flex items-start gap-2">
                  <p
                    className={`text-sm font-medium transition-all ${
                      task.completed
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {task.title}
                  </p>
                  <span className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {task.dueDate}
                  <span>•</span>
                  {task.assignee}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </PremiumCard>
  )
}
