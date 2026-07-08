'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Bell, Moon, Sun, Folder, CheckSquare, FileText, User as UserIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/hooks/useAuth'
import { useProjectStore } from '@/store/useProjectStore'
import { dashboardService, SearchResultsResponse } from '@/services/dashboard'

export function TopNav() {
  const { theme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)
  const { user } = useAuth()
  const { fetchProjects } = useProjectStore()
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultsResponse | null>(null)
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMounted(true)
    
    // Close search dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      setShowDropdown(false)
      // Reset dashboard project cards to list all records
      fetchProjects()
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true)
      setShowDropdown(true)
      try {
        // 1. Fetch global database matches for the portal dropdown list
        const data = await dashboardService.searchWorkspace(searchQuery)
        setSearchResults(data)

        // 2. Filter projects listed on the dashboard background matching the query
        fetchProjects(searchQuery)
      } catch (error) {
        console.error('Search query execution failed', error)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, fetchProjects])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const userInitials = user ? getInitials(user.full_name) : 'U'

  // Helper to check if search returned any results
  const hasResults = searchResults && (
    searchResults.projects.length > 0 ||
    searchResults.tasks.length > 0 ||
    searchResults.documentation.length > 0 ||
    searchResults.users.length > 0
  )

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed right-0 top-0 left-64 z-30 border-b border-border bg-card/80 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        {/* Search Bar & Dropdown */}
        <div ref={dropdownRef} className="flex-1 relative">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-full"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                placeholder="Search projects, tasks, docs... (⌘K)"
                className={`
                  w-full rounded-lg border border-input bg-background/50 pl-10 pr-4 py-2.5
                  text-sm placeholder-muted-foreground transition-all
                  focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20
                  text-white
                `}
              />
            </div>
          </motion.div>

          {/* Search Dropdown Modal */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 top-full mt-2 max-h-[380px] overflow-y-auto rounded-xl border border-white/5 bg-[#09090b] p-4 shadow-2xl z-50 space-y-4"
              >
                {searching ? (
                  <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
                    <div className="h-3 w-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    Searching workspace...
                  </div>
                ) : !hasResults ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No results found for &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <>
                    {/* Projects Section */}
                    {searchResults.projects.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">Projects</p>
                        {searchResults.projects.map((project) => (
                          <div
                            key={project.id}
                            onClick={() => { setShowDropdown(false); setSearchQuery(''); }}
                            className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5 cursor-pointer text-xs text-foreground transition-colors"
                          >
                            <Folder className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-medium truncate text-white">{project.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tasks Section */}
                    {searchResults.tasks.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">Tasks</p>
                        {searchResults.tasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => { setShowDropdown(false); setSearchQuery(''); }}
                            className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5 cursor-pointer text-xs text-foreground transition-colors"
                          >
                            <CheckSquare className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                            <span className="font-medium truncate text-white">{task.title}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Documentation Section */}
                    {searchResults.documentation.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">Documentation</p>
                        {searchResults.documentation.map((doc) => (
                          <div
                            key={doc}
                            onClick={() => { setShowDropdown(false); setSearchQuery(''); }}
                            className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5 cursor-pointer text-xs text-foreground transition-colors"
                          >
                            <FileText className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                            <span className="font-medium truncate text-white">{doc}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Users Section */}
                    {searchResults.users.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">Team members</p>
                        {searchResults.users.map((name) => (
                          <div
                            key={name}
                            onClick={() => { setShowDropdown(false); setSearchQuery(''); }}
                            className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5 cursor-pointer text-xs text-foreground transition-colors"
                          >
                            <UserIcon className="h-4 w-4 text-amber-400 flex-shrink-0" />
                            <span className="font-medium truncate text-white">{name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              inline-flex items-center gap-2 rounded-lg border border-input px-3 py-2.5
              text-sm font-medium text-foreground transition-all
              hover:border-primary hover:bg-primary/5
            `}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            className="relative rounded-lg p-2.5 hover:bg-muted transition-colors"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          </motion.button>

          {isMounted && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg p-2.5 hover:bg-muted transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground" />
              )}
            </motion.button>
          )}

          {user?.profile_image ? (
            <img
              src={user.profile_image}
              alt={user.full_name}
              className="ml-2 h-9 w-9 rounded-full object-cover cursor-pointer hover:scale-105 transition-transform"
            />
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground cursor-pointer"
            >
              {userInitials}
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  )
}
