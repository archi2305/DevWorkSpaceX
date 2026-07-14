import { api } from './api'

export interface Milestone {
  id: string
  project_id: string
  title: string
  description: string | null
  due_date: string | null
  status: string // 'Planned', 'Active', 'Completed'
  is_archived: boolean
  progress_percentage: number
  total_tasks: number
  completed_tasks: number
  created_at: string
  updated_at: string
}

export interface MilestoneStats {
  milestone_id: string
  title: string
  status: string
  total_tasks: number
  completed_tasks: number
  remaining_tasks: number
  completion_percentage: number
  due_date: string | null
  is_archived: boolean
  timeline: { label: string; date: string; status: string }[]
  tasks: any[]
}

export const milestoneService = {
  async getMilestones(projectId: string, filters?: Record<string, any>): Promise<Milestone[]> {
    const params = { project_id: projectId, ...filters }
    const response = await api.get<Milestone[]>('/milestones', { params })
    return response.data
  },

  async getMilestoneById(id: string): Promise<Milestone> {
    const response = await api.get<Milestone>(`/milestones/${id}`)
    return response.data
  },

  async createMilestone(data: {
    project_id: string
    title: string
    description?: string
    due_date?: string
    status?: string
  }): Promise<Milestone> {
    const response = await api.post<Milestone>('/milestones', data)
    return response.data
  },

  async updateMilestone(id: string, data: Partial<Milestone>): Promise<Milestone> {
    const response = await api.patch<Milestone>(`/milestones/${id}`, data)
    return response.data
  },

  async archiveMilestone(id: string): Promise<Milestone> {
    const response = await api.post<Milestone>(`/milestones/${id}/archive`)
    return response.data
  },

  async deleteMilestone(id: string): Promise<void> {
    await api.delete(`/milestones/${id}`)
  },

  async assignTasksToMilestone(id: string, taskIds: string[]): Promise<any> {
    const response = await api.post<any>(`/milestones/${id}/tasks`, { task_ids: taskIds })
    return response.data
  },

  async removeTaskFromMilestone(id: string, taskId: string): Promise<any> {
    const response = await api.delete<any>(`/milestones/${id}/tasks/${taskId}`)
    return response.data
  },

  async getMilestoneStats(id: string): Promise<MilestoneStats> {
    const response = await api.get<MilestoneStats>(`/milestones/${id}/stats`)
    return response.data
  },

  async getUpcomingMilestones(limit = 5): Promise<MilestoneStats[]> {
    const response = await api.get<MilestoneStats[]>('/milestones/upcoming', { params: { limit } })
    return response.data
  }
}
