import { api } from './api'

export interface UserMini {
  id: string
  email: string
  full_name: string
  profile_image: string | null
}

export interface ActivityResponse {
  id: string
  user_id: string
  action: string
  details: string
  target_type: string | null
  target_name: string | null
  created_at: string
  user: UserMini
}

export const activityService = {
  /**
   * Load activity timeline logs with scrolling pagination.
   */
  async getActivities(params?: {
    limit?: number
    offset?: number
    user_id?: string
    target_type?: string
  }): Promise<ActivityResponse[]> {
    const response = await api.get<ActivityResponse[]>('/activities', { params })
    return response.data
  }
}
