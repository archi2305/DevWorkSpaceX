import { api } from './api'

export interface FileAssetResponse {
  id: string
  name: string
  file_path: string | null
  mime_type: string | null
  size: number | null
  is_folder: boolean
  project_id: string | null
  parent_id: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export const fileService = {
  /**
   * List files and folders inside a specific workspace directory context.
   */
  async getFiles(params?: {
    project_id?: string
    parent_id?: string
    q?: string
    sort_by?: string
    limit?: number
    offset?: number
  }): Promise<FileAssetResponse[]> {
    const response = await api.get<FileAssetResponse[]>('/files', { params })
    return response.data
  },

  /**
   * Uploads a file asset. Uses FormData for multipart support.
   */
  async uploadFile(
    file: File,
    projectId?: string,
    parentId?: string
  ): Promise<FileAssetResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (projectId) formData.append('project_id', projectId)
    if (parentId) formData.append('parent_id', parentId)

    const response = await api.post<FileAssetResponse>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  /**
   * Creates a virtual folder directory.
   */
  async createFolder(data: {
    name: string
    project_id?: string
    parent_id?: string
  }): Promise<FileAssetResponse> {
    const response = await api.post<FileAssetResponse>('/files/folder', data)
    return response.data
  },

  /**
   * Renames a file asset or folder.
   */
  async renameAsset(id: string, name: string): Promise<FileAssetResponse> {
    const response = await api.patch<FileAssetResponse>(`/files/${id}`, { name })
    return response.data
  },

  /**
   * Deletes a file asset or folder cascade.
   */
  async deleteAsset(id: string): Promise<void> {
    await api.delete(`/files/${id}`)
  },

  /**
   * Get direct download/preview URL for a file.
   */
  getDownloadUrl(id: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    return `${baseUrl}/files/download/${id}`
  }
}
