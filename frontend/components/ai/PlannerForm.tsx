'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

interface PlannerFormProps {
  prompt: string
  setPrompt: (val: string) => void
  projectType: string
  setProjectType: (val: string) => void
  difficulty: string
  setDifficulty: (val: string) => void
  timeline: string
  setTimeline: (val: string) => void
  techStackInput: string
  setTechStackInput: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
}

export function PlannerForm({
  prompt,
  setPrompt,
  projectType,
  setProjectType,
  difficulty,
  setDifficulty,
  timeline,
  setTimeline,
  techStackInput,
  setTechStackInput,
  onSubmit,
  loading
}: PlannerFormProps) {
  return (
    <div className="rounded-2xl border border-white/5 bg-card/20 p-6 backdrop-blur-xl">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Idea */}
          <div className="lg:col-span-2 space-y-2 text-left">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Describe your project concept:</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Build a project management platform like Jira with AI assistance"
              disabled={loading}
              className="w-full h-32 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] focus:border-primary/50 text-sm text-white outline-none resize-none placeholder-[#52525b] transition-all disabled:opacity-50"
              required
            />
          </div>

          {/* Right Column: Settings */}
          <div className="space-y-4 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Type</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#09090b] text-xs text-white outline-none cursor-pointer hover:bg-white/[0.02] disabled:opacity-50"
                >
                  <option value="Web Application">Web App</option>
                  <option value="Mobile Application">Mobile App</option>
                  <option value="API Service">API Service</option>
                  <option value="Desktop Application">Desktop App</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#09090b] text-xs text-white outline-none cursor-pointer hover:bg-white/[0.02] disabled:opacity-50"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timeline</label>
                <select
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#09090b] text-xs text-white outline-none cursor-pointer hover:bg-white/[0.02] disabled:opacity-50"
                >
                  <option value="1 Week">1 Week</option>
                  <option value="1 Month">1 Month</option>
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preferred Stack</label>
                <input
                  type="text"
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  placeholder="e.g. Next.js, Go, MySQL"
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.01] text-xs text-white outline-none placeholder-[#52525b] disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button: Aligned right, 48px high, rounded-xl, high contrast */}
        <div className="flex justify-end pt-4 border-t border-white/5">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 active:scale-95 focus:ring-2 focus:ring-primary/50 focus:outline-none text-black font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-primary/10"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Generating Complete Blueprint...
              </>
            ) : (
              <>
                <Sparkles className="h-4.5 w-4.5" /> Generate Blueprint
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
