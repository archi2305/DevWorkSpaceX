'use client'

import { useState, useEffect } from 'react'
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
  Cpu,
  Plus,
  Zap,
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
  ChevronRight,
  ShoppingCart,
  Smartphone,
  Palette,
  Book,
  Download,
  GitPullRequest
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { listBlueprints, BlueprintResponseSchema } from '@/services/ai'

export default function Page() {
  const { user } = useAuth()
  const router = useRouter()
  const [commandQuery, setCommandQuery] = useState('')

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good evening, Test' : currentHour < 18 ? 'Good afternoon, Test' : 'Good evening, Test'

  // Sample static projects matching reference image exactly
  const projects = [
    {
      name: 'E-Commerce Platform',
      time: 'Last opened 2h ago',
      progress: 65,
      avatars: ['AR', 'JD', '+1'],
      icon: ShoppingCart,
      iconColor: 'text-emerald-500 bg-emerald-500/10',
      progressBar: 'bg-emerald-500',
      status: 'IN PROGRESS',
      statusColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    },
    {
      name: 'Mobile App Redesign',
      time: 'Last opened 1d ago',
      progress: 42,
      avatars: ['AF', 'ES'],
      icon: Smartphone,
      iconColor: 'text-purple-500 bg-purple-500/10',
      progressBar: 'bg-purple-500',
      status: 'IN PROGRESS',
      statusColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    },
    {
      name: 'Design System v2',
      time: 'Last opened 3d ago',
      progress: 88,
      avatars: ['JM', 'MC', '+2'],
      icon: Palette,
      iconColor: 'text-blue-500 bg-blue-500/10',
      progressBar: 'bg-blue-500',
      status: 'REVIEW',
      statusColor: 'bg-primary/10 text-primary border-primary/20'
    },
    {
      name: 'API Documentation',
      time: 'Last opened 1w ago',
      progress: 16,
      avatars: ['JD'],
      icon: Book,
      iconColor: 'text-amber-500 bg-amber-500/10',
      progressBar: 'bg-amber-500',
      status: 'IN PROGRESS',
      statusColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    }
  ]

  // Upcoming Tasks matching reference image exactly
  const tasks = [
    { title: 'Review API documentation', due: 'Today • You', priority: 'HIGH', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    { title: 'Update design system components', due: 'Tomorrow • Sarah Chen', priority: 'HIGH', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    { title: 'Fix mobile responsiveness issues', due: 'Mar 15 • You', priority: 'MEDIUM', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { title: 'Prepare Q1 roadmap presentation', due: 'Mar 18 • Team Lead', priority: 'MEDIUM', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { title: 'Conduct user research interviews', due: 'Mar 20 • You', priority: 'LOW', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' }
  ]

  // Recent activity matching reference image exactly
  const activities = [
    { title: 'Created project milestone', desc: 'Milestone v1.2.0 added to E-Commerce Platform', time: '2 hours ago', icon: FileText, color: 'text-emerald-500 bg-emerald-500/10' },
    { title: 'New comment on design proposal', desc: 'Sarah commented on your design mockups', time: '3 hours ago', icon: MessageSquare, color: 'text-blue-500 bg-blue-500/10' },
    { title: 'Team member invited', desc: 'John Doe was added to your workspace', time: '1 day ago', icon: Users, color: 'text-purple-500 bg-purple-500/10' },
    { title: 'Code pushed to main branch', desc: 'API improvements in E-Commerce Platform', time: '2 days ago', icon: Code, color: 'text-indigo-500 bg-indigo-500/10' },
    { title: 'Performance improvements deployed', desc: 'Database query optimizations go live', time: '3 days ago', icon: Zap, color: 'text-yellow-500 bg-yellow-500/10' }
  ]

  return (
    <MainLayout>
      <div className="max-w-[1440px] w-full mx-auto space-y-8 text-left relative z-10 font-sans">
        
        {/* Welcome message header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight select-none">
            {greeting} 👏
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Here&apos;s what&apos;s happening in your workspace today.
          </p>
        </div>

        {/* Dynamic AI Input bar */}
        <div className="space-y-3">
          <div className="rounded-full border border-border bg-card p-2.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-all glow-card">
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
              { label: 'Create new project', icon: Plus },
              { label: 'Review pull requests', icon: FileText },
              { label: 'Check team updates', icon: Activity },
              { label: 'Generate code', icon: Code },
              { label: 'Open AI Architect', icon: Sparkles }
            ].map((chip) => {
              const Icon = chip.icon
              return (
                <button
                  key={chip.label}
                  onClick={() => setCommandQuery(`Help me ${chip.label.toLowerCase()}`)}
                  className="px-4 py-2 rounded-full border border-border bg-card hover:bg-white/[0.01] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{chip.label}</span>
                </button>
              )
            })}
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
            {projects.map((proj, idx) => {
              const Icon = proj.icon
              return (
                <div key={idx} className="p-5 rounded-2xl border border-border bg-card space-y-4 flex flex-col justify-between hover:border-primary/20 transition-all glow-card shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${proj.iconColor} shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="flex items-center justify-between gap-1.5 w-full">
                        <h3 className="text-xs font-bold text-foreground truncate">{proj.name}</h3>
                        <span className={`text-[8px] font-bold uppercase rounded-full px-2 py-0.5 border shrink-0 ${proj.statusColor}`}>
                          {proj.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">{proj.time}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[9px] font-bold text-foreground">
                      <span className="text-muted-foreground uppercase">PROGRESS</span>
                      <span>{proj.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full ${proj.progressBar}`} style={{ width: `${proj.progress}%` }} />
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
              )
            })}
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
                    <p className="text-[10px] text-muted-foreground leading-normal truncate">New versions available for 12 packages. Security updates included.</p>
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
                className="w-full py-2.5 rounded-xl border border-border hover:bg-white/5 text-xs font-bold text-foreground transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>View all suggestions</span> <ChevronRight className="h-3.5 w-3.5" />
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

          </div>

          {/* Right Column (span 6) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Upcoming Tasks Card */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-sm font-bold text-foreground">Upcoming Tasks</h3>
                  <p className="text-[10px] text-muted-foreground">Your assigned tasks and deadlines</p>
                </div>
                <button
                  onClick={() => router.push('/sprints')}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {tasks.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 p-2 rounded-xl border border-border bg-white/[0.002] hover:bg-white/[0.005]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-4.5 w-4.5 rounded-full border border-muted-foreground shrink-0 cursor-pointer hover:border-primary transition-all" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground block truncate">{t.title}</span>
                        <span className="text-[9px] text-muted-foreground block">{t.due}</span>
                      </div>
                    </div>
                    <span className={`text-[8px] font-bold uppercase rounded px-2.5 py-0.5 border shrink-0 ${t.color}`}>
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

              {/* Team Velocity curve wave SVG */}
              <div className="p-4 rounded-xl border border-border bg-white/[0.005] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">TEAM VELOCITY</span>
                  <span className="text-xl font-black text-foreground block">42</span>
                  <span className="text-[9px] text-muted-foreground">Story points/sprint</span>
                </div>
                <div className="h-8 w-28 shrink-0 flex items-center pr-2">
                  <svg className="h-full w-full" viewBox="0 0 100 30" fill="none">
                    <path
                      d="M0,25 Q15,5 30,20 T60,10 T90,5"
                      stroke="rgb(16, 185, 129)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M0,25 Q15,5 30,20 T60,10 T90,5 L100,30 L0,30 Z"
                      fill="rgba(16, 185, 129, 0.05)"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Workspace Health card */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <div className="text-left">
                <h3 className="text-sm font-bold text-foreground">Workspace Health</h3>
                <p className="text-[10px] text-muted-foreground">Overview of your workspace</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border bg-white/[0.005] flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="text-left space-y-0.5 min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block truncate">Team Members</span>
                    <span className="text-base font-extrabold text-foreground block">6</span>
                    <span className="text-[9px] text-emerald-500 block font-bold truncate">+2 this month</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-white/[0.005] flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <CheckSquare className="h-5 w-5" />
                  </div>
                  <div className="text-left space-y-0.5 min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block truncate">Tasks Completed</span>
                    <span className="text-base font-extrabold text-foreground block">43</span>
                    <span className="text-[9px] text-emerald-500 block font-bold truncate">+11 this week</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-white/[0.005] flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div className="text-left space-y-0.5 min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block truncate">Active Projects</span>
                    <span className="text-base font-extrabold text-foreground block">4</span>
                    <span className="text-[9px] text-emerald-500 block font-bold truncate">On track</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Quick Actions Panel */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { title: 'New Project', desc: 'Start from scratch', icon: Plus, path: '/projects', color: 'text-emerald-500 bg-emerald-500/10' },
              { title: 'AI Architect', desc: 'Generate blueprint', icon: Sparkles, path: '/projects/ai-planner', color: 'text-blue-500 bg-blue-500/10' },
              { title: 'Code Generator', desc: 'Generate code', icon: Terminal, path: '/projects/code-generator', color: 'text-purple-500 bg-purple-500/10' },
              { title: 'AI Chat', desc: 'Ask architect', icon: MessageSquare, path: '/projects/ai-planner', color: 'text-cyan-500 bg-cyan-500/10' },
              { title: 'Import Project', desc: 'From repository', icon: GitPullRequest, path: '/projects', color: 'text-teal-500 bg-teal-500/10' },
              { title: 'Documentation', desc: 'View docs', icon: FileText, path: '/documentation', color: 'text-indigo-500 bg-indigo-500/10' }
            ].map((act, idx) => {
              const Icon = act.icon
              return (
                <button
                  key={idx}
                  onClick={() => router.push(act.path)}
                  className="p-4 rounded-2xl border border-border bg-card flex flex-col items-center text-center gap-3 hover:border-primary/20 transition-all cursor-pointer glow-card shadow-sm"
                >
                  <div className={`p-2.5 rounded-xl ${act.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground block">{act.title}</span>
                    <span className="text-[9px] text-muted-foreground block">{act.desc}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </MainLayout>
  )
}
