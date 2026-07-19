'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Sparkles,
  Download,
  FileText,
  RefreshCw,
  Zap
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

import { BlueprintTabs } from '@/components/ai/BlueprintTabs'
import { PlannerForm } from '@/components/ai/PlannerForm'
import { GenerationProgress } from '@/components/ai/GenerationProgress'
import { OverviewSection } from '@/components/ai/OverviewSection'
import { SummarySection } from '@/components/ai/SummarySection'
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
  
  // Tab control state
  const [activeTab, setActiveTab] = useState<'planner' | 'blueprint'>('planner')

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!prompt.trim()) return

    setError(null)
    setBlueprint(null)
    setStep('project-plan')
    setActiveTab('planner')

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
      setActiveTab('blueprint') // Automatically switch to blueprint tab
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

  const isGenerating = step !== 'idle' && step !== 'ready'

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-primary/10 via-card/50 to-primary/5 p-6 md:p-8 flex items-center gap-4 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">AI Software Architect</h1>
            <p className="text-sm text-muted-foreground">
              Define your software specifications and generate a complete production-ready development blueprint.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <BlueprintTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasBlueprint={!!blueprint}
        />

        {/* TAB 1: Project Planner Form */}
        {activeTab === 'planner' && (
          <div className="space-y-8">
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

            {error && (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-left text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Generation Checklist step animation */}
            <GenerationProgress step={step} />
          </div>
        )}

        {/* TAB 2: Blueprint Dashboard */}
        {activeTab === 'blueprint' && blueprint && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-3 space-y-8">
              {/* Download and utility buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  onClick={handleDownloadJson}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Download Blueprint
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-all active:scale-95 cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" /> Export Markdown
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </button>
              </div>

              {/* Section 1: Overview */}
              <OverviewSection
                title={blueprint.project_plan.title}
                description={blueprint.project_plan.description}
                projectType={projectType}
                difficulty={difficulty}
                timeline={timeline}
                preferredStack={techStackInput}
              />

              {/* Section 8: Summary statistics */}
              <SummarySection
                totalFeatures={totalFeatures}
                totalTables={totalTables}
                totalEndpoints={totalEndpoints}
                totalMilestones={totalMilestones}
                totalModules={totalModules}
              />

              {/* Section 2: Tech Stack */}
              <TechStackSection
                frontend={blueprint.project_plan.tech_stack.frontend}
                backend={blueprint.project_plan.tech_stack.backend}
                database={blueprint.database_design.database || blueprint.project_plan.tech_stack.database}
              />

              {/* Section 3: Project Features */}
              <FeaturesSection features={blueprint.project_plan.features} />

              {/* Section 4: Milestones vertical timeline */}
              <MilestoneSection
                milestones={blueprint.project_plan.milestones}
                milestonePlan={blueprint.milestone_plan}
              />

              {/* Section 5: Database Design */}
              <DatabaseSection databaseDesign={blueprint.database_design} />

              {/* Section 6: REST API */}
              <ApiSection apiDesign={blueprint.api_design} />

              {/* Section 7: Architecture */}
              <ArchitectureSection architecture={blueprint.architecture} />
            </div>

            {/* Chat Panel on the right */}
            <div className="lg:col-span-1">
              <AIChatPanel />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
