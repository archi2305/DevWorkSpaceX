'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customFieldService } from '@/services/custom-field'
import { Loader, CheckCircle2 } from 'lucide-react'

interface CustomFieldsSectionProps {
  entityId: string
  targetType: 'Project' | 'Task'
}

export function CustomFieldsSection({ entityId, targetType }: CustomFieldsSectionProps) {
  const queryClient = useQueryClient()
  const [savingFieldId, setSavingFieldId] = useState<string | null>(null)

  // 1. Load definitions for this scope (Project or Task)
  const { data: definitions = [], isLoading: loadingDefs } = useQuery({
    queryKey: ['custom-field-defs', targetType],
    queryFn: () => customFieldService.getDefinitions(targetType)
  })

  // 2. Load assigned field values for this specific entity
  const { data: values = [], isLoading: loadingVals } = useQuery({
    queryKey: ['custom-field-vals', entityId],
    queryFn: () => customFieldService.getFieldValues(entityId),
    enabled: !!entityId
  })

  // 3. Auto-save mutation
  const saveValueMutation = useMutation({
    mutationFn: (data: { field_definition_id: string; entity_id: string; value: { val: any } }) =>
      customFieldService.saveFieldValue(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-vals', entityId] })
      setSavingFieldId(null)
    }
  })

  const handleValueChange = (definitionId: string, val: any) => {
    setSavingFieldId(definitionId)
    saveValueMutation.mutate({
      field_definition_id: definitionId,
      entity_id: entityId,
      value: { val }
    })
  }

  const getValueForField = (definitionId: string) => {
    const record = values.find((v) => v.field_definition_id === definitionId)
    return record?.value?.val ?? ''
  }

  if (loadingDefs || loadingVals) {
    return (
      <div className="flex items-center gap-1.5 py-4 text-xs text-[#A7ADB5]">
        <Loader className="h-3 w-3 animate-spin text-[#5BB98C]" /> Loading custom attributes...
      </div>
    )
  }

  if (definitions.length === 0) return null

  return (
    <div className="border border-white/[0.06] bg-[#1C1F22]/40 rounded-xl p-4 space-y-4 text-left">
      <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Custom Fields</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {definitions.map((def) => {
          const val = getValueForField(def.id)
          const isSaving = savingFieldId === def.id

          return (
            <div key={def.id} className="space-y-1">
              <label className="text-[10px] font-semibold text-[#A7ADB5] flex items-center justify-between">
                <span>{def.name}</span>
                {isSaving && <Loader className="h-2.5 w-2.5 animate-spin text-[#5BB98C]" />}
              </label>

              {/* Text Input */}
              {def.field_type === 'Text' && (
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleValueChange(def.id, e.target.value)}
                  className="w-full bg-[#121416] border border-white/[0.08] text-xs text-white px-3 py-2 rounded-lg outline-none focus:border-[#5BB98C]"
                />
              )}

              {/* Number Input */}
              {def.field_type === 'Number' && (
                <input
                  type="number"
                  value={val}
                  onChange={(e) => handleValueChange(def.id, parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#121416] border border-white/[0.08] text-xs text-white px-3 py-2 rounded-lg outline-none focus:border-[#5BB98C]"
                />
              )}

              {/* Date Input */}
              {def.field_type === 'Date' && (
                <input
                  type="date"
                  value={val}
                  onChange={(e) => handleValueChange(def.id, e.target.value)}
                  className="w-full bg-[#121416] border border-white/[0.08] text-xs text-white px-3 py-2 rounded-lg outline-none focus:border-[#5BB98C]"
                />
              )}

              {/* Dropdown Selector */}
              {def.field_type === 'Dropdown' && (
                <select
                  value={val}
                  onChange={(e) => handleValueChange(def.id, e.target.value)}
                  className="w-full bg-[#121416] border border-white/[0.08] text-xs text-white px-3 py-2 rounded-lg outline-none focus:border-[#5BB98C] cursor-pointer"
                >
                  <option value="">Select option</option>
                  {(def.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {/* Checkbox Toggle */}
              {def.field_type === 'Checkbox' && (
                <label className="flex items-center gap-2 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!val}
                    onChange={(e) => handleValueChange(def.id, e.target.checked)}
                    className="accent-[#5BB98C] h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  <span className="text-[10px] text-white">Active</span>
                </label>
              )}

              {/* URL Input */}
              {def.field_type === 'URL' && (
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={val}
                  onChange={(e) => handleValueChange(def.id, e.target.value)}
                  className="w-full bg-[#121416] border border-white/[0.08] text-xs text-white px-3 py-2 rounded-lg outline-none focus:border-[#5BB98C]"
                />
              )}

            </div>
          )
        })}
      </div>
    </div>
  )
}
