import { api } from './api'

export interface Sprint {
  id: string
  project_id: string
  name: string
  goal: string | null
  description: string | null
  duration_weeks: number
  start_date: string | null
  end_date: string | null
  status: 'Planned' | 'Active' | 'Completed'
  is_archived: boolean
  archived_at: string | null
  total_story_points: number
  completed_story_points: number
  created_at: string
  updated_at: string
}

export interface SprintStats {
  sprint_id: string
  name: string
  goal: string | null
  description: string | null
  status: string
  start_date: string | null
  end_date: string | null
  total_tasks: number
  completed_tasks: number
  remaining_tasks: number
  total_story_points: number
  completed_story_points: number
  remaining_story_points: number
  velocity: number
  completion_percentage: number
  burndown: { day: string; remaining: number }[]
  tasks: any[]
}

export const sprintService = {
  /**
   * Create a new sprint backlog.
   */
  async createSprint(data: {
    project_id: string
    name: string
    goal?: string
    description?: string
    duration_weeks?: number
    start_date?: string
    end_date?: string
  }): Promise<Sprint> {
    const response = await api.post<Sprint>('/sprints', data)
    return response.data
  },

  /**
   * Load project sprints.
   */
  async getSprints(projectId: string, status?: string, includeArchived = false): Promise<Sprint[]> {
    const response = await api.get<Sprint[]>('/sprints', {
      params: { project_id: projectId, status, include_archived: includeArchived }
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

  async startSprint(id: string): Promise<Sprint> {
    const response = await api.post<Sprint>(`/sprints/${id}/start`)
    return response.data
  },

  async completeSprint(id: string): Promise<Sprint> {
    const response = await api.post<Sprint>(`/sprints/${id}/complete`)
    return response.data
  },

  async archiveSprint(id: string): Promise<Sprint> {
    const response = await api.post<Sprint>(`/sprints/${id}/archive`)
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
    const response = await api.post<{ message: string }>(`/sprints/${sprintId}/tasks`, { task_ids: taskIds })
    return response.data
  },

  /**
   * Evict task from sprint back to project backlog.
   */
  async removeTaskFromSprint(sprintId: string, taskId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/sprints/${sprintId}/tasks/${taskId}`)
    return response.data
  },

  async moveTasksBetweenSprints(
    sourceSprintId: string,
    taskIds: string[],
    targetSprintId?: string | null
  ): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(`/sprints/${sourceSprintId}/move-tasks`, {
      task_ids: taskIds,
      target_sprint_id: targetSprintId || null
    })
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
