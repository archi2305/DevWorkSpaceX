import { api } from './api'

export interface TimeLog {
  id: string
  user_id: string
  task_id?: string
  project_id?: string
  sprint_id?: string
  start_time: string
  end_time?: string
  duration_seconds?: number
  description?: string
  is_running: boolean
  created_at: string
  updated_at: string
}

export interface TimeTotals {
  total_task_seconds: number
  total_sprint_seconds: number
  total_project_seconds: number
}

export interface ProductivityReportItem {
  date: string
  logged_seconds: number
}

export interface ProductivityReport {
  daily_totals: ProductivityReportItem[]
  productivity_rating: 'Low' | 'Moderate' | 'High' | 'Elite'
  total_logged_hours: number
}

export const timeLogService = {
  /**
   * Start a running timer segment.
   */
  async startTimer(data: {
    task_id?: string
    project_id?: string
    sprint_id?: string
    description?: string
  }): Promise<TimeLog> {
    const response = await api.post<TimeLog>('/time-logs/start', data)
    return response.data
  },

  /**
   * Stop the currently running timer segment.
   */
  async stopTimer(): Promise<TimeLog> {
    const response = await api.post<TimeLog>('/time-logs/stop')
    return response.data
  },

  /**
   * Pause the active timer segment.
   */
  async pauseTimer(): Promise<TimeLog> {
    const response = await api.post<TimeLog>('/time-logs/pause')
    return response.data
  },

  /**
   * Resume tracking a segment.
   */
  async resumeTimer(data: {
    task_id?: string
    project_id?: string
    sprint_id?: string
    description?: string
  }): Promise<TimeLog> {
    const response = await api.post<TimeLog>('/time-logs/resume', data)
    return response.data
  },

  /**
   * Manually log a time entry.
   */
  async logManualTime(data: {
    task_id?: string
    project_id?: string
    sprint_id?: string
    start_time: string
    end_time: string
    description?: string
  }): Promise<TimeLog> {
    const response = await api.post<TimeLog>('/time-logs/manual', data)
    return response.data
  },

  /**
   * List time logs optionally filtered.
   */
  async getTimeLogs(params?: {
    task_id?: string
    project_id?: string
    sprint_id?: string
  }): Promise<TimeLog[]> {
    const response = await api.get<TimeLog[]>('/time-logs', { params })
    return response.data
  },

  /**
   * Get total logged durations.
   */
  async getTimeTotals(params?: {
    task_id?: string
    sprint_id?: string
    project_id?: string
  }): Promise<TimeTotals> {
    const response = await api.get<TimeTotals>('/time-logs/totals', { params })
    return response.data
  },

  /**
   * Get productivity reports.
   */
  async getProductivityReport(): Promise<ProductivityReport> {
    const response = await api.get<ProductivityReport>('/time-logs/report')
    return response.data
  }
}
