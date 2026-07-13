import { api } from './api'

export const exportService = {
  /**
   * Triggers a browser file download for workspace settings/history.
   */
  async downloadExport(format: 'json' | 'csv' | 'excel' | 'markdown' | 'zip'): Promise<void> {
    const response = await api.get(`/workspace/export?format=${format}`, {
      responseType: 'blob'
    })
    
    // Create browser download link
    const blob = new Blob([response.data], { type: response.headers['content-type'] })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    // Extract filename from headers
    const disposition = response.headers['content-disposition']
    let filename = `workspace_export.${format === 'excel' ? 'xls' : format}`
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
