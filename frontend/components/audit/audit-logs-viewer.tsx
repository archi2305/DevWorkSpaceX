'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { activityService, ActivityResponse, AuditStats } from '@/services/activity'
import {
  Shield,
  Download,
  Filter,
  User,
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Settings,
  Trash2,
  Edit,
  LogIn,
  LogOut,
  Plus,
  Lock
} from 'lucide-react'

interface AuditLogsViewerProps {
  className?: string
}

export function AuditLogsViewer({ className = '' }: AuditLogsViewerProps) {
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    category: '',
    event_type: '',
    target_type: '',
    action: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Query audit logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => activityService.getAuditLogs(filters),
    refetchInterval: 30000
  })

  // Query audit stats
  const { data: stats } = useQuery({
    queryKey: ['audit-stats', { start_date: filters.start_date, end_date: filters.end_date }],
    queryFn: () => activityService.getAuditStats({ start_date: filters.start_date, end_date: filters.end_date }),
    refetchInterval: 30000
  })

  const handleExport = async () => {
    try {
      const blob = await activityService.exportAuditLogs(filters)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const getEventIcon = (event_type: string) => {
    switch (event_type) {
      case 'login': return <LogIn className="h-4 w-4" />
      case 'logout': return <LogOut className="h-4 w-4" />
      case 'create': return <Plus className="h-4 w-4" />
      case 'update': return <Edit className="h-4 w-4" />
      case 'delete': return <Trash2 className="h-4 w-4" />
      case 'view': return <FileText className="h-4 w-4" />
      case 'export': return <Download className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getEventColor = (event_type: string) => {
    switch (event_type) {
      case 'login': return 'text-green-400'
      case 'logout': return 'text-yellow-400'
      case 'create': return 'text-blue-400'
      case 'update': return 'text-purple-400'
      case 'delete': return 'text-red-400'
      case 'view': return 'text-gray-400'
      case 'export': return 'text-cyan-400'
      default: return 'text-gray-400'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'login': return <LogIn className="h-4 w-4" />
      case 'permission': return <Lock className="h-4 w-4" />
      case 'project': return <FileText className="h-4 w-4" />
      case 'task': return <CheckCircle className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      category: '',
      event_type: '',
      target_type: '',
      action: ''
    })
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-[#5BB98C]" />
          <div>
            <h2 className="text-xl font-bold text-white">Audit Logs</h2>
            <p className="text-xs text-[#7E848C]">Immutable system activity tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 border border-white/[0.08] hover:bg-[#1D2024] text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#171A1D] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#5BB98C]" />
              <span className="text-xs text-[#7E848C]">Total Logs</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.total_logs}</p>
          </div>
          <div className="bg-[#171A1D] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-[#7E848C]">Login Events</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.event_type_counts.login || 0}</p>
          </div>
          <div className="bg-[#171A1D] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-green-400" />
              <span className="text-xs text-[#7E848C]">Create Events</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.event_type_counts.create || 0}</p>
          </div>
          <div className="bg-[#171A1D] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-[#7E848C]">Permission Events</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.category_counts.permission || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-[#171A1D] border border-white/[0.06] rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter Logs
            </h3>
            <button
              onClick={clearFilters}
              className="text-xs text-[#7E848C] hover:text-white cursor-pointer"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block mb-2">Start Date</label>
              <input
                type="datetime-local"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full bg-[#111315] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5BB98C]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block mb-2">End Date</label>
              <input
                type="datetime-local"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full bg-[#111315] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5BB98C]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full bg-[#111315] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5BB98C]"
              >
                <option value="">All Categories</option>
                <option value="login">Login</option>
                <option value="permission">Permission</option>
                <option value="project">Project</option>
                <option value="task">Task</option>
                <option value="document">Document</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block mb-2">Event Type</label>
              <select
                value={filters.event_type}
                onChange={(e) => handleFilterChange('event_type', e.target.value)}
                className="w-full bg-[#111315] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5BB98C]"
              >
                <option value="">All Event Types</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="view">View</option>
                <option value="export">Export</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block mb-2">Target Type</label>
              <select
                value={filters.target_type}
                onChange={(e) => handleFilterChange('target_type', e.target.value)}
                className="w-full bg-[#111315] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5BB98C]"
              >
                <option value="">All Target Types</option>
                <option value="Project">Project</option>
                <option value="Task">Task</option>
                <option value="Sprint">Sprint</option>
                <option value="Document">Document</option>
                <option value="User">User</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block mb-2">Action Search</label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                placeholder="Search action text..."
                className="w-full bg-[#111315] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5BB98C]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-[#171A1D] border border-white/[0.06] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 border-2 border-[#5BB98C]/20 border-t-[#5BB98C] rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-[#7E848C] mb-4" />
            <p className="text-sm text-[#7E848C]">No audit logs found</p>
            <p className="text-xs text-[#7E848C] mt-1">Adjust filters or wait for activity</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-[#7E848C] uppercase tracking-wider">Timestamp</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-[#7E848C] uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-[#7E848C] uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-[#7E848C] uppercase tracking-wider">Event</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-[#7E848C] uppercase tracking-wider">Action</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-[#7E848C] uppercase tracking-wider">Target</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-[#7E848C] uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-xs text-white font-mono">
                      {formatTimestamp(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-[#7E848C]" />
                        <div>
                          <p className="text-xs text-white font-medium">{log.user.full_name}</p>
                          <p className="text-[10px] text-[#7E848C]">{log.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {log.category && getCategoryIcon(log.category)}
                        <span className="text-xs text-[#7E848C] capitalize">{log.category || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {log.event_type && (
                          <span className={getEventColor(log.event_type)}>
                            {getEventIcon(log.event_type)}
                          </span>
                        )}
                        <span className="text-xs text-white capitalize">{log.event_type || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-white">{log.action}</p>
                      <p className="text-[10px] text-[#7E848C] truncate max-w-xs">{log.details}</p>
                    </td>
                    <td className="px-4 py-3">
                      {log.target_type && (
                        <div>
                          <p className="text-xs text-white">{log.target_type}</p>
                          {log.target_name && (
                            <p className="text-[10px] text-[#7E848C]">{log.target_name}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#7E848C] font-mono">
                      {log.ip_address || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
