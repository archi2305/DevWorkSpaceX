import { api } from './api'
import { UserResponse } from './auth'

export interface ProjectCreateInput {
  name: string
  description?: string
}

export interface ProjectResponse {
  id: string
  name: string
  description: string | null
  status: string
  progress: number
  owner_id: string
  created_at: string
  updated_at: string
  members: Array<{
    id: string
    full_name: string
    profile_image: string | null
  }>
}

export const projectService = {
  /**
   * Load all projects user owns or is a member of.
   */
  async getProjects(): Promise<ProjectResponse[]> {
    const response = await api.get<ProjectResponse[]>('/projects')
    return response.data
  },

  /**
   * Create a new project record.
   */
  async createProject(data: ProjectCreateInput): Promise<ProjectResponse> {
    const response = await api.post<ProjectResponse>('/projects', data)
    return response.data
  },
}
