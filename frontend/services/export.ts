import { api } from './api'

export type ExportFormat = 'json' | 'csv' | 'excel' | 'markdown' | 'zip'
export type DataType = 'projects' | 'tasks' | 'documents' | 'files' | 'activities' | 'labels' | 'milestones' | 'sprints'

export const exportService = {
  /**
   * Triggers a browser file download for workspace data.
   */
  async downloadExport(
    format: ExportFormat,
    dataTypes?: DataType[]
  ): Promise<void> {
    const params = new URLSearchParams()
    params.append('format', format)
    
    if (dataTypes && dataTypes.length > 0) {
      params.append('data_types', dataTypes.join(','))
    }
    
    const response = await api.get(`/workspace/export?${params.toString()}`, {
      responseType: 'blob'
    })
    
    // Create browser download link
    const blob = new Blob([response.data], { type: response.headers['content-type'] as string | undefined })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    // Extract filename from headers
    const disposition = response.headers['content-disposition'] as string | undefined
    let filename = `workspace_export.${format === 'excel' ? 'xlsx' : format}`
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
