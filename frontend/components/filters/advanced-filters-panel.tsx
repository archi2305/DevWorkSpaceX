'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { savedFilterService, SavedFilter } from '@/services/saved-filter'
import { sprintService } from '@/services/sprint'
import { labelService } from '@/services/label'
import { teamService } from '@/services/team'
import { Filter, RotateCcw, Save, Trash2, Calendar, User, Tag, Zap, Check } from 'lucide-react'

export interface FilterCriteria {
  statuses: string[]
  priorities: string[]
  dueDate: string
  sprintId: string
  labelIds: string[]
  assigneeId: string
  createdStart: string
  createdEnd: string
  updatedStart: string
  updatedEnd: string
}

interface AdvancedFiltersPanelProps {
  projectId: string
  criteria: FilterCriteria
  onChange: (criteria: FilterCriteria) => void
  onReset: () => void
  onClose?: () => void
}

export function AdvancedFiltersPanel({
  projectId,
  criteria,
  onChange,
  onReset,
  onClose
}: AdvancedFiltersPanelProps) {
  const queryClient = useQueryClient()
  const [saveName, setSaveName] = useState('')

  // Load Saved Filters
  const { data: savedFilters = [] } = useQuery({
    queryKey: ['saved-filters', 'Task'],
    queryFn: () => savedFilterService.getSavedFilters('Task')
  })

  // Load Sprints
  const { data: sprints = [] } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintService.getSprints(projectId)
  })

  // Load Labels
  const { data: labels = [] } = useQuery({
    queryKey: ['labels', projectId],
    queryFn: () => labelService.getLabels(projectId)
  })

  // Load Workspace members
  const { data: members = [] } = useQuery({
    queryKey: ['workspace-members'],
    queryFn: teamService.getWorkspaceMembers
  })

  // Mutations
  const saveFilterMutation = useMutation({
    mutationFn: (data: { name: string; target_type: 'Task'; criteria: Record<string, any> }) =>
      savedFilterService.createSavedFilter(data),
    onSuccess: () => {
      setSaveName('')
      queryClient.invalidateQueries({ queryKey: ['saved-filters', 'Task'] })
    }
  })

  const deleteFilterMutation = useMutation({
    mutationFn: (id: string) => savedFilterService.deleteSavedFilter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', 'Task'] })
    }
  })

  const handleStatusChange = (status: string) => {
    const next = criteria.statuses.includes(status)
      ? criteria.statuses.filter((s) => s !== status)
      : [...criteria.statuses, status]
    onChange({ ...criteria, statuses: next })
  }

  const handlePriorityChange = (priority: string) => {
    const next = criteria.priorities.includes(priority)
      ? criteria.priorities.filter((p) => p !== priority)
      : [...criteria.priorities, priority]
    onChange({ ...criteria, priorities: next })
  }

  const handleLabelChange = (labelId: string) => {
    const next = criteria.labelIds.includes(labelId)
      ? criteria.labelIds.filter((lid) => lid !== labelId)
      : [...criteria.labelIds, labelId]
    onChange({ ...criteria, labelIds: next })
  }

  const handleSaveFilter = (e: React.FormEvent) => {
    e.preventDefault()
    if (!saveName.trim()) return
    saveFilterMutation.mutate({
      name: saveName,
      target_type: 'Task',
      criteria: {
        statuses: criteria.statuses,
        priorities: criteria.priorities,
        dueDate: criteria.dueDate,
        sprintId: criteria.sprintId,
        labelIds: criteria.labelIds,
        assigneeId: criteria.assigneeId,
        createdStart: criteria.createdStart,
        createdEnd: criteria.createdEnd,
        updatedStart: criteria.updatedStart,
        updatedEnd: criteria.updatedEnd
      }
    })
  }

  const handleApplyPreset = (preset: SavedFilter) => {
    const p = preset.criteria
    onChange({
      statuses: p.statuses || [],
      priorities: p.priorities || [],
      dueDate: p.dueDate || '',
      sprintId: p.sprintId || '',
      labelIds: p.labelIds || [],
      assigneeId: p.assigneeId || '',
      createdStart: p.createdStart || '',
      createdEnd: p.createdEnd || '',
      updatedStart: p.updatedStart || '',
      updatedEnd: p.updatedEnd || ''
    })
  }

  return (
    <div className="w-full bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 space-y-5 text-left text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
          <Filter className="h-4 w-4 text-[#5BB98C]" /> Advanced Filters
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="text-[10px] text-[#7E848C] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          {onClose && (
            <button onClick={onClose} className="text-[10px] text-[#A7ADB5] hover:text-white">
              Close
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left column inputs */}
        <div className="space-y-4">
          {/* Status filter */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#A7ADB5] uppercase">Filter by Status</span>
            <div className="flex flex-wrap gap-1.5">
              {['Todo', 'In Progress', 'Review', 'Done'].map((st) => {
                const isSelected = criteria.statuses.includes(st)
                return (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#5BB98C]/10 border-[#5BB98C]/30 text-[#5BB98C]'
                        : 'bg-[#1D2024] border-white/[0.04] text-[#A7ADB5] hover:border-white/10'
                    }`}
                  >
                    {st}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Priority filter */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#A7ADB5] uppercase">Filter by Priority</span>
            <div className="flex flex-wrap gap-1.5">
              {['Low', 'Medium', 'High', 'Urgent'].map((pr) => {
                const isSelected = criteria.priorities.includes(pr)
                return (
                  <button
                    key={pr}
                    onClick={() => handlePriorityChange(pr)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EB5757]/10 border-[#EB5757]/30 text-[#EB5757]'
                        : 'bg-[#1D2024] border-white/[0.04] text-[#A7ADB5] hover:border-white/10'
                    }`}
                  >
                    {pr}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sprints selection */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[#A7ADB5] uppercase flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-[#5BB98C]" /> Target Sprint
            </span>
            <select
              value={criteria.sprintId}
              onChange={(e) => onChange({ ...criteria, sprintId: e.target.value })}
              className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] text-xs text-white rounded-xl outline-none"
            >
              <option value="">Any Sprint</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          {/* Assignees selection */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[#A7ADB5] uppercase flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-[#5BB98C]" /> Assignee
            </span>
            <select
              value={criteria.assigneeId}
              onChange={(e) => onChange({ ...criteria, assigneeId: e.target.value })}
              className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] text-xs text-white rounded-xl outline-none"
            >
              <option value="">Any Member</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right column inputs */}
        <div className="space-y-4">
          
          {/* Labels Tags select */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#A7ADB5] uppercase flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-[#5BB98C]" /> Tags & Labels
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto p-2 bg-[#1D2024] border border-white/[0.04] rounded-xl">
              {labels.map((lbl) => {
                const isSelected = criteria.labelIds.includes(lbl.id)
                return (
                  <button
                    key={lbl.id}
                    onClick={() => handleLabelChange(lbl.id)}
                    className={`text-[9px] px-2 py-0.5 rounded font-bold transition-all border cursor-pointer ${
                      isSelected ? 'border-white/40 shadow-sm scale-105' : 'border-transparent opacity-60'
                    }`}
                    style={{ backgroundColor: lbl.color, color: '#111315' }}
                  >
                    {lbl.name}
                  </button>
                )}
              )}
              {labels.length === 0 && (
                <span className="text-[10px] text-[#7E848C] italic">No labels tags found.</span>
              )}
            </div>
          </div>

          {/* Creation Date boundary */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[#A7ADB5] uppercase flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#5BB98C]" /> Date Created
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={criteria.createdStart}
                onChange={(e) => onChange({ ...criteria, createdStart: e.target.value })}
                className="px-2 py-1.5 bg-[#1D2024] border border-white/[0.06] text-[10px] text-white rounded-lg outline-none"
              />
              <input
                type="date"
                value={criteria.createdEnd}
                onChange={(e) => onChange({ ...criteria, createdEnd: e.target.value })}
                className="px-2 py-1.5 bg-[#1D2024] border border-white/[0.06] text-[10px] text-white rounded-lg outline-none"
              />
            </div>
          </div>

          {/* Updated Date boundary */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[#A7ADB5] uppercase flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#5BB98C]" /> Date Updated
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={criteria.updatedStart}
                onChange={(e) => onChange({ ...criteria, updatedStart: e.target.value })}
                className="px-2 py-1.5 bg-[#1D2024] border border-white/[0.06] text-[10px] text-white rounded-lg outline-none"
              />
              <input
                type="date"
                value={criteria.updatedEnd}
                onChange={(e) => onChange({ ...criteria, updatedEnd: e.target.value })}
                className="px-2 py-1.5 bg-[#1D2024] border border-white/[0.06] text-[10px] text-white rounded-lg outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preset saver */}
      <form onSubmit={handleSaveFilter} className="flex gap-2 items-center bg-[#1D2024] p-3 rounded-xl border border-white/[0.02]">
        <input
          type="text"
          required
          placeholder="Name this query template..."
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          className="flex-1 px-3 py-1.5 border border-white/[0.06] bg-[#171A1D] rounded-lg text-[10px] text-white outline-none focus:border-[#5BB98C]"
        />
        <button
          type="submit"
          disabled={saveFilterMutation.isPending}
          className="px-3.5 py-1.5 bg-[#5BB98C]/15 hover:bg-[#5BB98C]/25 text-[#5BB98C] border border-[#5BB98C]/20 font-bold rounded-lg text-[10px] tracking-wide transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Save className="h-3 w-3" /> Save Preset
        </button>
      </form>

      {/* Saved Presets list */}
      {savedFilters.length > 0 && (
        <div className="border-t border-white/[0.06] pt-3 space-y-2">
          <span className="text-[10px] font-bold text-[#A7ADB5] uppercase block">Apply Saved Presets</span>
          <div className="flex flex-wrap gap-2">
            {savedFilters.map((sf) => (
              <div
                key={sf.id}
                className="flex items-center gap-2 p-1.5 bg-[#1D2024] border border-white/[0.04] rounded-lg hover:border-white/10"
              >
                <button
                  onClick={() => handleApplyPreset(sf)}
                  className="text-[10px] text-white font-semibold cursor-pointer px-1"
                >
                  {sf.name}
                </button>
                <button
                  onClick={() => deleteFilterMutation.mutate(sf.id)}
                  className="text-[#7E848C] hover:text-[#EB5757]"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
