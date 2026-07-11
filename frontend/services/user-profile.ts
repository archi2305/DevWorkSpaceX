import { api } from './api'
import { TaskResponse } from './task'
import { ProjectResponse } from './project'
import { ActivityResponse } from './activity'

export interface UserProfileResponse {
  user: {
    id: string
    email: string
    full_name: string
    profile_image: string | null
    bio: string | null
    skills: string[] | null
    timezone: string | null
    is_active: boolean
    created_at: string
    updated_at: string
  }
  assigned_tasks: TaskResponse[]
  projects: ProjectResponse[]
  recent_activity: ActivityResponse[]
}

export const userProfileService = {
  /**
   * Fetch current authenticated user's profile with tasks, projects, and activities.
   */
  async getMyProfile(): Promise<UserProfileResponse> {
    const response = await api.get<UserProfileResponse>('/users/me/profile')
    return response.data
  },

  /**
   * Fetch public profile metrics of any workspace member.
   */
  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    const response = await api.get<UserProfileResponse>(`/users/${userId}/profile`)
    return response.data
  },

  /**
   * Modify profile settings (bio, skills, timezone, full_name, avatar).
   */
  async updateProfile(data: {
    full_name?: string
    profile_image?: string
    bio?: string
    skills?: string[]
    timezone?: string
  }) {
    const response = await api.put('/users/me/profile', data)
    return response.data
  }
}
