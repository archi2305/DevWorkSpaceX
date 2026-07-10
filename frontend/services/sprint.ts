import { api } from './api'

export interface Sprint {
  id: string
  project_id: string
  name: string
  goal: string | null
  duration_weeks: number
  start_date: string | null
  end_date: string | null
  status: 'Planned' | 'Active' | 'Completed'
  created_at: string
  updated_at: string
}

export interface SprintStats {
  sprint_id: string
  name: string
  status: string
  total_tasks: number
  completed_tasks: number
  remaining_tasks: number
  completion_percentage: number
  burndown: { day: string; remaining: number }[]
}

export const sprintService = {
  /**
   * Create a new sprint backlog.
   */
  async createSprint(data: {
    project_id: string
    name: string
    goal?: string
    duration_weeks?: number
  }): Promise<Sprint> {
    const response = await api.post<Sprint>('/sprints', data)
    return response.data
  },

  /**
   * Load project sprints.
   */
  async getSprints(projectId: string, status?: string): Promise<Sprint[]> {
    const response = await api.get<Sprint[]>('/sprints', {
      params: { project_id: projectId, status }
    })
    return response.data
  },

  /**
   * Load details of a specific sprint.
   */
  async getSprint(id: string): Promise<Sprint> {
    const response = await api.get<Sprint>(`/sprints/${id}`)
    return response.data
  },

  /**
   * Update sprint status, goal, names, or timelines.
   */
  async updateSprint(id: string, data: Partial<Sprint>): Promise<Sprint> {
    const response = await api.patch<Sprint>(`/sprints/${id}`, data)
    return response.data
  },

  /**
   * Delete a sprint backlog.
   */
  async deleteSprint(id: string): Promise<void> {
    await api.delete(`/sprints/${id}`)
  },

  /**
   * Bulk assign tasks to a sprint.
   */
  async addTasksToSprint(sprintId: string, taskIds: string[]): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(`/sprints/${sprintId}/tasks`, taskIds)
    return response.data
  },

  /**
   * Evict task from sprint back to project backlog.
   */
  async removeTaskFromSprint(sprintId: string, taskId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/sprints/${sprintId}/tasks/${taskId}`)
    return response.data
  },

  /**
   * Retrieve dynamic progress and burndown stats.
   */
  async getSprintStats(sprintId: string): Promise<SprintStats> {
    const response = await api.get<SprintStats>(`/sprints/${sprintId}/stats`)
    return response.data
  }
}
