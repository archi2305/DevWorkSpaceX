import { api } from './api'

export type IntegrationProvider =
  | 'github'
  | 'slack'
  | 'discord'
  | 'google_calendar'
  | 'webhook'

export interface Integration {
  id: string
  workspace_id: string
  provider: IntegrationProvider
  display_name: string
  status: 'Active' | 'Disabled'
  config: Record<string, any> | null
  supports_oauth: boolean
  created_at: string
  updated_at: string
}

export interface ProviderInfo {
  slug: IntegrationProvider
  display_name: string
  supports_oauth: boolean
  oauth_scopes: string[]
}

export interface OAuthInitiateResponse {
  provider: string
  authorize_url: string
  state: string
  mock_mode: boolean
}

export interface SystemWebhook {
  id: string
  workspace_id: string
  name: string
  target_url: string
  secret: string | null
  events: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export const integrationService = {
  async getProviders(): Promise<ProviderInfo[]> {
    const response = await api.get<ProviderInfo[]>('/integrations/providers')
    return response.data
  },

  async createIntegration(data: {
    provider: string
    config: Record<string, any>
  }): Promise<Integration> {
    const response = await api.post<Integration>('/integrations', data)
    return response.data
  },

  async getIntegrations(): Promise<Integration[]> {
    const response = await api.get<Integration[]>('/integrations')
    return response.data
  },

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

  async deleteIntegration(id: string): Promise<void> {
    await api.delete(`/integrations/${id}`)
  },

  async initiateOAuth(provider: string): Promise<OAuthInitiateResponse> {
    const response = await api.get<OAuthInitiateResponse>(
      `/integrations/${provider}/oauth/url`
    )
    return response.data
  },

  async completeOAuth(
    provider: string,
    code: string,
    state: string
  ): Promise<Integration> {
    const response = await api.post<Integration>(
      `/integrations/${provider}/oauth/callback`,
      { code, state }
    )
    return response.data
  },
}

export const webhookService = {
  async getWebhooks(): Promise<SystemWebhook[]> {
    const response = await api.get<SystemWebhook[]>('/webhooks')
    return response.data
  },

  async createWebhook(data: {
    name: string
    target_url: string
    secret?: string
    events?: string[]
    is_active?: boolean
  }): Promise<SystemWebhook> {
    const response = await api.post<SystemWebhook>('/webhooks', data)
    return response.data
  },

  async updateWebhook(
    id: string,
    data: Partial<{
      name: string
      target_url: string
      secret: string
      events: string[]
      is_active: boolean
    }>
  ): Promise<SystemWebhook> {
    const response = await api.put<SystemWebhook>(`/webhooks/${id}`, data)
    return response.data
  },

  async deleteWebhook(id: string): Promise<void> {
    await api.delete(`/webhooks/${id}`)
  },

  async testWebhook(
    id: string,
    event?: string,
    payload?: Record<string, any>
  ): Promise<{ success: boolean; status_code?: number }> {
    const response = await api.post(`/webhooks/${id}/test`, {
      event: event || 'test.ping',
      payload,
    })
    return response.data
  },
}
