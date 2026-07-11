import { api } from './api'

export interface SavedFilter {
  id: string
  user_id: string
  name: string
  target_type: 'Project' | 'Task'
  criteria: Record<string, any>
  layout?: 'kanban' | 'table' | 'list'
  is_favorite: boolean
  last_used_at?: string
  created_at: string
  updated_at: string
}

export const savedFilterService = {
  /**
   * Save a new filter criteria preset.
   */
  async createSavedFilter(data: {
    name: string
    target_type: 'Project' | 'Task'
    criteria: Record<string, any>
    layout?: 'kanban' | 'table' | 'list'
    is_favorite?: boolean
  }): Promise<SavedFilter> {
    const response = await api.post<SavedFilter>('/saved-filters', data)
    return response.data
  },

  /**
   * Retrieve all saved filter presets.
   */
  async getSavedFilters(targetType?: 'Project' | 'Task'): Promise<SavedFilter[]> {
    const response = await api.get<SavedFilter[]>('/saved-filters', {
      params: { target_type: targetType }
    })
    return response.data
  },

  /**
   * Retrieve recently used saved filter presets.
   */
  async getRecentSavedFilters(): Promise<SavedFilter[]> {
    const response = await api.get<SavedFilter[]>('/saved-filters/recent')
    return response.data
  },

  /**
   * Toggle favorite status of a saved view/filter.
   */
  async toggleFavoriteSavedFilter(id: string): Promise<SavedFilter> {
    const response = await api.patch<SavedFilter>(`/saved-filters/${id}/favorite`)
    return response.data
  },

  /**
   * Update usage timestamp.
   */
  async useSavedFilter(id: string): Promise<SavedFilter> {
    const response = await api.patch<SavedFilter>(`/saved-filters/${id}/use`)
    return response.data
  },

  /**
   * Permanently delete a saved filter preset.
   */
  async deleteSavedFilter(id: string): Promise<void> {
    await api.delete(`/saved-filters/${id}`)
  }
}
