import { api } from './api'

export interface UserPreference {
  id: string
  user_id: string
  theme: 'Dark' | 'Light' | 'System'
  accent_color: string
  keyboard_shortcuts_enabled: boolean
  email_notifications: boolean
  in_app_notifications: boolean
  language: string
}

export const userPreferenceService = {
  /**
   * Fetch current authenticated user's UI & system settings.
   */
  async getPreferences(): Promise<UserPreference> {
    const response = await api.get<UserPreference>('/users/me/preferences')
    return response.data
  },

  /**
   * Modify UI / system preference configurations.
   */
  async updatePreferences(data: {
    theme?: 'Dark' | 'Light' | 'System'
    accent_color?: string
    keyboard_shortcuts_enabled?: boolean
    email_notifications?: boolean
    in_app_notifications?: boolean
    language?: string
  }): Promise<UserPreference> {
    const response = await api.put<UserPreference>('/users/me/preferences', data)
    return response.data
  }
}
