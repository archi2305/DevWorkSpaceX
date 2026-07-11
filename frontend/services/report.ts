import { api } from './api'

export const reportService = {
  /**
   * Triggers a browser file download of the compiled project, sprint, task, or team report.
   */
  async downloadReport(params: {
    type: 'project' | 'sprint' | 'task' | 'team'
    format: 'pdf' | 'excel' | 'csv'
    project_id?: string
    sprint_id?: string
    user_id?: string
  }): Promise<void> {
    const response = await api.get('/reports/export', {
      params,
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data], { 
      type: (response.headers['content-type'] as string) || 'application/octet-stream' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    const fileExtension = params.format === 'excel' ? 'xls' : params.format
    link.setAttribute('download', `${params.type}_report.${fileExtension}`)
    document.body.appendChild(link)
    link.click()
    
    // Clean up DOM references
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}
