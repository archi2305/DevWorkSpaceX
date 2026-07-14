'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { timeLogService } from '@/services/time-log'
import { Clock, Calendar, TrendingUp, Award } from 'lucide-react'

export function TimeTrackingWidget() {
  // Query today's time
  const { data: todaySeconds = 0, isLoading: todayLoading } = useQuery({
    queryKey: ['time-today'],
    queryFn: () => timeLogService.getTodayTime()
  })

  // Query weekly logs
  const { data: weeklyLogs = [], isLoading: weeklyLoading } = useQuery({
    queryKey: ['time-weekly'],
    queryFn: () => timeLogService.getWeeklyLogs()
  })

  // Query productivity report
  const { data: productivity, isLoading: productivityLoading } = useQuery({
    queryKey: ['time-productivity'],
    queryFn: () => timeLogService.getProductivityReport()
  })

  const formatHours = (seconds: number) => {
    const hours = seconds / 3600
    return `${hours.toFixed(2)}h`
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}m`
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Elite': return 'text-purple-400 bg-purple-500/10 border-purple-500/20'
      case 'High': return 'text-[#5BB98C] bg-[#5BB98C]/10 border-[#5BB98C]/20'
      case 'Moderate': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      default: return 'text-[#7E848C] bg-white/5 border-white/10'
    }
  }

  const totalWeeklySeconds = weeklyLogs.reduce((sum, log) => sum + log.logged_seconds, 0)

  if (todayLoading || weeklyLoading || productivityLoading) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#171A1D] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#5BB98C]" /> Time Tracking
          </h3>
          <div className="h-2 w-2 rounded-full bg-[#7E848C] animate-pulse" />
        </div>
        <div className="text-xs text-[#7E848C]">Loading time data...</div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#171A1D] p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#5BB98C]" /> Time Tracking
        </h3>
        {productivity && (
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getRatingColor(productivity.productivity_rating)}`}>
            {productivity.productivity_rating}
          </span>
        )}
      </div>

      {/* Today's Time */}
      <div className="p-3 rounded-xl bg-[#1D2024] border border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-[#5BB98C]" />
            <span className="text-[10px] text-[#A7ADB5] font-semibold">Today</span>
          </div>
          <span className="text-lg font-bold text-white">{formatTime(todaySeconds)}</span>
        </div>
      </div>

      {/* Weekly Time */}
      <div className="p-3 rounded-xl bg-[#1D2024] border border-white/[0.04]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-[#5BB98C]" />
            <span className="text-[10px] text-[#A7ADB5] font-semibold">This Week</span>
          </div>
          <span className="text-lg font-bold text-white">{formatHours(totalWeeklySeconds)}</span>
        </div>
        
        {/* Weekly Bar Chart */}
        <div className="flex items-end gap-1 h-8 mt-2">
          {weeklyLogs.map((log, idx) => {
            const maxSeconds = Math.max(...weeklyLogs.map(l => l.logged_seconds), 1)
            const height = (log.logged_seconds / maxSeconds) * 100
            const isToday = idx === weeklyLogs.length - 1
            
            return (
              <div
                key={log.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className={`w-full rounded-t-sm transition-all ${
                    isToday ? 'bg-[#5BB98C]' : 'bg-white/20'
                  }`}
                  style={{ height: `${Math.max(height, 10)}%` }}
                />
                <span className={`text-[8px] ${isToday ? 'text-[#5BB98C] font-bold' : 'text-[#7E848C]'}`}>
                  {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Productivity Stats */}
      {productivity && (
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-[#1D2024] border border-white/[0.04] text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="h-3 w-3 text-[#5BB98C]" />
              <span className="text-[9px] text-[#A7ADB5] font-semibold">Total</span>
            </div>
            <span className="text-sm font-bold text-white">{productivity.total_logged_hours}h</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#1D2024] border border-white/[0.04] text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-[#5BB98C]" />
              <span className="text-[9px] text-[#A7ADB5] font-semibold">Avg/Day</span>
            </div>
            <span className="text-sm font-bold text-white">
              {(productivity.total_logged_hours / 7).toFixed(2)}h
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
