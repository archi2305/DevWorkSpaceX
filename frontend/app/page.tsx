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
  GitPullRequest,
  Zap
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { listBlueprints, BlueprintResponseSchema } from '@/services/ai'

export default function Page() {
  const { user } = useAuth()
  const router = useRouter()
  const [commandQuery, setCommandQuery] = useState('')

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

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
      <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 md:px-8 space-y-10 text-left relative z-10 font-sans">
        
        {/* Welcome message hero header */}
        <div className="space-y-2 pt-2">
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight select-none flex items-center gap-3">
            {greeting}, {user?.full_name?.split(' ')[0] || 'Archi'} 👋
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Welcome back. Here&apos;s what&apos;s happening in your workspace today.
          </p>
        </div>

        {/* Dynamic AI Input bar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-3 md:p-4 flex items-center gap-4 shadow-md hover:shadow-lg transition-all glow-card">
            <Sparkles className="h-6 w-6 text-primary ml-2 shrink-0 animate-pulse" />
            <input
              type="text"
              value={commandQuery}
              onChange={(e) => setCommandQuery(e.target.value)}
              placeholder="Ask AI to help you design schemas, write APIs, or audit code..."
              className="flex-1 bg-transparent text-sm md:text-base text-foreground placeholder-muted-foreground outline-none py-2 font-medium"
            />
            <button
              onClick={() => router.push(`/projects/ai-planner?prompt=${encodeURIComponent(commandQuery)}`)}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer shadow-md shadow-primary/20 shrink-0"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5 text-xs md:text-sm font-bold text-foreground">
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
                  className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-white/[0.02] transition-all cursor-pointer flex items-center gap-2 shadow-sm hover:border-primary/30"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{chip.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Continue where you left off section */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Continue Where You Left Off</h2>
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center gap-1.5 text-xs md:text-sm text-primary font-bold hover:underline cursor-pointer"
            >
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map((proj, idx) => {
              const Icon = proj.icon
              return (
                <div key={idx} className="p-6 md:p-7 rounded-3xl border border-border bg-card space-y-6 flex flex-col justify-between hover:border-primary/30 transition-all glow-card shadow-sm min-h-[220px]">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${proj.iconColor} shrink-0`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 text-left flex-1">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <h3 className="text-base font-extrabold text-foreground truncate">{proj.name}</h3>
                        <span className={`text-[10px] font-extrabold uppercase rounded-full px-2.5 py-0.5 border shrink-0 ${proj.statusColor}`}>
                          {proj.status}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground block mt-1 font-medium">{proj.time}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="text-muted-foreground uppercase tracking-wider text-[10px]">PROGRESS</span>
                      <span className="text-primary font-extrabold">{proj.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full ${proj.progressBar}`} style={{ width: `${proj.progress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex -space-x-2 overflow-hidden">
                      {proj.avatars.map((av, avIdx) => (
                        <div
                          key={avIdx}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary border border-border text-[9px] font-bold text-muted-foreground shadow-sm"
                        >
                          {av}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => router.push('/projects/code-generator')}
                      className="px-4 py-1.5 rounded-xl border border-border bg-white/[0.01] hover:bg-white/[0.03] text-xs font-bold text-foreground transition-all cursor-pointer shadow-sm hover:border-primary/20"
                    >
                      Open Workspace
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Dashboard Grid layout (12 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (span 6) */}
          <div className="lg:col-span-6 space-y-8">
            
            {/* AI Suggestions Card */}
            <div className="p-7 md:p-8 rounded-3xl border border-border bg-card space-y-6 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-base md:text-lg font-extrabold text-foreground">AI Suggestions</h3>
                  <p className="text-xs text-muted-foreground">Smart recommendations for your workspace</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-border bg-white/[0.005] flex items-center justify-between gap-4 hover:border-primary/20 transition-all">
                  <div className="space-y-1.5 text-left min-w-0">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" /> Optimize Database Queries
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-primary/20 bg-primary/10 text-primary">Review</span>
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed truncate">Your recent queries could benefit from indexing. I found 3 slow queries.</p>
                  </div>
                  <button
                    onClick={() => router.push('/projects/review')}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-white/5 text-xs font-bold text-foreground transition-all shrink-0 cursor-pointer"
                  >
                    Review
                  </button>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-white/[0.005] flex items-center justify-between gap-4 hover:border-primary/20 transition-all">
                  <div className="space-y-1.5 text-left min-w-0">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Folder className="h-4 w-4 text-blue-500" /> Update Dependencies
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-border bg-white/5 text-muted-foreground">Update</span>
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed truncate">New versions available for 12 packages. Security updates included.</p>
                  </div>
                  <button
                    onClick={() => router.push('/projects/code-generator')}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-white/5 text-xs font-bold text-foreground transition-all shrink-0 cursor-pointer"
                  >
                    Update
                  </button>
                </div>
              </div>

              <button
                onClick={() => router.push('/projects/review')}
                className="w-full py-3 rounded-2xl border border-border hover:bg-white/5 text-xs md:text-sm font-bold text-foreground transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>View all suggestions</span> <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Recent Workspace Activity */}
            <div className="p-7 md:p-8 rounded-3xl border border-border bg-card space-y-6 shadow-sm">
              <h3 className="text-base md:text-lg font-extrabold text-foreground">Recent Workspace Activity</h3>
              <div className="space-y-5">
                {activities.map((act, idx) => {
                  const Icon = act.icon
                  return (
                    <div key={idx} className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-full shrink-0 ${act.color}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs md:text-sm font-bold text-foreground truncate">{act.title}</h4>
                          <span className="text-xs text-muted-foreground shrink-0">{act.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{act.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Right Column (span 6) */}
          <div className="lg:col-span-6 space-y-8">
            
            {/* Upcoming Tasks Card */}
            <div className="p-7 md:p-8 rounded-3xl border border-border bg-card space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-base md:text-lg font-extrabold text-foreground">Upcoming Tasks</h3>
                  <p className="text-xs text-muted-foreground">Your assigned tasks and deadlines</p>
                </div>
                <button
                  onClick={() => router.push('/sprints')}
                  className="text-xs md:text-sm text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  View all <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {tasks.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 p-3.5 rounded-2xl border border-border bg-white/[0.002] hover:bg-white/[0.008] transition-all">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground shrink-0 cursor-pointer hover:border-primary transition-all" />
                      <div className="min-w-0">
                        <span className="text-xs md:text-sm font-bold text-foreground block truncate">{t.title}</span>
                        <span className="text-xs text-muted-foreground block font-medium mt-0.5">{t.due}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase rounded-md px-3 py-1 border shrink-0 ${t.color}`}>
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sprint 24 Progress Card */}
            <div className="p-7 md:p-8 rounded-3xl border border-border bg-card space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-base md:text-lg font-extrabold text-foreground">Sprint 24</h3>
                  <p className="text-xs text-muted-foreground font-medium">Mar 10 — Mar 23</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-foreground">67%</span>
                  <p className="text-[10px] text-muted-foreground uppercase font-extrabold">Complete</p>
                </div>
              </div>

              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '67%' }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-border bg-white/[0.005]">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">COMPLETED</span>
                  <span className="text-lg font-black text-foreground">12 <span className="text-xs font-semibold text-muted-foreground">/18</span></span>
                </div>
                <div className="p-4 rounded-2xl border border-border bg-white/[0.005]">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">REMAINING</span>
                  <span className="text-lg font-black text-foreground">6 <span className="text-xs font-semibold text-muted-foreground">/18</span></span>
                </div>
              </div>

              {/* Team Velocity curve wave SVG */}
              <div className="p-5 rounded-2xl border border-border bg-white/[0.005] flex items-center justify-between gap-6">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">TEAM VELOCITY</span>
                  <span className="text-2xl font-black text-foreground block">42</span>
                  <span className="text-xs text-muted-foreground font-medium">Story points/sprint</span>
                </div>
                <div className="h-10 w-36 shrink-0 flex items-center pr-2">
                  <svg className="h-full w-full" viewBox="0 0 100 30" fill="none">
                    <path
                      d="M0,25 Q15,5 30,20 T60,10 T90,5"
                      stroke="rgb(16, 185, 129)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M0,25 Q15,5 30,20 T60,10 T90,5 L100,30 L0,30 Z"
                      fill="rgba(16, 185, 129, 0.08)"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Workspace Health card */}
            <div className="p-7 md:p-8 rounded-3xl border border-border bg-card space-y-6 shadow-sm">
              <div className="text-left">
                <h3 className="text-base md:text-lg font-extrabold text-foreground">Workspace Health</h3>
                <p className="text-xs text-muted-foreground">Overview of your workspace</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-border bg-white/[0.005] flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="text-left space-y-0.5 min-w-0">
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase block truncate">Team Members</span>
                    <span className="text-lg font-black text-foreground block">6</span>
                    <span className="text-xs text-emerald-500 block font-bold truncate">+2 this month</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-white/[0.005] flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <CheckSquare className="h-5 w-5" />
                  </div>
                  <div className="text-left space-y-0.5 min-w-0">
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase block truncate">Tasks Completed</span>
                    <span className="text-lg font-black text-foreground block">43</span>
                    <span className="text-xs text-emerald-500 block font-bold truncate">+11 this week</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-white/[0.005] flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div className="text-left space-y-0.5 min-w-0">
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase block truncate">Active Projects</span>
                    <span className="text-lg font-black text-foreground block">4</span>
                    <span className="text-xs text-emerald-500 block font-bold truncate">On track</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Quick Actions Panel */}
        <div className="space-y-4 pt-2">
          <h3 className="text-base md:text-lg font-extrabold text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
                  className="p-5 rounded-3xl border border-border bg-card flex flex-col items-center text-center gap-3 hover:border-primary/30 transition-all cursor-pointer glow-card shadow-sm"
                >
                  <div className={`p-3 rounded-2xl ${act.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs md:text-sm font-bold text-foreground block">{act.title}</span>
                    <span className="text-[10px] text-muted-foreground block font-medium">{act.desc}</span>
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
