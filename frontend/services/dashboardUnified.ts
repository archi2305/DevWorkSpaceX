import { api } from './api'
import { ProjectResponse } from './project'
import { TaskResponse } from './task'

export interface ActivityLogResponse {
  id: string
  user_id: string
  action: string
  details: string
  target_type: string | null
  target_name: string | null
  created_at: string
}

export interface NotificationResponse {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface SprintResponse {
  id: string
  project_id: string
  name: string
  goal: string | null
  start_date: string | null
  end_date: string | null
  status: string
  completed_tasks: number
  total_tasks: number
  completed_story_points: number
  total_story_points: number
  remaining_story_points: number
  velocity: number
  progress_percentage: number
  created_at: string
}

export interface AISuggestionResponse {
  id: string
  user_id: string
  priority: string
  title: string
  description: string
  action: string
  icon: string
  created_at: string
}

export interface DashboardMetrics {
  active_projects: number
  completed_tasks: number
  pending_tasks: number
  registered_users: number
  workspace_completion: number
  completion_rate: number
}

export interface WorkspaceMemberResponse {
  initials: string
  name: string
  is_online: boolean
}

export interface UserProfileMini {
  id: string
  email: string
  full_name: string
  profile_image: string | null
}

export interface DashboardUnifiedResponse {
  user: UserProfileMini
  metrics: DashboardMetrics
  recentProjects: ProjectResponse[]
  recentTasks: TaskResponse[]
  recentActivities: ActivityLogResponse[]
  workspaceHealth: DashboardMetrics
  notifications: NotificationResponse[]
  sprint: SprintResponse | null
  aiSuggestions: AISuggestionResponse[]
  teamMembers: WorkspaceMemberResponse[]
}

export const dashboardUnifiedService = {
  /**
   * Fetch the aggregated dashboard snapshot payload in a single network query.
   */
  async getDashboard(): Promise<DashboardUnifiedResponse> {
    const response = await api.get<DashboardUnifiedResponse>('/dashboard')
    return response.data
  },

  /**
   * Mark an alert notification as read in the database.
   */
  async markNotificationRead(id: string): Promise<NotificationResponse> {
    const response = await api.post<NotificationResponse>(`/notifications/${id}/read`)
    return response.data
  },

  /**
   * Mark all alert notifications as read in the database.
   */
  async markAllNotificationsRead(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/notifications/read-all')
    return response.data
  },

  /**
   * Delete notification from PostgreSQL.
   */
  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`)
  }
}
