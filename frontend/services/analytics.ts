import { api } from './api'

export interface ProjectProgressMetric {
  project_name: string
  progress: number
  status: string
  total_tasks: number
  completed_tasks: number
}

export interface DayTrendMetric {
  date: string
  count: number
}

export interface VelocityMetric {
  week: string
  completed: number
}

export interface BurndownMetric {
  day: string
  remaining: number
  ideal: number
}

export interface WorkloadMetric {
  member_name: string
  assigned: number
  completed: number
  pending: number
}

export interface ActiveMemberMetric {
  name: string
  actions: number
}

export interface OverdueTaskMetric {
  title: string
  due_date: string | null
  days_overdue: number
}

export interface AnalyticsSummaryResponse {
  overdue_count: number
  project_progress: ProjectProgressMetric[]
  completed_trend: DayTrendMetric[]
  velocity: VelocityMetric[]
  burndown: BurndownMetric[]
  workload: WorkloadMetric[]
  most_active_members: ActiveMemberMetric[]
  overdue_tasks: OverdueTaskMetric[]
}

export const analyticsService = {
  /**
   * Load aggregated workspace analytics summary.
   */
  async getAnalytics(params?: {
    project_id?: string
    workspace_id?: string
    start_date?: string
    end_date?: string
  }): Promise<AnalyticsSummaryResponse> {
    const response = await api.get<AnalyticsSummaryResponse>('/analytics/summary', { params })
    return response.data
  }
}
