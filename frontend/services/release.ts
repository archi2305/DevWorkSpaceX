import { api } from './api'

export interface Release {
  id: string
  project_id: string
  version: string
  title: string
  release_notes: string | null
  status: string // 'Draft', 'Unreleased', 'Released'
  released_at: string | null
  created_at: string
  updated_at: string
}

export interface ReleaseStats {
  release_id: string
  version: string
  title: string
  status: string
  total_tasks: number
  completed_tasks: number
  completion_percentage: number
  released_at: string | null
}

export const releaseService = {
  async getReleases(projectId: string, filters?: Record<string, any>): Promise<Release[]> {
    const params = { project_id: projectId, ...filters }
    const response = await api.get<Release[]>('/releases', { params })
    return response.data
  },

  async getReleaseById(id: string): Promise<Release> {
    const response = await api.get<Release>(`/releases/${id}`)
    return response.data
  },

  async createRelease(data: {
    project_id: string
    version: string
    title: string
    release_notes?: string
    status?: string
  }): Promise<Release> {
    const response = await api.post<Release>('/releases', data)
    return response.data
  },

  async updateRelease(id: string, data: Partial<Release>): Promise<Release> {
    const response = await api.patch<Release>(`/releases/${id}`, data)
    return response.data
  },

  async deleteRelease(id: string): Promise<void> {
    await api.delete(`/releases/${id}`)
  },

  async assignTasksToRelease(id: string, taskIds: string[]): Promise<any> {
    const response = await api.post<any>(`/releases/${id}/tasks`, taskIds)
    return response.data
  },

  async getReleaseStats(id: string): Promise<ReleaseStats> {
    const response = await api.get<ReleaseStats>(`/releases/${id}/stats`)
    return response.data
  }
}
