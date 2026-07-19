'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import {
  BookOpen,
  Search,
  Plus,
  Trash2,
  Star,
  Clock,
  History,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Settings,
  Eye,
  Edit2,
  CornerDownRight,
  CheckCircle,
  HelpCircle,
  Folder,
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  Terminal,
  Play
} from 'lucide-react'
import { documentService, DocumentResponse, DocumentVersionResponse } from '@/services/document'
import { generateDocumentation, DocumentationResponse } from '@/services/ai'
import { MarkdownRenderer } from '@/components/ai/MarkdownRenderer'

// Simple Markdown to HTML Parser for Live Preview
function renderMarkdown(md: string) {
  if (!md) return '<p class="text-muted-foreground italic text-xs">Start writing markdown content...</p>'
  
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    return `<pre class="bg-[#1D2024] p-3 rounded-xl border border-white/[0.06] text-xs text-[#5BB98C] font-mono my-3 overflow-x-auto">${code.trim()}</pre>`
  })

  html = html.replace(/`([^`]+)`/g, '<code class="bg-[#1D2024] px-1.5 py-0.5 rounded text-xs text-[#EB5757] font-mono">$1</code>')
  html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-[#F5F5F5] mt-4 mb-2">$1</h4>')
  html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-[#F5F5F5] mt-6 mb-3">$1</h3>')
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-bold text-[#F5F5F5] mt-8 mb-4">$1</h2>')
  html = html.replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-2 my-1 text-xs text-[#A7ADB5]"><span class="h-3.5 w-3.5 rounded border border-white/20 flex-shrink-0" /> $1</div>')
  html = html.replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-2 my-1 text-xs text-[#A7ADB5]"><span class="h-3.5 w-3.5 rounded border border-[#5BB98C]/30 bg-[#5BB98C]/20 text-[#5BB98C] flex items-center justify-center flex-shrink-0">✓</span> <span class="line-through">$1</span></div>')
  html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-xs my-1 text-[#A7ADB5]">$1</li>')
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-xs my-1 text-[#A7ADB5]">$1</li>')

  html = html.replace(/^\|(.*)\|$/gim, (match, content) => {
    const cols = content.split('|').map((c: string) => `<td class="border border-white/[0.06] p-2 text-xs">${c.trim()}</td>`).join('')
    return `<tr class="border-b border-white/[0.06]">${cols}</tr>`
  })
  html = html.replace(/(<tr.*?>[\s\S]*?<\/tr>)/g, '<table class="w-full border-collapse border border-white/[0.06] my-4 bg-[#171A1D]/40 rounded-xl">$1</table>')
  html = html.replace(/<\/table>\s*<table.*?>/g, '')
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<div class="my-4"><img src="$2" alt="$1" class="rounded-xl border border-white/[0.06] max-h-60 object-cover mx-auto" /><p class="text-[10px] text-center text-[#7E848C] mt-1">$1</p></div>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/~~([^~]+)~~/g, '<span class="line-through">$1</span>')

  html = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<pre') || p.trim().startsWith('<table') || p.trim().startsWith('<li') || p.trim().startsWith('<div')) return p
    return `<p class="text-xs text-[#A7ADB5] leading-relaxed my-2">${p.trim()}</p>`
  }).join('\n')

  return html
}

const docTypes = [
  { id: 'readme', label: 'README.md', desc: 'Main repository entry point.' },
  { id: 'installation', label: 'INSTALL.md', desc: 'Step-by-step setup guides.' },
  { id: 'overview', label: 'OVERVIEW.md', desc: 'Functional application scope.' },
  { id: 'folder_structure', label: 'STRUCTURE.md', desc: 'Folder structure explanation.' },
  { id: 'architecture', label: 'ARCHITECTURE.md', desc: 'Design patterns and choices.' },
  { id: 'database', label: 'DATABASE.md', desc: 'DB Schemas and indexes.' },
  { id: 'api', label: 'API.md', desc: 'Rest Endpoint parameters.' },
  { id: 'deployment', label: 'DEPLOYMENT.md', desc: 'Cloud deployment guides.' },
  { id: 'env_vars', label: 'ENV_VARS.md', desc: 'Required environment variables.' },
  { id: 'developer', label: 'DEVELOPER.md', desc: 'Contributor coding practices.' }
]

export default function DocumentationPage() {
  const queryClient = useQueryClient()
  const [activeSubTab, setActiveSubTab] = useState<'wiki' | 'ai-docs'>('wiki')

  // --- AI Documentation Generator States ---
  const [blueprint, setBlueprint] = useState<any>(null)
  const [selectedDocType, setSelectedDocType] = useState('readme')
  const [loadingDoc, setLoadingDoc] = useState(false)
  const [generatedDoc, setGeneratedDoc] = useState<DocumentationResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [exportingAll, setExportingAll] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('devworkspace_active_blueprint')
    if (saved) {
      setBlueprint(JSON.parse(saved))
    }
  }, [])

  const handleGenerateDoc = async () => {
    if (!blueprint) return
    setLoadingDoc(true)
    setGeneratedDoc(null)
    try {
      const res = await generateDocumentation({
        project_context: blueprint,
        doc_type: selectedDocType
      })
      setGeneratedDoc(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDoc(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedDoc) return
    try {
      await navigator.clipboard.writeText(generatedDoc.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDownload = (doc: DocumentationResponse) => {
    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(doc.content)
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', doc.filename)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleExportAll = async () => {
    if (!blueprint) return
    setExportingAll(true)
    try {
      // Export targeted 5 files: README.md, docs/api.md, docs/architecture.md, docs/database.md, docs/setup.md
      const targetDocs = ['readme', 'api', 'architecture', 'database', 'installation']
      for (const docType of targetDocs) {
        const res = await generateDocumentation({
          project_context: blueprint,
          doc_type: docType
        })
        handleDownload(res)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setExportingAll(false)
    }
  }

  // --- Original Wiki Editor States & Logic ---
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [isEditorMode, setIsEditorMode] = useState(true)

  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.getDocuments()
  })

  const { data: selectedDoc } = useQuery({
    queryKey: ['document', selectedId],
    queryFn: () => documentService.getDocumentById(selectedId!),
    enabled: !!selectedId
  })

  const { data: versions = [] } = useQuery({
    queryKey: ['document-versions', selectedId],
    queryFn: () => documentService.getDocumentVersions(selectedId!),
    enabled: !!selectedId && showHistory
  })

  useEffect(() => {
    if (selectedDoc) {
      setEditTitle(selectedDoc.title)
      setEditContent(selectedDoc.content || '')
      setIsDirty(false)
    }
  }, [selectedDoc])

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) => documentService.createDocument(data),
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setSelectedId(newDoc.id)
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; title: string; content: string }) =>
      documentService.updateDocument(data.id, { title: data.title, content: data.content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', selectedId] })
      setLastSavedTime(new Date())
      setIsDirty(false)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setSelectedId(null)
    }
  })

  const restoreMutation = useMutation({
    mutationFn: (data: { id: string; version: number }) => documentService.restoreDocumentVersion(data.id, data.version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['document-versions', selectedId] })
    }
  })

  const handleCreateNewPage = () => {
    createMutation.mutate({
      title: 'Untitled Document',
      content: '# Untitled\n\nWrite documentation here...'
    })
  }

  const handleLocalContentChange = (val: string) => {
    setEditContent(val)
    setIsDirty(true)
    
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      if (selectedId) {
        updateMutation.mutate({ id: selectedId, title: editTitle, content: val })
      }
    }, 3000)
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Toggle subtabs bar */}
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveSubTab('wiki')}
            className={`px-6 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeSubTab === 'wiki'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            Workspace Wiki
          </button>
          <button
            onClick={() => setActiveSubTab('ai-docs')}
            className={`px-6 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'ai-docs'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> AI Docs Generator
          </button>
        </div>

        {activeSubTab === 'ai-docs' ? (
          /* AI Documentation Generator Tab */
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-primary/10 via-card/50 to-primary/5 p-6 md:p-8 flex items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-white">AI Documentation Generator</h1>
                  <p className="text-sm text-muted-foreground">
                    Compile developer guides, installation setup steps, architecture explanations, database schemas, and REST parameters directly from your blueprint.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportAll}
                disabled={!blueprint || exportingAll}
                className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {exportingAll ? (
                  <>
                    <div className="h-3 w-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Export All
                  </>
                )}
              </button>
            </div>

            {blueprint && (
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-wrap items-center justify-between gap-4 text-left">
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Active Blueprint Loaded</span>
                  <h2 className="text-base font-bold text-white mt-0.5">{blueprint.project_plan.title}</h2>
                </div>
                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block">Backend</span>
                    <span className="text-white font-semibold">{blueprint.project_plan.tech_stack.backend}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block">Frontend</span>
                    <span className="text-white font-semibold">{blueprint.project_plan.tech_stack.frontend}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block">Database</span>
                    <span className="text-white font-semibold">{blueprint.database_design.database || blueprint.project_plan.tech_stack.database}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              {/* Document Type select column */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">1. Select Document Type</span>
                <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
                  {docTypes.map((doc) => {
                    const isSel = selectedDocType === doc.id
                    return (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDocType(doc.id)}
                        disabled={loadingDoc}
                        className={`w-full p-3 rounded-xl border flex flex-col items-start gap-1 transition-all text-left cursor-pointer ${
                          isSel
                            ? 'border-primary bg-primary/5 shadow shadow-primary/5'
                            : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.02]'
                        }`}
                      >
                        <span className="text-xs font-bold text-white">{doc.label}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">{doc.desc}</span>
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={handleGenerateDoc}
                  disabled={!blueprint || loadingDoc}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold text-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-primary/10"
                >
                  {loadingDoc ? (
                    <>
                      <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Generating Document...
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-black" /> Compile Document
                    </>
                  )}
                </button>
              </div>

              {/* Viewer Output column */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">2. Live Preview Documentation</span>
                {loadingDoc ? (
                  <div className="h-[450px] border border-white/5 bg-[#09090b] rounded-2xl flex flex-col items-center justify-center space-y-3">
                    <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground">AI Architect compiling {selectedDocType.toUpperCase()} file...</span>
                  </div>
                ) : generatedDoc ? (
                  <div className="rounded-2xl border border-white/5 bg-[#09090b] overflow-hidden flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/5">
                      <span className="text-xs font-mono text-white font-bold">{generatedDoc.filename}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black border border-white/10 text-[10px] text-muted-foreground hover:text-white transition-all cursor-pointer font-bold"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-primary" />
                              <span className="text-primary">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDownload(generatedDoc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </button>
                      </div>
                    </div>

                    {/* Content area */}
                    <div className="p-6 max-h-[500px] overflow-y-auto scrollbar-thin">
                      <div className="prose prose-invert max-w-none text-left">
                        <MarkdownRenderer content={generatedDoc.content} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[450px] border border-dashed border-white/10 bg-white/[0.005] rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-2">
                    <BookOpen className="h-8 w-8 text-muted-foreground animate-pulse" />
                    <p className="text-sm font-semibold text-white">No document generated yet</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {!blueprint 
                        ? 'Generate a project plan blueprint before generating system documentation files.'
                        : 'Select a document type on the left and click Compile to generate details.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Original Wiki Workspace Layout */
          <div className="flex h-[calc(100vh-220px)] border border-white/[0.06] rounded-2xl bg-[#111315]/40 overflow-hidden text-left">
            {/* Sidebar directory list */}
            <div className="w-64 border-r border-white/[0.06] flex flex-col bg-[#111315]/20">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">Directory</span>
                <button
                  onClick={() => handleCreateNewPage()}
                  className="p-1.5 rounded-lg bg-[#5BB98C]/10 hover:bg-[#5BB98C] text-[#5BB98C] hover:text-[#111315] transition-all cursor-pointer"
                  title="Create new document"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Search bar */}
              <div className="px-3 py-2 border-b border-white/[0.04] flex items-center gap-1.5 bg-[#0D0E10]/20">
                <Search className="h-3 w-3 text-[#7E848C]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick search..."
                  className="bg-transparent border-none text-[10px] text-white outline-none placeholder-[#7E848C] w-full"
                />
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {documents
                  .filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((doc) => {
                    const isSel = selectedId === doc.id
                    return (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setSelectedId(doc.id)
                          setShowHistory(false)
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all group cursor-pointer ${
                          isSel ? 'bg-[#5BB98C]/10 text-[#5BB98C]' : 'hover:bg-white/5 text-[#A7ADB5] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-[11px] font-medium truncate max-w-[130px]">{doc.title}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Delete this page permanently?')) {
                              deleteMutation.mutate(doc.id)
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 text-[#7E848C] hover:text-[#EB5757] transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </button>
                    )
                  })}
                {documents.length === 0 && (
                  <p className="text-[10px] text-[#7E848C] italic text-center py-4">No documents found</p>
                )}
              </div>
            </div>

            {/* Document Content Viewport */}
            {selectedId && selectedDoc ? (
              <>
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Top Bar Actions */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[#111315]/40">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => {
                          setEditTitle(e.target.value)
                          setIsDirty(true)
                          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
                          autoSaveTimerRef.current = setTimeout(() => {
                            updateMutation.mutate({ id: selectedId, title: e.target.value, content: editContent })
                          }, 3000)
                        }}
                        className="bg-transparent border-none text-xs font-bold text-white outline-none w-64 focus:border-b focus:border-white/20"
                      />
                      {isDirty && (
                        <span className="text-[9px] text-[#7E848C] italic animate-pulse">Autosaving changes...</span>
                      )}
                      {lastSavedTime && !isDirty && (
                        <span className="text-[9px] text-[#5BB98C]">Saved at {lastSavedTime.toLocaleTimeString()}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditorMode(!isEditorMode)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1D2024] hover:bg-[#23272B] text-[10px] font-bold text-[#A7ADB5] hover:text-white transition-all cursor-pointer"
                      >
                        {isEditorMode ? <Eye className="h-3 w-3" /> : <Edit2 className="h-3 w-3" />}
                        {isEditorMode ? 'Preview Mode' : 'Edit Split'}
                      </button>

                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1D2024] hover:bg-[#23272B] text-[10px] font-bold text-[#A7ADB5] hover:text-white transition-all cursor-pointer"
                      >
                        <History className="h-3 w-3" /> Versions
                      </button>
                    </div>
                  </div>

                  {/* Editors */}
                  <div className="flex-1 flex overflow-hidden">
                    {/* Editor Textarea */}
                    {isEditorMode && (
                      <textarea
                        value={editContent}
                        onChange={(e) => handleLocalContentChange(e.target.value)}
                        placeholder="Write details in markdown..."
                        className="flex-1 p-4 bg-transparent text-xs text-[#F5F5F5] font-mono outline-none border-none resize-none leading-relaxed overflow-y-auto scrollbar-thin"
                      />
                    )}

                    {/* Preview View */}
                    <div
                      className={`p-6 overflow-y-auto text-left leading-relaxed scrollbar-thin ${
                        isEditorMode ? 'w-1/2 border-l border-white/[0.06] bg-[#0D0E10]/20' : 'flex-1'
                      }`}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) }}
                    />
                  </div>
                </div>

                {/* Versions Sidebar */}
                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 240, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="border-l border-white/[0.06] flex flex-col bg-[#111315]/20"
                    >
                      <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#F5F5F5] uppercase tracking-wider">Version Logs</span>
                        <button
                          onClick={() => setShowHistory(false)}
                          className="p-1 rounded hover:bg-white/5 text-[#7E848C] hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                        <div className="space-y-2">
                          {versions.map((ver) => (
                            <div key={ver.id} className="p-2.5 rounded-lg border border-white/[0.04] bg-[#1D2024]/40 text-left">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono font-bold text-white">V{ver.version_number}</span>
                                <span className="text-[8px] text-[#7E848C]">
                                  {new Date(ver.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[8px] text-[#A7ADB5] mt-1 line-clamp-2">
                                Edited by user ({ver.author_id || 'System Author'})
                              </p>
                              <button
                                onClick={() => {
                                  if (confirm(`Restore to version snapshot V${ver.version_number}?`)) {
                                    restoreMutation.mutate({ id: selectedId!, version: ver.version_number })
                                  }
                                }}
                                className="w-full py-1.5 mt-2 rounded bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold text-[9px] text-center transition-colors cursor-pointer"
                              >
                                Restore Snapshot
                              </button>
                            </div>
                          ))}
                          {versions.length === 0 && (
                            <p className="text-[10px] text-[#7E848C] italic text-center py-4">No older versions stored yet.</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <BookOpen className="h-10 w-10 text-[#7E848C]/40 mb-3 animate-pulse" />
                <h3 className="text-sm font-bold text-[#F5F5F5]">No Document Selected</h3>
                <p className="text-xs text-[#A7ADB5] mt-1.5 max-w-xs">
                  Select a documentation page from the directory sidebar, or create a new page to write system specs!
                </p>
                <button
                  onClick={() => handleCreateNewPage()}
                  className="mt-4 rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold px-4 py-2 text-xs cursor-pointer shadow-md transition-all"
                >
                  Create New Page
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </MainLayout>
  )
}
