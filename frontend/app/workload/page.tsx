'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import { workloadService, MemberWorkload, CalendarEvent } from '@/services/workload'
import { teamService } from '@/services/team'
import {
  Calendar as CalendarIcon,
  User,
  Users,
  AlertTriangle,
  Clock,
  Settings,
  Plus,
  Loader,
  TrendingUp,
  LayoutGrid,
  CheckCircle,
  Sparkles,
  Edit2
} from 'lucide-react'

export default function WorkloadPage() {
  const queryClient = useQueryClient()
  const workspaceId = "d72ac7f3-8d53-486b-bb65-71a694ce8237" // Current Workspace context

  // Capacity Edit States
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [newCapacity, setNewCapacity] = useState<number>(40)

  // Load Workload Statistics
  const { data: workloads = [], isLoading: loadingWorkload, refetch: refetchWorkload } = useQuery({
    queryKey: ['workspace-workload', workspaceId],
    queryFn: () => workloadService.getWorkspaceWorkload(workspaceId),
    enabled: !!workspaceId
  })

  // Load Workload Calendar load events
  const { data: calendarEvents = [], isLoading: loadingCalendar } = useQuery({
    queryKey: ['workload-calendar', workspaceId],
    queryFn: () => workloadService.getWorkloadCalendar(workspaceId),
    enabled: !!workspaceId
  })

  // Update capacity mutation
  const updateCapacityMutation = useMutation({
    mutationFn: (data: { memberId: string; hours: number }) =>
      workloadService.updateMemberCapacity(data.memberId, data.hours),
    onSuccess: () => {
      setEditingMemberId(null)
      queryClient.invalidateQueries({ queryKey: ['workspace-workload', workspaceId] })
    }
  })

  const handleCapacitySubmit = (e: React.FormEvent, memberId: string) => {
    e.preventDefault()
    if (newCapacity <= 0) return
    updateCapacityMutation.mutate({ memberId, hours: newCapacity })
  }

  // Calculate metrics
  const totalAssigned = workloads.reduce((sum, w) => sum + w.assigned_hours, 0)
  const totalCapacity = workloads.reduce((sum, w) => sum + w.weekly_capacity_hours, 0)
  const overloadedMembers = workloads.filter(w => w.is_overloaded)
  const percentUtilization = totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        
        {/* Header Block */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <Users className="h-6 w-6 text-[#5BB98C]" /> Workload Planning
            </h1>
            <p className="text-xs text-[#A7ADB5] mt-1">Audit capacity thresholds, balance task loads, and detect overloaded engineers.</p>
          </div>
        </div>

        {/* Stats Grid Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-4.5 space-y-2">
            <span className="text-[10px] text-[#A7ADB5] font-extrabold uppercase tracking-wider block">Total Allocated Hours</span>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#5BB98C]" />
              <span className="text-2xl font-bold text-white">{totalAssigned} hrs</span>
            </div>
            <span className="text-[9px] text-[#7E848C] block">Across all active project milestones & tasks</span>
          </div>

          <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-4.5 space-y-2">
            <span className="text-[10px] text-[#A7ADB5] font-extrabold uppercase tracking-wider block">Workspace Capacity</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#5BB98C]" />
              <span className="text-2xl font-bold text-white">{totalCapacity} hrs</span>
            </div>
            <span className="text-[9px] text-[#7E848C] block">Combined capacity of all developers</span>
          </div>

          <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-4.5 space-y-2">
            <span className="text-[10px] text-[#A7ADB5] font-extrabold uppercase tracking-wider block">Utilization Percentage</span>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#5BB98C]" />
              <span className={`text-2xl font-bold ${percentUtilization > 100 ? 'text-[#EB5757]' : 'text-white'}`}>{percentUtilization}%</span>
            </div>
            <span className="text-[9px] text-[#7E848C] block">Optimal limit target: 70% - 90%</span>
          </div>

          <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-4.5 space-y-2">
            <span className="text-[10px] text-[#A7ADB5] font-extrabold uppercase tracking-wider block">Overloaded Members</span>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${overloadedMembers.length > 0 ? 'text-[#EB5757]' : 'text-[#7E848C]/40'}`} />
              <span className="text-2xl font-bold text-white">{overloadedMembers.length} members</span>
            </div>
            <span className="text-[9px] text-[#7E848C] block">Requires workload redistribution</span>
          </div>
        </div>

        {/* Content Section Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Workload list & capacity dials */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-[#5BB98C]" /> Developers Load allocation
              </h2>

              {loadingWorkload ? (
                <div className="flex justify-center py-6"><Loader className="h-6 w-6 text-[#5BB98C] animate-spin" /></div>
              ) : (
                <div className="space-y-4">
                  {workloads.map((wl) => {
                    const pct = wl.weekly_capacity_hours > 0 ? Math.round((wl.assigned_hours / wl.weekly_capacity_hours) * 100) : 0
                    
                    return (
                      <div key={wl.member_id} className="p-4 bg-[#1D2024]/80 border border-white/[0.04] rounded-xl hover:border-white/10 transition-all flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="h-8 w-8 bg-[#171A1D] border border-white/[0.06] text-[#5BB98C] rounded-full flex items-center justify-center font-bold text-xs uppercase">
                              {wl.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                            <div className="text-left">
                              <h4 className="text-xs font-bold text-white">{wl.full_name}</h4>
                              <p className="text-[9px] text-[#A7ADB5]">{wl.role}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {editingMemberId === wl.member_id ? (
                              <form onSubmit={(e) => handleCapacitySubmit(e, wl.member_id)} className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={newCapacity}
                                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                                  className="w-16 px-2 py-1 bg-[#171A1D] border border-white/[0.06] rounded text-xs text-white outline-none"
                                />
                                <button type="submit" className="text-[10px] font-bold text-[#5BB98C] hover:underline">Save</button>
                                <button type="button" onClick={() => setEditingMemberId(null)} className="text-[10px] font-bold text-[#EB5757] hover:underline">Cancel</button>
                              </form>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingMemberId(wl.member_id)
                                  setNewCapacity(wl.weekly_capacity_hours)
                                }}
                                className="text-[#A7ADB5] hover:text-[#5BB98C] p-1 rounded hover:bg-white/5"
                                title="Edit capacity"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Capacity Load Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-[#A7ADB5] font-semibold">
                            <span>Weekly Load Ratio ({wl.assigned_hours}/{wl.weekly_capacity_hours} hrs)</span>
                            <span className={wl.is_overloaded ? 'text-[#EB5757]' : 'text-[#5BB98C]'}>{pct}%</span>
                          </div>
                          <div className="w-full bg-[#171A1D] border border-white/[0.04] h-2 rounded-full overflow-hidden">
                            <div className={`h-2 rounded-full transition-all duration-300 ${
                              wl.is_overloaded ? 'bg-[#EB5757]' : 'bg-[#5BB98C]'
                            }`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <div className="flex justify-between text-[9px] text-[#7E848C]">
                            <span>Capacity: {wl.weekly_capacity_hours} hrs/week</span>
                            <span>{wl.is_overloaded ? 'Overloaded' : `${wl.remaining_hours} hrs available`}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Availability Calendar grid mapping */}
            <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-[#5BB98C]" /> Availability Calendar (Task Load distribution)
              </h2>

              <div className="bg-[#111315]/40 border border-white/[0.06] rounded-xl p-4.5 grid grid-cols-7 gap-2 text-center">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <span key={day} className="text-[10px] font-extrabold text-[#7E848C] uppercase">{day}</span>
                ))}

                {/* Draw 28 dummy day cells mapping estimated daily loads */}
                {Array.from({ length: 28 }).map((_, i) => {
                  const dayOffset = i + 1
                  // Sample allocations: highlight days with heavy estimated task load
                  const dayLoad = calendarEvents.filter(e => e.due_date && new Date(e.due_date).getDate() % 28 === dayOffset)
                  const dayHours = dayLoad.reduce((sum, e) => sum + (e.estimated_time || 0), 0)

                  return (
                    <div key={i} className="min-h-[50px] p-1 border border-white/[0.03] bg-[#171A1D]/80 rounded-lg flex flex-col justify-between items-start text-[10px]">
                      <span className="text-[#7E848C] font-semibold">{dayOffset}</span>
                      {dayHours > 0 && (
                        <span className={`w-full text-center py-0.5 rounded text-[8px] font-bold ${
                          dayHours > 16 ? 'bg-[#EB5757]/15 text-[#EB5757]' : 'bg-[#5BB98C]/15 text-[#5BB98C]'
                        }`} title={`${dayLoad.length} tasks due`}>
                          {dayHours} hrs
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Right column: Overloaded Members list */}
          <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 space-y-4 h-fit">
            <div>
              <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-[#EB5757]" /> Overloaded warnings
              </h2>
              <p className="text-[10px] text-[#A7ADB5] mt-1">Detect developers who exceed their weekly capacity.</p>
            </div>

            <div className="space-y-3">
              {overloadedMembers.map((wl) => (
                <div key={wl.member_id} className="p-3 bg-[#EB5757]/5 border border-[#EB5757]/20 rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#EB5757]" />
                    <span className="text-xs font-bold text-white">{wl.full_name}</span>
                  </div>
                  <p className="text-[10px] text-[#A7ADB5]">
                    Allocated workload: <strong className="text-[#EB5757]">{wl.assigned_hours} hrs</strong> (Capacity is {wl.weekly_capacity_hours} hrs)
                  </p>
                  <p className="text-[9px] text-[#7E848C]">Exceeds capacity limit by {wl.assigned_hours - wl.weekly_capacity_hours} hours. Please redistribute blocker items.</p>
                </div>
              ))}
              {overloadedMembers.length === 0 && (
                <div className="p-4 border border-dashed border-white/[0.06] rounded-xl text-center space-y-1">
                  <CheckCircle className="h-6 w-6 text-[#5BB98C] mx-auto" />
                  <p className="text-xs font-bold text-white">Workload Balanced</p>
                  <p className="text-[9px] text-[#7E848C]">No overloaded members detected in this workspace cycle.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </MainLayout>
  )
}
