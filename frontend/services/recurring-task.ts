import { api } from './api'

export interface RecurringTask {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  project_id: string | null
  assignee_id: string | null
  recurrence_pattern: 'Daily' | 'Weekly' | 'Monthly' | 'Custom'
  recurrence_interval: number
  custom_cron: string | null
  next_run_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RecurringTaskHistory {
  id: string
  recurring_task_id: string
  generated_task_id: string | null
  status: 'Generated' | 'Skipped'
  run_at: string
  created_at: string
}

export const recurringTaskService = {
  /**
   * Configure a new recurring task schedule.
   */
  async createRecurringTask(data: {
    title: string
    description?: string
    status?: string
    priority?: string
    project_id?: string
    assignee_id?: string
    recurrence_pattern: 'Daily' | 'Weekly' | 'Monthly' | 'Custom'
    recurrence_interval?: number
    custom_cron?: string
    next_run_at: string
  }): Promise<RecurringTask> {
    const response = await api.post<RecurringTask>('/recurring-tasks', data)
    return response.data
  },

  /**
   * Retrieve all configured task recurrences.
   */
  async getRecurringTasks(): Promise<RecurringTask[]> {
    const response = await api.get<RecurringTask[]>('/recurring-tasks')
    return response.data
  },

  /**
   * Pause scheduling for a task.
   */
  async pauseRecurrence(id: string): Promise<RecurringTask> {
    const response = await api.patch<RecurringTask>(`/recurring-tasks/${id}/pause`)
    return response.data
  },

  /**
   * Resume scheduling for a task.
   */
  async resumeRecurrence(id: string): Promise<RecurringTask> {
    const response = await api.patch<RecurringTask>(`/recurring-tasks/${id}/resume`)
    return response.data
  },

  /**
   * Skip next execution cycle.
   */
  async skipRecurrence(id: string): Promise<RecurringTask> {
    const response = await api.patch<RecurringTask>(`/recurring-tasks/${id}/skip`)
    return response.data
  },

  /**
   * Get log history.
   */
  async getHistory(id: string): Promise<RecurringTaskHistory[]> {
    const response = await api.get<RecurringTaskHistory[]>(`/recurring-tasks/${id}/history`)
    return response.data
  },

  /**
   * Trigger check.
   */
  async triggerCheck(): Promise<void> {
    await api.post('/recurring-tasks/trigger-check')
  }
}
