'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import { projectService } from '@/services/project'
import { automationService, AutomationRule } from '@/services/automation'
import {
  Zap,
  Play,
  Trash2,
  Loader,
  Plus,
  ArrowRight,
  Info,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  GitCommit
} from 'lucide-react'

export default function AutomationsPage() {
  const queryClient = useQueryClient()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  
  // Rule Builder States (Visual nodes mapping)
  const [ruleName, setRuleName] = useState('')
  const [triggerEvent, setTriggerEvent] = useState('task_completed')
  const [actionType, setActionType] = useState('move_to_done')
  const [actionTarget, setActionTarget] = useState('')

  // Load Projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects()
  })

  // Load Automation Rules
  const { data: rules = [], isLoading: loadingRules } = useQuery({
    queryKey: ['automation-rules', selectedProjectId],
    queryFn: () => automationService.getAutomations(selectedProjectId),
    enabled: !!selectedProjectId
  })

  // Mutations
  const createRuleMutation = useMutation({
    mutationFn: (data: { project_id: string; name: string; trigger_event: string; action_type: string; action_target?: string }) =>
      automationService.createAutomationRule(data),
    onSuccess: () => {
      setRuleName('')
      queryClient.invalidateQueries({ queryKey: ['automation-rules', selectedProjectId] })
    }
  })

  const toggleRuleMutation = useMutation({
    mutationFn: (data: { id: string; active: boolean }) =>
      automationService.updateAutomationRule(data.id, { is_active: data.active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', selectedProjectId] })
    }
  })

  const deleteRuleMutation = useMutation({
    mutationFn: automationService.deleteAutomationRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', selectedProjectId] })
    }
  })

  const runTriggerMutation = useMutation({
    mutationFn: () => automationService.triggerDueDates(selectedProjectId),
    onSuccess: (data) => {
      alert(`Due date check executed. Triggered alerts count: ${data.triggered_count}`)
    }
  })

  const handleBuildRule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ruleName.trim()) return
    createRuleMutation.mutate({
      project_id: selectedProjectId,
      name: ruleName,
      trigger_event: triggerEvent,
      action_type: actionType,
      action_target: actionTarget || undefined
    })
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        
        {/* Header Block */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <Zap className="h-6 w-6 text-[#5BB98C]" /> Workflow Automation Rules
            </h1>
            <p className="text-xs text-[#A7ADB5] mt-1">Configure visual triggers to automatically move tasks, notify owners, or close sprints.</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#171A1D] text-xs text-[#F5F5F5] outline-none cursor-pointer hover:bg-[#23272B] focus:border-[#5BB98C]"
            >
              <option value="">Select Project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {selectedProjectId && (
              <button
                onClick={() => runTriggerMutation.mutate()}
                className="px-4 py-2.5 bg-[#171A1D] border border-white/[0.06] hover:bg-[#23272B] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 text-[#5BB98C]" /> Run Due-Date Checks
              </button>
            )}
          </div>
        </div>

        {!selectedProjectId ? (
          <div className="border border-dashed border-white/[0.06] rounded-2xl p-12 text-center space-y-2 bg-[#171A1D]/20">
            <Zap className="h-10 w-10 text-[#7E848C] mx-auto opacity-40 animate-pulse" />
            <p className="text-sm font-semibold text-white">No Project Selected</p>
            <p className="text-xs text-[#A7ADB5]">Choose a project from the dropdown filter to start editing workflow rules.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual Workflow Builder Card */}
            <div className="lg:col-span-2 bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 space-y-6">
              <div>
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#5BB98C]" /> Visual Workflow Builder
                </h2>
                <p className="text-[10px] text-[#A7ADB5] mt-1">Design rules visually by linking events directly to automation sequences.</p>
              </div>

              <form onSubmit={handleBuildRule} className="space-y-6">
                
                {/* Visual Flow Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center justify-center text-center py-6 bg-[#111315]/40 border border-white/[0.06] rounded-xl p-4">
                  
                  {/* Node A: Trigger Selection */}
                  <div className="bg-[#171A1D] border border-[#5BB98C]/30 p-4 rounded-xl space-y-2 text-left shadow-sm">
                    <span className="text-[9px] bg-[#5BB98C]/15 text-[#5BB98C] px-2 py-0.5 rounded font-extrabold uppercase">1. When Event Triggers</span>
                    <select
                      value={triggerEvent}
                      onChange={(e) => setTriggerEvent(e.target.value)}
                      className="w-full mt-2 px-2.5 py-1.5 bg-[#1D2024] border border-white/[0.06] text-xs text-white rounded-lg outline-none cursor-pointer"
                    >
                      <option value="task_completed">If Task Completed</option>
                      <option value="due_date_passed">If Due Date Passed</option>
                      <option value="sprint_completed">If Sprint Completed</option>
                    </select>
                  </div>

                  {/* Flow Arrow Connector */}
                  <div className="flex flex-col items-center justify-center text-white/30 font-extrabold text-xl py-2">
                    ➔
                  </div>

                  {/* Node B: Action Selection */}
                  <div className="bg-[#171A1D] border border-[#5BB98C]/30 p-4 rounded-xl space-y-2 text-left shadow-sm">
                    <span className="text-[9px] bg-[#5BB98C]/15 text-[#5BB98C] px-2 py-0.5 rounded font-extrabold uppercase">2. Execute Action</span>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="w-full mt-2 px-2.5 py-1.5 bg-[#1D2024] border border-white/[0.06] text-xs text-white rounded-lg outline-none cursor-pointer"
                    >
                      <option value="move_to_done">Move to Done</option>
                      <option value="notify_owner">Notify Owner</option>
                      <option value="archive_sprint">Archive Sprint</option>
                    </select>
                  </div>

                </div>

                {/* Form Controls */}
                <div className="flex flex-col md:flex-row gap-3 items-end">
                  <div className="flex-1 space-y-1 text-left">
                    <label className="text-[10px] font-bold text-[#A7ADB5] uppercase">Rule Description Label</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Done transition, Sprint Auto-Archive..."
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={createRuleMutation.isPending}
                    className="px-5 py-2.5 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md"
                  >
                    {createRuleMutation.isPending ? 'Saving...' : 'Add Rule'}
                  </button>
                </div>

              </form>
            </div>

            {/* Active Rules List */}
            <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 space-y-4 h-fit">
              <div>
                <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-[#5BB98C]" /> Rule Book ({rules.length})
                </h2>
                <p className="text-[10px] text-[#A7ADB5] mt-1">Manage active triggers and disable rules as needed.</p>
              </div>

              {loadingRules ? (
                <div className="flex justify-center py-6"><Loader className="h-5 w-5 text-[#5BB98C] animate-spin" /></div>
              ) : rules.length === 0 ? (
                <div className="border border-dashed border-white/[0.06] rounded-xl p-8 text-center text-xs text-[#7E848C] italic">
                  No automation rules created yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className="p-3 bg-[#1D2024]/80 border border-white/[0.04] rounded-xl hover:border-white/10 transition-all flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-left space-y-1">
                          <h4 className="text-xs font-bold text-white">{rule.name}</h4>
                          <p className="text-[9px] text-[#A7ADB5] font-mono">
                            {rule.trigger_event} ➔ {rule.action_type}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                          className="text-[#7E848C] hover:text-[#EB5757] p-1 rounded hover:bg-white/5"
                          title="Delete Rule"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/[0.04] pt-2">
                        <span className="text-[9px] text-[#7E848C]">Status</span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold ${rule.is_active ? 'text-[#5BB98C]' : 'text-[#7E848C]'}`}>
                            {rule.is_active ? 'Active' : 'Disabled'}
                          </span>
                          <input
                            type="checkbox"
                            checked={rule.is_active}
                            onChange={(e) => toggleRuleMutation.mutate({ id: rule.id, active: e.target.checked })}
                            className="rounded border-white/10 bg-[#1D2024] text-[#5BB98C] focus:ring-[#5BB98C] h-3.5 w-3.5 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </MainLayout>
  )
}
