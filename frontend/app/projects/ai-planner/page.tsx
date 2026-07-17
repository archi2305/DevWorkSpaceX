'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  CheckCircle2
} from 'lucide-react'

// Define interfaces for local state
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
  
  // Page Steps: 'prompt' | 'loading' | 'preview'
  const [step, setStep] = useState<'prompt' | 'loading' | 'preview'>('prompt')
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // Local project planner state
  const [project, setProject] = useState<ProjectState | null>(null)
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [creationStatus, setCreationStatus] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  
  // Handle Project Plan Generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    
    setError(null)
    setStep('loading')
    
    try {
      const data = await aiService.generateProjectPlan(prompt)
      
      // Inject unique local IDs for state tracking (keying adding/deleting)
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
      
      setStep('preview')
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'An error occurred while generating the plan. Please check your API key quota and try again.')
      setStep('prompt')
    }
  }

  // --- State Mutators ---
  const updateProjectField = (field: keyof ProjectState, value: any) => {
    if (!project) return
    setProject({ ...project, [field]: value })
  }

  const updateMilestoneField = (mId: string, field: keyof MilestoneState, value: any) => {
    if (!project) return
    const updatedMilestones = project.milestones.map(m => {
      if (m.id === mId) {
        return { ...m, [field]: value }
      }
      return m
    })
    setProject({ ...project, milestones: updatedMilestones })
  }

  const deleteMilestone = (mId: string) => {
    if (!project) return
    setProject({
      ...project,
      milestones: project.milestones.filter(m => m.id !== mId)
    })
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
  }

  const updateTaskField = (mId: string, tId: string, field: keyof TaskState, value: any) => {
    if (!project) return
    const updatedMilestones = project.milestones.map(m => {
      if (m.id === mId) {
        const updatedTasks = m.tasks.map(t => {
          if (t.id === tId) {
            return { ...t, [field]: value }
          }
          return t
        })
        return { ...m, tasks: updatedTasks }
      }
      return m
    })
    setProject({ ...project, milestones: updatedMilestones })
  }

  const deleteTask = (mId: string, tId: string) => {
    if (!project) return
    const updatedMilestones = project.milestones.map(m => {
      if (m.id === mId) {
        return {
          ...m,
          tasks: m.tasks.filter(t => t.id !== tId)
        }
      }
      return m
    })
    setProject({ ...project, milestones: updatedMilestones })
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
    const updatedMilestones = project.milestones.map(m => {
      if (m.id === mId) {
        return {
          ...m,
          tasks: [...m.tasks, newTask]
        }
      }
      return m
    })
    setProject({ ...project, milestones: updatedMilestones })
  }

  // --- Validation & Create Action ---
  const handleCreateProject = () => {
    if (!project) return
    
    const errors: string[] = []
    
    // Project Name validation
    if (!project.project_name.trim()) {
      errors.push('Project Name is required.')
    }
    
    // Duration validation
    if (project.estimated_duration_weeks < 1) {
      errors.push('Estimated Duration must be at least 1 week.')
    }
    
    // Milestones and Tasks validations
    project.milestones.forEach((m, mIdx) => {
      const mNum = mIdx + 1
      if (!m.title.trim()) {
        errors.push(`Milestone #${mNum} title is required.`)
      }
      
      m.tasks.forEach((t, tIdx) => {
        const tNum = tIdx + 1
        if (!t.title.trim()) {
          errors.push(`Task #${tNum} under Milestone "${m.title || mNum}" title is required.`)
        }
        if (t.estimated_hours < 1) {
          errors.push(`Task "${t.title || tNum}" estimated hours must be at least 1.`)
        }
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
      // 1. Create the project
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
      
      // 2. Create Milestones and Tasks sequentially
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
          setCreationStatus(`Creating task: ${task.title} under ${milestone.title}...`)
          
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
      
      setToastMessage('Project created successfully!')
      setTimeout(() => {
        setToastMessage(null)
        router.push(`/projects/${projectId}`)
      }, 2000)
      
    } catch (err: any) {
      console.error(err)
      const errMsg = err.response?.data?.detail || 'Failed to create project resources. Please check your network and try again.'
      setValidationErrors([errMsg])
    } finally {
      setCreating(false)
      setCreationStatus('')
    }
  }

  return (
    <MainLayout>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl bg-[#5BB98C] text-black font-semibold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="h-4 w-4" /> {toastMessage}
        </div>
      )}

      {/* Global project resource creation loading step overlay */}
      {creating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="h-12 w-12 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin mb-4" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{creationStatus}</h3>
          <p className="text-xs text-muted-foreground mt-1">Please do not refresh or close the page while resources are initializing...</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header Block */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#5BB98C]" /> AI Project Planner
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Generate structured, milestone-driven project roadmaps in seconds using AI
            </p>
          </div>
          <button
            onClick={() => router.push('/projects')}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Projects
          </button>
        </div>

        {/* 1. Prompt Input Step */}
        {step === 'prompt' && (
          <div className="rounded-2xl border border-white/5 bg-[#09090b] p-6 space-y-6 shadow-xl">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-2.5 items-start">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Generation Failed</p>
                  <p className="mt-1 opacity-90">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white block text-left">
                  What project do you want to plan?
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Build a food delivery web application containing client-side ordering portals and restaurant dashboard metrics..."
                  rows={4}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.01] text-sm text-white placeholder-[#52525b] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none transition-all"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!prompt.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[#5BB98C] hover:bg-[#4ea87d] text-black font-semibold px-6 py-2.5 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" /> Generate Project Plan
                </button>
              </div>
            </form>

            {/* Showcase Section */}
            <div className="border-t border-white/5 pt-6">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Try templates</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setPrompt('Build an Airbnb Clone with real-time bookings')}
                  className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-left text-xs transition-all"
                >
                  <p className="font-semibold text-white mb-1">Airbnb Clone</p>
                  <p className="text-muted-foreground">Detailed layout covering room listings, auth modules, and calendar reservations.</p>
                </button>
                <button
                  onClick={() => setPrompt('Build a Food Delivery App with restaurant dashboards')}
                  className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-left text-xs transition-all"
                >
                  <p className="font-semibold text-white mb-1">Food Delivery System</p>
                  <p className="text-muted-foreground">Covering driver allocations, cart services, payment routes, and order histories.</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Loading State */}
        {step === 'loading' && (
          <div className="rounded-2xl border border-white/5 bg-[#09090b] p-12 text-center flex flex-col items-center justify-center space-y-6 shadow-xl min-h-[350px]">
            <div className="relative flex items-center justify-center">
              <div className="h-14 w-14 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <Sparkles className="h-6 w-6 text-[#5BB98C] absolute animate-pulse" />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-lg font-semibold text-white">AI is planning your project...</h3>
              <p className="text-xs text-muted-foreground animate-pulse">
                Analyzing specifications, configuring milestone charts, and breaking down sprint schedules...
              </p>
            </div>
          </div>
        )}

        {/* 3. Preview Editor Step */}
        {step === 'preview' && project && (
          <div className="space-y-6">
            {/* Inline validation errors */}
            {validationErrors.length > 0 && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-2.5 items-start">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm">Please correct validation errors:</p>
                  <ul className="list-disc list-inside space-y-1 mt-1 opacity-90">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Core Project Attributes Panel */}
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
                    placeholder="Project Name"
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
                  placeholder="Project description..."
                />
              </div>
            </div>

            {/* Milestones Header Area */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Milestones & Roadmap Tasks
              </h3>
              <button
                onClick={addMilestone}
                className="flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-white px-3 py-1.5 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Milestone
              </button>
            </div>

            {/* Milestones Listing */}
            {project.milestones.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#09090b]/50 p-8 text-center text-muted-foreground text-xs">
                No milestones generated. Click "Add Milestone" to start drafting your roadmap.
              </div>
            ) : (
              project.milestones.map((m, mIdx) => (
                <div key={m.id} className="rounded-2xl border border-white/5 bg-[#09090b] p-6 space-y-4 shadow-xl relative group">
                  {/* Delete Milestone Button */}
                  <button
                    onClick={() => deleteMilestone(m.id)}
                    className="absolute right-4 top-4 p-1.5 text-muted-foreground hover:text-red-400 hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                    title="Delete Milestone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {/* Milestone Inputs */}
                  <div className="space-y-3 max-w-[90%]">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Milestone #{mIdx + 1}</span>
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => updateMilestoneField(m.id, 'title', e.target.value)}
                        placeholder="e.g. Design Wireframes"
                        className="w-full bg-transparent text-base font-bold text-white border-b border-transparent hover:border-white/10 focus:border-primary outline-none py-0.5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Milestone Description</label>
                      <input
                        type="text"
                        value={m.description}
                        onChange={(e) => updateMilestoneField(m.id, 'description', e.target.value)}
                        placeholder="Description of milestone objectives..."
                        className="w-full bg-transparent text-xs text-muted-foreground border-b border-transparent hover:border-white/10 focus:border-primary outline-none py-0.5"
                      />
                    </div>
                  </div>

                  {/* Tasks Container */}
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-white">Tasks</span>
                      <button
                        onClick={() => addTask(m.id)}
                        className="flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-white px-2 py-1 transition-all cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Add Task
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {m.tasks.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-white/5 p-4 text-center text-muted-foreground text-[10px]">
                          No tasks under this milestone yet.
                        </div>
                      ) : (
                        m.tasks.map((t) => (
                          <div key={t.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] flex flex-col md:flex-row gap-4 items-start justify-between relative group/task">
                            {/* Task fields */}
                            <div className="flex-1 space-y-3 w-full">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="md:col-span-2 space-y-1">
                                  <input
                                    type="text"
                                    value={t.title}
                                    onChange={(e) => updateTaskField(m.id, t.id, 'title', e.target.value)}
                                    placeholder="Task Title"
                                    className="w-full bg-transparent text-xs font-semibold text-white border-b border-transparent hover:border-white/10 focus:border-primary outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
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
                                <div className="space-y-1 flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="1"
                                    value={t.estimated_hours}
                                    onChange={(e) => updateTaskField(m.id, t.id, 'estimated_hours', Number(e.target.value))}
                                    className="w-16 px-1.5 py-0.5 rounded border border-white/10 bg-[#18181b] text-[10px] text-white outline-none text-center"
                                  />
                                  <span className="text-[10px] text-muted-foreground">hrs</span>
                                </div>
                              </div>

                              <div className="space-y-0.5">
                                <input
                                  type="text"
                                  value={t.description}
                                  onChange={(e) => updateTaskField(m.id, t.id, 'description', e.target.value)}
                                  placeholder="Task description..."
                                  className="w-full bg-transparent text-[11px] text-muted-foreground border-b border-transparent hover:border-white/10 focus:border-primary outline-none"
                                />
                              </div>
                            </div>

                            {/* Delete Task button */}
                            <button
                              onClick={() => deleteTask(m.id, t.id)}
                              className="p-1 text-muted-foreground hover:text-red-400 rounded hover:bg-white/5 transition-all md:opacity-0 group-hover/task:opacity-100 cursor-pointer"
                              title="Delete Task"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Step Controls Footer */}
            <div className="flex justify-between items-center border-t border-white/5 pt-6">
              <button
                type="button"
                onClick={() => setStep('prompt')}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/5 transition-all cursor-pointer"
              >
                ← Back
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setProject(null)
                    setStep('prompt')
                  }}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateProject}
                  className="rounded-xl bg-[#5BB98C] hover:bg-[#4ea87d] text-black font-bold px-6 py-2.5 text-xs transition-all cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
