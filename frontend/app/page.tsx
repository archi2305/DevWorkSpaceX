'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Layers,
  Code,
  Terminal,
  Zap,
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
  Cpu,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  Settings,
  HelpCircle,
  Clock,
  User,
  Users,
  CheckSquare,
  Calendar,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { listBlueprints, BlueprintResponseSchema } from '@/services/ai'

export default function Page() {
  const { user } = useAuth()
  const router = useRouter()
  const [commandQuery, setCommandQuery] = useState('')
  const [blueprints, setBlueprints] = useState<BlueprintResponseSchema[]>([])

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    loadBlueprints()
  }, [])

  const loadBlueprints = async () => {
    try {
      const bps = await listBlueprints()
      setBlueprints(bps)
    } catch (e) {
      console.error(e)
    }
  }

  // Sample static projects matching reference image
  const projects = [
    { name: 'E-Commerce Platform', status: 'In Progress', progress: 65, avatars: ['AD', 'JD', '+1'], statusColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { name: 'Mobile App Redesign', status: 'In Progress', progress: 42, avatars: ['AF', 'ES'], statusColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { name: 'Design System v2', status: 'Review', progress: 88, avatars: ['AF', 'MC', '+2'], statusColor: 'bg-primary/10 text-primary border-primary/20' },
    { name: 'API Documentation', status: 'In Progress', progress: 15, avatars: ['JD'], statusColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' }
  ]

  // Upcoming Tasks matching reference image
  const tasks = [
    { title: 'Review API documentation', priority: 'high', due: 'Today', assignee: 'You', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    { title: 'Update design system components', priority: 'high', due: 'Tomorrow', assignee: 'Sarah Chen', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    { title: 'Fix mobile responsiveness issues', priority: 'medium', due: 'Mar 15', assignee: 'You', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { title: 'Prepare Q1 roadmap presentation', priority: 'medium', due: 'Mar 18', assignee: 'Team Lead', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { title: 'Conduct user research interviews', priority: 'low', due: 'Mar 20', assignee: 'You', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' }
  ]

  // Recent activity matching reference image
  const activities = [
    { title: 'Created project milestone', desc: 'Milestone v1.2.0 added to E-Commerce Platform', time: '2 hours ago', icon: FileText, color: 'text-emerald-500 bg-emerald-500/10' },
    { title: 'New comment on design proposal', desc: 'Sarah commented on your design mockups', time: '4 hours ago', icon: MessageSquare, color: 'text-blue-500 bg-blue-500/10' },
    { title: 'Team member invited', desc: 'John Doe was added to your workspace', time: '1 day ago', icon: Users, color: 'text-purple-500 bg-purple-500/10' },
    { title: 'Code pushed to main branch', desc: 'API improvements in E-Commerce Platform', time: '2 days ago', icon: Code, color: 'text-indigo-500 bg-indigo-500/10' },
    { title: 'Performance improvements deployed', desc: 'Database query optimizations go live', time: '3 days ago', icon: Zap, color: 'text-yellow-500 bg-yellow-500/10' }
  ]

  const handleOpenBlueprint = (bp: BlueprintResponseSchema) => {
    const combinedBlueprint = {
      project_plan: bp.overview,
      milestone_plan: bp.milestones,
      database_design: bp.database_design,
      api_design: bp.api_design,
      architecture: bp.architecture
    }
    localStorage.setItem('devworkspace_active_blueprint', JSON.stringify(combinedBlueprint))
    localStorage.setItem('devworkspace_active_blueprint_id', bp.id)
    router.push('/projects/ai-planner')
  }

  return (
    <MainLayout>
      <div className="max-w-[1800px] w-full mx-auto space-y-8 text-left relative z-10 font-sans">
        
        {/* Welcome message header */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight select-none">
            {greeting}, {user?.full_name?.split(' ')[0] || 'Archi'} 👋
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Welcome back. Here&apos;s what&apos;s happening in your workspace.
          </p>
        </div>

        {/* Dynamic AI Input bar */}
        <div className="space-y-3">
          <div className="rounded-full border border-border bg-card p-2 flex items-center gap-3 shadow-sm hover:shadow-md transition-all glow-card">
            <Sparkles className="h-5 w-5 text-primary ml-3 shrink-0" />
            <input
              type="text"
              value={commandQuery}
              onChange={(e) => setCommandQuery(e.target.value)}
              placeholder="Ask AI to help you..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none py-2"
            />
            <button
              onClick={() => router.push(`/projects/ai-planner?prompt=${encodeURIComponent(commandQuery)}`)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary hover:bg-primary/95 text-primary-foreground transition-all cursor-pointer"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold text-foreground">
            {[
              { label: 'Create new project', prompt: 'Design a web platform for task tracking' },
              { label: 'Review pull requests', prompt: 'Audit standard API structure' },
              { label: 'Check team updates', prompt: 'Provide project milestone logs' }
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => setCommandQuery(chip.prompt)}
                className="px-4 py-2 rounded-full border border-border bg-card hover:bg-white/[0.01] transition-all cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Continue where you left off row */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-foreground">Continue Where You Left Off</h2>
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {projects.map((proj, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-border bg-card space-y-4 flex flex-col justify-between hover:border-primary/20 transition-all glow-card shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-foreground truncate">{proj.name}</h3>
                    <span className={`text-[9px] font-bold uppercase rounded-full px-2.5 py-0.5 border shrink-0 ${proj.statusColor}`}>
                      {proj.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block">Assigned to you</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-foreground">
                    <span className="text-muted-foreground">PROGRESS</span>
                    <span>{proj.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${proj.progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {proj.avatars.map((av, avIdx) => (
                      <div
                        key={avIdx}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary border border-border text-[8px] font-bold text-muted-foreground"
                      >
                        {av}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push('/projects/code-generator')}
                    className="px-3 py-1 rounded-lg border border-border bg-white/[0.01] hover:bg-white/[0.02] text-[10px] font-bold text-foreground transition-all cursor-pointer"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (span 6) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* AI Suggestions Card */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-foreground">AI Suggestions</h3>
                  <p className="text-[10px] text-muted-foreground">Smart recommendations for your workspace</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-border bg-white/[0.005] flex items-center justify-between gap-4">
                  <div className="space-y-1 text-left min-w-0">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500" /> Optimize Database Queries
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-primary/20 bg-primary/10 text-primary">Review</span>
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-normal truncate">Your recent queries could benefit from indexing. I found 3 slow queries.</p>
                  </div>
                  <button
                    onClick={() => router.push('/projects/review')}
                    className="px-3 py-1.5 rounded-lg border border-border hover:bg-white/5 text-[10px] font-bold text-foreground transition-all shrink-0 cursor-pointer"
                  >
                    Review
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-border bg-white/[0.005] flex items-center justify-between gap-4">
                  <div className="space-y-1 text-left min-w-0">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Folder className="h-3.5 w-3.5 text-blue-500" /> Update Dependencies
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-border bg-white/5 text-muted-foreground">Update</span>
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-normal truncate">New versions available for 5 packages. Security updates included.</p>
                  </div>
                  <button
                    onClick={() => router.push('/projects/code-generator')}
                    className="px-3 py-1.5 rounded-lg border border-border hover:bg-white/5 text-[10px] font-bold text-foreground transition-all shrink-0 cursor-pointer"
                  >
                    Update
                  </button>
                </div>
              </div>

              <button
                onClick={() => router.push('/projects/review')}
                className="w-full py-2.5 rounded-xl border border-border hover:bg-white/5 text-xs font-bold text-foreground transition-all cursor-pointer"
              >
                View all suggestions
              </button>
            </div>

            {/* Recent Workspace Activity */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-foreground">Recent Workspace Activity</h3>
              <div className="space-y-4">
                {activities.map((act, idx) => {
                  const Icon = act.icon
                  return (
                    <div key={idx} className="flex items-start gap-4">
                      <div className={`p-2 rounded-full shrink-0 ${act.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 text-left min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-foreground truncate">{act.title}</h4>
                          <span className="text-[9px] text-muted-foreground shrink-0">{act.time}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{act.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Team Activity list */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-foreground">Team Activity</h3>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#7E848C] uppercase tracking-wider block">Team Members</span>
                <div className="flex items-center gap-1.5">
                  {['AR', 'SL', 'JD', 'MC', 'DJ', 'ES'].map((m) => (
                    <div key={m} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1D2024] border border-white/[0.06] text-[9px] font-bold text-[#F5F5F5]">
                      {m}
                    </div>
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-1.5">6 members online</span>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-muted-foreground"><strong className="text-foreground">Sarah Lee</strong> updated Design System</span>
                  <span className="text-[9px] text-muted-foreground">5 min ago</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-muted-foreground"><strong className="text-foreground">John Doe</strong> reviewed API Documentation</span>
                  <span className="text-[9px] text-muted-foreground">23 min ago</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-muted-foreground"><strong className="text-foreground">Maria Chen</strong> completed Mobile Components</span>
                  <span className="text-[9px] text-muted-foreground">1 hour ago</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (span 6) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Upcoming Tasks Card */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <div className="text-left">
                <h3 className="text-sm font-bold text-foreground">Upcoming Tasks</h3>
                <p className="text-[10px] text-muted-foreground">Your assigned tasks and deadlines</p>
              </div>

              <div className="space-y-2.5">
                {tasks.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 p-2 rounded-xl border border-border bg-white/[0.002] hover:bg-white/[0.005]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-4 w-4 rounded-full border border-muted-foreground shrink-0 cursor-pointer hover:border-primary transition-all" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground block truncate">{t.title}</span>
                        <span className="text-[9px] text-muted-foreground block">{t.due} • {t.assignee}</span>
                      </div>
                    </div>
                    <span className={`text-[8px] font-bold uppercase rounded px-2 py-0.5 border shrink-0 ${t.color}`}>
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sprint 24 Progress Card */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-sm font-bold text-foreground">Sprint 24</h3>
                  <p className="text-[10px] text-muted-foreground">Mar 10 — Mar 23</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-foreground">67%</span>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Complete</p>
                </div>
              </div>

              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '67%' }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-border bg-white/[0.005]">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">COMPLETED</span>
                  <span className="text-base font-extrabold text-foreground">12 <span className="text-xs font-medium text-muted-foreground">/18</span></span>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-white/[0.005]">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">REMAINING</span>
                  <span className="text-base font-extrabold text-foreground">6 <span className="text-xs font-medium text-muted-foreground">/18</span></span>
                </div>
              </div>

              {/* Team Velocity with dynamic graphic */}
              <div className="p-4 rounded-xl border border-border bg-white/[0.005] flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">TEAM VELOCITY</span>
                  <span className="text-xl font-black text-foreground block">42</span>
                  <span className="text-[9px] text-muted-foreground">Story points/sprint</span>
                </div>
                <div className="h-8 w-20 shrink-0 opacity-80 flex items-end gap-1 select-none pr-1">
                  {[4, 6, 8, 12, 16, 24, 18, 32, 42].map((v, i) => (
                    <div key={i} className="bg-primary/20 hover:bg-primary transition-colors flex-1" style={{ height: `${(v / 42) * 100}%` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Workspace Health card */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <div className="text-left">
                <h3 className="text-sm font-bold text-foreground">Workspace Health</h3>
                <p className="text-[10px] text-muted-foreground">Overview of your workspace</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-border bg-white/[0.005] text-center space-y-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary mx-auto">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-muted-foreground block">Team Members</span>
                    <span className="text-base font-extrabold text-foreground">6</span>
                    <span className="text-[8px] text-emerald-500 block font-bold">+2 this month</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-white/[0.005] text-center space-y-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary mx-auto">
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-muted-foreground block">Tasks Completed</span>
                    <span className="text-base font-extrabold text-foreground">43</span>
                    <span className="text-[8px] text-emerald-500 block font-bold">+8 this week</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-white/[0.005] text-center space-y-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary mx-auto">
                    <Folder className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-muted-foreground block">Active Projects</span>
                    <span className="text-base font-extrabold text-foreground">4</span>
                    <span className="text-[8px] text-emerald-500 block font-bold">On track</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { title: 'Create Project', desc: 'Start a new project', icon: Plus, path: '/projects' },
                  { title: 'Create Task', desc: 'Add a new task', icon: CheckSquare, path: '/sprints' },
                  { title: 'Generate Docs', desc: 'Auto-generate documentation', icon: FileText, path: '/documentation' },
                  { title: 'Ask AI', desc: 'Get AI assistance', icon: Sparkles, path: '/projects/ai-planner' }
                ].map((act, idx) => {
                  const Icon = act.icon
                  return (
                    <button
                      key={idx}
                      onClick={() => router.push(act.path)}
                      className="p-4 rounded-xl border border-border bg-card flex flex-col items-center text-center gap-2 hover:border-primary/20 transition-all cursor-pointer glow-card"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-foreground block">{act.title}</span>
                        <span className="text-[9px] text-muted-foreground block">{act.desc}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
    </MainLayout>
  )
}
