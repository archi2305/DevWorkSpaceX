'use client'

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Shield, Download, Filter, RefreshCw, Calendar, User, FileText, Lock, FolderKanban, CheckCircle } from 'lucide-react'
import { auditService, AuditLogResponse, AuditLogFilters, AuditStats } from '@/services/audit'
import { format } from 'date-fns'

const CATEGORY_OPTIONS = [
  { value: 'login', label: 'Logins', icon: Lock, color: 'bg-blue-500' },
  { value: 'permission', label: 'Permission Changes', icon: Shield, color: 'bg-purple-500' },
  { value: 'project', label: 'Project Changes', icon: FolderKanban, color: 'bg-green-500' },
  { value: 'task', label: 'Task Changes', icon: CheckCircle, color: 'bg-orange-500' },
  { value: 'document', label: 'Document Changes', icon: FileText, color: 'bg-pink-500' },
]

const EVENT_TYPE_OPTIONS = [
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'view', label: 'View' },
  { value: 'export', label: 'Export' },
  { value: 'login', label: 'Login' },
]

export default function AuditDashboardPage() {
  const [logs, setLogs] = useState<AuditLogResponse[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null)
  const [searchAction, setSearchAction] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const filters: AuditLogFilters = {
    start_date: dateRange.start || undefined,
    end_date: dateRange.end || undefined,
    category: selectedCategory || undefined,
    event_type: selectedEventType || undefined,
    action: searchAction || undefined,
    limit: 100,
  }

  const loadLogs = async () => {
    setLoading(true)
    try {
      const [logsData, statsData] = await Promise.all([
        auditService.getAuditLogs(filters),
        auditService.getAuditStats({ start_date: filters.start_date, end_date: filters.end_date })
      ])
      setLogs(logsData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await auditService.exportAuditLogs(filters)
    } catch (error) {
      console.error('Failed to export audit logs:', error)
    } finally {
      setExporting(false)
    }
  }

  const handleResetFilters = () => {
    setSelectedCategory(null)
    setSelectedEventType(null)
    setSearchAction('')
    setDateRange({ start: '', end: '' })
  }

  useEffect(() => {
    loadLogs()
  }, [selectedCategory, selectedEventType, searchAction, dateRange])

  const getCategoryIcon = (category: string | null) => {
    const option = CATEGORY_OPTIONS.find(opt => opt.value === category)
    if (!option) return null
    const Icon = option.icon
    return <Icon className="h-4 w-4" />
  }

  const getCategoryColor = (category: string | null) => {
    const option = CATEGORY_OPTIONS.find(opt => opt.value === category)
    return option?.color || 'bg-gray-500'
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Audit Dashboard</h1>
              <p className="text-sm text-muted-foreground">Track and monitor workspace activity</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="text-2xl font-bold text-white">{stats.total_logs}</div>
              <div className="text-sm text-muted-foreground">Total Logs</div>
            </div>
            {CATEGORY_OPTIONS.map(cat => {
              const count = stats.category_counts[cat.value] || 0
              return (
                <div key={cat.value} className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${cat.color}`} />
                    <div className="text-2xl font-bold text-white">{count}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{cat.label}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Filters */}
        <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Categories</option>
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Event Type Filter */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Event Type</label>
              <select
                value={selectedEventType || ''}
                onChange={(e) => setSelectedEventType(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Events</option>
                {EVENT_TYPE_OPTIONS.map(event => (
                  <option key={event.value} value={event.value}>{event.label}</option>
                ))}
              </select>
            </div>

            {/* Action Search */}
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Search Action</label>
              <input
                type="text"
                placeholder="Search by action text..."
                value={searchAction}
                onChange={(e) => setSearchAction(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Reset Button */}
            <div className="sm:col-span-2 flex items-end">
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="w-full">
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No audit logs found matching your filters
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="h-3 w-3 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm text-white">{log.user.full_name}</div>
                            <div className="text-xs text-muted-foreground">{log.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {log.category && (
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getCategoryColor(log.category)}`} />
                            <span className="text-sm text-white capitalize">{log.category}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.event_type && (
                          <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white capitalize">
                            {log.event_type}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{log.action}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {log.target_name || log.target_type || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
