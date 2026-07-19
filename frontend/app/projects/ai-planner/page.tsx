'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MainLayout } from '@/components/layout/main-layout'
import { generateProjectPlan, ProjectPlanResponse } from '@/services/ai'
import { 
  Sparkles, 
  Layers, 
  Clock, 
  AlertCircle,
  FileText,
  Settings
} from 'lucide-react'

export default function AIProjectCopilotPage() {
  // Input Form States
  const [prompt, setPrompt] = useState('')
  const [projectType, setProjectType] = useState('Web Application')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [timeline, setTimeline] = useState('1 Month')
  const [teamSize, setTeamSize] = useState('2–5')
  const [techStackInput, setTechStackInput] = useState('')

  // Control States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<ProjectPlanResponse | null>(null)

  // Call generation API
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!prompt.trim()) return
    
    setError(null)
    setLoading(true)
    setPlan(null)
    
    try {
      const data = await generateProjectPlan({
        idea: prompt,
        project_type: projectType,
        difficulty,
        timeline,
        preferred_stack: techStackInput || undefined
      })
      setPlan(data)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'An error occurred while generating the plan. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-primary/10 via-card/50 to-primary/5 p-6 md:p-8 flex items-center gap-4 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">AI Project Planner</h1>
            <p className="text-sm text-muted-foreground">
              Define your concept, select stack options, and immediately output a scoped project plan.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="w-full">
          <form onSubmit={handleGenerate} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-3 items-start text-left">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Generation Failed</p>
                  <p className="mt-1 opacity-90">{error}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Prompt Input */}
              <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#09090b] p-6 space-y-4 shadow-xl">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white block text-left">
                    Describe your project concept:
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Build an Airbnb Clone with real-time bookings..."
                    rows={8}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.01] text-sm text-white placeholder-[#52525b] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Right Column: Advanced Configuration Settings */}
              <div className="rounded-2xl border border-white/5 bg-[#09090b] p-6 space-y-4 shadow-xl h-fit">
                <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-white/5 pb-3">
                  <Settings className="h-4 w-4 text-primary" /> Configuration
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block text-left">Project Type</label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#18181b] text-xs text-white outline-none disabled:opacity-50"
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
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block text-left">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#18181b] text-xs text-white outline-none disabled:opacity-50"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block text-left">Estimated Timeline</label>
                    <select
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#18181b] text-xs text-white outline-none disabled:opacity-50"
                    >
                      <option value="2 Weeks">2 Weeks</option>
                      <option value="1 Month">1 Month</option>
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months">6 Months</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block text-left">Preferred Stack (Optional)</label>
                    <input
                      type="text"
                      value={techStackInput}
                      onChange={(e) => setTechStackInput(e.target.value)}
                      placeholder="e.g. Next.js, FastAPI, Postgres"
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.01] text-xs text-white outline-none placeholder-[#52525b] disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 active:scale-95 focus:ring-2 focus:ring-primary/50 focus:outline-none text-black font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-primary/10"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Generating Project Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4.5 w-4.5" /> Generate Project Plan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Empty State / Result Rendering */}
        {!loading && !plan && !error && (
          <div className="py-16 rounded-2xl border border-dashed border-white/5 bg-white/[0.005] text-center flex flex-col items-center justify-center p-6">
            <Sparkles className="h-10 w-10 text-muted-foreground mb-3 animate-pulse" />
            <p className="text-sm font-medium text-muted-foreground">
              Describe your idea and generate an AI project roadmap.
            </p>
          </div>
        )}

        {loading && (
          <div className="py-16 rounded-2xl border border-white/5 bg-[#09090b] text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
            <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Formulating project architecture and mapping workflows...</p>
          </div>
        )}

        {plan && (
          <div className="space-y-8 text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* 1. Project Header */}
            <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-primary/10 via-card/50 to-primary/5 p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{plan.title}</h2>
              <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-3xl leading-relaxed">{plan.description}</p>
            </div>

            {/* 2. Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-primary" /> Key Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                    <span className="text-xs font-semibold text-primary/80 uppercase tracking-widest block mb-1">Feature {idx + 1}</span>
                    <p className="text-sm text-foreground leading-normal">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Tech Stack */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-primary" /> Tech Stack
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors space-y-1">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Frontend</span>
                  <p className="text-sm text-white font-medium">{plan.tech_stack.frontend}</p>
                </div>
                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors space-y-1">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">Backend</span>
                  <p className="text-sm text-white font-medium">{plan.tech_stack.backend}</p>
                </div>
                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors space-y-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Database</span>
                  <p className="text-sm text-white font-medium">{plan.tech_stack.database}</p>
                </div>
              </div>
            </div>

            {/* 4. Milestones */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-primary" /> Project Milestones
              </h3>
              <div className="relative pl-6 border-l border-white/10 ml-4 space-y-6">
                {plan.milestones.map((milestone, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[34px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 border border-primary/40 text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-semibold text-white">{milestone}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Tasks */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" /> Scoped Tasks
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.tasks.map((task, idx) => {
                  const prioLower = (task.priority || '').toLowerCase()
                  let badgeClass = 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                  if (prioLower === 'high' || prioLower === 'urgent') {
                    badgeClass = 'bg-red-500/10 text-red-400 border-red-500/20'
                  } else if (prioLower === 'medium') {
                    badgeClass = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  } else if (prioLower === 'low') {
                    badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }

                  return (
                    <div key={idx} className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all flex flex-col justify-between gap-3 text-left">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-sm font-bold text-white truncate">{task.title}</h4>
                          <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-md px-1.5 py-0.5 ${badgeClass}`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-normal line-clamp-3">{task.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
