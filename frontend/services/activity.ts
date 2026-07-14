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
  category: string | null
  event_type: string | null
  action: string
  details: string
  target_type: string | null
  target_name: string | null
  target_id: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user: UserMini
}

export interface AuditStats {
  total_logs: number
  category_counts: Record<string, number>
  event_type_counts: Record<string, number>
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
  },

  /**
   * Get filtered audit logs with comprehensive filtering.
   */
  async getAuditLogs(params?: {
    start_date?: string
    end_date?: string
    user_id?: string
    category?: string
    event_type?: string
    target_type?: string
    action?: string
    limit?: number
    offset?: number
  }): Promise<ActivityResponse[]> {
    const response = await api.get<ActivityResponse[]>('/activities/audit', { params })
    return response.data
  },

  /**
   * Get audit log statistics.
   */
  async getAuditStats(params?: {
    start_date?: string
    end_date?: string
  }): Promise<AuditStats> {
    const response = await api.get<AuditStats>('/activities/audit/stats', { params })
    return response.data
  },

  /**
   * Export audit logs to CSV format.
   */
  async exportAuditLogs(params?: {
    start_date?: string
    end_date?: string
    user_id?: string
    category?: string
    event_type?: string
    target_type?: string
    action?: string
  }): Promise<Blob> {
    const response = await api.get('/activities/audit/export', {
      params,
      responseType: 'blob'
    })
    return response.data
  }
}

