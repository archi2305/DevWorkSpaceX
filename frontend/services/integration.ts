import { api } from './api'

export interface WorkspaceIntegration {
  id: string
  workspace_id: string
  provider: 'github' | 'slack' | 'discord' | 'google-calendar'
  is_enabled: boolean
  credentials?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface SystemWebhook {
  id: string
  workspace_id: string
  name: string
  target_url: string
  secret?: string
  events?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export const integrationService = {
  /**
   * Fetch connected workspace integrations.
   */
  async getConnectedIntegrations(): Promise<WorkspaceIntegration[]> {
    const response = await api.get<WorkspaceIntegration[]>('/integrations')
    return response.data
  },

  /**
   * Connect or update a workspace-wide integration.
   */
  async connectIntegration(
    provider: 'github' | 'slack' | 'discord' | 'google-calendar',
    credentials?: Record<string, any>
  ): Promise<WorkspaceIntegration> {
    const response = await api.post<WorkspaceIntegration>('/integrations', { provider, credentials })
    return response.data
  },

  /**
   * Toggle enabled/disabled status.
   */
  async toggleIntegration(id: string): Promise<WorkspaceIntegration> {
    const response = await api.post<WorkspaceIntegration>(`/integrations/${id}/toggle`)
    return response.data
  },

  /**
   * Disconnect integration.
   */
  async disconnectIntegration(id: string): Promise<void> {
    await api.delete(`/integrations/${id}`)
  },

  /**
   * Fetch registered outbound webhooks.
   */
  async getWebhooks(): Promise<SystemWebhook[]> {
    const response = await api.get<SystemWebhook[]>('/integrations/webhooks/all')
    return response.data
  },

  /**
   * Register a custom outbound webhook.
   */
  async createWebhook(data: {
    name: string
    target_url: string
    secret?: string
    events?: string[]
  }): Promise<SystemWebhook> {
    const response = await api.post<SystemWebhook>('/integrations/webhooks', data)
    return response.data
  },

  /**
   * Remove custom webhook.
   */
  async deleteWebhook(id: string): Promise<void> {
    await api.delete(`/integrations/webhooks/${id}`)
  }
}
