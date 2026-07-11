'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Search,
  Folder,
  CheckSquare,
  User,
  FileText,
  MessageSquare,
  File,
  History,
  X,
  Loader,
  CornerDownLeft,
  Terminal
} from 'lucide-react'
import { searchService, GlobalSearchResponse } from '@/services/search'

export function CommandPalette() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [recentCommands, setRecentCommands] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  
  const paletteRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Predefined Commands
  const staticCommands = [
    { id: 'cmd-create-task', type: 'command', title: 'Create Task', url: '/calendar' },
    { id: 'cmd-create-project', type: 'command', title: 'Create Project', url: '/projects' },
    { id: 'cmd-switch-theme', type: 'command', title: 'Switch Theme (Dark / Light)', url: 'theme-switch' }
  ]

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80)
      
      const savedSearches = localStorage.getItem('recent_workspace_searches')
      if (savedSearches) {
        try { setRecentSearches(JSON.parse(savedSearches)) } catch { setRecentSearches([]) }
      }

      const savedCommands = localStorage.getItem('recent_palette_commands')
      if (savedCommands) {
        try { setRecentCommands(JSON.parse(savedCommands)) } catch { setRecentCommands([]) }
      }
    } else {
      setQuery('')
      setResults(null)
    }
  }, [isOpen])

  // Debounce query state
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Execute Search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null)
      return
    }

    const runSearch = async () => {
      setLoading(true)
      try {
        const data = await searchService.search(debouncedQuery)
        setResults(data)
        
        // Save to Recent Searches list
        setRecentSearches((prev) => {
          const filtered = prev.filter((q) => q.toLowerCase() !== debouncedQuery.toLowerCase())
          const next = [debouncedQuery, ...filtered].slice(0, 5)
          localStorage.setItem('recent_workspace_searches', JSON.stringify(next))
          return next
        })
      } catch (err) {
        console.error('Search failed', err)
      } finally {
        setLoading(false)
      }
    }

    runSearch()
  }, [debouncedQuery])

  // Close when clicking outside
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', clickOutside)
    }
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [isOpen])

  // Flatten visible items for keyboard navigation index mappings
  const getFlattenedItems = (): { id: string; type: string; title: string; url: string }[] => {
    const items: { id: string; type: string; title: string; url: string }[] = []

    // 1. Matched commands
    const matchedCommands = staticCommands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()))
    matchedCommands.forEach(c => items.push(c))

    // 2. Recent commands if query is empty
    if (!query.trim()) {
      recentCommands.forEach((cTitle, idx) => {
        const matchingCmd = staticCommands.find(sc => sc.title === cTitle)
        if (matchingCmd) {
          items.push({ id: `recent-cmd-${idx}`, type: 'recent-command', title: cTitle, url: matchingCmd.url })
        }
      })
      recentSearches.forEach((s, idx) => {
        items.push({ id: `recent-${idx}`, type: 'recent', title: s, url: '' })
      })
    } else if (results) {
      results.projects.forEach((p) => {
        items.push({ id: p.id, type: 'project', title: p.name, url: `/projects/${p.id}` })
      })
      results.tasks.forEach((t) => {
        items.push({ id: t.id, type: 'task', title: t.title, url: `/calendar` })
      })
      results.members.forEach((m) => {
        items.push({ id: m.id, type: 'member', title: m.full_name, url: `/team` })
      })
      results.documents.forEach((d) => {
        items.push({ id: d.id, type: 'document', title: d.title, url: `/documentation` })
      })
      results.comments.forEach((c) => {
        items.push({ id: c.id, type: 'comment', title: c.content, url: c.project_id ? `/projects/${c.project_id}` : '/projects' })
      })
      results.files.forEach((f) => {
        items.push({ id: f.id, type: 'file', title: f.name, url: `/files` })
      })
    }
    return items
  }

  const flattenedItems = getFlattenedItems()

  useEffect(() => {
    setActiveIndex(0)
  }, [query, results])

  // Global Keydown Listeners (Cmd+K / Ctrl+K and arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (!isOpen) return

      if (e.key === 'Escape') {
        setIsOpen(false)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => (flattenedItems.length > 0 ? (prev + 1) % flattenedItems.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => (flattenedItems.length > 0 ? (prev - 1 + flattenedItems.length) % flattenedItems.length : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (flattenedItems[activeIndex]) {
          const item = flattenedItems[activeIndex]
          if (item.type === 'recent') {
            setQuery(item.title)
          } else if (item.type === 'command' || item.type === 'recent-command') {
            executeCommand(item.title, item.url)
          } else {
            navigateToResult(item.url)
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, flattenedItems, activeIndex])

  // Highlight matches text helper
  const highlightMatch = (text: string | null, searchStr: string) => {
    if (!text) return ''
    if (!searchStr) return text
    const index = text.toLowerCase().indexOf(searchStr.toLowerCase())
    if (index === -1) return text

    const before = text.substring(0, index)
    const match = text.substring(index, index + searchStr.length)
    const after = text.substring(index + searchStr.length)

    return (
      <>
        {before}
        <mark className="bg-[#5BB98C]/35 text-white font-semibold rounded px-0.5">{match}</mark>
        {after}
      </>
    )
  }

  const navigateToResult = (url: string) => {
    setIsOpen(false)
    router.push(url)
  }

  const executeCommand = (title: string, url: string) => {
    // Save to Recent Commands list
    setRecentCommands((prev) => {
      const filtered = prev.filter((t) => t !== title)
      const next = [title, ...filtered].slice(0, 5)
      localStorage.setItem('recent_palette_commands', JSON.stringify(next))
      return next
    })

    if (url === 'theme-switch') {
      setTheme(theme === 'dark' ? 'light' : 'dark')
      setIsOpen(false)
    } else {
      navigateToResult(url)
    }
  }

  const clearRecentSearches = () => {
    localStorage.removeItem('recent_workspace_searches')
    setRecentSearches([])
  }

  const clearRecentCommands = () => {
    localStorage.removeItem('recent_palette_commands')
    setRecentCommands([])
  }

  if (!isOpen) return null

  // Check if we have results
  const hasResults = results && (
    results.projects.length > 0 ||
    results.tasks.length > 0 ||
    results.members.length > 0 ||
    results.documents.length > 0 ||
    results.comments.length > 0 ||
    results.files.length > 0
  )

  let absoluteCounter = 0

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-[12vh] p-4 text-left">
      <div
        ref={paletteRef}
        className="w-full max-w-2xl bg-[#171A1D] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col max-h-[70vh] overflow-hidden"
      >
        {/* Command Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
          <Search className="h-4.5 w-4.5 text-[#7E848C]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search workspace or select commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-[#7E848C] outline-none"
          />
          {loading && <Loader className="h-4 w-4 text-[#5BB98C] animate-spin" />}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded hover:bg-white/5 text-[#7E848C] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Results body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          {/* 1. Predefined / Filtered Commands */}
          {staticCommands.filter(c => c.title.toLowerCase().includes(query.toLowerCase())).length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider px-2 flex items-center gap-1">
                <Terminal className="h-3 w-3 text-[#5BB98C]" /> Commands
              </div>
              {staticCommands.filter(c => c.title.toLowerCase().includes(query.toLowerCase())).map((cmd) => {
                const isCurrentActive = activeIndex === absoluteCounter++
                return (
                  <button
                    key={cmd.id}
                    onClick={() => executeCommand(cmd.title, cmd.url)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs border border-transparent transition-all cursor-pointer text-left ${
                      isCurrentActive ? 'bg-[#5BB98C]/15 text-white border-[#5BB98C]/20' : 'text-[#A7ADB5] hover:bg-[#5BB98C]/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Terminal className="h-3.5 w-3.5 text-[#5BB98C]" />
                      <span>{highlightMatch(cmd.title, query)}</span>
                    </div>
                    <CornerDownLeft className={`h-3.5 w-3.5 text-[#5BB98C] transition-opacity ${isCurrentActive ? 'opacity-100' : 'opacity-0'}`} />
                  </button>
                )
              })}
            </div>
          )}

          {/* 2. Show Recent Commands & Searches if query empty */}
          {!query.trim() && (
            <>
              {recentCommands.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#7E848C] uppercase tracking-wider px-2">
                    <span className="flex items-center gap-1"><History className="h-3 w-3" /> Recent Commands</span>
                    <button onClick={clearRecentCommands} className="hover:text-white cursor-pointer uppercase">Clear</button>
                  </div>
                  {recentCommands.map((cTitle, idx) => {
                    const isCurrentActive = activeIndex === absoluteCounter++
                    const matchingCmd = staticCommands.find(sc => sc.title === cTitle)
                    return (
                      <button
                        key={idx}
                        onClick={() => executeCommand(cTitle, matchingCmd?.url || '')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer text-left ${
                          isCurrentActive ? 'bg-[#5BB98C]/10 text-white' : 'text-[#A7ADB5] hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Terminal className="h-3.5 w-3.5 text-[#7E848C]" />
                          <span>{cTitle}</span>
                        </div>
                        <CornerDownLeft className={`h-3.5 w-3.5 text-[#5BB98C] transition-opacity ${isCurrentActive ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#7E848C] uppercase tracking-wider px-2">
                  <span className="flex items-center gap-1"><History className="h-3 w-3" /> Recent Searches</span>
                  {recentSearches.length > 0 && (
                    <button onClick={clearRecentSearches} className="hover:text-white cursor-pointer uppercase">Clear</button>
                  )}
                </div>
                <div className="space-y-1">
                  {recentSearches.map((s, idx) => {
                    const isCurrentActive = activeIndex === absoluteCounter++
                    return (
                      <button
                        key={idx}
                        onClick={() => setQuery(s)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer text-left ${
                          isCurrentActive ? 'bg-[#5BB98C]/10 text-white' : 'text-[#A7ADB5] hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <History className="h-3.5 w-3.5 text-[#7E848C]" />
                          <span>{s}</span>
                        </div>
                        <CornerDownLeft className={`h-3.5 w-3.5 text-[#5BB98C] transition-opacity ${isCurrentActive ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    )
                  })}
                  {recentSearches.length === 0 && (
                    <p className="text-[11px] text-[#7E848C] italic px-2 py-1">No recent searches recorded.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 3. Show Results if loaded */}
          {query.trim() && results && (
            <div className="space-y-4">
              
              {/* Projects section */}
              {results.projects.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider px-2">Projects</div>
                  {results.projects.map((p) => {
                    const isCurrentActive = activeIndex === absoluteCounter++
                    return (
                      <button
                        key={p.id}
                        onClick={() => navigateToResult(`/projects/${p.id}`)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs border border-transparent transition-all cursor-pointer text-left ${
                          isCurrentActive ? 'bg-[#5BB98C]/15 text-white border-[#5BB98C]/20' : 'text-[#A7ADB5] hover:bg-[#5BB98C]/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Folder className="h-3.5 w-3.5 text-blue-400" />
                          <span>{highlightMatch(p.name, query)}</span>
                        </div>
                        <CornerDownLeft className={`h-3.5 w-3.5 text-[#5BB98C] transition-opacity ${isCurrentActive ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Tasks section */}
              {results.tasks.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider px-2">Tasks</div>
                  {results.tasks.map((t) => {
                    const isCurrentActive = activeIndex === absoluteCounter++
                    return (
                      <button
                        key={t.id}
                        onClick={() => navigateToResult(`/calendar`)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs border border-transparent transition-all cursor-pointer text-left ${
                          isCurrentActive ? 'bg-[#5BB98C]/15 text-white border-[#5BB98C]/20' : 'text-[#A7ADB5] hover:bg-[#5BB98C]/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <CheckSquare className="h-3.5 w-3.5 text-[#5BB98C]" />
                          <div>
                            <div className="font-medium text-white">{highlightMatch(t.title, query)}</div>
                            {t.description && <div className="text-[10px] text-[#7E848C] truncate max-w-lg">{t.description}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#7E848C]">{t.status}</span>
                          <CornerDownLeft className={`h-3.5 w-3.5 text-[#5BB98C] transition-opacity ${isCurrentActive ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Members section */}
              {results.members.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider px-2">Workspace Members</div>
                  {results.members.map((m) => {
                    const isCurrentActive = activeIndex === absoluteCounter++
                    return (
                      <button
                        key={m.id}
                        onClick={() => navigateToResult(`/team`)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs border border-transparent transition-all cursor-pointer text-left ${
                          isCurrentActive ? 'bg-[#5BB98C]/15 text-white border-[#5BB98C]/20' : 'text-[#A7ADB5] hover:bg-[#5BB98C]/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full bg-[#5BB98C]/15 border border-[#5BB98C]/25 text-[#5BB98C] flex items-center justify-center text-[9px] font-bold">
                            {m.full_name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">{highlightMatch(m.full_name, query)}</div>
                            <div className="text-[9px] text-[#7E848C]">{highlightMatch(m.email, query)}</div>
                          </div>
                        </div>
                        <CornerDownLeft className={`h-3.5 w-3.5 text-[#5BB98C] transition-opacity ${isCurrentActive ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Documents section */}
              {results.documents.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider px-2">Documentation</div>
                  {results.documents.map((d) => {
                    const isCurrentActive = activeIndex === absoluteCounter++
                    return (
                      <button
                        key={d.id}
                        onClick={() => navigateToResult(`/documentation`)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs border border-transparent transition-all cursor-pointer text-left ${
                          isCurrentActive ? 'bg-[#5BB98C]/15 text-white border-[#5BB98C]/20' : 'text-[#A7ADB5] hover:bg-[#5BB98C]/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-3.5 w-3.5 text-yellow-500" />
                          <div>
                            <div className="font-medium text-white">{highlightMatch(d.title, query)}</div>
                            {d.content && <div className="text-[10px] text-[#7E848C] truncate max-w-lg">{d.content}</div>}
                          </div>
                        </div>
                        <CornerDownLeft className={`h-3.5 w-3.5 text-[#5BB98C] transition-opacity ${isCurrentActive ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Comments section */}
              {results.comments.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider px-2">Comments</div>
                  {results.comments.map((c) => {
                    const isCurrentActive = activeIndex === absoluteCounter++
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          if (c.project_id) navigateToResult(`/projects/${c.project_id}`)
                          else navigateToResult(`/projects`)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs border border-transparent transition-all cursor-pointer text-left ${
                          isCurrentActive ? 'bg-[#5BB98C]/15 text-white border-[#5BB98C]/20' : 'text-[#A7ADB5] hover:bg-[#5BB98C]/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                          <span className="truncate max-w-lg">{highlightMatch(c.content, query)}</span>
                        </div>
                        <CornerDownLeft className={`h-3.5 w-3.5 text-[#5BB98C] transition-opacity ${isCurrentActive ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Files section */}
              {results.files.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider px-2">Files</div>
                  {results.files.map((f) => {
                    const isCurrentActive = activeIndex === absoluteCounter++
                    return (
                      <button
                        key={f.id}
                        onClick={() => navigateToResult(`/files`)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs border border-transparent transition-all cursor-pointer text-left ${
                          isCurrentActive ? 'bg-[#5BB98C]/15 text-white border-[#5BB98C]/20' : 'text-[#A7ADB5] hover:bg-[#5BB98C]/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <File className="h-3.5 w-3.5 text-yellow-500" />
                          <span>{highlightMatch(f.name, query)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-[#7E848C] font-mono">{(f.size / 1024).toFixed(1)} KB</span>
                          <CornerDownLeft className={`h-3.5 w-3.5 text-[#5BB98C] transition-opacity ${isCurrentActive ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Empty results view */}
              {!hasResults && !loading && (
                <div className="text-center py-8 text-xs text-[#7E848C] italic">
                  No matches found for &quot;{query}&quot;
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 border-t border-white/[0.04] bg-[#141618] text-[9px] text-[#7E848C] flex items-center justify-between">
          <span>Search projects, tasks, team, docs, commands (Theme, Create Task)...</span>
          <div className="flex gap-2">
            <span>↑↓ to navigate</span>
            <span>ESC to close</span>
            <span>↵ to select</span>
          </div>
        </div>
      </div>
    </div>
  )
}
