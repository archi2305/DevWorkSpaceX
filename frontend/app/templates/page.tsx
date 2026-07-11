'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import { projectService } from '@/services/project'
import {
  Copy,
  Layers,
  Loader,
  Plus,
  Trash2,
  FolderOpen,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  Save,
  Rocket
} from 'lucide-react'

export default function TemplatesPage() {
  const queryClient = useQueryClient()
  
  // Custom dialog inputs
  const [duplicateTargetId, setDuplicateTargetId] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [isTemplateSpawn, setIsTemplateSpawn] = useState(false)

  // Load Projects
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects()
  })

  // Load Templates
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['project-templates'],
    queryFn: () => projectService.getTemplates()
  })

  // Mutations
  const duplicateProjectMutation = useMutation({
    mutationFn: (data: { id: string; name: string }) =>
      projectService.duplicateProject(data.id, data.name),
    onSuccess: () => {
      setDuplicateTargetId(null)
      setNewProjectName('')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project-templates'] })
      alert('Project duplicated successfully!')
    }
  })

  const toggleTemplateMutation = useMutation({
    mutationFn: (data: { id: string; isTemplate: boolean }) =>
      projectService.saveAsTemplate(data.id, data.isTemplate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project-templates'] })
    }
  })

  const handleDuplicateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!duplicateTargetId || !newProjectName.trim()) return
    duplicateProjectMutation.mutate({ id: duplicateTargetId, name: newProjectName })
  }

  const activeProjects = projects.filter(p => !p.is_template)

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        
        {/* Header Block */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <Copy className="h-6 w-6 text-[#5BB98C]" /> Project Templates & Duplication
            </h1>
            <p className="text-xs text-[#A7ADB5] mt-1">Convert active workspaces into templates or clone them with Sprints, Releases, and Tasks.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section A: Reusable Project Templates */}
          <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Rocket className="h-4 w-4 text-[#5BB98C]" /> Reusable Templates ({templates.length})
              </h2>
              <p className="text-[10px] text-[#A7ADB5] mt-1">Initialize projects rapidly using predefined sprint targets and schedules.</p>
            </div>

            {loadingTemplates ? (
              <div className="flex justify-center py-6"><Loader className="h-6 w-6 text-[#5BB98C] animate-spin" /></div>
            ) : templates.length === 0 ? (
              <div className="border border-dashed border-white/[0.06] rounded-xl p-8 text-center text-xs text-[#7E848C] italic">
                No projects saved as templates yet. Mark an active project below as template.
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="p-4 bg-[#1D2024]/80 border border-white/[0.04] rounded-xl hover:border-white/10 transition-all flex items-center justify-between gap-3">
                    <div className="text-left space-y-1">
                      <h4 className="text-xs font-bold text-white">{tpl.name}</h4>
                      <p className="text-[10px] text-[#A7ADB5]">{tpl.description || 'No template description'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setDuplicateTargetId(tpl.id)
                          setNewProjectName(`${tpl.name} Instance`)
                          setIsTemplateSpawn(true)
                        }}
                        className="px-3 py-1.5 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-extrabold rounded-lg text-[10px] transition-colors cursor-pointer"
                      >
                        Spawn Project
                      </button>
                      <button
                        onClick={() => toggleTemplateMutation.mutate({ id: tpl.id, isTemplate: false })}
                        className="p-1.5 rounded hover:bg-white/5 text-[#7E848C] hover:text-[#EB5757]"
                        title="Remove Template Status"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Active Projects List & Cloners */}
          <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#5BB98C]" /> Active Workspaces
              </h2>
              <p className="text-[10px] text-[#A7ADB5] mt-1">Duplicate project layouts or save them as reusable blueprint structures.</p>
            </div>

            {loadingProjects ? (
              <div className="flex justify-center py-6"><Loader className="h-6 w-6 text-[#5BB98C] animate-spin" /></div>
            ) : activeProjects.length === 0 ? (
              <div className="text-center text-xs text-[#7E848C] italic">No active projects stored.</div>
            ) : (
              <div className="space-y-3">
                {activeProjects.map((proj) => (
                  <div key={proj.id} className="p-4 bg-[#1D2024]/80 border border-white/[0.04] rounded-xl hover:border-white/10 transition-all flex items-center justify-between gap-3">
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-white">{proj.name}</h4>
                      <p className="text-[10px] text-[#7E848C]">Status: {proj.status} • Tasks: {proj.progress}%</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setDuplicateTargetId(proj.id)
                          setNewProjectName(`${proj.name} Copy`)
                          setIsTemplateSpawn(false)
                        }}
                        className="px-2.5 py-1.5 border border-white/[0.06] hover:bg-[#1D2024] text-white font-semibold rounded-lg text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Copy className="h-3 w-3" /> Duplicate
                      </button>
                      <button
                        onClick={() => toggleTemplateMutation.mutate({ id: proj.id, isTemplate: true })}
                        className="px-2.5 py-1.5 bg-[#5BB98C]/10 border border-[#5BB98C]/25 hover:bg-[#5BB98C]/20 text-[#5BB98C] font-semibold rounded-lg text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Save as Template"
                      >
                        <Save className="h-3 w-3" /> Save as Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Duplicate / Spawn Modal */}
      {duplicateTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-left">
          <div className="w-full max-w-md bg-[#171A1D] border border-white/[0.06] rounded-2xl p-6 relative">
            <h3 className="text-base font-bold text-white mb-2">
              {isTemplateSpawn ? 'Spawn Project from Template' : 'Duplicate Project'}
            </h3>
            <p className="text-[11px] text-[#A7ADB5] mb-4">
              This will copy the project details, sprints, milestones, releases, and tasks recursively.
            </p>
            
            <form onSubmit={handleDuplicateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A7ADB5] uppercase">New Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Sprint Spec instance"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setDuplicateTargetId(null)}
                  className="px-4 py-2 border border-white/[0.06] hover:bg-[#23272B] text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={duplicateProjectMutation.isPending}
                  className="px-4 py-2 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold rounded-xl text-xs cursor-pointer"
                >
                  {duplicateProjectMutation.isPending ? 'Duplicating...' : 'Duplicate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
