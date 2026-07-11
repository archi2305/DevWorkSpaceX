'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Activity,
  Users,
  Layers,
  ArrowDown,
  Clock,
  Briefcase,
  CheckSquare,
  MessageSquare,
  FileText,
  Loader,
  Search
} from 'lucide-react'
import { activityService, ActivityResponse } from '@/services/activity'
import { teamService } from '@/services/team'
import { auditService } from '@/services/audit'

export default function ActivitiesPage() {
  // Query Filters
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedTargetType, setSelectedTargetType] = useState<string>('')
  const [actionQuery, setActionQuery] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  
  // Pagination
  const [activitiesList, setActivitiesList] = useState<ActivityResponse[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const limit = 15

  // Load team list for filter
  const { data: team = [] } = useQuery({
    queryKey: ['workspace-members'],
    queryFn: teamService.getWorkspaceMembers
  })

  // Load activities list based on filters + offset
  const { data: fetchedActivities = [], isLoading, isRefetching } = useQuery({
    queryKey: ['activities-timeline', selectedUserId, selectedTargetType, actionQuery, startDate, endDate, offset],
    queryFn: () => {
      // If we have custom action or date filters, query the secure /activities/audit endpoint
      if (actionQuery || startDate || endDate) {
        return auditService.getAuditLogs({
          user_id: selectedUserId || undefined,
          action: actionQuery || undefined,
          target_type: selectedTargetType || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined
        }) as any
      }
      return activityService.getActivities({
        limit,
        offset,
        user_id: selectedUserId || undefined,
        target_type: selectedTargetType || undefined
      })
    }
  })

  // Reset list on filter updates
  useEffect(() => {
    setActivitiesList([])
    setOffset(0)
    setHasMore(true)
  }, [selectedUserId, selectedTargetType, actionQuery, startDate, endDate])

  // Append new fetched logs
  useEffect(() => {
    if (fetchedActivities.length > 0) {
      setActivitiesList((prev) => {
        // Prevent duplicate logs
        const merged = [...prev]
        fetchedActivities.forEach((item: any) => {
          if (!merged.some(m => m.id === item.id)) {
            merged.push(item)
          }
        })
        return merged
      })
      if (fetchedActivities.length < limit || actionQuery || startDate || endDate) {
        setHasMore(false)
      }
    } else {
      setHasMore(false)
    }
  }, [fetchedActivities, actionQuery, startDate, endDate])

  const handleLoadMore = () => {
    if (!isRefetching && hasMore) {
      setOffset((prev) => prev + limit)
    }
  }

  const handleExport = async () => {
    try {
      await auditService.exportAuditLogs({
        user_id: selectedUserId || undefined,
        action: actionQuery || undefined,
        target_type: selectedTargetType || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined
      })
    } catch (err) {
      alert('Failed to export audit logs.')
    }
  }

  // Group activities list by date
  const groupActivitiesByDate = (list: ActivityResponse[]) => {
    const groups: Record<string, ActivityResponse[]> = {}
    
    list.forEach(item => {
      const dateStr = new Date(item.created_at).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      // Map friendly labels for Today & Yesterday
      const todayStr = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      
      let label = dateStr
      if (dateStr === todayStr) label = 'Today'
      else if (dateStr === yesterdayStr) label = 'Yesterday'

      if (!groups[label]) groups[label] = []
      groups[label].push(item)
    })
    
    return groups
  }

  const getTargetIcon = (targetType: string | null) => {
    switch (targetType) {
      case 'Project':
        return <Briefcase className="h-3.5 w-3.5 text-blue-400" />
      case 'Task':
        return <CheckSquare className="h-3.5 w-3.5 text-[#5BB98C]" />
      case 'Comment':
        return <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
      case 'Document':
        return <FileText className="h-3.5 w-3.5 text-yellow-500" />
      default:
        return <Activity className="h-3.5 w-3.5 text-[#A7ADB5]" />
    }
  }

  const groupedLogs = groupActivitiesByDate(activitiesList)

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header section */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5 text-left">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <Activity className="h-6 w-6 text-[#5BB98C]" /> Secure Audit Logs
            </h1>
            <p className="text-xs text-[#A7ADB5] mt-1">Immutable record of workspace actions, role modifications, and logins.</p>
          </div>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold rounded-xl text-xs cursor-pointer shadow-md"
          >
            Export Audit Logs (CSV)
          </button>
        </div>

        {/* Filtering panels */}
        <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-4.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
          
          <div className="flex items-center gap-1.5 bg-[#1D2024] border border-white/[0.06] rounded-xl px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-[#7E848C]" />
            <input
              type="text"
              placeholder="Search action..."
              value={actionQuery}
              onChange={(e) => setActionQuery(e.target.value)}
              className="bg-transparent border-none text-xs text-white placeholder-[#7E848C] outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#1D2024] border border-white/[0.06] rounded-xl px-2.5 py-1.5">
            <Users className="h-3.5 w-3.5 text-[#7E848C]" />
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-transparent border-none text-xs text-[#A7ADB5] outline-none cursor-pointer focus:text-white w-full"
            >
              <option value="">All Members</option>
              {team.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#1D2024] border border-white/[0.06] rounded-xl px-2.5 py-1.5">
            <Layers className="h-3.5 w-3.5 text-[#7E848C]" />
            <select
              value={selectedTargetType}
              onChange={(e) => setSelectedTargetType(e.target.value)}
              className="bg-transparent border-none text-xs text-[#A7ADB5] outline-none cursor-pointer focus:text-white w-full"
            >
              <option value="">All Types</option>
              <option value="Project">Projects</option>
              <option value="Task">Tasks</option>
              <option value="Comment">Comments</option>
              <option value="Document">Documents</option>
              <option value="File">Files</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#1D2024] border border-white/[0.06] rounded-xl px-2.5 py-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-xs text-[#A7ADB5] outline-none cursor-pointer focus:text-white w-full"
              title="Start Date"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#1D2024] border border-white/[0.06] rounded-xl px-2.5 py-1.5">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-xs text-[#A7ADB5] outline-none cursor-pointer focus:text-white w-full"
              title="End Date"
            />
          </div>

        </div>

        {/* Timeline body feed */}
        {activitiesList.length === 0 && isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader className="h-6 w-6 text-[#5BB98C] animate-spin" />
          </div>
        ) : (
          <div className="space-y-8 relative pl-4 md:pl-8 before:absolute before:left-8 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/[0.04]">
            {Object.keys(groupedLogs).map((dateLabel) => (
              <div key={dateLabel} className="space-y-4">
                {/* Date Group Heading */}
                <div className="flex items-center gap-3 relative -left-8 md:-left-12">
                  <div className="h-8 px-3 rounded-full bg-[#1D2024] border border-white/[0.06] text-[10px] font-bold text-white uppercase tracking-wider flex items-center justify-center shadow-md">
                    <Clock className="h-3.5 w-3.5 text-[#5BB98C] mr-1.5" /> {dateLabel}
                  </div>
                </div>

                {/* Date Group Logs */}
                <div className="space-y-4">
                  {groupedLogs[dateLabel].map((log) => {
                    const initials = log.user.full_name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)

                    return (
                      <div key={log.id} className="relative flex gap-4 items-start text-left">
                        {/* Member avatar bullet */}
                        <div className="h-8 w-8 rounded-full bg-[#1D2024] border border-white/[0.06] text-[#A7ADB5] flex items-center justify-center text-[10px] font-bold shadow-md z-10">
                          {initials}
                        </div>

                        {/* Log details card */}
                        <div className="flex-1 p-4 rounded-2xl border border-white/[0.06] bg-[#171A1D] shadow-md space-y-2 hover:border-white/[0.1] transition-colors relative">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              {getTargetIcon(log.target_type)}
                              <span className="text-xs font-extrabold text-white">{log.action}</span>
                            </div>
                            <span className="text-[9px] text-[#7E848C]">
                              {new Date(log.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-xs text-[#A7ADB5] leading-relaxed">{log.details}</p>

                          {log.target_name && (
                            <div className="inline-flex items-center gap-1 bg-white/[0.04] border border-white/5 rounded-lg px-2 py-0.5 text-[9px] text-white font-mono">
                              {log.target_type}: {log.target_name}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Empty view state */}
            {activitiesList.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-[#171A1D]">
                <Activity className="h-10 w-10 text-[#7E848C]/40 mb-3" />
                <h3 className="text-sm font-bold text-white">No actions recorded</h3>
                <p className="text-xs text-[#7E848C] mt-1">Activities logged on this workspace will appear on this timeline feed.</p>
              </div>
            )}

            {/* Load more infinite scroll button */}
            {hasMore && (
              <div className="flex justify-center pt-4 pl-4 md:pl-8">
                <button
                  onClick={handleLoadMore}
                  disabled={isRefetching}
                  className="px-4 py-2.5 rounded-xl border border-white/[0.06] bg-[#171A1D] hover:bg-[#23272B] text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-40"
                >
                  {isRefetching ? (
                    <Loader className="h-3.5 w-3.5 text-[#5BB98C] animate-spin" />
                  ) : (
                    <ArrowDown className="h-3.5 w-3.5 text-[#5BB98C]" />
                  )}
                  Load More Activities
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </MainLayout>
  )
}
