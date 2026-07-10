import { api } from './api'

export interface WorkspaceSettings {
  id: string
  name: string
  logo_url: string | null
  theme: string
  timezone: string
  allow_member_invites: boolean
  enable_email_notifications: boolean
  enable_desktop_notifications: boolean
}

export interface APIKey {
  id: string
  name: string
  key_prefix: string
  created_at: string
}

export interface APIKeyCreated {
  id: string
  name: string
  token: string
  created_at: string
}

export interface UserSession {
  id: string
  user_agent: string
  ip_address: string
  last_active: string
}

export interface ConnectedAccount {
  id: string
  provider: string
  username: string
  connected_at: string
}

export const workspaceService = {
  /**
   * Load workspace configurations.
   */
  async getSettings(): Promise<WorkspaceSettings> {
    const response = await api.get<WorkspaceSettings>('/workspace/settings')
    return response.data
  },

  /**
   * Save workspace modifications.
   */
  async updateSettings(data: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
    const response = await api.patch<WorkspaceSettings>('/workspace/settings', data)
    return response.data
  },

  /**
   * Delete workspace.
   */
  async deleteWorkspace(): Promise<void> {
    await api.delete('/workspace/settings')
  },

  /**
   * Retrieve active developer keys.
   */
  async getAPIKeys(): Promise<APIKey[]> {
    const response = await api.get<APIKey[]>('/workspace/api-keys')
    return response.data
  },

  /**
   * Generate a developer key.
   */
  async createAPIKey(name: string): Promise<APIKeyCreated> {
    const response = await api.post<APIKeyCreated>('/workspace/api-keys', { name })
    return response.data
  },

  /**
   * Revoke a developer token.
   */
  async revokeAPIKey(keyId: string): Promise<void> {
    await api.delete(`/workspace/api-keys/${keyId}`)
  },

  /**
   * Fetch active security sessions.
   */
  async getSessions(): Promise<UserSession[]> {
    const response = await api.get<UserSession[]>('/workspace/sessions')
    return response.data
  },

  /**
   * Fetch connected integration profiles.
   */
  async getConnectedAccounts(): Promise<ConnectedAccount[]> {
    const response = await api.get<ConnectedAccount[]>('/workspace/connected-accounts')
    return response.data
  },

  /**
   * Connect an integration.
   */
  async connectAccount(provider: string, username: string): Promise<ConnectedAccount> {
    const response = await api.post<ConnectedAccount>('/workspace/connected-accounts', {
      provider,
      username
    })
    return response.data
  },

  /**
   * Disconnect an integration.
   */
  async disconnectAccount(accountId: string): Promise<void> {
    await api.delete(`/workspace/connected-accounts/${accountId}`)
  },

  /**
   * Trigger backup download.
   */
  async exportWorkspaceData(): Promise<{ message: string; payload: any }> {
    const response = await api.post<{ message: string; payload: any }>('/workspace/export')
    return response.data
  }
}
