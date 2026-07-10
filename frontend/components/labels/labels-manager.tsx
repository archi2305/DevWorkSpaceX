'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { labelService, Label } from '@/services/label'
import { Plus, Search, Trash2, Tag, Check, Palette } from 'lucide-react'

interface LabelsManagerProps {
  projectId: string
  onClose?: () => void
}

const PRESET_COLORS = [
  '#5BB98C', // Emerald
  '#EB5757', // Red
  '#F2C94C', // Yellow
  '#2F80ED', // Blue
  '#9B51E0', // Purple
  '#F2994A', // Orange
  '#2D9CDB', // Sky Blue
  '#BB6BD9', // Pinkish Purple
  '#6FCF97', // Light green
  '#E0E0E0'  // Grey
]

export function LabelsManager({ projectId, onClose }: LabelsManagerProps) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [newLabelName, setNewLabelName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [customColor, setCustomColor] = useState('')

  // Load project-scoped labels
  const { data: labels = [] } = useQuery({
    queryKey: ['labels', projectId, searchQuery],
    queryFn: () => labelService.getLabels(projectId, searchQuery)
  })

  // Mutations
  const createLabelMutation = useMutation({
    mutationFn: (data: { project_id: string; name: string; color: string }) =>
      labelService.createLabel(data),
    onSuccess: () => {
      setNewLabelName('')
      setCustomColor('')
      queryClient.invalidateQueries({ queryKey: ['labels', projectId] })
    }
  })

  const deleteLabelMutation = useMutation({
    mutationFn: (id: string) => labelService.deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', projectId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: projectId }] })
    }
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabelName.trim()) return
    const finalColor = customColor.trim() || selectedColor
    createLabelMutation.mutate({
      project_id: projectId,
      name: newLabelName,
      color: finalColor
    })
  }

  return (
    <div className="w-full max-w-sm bg-[#171A1D] border border-white/[0.06] rounded-2xl p-4 space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="h-4 w-4 text-[#5BB98C]" /> Manage Labels
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-[10px] text-[#A7ADB5] hover:text-white">
            Close
          </button>
        )}
      </div>

      {/* Creation form */}
      <form onSubmit={handleCreateSubmit} className="space-y-3 bg-[#1D2024] p-3 rounded-xl border border-white/[0.02]">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-[#A7ADB5] uppercase">Label Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Phase 1, Bug, Blocking"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-white/[0.06] bg-[#171A1D] rounded-lg text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none"
          />
        </div>

        {/* Color picker presets */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-[#A7ADB5] uppercase block">Color Tag</label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setSelectedColor(c)
                  setCustomColor('')
                }}
                className="w-5 h-5 rounded-full border border-white/10 relative transition-transform hover:scale-110 cursor-pointer"
                style={{ backgroundColor: c }}
              >
                {!customColor && selectedColor === c && (
                  <Check className="h-3 w-3 text-black absolute inset-0 m-auto font-bold" />
                )}
              </button>
            ))}
          </div>

          {/* Custom color hex input */}
          <div className="flex items-center gap-2 mt-2">
            <Palette className="h-3.5 w-3.5 text-[#7E848C]" />
            <input
              type="text"
              placeholder="#HEX Color..."
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="px-2 py-1 bg-[#171A1D] border border-white/[0.06] rounded-md text-[10px] text-white outline-none w-28"
            />
            {customColor && (
              <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: customColor }} />
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={createLabelMutation.isPending}
          className="w-full py-1.5 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
        >
          {createLabelMutation.isPending ? 'Saving...' : 'Add Label'}
        </button>
      </form>

      {/* Search Labels */}
      <div className="relative">
        <Search className="h-3.5 w-3.5 text-[#7E848C] absolute left-2.5 top-2.5" />
        <input
          type="text"
          placeholder="Search labels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none"
        />
      </div>

      {/* Labels List */}
      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
        {labels.map((label) => (
          <div
            key={label.id}
            className="flex items-center justify-between p-2 bg-[#1D2024] border border-white/[0.02] rounded-xl"
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color }} />
              <span className="text-xs text-white">{label.name}</span>
            </div>

            <button
              onClick={() => deleteLabelMutation.mutate(label.id)}
              className="p-1 rounded hover:bg-white/5 text-[#7E848C] hover:text-[#EB5757] transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {labels.length === 0 && (
          <p className="text-[10px] text-[#7E848C] italic text-center py-2">No tags matched.</p>
        )}
      </div>
    </div>
  )
}
