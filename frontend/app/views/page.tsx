'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Eye,
  Star,
  Trash2,
  Clock,
  Layout,
  Filter,
  Plus,
  Loader,
  Settings,
  Grid,
  List as ListIcon,
  Table as TableIcon
} from 'lucide-react'
import { savedFilterService, SavedFilter } from '@/services/saved-filter'
import Link from 'next/link'

export default function SavedViewsPage() {
  const queryClient = useQueryClient()
  const [newViewName, setNewViewName] = useState('')
  const [targetType, setTargetType] = useState<'Project' | 'Task'>('Task')
  const [selectedLayout, setSelectedLayout] = useState<'kanban' | 'list' | 'table'>('kanban')

  // 1. Fetch Saved Views
  const { data: savedViews = [], isLoading } = useQuery({
    queryKey: ['saved-views'],
    queryFn: () => savedFilterService.getSavedFilters()
  })

  const { data: recentViews = [] } = useQuery({
    queryKey: ['recent-views'],
    queryFn: () => savedFilterService.getRecentSavedFilters()
  })

  // 2. Mutations
  const createViewMutation = useMutation({
    mutationFn: (data: { name: string; target_type: 'Project' | 'Task'; criteria: any; layout: 'kanban' | 'list' | 'table' }) =>
      savedFilterService.createSavedFilter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-views'] })
      setNewViewName('')
    }
  })

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: string) => savedFilterService.toggleFavoriteSavedFilter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-views'] })
    }
  })

  const deleteViewMutation = useMutation({
    mutationFn: (id: string) => savedFilterService.deleteSavedFilter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-views'] })
      queryClient.invalidateQueries({ queryKey: ['recent-views'] })
    }
  })

  const registerUseMutation = useMutation({
    mutationFn: (id: string) => savedFilterService.useSavedFilter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-views'] })
    }
  })

  const handleCreateView = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newViewName.trim()) return

    createViewMutation.mutate({
      name: newViewName,
      target_type: targetType,
      criteria: { status: 'Todo,In Progress' }, // Default criteria preset
      layout: selectedLayout
    })
  }

  const renderLayoutIcon = (layout?: string) => {
    switch (layout) {
      case 'kanban':
        return <Grid className="h-4 w-4 text-[#5BB98C]" />
      case 'table':
        return <TableIcon className="h-4 w-4 text-blue-400" />
      default:
        return <ListIcon className="h-4 w-4 text-purple-400" />
    }
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 text-left">
        
        {/* Header Section */}
        <div className="border-b border-white/[0.06] pb-5">
          <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
            <Layout className="h-6 w-6 text-[#5BB98C]" /> Saved Views
          </h1>
          <p className="text-xs text-[#A7ADB5] mt-1">Configure, load, and favorite custom layouts, query filters, and board states.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main List column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Favorites & View List */}
            <div className="border border-white/[0.06] bg-[#171A1D] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /> All Saved Views ({savedViews.length})
              </h3>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader className="h-5 w-5 text-[#5BB98C] animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {savedViews.map((view) => (
                    <div key={view.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {renderLayoutIcon(view.layout)}
                        <div>
                          <span className="text-xs font-bold text-white block">{view.name}</span>
                          <span className="text-[10px] text-[#A7ADB5] flex items-center gap-1.5 mt-0.5">
                            Type: <strong className="text-white">{view.target_type}</strong> • Layout: <strong className="text-white">{view.layout || 'list'}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            registerUseMutation.mutate(view.id)
                            alert(`Loading Saved View: ${view.name}\nFilters Applied: ${JSON.stringify(view.criteria)}`)
                          }}
                          className="p-1.5 rounded-lg border border-white/[0.08] hover:bg-[#1D2024] text-white transition-colors cursor-pointer"
                          title="Apply view"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => toggleFavoriteMutation.mutate(view.id)}
                          className={`p-1.5 rounded-lg border border-white/[0.08] hover:bg-[#1D2024] transition-colors cursor-pointer ${
                            view.is_favorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-[#7E848C]'
                          }`}
                          title="Toggle Favorite"
                        >
                          <Star className={`h-3.5 w-3.5 ${view.is_favorite ? 'fill-yellow-400' : ''}`} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this saved view?')) {
                              deleteViewMutation.mutate(view.id)
                            }
                          }}
                          className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer"
                          title="Delete view"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {savedViews.length === 0 && (
                    <div className="py-12 text-[#7E848C] text-xs text-center">
                      No saved views created yet.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recently Used Presets */}
            <div className="border border-white/[0.06] bg-[#171A1D] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" /> Recently Visited
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentViews.map((rv) => (
                  <div key={rv.id} className="p-3 border border-white/[0.06] bg-[#1C1F22] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {renderLayoutIcon(rv.layout)}
                      <div>
                        <span className="text-xs font-bold text-white block">{rv.name}</span>
                        {rv.last_used_at && (
                          <span className="text-[9px] text-[#A7ADB5] block mt-0.5">
                            Visited: {new Date(rv.last_used_at).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {recentViews.length === 0 && (
                  <div className="col-span-2 py-6 text-[#7E848C] text-xs text-center border border-dashed border-white/10 rounded-xl">
                    No recently loaded views tracked yet.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Create Preset Form column */}
          <div className="space-y-6">
            <div className="border border-white/[0.06] bg-[#171A1D] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#5BB98C]" /> Create Custom View
              </h3>

              <form onSubmit={handleCreateView} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#A7ADB5] font-bold uppercase tracking-wider block">View Name</label>
                  <input
                    type="text"
                    required
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="e.g. My Sprint Kanban"
                    className="w-full bg-[#121416] border border-white/[0.08] focus:border-[#5BB98C] text-white px-3 py-2 text-xs rounded-xl focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#A7ADB5] font-bold uppercase tracking-wider block">Target Scope</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as 'Project' | 'Task')}
                    className="w-full bg-[#121416] border border-white/[0.08] focus:border-[#5BB98C] text-white px-3 py-2 text-xs rounded-xl focus:outline-none transition-colors"
                  >
                    <option value="Task">Tasks Presets</option>
                    <option value="Project">Projects Presets</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#A7ADB5] font-bold uppercase tracking-wider block">Layout Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['kanban', 'list', 'table'] as const).map((lay) => (
                      <button
                        key={lay}
                        type="button"
                        onClick={() => setSelectedLayout(lay)}
                        className={`py-2 text-[10px] font-bold uppercase tracking-wider border rounded-xl transition-all cursor-pointer ${
                          selectedLayout === lay
                            ? 'border-[#5BB98C] bg-[#5BB98C]/10 text-[#5BB98C]'
                            : 'border-white/[0.08] text-[#7E848C] hover:text-white'
                        }`}
                      >
                        {lay}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createViewMutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold py-2.5 text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  Create View
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </MainLayout>
  )
}
