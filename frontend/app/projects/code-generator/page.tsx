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
  FileText,
  User,
  ShieldCheck,
  ChevronDown,
  Monitor,
  Zap,
  Globe,
  Settings,
  Check,
  Sparkles
} from 'lucide-react'
import { generateCode, GeneratedFile, updateBlueprint, getBlueprintDetail } from '@/services/ai'

const categories = [
  { id: 'backend', label: 'Backend', desc: 'APIs, services, logic', icon: Terminal, color: 'text-blue-500 bg-blue-500/10' },
  { id: 'frontend', label: 'Frontend', desc: 'Pages, components', icon: Monitor, color: 'text-emerald-500 bg-emerald-500/10' },
  { id: 'database', label: 'Database', desc: 'Schemas, models', icon: Database, color: 'text-amber-500 bg-amber-500/10' },
  { id: 'api', label: 'API Specs', desc: 'OpenAPI, docs', icon: Code, color: 'text-purple-500 bg-purple-500/10' },
  { id: 'utilities', label: 'Utilities', desc: 'Helpers, configs', icon: Cpu, color: 'text-pink-500 bg-pink-500/10' }
]

const modulesByCategory: Record<string, { title: string; desc: string; icon: any }[]> = {
  backend: [
    { title: 'User Authentication', desc: 'Login, register, JWT', icon: User },
    { title: 'API Route Handlers', desc: 'CRUD operations', icon: Globe },
    { title: 'Middleware Validators', desc: 'Request validation, auth', icon: ShieldCheck },
    { title: 'Data Access Repository', desc: 'Database interactions', icon: Database }
  ],
  frontend: [
    { title: 'Dashboard View', desc: 'Grid charts display', icon: Monitor },
    { title: 'AI Chat Panel', desc: 'Copilot chat bubbles', icon: Terminal },
    { title: 'Form Wrapper', desc: 'Input fields control', icon: FileText },
    { title: 'Navigation List', desc: 'Sidebar links mapping', icon: Layers }
  ],
  database: [
    { title: 'Database Setup', desc: 'ORM connection strings', icon: Database },
    { title: 'Migration Scripts', desc: 'Alembic version files', icon: Terminal },
    { title: 'Seed Records', desc: 'Mock rows injection', icon: FileText }
  ],
  api: [
    { title: 'OpenAPI Spec', desc: 'Swagger parameter files', icon: Code },
    { title: 'WebSocket Handlers', desc: 'Realtime socket channels', icon: Globe },
    { title: 'Resolver Controllers', desc: 'Graphql endpoints', icon: Terminal }
  ],
  utilities: [
    { title: 'Logger Helper', desc: 'Trace outputs recorder', icon: Terminal },
    { title: 'Exception Handler', desc: 'Generic errors catcher', icon: ShieldCheck },
    { title: 'Env Config Loader', desc: 'Pydantic settings parser', icon: Settings }
  ]
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
  const [selectedModule, setSelectedModule] = useState(modulesByCategory.backend[0].title)

  // Language & Framework configurations
  const [language, setLanguage] = useState('Python')
  const [framework, setFramework] = useState('FastAPI')
  const [codingStyle, setCodingStyle] = useState('Standard')
  const [includeTests, setIncludeTests] = useState(true)
  const [generateDoc, setGenerateDoc] = useState(false)

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
      setSelectedModule(modules[0].title)
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

  const isGenerating = stage !== 'idle' && stage !== 'ready'
  const activeFile = generatedFiles[activeFileIdx]

  return (
    <MainLayout>
      <div className="max-w-[1800px] w-full mx-auto space-y-6 text-left font-sans">
        
        {/* Header Title section */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm glow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
              <Code className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-foreground">AI Code Generator</h1>
              <p className="text-sm text-muted-foreground">
                Generate fully realized, production-ready modules conforming exactly to the active project specification blueprint.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/projects/ai-planner'}
            className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-card hover:bg-white/[0.02] border border-border text-xs text-foreground font-bold shrink-0 transition-all cursor-pointer"
          >
            <FileText className="h-4 w-4" /> View Blueprint
          </button>
        </div>

        {/* Blueprint context card */}
        {blueprint && (
          <div className="p-6 rounded-2xl border border-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
            <div className="space-y-1.5 max-w-xl">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Currently Loaded Blueprint</span>
              <h2 className="text-lg font-black text-foreground">{blueprint.project_plan.title}</h2>
              <p className="text-xs text-muted-foreground">{blueprint.project_plan.description}</p>
            </div>
            
            <div className="flex items-center gap-6 text-xs text-muted-foreground shrink-0 border-l border-border pl-6">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase block tracking-wider">Backend</span>
                <span className="px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 font-bold block">
                  {blueprint.project_plan.tech_stack.backend}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase block tracking-wider">Frontend</span>
                <span className="px-2.5 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-500 font-bold block">
                  {blueprint.project_plan.tech_stack.frontend}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase block tracking-wider">Database</span>
                <span className="px-2.5 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-500 font-bold block">
                  {blueprint.database_design.database || blueprint.project_plan.tech_stack.database}
                </span>
              </div>
              <ChevronDown className="h-5 w-5 text-muted-foreground cursor-pointer" />
            </div>
          </div>
        )}

        {/* Configuration Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel parameters (span 7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Category Select */}
            <div className="space-y-3">
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
                      className={`p-4 rounded-2xl border flex flex-col items-start gap-4 transition-all text-left cursor-pointer ${
                        isActive
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                          : 'border-border bg-card hover:bg-white/[0.01]'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${cat.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5 min-w-0 w-full">
                        <span className="text-xs font-extrabold text-foreground block truncate">{cat.label}</span>
                        <span className="text-[10px] text-muted-foreground block truncate">{cat.desc}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Components Select */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">2. Select Module Component</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(modulesByCategory[activeCategory] || []).map((mod) => {
                  const Icon = mod.icon
                  const isSel = selectedModule === mod.title
                  return (
                    <button
                      key={mod.title}
                      onClick={() => setSelectedModule(mod.title)}
                      disabled={isGenerating}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-all text-left cursor-pointer ${
                        isSel
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:bg-white/[0.01]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-1.5 rounded-lg border ${isSel ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border bg-white/5 text-muted-foreground'}`}>
                          <Icon className="h-4.5 w-4.5 shrink-0" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-foreground block truncate">{mod.title}</span>
                          <span className="text-[10px] text-muted-foreground block truncate">{mod.desc}</span>
                        </div>
                      </div>
                      {isSel && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Parameters Settings Options */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Parameters Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-foreground">
                <div className="space-y-1">
                  <label className="text-muted-foreground text-[10px] block">Language</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      disabled={isGenerating}
                      className="w-full pl-8 pr-3 py-2 border border-border rounded-lg bg-background outline-none text-foreground font-semibold"
                    />
                    <Zap className="h-3.5 w-3.5 text-blue-500 absolute left-3" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground text-[10px] block">Framework</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={framework}
                      onChange={(e) => setFramework(e.target.value)}
                      disabled={isGenerating}
                      className="w-full pl-8 pr-3 py-2 border border-border rounded-lg bg-background outline-none text-foreground font-semibold"
                    />
                    <Zap className="h-3.5 w-3.5 text-emerald-500 absolute left-3" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground text-[10px] block">Coding Style</label>
                  <input
                    type="text"
                    value={codingStyle}
                    onChange={(e) => setCodingStyle(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none text-foreground font-semibold"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-bold text-muted-foreground">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeTests}
                    onChange={(e) => setIncludeTests(e.target.checked)}
                    disabled={isGenerating}
                    className="rounded border-border bg-background text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                  <span>Include Tests</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={generateDoc}
                    onChange={(e) => setGenerateDoc(e.target.checked)}
                    disabled={isGenerating}
                    className="rounded border-border bg-background text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                  <span>Include Docs</span>
                </label>
              </div>
            </div>

            {/* Solid violet/indigo Generate Code Button */}
            <button
              onClick={handleGenerate}
              disabled={!blueprint || isGenerating}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:opacity-95 text-white font-extrabold text-sm transition-all shadow-lg shadow-indigo-500/10 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  Compiling {stage.toUpperCase()}...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 fill-white" /> Generate Module Code
                </>
              )}
            </button>

            {/* Feature Chips Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
              {[
                { title: 'Production Ready', desc: 'Clean, secure and scalable code', icon: ShieldCheck },
                { title: 'AI Powered', desc: 'Context aware generation', icon: Sparkles },
                { title: 'Fully Structured', desc: 'Best practices enforced', icon: Layers },
                { title: 'Instant Preview', desc: 'Review before download', icon: FileCode }
              ].map((chip, idx) => {
                const Icon = chip.icon
                return (
                  <div key={idx} className="p-3 rounded-xl border border-border bg-card flex items-center gap-2.5">
                    <div className="p-1 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 text-left">
                      <span className="text-[10px] font-bold text-foreground block truncate">{chip.title}</span>
                      <span className="text-[8px] text-muted-foreground block truncate">{chip.desc}</span>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>

          {/* Right panel IDE preview (span 5) */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">3. Code Preview Output</span>
            {isGenerating ? (
              <div className="h-[520px] border border-border bg-card rounded-2xl flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground">AI compiling code workspace...</span>
              </div>
            ) : activeFile ? (
              <div className="rounded-2xl border border-border bg-[#0B0F19] overflow-hidden flex flex-col shadow-2xl h-[520px]">
                
                {/* Editor Tab Bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#070A10]">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-mono font-bold text-slate-300">{activeFile.filename}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCode(activeFile.content, activeFileIdx)}
                      className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all cursor-pointer bg-white/5"
                    >
                      {copiedFileIdx === activeFileIdx ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDownloadFile(activeFile)}
                      className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all cursor-pointer bg-white/5"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Editor Content with Line Numbers */}
                <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] text-slate-300 flex leading-relaxed">
                  {/* Line numbers column */}
                  <div className="text-right text-slate-600 select-none pr-3 border-r border-white/5 font-mono">
                    {activeFile.content.split('\n').map((_, lineIdx) => (
                      <div key={lineIdx} className="h-5">{lineIdx + 1}</div>
                    ))}
                  </div>
                  {/* Code content column */}
                  <div className="pl-3 overflow-x-auto w-full text-left font-mono">
                    {activeFile.content.split('\n').map((line, idx) => (
                      <div key={idx} className="h-5 whitespace-pre">{line || ' '}</div>
                    ))}
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-[#070A10] border-t border-white/5 text-[10px] text-slate-500 font-bold select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Generated • 2.4s</span>
                  </div>
                  <span>{activeFile.content.split('\n').length} Lines</span>
                </div>

              </div>
            ) : (
              <div className="h-[520px] border border-dashed border-border bg-card/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-2">
                <HelpCircle className="h-8 w-8 text-muted-foreground animate-pulse" />
                <p className="text-sm font-semibold text-foreground">No code compiled yet</p>
                <p className="text-xs text-muted-foreground">Select a category and trigger compilation to preview files.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </MainLayout>
  )
}
