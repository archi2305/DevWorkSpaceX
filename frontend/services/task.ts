import { api } from './api'

export interface TaskCreateInput {
  title: string
  description?: string
  status?: string // 'Todo', 'In Progress', 'Review', 'Done'
  labels?: string
  due_date?: string
  priority?: string
  assignee_id?: string
  project_id?: string
  completed?: boolean
}

export interface TaskResponse {
  id: string
  title: string
  description: string | null
  status: string
  labels: any[]
  due_date: string | null
  priority: string
  completed: boolean
  assignee_id: string | null
  project_id: string | null
  story_points?: number | null
  estimated_time?: number | null
  is_archived?: boolean
  attachments?: { name: string; url: string }[] | null
  sprint_id?: string | null
  assignee?: {
    id: string
    full_name: string
    profile_image: string | null
  } | null
  created_at: string
  updated_at: string
}

export const taskService = {
  /**
   * Fetch tasks, optionally filtered by project_id.
   */
  async getTasks(projectId?: string, filters?: Record<string, any>): Promise<TaskResponse[]> {
    const params = {
      ...(projectId ? { project_id: projectId } : {}),
      ...filters
    }
    const response = await api.get<TaskResponse[]>('/tasks', { params })
    return response.data
  },

  /**
   * Fetch all incomplete tasks assigned to the logged-in user.
   */
  async getUpcomingTasks(): Promise<TaskResponse[]> {
    const response = await api.get<TaskResponse[]>('/tasks/upcoming')
    return response.data
  },

  /**
   * Create a new task in the workspace.
   */
  async createTask(data: any): Promise<TaskResponse> {
    const response = await api.post<TaskResponse>('/tasks', data)
    return response.data
  },

  /**
   * Update task details (e.g. status columns, due dates, descriptions).
   */
  async updateTask(taskId: string, data: Partial<TaskResponse>): Promise<TaskResponse> {
    const response = await api.patch<TaskResponse>(`/tasks/${taskId}`, data)
    return response.data
  },

  /**
   * Update task completed status (e.g. checking it off).
   */
  async toggleTaskComplete(taskId: string, completed: boolean): Promise<TaskResponse> {
    const response = await api.patch<TaskResponse>(`/tasks/${taskId}`, { completed })
    return response.data
  },

  /**
   * Delete a task.
   */
  async deleteTask(taskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}`)
  },

  /**
   * Duplicate a task.
   */
  async duplicateTask(taskId: string): Promise<TaskResponse> {
    const response = await api.post<TaskResponse>(`/tasks/${taskId}/duplicate`)
    return response.data
  },

  /**
   * Archive a task.
   */
  async archiveTask(taskId: string): Promise<TaskResponse> {
    const response = await api.post<TaskResponse>(`/tasks/${taskId}/archive`)
    return response.data
  },

  /**
   * Restore a task.
   */
  async restoreTask(taskId: string): Promise<TaskResponse> {
    const response = await api.post<TaskResponse>(`/tasks/${taskId}/restore`)
    return response.data
  },
}
