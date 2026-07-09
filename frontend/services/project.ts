import { api } from './api'

export interface ProjectCreateInput {
  name: string
  slug?: string
  description?: string
  icon?: string
  cover_image?: string
  color?: string
  status?: string
  priority?: string
  visibility?: string
  workspace_id?: string
}

export interface ProjectResponse {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  cover_image: string | null
  color: string | null
  status: string
  priority: string
  progress: number
  is_favorite: boolean
  is_pinned: boolean
  is_archived: boolean
  owner_id: string
  workspace_id: string | null
  visibility: string
  created_at: string
  updated_at: string
  members: Array<{
    id: string
    full_name: string
    profile_image: string | null
  }>
}

export interface ProjectListParams {
  search?: string
  is_archived?: boolean
  status_filter?: string
  priority?: string
  visibility?: string
  is_favorite?: boolean
  is_pinned?: boolean
  owner_id?: string
  sort_by?: string
}

export interface ProjectStatisticsResponse {
  total_projects: number
  active_projects: number
  archived_projects: number
  pinned_projects: number
  favorite_projects: number
  average_progress: number
}

export const projectService = {
  /**
   * Load user projects list with full filtering parameter scopes.
   */
  async getProjects(params?: ProjectListParams): Promise<ProjectResponse[]> {
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
   * Retrieve project details.
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
   * Archive project.
   */
  async archiveProject(id: string): Promise<ProjectResponse> {
    const response = await api.patch<ProjectResponse>(`/projects/archive/${id}`)
    return response.data
  },

  /**
   * Restore archived project.
   */
  async restoreProject(id: string): Promise<ProjectResponse> {
    const response = await api.patch<ProjectResponse>(`/projects/restore/${id}`)
    return response.data
  },

  /**
   * Toggle favorite project flag.
   */
  async favoriteProject(id: string): Promise<ProjectResponse> {
    const response = await api.patch<ProjectResponse>(`/projects/favorite/${id}`)
    return response.data
  },

  /**
   * Toggle pinned project flag.
   */
  async pinProject(id: string): Promise<ProjectResponse> {
    const response = await api.patch<ProjectResponse>(`/projects/pin/${id}`)
    return response.data
  },

  /**
   * Update progress value.
   */
  async updateProgress(id: string, progress: number): Promise<ProjectResponse> {
    const response = await api.patch<ProjectResponse>(`/projects/progress/${id}?progress=${progress}`)
    return response.data
  },

  /**
   * Load workspace project metrics/statistics.
   */
  async getStatistics(): Promise<ProjectStatisticsResponse> {
    const response = await api.get<ProjectStatisticsResponse>('/projects/statistics')
    return response.data
  },

  /**
   * Delete a project.
   */
  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`)
  },
}
