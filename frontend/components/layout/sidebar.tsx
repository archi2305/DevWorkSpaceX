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
  Sparkles
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCollaboration } from '@/hooks/use-collaboration'

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Files, label: 'Projects', href: '/projects' },
  { icon: Sparkles, label: 'AI Software Architect', href: '/projects/ai-planner' },
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const userInitials = user ? getInitials(user.full_name) : 'U'

  return (
    <motion.aside
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`
        fixed left-0 top-0 h-screen border-r border-sidebar-border/50 bg-sidebar text-sidebar-foreground
        transition-all duration-300 z-40 backdrop-blur-sm
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-sidebar-border/40 px-4 py-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <motion.div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/20"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-sm font-bold text-primary-foreground">DW</span>
            </motion.div>
            {!isCollapsed && <span className="font-semibold text-sidebar-foreground text-sm">DevWorkspace</span>}
          </motion.div>
          <motion.button
            onClick={() => setIsCollapsed(!isCollapsed)}
            whileHover={{ scale: 1.1 }}
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
                  transition-all duration-200 hover:bg-primary/10 hover:text-primary
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
          <div className="px-4 py-2 border-t border-sidebar-border/40 space-y-2 text-left">
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

        {/* Profile Section */}
        <div className="border-t border-sidebar-border/40 px-2 py-4">
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
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
          </motion.button>

          <motion.button
            onClick={logout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              mt-2 w-full flex items-center gap-3 rounded-lg px-3 py-2.5
              text-sm transition-all duration-200 hover:bg-primary/10 hover:text-primary
              ${isCollapsed ? 'justify-center' : 'text-muted-foreground'}
            `}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </motion.button>
        </div>
      </div>
    </motion.aside>
  )
}
