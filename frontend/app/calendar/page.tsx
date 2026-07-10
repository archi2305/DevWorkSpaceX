'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  ListTodo,
  Loader,
  FolderOpen
} from 'lucide-react'
import { calendarService, CalendarEventResponse } from '@/services/calendar'
import { taskService } from '@/services/task'
import { projectService } from '@/services/project'

export default function CalendarPage() {
  const queryClient = useQueryClient()

  // Selected date & calendar configuration
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Create Task dialog pre-fill properties
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskProjectId, setTaskProjectId] = useState('')
  const [taskPriority, setTaskPriority] = useState('Medium')
  const [taskStatus, setTaskStatus] = useState('Todo')
  const [taskDueDate, setTaskDueDate] = useState('')

  // Load unified calendar events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => calendarService.getCalendarEvents()
  })

  // Load projects list for dropdown selectors
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects()
  })

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setShowCreateModal(false)
      setTaskTitle('')
      setTaskProjectId('')
    }
  })

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    // Pre-fill task due date input box (local timezone date format yyyy-MM-dd)
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    setTaskDueDate(offsetDate.toISOString().split('T')[0])
    setShowCreateModal(true)
  }

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    createTaskMutation.mutate({
      title: taskTitle,
      due_date: taskDueDate || undefined,
      project_id: taskProjectId || undefined,
      priority: taskPriority,
      status: taskStatus,
      completed: taskStatus === 'Done'
    })
  }

  // Monthly Calendar Math helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 0)
  
  const firstDayIndex = (startOfMonth.getDay() + 6) % 7 // Monday base index (0 to 6)
  const daysInMonth = endOfMonth.getDate()

  // Generate 35 to 42 cells for calendar grid
  const calendarCells: (Date | null)[] = []
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(new Date(year, month, i))
  }
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null)
  }

  // Week Grid helper mapping
  const getWeekDays = (baseDate: Date) => {
    const currentDay = baseDate.getDay()
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay
    const monday = new Date(baseDate)
    monday.setDate(baseDate.getDate() + distanceToMonday)
    
    return Array.from({ length: 7 }).map((_, idx) => {
      const day = new Date(monday)
      day.setDate(monday.getDate() + idx)
      return day
    })
  }
  const weekDays = getWeekDays(currentDate)

  // Navigation shifts
  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1))
    } else if (viewMode === 'week') {
      const shifted = new Date(currentDate)
      shifted.setDate(currentDate.getDate() - 7)
      setCurrentDate(shifted)
    } else {
      const shifted = new Date(currentDate)
      shifted.setDate(currentDate.getDate() - 1)
      setCurrentDate(shifted)
    }
  }

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1))
    } else if (viewMode === 'week') {
      const shifted = new Date(currentDate)
      shifted.setDate(currentDate.getDate() + 7)
      setCurrentDate(shifted)
    } else {
      const shifted = new Date(currentDate)
      shifted.setDate(currentDate.getDate() + 1)
      setCurrentDate(shifted)
    }
  }

  // Filter events by selected date
  const isSameDay = (d1: Date, d2String: string) => {
    try {
      const d2 = new Date(d2String)
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate()
    } catch {
      return false
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(e => isSameDay(date, e.due_date))
  }

  // Due today events count
  const dueTodayEvents = events.filter(e => isSameDay(new Date(), e.due_date))

  // Overdue task counts
  const overdueEvents = events.filter(e => {
    const due = new Date(e.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return due < today && !e.completed
  })

  // Upcoming within 7 days
  const upcomingEvents = events.filter(e => {
    const due = new Date(e.due_date)
    const today = new Date()
    const limit = new Date()
    limit.setDate(today.getDate() + 7)
    return due >= today && due <= limit
  })

  const getPriorityColor = (priority: string | null) => {
    if (priority === 'High' || priority === 'Urgent') return 'bg-[#EB5757]'
    if (priority === 'Medium') return 'bg-yellow-500'
    return 'bg-[#7E848C]'
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        
        {/* Left main workspace */}
        <div className="flex-1 space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
            <div className="text-left">
              <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-[#5BB98C]" /> Calendar Planner
              </h1>
              <p className="text-xs text-[#A7ADB5] mt-1">Track deadlines and schedule project deliverables.</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Shift buttons */}
              <div className="flex items-center bg-[#171A1D] rounded-xl border border-white/[0.06] p-1">
                <button
                  onClick={prevPeriod}
                  className="p-1.5 rounded-lg hover:bg-[#23272B] text-[#A7ADB5] hover:text-[#F5F5F5] transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-[#F5F5F5] px-3.5 min-w-[120px] text-center">
                  {viewMode === 'month'
                    ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
                    : viewMode === 'week'
                    ? `Week of ${weekDays[0].toLocaleDateString('default', { month: 'short', day: 'numeric' })}`
                    : currentDate.toLocaleDateString('default', { dateStyle: 'medium' })}
                </span>
                <button
                  onClick={nextPeriod}
                  className="p-1.5 rounded-lg hover:bg-[#23272B] text-[#A7ADB5] hover:text-[#F5F5F5] transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* View Modes togglers */}
              <div className="flex rounded-xl bg-[#171A1D] p-1 border border-white/[0.06]">
                {(['month', 'week', 'agenda'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                      viewMode === mode ? 'bg-[#5BB98C] text-[#111315]' : 'text-[#A7ADB5] hover:text-[#F5F5F5]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-60 items-center justify-center">
              <Loader className="h-7 w-7 text-[#5BB98C] animate-spin" />
            </div>
          ) : (
            <>
              {/* View Grid rendering */}
              {viewMode === 'month' && (
                <div className="border border-white/[0.06] rounded-2xl overflow-hidden bg-[#171A1D]/40 backdrop-blur-sm shadow-xl">
                  {/* Weekday Labels */}
                  <div className="grid grid-cols-7 border-b border-white/[0.06] bg-[#171A1D] py-2 text-center text-[10px] font-bold text-[#7E848C] uppercase tracking-wider">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <div key={day}>{day}</div>
                    ))}
                  </div>

                  {/* Days cells */}
                  <div className="grid grid-cols-7 auto-rows-[90px] bg-[#111315]/40">
                    {calendarCells.map((cell, idx) => {
                      const dayEvents = cell ? getEventsForDate(cell) : []
                      const isToday = cell && isSameDay(new Date(), cell.toISOString())
                      
                      return (
                        <div
                          key={idx}
                          onClick={() => cell && handleDateClick(cell)}
                          className={`p-1.5 border-r border-b border-white/[0.04] text-left hover:bg-[#1D2024]/40 transition-colors flex flex-col justify-between cursor-pointer ${
                            isToday ? 'bg-[#5BB98C]/5' : ''
                          }`}
                        >
                          {cell ? (
                            <>
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[10px] font-bold ${
                                    isToday
                                      ? 'bg-[#5BB98C] text-[#111315] h-5 w-5 rounded-full flex items-center justify-center'
                                      : 'text-[#A7ADB5]'
                                  }`}
                                >
                                  {cell.getDate()}
                                </span>
                                {dayEvents.length > 0 && (
                                  <span className="text-[8px] text-[#5BB98C] bg-[#5BB98C]/15 border border-[#5BB98C]/20 px-1 py-0.5 rounded-full font-bold">
                                    {dayEvents.length} Item{dayEvents.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>

                              <div className="flex-1 mt-1 space-y-0.5 overflow-y-auto max-h-[60px] scrollbar-none">
                                {dayEvents.slice(0, 3).map((event) => (
                                  <div
                                    key={event.id}
                                    className={`px-1.5 py-0.5 rounded text-[8px] truncate font-medium border ${
                                      event.completed
                                        ? 'bg-[#5BB98C]/5 border-[#5BB98C]/20 text-[#5BB98C]/70 line-through'
                                        : event.type === 'project'
                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                        : 'bg-[#1D2024] border-white/5 text-[#F5F5F5]'
                                    }`}
                                  >
                                    {event.type === 'project' ? '🚀 ' : ''}
                                    {event.title}
                                  </div>
                                ))}
                                {dayEvents.length > 3 && (
                                  <div className="text-[7px] text-[#7E848C] italic text-center">
                                    +{dayEvents.length - 3} more
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <div />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Weekly View Grid */}
              {viewMode === 'week' && (
                <div className="grid grid-cols-7 gap-3">
                  {weekDays.map((day) => {
                    const dayEvents = getEventsForDate(day)
                    const isToday = isSameDay(new Date(), day.toISOString())

                    return (
                      <div
                        key={day.toISOString()}
                        className={`flex flex-col border rounded-2xl bg-[#171A1D]/40 min-h-[400px] overflow-hidden ${
                          isToday ? 'border-[#5BB98C]/30 bg-[#5BB98C]/5' : 'border-white/[0.06]'
                        }`}
                      >
                        {/* Day Card Header */}
                        <div
                          onClick={() => handleDateClick(day)}
                          className="p-3 border-b border-white/[0.06] bg-[#171A1D] text-center cursor-pointer hover:bg-[#1D2024] transition-colors"
                        >
                          <p className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider">
                            {day.toLocaleDateString('default', { weekday: 'short' })}
                          </p>
                          <p className={`text-base font-bold mt-1 ${isToday ? 'text-[#5BB98C]' : 'text-white'}`}>
                            {day.getDate()}
                          </p>
                        </div>

                        {/* List events */}
                        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className={`p-2.5 rounded-xl border flex flex-col justify-between text-left space-y-1.5 ${
                                event.completed
                                  ? 'bg-[#5BB98C]/5 border-[#5BB98C]/20 text-[#5BB98C]/70 line-through'
                                  : event.type === 'project'
                                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                  : 'bg-[#1D2024] border-white/5 text-[#F5F5F5]'
                              }`}
                            >
                              <p className="text-[10px] font-semibold leading-relaxed">
                                {event.type === 'project' && <span className="text-[8px] bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded px-1 py-0.2 mr-1">Project</span>}
                                {event.title}
                              </p>
                              {event.priority && (
                                <div className="flex items-center gap-1">
                                  <span className={`h-1.5 w-1.5 rounded-full ${getPriorityColor(event.priority)}`} />
                                  <span className="text-[8px] text-[#7E848C] font-bold uppercase">{event.priority}</span>
                                </div>
                              )}
                            </div>
                          ))}
                          {dayEvents.length === 0 && (
                            <div className="h-full flex items-center justify-center py-20">
                              <span className="text-[9px] text-[#7E848C] italic">No items due</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Agenda agenda list */}
              {viewMode === 'agenda' && (
                <div className="border border-white/[0.06] rounded-2xl bg-[#171A1D] p-5 space-y-4 text-left">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <ListTodo className="h-4.5 w-4.5 text-[#5BB98C]" /> Agenda for {selectedDate.toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </h3>
                  
                  <div className="space-y-2.5">
                    {getEventsForDate(selectedDate).map((event) => (
                      <div
                        key={event.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between ${
                          event.completed
                            ? 'bg-[#5BB98C]/5 border-[#5BB98C]/20 text-[#5BB98C]/70 line-through'
                            : 'bg-[#1D2024] border-white/5 text-[#F5F5F5]'
                        }`}
                      >
                        <div className="space-y-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                            event.type === 'project' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-[#171A1D] border-white/5 text-[#7E848C]'
                          }`}>
                            {event.type}
                          </span>
                          <p className="text-xs font-semibold mt-1.5">{event.title}</p>
                          {event.project_name && (
                            <span className="text-[10px] text-[#7E848C]">Project: {event.project_name}</span>
                          )}
                        </div>
                        {event.priority && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            event.priority === 'High' ? 'bg-[#EB5757]/15 text-[#EB5757]' : 'bg-[#7E848C]/10 text-[#7E848C]'
                          }`}>
                            {event.priority}
                          </span>
                        )}
                      </div>
                    ))}
                    {getEventsForDate(selectedDate).length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-xs text-[#7E848C] italic">No deliverables or tasks scheduled for this day.</p>
                        <button
                          onClick={() => handleDateClick(selectedDate)}
                          className="mt-3 inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-[#5BB98C]/15 border border-[#5BB98C]/20 text-[10px] text-[#5BB98C] font-bold"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Task
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Right side: Widgets and filters */}
        <div className="w-full lg:w-72 space-y-6 text-left flex-shrink-0">
          
          {/* Overdue alerts */}
          {overdueEvents.length > 0 && (
            <div className="rounded-2xl border border-[#EB5757]/20 bg-[#EB5757]/5 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-[#EB5757]">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Overdue Deadlines ({overdueEvents.length})</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {overdueEvents.slice(0, 5).map((e) => (
                  <div key={e.id} className="p-2.5 bg-[#171A1D] border border-white/[0.04] rounded-xl text-left">
                    <p className="text-[10px] font-semibold text-[#F5F5F5] truncate">{e.title}</p>
                    <span className="text-[8px] text-[#EB5757] block mt-0.5">
                      Due {new Date(e.due_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Due Today */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#171A1D] p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#5BB98C]" /> Due Today ({dueTodayEvents.length})
            </h3>
            <div className="space-y-2">
              {dueTodayEvents.slice(0, 3).map((e) => (
                <div key={e.id} className="p-2.5 bg-[#1D2024] rounded-xl flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-white truncate max-w-[150px]">{e.title}</p>
                  <span className={`h-1.5 w-1.5 rounded-full ${e.completed ? 'bg-[#5BB98C]' : 'bg-[#EB5757]'}`} />
                </div>
              ))}
              {dueTodayEvents.length === 0 && (
                <p className="text-[10px] text-[#7E848C] italic">No items due today.</p>
              )}
            </div>
          </div>

          {/* Upcoming week summary */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#171A1D] p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" /> Next 7 Days ({upcomingEvents.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {upcomingEvents.map((e) => (
                <div key={e.id} className="p-2.5 bg-[#1D2024] rounded-xl text-left">
                  <p className="text-[10px] font-semibold text-white truncate">{e.title}</p>
                  <p className="text-[8px] text-[#7E848C] mt-0.5">
                    Due {new Date(e.due_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <p className="text-[10px] text-[#7E848C] italic">No upcoming deadlines.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Create Task Modal Overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-[#1D2024]/40">
              <h3 className="text-sm font-bold text-white">Create Task for {new Date(taskDueDate + 'T12:00:00').toLocaleDateString()}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-[#7E848C] hover:text-[#F5F5F5] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Landing Page"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-white placeholder-[#7E848C] outline-none focus:border-[#5BB98C]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block">Associate Project (Optional)</label>
                <select
                  value={taskProjectId}
                  onChange={(e) => setTaskProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-white outline-none cursor-pointer focus:border-[#5BB98C]"
                >
                  <option value="">No Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-white outline-none cursor-pointer focus:border-[#5BB98C]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block">Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-white outline-none cursor-pointer focus:border-[#5BB98C]"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={createTaskMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-xs font-bold text-[#111315] shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {createTaskMutation.isPending ? 'Saving...' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}

    </MainLayout>
  )
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}
