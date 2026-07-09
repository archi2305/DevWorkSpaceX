import { api } from './api'

export interface TaskCreateInput {
  title: string
  due_date?: string
  priority?: string
  assignee_id?: string
  project_id?: string
  completed?: boolean
}

export interface TaskResponse {
  id: string
  title: string
  due_date: string | null
  priority: string
  completed: boolean
  assignee_id: string | null
  project_id: string | null
  created_at: string
  updated_at: string
}

export const taskService = {
  /**
   * Fetch tasks, optionally filtered by project_id.
   */
  async getTasks(projectId?: string): Promise<TaskResponse[]> {
    const params = projectId ? { project_id: projectId } : undefined
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
  async createTask(data: TaskCreateInput): Promise<TaskResponse> {
    const response = await api.post<TaskResponse>('/tasks', data)
    return response.data
  },

  /**
   * Update task details (e.g. status, priority).
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
}
