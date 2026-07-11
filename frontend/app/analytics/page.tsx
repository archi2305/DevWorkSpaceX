'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import {
  TrendingUp,
  BarChart4,
  Users,
  AlertOctagon,
  Calendar,
  FolderKanban,
  Zap,
  Activity,
  LineChart,
  RefreshCw,
  Loader,
  Award,
  Clock
} from 'lucide-react'
import { analyticsService } from '@/services/analytics'
import { projectService } from '@/services/project'
import { workspaceService } from '@/services/workspace'
import { timeLogService } from '@/services/time-log'

export default function AnalyticsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Query analytics dataset
  const { data: analytics, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['analytics', selectedProjectId, selectedWorkspaceId, startDate, endDate],
    queryFn: () => analyticsService.getAnalytics({
      project_id: selectedProjectId || undefined,
      workspace_id: selectedWorkspaceId || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined
    })
  })

  // Load project list for dropdown filter
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects()
  })

  // Load workspace details for scope filter
  const { data: workspaceSettings } = useQuery({
    queryKey: ['workspace-settings'],
    queryFn: () => workspaceService.getSettings()
  })

  // Load productivity report
  const { data: productivityReport } = useQuery({
    queryKey: ['productivity-report'],
    queryFn: () => timeLogService.getProductivityReport()
  })

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0
    return Math.min(100, Math.round((value / total) * 100))
  }

  // Calculate highest count for scaling charts
  const getMaxCount = (list: { count?: number; completed?: number; remaining?: number }[], key: 'count' | 'completed' | 'remaining') => {
    const maxVal = Math.max(...list.map(item => Number(item[key] || 0)), 10)
    return maxVal
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Title & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5 text-left">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <BarChart4 className="h-6 w-6 text-[#5BB98C]" /> Workspace Analytics
            </h1>
            <p className="text-xs text-[#A7ADB5] mt-1">Real-time charts, burndown metrics, and workload trackers.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="p-2.5 rounded-xl border border-white/[0.06] bg-[#171A1D] hover:bg-[#23272B] text-[#A7ADB5] hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin text-[#5BB98C]' : ''}`} />
            </button>

            {/* Filter selectors */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-white/[0.06] bg-[#171A1D] text-xs text-[#F5F5F5] outline-none cursor-pointer hover:bg-[#23272B] focus:border-[#5BB98C]"
              >
                <option value="">All Workspaces</option>
                {workspaceSettings && (
                  <option value={workspaceSettings.id}>
                    {workspaceSettings.name || 'Acme Workspace'}
                  </option>
                )}
              </select>

              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-white/[0.06] bg-[#171A1D] text-xs text-[#F5F5F5] outline-none cursor-pointer hover:bg-[#23272B] focus:border-[#5BB98C]"
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center bg-[#171A1D] border border-white/[0.06] rounded-xl px-2 py-1 gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#7E848C]" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none text-[10px] text-white outline-none cursor-pointer w-24"
                />
                <span className="text-[#7E848C] text-[10px]">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none text-[10px] text-white outline-none cursor-pointer w-24"
                />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-80 items-center justify-center">
            <Loader className="h-7 w-7 text-[#5BB98C] animate-spin" />
          </div>
        ) : (
          analytics && (
            <>
              {/* Summary KPIs Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                
                {/* KPI 1: Active Projects */}
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#171A1D] relative overflow-hidden">
                  <FolderKanban className="absolute right-4 top-4 h-9 w-9 text-blue-500/10" />
                  <p className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Active Projects</p>
                  <p className="text-3xl font-extrabold text-white mt-2">{analytics.project_progress.length}</p>
                  <span className="text-[9px] text-[#5BB98C] mt-1.5 block">Aggregated in workspace</span>
                </div>

                {/* KPI 2: Active Tasks */}
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#171A1D] relative overflow-hidden">
                  <Activity className="absolute right-4 top-4 h-9 w-9 text-indigo-500/10" />
                  <p className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Active Tasks</p>
                  <p className="text-3xl font-extrabold text-white mt-2">{analytics.active_tasks_count ?? 0}</p>
                  <span className="text-[9px] text-[#A7ADB5] mt-1.5 block">Currently in progress</span>
                </div>

                {/* KPI 3: Completed Tasks */}
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#171A1D] relative overflow-hidden">
                  <TrendingUp className="absolute right-4 top-4 h-9 w-9 text-[#5BB98C]/10" />
                  <p className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Completed Tasks</p>
                  <p className="text-3xl font-extrabold text-[#5BB98C] mt-2">{analytics.completed_tasks_count ?? 0}</p>
                  <span className="text-[9px] text-[#A7ADB5] mt-1.5 block">Total completed items</span>
                </div>

                {/* KPI 4: Completion Rate */}
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#171A1D] relative overflow-hidden">
                  <LineChart className="absolute right-4 top-4 h-9 w-9 text-[#5BB98C]/10" />
                  <p className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Completion Rate</p>
                  <p className="text-3xl font-extrabold text-white mt-2">{(analytics.completion_rate ?? 0)}%</p>
                  <span className="text-[9px] text-[#A7ADB5] mt-1.5 block">Completed vs active tasks</span>
                </div>

                {/* KPI 5: Current Velocity */}
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#171A1D] relative overflow-hidden">
                  <Zap className="absolute right-4 top-4 h-9 w-9 text-yellow-500/10" />
                  <p className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Current Velocity</p>
                  <p className="text-3xl font-extrabold text-yellow-500 mt-2">
                    {analytics.velocity.reduce((acc, curr) => acc + curr.completed, 0)} <span className="text-xs font-semibold text-[#A7ADB5]">tasks / wk</span>
                  </p>
                  <span className="text-[9px] text-[#A7ADB5] mt-1.5 block">Weekly completion rate</span>
                </div>

                {/* KPI 6: Overdue Alerts */}
                <div className={`p-5 rounded-2xl border relative overflow-hidden ${
                  analytics.overdue_count > 0 ? 'border-[#EB5757]/20 bg-[#EB5757]/5' : 'border-white/[0.06] bg-[#171A1D]'
                }`}>
                  <AlertOctagon className={`absolute right-4 top-4 h-9 w-9 ${analytics.overdue_count > 0 ? 'text-[#EB5757]/20' : 'text-[#7E848C]/10'}`} />
                  <p className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Overdue Alerts</p>
                  <p className={`text-3xl font-extrabold mt-2 ${analytics.overdue_count > 0 ? 'text-[#EB5757]' : 'text-white'}`}>
                    {analytics.overdue_count}
                  </p>
                  <span className="text-[9px] text-[#A7ADB5] mt-1.5 block">Incomplete past deadlines</span>
                </div>

                {/* KPI 7: Productivity Score */}
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#171A1D] relative overflow-hidden">
                  <TrendingUp className="absolute right-4 top-4 h-9 w-9 text-emerald-500/10" />
                  <p className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Productivity Score</p>
                  <p className="text-3xl font-extrabold text-emerald-400 mt-2">{(analytics.productivity_score ?? 100)} / 100</p>
                  <span className="text-[9px] text-[#A7ADB5] mt-1.5 block">Weighted efficiency index</span>
                </div>

                {/* KPI 8: Weekly / Monthly Activity */}
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#171A1D] relative overflow-hidden">
                  <Users className="absolute right-4 top-4 h-9 w-9 text-purple-500/10" />
                  <p className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Workspace Activity</p>
                  <p className="text-3xl font-extrabold text-white mt-2">
                    {analytics.weekly_activity ?? 0} <span className="text-xs font-semibold text-[#A7ADB5]">/ 7d</span>
                  </p>
                  <span className="text-[9px] text-[#A7ADB5] mt-1.5 block">{analytics.monthly_activity ?? 0} actions / 30d</span>
                </div>
              </div>

              {/* Analytics main charts grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                
                {/* 1. Completed Tasks Trend Chart */}
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#171A1D] space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-[#5BB98C]" /> Completed Tasks Trend
                  </h3>
                  <div className="h-48 flex items-end justify-between pt-6 border-b border-white/5 px-2">
                    {analytics.completed_trend.map((day) => {
                      const maxVal = getMaxCount(analytics.completed_trend, 'count')
                      const heightPercent = getPercentage(day.count, maxVal)
                      return (
                        <div key={day.date} className="flex flex-col items-center group flex-1">
                          {/* Value tooltip */}
                          <span className="text-[8px] text-[#5BB98C] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity mb-1 bg-[#1D2024] border border-[#5BB98C]/20 px-1 py-0.2 rounded">
                            {day.count}
                          </span>
                          <div
                            style={{ height: `${Math.max(4, heightPercent)}%` }}
                            className="w-8 bg-[#5BB98C] rounded-t-md hover:brightness-110 shadow-lg shadow-[#5BB98C]/10 transition-all cursor-pointer"
                          />
                          <span className="text-[8px] text-[#7E848C] mt-2 block font-medium">
                            {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Burndown Chart */}
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#171A1D] space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <LineChart className="h-4 w-4 text-blue-400" /> Sprint Burn-Down (10 Days)
                  </h3>
                  <div className="h-48 flex items-end justify-between pt-6 border-b border-white/5 px-2">
                    {analytics.burndown.map((point) => {
                      const maxVal = getMaxCount(analytics.burndown, 'remaining')
                      const heightPercent = getPercentage(point.remaining, maxVal)
                      const idealPercent = getPercentage(point.ideal, maxVal)

                      return (
                        <div key={point.day} className="flex flex-col items-center flex-1 relative group h-full justify-end">
                          {/* Remaining Bar */}
                          <div
                            style={{ height: `${Math.max(4, heightPercent)}%` }}
                            className="w-4 bg-blue-500 rounded-t-md opacity-85 hover:opacity-100 transition-all cursor-pointer z-10"
                            title={`Actual Remaining: ${point.remaining}`}
                          />
                          {/* Ideal Bar (ghost overlay) */}
                          <div
                            style={{ height: `${Math.max(2, idealPercent)}%` }}
                            className="w-4 bg-white/5 border border-white/10 rounded-t-md absolute bottom-0 z-0"
                            title={`Ideal: ${point.ideal}`}
                          />
                          <span className="text-[8px] text-[#7E848C] mt-2 block">
                            {point.day}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Team Workload chart */}
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#171A1D] space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-purple-400" /> Workload Allocation per Member
                  </h3>
                  <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                    {analytics.workload.map((work) => {
                      const completePercent = getPercentage(work.completed, work.assigned)
                      return (
                        <div key={work.member_name} className="space-y-1 text-left">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-white">{work.member_name}</span>
                            <span className="text-[#A7ADB5]">
                              {work.completed}/{work.assigned} Tasks Done ({completePercent}%)
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="h-2 w-full rounded-full bg-white/[0.04] overflow-hidden flex">
                            <div
                              style={{ width: `${completePercent}%` }}
                              className="h-full bg-[#5BB98C]"
                            />
                            <div
                              style={{ width: `${100 - completePercent}%` }}
                              className="h-full bg-yellow-500/80"
                            />
                          </div>
                        </div>
                      )
                    })}
                    {analytics.workload.length === 0 && (
                      <p className="text-xs text-[#7E848C] italic text-center py-10">No member workload data available.</p>
                    )}
                  </div>
                </div>

                {/* 4. Leaderboard & Overdue List */}
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#171A1D] space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-[#5BB98C]" /> Most Active Members
                  </h3>
                  
                  <div className="space-y-3.5">
                    {analytics.most_active_members.map((member, idx) => (
                      <div key={member.name} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#7E848C] font-bold">#{idx + 1}</span>
                          <span className="text-white font-semibold">{member.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Glow count indicator */}
                          <span className="text-xs font-extrabold text-[#5BB98C] bg-[#5BB98C]/15 border border-[#5BB98C]/20 px-2 py-0.5 rounded-full">
                            {member.actions} Actions
                          </span>
                        </div>
                      </div>
                    ))}
                    {analytics.most_active_members.length === 0 && (
                      <p className="text-xs text-[#7E848C] italic text-center py-10">No activity logged.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Productivity & Time Tracking Reports */}
              {productivityReport && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left mt-6">
                  <div className="lg:col-span-2 p-5 rounded-2xl border border-white/[0.06] bg-[#171A1D] space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-[#5BB98C]" /> Daily Logged Time (7 Days)
                    </h3>
                    <div className="h-48 flex items-end justify-between pt-6 border-b border-white/5 px-2">
                      {productivityReport.daily_totals.map((day) => {
                        const maxVal = Math.max(...productivityReport.daily_totals.map(d => d.logged_seconds), 3600)
                        const heightPercent = getPercentage(day.logged_seconds, maxVal)
                        const hoursLogged = (day.logged_seconds / 3600).toFixed(1)
                        return (
                          <div key={day.date} className="flex flex-col items-center group flex-1">
                            <span className="text-[8px] text-[#5BB98C] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity mb-1 bg-[#1D2024] border border-[#5BB98C]/20 px-1 py-0.2 rounded">
                              {hoursLogged}h
                            </span>
                            <div
                              style={{ height: `${Math.max(4, heightPercent)}%` }}
                              className="w-8 bg-[#5BB98C] rounded-t-md hover:brightness-110 shadow-lg shadow-[#5BB98C]/10 transition-all cursor-pointer"
                            />
                            <span className="text-[8px] text-[#7E848C] mt-2 block font-medium">
                              {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#171A1D] space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-yellow-500" /> Productivity Evaluation
                      </h3>
                      <div className="space-y-2">
                        <p className="text-[10px] text-[#A7ADB5] uppercase font-bold tracking-wide">Report Rating</p>
                        <p className={`text-2xl font-extrabold uppercase ${
                          productivityReport.productivity_rating === 'Elite' ? 'text-emerald-400' :
                          productivityReport.productivity_rating === 'High' ? 'text-blue-400' :
                          productivityReport.productivity_rating === 'Moderate' ? 'text-yellow-500' : 'text-red-400'
                        }`}>
                          {productivityReport.productivity_rating}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-white/[0.06] pt-4">
                      <p className="text-[10px] text-[#7E848C]">Total tracked hours this week</p>
                      <p className="text-3xl font-extrabold text-white mt-1">
                        {productivityReport.total_logged_hours.toFixed(1)} hrs
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Overdue Deadlines Breakdown List */}
              {analytics.overdue_tasks.length > 0 && (
                <div className="border border-[#EB5757]/20 bg-[#EB5757]/5 p-5 rounded-2xl space-y-3 text-left">
                  <h3 className="text-xs font-bold text-[#EB5757] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertOctagon className="h-4.5 w-4.5" /> High Risk Overdue Task Deadlines ({analytics.overdue_count})
                  </h3>

                  <div className="space-y-2.5">
                    {analytics.overdue_tasks.map((task) => (
                      <div key={task.title} className="p-3.5 rounded-xl border border-[#EB5757]/20 bg-[#171A1D] flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white">{task.title}</p>
                          <span className="text-[10px] text-[#7E848C]">Scheduled: {task.due_date}</span>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#EB5757]/15 text-[#EB5757]">
                          {task.days_overdue} Days Overdue
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )
        )}

      </div>
    </MainLayout>
  )
}
