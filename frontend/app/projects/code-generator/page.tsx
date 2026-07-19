'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Code,
  Terminal,
  Database,
  Cpu,
  Layers,
  FileCode,
  Download,
  Copy,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  Play,
  Clipboard,
  FileText
} from 'lucide-react'
import { generateCode, GeneratedFile, updateBlueprint, getBlueprintDetail } from '@/services/ai'

const categories = [
  { id: 'backend', label: 'Backend', icon: ServerIcon, color: 'text-blue-400' },
  { id: 'frontend', label: 'Frontend', icon: MonitorIcon, color: 'text-[#5bb98c]' },
  { id: 'database', label: 'Database', icon: Database, color: 'text-amber-500' },
  { id: 'api', label: 'API Specs', icon: Code, color: 'text-purple-500' },
  { id: 'utilities', label: 'Utilities', icon: Cpu, color: 'text-pink-500' }
]

const modulesByCategory: Record<string, string[]> = {
  backend: ['User Authentication Controller', 'API Route Handlers', 'Middleware Validators', 'Data Access Repository'],
  frontend: ['Dashboard Panel View', 'AI Conversation Container', 'Form Settings Wrapper', 'Directory Navigation list'],
  database: ['Database Schema Setup', 'Migration Version Scripts', 'Seed Mock Records'],
  api: ['OpenAPI Spec definitions', 'GraphQL Resolver Handlers', 'WebSocket Sync handlers'],
  utilities: ['Logger helpers', 'Common Exception classes', 'Config loader tools']
}

type GenerationStage =
  | 'idle'
  | 'analyzing'
  | 'planning'
  | 'models'
  | 'apis'
  | 'finalizing'
  | 'ready'

export default function CodeGeneratorPage() {
  const [blueprint, setBlueprint] = useState<any>(null)
  const [activeCategory, setActiveCategory] = useState('backend')
  const [selectedModule, setSelectedModule] = useState(modulesByCategory.backend[0])

  // Language & Framework configurations
  const [language, setLanguage] = useState('Python')
  const [framework, setFramework] = useState('FastAPI')
  const [codingStyle, setCodingStyle] = useState('Clean & Modular')
  const [commentLevel, setCommentLevel] = useState('Detailed')
  const [includeTests, setIncludeTests] = useState(true)
  const [generateDoc, setGenerateDoc] = useState(true)

  // Stage & Result states
  const [stage, setStage] = useState<GenerationStage>('idle')
  const [error, setError] = useState<string | null>(null)
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([])
  const [activeFileIdx, setActiveFileIdx] = useState<number>(0)
  
  // UX Copy indicators
  const [copiedFileIdx, setCopiedFileIdx] = useState<number | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('devworkspace_active_blueprint')
    if (saved) {
      try {
        const bp = JSON.parse(saved)
        setBlueprint(bp)
        
        // Auto-configure options based on blueprint tech stack
        const tech = bp.project_plan?.tech_stack
        if (tech) {
          const backendStack = tech.backend || ''
          if (backendStack.toLowerCase().includes('python') || backendStack.toLowerCase().includes('fastapi')) {
            setLanguage('Python')
            setFramework('FastAPI')
          } else if (backendStack.toLowerCase().includes('node') || backendStack.toLowerCase().includes('express')) {
            setLanguage('JavaScript')
            setFramework('Express')
          } else if (backendStack.toLowerCase().includes('go')) {
            setLanguage('Go')
            setFramework('Gin')
          }
        }
      } catch (e) {
        console.error('Failed to parse active blueprint context', e)
      }
    }
  }, [])

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId)
    const modules = modulesByCategory[catId] || []
    if (modules.length > 0) {
      setSelectedModule(modules[0])
    }
  }

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!blueprint) return

    setError(null)
    setGeneratedFiles([])
    setStage('analyzing')

    const intervalMap = [
      { nextStage: 'planning', delay: 1000 },
      { nextStage: 'models', delay: 2000 },
      { nextStage: 'apis', delay: 3500 },
      { nextStage: 'finalizing', delay: 5000 }
    ]

    intervalMap.forEach(({ nextStage, delay }) => {
      setTimeout(() => {
        setStage((current) => (current !== 'idle' && current !== 'ready' ? (nextStage as GenerationStage) : current))
      }, delay)
    })

    try {
      const response = await generateCode({
        project_title: blueprint.project_plan.title,
        blueprint_context: blueprint,
        category: activeCategory,
        module: selectedModule,
        language,
        framework,
        coding_style: codingStyle,
        comment_level: commentLevel,
        include_tests: includeTests,
        generate_doc: generateDoc
      })
      
      setGeneratedFiles(response.files || [])
      setActiveFileIdx(0)
      setStage('ready')

      try {
        const savedId = localStorage.getItem('devworkspace_active_blueprint_id')
        if (savedId) {
          const existing = await getBlueprintDetail(savedId)
          const updatedCode = [...(existing.generated_code || []), ...(response.files || [])]
          await updateBlueprint(savedId, {
            generated_code: updatedCode
          })
        }
      } catch (saveErr) {
        console.error('Failed to auto-save generated code', saveErr)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Unable to generate code. Please try again.')
      setStage('idle')
    }
  }

  const handleCopyCode = async (codeText: string, fileIdx: number) => {
    try {
      await navigator.clipboard.writeText(codeText)
      setCopiedFileIdx(fileIdx)
      setTimeout(() => setCopiedFileIdx(null), 2000)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDownloadFile = (file: GeneratedFile) => {
    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(file.content)
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', file.filename)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleDownloadAll = () => {
    generatedFiles.forEach((file) => {
      handleDownloadFile(file)
    })
  }

  const isGenerating = stage !== 'idle' && stage !== 'ready'
  const activeFile = generatedFiles[activeFileIdx]

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 text-left">
        {/* Header */}
        <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-card/50 to-primary/5 p-6 md:p-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Terminal className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">AI Code Generator</h1>
            <p className="text-sm text-muted-foreground">
              Generate fully realized, production-ready modules conforming exactly to the active project specification blueprint.
            </p>
          </div>
        </div>

        {blueprint && (
          <div className="p-5 rounded-2xl border border-border bg-card flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Currently Loaded Blueprint</span>
              <h2 className="text-base font-bold text-foreground mt-0.5">{blueprint.project_plan.title}</h2>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">Backend</span>
                <span className="text-foreground font-semibold">{blueprint.project_plan.tech_stack.backend}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">Frontend</span>
                <span className="text-foreground font-semibold">{blueprint.project_plan.tech_stack.frontend}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">Database</span>
                <span className="text-foreground font-semibold">{blueprint.database_design.database || blueprint.project_plan.tech_stack.database}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">1. Select Module Category</span>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    disabled={isGenerating}
                    className={`p-4 rounded-xl border flex flex-col items-start gap-3 transition-all cursor-pointer ${
                      isActive
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                        : 'border-border bg-card hover:bg-white/[0.01]'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${cat.color}`} />
                    <span className="text-xs font-bold text-foreground">{cat.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">2. Select Module component</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(modulesByCategory[activeCategory] || []).map((mod) => {
                  const isSel = selectedModule === mod
                  return (
                    <button
                      key={mod}
                      onClick={() => setSelectedModule(mod)}
                      disabled={isGenerating}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all text-xs text-left cursor-pointer ${
                        isSel
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span>{mod}</span>
                      {isSel && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Parameters Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-foreground">
                <div className="space-y-1">
                  <label className="text-muted-foreground text-[10px] block">Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground text-[10px] block">Framework</label>
                  <input
                    type="text"
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none text-foreground"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!blueprint || isGenerating}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating {stage.toUpperCase()}...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-primary-foreground" /> Compile Module Code
                </>
              )}
            </button>
          </div>

          <div className="space-y-6">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">3. Code preview Output</span>
            {isGenerating ? (
              <div className="h-[450px] border border-border bg-card rounded-2xl flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground">AI Architect generating {selectedModule}...</span>
              </div>
            ) : activeFile ? (
              <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white/[0.01]">
                  <span className="text-xs font-mono font-bold text-foreground">{activeFile.filename}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCode(activeFile.content, activeFileIdx)}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {copiedFileIdx === activeFileIdx ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDownloadFile(activeFile)}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 max-h-[400px] overflow-y-auto font-mono text-[11px] text-emerald-400">
                  <pre className="text-left leading-relaxed">{activeFile.content}</pre>
                </div>
              </div>
            ) : (
              <div className="h-[450px] border border-dashed border-border bg-card/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-2">
                <HelpCircle className="h-8 w-8 text-muted-foreground animate-pulse" />
                <p className="text-sm font-semibold text-foreground">No code compiled yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

function ServerIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  )
}

function MonitorIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  )
}
