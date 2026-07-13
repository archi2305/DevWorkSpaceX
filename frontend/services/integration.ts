import { api } from './api'

export interface Integration {
  id: string
  workspace_id: string
  provider: 'GitHub' | 'Slack' | 'Discord' | 'Google Calendar' | 'Webhook'
  status: 'Active' | 'Disabled'
  config: Record<string, any> | null
  created_at: string
  updated_at: string
}

export const integrationService = {
  /**
   * Configure a new third-party integration.
   */
  async createIntegration(data: {
    provider: string
    config: Record<string, any>
  }): Promise<Integration> {
    const response = await api.post<Integration>('/integrations', data)
    return response.data
  },

  /**
   * Retrieve active integration configurations.
   */
  async getIntegrations(): Promise<Integration[]> {
    const response = await api.get<Integration[]>('/integrations')
    return response.data
  },

  /**
   * Modify settings or status of an integration.
   */
  async updateIntegration(
    id: string,
    data: {
      status?: 'Active' | 'Disabled'
      config?: Record<string, any>
    }
  ): Promise<Integration> {
    const response = await api.put<Integration>(`/integrations/${id}`, data)
    return response.data
  },

  /**
   * Remove third-party integration configuration.
   */
  async deleteIntegration(id: string): Promise<void> {
    await api.delete(`/integrations/${id}`)
  },

  /**
   * Secure OAuth callback callback simulator.
   */
  async oauthCallback(provider: string, code: string): Promise<any> {
    const response = await api.post('/integrations/oauth-callback', { provider, code })
    return response.data
  }
}
