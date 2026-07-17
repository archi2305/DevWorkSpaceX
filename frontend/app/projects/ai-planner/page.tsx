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
  RotateCcw,
  MessageSquare,
  Send,
  Download,
  Upload,
  Undo2,
  Redo2,
  Eye,
  Settings,
  HelpCircle
} from 'lucide-react'

// Local State Interfaces matching advanced Copilot schema
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
  acceptance_criteria: string
  tasks: TaskState[]
}

interface ProjectState {
  project_name: string
  description: string
  estimated_duration_weeks: number
  recommended_tech_stack: string[]
  folder_structure: string
  architecture_style: string
  recommended_database: string
  auth_strategy: string
  deployment_suggestion: string
  testing_strategy: string
  potential_risks: string[]
  final_deliverables: string[]
  milestones: MilestoneState[]
}

export default function AIProjectCopilotPage() {
  const router = useRouter()
  
  // Steps: 'prompt' | 'loading' | 'preview' | 'success'
  const [step, setStep] = useState<'prompt' | 'loading' | 'preview' | 'success'>('prompt')
  
  // Form Configuration States
  const [prompt, setPrompt] = useState('')
  const [projectType, setProjectType] = useState('Web Application')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [timeline, setTimeline] = useState('1 Month')
  const [teamSize, setTeamSize] = useState('2–5')
  const [techStackInput, setTechStackInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // State History (Undo / Redo)
  const [project, setProject] = useState<ProjectState | null>(null)
  const [history, setHistory] = useState<ProjectState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isDirty, setIsDirty] = useState(false)
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [pendingRoute, setPendingRoute] = useState<string | null>(null)
  
  // Validation, saving, and toast notifications
  const [creating, setCreating] = useState(false)
  const [creationStatus, setCreationStatus] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  // Preview Active Tab: 'roadmap' | 'architecture' | 'risks'
  const [activeTab, setActiveTab] = useState<'roadmap' | 'architecture' | 'risks'>('roadmap')
  
  // AI Chat Assistant States
  const [showChat, setShowChat] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: "Hello! I am your AI Copilot. Ask me to refine the plan, change technologies, convert to SaaS, or modify timelines!" }
  ])
  
  // Section loading status (for micro-regenerations)
  const [regenLoading, setRegenLoading] = useState<string | null>(null)

  // Rotating Status messages
  const [statusMsgIdx, setStatusMsgIdx] = useState(0)
  const statusMessages = [
    "Understanding your requirements...",
    "Selecting tech stack recommendations...",
    "Defining architecture templates...",
    "Planning milestones and acceptance criteria...",
    "Writing tasks and estimating effort...",
  ]

  // File import input reference
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let timer: any = null
    if (step === 'loading') {
      timer = setInterval(() => {
        setStatusMsgIdx((prev) => (prev + 1) % statusMessages.length)
      }, 2500)
    }
    return () => clearInterval(timer)
  }, [step])

  // Helper: push state to undo/redo history
  const pushHistory = (newState: ProjectState) => {
    const updatedHistory = history.slice(0, historyIndex + 1)
    updatedHistory.push(JSON.parse(JSON.stringify(newState)))
    setHistory(updatedHistory)
    setHistoryIndex(updatedHistory.length - 1)
    setProject(newState)
    setIsDirty(true)
  }

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1
      setHistoryIndex(prevIdx)
      setProject(JSON.parse(JSON.stringify(history[prevIdx])))
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1
      setHistoryIndex(nextIdx)
      setProject(JSON.parse(JSON.stringify(history[nextIdx])))
    }
  }

  const handleResetToInitial = () => {
    if (history.length > 0) {
      setHistoryIndex(0)
      setProject(JSON.parse(JSON.stringify(history[0])))
    }
  }

  // Call generation API
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!prompt.trim()) return
    
    setError(null)
    setStep('loading')
    
    try {
      const data = await aiService.generateProjectPlan({
        prompt,
        project_type: projectType,
        difficulty,
        timeline,
        team_size: teamSize,
        tech_stack: techStackInput || undefined
      })
      
      const mappedMilestones = (data.milestones || []).map((m: any, mIdx: number) => ({
        id: `milestone-${mIdx}-${Date.now()}-${Math.random()}`,
        title: m.title || '',
        description: m.description || '',
        acceptance_criteria: m.acceptance_criteria || 'Milestone deliverables verified.',
        tasks: (m.tasks || []).map((t: any, tIdx: number) => ({
          id: `task-${tIdx}-${Date.now()}-${Math.random()}`,
          title: t.title || '',
          description: t.description || '',
          priority: (t.priority || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
          estimated_hours: Number(t.estimated_hours) || 1
        }))
      }))
      
      const initialProject: ProjectState = {
        project_name: data.project_name || 'AI Copilot Project',
        description: data.description || '',
        estimated_duration_weeks: Number(data.estimated_duration_weeks) || 4,
        recommended_tech_stack: data.recommended_tech_stack || [],
        folder_structure: data.folder_structure || '',
        architecture_style: data.architecture_style || 'MVC Pattern',
        recommended_database: data.recommended_database || 'PostgreSQL',
        auth_strategy: data.auth_strategy || 'JWT Authentication',
        deployment_suggestion: data.deployment_suggestion || 'Vercel / Docker Container',
        testing_strategy: data.testing_strategy || 'Jest / Cypress',
        potential_risks: data.potential_risks || [],
        final_deliverables: data.final_deliverables || [],
        milestones: mappedMilestones
      }
      
      setHistory([JSON.parse(JSON.stringify(initialProject))])
      setHistoryIndex(0)
      setProject(initialProject)
      setIsDirty(false)
      setStep('preview')
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'An error occurred while generating the plan. Please try again.')
      setStep('prompt')
    }
  }

  // --- Section Micro-Regenerations via Copilot Chat API ---
  const regenerateSection = async (sectionKey: string, detail?: string) => {
    if (!project) return
    setRegenLoading(sectionKey)
    setError(null)
    
    let instruction = ""
    if (sectionKey === 'description') {
      instruction = "Please rewrite and detail the project description."
    } else if (sectionKey === 'tech_stack') {
      instruction = "Update the recommended tech stack and explain details."
    } else if (sectionKey === 'risks') {
      instruction = "Re-analyze risks and provide more specific engineering challenges."
    } else if (sectionKey === 'deliverables') {
      instruction = "Rewrite final deliverables to be more granular."
    } else if (sectionKey.startsWith('milestone-')) {
      instruction = `Regenerate the milestone details and acceptance criteria for: "${detail}"`
    } else if (sectionKey.startsWith('task-')) {
      instruction = `Regenerate the task details and estimation for: "${detail}"`
    }

    try {
      const data = await aiService.copilotChat(project, instruction)
      if (data.updated_project) {
        pushHistory(data.updated_project)
        setToastMessage("Section updated successfully!")
        setTimeout(() => setToastMessage(null), 2500)
      }
    } catch (err: any) {
      console.error(err)
      setToastMessage("Failed to regenerate section.")
      setTimeout(() => setToastMessage(null), 2500)
    } finally {
      setRegenLoading(null)
    }
  }

  // --- Interactive Copilot Chat Sidebar ---
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !project) return
    
    const userMsg = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setChatInput('')
    setChatLoading(true)
    
    try {
      const data = await aiService.copilotChat(project, userMsg)
      if (data.updated_project) {
        pushHistory(data.updated_project)
        setChatMessages(prev => [...prev, { role: 'assistant', text: `I have updated the project configurations based on your request: "${userMsg}". Check the updated details in the editor!` }])
      }
    } catch (err: any) {
      console.error(err)
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Error updating plan: ${err.message || 'Server error'}` }])
    } finally {
      setChatLoading(false)
    }
  }

  // --- Export features ---
  const exportJSON = () => {
    if (!project) return
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.project_name.toLowerCase().replace(/\s+/g, '-')}-plan.json`
    a.click()
  }

  const exportMarkdown = () => {
    if (!project) return
    let md = `# Project Plan: ${project.project_name}\n\n`
    md += `## Description\n${project.description}\n\n`
    md += `* **Estimated Timeline**: ${project.estimated_duration_weeks} Weeks\n`
    md += `* **Architecture Style**: ${project.architecture_style}\n`
    md += `* **Database**: ${project.recommended_database}\n`
    md += `* **Auth Strategy**: ${project.auth_strategy}\n\n`
    
    md += `## Recommended Tech Stack\n`
    project.recommended_tech_stack.forEach(tech => { md += `- ${tech}\n` })
    md += `\n## Folder Structure\n\`\`\`\n${project.folder_structure}\n\`\`\`\n\n`
    
    md += `## Milestones & Tasks\n\n`
    project.milestones.forEach((m, idx) => {
      md += `### Milestone #${idx + 1}: ${m.title}\n`
      md += `*Description*: ${m.description}\n`
      md += `*Acceptance Criteria*: ${m.acceptance_criteria}\n\n`
      md += `| Task | Description | Priority | Estimated Hours |\n`
      md += `| --- | --- | --- | --- |\n`
      m.tasks.forEach(t => {
        md += `| ${t.title} | ${t.description} | ${t.priority} | ${t.estimated_hours} |\n`
      })
      md += `\n`
    })

    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.project_name.toLowerCase().replace(/\s+/g, '-')}-plan.md`
    a.click()
  }

  // --- Import features ---
  const triggerImportFile = () => {
    fileInputRef.current?.click()
  }

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        // Perform simple structural verification
        if (imported.project_name && imported.milestones) {
          pushHistory(imported)
          setStep('preview')
          setToastMessage('Imported JSON plan successfully!')
          setTimeout(() => setToastMessage(null), 2500)
        } else {
          alert('Invalid project configuration file format.')
        }
      } catch (err) {
        alert('Failed to parse JSON file.')
      }
    }
    reader.readAsText(file)
  }

  // cancel warning triggers
  const handleCancel = () => {
    if (isDirty) {
      setPendingRoute('/projects')
      setShowExitWarning(true)
    } else {
      router.push('/projects')
    }
  }

  // final create project trigger
  const handleCreateProject = async () => {
    if (!project) return
    
    const errors: string[] = []
    if (!project.project_name.trim()) errors.push('Project Name is required.')
    
    project.milestones.forEach((m, mIdx) => {
      if (!m.title.trim()) errors.push(`Milestone #${mIdx + 1} title is required.`)
      m.tasks.forEach((t) => {
        if (!t.title.trim()) errors.push(`Task "${t.title}" title is required.`)
      })
    })
    
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    
    setValidationErrors([])
    setCreating(true)
    setCreationStatus('Provisioning database structures...')
    
    try {
      const createdProject = await projectService.createProject({
        name: project.project_name,
        description: project.description || undefined,
        color: 'purple',
        icon: '🤖',
        status: 'Active',
        priority: 'High',
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
      }, 2000)
      
    } catch (err: any) {
      console.error(err)
      setValidationErrors([err.response?.data?.detail || 'Failed to persist plan.'])
      setCreating(false)
    }
  }

  // --- Mutators ---
  const updateMilestone = (mId: string, field: keyof MilestoneState, value: any) => {
    updateMilestoneField(mId, field, value)
  }

  const updateTask = (mId: string, tId: string, field: keyof TaskState, value: any) => {
    updateTaskField(mId, tId, field, value)
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12 relative">
        {/* Hidden File Input for Import */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportJSON}
          accept=".json"
          className="hidden"
        />

        {/* Global Toast */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 p-4 rounded-xl bg-primary text-black font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="h-4 w-4" /> {toastMessage}
          </div>
        )}

        {/* Exit Warning */}
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

        {/* Page progress header */}
        <div className="rounded-2xl border border-white/5 bg-[#09090b] p-6 shadow-md flex justify-between items-center text-xs">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI Project Copilot
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Iteratively plan and structure your workspace cycles</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={triggerImportFile}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 transition-all cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" /> Import JSON
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 transition-all cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>

        {creating && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <div className="h-12 w-12 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin mb-4" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{creationStatus}</h3>
            <p className="text-xs text-muted-foreground mt-1">Initializing database models...</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Prompt & Configuration */}
          {step === 'prompt' && (
            <motion.div
              key="prompt-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-6">
                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-3 items-start">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Generation Failed</p>
                      <p className="mt-1 opacity-90">{error}</p>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-white/5 bg-[#09090b] p-6 space-y-4 shadow-xl">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white block text-left">
                      Describe your project concept:
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. Build an Airbnb Clone with real-time bookings..."
                      rows={5}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.01] text-sm text-white placeholder-[#52525b] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none transition-all"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleGenerate()}
                      disabled={!prompt.trim()}
                      className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/95 text-black font-semibold px-6 py-2.5 text-sm transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" /> Start Copilot Session
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Configuration Settings sidebar */}
              <div className="rounded-2xl border border-white/5 bg-[#09090b] p-6 space-y-4 shadow-xl h-fit">
                <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-white/5 pb-3">
                  <Settings className="h-4 w-4 text-primary" /> Advanced Config
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Project Type</label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#18181b] text-xs text-white outline-none"
                    >
                      <option value="Web Application">Web Application</option>
                      <option value="Mobile App">Mobile App</option>
                      <option value="SaaS">SaaS</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="Desktop Application">Desktop Application</option>
                      <option value="API Backend">API Backend</option>
                      <option value="E-Commerce">E-Commerce</option>
                      <option value="Portfolio">Portfolio</option>
                      <option value="CRM">CRM</option>
                      <option value="ERP">ERP</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#18181b] text-xs text-white outline-none"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Estimated Timeline</label>
                    <select
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#18181b] text-xs text-white outline-none"
                    >
                      <option value="2 Weeks">2 Weeks</option>
                      <option value="1 Month">1 Month</option>
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months">6 Months</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Team Size</label>
                    <select
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#18181b] text-xs text-white outline-none"
                    >
                      <option value="Solo">Solo</option>
                      <option value="2–5">2–5</option>
                      <option value="5–10">5–10</option>
                      <option value="10+">10+</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Preferred Stack (Optional)</label>
                    <input
                      type="text"
                      value={techStackInput}
                      onChange={(e) => setTechStackInput(e.target.value)}
                      placeholder="e.g. Next.js, FastAPI, Postgres"
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.01] text-xs text-white outline-none placeholder-[#52525b]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Loading Status & Shimmers */}
          {step === 'loading' && (
            <motion.div
              key="loading-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-white/5 bg-[#09090b] p-12 text-center flex flex-col items-center justify-center space-y-6 shadow-xl">
                <div className="h-10 w-10 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-white animate-pulse">
                  {statusMessages[statusMsgIdx]}
                </h3>
              </div>
            </motion.div>
          )}

          {/* Step 3: Copilot Preview & Refining Editor */}
          {step === 'preview' && project && (
            <motion.div
              key="preview-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6"
            >
              {/* Main Content Area */}
              <div className="lg:col-span-3 space-y-6">
                {validationErrors.length > 0 && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-2.5 items-start">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">Correct validation errors:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1 opacity-90">
                        {validationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Edit Controls Toolbar */}
                <div className="flex justify-between items-center bg-[#09090b] p-3.5 rounded-xl border border-white/5 text-xs">
                  <div className="flex gap-2">
                    <button
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className="p-1 text-muted-foreground hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Undo"
                    >
                      <Undo2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      className="p-1 text-muted-foreground hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Redo"
                    >
                      <Redo2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleResetToInitial}
                      disabled={historyIndex <= 0}
                      className="p-1 text-muted-foreground hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Reset to Initial AI Plan"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={exportJSON}
                      className="flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/5 transition-all text-[11px] font-semibold text-white cursor-pointer"
                    >
                      <Download className="h-3 w-3" /> Export JSON
                    </button>
                    <button
                      onClick={exportMarkdown}
                      className="flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/5 transition-all text-[11px] font-semibold text-white cursor-pointer"
                    >
                      <FileText className="h-3 w-3" /> Export Markdown
                    </button>
                  </div>
                </div>

                {/* Main Tabs Navigation */}
                <div className="flex border-b border-white/5">
                  <button
                    onClick={() => setActiveTab('roadmap')}
                    className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                      activeTab === 'roadmap' ? 'border-primary text-white' : 'border-transparent text-muted-foreground hover:text-white'
                    }`}
                  >
                    Milestones & Tasks
                  </button>
                  <button
                    onClick={() => setActiveTab('architecture')}
                    className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                      activeTab === 'architecture' ? 'border-primary text-white' : 'border-transparent text-muted-foreground hover:text-white'
                    }`}
                  >
                    AI Recommendations
                  </button>
                  <button
                    onClick={() => setActiveTab('risks')}
                    className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                      activeTab === 'risks' ? 'border-primary text-white' : 'border-transparent text-muted-foreground hover:text-white'
                    }`}
                  >
                    Risks & Deliverables
                  </button>
                </div>

                {/* Tab 1: Roadmap & Milestones */}
                {activeTab === 'roadmap' && (
                  <div className="space-y-6">
                    {/* General Metadata Card */}
                    <div className="rounded-2xl border border-white/5 bg-[#09090b] p-6 space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-xs font-semibold text-white">General Scope Details</span>
                        <button
                          onClick={() => regenerateSection('description')}
                          disabled={regenLoading !== null}
                          className="text-[10px] text-primary hover:underline cursor-pointer"
                        >
                          {regenLoading === 'description' ? 'Regenerating...' : 'Regenerate Description'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Project Title</label>
                          <input
                            type="text"
                            value={project.project_name}
                            onChange={(e) => updateProjectField('project_name', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.01] text-xs text-white outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Duration (Weeks)</label>
                          <input
                            type="number"
                            min="1"
                            value={project.estimated_duration_weeks}
                            onChange={(e) => updateProjectField('estimated_duration_weeks', Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.01] text-xs text-white outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Project Description</label>
                        <textarea
                          value={project.description}
                          onChange={(e) => updateProjectField('description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.01] text-xs text-white outline-none resize-none"
                        />
                      </div>
                    </div>

                    {/* Milestones list */}
                    {project.milestones.map((m, mIdx) => (
                      <div key={m.id} className="rounded-2xl border border-white/5 bg-[#09090b] p-6 space-y-4 relative">
                        <button
                          onClick={() => deleteMilestone(m.id)}
                          className="absolute right-4 top-4 p-1.5 text-muted-foreground hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="space-y-3 max-w-[90%]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-primary uppercase">Milestone #{mIdx + 1}</span>
                              <button
                                onClick={() => regenerateSection(`milestone-${m.id}`, m.title)}
                                disabled={regenLoading !== null}
                                className="text-[9px] text-[#5BB98C] hover:underline cursor-pointer"
                              >
                                {regenLoading === `milestone-${m.id}` ? 'Regenerating...' : 'Regenerate'}
                              </button>
                            </div>
                            <input
                              type="text"
                              value={m.title}
                              onChange={(e) => updateMilestone(m.id, 'title', e.target.value)}
                              className="w-full bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-white/10 focus:border-primary outline-none py-0.5"
                            />
                          </div>
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={m.description}
                              onChange={(e) => updateMilestone(m.id, 'description', e.target.value)}
                              className="w-full bg-transparent text-xs text-muted-foreground border-b border-transparent hover:border-white/10 focus:border-primary outline-none py-0.5"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase">Acceptance Criteria</label>
                            <input
                              type="text"
                              value={m.acceptance_criteria}
                              onChange={(e) => updateMilestone(m.id, 'acceptance_criteria', e.target.value)}
                              className="w-full bg-transparent text-xs text-white border-b border-transparent hover:border-white/10 focus:border-primary outline-none py-0.5"
                            />
                          </div>
                        </div>

                        {/* Tasks list */}
                        <div className="border-t border-white/5 pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">Tasks</span>
                            <button
                              onClick={() => addTask(m.id)}
                              className="flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-white px-2 py-0.5 border border-white/5 transition-all cursor-pointer"
                            >
                              <Plus className="h-3 w-3" /> Add Task
                            </button>
                          </div>

                          <div className="space-y-2">
                            {m.tasks.map((t) => (
                              <div key={t.id} className="p-3 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] flex items-center justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                    <div className="md:col-span-2">
                                      <input
                                        type="text"
                                        value={t.title}
                                        onChange={(e) => updateTask(m.id, t.id, 'title', e.target.value)}
                                        className="w-full bg-transparent text-xs font-semibold text-white border-b border-transparent hover:border-white/10 focus:border-primary outline-none"
                                      />
                                    </div>
                                    <div>
                                      <select
                                        value={t.priority}
                                        onChange={(e) => updateTask(m.id, t.id, 'priority', e.target.value)}
                                        className="w-full px-2 py-0.5 rounded border border-white/10 bg-[#18181b] text-[10px] text-white outline-none"
                                      >
                                        <option value="LOW">LOW</option>
                                        <option value="MEDIUM">MEDIUM</option>
                                        <option value="HIGH">HIGH</option>
                                      </select>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min="1"
                                        value={t.estimated_hours}
                                        onChange={(e) => updateTask(m.id, t.id, 'estimated_hours', Number(e.target.value))}
                                        className="w-12 px-1 py-0.5 rounded border border-white/10 bg-[#18181b] text-[10px] text-center text-white outline-none"
                                      />
                                      <span className="text-[10px] text-muted-foreground">h</span>
                                    </div>
                                  </div>
                                  <input
                                    type="text"
                                    value={t.description}
                                    onChange={(e) => updateTask(m.id, t.id, 'description', e.target.value)}
                                    className="w-full bg-transparent text-[11px] text-muted-foreground border-b border-transparent hover:border-white/10 focus:border-primary outline-none"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => regenerateSection(`task-${t.id}`, t.title)}
                                    disabled={regenLoading !== null}
                                    className="p-1 text-muted-foreground hover:text-white text-[10px] cursor-pointer"
                                  >
                                    Regen
                                  </button>
                                  <button
                                    onClick={() => deleteTask(m.id, t.id)}
                                    className="p-1 text-muted-foreground hover:text-red-400 cursor-pointer"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 2: Architecture & Recommendations */}
                {activeTab === 'architecture' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/5 bg-[#09090b] p-6 space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Settings className="h-4 w-4 text-primary" /> Tech Stack & Structure Recommendation
                        </h4>
                        <button
                          onClick={() => regenerateSection('tech_stack')}
                          disabled={regenLoading !== null}
                          className="text-[10px] text-primary hover:underline cursor-pointer"
                        >
                          {regenLoading === 'tech_stack' ? 'Regenerating...' : 'Regenerate Stacks'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase block">Recommended Tech Stack</label>
                          <div className="flex flex-wrap gap-1.5">
                            {project.recommended_tech_stack.map((tech, idx) => (
                              <span key={idx} className="bg-white/5 border border-white/10 px-2.5 py-1 rounded text-xs text-white">{tech}</span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase block">Database Recommendation</label>
                          <input
                            type="text"
                            value={project.recommended_database}
                            onChange={(e) => updateProjectField('recommended_database', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.01] text-xs text-white outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase block">Architecture Style</label>
                          <input
                            type="text"
                            value={project.architecture_style}
                            onChange={(e) => updateProjectField('architecture_style', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.01] text-xs text-white outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase block">Authentication Strategy</label>
                          <input
                            type="text"
                            value={project.auth_strategy}
                            onChange={(e) => updateProjectField('auth_strategy', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.01] text-xs text-white outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase block">Deployment Setup</label>
                          <input
                            type="text"
                            value={project.deployment_suggestion}
                            onChange={(e) => updateProjectField('deployment_suggestion', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.01] text-xs text-white outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase block">Testing Strategy</label>
                          <input
                            type="text"
                            value={project.testing_strategy}
                            onChange={(e) => updateProjectField('testing_strategy', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.01] text-xs text-white outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block">Proposed Folder Directory Layout</label>
                        <textarea
                          value={project.folder_structure}
                          onChange={(e) => updateProjectField('folder_structure', e.target.value)}
                          rows={10}
                          className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.01] text-xs font-mono text-[#5BB98C] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Risks & Deliverables */}
                {activeTab === 'risks' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/5 bg-[#09090b] p-6 space-y-6">
                      {/* Potential Risks */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Potential Risks</h4>
                          <button
                            onClick={() => regenerateSection('risks')}
                            disabled={regenLoading !== null}
                            className="text-[10px] text-primary hover:underline cursor-pointer"
                          >
                            {regenLoading === 'risks' ? 'Regenerating...' : 'Regenerate Risks'}
                          </button>
                        </div>
                        <div className="space-y-2">
                          {project.potential_risks.map((risk, idx) => (
                            <div key={idx} className="flex gap-2 items-center text-xs text-muted-foreground">
                              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                              <input
                                type="text"
                                value={risk}
                                onChange={(e) => {
                                  const updated = [...project.potential_risks]
                                  updated[idx] = e.target.value
                                  updateProjectField('potential_risks', updated)
                                }}
                                className="bg-transparent border-b border-transparent hover:border-white/10 focus:border-primary outline-none py-0.5 text-white flex-1"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Final Deliverables */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Final Deliverables</h4>
                          <button
                            onClick={() => regenerateSection('deliverables')}
                            disabled={regenLoading !== null}
                            className="text-[10px] text-primary hover:underline cursor-pointer"
                          >
                            {regenLoading === 'deliverables' ? 'Regenerating...' : 'Regenerate Deliverables'}
                          </button>
                        </div>
                        <div className="space-y-2">
                          {project.final_deliverables.map((del, idx) => (
                            <div key={idx} className="flex gap-2 items-center text-xs text-muted-foreground">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                              <input
                                type="text"
                                value={del}
                                onChange={(e) => {
                                  const updated = [...project.final_deliverables]
                                  updated[idx] = e.target.value
                                  updateProjectField('final_deliverables', updated)
                                }}
                                className="bg-transparent border-b border-transparent hover:border-white/10 focus:border-primary outline-none py-0.5 text-white flex-1"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex justify-between items-center border-t border-white/5 pt-6 bg-[#09090b] p-4 rounded-xl border border-white/5">
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
                      className="rounded-xl bg-[#5BB98C] hover:bg-[#4ea87d] text-black font-bold px-6 py-2.5 text-xs transition-all cursor-pointer"
                    >
                      Create Project
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab/Sidebar: AI Copilot Chat assistant side panel */}
              <div className="rounded-2xl border border-white/5 bg-[#09090b] p-4 flex flex-col h-[650px] shadow-xl justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-primary" /> AI Copilot Panel
                    </span>
                  </div>

                  {/* Chat messages viewport */}
                  <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1.5 mt-3 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`p-3 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                        msg.role === 'user' ? 'bg-primary text-black ml-auto font-medium' : 'bg-white/5 text-white mr-auto'
                      }`}>
                        {msg.text}
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="p-3 rounded-lg text-xs bg-white/5 text-muted-foreground animate-pulse mr-auto">
                        Updating project plan JSON configuration...
                      </div>
                    )}
                  </div>
                </div>

                {/* Input submission box */}
                <form onSubmit={handleChatSubmit} className="flex gap-1.5 pt-3 border-t border-white/5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask Copilot (e.g. Add Auth)..."
                    disabled={chatLoading}
                    className="flex-1 bg-white/[0.02] border border-white/10 px-3 py-2 rounded-lg text-xs text-white outline-none focus:border-primary placeholder-muted-foreground disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="p-2 bg-primary text-black hover:bg-primary/95 rounded-lg transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
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
