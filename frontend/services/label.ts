import { api } from './api'

export interface Label {
  id: string
  project_id: string | null
  name: string
  color: string
  created_at: string
  updated_at: string
}

export const labelService = {
  /**
   * Create a new workspace or project label tag.
   */
  async createLabel(data: {
    project_id?: string | null
    name: string
    color: string
  }): Promise<Label> {
    const response = await api.post<Label>('/labels', data)
    return response.data
  },

  /**
   * Fetch all labels filtered optionally by project scope or name searches.
   */
  async getLabels(projectId?: string, q?: string): Promise<Label[]> {
    const response = await api.get<Label[]>('/labels', {
      params: { project_id: projectId, q }
    })
    return response.data
  },

  /**
   * Edit a label tag (e.g. rename, change color).
   */
  async updateLabel(id: string, data: Partial<Label>): Promise<Label> {
    const response = await api.patch<Label>(`/labels/${id}`, data)
    return response.data
  },

  /**
   * Permanently delete a label.
   */
  async deleteLabel(id: string): Promise<void> {
    await api.delete(`/labels/${id}`)
  },

  /**
   * Set many-to-many label assignments on a task.
   */
  async assignLabelsToTask(taskId: string, labelIds: string[]): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(`/labels/tasks/${taskId}`, labelIds)
    return response.data
  },

  /**
   * Unlink a label tag from a task.
   */
  async removeLabelFromTask(taskId: string, labelId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/labels/tasks/${taskId}/${labelId}`)
    return response.data
  }
}
