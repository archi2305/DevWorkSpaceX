import { api } from './api'

export interface ProjectCreateInput {
  name: string
  description?: string
  icon?: string
  color?: string
  status?: string
}

export interface ProjectResponse {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
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
   * Load user projects list with optional search query filtering.
   */
  async getProjects(search?: string): Promise<ProjectResponse[]> {
    const params = search ? { search } : undefined
    const response = await api.get<ProjectResponse[]>('/projects', { params })
    return response.data
  },

  /**
   * Fetch the most recently modified projects.
   */
  async getRecentProjects(): Promise<ProjectResponse[]> {
    const response = await api.get<ProjectResponse[]>('/projects/recent')
    return response.data
  },

  /**
   * Retrieve project fields by ID.
   */
  async getProjectById(id: string): Promise<ProjectResponse> {
    const response = await api.get<ProjectResponse>(`/projects/${id}`)
    return response.data
  },

  /**
   * Create a new project.
   */
  async createProject(data: ProjectCreateInput): Promise<ProjectResponse> {
    const response = await api.post<ProjectResponse>('/projects', data)
    return response.data
  },

  /**
   * Edit existing project fields.
   */
  async updateProject(id: string, data: Partial<ProjectResponse>): Promise<ProjectResponse> {
    const response = await api.put<ProjectResponse>(`/projects/${id}`, data)
    return response.data
  },

  /**
   * Delete a project.
   */
  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`)
  },
}
