'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Sparkles,
  Database,
  Layers,
  Activity,
  Network,
  Download,
  FileText,
  RefreshCw,
  CheckCircle2,
  Folder,
  Terminal,
  Zap,
  ArrowRight,
  Server,
  Code
} from 'lucide-react'
import {
  generateProjectPlan,
  generateMilestonePlan,
  generateDatabaseDesign,
  generateApiDesign,
  generateArchitecture,
  ProjectPlanResponse,
  MilestonePlanResponse,
  DatabaseDesignResponse,
  ApiDesignResponse,
  ArchitectureResponse
} from '@/services/ai'

interface CompleteBlueprint {
  project_plan: ProjectPlanResponse
  milestone_plan: MilestonePlanResponse
  database_design: DatabaseDesignResponse
  api_design: ApiDesignResponse
  architecture: ArchitectureResponse
}

type GenerationStep =
  | 'idle'
  | 'project-plan'
  | 'milestone'
  | 'database'
  | 'api'
  | 'architecture'
  | 'ready'

export default function BlueprintPage() {
  // Input settings states
  const [prompt, setPrompt] = useState('Build a collaborative task management board with real-time sync')
  const [projectType, setProjectType] = useState('Web Application')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [timeline, setTimeline] = useState('1 Month')
  const [techStackInput, setTechStackInput] = useState('Next.js, FastAPI, PostgreSQL')

  // Orchestrator flow control states
  const [step, setStep] = useState<GenerationStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const [blueprint, setBlueprint] = useState<CompleteBlueprint | null>(null)

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!prompt.trim()) return

    setError(null)
    setBlueprint(null)
    setStep('project-plan')

    try {
      // 1. Generate Project Plan
      const projectPlan = await generateProjectPlan({
        idea: prompt,
        project_type: projectType,
        difficulty,
        timeline,
        preferred_stack: techStackInput || undefined
      })

      // 2. Generate Milestone Plan (using first milestone from project plan)
      setStep('milestone')
      const firstMilestone = projectPlan.milestones?.[0] || 'Initial Setup'
      const milestonePlan = await generateMilestonePlan({
        project_title: projectPlan.title,
        milestone: firstMilestone,
        preferred_stack: techStackInput || undefined
      })

      // 3. Generate Database Design
      setStep('database')
      const databaseDesign = await generateDatabaseDesign({
        project_title: projectPlan.title,
        description: projectPlan.description,
        preferred_database: projectPlan.tech_stack?.database || techStackInput || undefined
      })

      // 4. Generate API Design
      setStep('api')
      const tablesList = databaseDesign.tables?.map((t) => t.name) || []
      const apiDesign = await generateApiDesign({
        project_title: projectPlan.title,
        description: projectPlan.description,
        database_tables: tablesList
      })

      // 5. Generate Architecture
      setStep('architecture')
      const resourceNames = apiDesign.resources?.map((r) => r.name) || []
      const architecture = await generateArchitecture({
        project_title: projectPlan.title,
        description: projectPlan.description,
        tech_stack: projectPlan.tech_stack,
        database_tables: tablesList,
        api_resources: resourceNames
      })

      setBlueprint({
        project_plan: projectPlan,
        milestone_plan: milestonePlan,
        database_design: databaseDesign,
        api_design: apiDesign,
        architecture: architecture
      })
      setStep('ready')
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'An error occurred during blueprint generation. Please try again.')
      setStep('idle')
    }
  }

  // File download handlers
  const handleDownloadJson = () => {
    if (!blueprint) return
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(blueprint, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `${blueprint.project_plan.title.toLowerCase().replace(/\s+/g, '_')}_blueprint.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleExportMarkdown = () => {
    if (!blueprint) return
    const mdContent = `
# Software Engineering Blueprint: ${blueprint.project_plan.title}

## 1. Overview
${blueprint.project_plan.description}

- **Difficulty**: ${difficulty}
- **Timeline**: ${timeline}
- **Preferred Stack**: ${techStackInput || 'Not Specified'}

## 2. Tech Stack Recommendations
- **Frontend**: ${blueprint.project_plan.tech_stack.frontend}
- **Backend**: ${blueprint.project_plan.tech_stack.backend}
- **Database**: ${blueprint.project_plan.tech_stack.database}

## 3. Database Design Details
Selected Database: ${blueprint.database_design.database}

### Tables
${blueprint.database_design.tables.map((table) => `
#### Table: ${table.name}
*Description*: ${table.description}
*Columns*:
${table.columns.map((c) => `- \`${c.name}\` (${c.type}) ${c.primary_key ? '[PK]' : ''} ${c.nullable ? '[Null]' : '[Not Null]'} ${c.unique ? '[Unique]' : ''}`).join('\n')}
`).join('\n')}

## 4. API Design Specs
Base URL: \`${blueprint.api_design.base_url}\`
Authentication: ${blueprint.api_design.authentication.login.description} (${blueprint.api_design.authentication.login.method} ${blueprint.api_design.authentication.login.path})

### Endpoints
${blueprint.api_design.resources.map((res) => `
#### Resource: ${res.name}
${res.endpoints.map((e) => `- **${e.method}** \`${e.path}\` : ${e.description}`).join('\n')}
`).join('\n')}

## 5. System Architecture Layout
- **Style**: ${blueprint.architecture.architecture_style}
- **Core Modules**: ${blueprint.architecture.modules.join(', ')}
- **External Dependencies**: ${blueprint.architecture.external_services.join(', ')}
- **Communication Flow**: ${blueprint.architecture.communication}
    `
    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(mdContent.trim())
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `${blueprint.project_plan.title.toLowerCase().replace(/\s+/g, '_')}_blueprint.md`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Calculate statistics metrics
  const totalFeatures = blueprint?.project_plan.features?.length || 0
  const totalTables = blueprint?.database_design.tables?.length || 0
  const totalEndpoints = blueprint?.api_design.resources?.reduce((acc, r) => acc + r.endpoints.length, 0) || 0
  const totalMilestones = blueprint?.project_plan.milestones?.length || 0
  const totalModules = blueprint?.architecture.modules?.length || 0

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-primary/10 via-card/50 to-primary/5 p-6 md:p-8 flex items-center gap-4 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">Blueprint Orchestrator</h1>
            <p className="text-sm text-muted-foreground">
              Generate a unified full-stack software blueprint coordinating backend database structures, API schemas, architectures, and timeline plans.
            </p>
          </div>
        </div>

        {/* Configurations Form */}
        <div className="rounded-2xl border border-white/5 bg-card/20 p-6 backdrop-blur-xl">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Idea */}
              <div className="lg:col-span-2 space-y-2 text-left">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Describe your project concept:</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Build a project management platform like Jira with AI assistance"
                  disabled={step !== 'idle' && step !== 'ready'}
                  className="w-full h-32 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] focus:border-primary/50 text-sm text-white outline-none resize-none placeholder-[#52525b] transition-all disabled:opacity-50"
                  required
                />
              </div>

              {/* Right Column: Settings */}
              <div className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Type</label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      disabled={step !== 'idle' && step !== 'ready'}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#09090b] text-xs text-white outline-none cursor-pointer hover:bg-white/[0.02] disabled:opacity-50"
                    >
                      <option value="Web Application">Web App</option>
                      <option value="Mobile Application">Mobile App</option>
                      <option value="API Service">API Service</option>
                      <option value="Desktop Application">Desktop App</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      disabled={step !== 'idle' && step !== 'ready'}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#09090b] text-xs text-white outline-none cursor-pointer hover:bg-white/[0.02] disabled:opacity-50"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timeline</label>
                    <select
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      disabled={step !== 'idle' && step !== 'ready'}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#09090b] text-xs text-white outline-none cursor-pointer hover:bg-white/[0.02] disabled:opacity-50"
                    >
                      <option value="1 Week">1 Week</option>
                      <option value="1 Month">1 Month</option>
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months">6 Months</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preferred Stack</label>
                    <input
                      type="text"
                      value={techStackInput}
                      onChange={(e) => setTechStackInput(e.target.value)}
                      placeholder="e.g. Next.js, Go, MySQL"
                      disabled={step !== 'idle' && step !== 'ready'}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.01] text-xs text-white outline-none placeholder-[#52525b] disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-left text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Action button: Height 48px, horizontal padding, active:scale, focus ring */}
            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={step !== 'idle' && step !== 'ready'}
                className="flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 active:scale-95 focus:ring-2 focus:ring-primary/50 focus:outline-none text-black font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-primary/10"
              >
                {step !== 'idle' && step !== 'ready' ? (
                  <>
                    <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Generating Complete Blueprint...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4.5 w-4.5" /> Generate Complete Blueprint
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Loading Progress steps */}
        {step !== 'idle' && step !== 'ready' && (
          <div className="p-8 rounded-2xl border border-white/5 bg-[#09090b] text-center flex flex-col items-center justify-center space-y-6 shadow-xl">
            <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="space-y-2 text-center">
              <p className="text-sm font-semibold text-white">Orchestrating AI Services...</p>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <div className={`flex items-center gap-2 justify-center ${step === 'project-plan' ? 'text-primary font-bold' : ''}`}>
                  <span>Generating Project Plan...</span>
                  {step !== 'project-plan' && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className={`flex items-center gap-2 justify-center ${step === 'milestone' ? 'text-primary font-bold' : ''}`}>
                  <span>Generating Milestones...</span>
                  {step !== 'project-plan' && step !== 'milestone' && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className={`flex items-center gap-2 justify-center ${step === 'database' ? 'text-primary font-bold' : ''}`}>
                  <span>Generating Database Design...</span>
                  {step !== 'project-plan' && step !== 'milestone' && step !== 'database' && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className={`flex items-center gap-2 justify-center ${step === 'api' ? 'text-primary font-bold' : ''}`}>
                  <span>Generating API Design...</span>
                  {step !== 'project-plan' && step !== 'milestone' && step !== 'database' && step !== 'api' && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className={`flex items-center gap-2 justify-center ${step === 'architecture' ? 'text-primary font-bold' : ''}`}>
                  <span>Generating Architecture...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blueprint Dashboard content */}
        {step === 'ready' && blueprint && (
          <div className="space-y-8 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Download and utility buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={handleDownloadJson}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-all active:scale-95"
              >
                <Download className="h-3.5 w-3.5" /> Download Blueprint
              </button>
              <button
                onClick={handleExportMarkdown}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-all active:scale-95"
              >
                <FileText className="h-3.5 w-3.5" /> Export Markdown
              </button>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </button>
            </div>

            {/* Section 1: Overview */}
            <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-primary/10 via-card/50 to-primary/5 p-6 md:p-8 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">{projectType}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">{difficulty}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">{timeline}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{blueprint.project_plan.title}</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-4xl">{blueprint.project_plan.description}</p>
            </div>

            {/* Section 8: Summary statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Total Features</span>
                <p className="text-2xl font-bold text-white mt-1">{totalFeatures}</p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Total Tables</span>
                <p className="text-2xl font-bold text-white mt-1">{totalTables}</p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Total API Endpoints</span>
                <p className="text-2xl font-bold text-white mt-1">{totalEndpoints}</p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Total Milestones</span>
                <p className="text-2xl font-bold text-white mt-1">{totalMilestones}</p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors col-span-2 md:col-span-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Total Modules</span>
                <p className="text-2xl font-bold text-white mt-1">{totalModules}</p>
              </div>
            </div>

            {/* Section 2: Tech Stack */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Server className="h-4.5 w-4.5 text-primary" /> Recommended Tech Stack
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Frontend</span>
                  <p className="text-base font-bold text-white mt-1">{blueprint.project_plan.tech_stack.frontend}</p>
                </div>
                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Backend</span>
                  <p className="text-base font-bold text-white mt-1">{blueprint.project_plan.tech_stack.backend}</p>
                </div>
                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Database</span>
                  <p className="text-base font-bold text-white mt-1">{blueprint.database_design.database || blueprint.project_plan.tech_stack.database}</p>
                </div>
              </div>
            </div>

            {/* Section 3: Project Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-primary" /> Project Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {blueprint.project_plan.features?.map((feature, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                    <p className="text-sm font-semibold text-white leading-relaxed">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Milestones vertical timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-primary" /> Milestones Roadmap
              </h3>
              <div className="relative border-l border-white/10 pl-6 ml-4 space-y-6">
                {blueprint.project_plan.milestones?.map((m, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[34px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 border border-primary/40 text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">{m}</h4>
                      {idx === 0 && blueprint.milestone_plan && (
                        <div className="mt-2 p-4 rounded-xl border border-white/5 bg-white/[0.005] max-w-3xl space-y-3">
                          <p className="text-xs text-muted-foreground leading-relaxed">{blueprint.milestone_plan.overview}</p>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Subtasks Detail</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {blueprint.milestone_plan.subtasks?.map((st, sIdx) => (
                                <div key={sIdx} className="p-3 rounded-lg bg-white/[0.01] border border-white/5 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-white">{st.title}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{st.priority}</span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">{st.description}</p>
                                  <span className="text-[9px] text-muted-foreground block">{st.estimated_hours} Hours</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5: Database Design */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-primary" /> Database Design Structure
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blueprint.database_design.tables?.map((table, tIdx) => (
                  <div key={tIdx} className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Terminal className="h-4 w-4 text-primary" /> {table.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">{table.description}</p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Columns Schema</span>
                      <div className="overflow-hidden rounded-lg border border-white/5 bg-white/[0.005] text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                              <th className="p-2 font-semibold text-muted-foreground">Column</th>
                              <th className="p-2 font-semibold text-muted-foreground">Type</th>
                              <th className="p-2 font-semibold text-muted-foreground text-center">Attributes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.columns?.map((c, cIdx) => (
                              <tr key={cIdx} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.01]">
                                <td className="p-2 font-mono text-white">{c.name}</td>
                                <td className="p-2 font-mono text-muted-foreground">{c.type}</td>
                                <td className="p-2 text-center flex items-center justify-center gap-1">
                                  {c.primary_key && <span className="text-[9px] px-1 py-0.25 rounded bg-amber-500/10 text-amber-500 font-bold">PK</span>}
                                  {c.unique && <span className="text-[9px] px-1 py-0.25 rounded bg-blue-500/10 text-blue-500 font-bold">UQ</span>}
                                  {!c.nullable && <span className="text-[9px] px-1 py-0.25 rounded bg-red-500/10 text-red-500 font-bold">NN</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {blueprint.database_design.relationships?.length > 0 && (
                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Table Relationships</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    {blueprint.database_design.relationships.map((rel, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-white/5 bg-black/20 flex items-center justify-between">
                        <span className="font-mono text-white">{rel.from_table}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase shrink-0">{rel.relationship_type}</span>
                        <span className="font-mono text-white">{rel.to_table}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 6: REST API */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Code className="h-4.5 w-4.5 text-primary" /> REST API Resources
              </h3>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.005] max-w-md space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Base URL:</span>
                  <code className="text-white bg-white/5 px-2 py-0.5 rounded">{blueprint.api_design.base_url}</code>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Authentication:</span>
                  <span className="text-primary bg-primary/10 px-2 py-0.5 rounded font-bold text-[10px]">JWT BEARER</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blueprint.api_design.resources?.map((res, rIdx) => (
                  <div key={rIdx} className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Folder className="h-4 w-4 text-primary" /> {res.name}
                    </h4>
                    <div className="space-y-2">
                      {res.endpoints?.map((e, eIdx) => {
                        const isGet = e.method === 'GET'
                        const isPost = e.method === 'POST'
                        const isDelete = e.method === 'DELETE'
                        return (
                          <div key={eIdx} className="p-3 rounded-lg bg-white/[0.01] border border-white/5 flex items-center gap-3">
                            <span className={`w-14 text-[9px] py-1 rounded text-center font-bold shrink-0 ${isGet ? 'bg-green-500/10 text-green-500' : isPost ? 'bg-blue-500/10 text-blue-500' : isDelete ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              {e.method}
                            </span>
                            <div className="space-y-0.5 text-left">
                              <code className="text-xs text-white font-mono">{e.path}</code>
                              <p className="text-[10px] text-muted-foreground">{e.description}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 7: Architecture */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Network className="h-4.5 w-4.5 text-primary" /> Systems Architecture
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors col-span-1 md:col-span-2 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Architecture Style</span>
                    <p className="text-sm font-bold text-white">{blueprint.architecture.architecture_style}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Communication Flow</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{blueprint.architecture.communication}</p>
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider block">External Services</span>
                    <div className="flex flex-wrap gap-1.5">
                      {blueprint.architecture.external_services?.map((es, esIdx) => (
                        <span key={esIdx} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-white">{es}</span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Modules</span>
                    <div className="flex flex-wrap gap-1.5">
                      {blueprint.architecture.modules?.map((m, mIdx) => (
                        <span key={mIdx} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono font-bold">{m}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Folder Structures */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Folder className="h-4 w-4 text-primary" /> Backend Folder Structure
                  </span>
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-[10px] font-mono text-muted-foreground overflow-x-auto space-y-1">
                    {blueprint.architecture.folder_structure.backend?.map((bPath, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <ArrowRight className="h-3 w-3 text-primary shrink-0" /> {bPath}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Folder className="h-4 w-4 text-primary" /> Frontend Folder Structure
                  </span>
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-[10px] font-mono text-muted-foreground overflow-x-auto space-y-1">
                    {blueprint.architecture.folder_structure.frontend?.map((fPath, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <ArrowRight className="h-3 w-3 text-primary shrink-0" /> {fPath}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
