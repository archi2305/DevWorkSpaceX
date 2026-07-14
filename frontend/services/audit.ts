import { api } from './api'

export interface AuditLogResponse {
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
  metadata: Record<string, any> | null
  created_at: string
  user: {
    id: string
    full_name: string
    email: string
    profile_image: string | null
  }
}

export interface AuditLogFilters {
  start_date?: string
  end_date?: string
  user_id?: string
  category?: string
  event_type?: string
  target_type?: string
  action?: string
  limit?: number
  offset?: number
}

export interface AuditStats {
  total_logs: number
  category_counts: Record<string, number>
  event_type_counts: Record<string, number>
}

export const auditService = {
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogResponse[]> {
    const response = await api.get<AuditLogResponse[]>('/activities/audit', {
      params: filters
    })
    return response.data
  },

  async getAuditStats(filters: Pick<AuditLogFilters, 'start_date' | 'end_date'> = {}): Promise<AuditStats> {
    const response = await api.get<AuditStats>('/activities/audit/stats', {
      params: filters
    })
    return response.data
  },

  async exportAuditLogs(filters: AuditLogFilters = {}): Promise<void> {
    const response = await api.get('/activities/audit/export', {
      params: filters,
      responseType: 'blob'
    })
    
    // Create browser download link
    const blob = new Blob([response.data], { type: response.headers['content-type'] as string | undefined })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    // Extract filename from headers
    const disposition = response.headers['content-disposition'] as string | undefined
    let filename = `audit_logs_${Date.now()}.csv`
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      const matches = filenameRegex.exec(disposition)
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '')
      }
    }
    
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    
    // Clean up
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}
