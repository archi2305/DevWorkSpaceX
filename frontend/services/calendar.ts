import { api } from './api'

export interface CalendarEventResponse {
  id: string
  type: 'task' | 'project'
  title: string
  due_date: string
  status: string | null
  priority: string | null
  project_name: string | null
  progress: number | null
  completed: boolean | null
}

export const calendarService = {
  /**
   * Load unified calendar deadlines events.
   */
  async getCalendarEvents(params?: {
    start_date?: string
    end_date?: string
  }): Promise<CalendarEventResponse[]> {
    const response = await api.get<CalendarEventResponse[]>('/calendar/events', { params })
    return response.data
  }
}
