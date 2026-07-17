'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MainLayout } from '@/components/layout/main-layout'
import { aiService } from '@/services/ai'
import { projectService } from '@/services/project'
import { milestoneService } from '@/services/milestone'
import { taskService } from '@/services/task'
import { 
  Sparkles, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Layers, 
  Clock, 
  AlertCircle,
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react'

// Interfaces
interface TaskState {
  id: string
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  estimated_hours: number
}

interface MilestoneState {
  id: string
  title: string
  description: string
  tasks: TaskState[]
}

interface ProjectState {
  project_name: string
  description: string
  estimated_duration_weeks: number
  milestones: MilestoneState[]
}

export default function AIProjectPlannerPage() {
  const router = useRouter()
  
  // Wizard steps: 'prompt' | 'loading' | 'preview' | 'success'
  const [step, setStep] = useState<'prompt' | 'loading' | 'preview' | 'success'>('prompt')
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // Project states
  const [project, setProject] = useState<ProjectState | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [pendingRoute, setPendingRoute] = useState<string | null>(null)
  
  // Creation status states
  const [creating, setCreating] = useState(false)
  const [creationStatus, setCreationStatus] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  // Rotating status message timer
  const [statusMsgIdx, setStatusMsgIdx] = useState(0)
  const statusMessages = [
    "Understanding your idea...",
    "Designing milestones...",
    "Planning project structure...",
    "Estimating workload...",
    "Generating tasks..."
  ]
  
  // Reference for focus trap on keyboard inputs
  const firstInputRef = useRef<HTMLTextAreaElement>(null)

  // Status message rotation hook
  useEffect(() => {
    let timer: any = null
    if (step === 'loading') {
      timer = setInterval(() => {
        setStatusMsgIdx((prev) => (prev + 1) % statusMessages.length)
      }, 2500)
    } else {
      setStatusMsgIdx(0)
    }
    return () => clearInterval(timer)
  }, [step])

  // Focus trap on prompt load
  useEffect(() => {
    if (step === 'prompt') {
      firstInputRef.current?.focus()
    }
  }, [step])

  // Global keybindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (step === 'preview') {
          handleCancel()
        } else if (step === 'prompt') {
          router.push('/projects')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [step, isDirty])

  // Generator Action
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!prompt.trim()) return
    
    setError(null)
    setStep('loading')
    
    try {
      const data = await aiService.generateProjectPlan(prompt)
      
      const mappedMilestones = (data.milestones || []).map((m: any, mIdx: number) => ({
        id: `milestone-${mIdx}-${Date.now()}-${Math.random()}`,
        title: m.title || '',
        description: m.description || '',
        tasks: (m.tasks || []).map((t: any, tIdx: number) => ({
          id: `task-${tIdx}-${Date.now()}-${Math.random()}`,
          title: t.title || '',
          description: t.description || '',
          priority: (t.priority || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
          estimated_hours: Number(t.estimated_hours) || 1
        }))
      }))
      
      setProject({
        project_name: data.project_name || '',
        description: data.description || '',
        estimated_duration_weeks: Number(data.estimated_duration_weeks) || 1,
        milestones: mappedMilestones
      })
      
      setIsDirty(false)
      setStep('preview')
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'An error occurred while generating the plan. Please check your API key / quota limit and try again.')
      setStep('prompt')
    }
  }

  // cancel / navigation actions
  const handleCancel = () => {
    if (isDirty) {
      setPendingRoute('/projects')
      setShowExitWarning(true)
    } else {
      router.push('/projects')
    }
  }

  const confirmExit = () => {
    setShowExitWarning(false)
    setIsDirty(false)
    if (pendingRoute) {
      if (pendingRoute === 'prompt') {
        setProject(null)
        setStep('prompt')
      } else {
        router.push(pendingRoute)
      }
    }
  }

  // --- Mutators ---
  const updateProjectField = (field: keyof ProjectState, value: any) => {
    if (!project) return
    setProject({ ...project, [field]: value })
    setIsDirty(true)
  }

  const updateMilestoneField = (mId: string, field: keyof MilestoneState, value: any) => {
    if (!project) return
    const updated = project.milestones.map(m => m.id === mId ? { ...m, [field]: value } : m)
    setProject({ ...project, milestones: updated })
    setIsDirty(true)
  }

  const deleteMilestone = (mId: string) => {
    if (!project) return
    setProject({
      ...project,
      milestones: project.milestones.filter(m => m.id !== mId)
    })
    setIsDirty(true)
  }

  const addMilestone = () => {
    if (!project) return
    const newMilestone: MilestoneState = {
      id: `milestone-${Date.now()}-${Math.random()}`,
      title: 'New Milestone',
      description: 'Milestone description goes here.',
      tasks: []
    }
    setProject({
      ...project,
      milestones: [...project.milestones, newMilestone]
    })
    setIsDirty(true)
  }

  const updateTaskField = (mId: string, tId: string, field: keyof TaskState, value: any) => {
    if (!project) return
    const updated = project.milestones.map(m => {
      if (m.id === mId) {
        const tasks = m.tasks.map(t => t.id === tId ? { ...t, [field]: value } : t)
        return { ...m, tasks }
      }
      return m
    })
    setProject({ ...project, milestones: updated })
    setIsDirty(true)
  }

  const deleteTask = (mId: string, tId: string) => {
    if (!project) return
    const updated = project.milestones.map(m => {
      if (m.id === mId) {
        return { ...m, tasks: m.tasks.filter(t => t.id !== tId) }
      }
      return m
    })
    setProject({ ...project, milestones: updated })
    setIsDirty(true)
  }

  const addTask = (mId: string) => {
    if (!project) return
    const newTask: TaskState = {
      id: `task-${Date.now()}-${Math.random()}`,
      title: 'New Task',
      description: 'Task description goes here',
      priority: 'MEDIUM',
      estimated_hours: 8
    }
    const updated = project.milestones.map(m => {
      if (m.id === mId) {
        return { ...m, tasks: [...m.tasks, newTask] }
      }
      return m
    })
    setProject({ ...project, milestones: updated })
    setIsDirty(true)
  }

  // Final database submit
  const handleCreateProject = async () => {
    if (!project) return
    
    const errors: string[] = []
    if (!project.project_name.trim()) errors.push('Project Name is required.')
    if (project.estimated_duration_weeks < 1) errors.push('Estimated Duration must be at least 1 week.')
    
    project.milestones.forEach((m, mIdx) => {
      const mNum = mIdx + 1
      if (!m.title.trim()) errors.push(`Milestone #${mNum} title is required.`)
      m.tasks.forEach((t, tIdx) => {
        const tNum = tIdx + 1
        if (!t.title.trim()) errors.push(`Task #${tNum} under Milestone "${m.title || mNum}" title is required.`)
        if (t.estimated_hours < 1) errors.push(`Task "${t.title || tNum}" estimated hours must be at least 1.`)
      })
    })
    
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    
    setValidationErrors([])
    setCreating(true)
    setCreationStatus('Creating project metadata...')
    
    try {
      const createdProject = await projectService.createProject({
        name: project.project_name,
        description: project.description || undefined,
        color: 'indigo',
        icon: '🚀',
        status: 'Pending',
        priority: 'Medium',
        visibility: 'Workspace'
      })
      
      const projectId = createdProject.id
      
      for (let i = 0; i < project.milestones.length; i++) {
        const milestone = project.milestones[i]
        setCreationStatus(`Creating milestone: ${milestone.title}...`)
        
        const createdMilestone = await milestoneService.createMilestone({
          project_id: projectId,
          title: milestone.title,
          description: milestone.description || undefined,
          status: 'Planned'
        })
        
        const milestoneId = createdMilestone.id
        
        for (let j = 0; j < milestone.tasks.length; j++) {
          const task = milestone.tasks[j]
          setCreationStatus(`Creating task: ${task.title}...`)
          
          await taskService.createTask({
            project_id: projectId,
            milestone_id: milestoneId,
            title: task.title,
            description: task.description || undefined,
            priority: task.priority,
            status: 'Todo',
            estimated_time: task.estimated_hours
          })
        }
      }
      
      setCreating(false)
      setStep('success')
      
      setTimeout(() => {
        setIsDirty(false)
        router.push(`/projects/${projectId}`)
      }, 2500)
      
    } catch (err: any) {
      console.error(err)
      const errMsg = err.response?.data?.detail || 'Failed to initialize project resources. Please check your network and try again.'
      setValidationErrors([errMsg])
      setCreating(false)
    }
  }

  // --- Step Indicator Data ---
  const currentStepNum = step === 'prompt' ? 1 : step === 'loading' ? 2 : 3
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Wizard Progress Header */}
        <div className="rounded-2xl border border-white/5 bg-[#09090b] p-4 shadow-md flex justify-between items-center text-xs">
          <div className="flex items-center gap-3">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold transition-all ${
              currentStepNum >= 1 ? 'bg-primary text-black' : 'bg-white/5 text-muted-foreground'
            }`}>1</div>
            <span className={`font-semibold ${currentStepNum >= 1 ? 'text-white' : 'text-muted-foreground'}`}>Project Idea</span>
          </div>
          <div className="h-px bg-white/5 flex-1 mx-4 hidden md:block" />
          <div className="flex items-center gap-3">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold transition-all ${
              currentStepNum >= 2 ? 'bg-primary text-black' : 'bg-white/5 text-muted-foreground'
            }`}>2</div>
            <span className={`font-semibold ${currentStepNum >= 2 ? 'text-white' : 'text-muted-foreground'}`}>AI Generation</span>
          </div>
          <div className="h-px bg-white/5 flex-1 mx-4 hidden md:block" />
          <div className="flex items-center gap-3">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold transition-all ${
              currentStepNum >= 3 ? 'bg-primary text-black' : 'bg-white/5 text-muted-foreground'
            }`}>3</div>
            <span className={`font-semibold ${currentStepNum >= 3 ? 'text-white' : 'text-muted-foreground'}`}>Review & Edit</span>
          </div>
        </div>

        {/* Exit Warning Modal */}
        <AnimatePresence>
          {showExitWarning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm rounded-xl border border-white/5 bg-[#0c0c0e] p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-3 text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  <h4 className="font-bold text-white">Unsaved Changes</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  You have made edits to the generated plan. Are you sure you want to navigate away?
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowExitWarning(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                  >
                    Stay
                  </button>
                  <button
                    onClick={confirmExit}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-all cursor-pointer"
                  >
                    Leave
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Loading Overlay */}
        {creating && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="h-12 w-12 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin mb-4" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{creationStatus}</h3>
            <p className="text-xs text-muted-foreground mt-1">Initializing database records...</p>
          </div>
        )}

        {/* Content Stages */}
        <AnimatePresence mode="wait">
          {/* Step 1: Prompt */}
          {step === 'prompt' && (
            <motion.div
              key="prompt-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-3 items-start">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-white">Generation Failed</p>
                    <p className="mt-1 opacity-90">{error}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleGenerate()}
                        className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/30 text-white px-3 py-1.5 rounded-lg border border-red-500/30 text-xs font-semibold cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" /> Retry Plan
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-white/5 bg-[#09090b] p-6 space-y-6 shadow-xl">
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white block text-left">
                      Describe your project concept:
                    </label>
                    <textarea
                      ref={firstInputRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. Build an Airbnb Clone..."
                      rows={4}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.01] text-sm text-white placeholder-[#52525b] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none transition-all"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => router.push('/projects')}
                      className="rounded-xl px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!prompt.trim()}
                      className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/95 text-black font-semibold px-6 py-2.5 text-sm transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" /> Plan Project
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* Step 2: Loading & Skeletons */}
          {step === 'loading' && (
            <motion.div
              key="loading-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Rotating Status Msg */}
              <div className="rounded-2xl border border-white/5 bg-[#09090b] p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
                <div className="h-10 w-10 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-[#5BB98C]" />
                </div>
                <h3 className="text-sm font-semibold text-white animate-pulse">
                  {statusMessages[statusMsgIdx]}
                </h3>
              </div>

              {/* Shimmer/Skeleton Planner UI */}
              <div className="rounded-2xl border border-white/5 bg-[#09090b]/50 p-6 space-y-4 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-1/4" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-8 bg-white/5 rounded col-span-2" />
                  <div className="h-8 bg-white/5 rounded" />
                </div>
                <div className="h-16 bg-white/5 rounded w-full" />
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#09090b]/30 p-6 space-y-3 animate-pulse">
                <div className="h-6 bg-white/5 rounded w-1/3" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
                <div className="space-y-2 pt-2">
                  <div className="h-12 bg-white/5 rounded w-full" />
                  <div className="h-12 bg-white/5 rounded w-full" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review & Edit */}
          {step === 'preview' && project && (
            <motion.div
              key="preview-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {validationErrors.length > 0 && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-2.5 items-start">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">Please correct validation errors:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1 opacity-90">
                      {validationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {/* General Project Inputs */}
              <div className="rounded-2xl border border-white/5 bg-[#09090b] p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-white/5 pb-3">
                  <FileText className="h-4 w-4 text-[#5BB98C]" /> General Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Name</label>
                    <input
                      type="text"
                      value={project.project_name}
                      onChange={(e) => updateProjectField('project_name', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.01] text-sm text-white focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" /> Duration (Weeks)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={project.estimated_duration_weeks}
                      onChange={(e) => updateProjectField('estimated_duration_weeks', Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.01] text-sm text-white focus:border-primary outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                  <textarea
                    value={project.description}
                    onChange={(e) => updateProjectField('description', e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.01] text-sm text-white focus:border-primary outline-none resize-none"
                  />
                </div>
              </div>

              {/* Milestones Area */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Milestones & Tasks
                </h3>
                <button
                  onClick={addMilestone}
                  className="flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-white px-3 py-1.5 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Milestone
                </button>
              </div>

              {/* Milestones rendering */}
              {project.milestones.map((m, mIdx) => (
                <div key={m.id} className="rounded-2xl border border-white/5 bg-[#09090b] p-6 space-y-4 relative">
                  <button
                    onClick={() => deleteMilestone(m.id)}
                    className="absolute right-4 top-4 p-1.5 text-muted-foreground hover:text-red-400 hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="space-y-3 max-w-[90%]">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Milestone #{mIdx + 1}</span>
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => updateMilestoneField(m.id, 'title', e.target.value)}
                        className="w-full bg-transparent text-base font-bold text-white border-b border-transparent hover:border-white/10 focus:border-primary outline-none py-0.5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={m.description}
                        onChange={(e) => updateMilestoneField(m.id, 'description', e.target.value)}
                        className="w-full bg-transparent text-xs text-muted-foreground border-b border-transparent hover:border-white/10 focus:border-primary outline-none py-0.5"
                      />
                    </div>
                  </div>

                  {/* Tasks inside Milestone */}
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Tasks</span>
                      <button
                        onClick={() => addTask(m.id)}
                        className="flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-white px-2 py-1 transition-all cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Task
                      </button>
                    </div>

                    <div className="space-y-2">
                      {m.tasks.map((t) => (
                        <div key={t.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] flex items-center justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div className="md:col-span-2">
                                <input
                                  type="text"
                                  value={t.title}
                                  onChange={(e) => updateTaskField(m.id, t.id, 'title', e.target.value)}
                                  className="w-full bg-transparent text-xs font-semibold text-white border-b border-transparent hover:border-white/10 focus:border-primary outline-none"
                                />
                              </div>
                              <div>
                                <select
                                  value={t.priority}
                                  onChange={(e) => updateTaskField(m.id, t.id, 'priority', e.target.value)}
                                  className="w-full px-2 py-0.5 rounded border border-white/10 bg-[#18181b] text-[10px] text-white outline-none"
                                >
                                  <option value="LOW">LOW</option>
                                  <option value="MEDIUM">MEDIUM</option>
                                  <option value="HIGH">HIGH</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="1"
                                  value={t.estimated_hours}
                                  onChange={(e) => updateTaskField(m.id, t.id, 'estimated_hours', Number(e.target.value))}
                                  className="w-16 px-1.5 py-0.5 rounded border border-white/10 bg-[#18181b] text-[10px] text-white text-center outline-none"
                                />
                                <span className="text-[10px] text-muted-foreground">hrs</span>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={t.description}
                              onChange={(e) => updateTaskField(m.id, t.id, 'description', e.target.value)}
                              className="w-full bg-transparent text-[11px] text-muted-foreground border-b border-transparent hover:border-white/10 focus:border-primary outline-none"
                            />
                          </div>
                          <button
                            onClick={() => deleteTask(m.id, t.id)}
                            className="p-1 text-muted-foreground hover:text-red-400 rounded hover:bg-white/5 transition-all cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Wizard Footer Controls */}
              <div className="flex justify-between items-center border-t border-white/5 pt-6">
                <button
                  onClick={() => {
                    if (isDirty) {
                      setPendingRoute('prompt')
                      setShowExitWarning(true)
                    } else {
                      setStep('prompt')
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/5 transition-all cursor-pointer"
                >
                  ← Back
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProject}
                    className="rounded-xl bg-primary hover:bg-primary/95 text-black font-bold px-6 py-2.5 text-xs transition-all cursor-pointer"
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <motion.div
              key="success-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-white/5 bg-[#09090b] p-12 text-center flex flex-col items-center justify-center space-y-6 shadow-xl min-h-[350px]"
            >
              <div className="relative flex items-center justify-center">
                <CheckCircle2 className="h-16 w-16 text-[#5BB98C] animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Your project has been created successfully!</h3>
                <p className="text-xs text-muted-foreground">
                  Redirecting to the project dashboard cycle...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  )
}
