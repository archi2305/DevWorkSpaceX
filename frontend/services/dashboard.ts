import { api } from './api'
import { ProjectResponse } from './project'
import { TaskResponse } from './task'

export interface DashboardSummaryResponse {
  active_projects: number
  completed_tasks: number
  pending_tasks: number
  notifications: number
  team_members: number
}

export interface SearchResultsResponse {
  projects: ProjectResponse[]
  tasks: TaskResponse[]
  documentation: string[]
  users: string[]
}

export const dashboardService = {
  /**
   * Fetch aggregate counts for dashboard metrics.
   */
  async getSummary(): Promise<DashboardSummaryResponse> {
    const response = await api.get<DashboardSummaryResponse>('/dashboard/summary')
    return response.data
  },

  /**
   * Execute global workspace query searches.
   */
  async searchWorkspace(query: string): Promise<SearchResultsResponse> {
    const response = await api.get<SearchResultsResponse>(`/search?q=${encodeURIComponent(query)}`)
    return response.data
  },
}
