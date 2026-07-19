'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Layers,
  Code,
  Terminal,
  MessageSquare,
  Sparkles,
  Folder,
  ArrowRight,
  Activity,
  Compass,
  ArrowUpRight,
  Search,
  Bell,
  CheckCircle,
  TrendingUp,
  Cpu
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { listBlueprints, aiService, BlueprintResponseSchema, AIConversation } from '@/services/ai'
import { projectService } from '@/services/project'
import { activityService } from '@/services/activity'

export default function Page() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Data states
  const [blueprints, setBlueprints] = useState<BlueprintResponseSchema[]>([])
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [projectsCount, setProjectsCount] = useState(0)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [commandQuery, setCommandQuery] = useState('')

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    if (!user) return

    const loadDashboardData = async () => {
      try {
        const bps = await listBlueprints()
        setBlueprints(bps)

        const convs = await aiService.getConversations()
        setConversations(convs)

        const projs = await projectService.getProjects()
        setProjectsCount(projs?.length || 0)

        const logs = await activityService.getActivities()
        setActivities(logs?.slice(0, 5) || [])
      } catch (err) {
        console.error('Failed to load dashboard statistics', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  // Calculate statistics
  const blueprintsCount = blueprints.length
  const conversationsCount = conversations.length
  
  const totalModules = blueprints.reduce((sum, bp) => sum + (bp.generated_code?.length || 0), 0)
  
  const totalLinesOfCode = blueprints.reduce((sum, bp) => {
    const codeList = bp.generated_code || []
    return sum + codeList.reduce((acc, file) => acc + (file.content || '').split('\n').length, 0)
  }, 0)

  const recentFiles = blueprints.reduce<any[]>((acc, bp) => {
    const files = bp.generated_code || []
    return [...acc, ...files.map(f => ({ ...f, projectTitle: bp.title, blueprintId: bp.id }))]
  }, []).slice(0, 3)

  const handleOpenBlueprint = (bp: BlueprintResponseSchema, redirectPath: string) => {
    const combinedBlueprint = {
      project_plan: bp.overview,
      milestone_plan: bp.milestones,
      database_design: bp.database_design,
      api_design: bp.api_design,
      architecture: bp.architecture
    }
    localStorage.setItem('devworkspace_active_blueprint', JSON.stringify(combinedBlueprint))
    localStorage.setItem('devworkspace_active_blueprint_id', bp.id)
    router.push(redirectPath)
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 relative z-10 text-left">
        {/* Welcome message & Notification Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight select-none">
              {greeting}, {user?.full_name || 'Developer'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Here is your AI software engineering workspace review.
            </p>
          </div>
          
          {/* Subtle live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-bold text-primary animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            AI Core Active
          </div>
        </div>

        {/* AI Command Bar / Quick Search */}
        <div className="rounded-2xl border border-border bg-card p-2 flex items-center gap-3 shadow-sm glow-card">
          <Search className="h-5 w-5 text-muted-foreground ml-3 shrink-0" />
          <input
            type="text"
            value={commandQuery}
            onChange={(e) => setCommandQuery(e.target.value)}
            placeholder="Ask AI to design a database, write routes, or audit architecture..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none py-2"
          />
          <button
            onClick={() => router.push(`/projects/ai-planner?prompt=${encodeURIComponent(commandQuery)}`)}
            className="flex items-center gap-1.5 px-4 h-9 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" /> Prompt AI
          </button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Active Projects', val: projectsCount, icon: Folder, color: 'text-blue-500 bg-blue-500/10' },
            { label: 'Blueprints Saved', val: blueprintsCount, icon: Layers, color: 'text-emerald-500 bg-emerald-500/10' },
            { label: 'Modules Compiled', val: totalModules, icon: Terminal, color: 'text-amber-500 bg-amber-500/10' },
            { label: 'Generated Lines', val: totalLinesOfCode, icon: Code, color: 'text-purple-500 bg-purple-500/10' },
            { label: 'AI Conversations', val: conversationsCount, icon: MessageSquare, color: 'text-pink-500 bg-pink-500/10' }
          ].map((stat, idx) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-5 rounded-2xl border border-border bg-card space-y-4 hover:shadow-md hover:border-primary/20 transition-all glow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                  <div className={`p-1.5 rounded-lg ${stat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-foreground">{stat.val}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Dashboard Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left / Center Sections */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Recent Blueprints list */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Layers className="h-4.5 w-4.5 text-primary" /> Saved Architect Blueprints
                </h2>
                <button
                  onClick={() => router.push('/projects/blueprints')}
                  className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  View Library <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blueprints.slice(0, 4).map((bp, idx) => {
                  const isDraft = bp.status === 'Draft'
                  return (
                    <motion.div
                      key={bp.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between space-y-4 hover:border-primary/20 transition-all glow-card"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-foreground truncate">{bp.title}</h3>
                          <span className={`text-[8px] font-bold uppercase rounded px-2 py-0.5 border ${
                            isDraft 
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}>
                            {bp.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{bp.description || 'No description provided.'}</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] border-t border-border pt-3">
                        <span className="text-muted-foreground">{bp.generated_code?.length || 0} Modules generated</span>
                        <button
                          onClick={() => handleOpenBlueprint(bp, '/projects/ai-planner')}
                          className="text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          Open Workspace <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
                {blueprints.length === 0 && (
                  <div className="col-span-2 p-8 rounded-2xl border border-dashed border-border bg-card/20 text-center flex flex-col items-center justify-center space-y-2">
                    <span className="text-xs text-muted-foreground">No blueprints created yet.</span>
                    <button
                      onClick={() => router.push('/projects/ai-planner')}
                      className="text-xs text-primary hover:underline font-bold cursor-pointer"
                    >
                      Generate Blueprint
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Generated Code Modules */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Code className="h-4.5 w-4.5 text-purple-500" /> Compiled Software Modules
              </h2>
              <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border shadow-sm">
                {recentFiles.map((file, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Terminal className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-bold text-foreground truncate">{file.filename}</p>
                        <p className="text-[10px] text-muted-foreground truncate">Blueprint context: {file.projectTitle}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/projects/code-generator')}
                      className="flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer shrink-0"
                    >
                      Open Code <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {recentFiles.length === 0 && (
                  <p className="p-6 text-xs text-muted-foreground text-center">No compiled software modules in history yet.</p>
                )}
              </div>
            </div>

          </div>

          {/* Right sidebar Column */}
          <div className="space-y-6">
            
            {/* Quick Actions Panel */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Quick Shortcuts</h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-foreground">
                <button
                  onClick={() => router.push('/projects/ai-planner')}
                  className="p-3 rounded-xl border border-border bg-white/[0.01] hover:bg-white/[0.02] hover:border-primary/20 text-center transition-all cursor-pointer"
                >
                  Planner
                </button>
                <button
                  onClick={() => router.push('/projects/code-generator')}
                  className="p-3 rounded-xl border border-border bg-white/[0.01] hover:bg-white/[0.02] hover:border-primary/20 text-center transition-all cursor-pointer"
                >
                  Code Gen
                </button>
                <button
                  onClick={() => router.push('/projects/review')}
                  className="p-3 rounded-xl border border-border bg-white/[0.01] hover:bg-white/[0.02] hover:border-primary/20 text-center transition-all cursor-pointer"
                >
                  Review
                </button>
                <button
                  onClick={() => router.push('/documentation')}
                  className="p-3 rounded-xl border border-border bg-white/[0.01] hover:bg-white/[0.02] hover:border-primary/20 text-center transition-all cursor-pointer"
                >
                  Docs
                </button>
              </div>
            </div>

            {/* AI Assistant Chats */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-pink-500" /> Recent AI Conversations
              </h2>
              <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                {conversations.slice(0, 3).map((convo) => (
                  <div key={convo.id} className="p-4 hover:bg-white/[0.01] transition-colors flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{convo.title}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(convo.created_at).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => router.push('/projects/ai-planner')}
                      className="text-[10px] text-muted-foreground hover:text-foreground border border-border px-2.5 py-1.5 rounded-lg cursor-pointer"
                    >
                      Resume
                    </button>
                  </div>
                ))}
                {conversations.length === 0 && (
                  <p className="p-6 text-xs text-muted-foreground text-center">No active chat sessions.</p>
                )}
              </div>
            </div>

            {/* Activities Logs list */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-blue-500" /> Workspace Activity
              </h2>
              <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                {activities.map((act) => (
                  <div key={act.id} className="p-4 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="font-bold uppercase text-primary">{act.category}</span>
                      <span>{new Date(act.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-foreground font-medium">{act.action}</p>
                    <p className="text-[10px] text-muted-foreground">{act.details}</p>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="p-6 text-xs text-muted-foreground text-center">No logs recorded.</p>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </MainLayout>
  )
}
