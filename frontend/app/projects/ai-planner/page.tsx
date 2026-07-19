'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Sparkles,
  Download,
  FileText,
  RefreshCw,
  Zap,
  CheckCircle,
  HelpCircle,
  Database,
  Code,
  Terminal,
  Server,
  Layers,
  ArrowRight
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
  ArchitectureResponse,
  createBlueprint,
  updateBlueprint
} from '@/services/ai'

import { PlannerForm } from '@/components/ai/PlannerForm'
import { OverviewSection } from '@/components/ai/OverviewSection'
import { TechStackSection } from '@/components/ai/TechStackSection'
import { FeaturesSection } from '@/components/ai/FeaturesSection'
import { MilestoneSection } from '@/components/ai/MilestoneSection'
import { DatabaseSection } from '@/components/ai/DatabaseSection'
import { ApiSection } from '@/components/ai/ApiSection'
import { ArchitectureSection } from '@/components/ai/ArchitectureSection'
import { AIChatPanel } from '@/components/ai/AIChatPanel'

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

export default function AIArchitectPage() {
  const [prompt, setPrompt] = useState('Build a collaborative task management board with real-time sync')
  const [projectType, setProjectType] = useState('Web Application')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [timeline, setTimeline] = useState('1 Month')
  const [techStackInput, setTechStackInput] = useState('Next.js, FastAPI, PostgreSQL')

  const [step, setStep] = useState<GenerationStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const [blueprint, setBlueprint] = useState<CompleteBlueprint | null>(null)
  
  const [activeTab, setActiveTab] = useState<'planner' | 'blueprint'>('planner')
  const [blueprintSubTab, setBlueprintSubTab] = useState<'overview' | 'stack' | 'features' | 'database' | 'api' | 'architecture' | 'milestones'>('overview')

  useEffect(() => {
    const saved = localStorage.getItem('devworkspace_active_blueprint')
    if (saved) {
      setBlueprint(JSON.parse(saved))
      setStep('ready')
      setActiveTab('blueprint')
    }
  }, [])

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!prompt.trim()) return

    setError(null)
    setBlueprint(null)
    setStep('project-plan')
    setActiveTab('planner')

    try {
      const projectPlan = await generateProjectPlan({
        idea: prompt,
        project_type: projectType,
        difficulty,
        timeline,
        preferred_stack: techStackInput || undefined
      })

      setStep('milestone')
      const firstMilestone = projectPlan.milestones?.[0] || 'Initial Setup'
      const milestonePlan = await generateMilestonePlan({
        project_title: projectPlan.title,
        milestone: firstMilestone,
        preferred_stack: techStackInput || undefined
      })

      setStep('database')
      const databaseDesign = await generateDatabaseDesign({
        project_title: projectPlan.title,
        description: projectPlan.description,
        preferred_database: projectPlan.tech_stack?.database || techStackInput || undefined
      })

      setStep('api')
      const tablesList = databaseDesign.tables?.map((t) => t.name) || []
      const apiDesign = await generateApiDesign({
        project_title: projectPlan.title,
        description: projectPlan.description,
        database_tables: tablesList
      })

      setStep('architecture')
      const resourceNames = apiDesign.resources?.map((r) => r.name) || []
      const architecture = await generateArchitecture({
        project_title: projectPlan.title,
        description: projectPlan.description,
        tech_stack: projectPlan.tech_stack,
        database_tables: tablesList,
        api_resources: resourceNames
      })

      const combinedBlueprint = {
        project_plan: projectPlan,
        milestone_plan: milestonePlan,
        database_design: databaseDesign,
        api_design: apiDesign,
        architecture: architecture
      }
      setBlueprint(combinedBlueprint)
      localStorage.setItem('devworkspace_active_blueprint', JSON.stringify(combinedBlueprint))
      
      try {
        const savedId = localStorage.getItem('devworkspace_active_blueprint_id')
        const payload = {
          title: projectPlan.title,
          description: projectPlan.description,
          status: 'Draft',
          overview: projectPlan,
          tech_stack: projectPlan.tech_stack,
          features: projectPlan.features,
          database_design: databaseDesign,
          api_design: apiDesign,
          architecture: architecture,
          milestones: milestonePlan
        }
        if (savedId) {
          await updateBlueprint(savedId, payload)
        } else {
          const res = await createBlueprint(payload)
          localStorage.setItem('devworkspace_active_blueprint_id', res.id)
        }
      } catch (saveErr) {
        console.error('Failed to auto-save blueprint', saveErr)
      }

      setStep('ready')
      setActiveTab('blueprint')
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'An error occurred during blueprint generation. Please try again.')
      setStep('idle')
    }
  }

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

  const isGenerating = step !== 'idle' && step !== 'ready'

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto flex gap-6 text-left relative">
        <div className="flex-1 space-y-6 min-w-0">
          {/* Header Banner */}
          <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-card/50 to-primary/5 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-black text-foreground">AI Software Architect</h1>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Translate product concepts into professional software specification architecture blueprints including databases, REST APIs, and micro-sprints.
              </p>
            </div>
            {blueprint && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDownloadJson}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#09090b] border border-border text-xs text-muted-foreground hover:text-white transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> JSON
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold transition-all cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" /> Export Markdown
                </button>
              </div>
            )}
          </div>

          {/* Stepper Status Indicators */}
          {isGenerating && (
            <div className="p-4 rounded-xl border border-border bg-card grid grid-cols-5 gap-2 text-center text-xs">
              {[
                { label: 'Project Spec', id: 'project-plan' },
                { label: 'Milestones', id: 'milestone' },
                { label: 'Database Design', id: 'database' },
                { label: 'API Routing', id: 'api' },
                { label: 'Architecture', id: 'architecture' }
              ].map((s, index) => {
                const stepOrder = ['project-plan', 'milestone', 'database', 'api', 'architecture', 'ready']
                const currentIdx = stepOrder.indexOf(step)
                const thisIdx = stepOrder.indexOf(s.id)
                const isDone = thisIdx < currentIdx
                const isAct = s.id === step
                return (
                  <div key={s.id} className="space-y-1">
                    <div className="h-1 rounded-full bg-white/5 relative overflow-hidden">
                      {isDone && <div className="absolute inset-0 bg-primary" />}
                      {isAct && <div className="absolute inset-0 bg-primary animate-pulse" />}
                    </div>
                    <span className={`text-[10px] font-bold block ${isAct ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {index + 1}. {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tabs bar */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-6 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'planner'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Planner Settings
            </button>
            <button
              onClick={() => setActiveTab('blueprint')}
              disabled={!blueprint}
              className={`px-6 py-3 text-xs font-bold transition-all border-b-2 disabled:opacity-40 cursor-pointer ${
                activeTab === 'blueprint'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Architect Blueprint
            </button>
          </div>

          <div className="space-y-6">
            {activeTab === 'planner' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {error && (
                    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-400 font-medium">
                      {error}
                    </div>
                  )}
                  <PlannerForm
                    prompt={prompt}
                    setPrompt={setPrompt}
                    projectType={projectType}
                    setProjectType={setProjectType}
                    difficulty={difficulty}
                    setDifficulty={setDifficulty}
                    timeline={timeline}
                    setTimeline={setTimeline}
                    techStackInput={techStackInput}
                    setTechStackInput={setTechStackInput}
                    onSubmit={handleGenerate}
                    loading={isGenerating}
                  />
                </div>
                <div>
                  <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Example Templates</h3>
                    <div className="space-y-2 text-xs text-muted-foreground font-bold">
                      {[
                        'Real-time Chat with file sharing',
                        'SaaS Billing Payment service engine',
                        'Airtable clone with custom field filters'
                      ].map((tmpl, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPrompt(tmpl)}
                          disabled={isGenerating}
                          className="w-full p-3 rounded-xl border border-border bg-white/[0.01] hover:bg-white/[0.02] hover:border-primary/20 text-left transition-all cursor-pointer"
                        >
                          {tmpl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              blueprint && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Blueprint subtabs bar */}
                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    {[
                      { id: 'overview', label: 'Overview' },
                      { id: 'stack', label: 'Tech Stack' },
                      { id: 'features', label: 'Features' },
                      { id: 'database', label: 'Database Design' },
                      { id: 'api', label: 'API Specs' },
                      { id: 'architecture', label: 'Architecture' },
                      { id: 'milestones', label: 'Milestones' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setBlueprintSubTab(tab.id as any)}
                        className={`px-4 py-2 rounded-lg border transition-all cursor-pointer ${
                          blueprintSubTab === tab.id
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-card text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Render active subtab section */}
                  <div className="p-6 rounded-2xl border border-border bg-card">
                    {blueprintSubTab === 'overview' && (
                      <OverviewSection
                        title={blueprint.project_plan.title}
                        description={blueprint.project_plan.description}
                        projectType={projectType}
                        difficulty={difficulty}
                        timeline={timeline}
                        preferredStack={techStackInput}
                      />
                    )}
                    {blueprintSubTab === 'stack' && (
                      <TechStackSection
                        frontend={blueprint.project_plan.tech_stack.frontend}
                        backend={blueprint.project_plan.tech_stack.backend}
                        database={blueprint.project_plan.tech_stack.database}
                      />
                    )}
                    {blueprintSubTab === 'features' && (
                      <FeaturesSection
                        features={blueprint.project_plan.features || []}
                      />
                    )}
                    {blueprintSubTab === 'database' && (
                      <DatabaseSection
                        databaseDesign={blueprint.database_design}
                      />
                    )}
                    {blueprintSubTab === 'api' && (
                      <ApiSection
                        apiDesign={blueprint.api_design}
                      />
                    )}
                    {blueprintSubTab === 'architecture' && (
                      <ArchitectureSection
                        architecture={blueprint.architecture}
                      />
                    )}
                    {blueprintSubTab === 'milestones' && (
                      <MilestoneSection
                        milestones={blueprint.project_plan.milestones || []}
                        milestonePlan={blueprint.milestone_plan}
                      />
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Right side companion AI Chat drawer */}
        <div className="w-80 shrink-0 hidden xl:block">
          <AIChatPanel />
        </div>
      </div>
    </MainLayout>
  )
}
