import { api } from './api'

export interface AuditLogResponse {
  id: string
  user_id: string
  action: string
  details: string
  target_type: string | null
  target_name: string | null
  created_at: string
  user?: {
    id: string
    full_name: string
    email: string
  }
}

export interface AuditLogFilters {
  user_id?: string
  action?: string
  target_type?: string
  start_date?: string
  end_date?: string
}

export const auditService = {
  async getAuditLogs(filters: AuditLogFilters): Promise<AuditLogResponse[]> {
    const response = await api.get<AuditLogResponse[]>('/activities/audit', {
      params: filters
    })
    return response.data
  },

  async exportAuditLogs(filters: AuditLogFilters): Promise<void> {
    const response = await api.get('/activities/audit/export', {
      params: filters,
      responseType: 'blob'
    })
    
    // Trigger browser file download
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `audit_logs_export_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
