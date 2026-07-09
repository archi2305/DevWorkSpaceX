import { api } from './api'

export interface DocumentResponse {
  id: string
  title: string
  content: string
  project_id: string | null
  parent_id: string | null
  is_favorite: boolean
  version: number
  owner_id: string
  created_at: string
  updated_at: string
}

export interface DocumentCreateInput {
  title?: string
  content?: string
  project_id?: string
  parent_id?: string
}

export interface DocumentUpdateInput {
  title?: string
  content?: string
  parent_id?: string | null
  is_favorite?: boolean
}

export interface DocumentVersionResponse {
  id: string
  document_id: string
  version_number: number
  title: string
  content: string
  created_at: string
  author_id: string
}

export const documentService = {
  /**
   * List or search documents in the workspace.
   */
  async getDocuments(params?: {
    project_id?: string
    parent_id?: string
    is_favorite?: boolean
    q?: string
  }): Promise<DocumentResponse[]> {
    const response = await api.get<DocumentResponse[]>('/documents', { params })
    return response.data
  },

  /**
   * Fetch details of a single document page.
   */
  async getDocumentById(id: string): Promise<DocumentResponse> {
    const response = await api.get<DocumentResponse>(`/documents/${id}`)
    return response.data
  },

  /**
   * Create a new document page.
   */
  async createDocument(data: DocumentCreateInput): Promise<DocumentResponse> {
    const response = await api.post<DocumentResponse>('/documents', data)
    return response.data
  },

  /**
   * Save changes (autosave).
   */
  async updateDocument(id: string, data: DocumentUpdateInput): Promise<DocumentResponse> {
    const response = await api.patch<DocumentResponse>(`/documents/${id}`, data)
    return response.data
  },

  /**
   * Delete a document page.
   */
  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`)
  },

  /**
   * Load history snapshots list.
   */
  async getDocumentVersions(id: string): Promise<DocumentVersionResponse[]> {
    const response = await api.get<DocumentVersionResponse[]>(`/documents/${id}/versions`)
    return response.data
  },

  /**
   * Restore document contents to an older version.
   */
  async restoreDocumentVersion(id: string, versionNumber: number): Promise<DocumentResponse> {
    const response = await api.post<DocumentResponse>(`/documents/${id}/restore/${versionNumber}`)
    return response.data
  }
}
