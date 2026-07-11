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
  X
} from 'lucide-react'
import { documentService, DocumentResponse, DocumentVersionResponse } from '@/services/document'

// Simple Markdown to HTML Parser for Live Preview
function renderMarkdown(md: string) {
  if (!md) return '<p class="text-muted-foreground italic text-xs">Start writing markdown content...</p>'
  
  let html = md
    // Escape HTML tags to prevent XSS
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks: ```python\ncode\n```
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    return `<pre class="bg-[#1D2024] p-3 rounded-xl border border-white/[0.06] text-xs text-[#5BB98C] font-mono my-3 overflow-x-auto">${code.trim()}</pre>`
  })

  // Inline Code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-[#1D2024] px-1.5 py-0.5 rounded text-xs text-[#EB5757] font-mono">$1</code>')

  // Headers: # Title, ## Header 2, ### Header 3
  html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-[#F5F5F5] mt-4 mb-2">$1</h4>')
  html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-[#F5F5F5] mt-6 mb-3">$1</h3>')
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-bold text-[#F5F5F5] mt-8 mb-4">$1</h2>')

  // Checklists: - [ ] item, - [x] item
  html = html.replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-2 my-1 text-xs text-[#A7ADB5]"><span class="h-3.5 w-3.5 rounded border border-white/20 flex-shrink-0" /> $1</div>')
  html = html.replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-2 my-1 text-xs text-[#A7ADB5]"><span class="h-3.5 w-3.5 rounded border border-[#5BB98C]/30 bg-[#5BB98C]/20 text-[#5BB98C] flex items-center justify-center flex-shrink-0">✓</span> <span class="line-through">$1</span></div>')

  // Bullet Lists: - item
  html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-xs my-1 text-[#A7ADB5]">$1</li>')

  // Numbered Lists: 1. item
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-xs my-1 text-[#A7ADB5]">$1</li>')

  // Tables: | Col 1 | Col 2 |
  html = html.replace(/^\|(.*)\|$/gim, (match, content) => {
    const cols = content.split('|').map((c: string) => `<td class="border border-white/[0.06] p-2 text-xs">${c.trim()}</td>`).join('')
    return `<tr class="border-b border-white/[0.06]">${cols}</tr>`
  })
  // Wrap table rows in table element
  html = html.replace(/(<tr.*?>[\s\S]*?<\/tr>)/g, '<table class="w-full border-collapse border border-white/[0.06] my-4 bg-[#171A1D]/40 rounded-xl">$1</table>')
  // Cleanup nested table elements caused by multi-line matching
  html = html.replace(/<\/table>\s*<table.*?>/g, '')

  // Images: ![alt](url)
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<div class="my-4"><img src="$2" alt="$1" class="rounded-xl border border-white/[0.06] max-h-60 object-cover mx-auto" /><p class="text-[10px] text-center text-[#7E848C] mt-1">$1</p></div>')

  // Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/~~([^~]+)~~/g, '<span class="line-through">$1</span>')

  // Paragraphs
  html = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<pre') || p.trim().startsWith('<table') || p.trim().startsWith('<li') || p.trim().startsWith('<div')) return p
    return `<p class="text-xs text-[#A7ADB5] leading-relaxed my-2">${p.trim()}</p>`
  }).join('\n')

  return html
}

export default function DocumentationPage() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [isEditorMode, setIsEditorMode] = useState(true) // true: Split, false: Preview Only

  // Editing values
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)

  // Track dirty changes for Autosave
  const [isDirty, setIsDirty] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Query documents list
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.getDocuments()
  })

  // Query selected document details
  const { data: selectedDoc } = useQuery({
    queryKey: ['document', selectedId],
    queryFn: () => documentService.getDocumentById(selectedId!),
    enabled: !!selectedId
  })

  // Query version history snapshot logs
  const { data: versions = [] } = useQuery({
    queryKey: ['document-versions', selectedId],
    queryFn: () => documentService.getDocumentVersions(selectedId!),
    enabled: !!selectedId && showHistory
  })

  // Update effect when selected document changes
  useEffect(() => {
    if (selectedDoc) {
      setEditTitle(selectedDoc.title)
      setEditContent(selectedDoc.content)
      setIsDirty(false)
    }
  }, [selectedDoc])

  // Autosave triggers every 3 seconds if dirty
  useEffect(() => {
    if (isDirty) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave()
      }, 3000)
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [isDirty, editTitle, editContent])

  // Create document mutation
  const createMutation = useMutation({
    mutationFn: documentService.createDocument,
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setSelectedId(newDoc.id)
    }
  })

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: documentService.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setSelectedId(null)
    }
  })

  // Update document mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      documentService.updateDocument(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['document', selectedId] })
      setLastSavedTime(new Date())
      setIsSaving(false)
      setIsDirty(false)
    }
  })

  // Restore version mutation
  const restoreMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      documentService.restoreDocumentVersion(id, version),
    onSuccess: (restoredDoc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['document-versions', selectedId] })
      setEditTitle(restoredDoc.title)
      setEditContent(restoredDoc.content)
      setIsDirty(false)
      setShowHistory(false)
    }
  })

  const handleSave = () => {
    if (!selectedId) return
    setIsSaving(true)
    updateMutation.mutate({
      id: selectedId,
      updates: {
        title: editTitle,
        content: editContent
      }
    })
  }

  const handleCreateNewPage = (parentId?: string) => {
    createMutation.mutate({
      title: 'Untitled Document',
      content: '',
      parent_id: parentId
    })
  }

  const handleDelete = () => {
    if (!selectedId) return
    if (confirm('Are you sure you want to delete this document page?')) {
      deleteMutation.mutate(selectedId)
    }
  }

  const handleToggleFavorite = () => {
    if (!selectedDoc) return
    updateMutation.mutate({
      id: selectedDoc.id,
      updates: { is_favorite: !selectedDoc.is_favorite }
    })
  }

  // Filter docs
  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group by Parent for Nested pages tree
  const rootDocs = filteredDocs.filter(d => d.parent_id === null)
  const favorites = filteredDocs.filter(d => d.is_favorite)

  // Recursive nesting renderer
  const renderNestedNode = (doc: DocumentResponse, depth = 0) => {
    const children = filteredDocs.filter(child => child.parent_id === doc.id)
    const isSelected = selectedId === doc.id
    
    return (
      <div key={doc.id} className="space-y-1">
        <div
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`group/node flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer text-xs transition-colors ${
            isSelected ? 'bg-[#5BB98C]/15 border border-[#5BB98C]/20 text-[#5BB98C]' : 'text-[#A7ADB5] hover:bg-[#1D2024] hover:text-[#F5F5F5]'
          }`}
          onClick={() => setSelectedId(doc.id)}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Folder className={`h-3.5 w-3.5 ${isSelected ? 'text-[#5BB98C]' : 'text-[#7E848C]'} flex-shrink-0`} />
            <span className="truncate font-medium">{doc.title}</span>
          </div>
          
          {/* Node controls */}
          <div className="flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCreateNewPage(doc.id)
              }}
              title="Add nested child page"
              className="text-[#5BB98C] hover:text-[#B7E4C7] p-0.5 cursor-pointer"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Delete nested document page?')) deleteMutation.mutate(doc.id)
              }}
              className="text-[#EB5757] hover:text-red-400 p-0.5 cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {children.length > 0 && (
          <div className="space-y-1">
            {children.map(child => renderNestedNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="flex h-[82vh] rounded-2xl border border-white/[0.06] bg-[#111315] overflow-hidden max-w-7xl mx-auto shadow-2xl">
        
        {/* Left Side: Split Sidebar */}
        <div className="w-64 border-r border-white/[0.06] bg-[#171A1D] flex flex-col justify-between flex-shrink-0">
          <div className="p-4 space-y-5 overflow-y-auto flex-1">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">Workspace Docs</span>
              <button
                onClick={() => handleCreateNewPage()}
                className="p-1 rounded bg-[#5BB98C]/10 text-[#5BB98C] hover:bg-[#5BB98C]/20 transition-all cursor-pointer"
                title="Create root document page"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7E848C]" />
              <input
                type="text"
                placeholder="Search specs, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-[#1D2024] text-[11px] text-[#F5F5F5] placeholder-[#7E848C] focus:border-[#5BB98C] outline-none"
              />
            </div>

            {/* Favorite Documents */}
            {favorites.length > 0 && (
              <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" /> Favorites
                </span>
                <div className="space-y-1">
                  {favorites.map(fav => (
                    <button
                      key={fav.id}
                      onClick={() => setSelectedId(fav.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold truncate block transition-colors ${
                        selectedId === fav.id ? 'bg-[#5BB98C]/15 text-[#5BB98C]' : 'text-[#A7ADB5] hover:bg-[#1D2024] hover:text-[#F5F5F5]'
                      }`}
                    >
                      {fav.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Documents */}
            {filteredDocs.length > 0 && (
              <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-[#5BB98C]" /> Recent Pages
                </span>
                <div className="space-y-1">
                  {[...filteredDocs]
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                    .slice(0, 3)
                    .map(recent => (
                      <button
                        key={recent.id}
                        onClick={() => setSelectedId(recent.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold truncate block transition-colors ${
                          selectedId === recent.id ? 'bg-[#5BB98C]/15 text-[#5BB98C]' : 'text-[#A7ADB5] hover:bg-[#1D2024] hover:text-[#F5F5F5]'
                        }`}
                      >
                        {recent.title}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Directory tree */}
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block">Document Directory</span>
              <div className="space-y-1">
                {rootDocs.map(root => renderNestedNode(root))}
                {rootDocs.length === 0 && (
                  <p className="text-[10px] text-[#7E848C] italic">No document pages created.</p>
                )}
              </div>
            </div>

          </div>

          {/* Quick instructions foot */}
          <div className="p-3 border-t border-white/[0.06] bg-[#1D2024]/40 text-center">
            <button
              onClick={() => handleCreateNewPage()}
              className="w-full inline-flex items-center justify-center gap-1 py-2 text-[10px] text-[#5BB98C] hover:text-[#B7E4C7] font-bold transition-colors cursor-pointer"
            >
              <Plus className="h-3 w-3" /> New Workspace Page
            </button>
          </div>
        </div>

        {/* Right Side: Split Editor & Live Preview */}
        <div className="flex-1 flex flex-col bg-[#111315]">
          {selectedDoc ? (
            <>
              {/* Header Action Bar */}
              <div className="h-14 border-b border-white/[0.06] bg-[#171A1D]/80 flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleFavorite}
                    className="p-1.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <Star className={`h-4.5 w-4.5 ${selectedDoc.is_favorite ? 'text-yellow-500 fill-current' : 'text-[#7E848C]'}`} />
                  </button>
                  <span className="text-[10px] font-medium text-[#7E848C]">
                    {isSaving ? (
                      <span className="flex items-center gap-1.5 text-yellow-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-ping" /> Saving...
                      </span>
                    ) : lastSavedTime ? (
                      `Autosaved at ${lastSavedTime.toLocaleTimeString()}`
                    ) : (
                      'Saved'
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* View modes toggle */}
                  <div className="flex rounded-xl bg-[#1D2024] p-1 border border-white/[0.06]">
                    <button
                      onClick={() => setIsEditorMode(true)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        isEditorMode ? 'bg-[#5BB98C] text-[#111315]' : 'text-[#A7ADB5] hover:text-[#F5F5F5]'
                      }`}
                    >
                      Split Editor
                    </button>
                    <button
                      onClick={() => setIsEditorMode(false)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        !isEditorMode ? 'bg-[#5BB98C] text-[#111315]' : 'text-[#A7ADB5] hover:text-[#F5F5F5]'
                      }`}
                    >
                      Live Preview
                    </button>
                  </div>

                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    title="Version History Snapshots"
                    className="p-2 rounded-xl hover:bg-[#1D2024] border border-white/[0.06] text-[#A7ADB5] hover:text-[#F5F5F5] transition-all cursor-pointer"
                  >
                    <History className="h-4 w-4" />
                  </button>

                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-xl hover:bg-red-500/10 border border-white/[0.06] text-[#7E848C] hover:text-[#EB5757] transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Main workspace layout */}
              <div className="flex-1 flex relative overflow-hidden">
                
                {/* Editor Split Layout */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Split Editor area */}
                  {isEditorMode && (
                    <div className="flex-1 border-r border-white/[0.06] p-6 flex flex-col space-y-4">
                      {/* Document Title input */}
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => {
                          setEditTitle(e.target.value)
                          setIsDirty(true)
                        }}
                        placeholder="Untitled Page"
                        className="w-full bg-transparent text-xl font-bold text-[#F5F5F5] outline-none border-b border-white/[0.06] pb-2 placeholder-[#7E848C] focus:border-[#5BB98C]"
                      />
                      {/* Editor Textarea */}
                      <textarea
                        value={editContent}
                        onChange={(e) => {
                          setEditContent(e.target.value)
                          setIsDirty(true)
                        }}
                        placeholder="Write something in markdown format... (Use # headers, **bold**, tables, or code blocks)"
                        className="w-full flex-1 bg-transparent text-xs text-[#A7ADB5] outline-none resize-none leading-relaxed font-mono"
                      />
                    </div>
                  )}

                  {/* Live Render Preview area */}
                  <div className="flex-1 p-6 overflow-y-auto text-left flex flex-col">
                    {!isEditorMode && (
                      <h1 className="text-2xl font-bold text-[#F5F5F5] mb-6 border-b border-white/[0.06] pb-3">
                        {editTitle || 'Untitled Page'}
                      </h1>
                    )}
                    <div
                      className="prose prose-invert prose-xs max-w-none text-[#A7ADB5] space-y-4"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) }}
                    />
                  </div>
                </div>

                {/* Sliding Version History Panel */}
                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      transition={{ type: 'spring', damping: 20 }}
                      className="absolute right-0 top-0 bottom-0 w-72 border-l border-white/[0.06] bg-[#171A1D] p-5 shadow-2xl overflow-y-auto z-20 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
                          <h4 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-[#5BB98C]" /> Version Snapshots
                          </h4>
                          <button
                            onClick={() => setShowHistory(false)}
                            className="p-1 rounded hover:bg-white/5 text-[#7E848C] hover:text-[#F5F5F5] cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="space-y-3.5 text-left">
                          {versions.map((ver) => (
                            <div
                              key={ver.id}
                              className="p-3 bg-[#1D2024]/60 border border-white/[0.06] rounded-xl space-y-2 flex flex-col justify-between"
                            >
                              <div>
                                <span className="text-[10px] bg-[#5BB98C]/15 border border-[#5BB98C]/20 text-[#5BB98C] rounded px-1.5 py-0.5 font-bold">
                                  V{ver.version_number}
                                </span>
                                <p className="text-[10px] text-[#A7ADB5] mt-1.5 font-semibold leading-relaxed truncate">
                                  {ver.title}
                                </p>
                                <span className="text-[8px] text-[#7E848C] block mt-0.5">
                                  {new Date(ver.created_at).toLocaleString()}
                                </span>
                              </div>
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

              </div>
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

      </div>
    </MainLayout>
  )
}
