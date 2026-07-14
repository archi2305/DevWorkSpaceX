import { api } from './api'

export interface ProjectRisk {
  type: string
  severity: string
  description: string
  recommendation: string
}

export interface BlockedTask {
  task_id: string
  task_title: string
  project_id: string
  reason: string
  severity: string
  blocked_since: string
}

export interface SlowProgressProject {
  project_id: string
  project_name: string
  current_velocity: number
  total_tasks: number
  completed_tasks: number
  severity: string
  recommendation: string
}

export interface MemberWorkload {
  user_name: string
  user_email: string
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  completion_rate: number
  total_story_points: number
  completed_story_points: number
  overdue_tasks: number
  overdue_task_names: string[]
  workload_level: string
}

export interface SprintPrediction {
  sprint_id: string
  sprint_name: string
  prediction: string
  confidence: number
  completion_rate: number
  velocity: number
  days_remaining: number
  estimated_completion_date: string | null
  recommendations: string[]
}

export interface CompletionForecast {
  project_name: string
  current_progress: number
  velocity: number
  remaining_points: number
  estimated_completion_date: string | null
  is_on_track: boolean | null
  days_ahead_or_behind: number | null
  confidence: number
}

export interface ComprehensiveInsights {
  project_risks: ProjectRisk[]
  blocked_tasks: BlockedTask[]
  slow_progress: SlowProgressProject[]
  member_workload: Record<string, MemberWorkload>
  sprint_predictions: SprintPrediction[]
  completion_forecasts: Record<string, CompletionForecast>
  generated_at: string
}

export const workspaceInsightsService = {
  async getAllInsights(): Promise<ComprehensiveInsights> {
    const response = await api.get<ComprehensiveInsights>('/workspace/insights/all')
    return response.data
  },

  async getProjectRisks(): Promise<{ risks: ProjectRisk[]; total_risks: number }> {
    const response = await api.get<{ risks: ProjectRisk[]; total_risks: number }>('/workspace/insights/project-risks')
    return response.data
  },

  async getBlockedTasks(): Promise<{ blocked_tasks: BlockedTask[]; total_blocked: number }> {
    const response = await api.get<{ blocked_tasks: BlockedTask[]; total_blocked: number }>('/workspace/insights/blocked-tasks')
    return response.data
  },

  async getSlowProgress(): Promise<{ slow_projects: SlowProgressProject[]; total_slow_projects: number }> {
    const response = await api.get<{ slow_projects: SlowProgressProject[]; total_slow_projects: number }>('/workspace/insights/slow-progress')
    return response.data
  },

  async getMemberWorkload(): Promise<{ workload: Record<string, MemberWorkload>; total_members: number }> {
    const response = await api.get<{ workload: Record<string, MemberWorkload>; total_members: number }>('/workspace/insights/member-workload')
    return response.data
  },

  async getSprintPredictions(sprintId?: string): Promise<{ predictions: SprintPrediction[]; total_predictions: number }> {
    const response = await api.get<{ predictions: SprintPrediction[]; total_predictions: number }>('/workspace/insights/sprint-predictions', {
      params: sprintId ? { sprint_id: sprintId } : undefined
    })
    return response.data
  },

  async getCompletionForecast(projectId?: string): Promise<{ forecasts: Record<string, CompletionForecast>; total_forecasts: number }> {
    const response = await api.get<{ forecasts: Record<string, CompletionForecast>; total_forecasts: number }>('/workspace/insights/completion-forecast', {
      params: projectId ? { project_id: projectId } : undefined
    })
    return response.data
  }
}
