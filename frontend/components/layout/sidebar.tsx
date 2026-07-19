'use client'

import { motion } from 'framer-motion'
import {
  Home,
  Files,
  MessageSquare,
  Settings,
  Users,
  Zap,
  Briefcase,
  BookOpen,
  BarChart3,
  Archive,
  HelpCircle,
  LogOut,
  FolderOpen,
  Calendar,
  Activity,
  FileText,
  Shield,
  Sparkles,
  Terminal,
  Layers,
  Sun,
  Moon,
  ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCollaboration } from '@/hooks/use-collaboration'
import { useTheme } from 'next-themes'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Files, label: 'Projects', href: '/projects' },
  { icon: Layers, label: 'My Blueprints', href: '/projects/blueprints' },
  { icon: Sparkles, label: 'AI Software Architect', href: '/projects/ai-planner' },
  { icon: Terminal, label: 'AI Code Generator', href: '/projects/code-generator' },
  { icon: Shield, label: 'AI Review Center', href: '/projects/review' },
  { icon: Briefcase, label: 'Sprints', href: '/sprints' },
  { icon: FolderOpen, label: 'Files', href: '/files' },
  { icon: Calendar, label: 'Calendar', href: '/calendar' },
  { icon: MessageSquare, label: 'Messages', href: '/messages' },
  { icon: Zap, label: 'Quick Actions', href: '/quick-actions' },
  { icon: Users, label: 'Team', href: '/team' },
  { icon: Activity, label: 'Activity Timeline', href: '/activities' },
  { icon: Shield, label: 'Audit Dashboard', href: '/audit' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: FileText, label: 'Reports', href: '/reports' },
  { icon: BookOpen, label: 'Documentation', href: '/documentation' },
  { icon: Archive, label: 'Archives', href: '/archives' },
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: HelpCircle, label: 'Help', href: '/help' },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { onlineUsers } = useCollaboration()
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const userInitials = user ? getInitials(user.full_name) : 'U'

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    try {
      await api.put('/workspace/settings', { theme: newTheme })
      queryClient.invalidateQueries({ queryKey: ['workspace-settings'] })
    } catch (e) {
      console.error('Failed to sync theme', e)
    }
  }

  return (
    <motion.aside
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`
        fixed left-0 top-0 h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground
        transition-all duration-300 z-40 backdrop-blur-sm flex flex-col justify-between
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      <div className="flex flex-col h-full overflow-hidden">
        
        {/* Logo Header */}
        <div className="flex items-center justify-between border-b border-sidebar-border/40 px-4 py-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            {!isCollapsed && <span className="font-extrabold text-foreground text-sm tracking-tight">DevWorkspace X</span>}
          </div>
          <motion.button
            onClick={() => setIsCollapsed(!isCollapsed)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg p-1.5 hover:bg-primary/10 transition-colors"
          >
            {isCollapsed ? '→' : '←'}
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.a
                key={item.label}
                href={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ x: 4 }}
                className={`
                  group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm
                  transition-all duration-200 hover:bg-primary/10 hover:text-primary font-bold
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </motion.a>
            )
          })}
        </nav>

        {/* Presence status section */}
        {!isCollapsed && onlineUsers.length > 0 && (
          <div className="px-4 py-2 border-t border-sidebar-border/40 space-y-2 text-left shrink-0">
            <span className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider">Online ({onlineUsers.length})</span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {onlineUsers.map((ou) => (
                <div
                  key={ou.id}
                  title={`${ou.full_name} (${ou.email})`}
                  className="relative flex items-center justify-center h-6 w-6 rounded-full bg-[#1D2024] border border-white/[0.06] hover:scale-105 transition-transform"
                >
                  <span className="text-[8px] font-bold text-[#F5F5F5]">
                    {ou.full_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </span>
                  <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-[#5BB98C] border border-[#111315]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile, Theme Switcher & Pro Card */}
        <div className="border-t border-sidebar-border/40 px-3 py-4 space-y-3 shrink-0">
          
          {/* User profile card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              w-full flex items-center gap-3 rounded-lg px-3 py-2.5
              transition-all duration-200 hover:bg-primary/10
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt={user.full_name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <motion.div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-xs font-bold text-primary"
                whileHover={{ scale: 1.1 }}
              >
                {userInitials}
              </motion.div>
            )}
            {!isCollapsed && user && (
              <div className="flex-1 text-left truncate">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">Admin</p>
              </div>
            )}
          </motion.button>

          {/* Theme switcher Light / Dark buttons */}
          {isMounted && !isCollapsed && (
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#09090b]/50 border border-sidebar-border/60">
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sun className="h-4 w-4" /> Light
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Moon className="h-4 w-4" /> Dark
              </button>
            </div>
          )}

          {/* Upgrade to Pro Card */}
          {!isCollapsed && (
            <div className="p-4 rounded-2xl border border-sidebar-border bg-[#09090b]/30 space-y-2.5 text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-foreground">Upgrade to Pro</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Unlock advanced AI features, unlimited generations and more.
              </p>
              <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] transition-all cursor-pointer">
                Upgrade Now <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}

          <motion.button
            onClick={logout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              w-full flex items-center gap-3 rounded-lg px-3 py-2.5
              text-xs transition-all duration-200 hover:bg-primary/10 hover:text-primary font-bold
              ${isCollapsed ? 'justify-center' : 'text-muted-foreground'}
            `}
          >
            <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </motion.button>
        </div>
      </div>
    </motion.aside>
  )
}
