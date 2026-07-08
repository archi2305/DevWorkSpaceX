import { api } from './api'

export interface TaskCreateInput {
  title: string
  due_date?: string
  priority?: string
  assignee_id?: string
  project_id?: string
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
   * Fetch all tasks assigned to the logged-in user.
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
   * Update task completed status (e.g. checking it off).
   */
  async toggleTaskComplete(taskId: string, completed: boolean): Promise<TaskResponse> {
    const response = await api.patch<TaskResponse>(`/tasks/${taskId}`, { completed })
    return response.data
  },
}
