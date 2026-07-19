'use client'

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Shield,
  Play,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Database,
  Code,
  FileCode,
  Terminal,
  Activity,
  ArrowRight,
  Save,
  HelpCircle
} from 'lucide-react'
import { generateReview, updateBlueprint, getBlueprintDetail, ReviewResponse } from '@/services/ai'
import { DetailSkeleton } from '@/components/ui/Skeleton'

export default function ReviewPage() {
  const [blueprint, setBlueprint] = useState<any>(null)
  const [blueprintId, setBlueprintId] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<ReviewResponse | null>(null)
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0)
  
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedReport, setCopiedReport] = useState(false)
  const [savedToBlueprint, setSavedToBlueprint] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('devworkspace_active_blueprint')
    const savedId = localStorage.getItem('devworkspace_active_blueprint_id')
    if (saved) {
      setBlueprint(JSON.parse(saved))
    }
    if (savedId) {
      setBlueprintId(savedId)
      // Check if existing review report is saved in blueprint
      loadSavedReport(savedId)
    }
  }, [])

  const loadSavedReport = async (id: string) => {
    try {
      const details = await getBlueprintDetail(id)
      if (details.metadata_info?.audit_review) {
        setReport(details.metadata_info.audit_review)
      }
    } catch (err) {
      console.error('Failed to load saved report details', err)
    }
  }

  const handleAudit = async () => {
    if (!blueprint) return
    setLoading(true)
    setReport(null)
    setSavedToBlueprint(false)
    try {
      const res = await generateReview({ project_context: blueprint })
      setReport(res)
      
      // Auto save to database blueprint if ID exists
      if (blueprintId) {
        await updateBlueprint(blueprintId, {
          metadata_info: {
            audit_review: res
          }
        })
        setSavedToBlueprint(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToBlueprint = async () => {
    if (!blueprintId || !report) return
    try {
      await updateBlueprint(blueprintId, {
        metadata_info: {
          audit_review: report
        }
      })
      setSavedToBlueprint(true)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCopySnippet = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(idx)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDownloadMarkdown = () => {
    if (!report) return
    let md = `# Architecture & Code Quality Review Report\n\n`
    md += `**Overall Score**: ${report.scores.overall}/100\n\n`
    md += `## Scores Summary\n`
    Object.entries(report.scores).forEach(([cat, val]) => {
      md += `- **${cat.toUpperCase()}**: ${val}/100\n`
    })
    md += `\n## Overall Summary\n${report.overall_summary}\n\n`
    
    report.categories.forEach((cat) => {
      md += `## ${cat.category}\n\n`
      md += `### Strengths\n`
      cat.strengths.forEach(s => { md += `- ${s}\n` })
      md += `\n### Weaknesses\n`
      cat.weaknesses.forEach(w => { md += `- ${w}\n` })
      md += `\n### Recommendations\n`
      cat.recommendations.forEach(r => {
        md += `#### [${r.priority}] ${r.title}\n`
        md += `${r.description}\n`
        if (r.fix_snippet) {
          md += `\`\`\`\n${r.fix_snippet}\n\`\`\`\n`
        }
        md += `\n`
      })
    })

    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(md)
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `${blueprint?.project_plan?.title || 'blueprint'}_quality_review.md`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner banner */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-primary/10 via-card/50 to-primary/5 p-6 md:p-8 flex items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white">AI Review & Optimization Center</h1>
              <p className="text-sm text-muted-foreground">
                Run deep security audits, performance reviews, database indexing lookups, and scalability checks directly on your blueprint specs.
              </p>
            </div>
          </div>
          <button
            onClick={handleAudit}
            disabled={!blueprint || loading}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Auditing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-black" /> Run Quality Audit
              </>
            )}
          </button>
        </div>

        {loading ? (
          <DetailSkeleton />
        ) : report ? (
          /* Report Layout Dashboard */
          <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Audit Review Report</span>
                <p className="text-xs text-muted-foreground">Automatically synced to backend blueprints metadata.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToBlueprint}
                  disabled={savedToBlueprint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-white border border-white/10 transition-all font-bold cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" /> {savedToBlueprint ? 'Saved to Blueprint' : 'Save to Blueprint'}
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Download Report
                </button>
              </div>
            </div>

            {/* Score cards grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(report.scores).map(([key, val]) => {
                const isOverall = key === 'overall'
                return (
                  <div
                    key={key}
                    className={`p-5 rounded-2xl border flex flex-col items-center justify-center space-y-2 text-center ${
                      isOverall
                        ? 'border-primary/30 bg-primary/5 shadow shadow-primary/5'
                        : 'border-white/5 bg-white/[0.01]'
                    }`}
                  >
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{key}</span>
                    <div className="relative flex items-center justify-center">
                      {/* Circular Progress Bar overlay */}
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="28" className="stroke-white/5 fill-transparent" strokeWidth="4" />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          className={isOverall ? 'stroke-primary fill-transparent' : 'stroke-blue-400 fill-transparent'}
                          strokeWidth="4"
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={2 * Math.PI * 28 * (1 - val / 100)}
                        />
                      </svg>
                      <span className="absolute text-sm font-black text-white">{val}%</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary review details */}
            <div className="p-5 rounded-2xl border border-white/5 bg-[#0d0d0e]/60 space-y-2">
              <span className="text-[10px] font-bold text-primary uppercase flex items-center gap-1">
                <Award className="h-3.5 w-3.5" /> Overall Summary Assessment
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">{report.overall_summary}</p>
            </div>

            {/* Detailed categories tabs columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Category selectors list */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Select Review Category</span>
                <div className="space-y-2">
                  {report.categories.map((cat, idx) => {
                    const isSel = activeCategoryIdx === idx
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveCategoryIdx(idx)}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all text-left cursor-pointer ${
                          isSel
                            ? 'border-primary bg-primary/5 shadow shadow-primary/5'
                            : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.02]'
                        }`}
                      >
                        <span className="text-xs font-bold text-white">{cat.category}</span>
                        <ArrowRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isSel ? 'translate-x-1 text-primary' : ''}`} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* View detail column */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 rounded-2xl border border-white/5 bg-[#0d0d0e]/80 space-y-6">
                  <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3">
                    {report.categories[activeCategoryIdx].category}
                  </h3>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> Identified Strengths
                      </h4>
                      <ul className="space-y-2">
                        {report.categories[activeCategoryIdx].strengths.map((str, sIdx) => (
                          <li key={sIdx} className="text-xs text-muted-foreground flex items-start gap-1.5 leading-tight">
                            <span className="text-emerald-400 font-bold shrink-0">•</span> {str}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" /> Detected Weaknesses
                      </h4>
                      <ul className="space-y-2">
                        {report.categories[activeCategoryIdx].weaknesses.map((weak, wIdx) => (
                          <li key={wIdx} className="text-xs text-muted-foreground flex items-start gap-1.5 leading-tight">
                            <span className="text-red-400 font-bold shrink-0">•</span> {weak}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Actionable Recommendations</h4>
                    <div className="space-y-3">
                      {report.categories[activeCategoryIdx].recommendations.map((rec, rIdx) => {
                        const isHigh = rec.priority === 'HIGH'
                        const isMed = rec.priority === 'MEDIUM'
                        return (
                          <div key={rIdx} className="p-4 rounded-xl border border-white/5 bg-white/[0.005] space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-xs font-bold text-white">{rec.title}</h5>
                              <span className={`text-[8px] font-bold uppercase rounded px-2 py-0.5 ${
                                isHigh
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : isMed
                                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}>
                                {rec.priority}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-normal">{rec.description}</p>
                            
                            {rec.fix_snippet && (
                              <div className="rounded-lg border border-white/5 bg-[#09090b] overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.01] border-b border-white/5">
                                  <span className="text-[8px] font-mono text-muted-foreground">Fix Snippet</span>
                                  <button
                                    onClick={() => handleCopySnippet(rec.fix_snippet!, rIdx)}
                                    className="p-1 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                                  >
                                    {copiedIndex === rIdx ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                                  </button>
                                </div>
                                <pre className="p-3 text-[10px] text-emerald-400 font-mono overflow-x-auto text-left leading-relaxed">
                                  {rec.fix_snippet}
                                </pre>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="h-[400px] border border-dashed border-white/10 bg-white/[0.005] rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3">
            <Shield className="h-10 w-10 text-muted-foreground animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Project Blueprint Quality Audit</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {!blueprint
                  ? 'Generate a project plan blueprint in the architect menu before auditing specifications.'
                  : 'Start an analysis review report using the audit button to calculate architecture security and scalability ratings.'
                }
              </p>
            </div>
            {blueprint && (
              <button
                onClick={handleAudit}
                className="mt-2 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold px-4 py-2 text-xs cursor-pointer shadow-md transition-all"
              >
                Start Architecture Audit
              </button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
