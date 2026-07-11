'use client'

import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import { reportService } from '@/services/report'
import { projectService } from '@/services/project'
import { teamService } from '@/services/team'
import { sprintService } from '@/services/sprint'
import { FileText, Download, CheckCircle, HelpCircle, Loader, BarChart3 } from 'lucide-react'

type ReportType = 'project' | 'sprint' | 'task' | 'team'
type ExportFormat = 'pdf' | 'excel' | 'csv'

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('project')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf')
  
  // Selection Scope Filters
  const [projectId, setProjectId] = useState('')
  const [sprintId, setSprintId] = useState('')
  const [userId, setUserId] = useState('')

  const [downloading, setDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  // Query projects for selectors
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects()
  })

  // Query workspace members for assignees selectors
  const { data: members = [] } = useQuery({
    queryKey: ['workspace-members'],
    queryFn: () => teamService.getWorkspaceMembers()
  })

  // Query sprints based on selected project
  const { data: sprints = [] } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintService.getSprints(projectId),
    enabled: !!projectId && (reportType === 'sprint' || reportType === 'task')
  })

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault()
    setDownloading(true)
    setDownloadSuccess(false)
    
    try {
      await reportService.downloadReport({
        type: reportType,
        format: exportFormat,
        project_id: projectId || undefined,
        sprint_id: sprintId || undefined,
        user_id: userId || undefined
      })
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to download report', err)
      alert('Failed to generate report export files.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6 text-left">
        
        {/* Header Title */}
        <div className="border-b border-white/[0.06] pb-5">
          <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#5BB98C]" /> Reports & Exporter
          </h1>
          <p className="text-xs text-[#A7ADB5] mt-1">Compile metrics summaries and download spreadsheet or print-ready deliverables files.</p>
        </div>

        {/* Action Panel Form */}
        <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/[0.04] pb-3">
            Compile Report Parameters
          </h2>

          <form onSubmit={handleDownload} className="space-y-6">
            
            {/* 1. Report Type Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block">Report Category</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {([
                  { key: 'project', label: 'Projects Status', desc: 'Active & finished milestones' },
                  { key: 'sprint', label: 'Sprints Stats', desc: 'Sprint goals & deliverables' },
                  { key: 'task', label: 'Tasks Log', desc: 'Deadlines & priorities log' },
                  { key: 'team', label: 'Team Workload', desc: 'Member action points count' }
                ] as const).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setReportType(t.key)
                      setProjectId('')
                      setSprintId('')
                      setUserId('')
                    }}
                    className={`p-4 rounded-xl border text-left space-y-1.5 transition-all cursor-pointer ${
                      reportType === t.key
                        ? 'bg-[#5BB98C]/10 border-[#5BB98C] text-[#5BB98C]'
                        : 'bg-[#1D2024] border-white/[0.04] text-[#A7ADB5] hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-bold">{t.label}</p>
                    <p className="text-[9px] opacity-75">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Optional Scoping Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Project selector (Project, Sprint, or Task type) */}
              {(reportType === 'project' || reportType === 'sprint' || reportType === 'task') && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block">Filter by Project (Optional)</label>
                  <select
                    value={projectId}
                    onChange={(e) => { setProjectId(e.target.value); setSprintId(''); }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-white outline-none cursor-pointer focus:border-[#5BB98C]"
                  >
                    <option value="">All Projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sprint selector (Sprint or Task type) */}
              {(reportType === 'sprint' || reportType === 'task') && projectId && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block">Filter by Sprint (Optional)</label>
                  <select
                    value={sprintId}
                    onChange={(e) => setSprintId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-white outline-none cursor-pointer focus:border-[#5BB98C]"
                  >
                    <option value="">All Project Sprints</option>
                    {sprints.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Assignee selector (Task type only) */}
              {reportType === 'task' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block">Filter by Assignee (Optional)</label>
                  <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-white outline-none cursor-pointer focus:border-[#5BB98C]"
                  >
                    <option value="">All Assignees</option>
                    {members.map((m) => (
                      <option key={m.user.id} value={m.user.id}>{m.user.full_name}</option>
                    ))}
                  </select>
                </div>
              )}

            </div>

            {/* 3. Export File Format Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block">Export File Format</label>
              <div className="flex gap-3">
                {([
                  { key: 'pdf', label: 'PDF Document', desc: 'Print-ready vector PDF' },
                  { key: 'excel', label: 'Excel Spreadsheet', desc: 'Spreadsheet layout' },
                  { key: 'csv', label: 'Comma-Separated Values', desc: 'Standard data CSV' }
                ] as const).map((fmt) => (
                  <button
                    key={fmt.key}
                    type="button"
                    onClick={() => setExportFormat(fmt.key)}
                    className={`flex-1 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      exportFormat === fmt.key
                        ? 'bg-[#5BB98C]/15 border-[#5BB98C] text-[#5BB98C]'
                        : 'bg-[#1D2024] border-white/[0.04] text-[#A7ADB5] hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-bold">{fmt.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/[0.04]">
              <button
                type="submit"
                disabled={downloading}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-xs font-bold text-[#111315] shadow-lg shadow-[#5BB98C]/10 transition-all cursor-pointer disabled:opacity-5"
              >
                {downloading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Export Report
                  </>
                )}
              </button>

              {downloadSuccess && (
                <span className="text-xs font-semibold text-[#5BB98C] flex items-center gap-1.5 animate-pulse">
                  <CheckCircle className="h-4 w-4" /> Download started successfully!
                </span>
              )}
            </div>

          </form>
        </div>

      </div>
    </MainLayout>
  )
}
