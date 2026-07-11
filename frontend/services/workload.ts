import { api } from './api'

export interface MemberWorkload {
  member_id: string
  user_id: string
  full_name: string
  role: string
  weekly_capacity_hours: number
  assigned_hours: number
  remaining_hours: number
  is_overloaded: boolean
}

export interface CalendarEvent {
  task_id: string
  title: string
  due_date: string | null
  estimated_time: number | null
  assignee_id: string | null
  assignee_name: string
}

export const workloadService = {
  async getWorkspaceWorkload(workspaceId: string): Promise<MemberWorkload[]> {
    const response = await api.get<MemberWorkload[]>('/workloads', {
      params: { workspace_id: workspaceId }
    })
    return response.data
  },

  async updateMemberCapacity(memberId: string, weeklyCapacityHours: number): Promise<any> {
    const response = await api.patch<any>(`/workloads/capacity/${memberId}`, {
      weekly_capacity_hours: weeklyCapacityHours
    })
    return response.data
  },

  async getWorkloadCalendar(workspaceId: string): Promise<CalendarEvent[]> {
    const response = await api.get<CalendarEvent[]>('/workloads/calendar', {
      params: { workspace_id: workspaceId }
    })
    return response.data
  }
}
