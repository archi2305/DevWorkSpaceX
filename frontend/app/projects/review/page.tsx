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
      <div className="max-w-[1800px] w-full mx-auto space-y-8 text-left">
        {/* Banner */}
        <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-card/50 to-primary/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">AI Review & Optimization Center</h1>
              <p className="text-base text-muted-foreground">
                Run deep security audits, performance reviews, database indexing lookups, and scalability checks directly on your blueprint specs.
              </p>
            </div>
          </div>
          <button
            onClick={handleAudit}
            disabled={!blueprint || loading}
            className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Auditing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-primary-foreground" /> Run Quality Audit
              </>
            )}
          </button>
        </div>

        {loading ? (
          <DetailSkeleton />
        ) : report ? (
          /* Report Layout Dashboard */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Audit Review Report</h2>
                <p className="text-sm text-muted-foreground">Automatically synced to backend blueprints metadata.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveToBlueprint}
                  disabled={savedToBlueprint}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#09090b] border border-border text-xs text-foreground hover:bg-white/[0.02] transition-all font-bold cursor-pointer"
                >
                  <Save className="h-4 w-4" /> {savedToBlueprint ? 'Saved to Blueprint' : 'Save to Blueprint'}
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="h-4 w-4" /> Download Report
                </button>
              </div>
            </div>

            {/* Score cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-6">
              {Object.entries(report.scores).map(([key, val]) => {
                const isOverall = key === 'overall'
                return (
                  <div
                    key={key}
                    className={`h-[180px] p-6 rounded-2xl border flex flex-col items-center justify-center space-y-3 text-center transition-all glow-card ${
                      isOverall
                        ? 'border-primary/30 bg-primary/5 shadow shadow-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{key}</span>
                    <div className="relative flex items-center justify-center">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" className="stroke-white/5 fill-transparent" strokeWidth="6" />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          className={isOverall ? 'stroke-primary fill-transparent' : 'stroke-blue-500 fill-transparent'}
                          strokeWidth="6"
                          strokeDasharray={2 * Math.PI * 38}
                          strokeDashoffset={2 * Math.PI * 38 * (1 - val / 100)}
                        />
                      </svg>
                      <span className="absolute text-lg font-black text-foreground">{val}%</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary review details */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4 w-4" /> Overall Summary Assessment
              </span>
              <p className="text-base text-foreground leading-relaxed font-medium">{report.overall_summary}</p>
            </div>

            {/* Detailed categories tabs columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Category selectors list (35% / 4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Select Review Category</span>
                <div className="space-y-2">
                  {report.categories.map((cat, idx) => {
                    const isSel = activeCategoryIdx === idx
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveCategoryIdx(idx)}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all text-sm font-bold text-foreground cursor-pointer ${
                          isSel
                            ? 'border-primary bg-primary/5 shadow shadow-primary/5'
                            : 'border-border bg-card hover:bg-white/[0.01]'
                        }`}
                      >
                        <span>{cat.category}</span>
                        <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSel ? 'translate-x-1 text-primary' : ''}`} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* View detail column (65% / 8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="p-8 rounded-2xl border border-border bg-card space-y-6 min-h-[500px]">
                  <h3 className="text-lg font-bold text-foreground border-b border-border pb-3">
                    {report.categories[activeCategoryIdx].category}
                  </h3>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4.5 w-4.5" /> Identified Strengths
                      </h4>
                      <ul className="space-y-2.5">
                        {report.categories[activeCategoryIdx].strengths.map((str, sIdx) => (
                          <li key={sIdx} className="text-xs text-muted-foreground flex items-start gap-1.5 leading-normal font-medium">
                            <span className="text-emerald-500 font-bold shrink-0 text-base">•</span> {str}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-red-500 flex items-center gap-1.5">
                        <AlertTriangle className="h-4.5 w-4.5" /> Detected Weaknesses
                      </h4>
                      <ul className="space-y-2.5">
                        {report.categories[activeCategoryIdx].weaknesses.map((weak, wIdx) => (
                          <li key={wIdx} className="text-xs text-muted-foreground flex items-start gap-1.5 leading-normal font-medium">
                            <span className="text-red-500 font-bold shrink-0 text-base">•</span> {weak}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-4 pt-6 border-t border-border">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Actionable Recommendations</h4>
                    <div className="space-y-3">
                      {report.categories[activeCategoryIdx].recommendations.map((rec, rIdx) => {
                        const isHigh = rec.priority === 'HIGH'
                        const isMed = rec.priority === 'MEDIUM'
                        return (
                          <div key={rIdx} className="p-5 rounded-xl border border-border bg-white/[0.005] space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-sm font-bold text-foreground">{rec.title}</h5>
                              <span className={`text-[9px] font-bold uppercase rounded px-2.5 py-0.5 border ${
                                isHigh
                                  ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                  : isMed
                                  ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                  : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              }`}>
                                {rec.priority}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">{rec.description}</p>
                            
                            {rec.fix_snippet && (
                              <div className="rounded-lg border border-border bg-[#09090b] overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.01] border-b border-border">
                                  <span className="text-[8px] font-mono text-muted-foreground">Fix Snippet</span>
                                  <button
                                    onClick={() => handleCopySnippet(rec.fix_snippet!, rIdx)}
                                    className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                  >
                                    {copiedIndex === rIdx ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                                <pre className="p-3.5 text-[10px] text-emerald-400 font-mono overflow-x-auto text-left leading-relaxed">
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
          <div className="h-[400px] border border-dashed border-border bg-card/20 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3">
            <Shield className="h-12 w-12 text-muted-foreground animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Project Blueprint Quality Audit</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                {!blueprint
                  ? 'Generate a project plan blueprint in the architect menu before auditing specifications.'
                  : 'Start an analysis review report using the audit button to calculate architecture security and scalability ratings.'
                }
              </p>
            </div>
            {blueprint && (
              <button
                onClick={handleAudit}
                className="mt-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 text-xs cursor-pointer shadow-md transition-all"
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
