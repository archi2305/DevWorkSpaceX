import { api } from './api'

export interface WorkspaceInvitation {
  id: string
  workspace_id: string
  email: string
  role: 'Owner' | 'Admin' | 'Developer' | 'Viewer'
  token: string
  invited_by_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired'
  created_at: string
  expires_at: string
}

export const invitationService = {
  async inviteMember(email: string, role: string): Promise<WorkspaceInvitation> {
    const response = await api.post<WorkspaceInvitation>('/workspace/invitations', {
      email,
      role
    })
    return response.data
  },

  async getInvitations(): Promise<WorkspaceInvitation[]> {
    const response = await api.get<WorkspaceInvitation[]>('/workspace/invitations')
    return response.data
  },

  async resendInvitation(id: string): Promise<WorkspaceInvitation> {
    const response = await api.post<WorkspaceInvitation>(`/workspace/invitations/${id}/resend`)
    return response.data
  },

  async cancelInvitation(id: string): Promise<WorkspaceInvitation> {
    const response = await api.post<WorkspaceInvitation>(`/workspace/invitations/${id}/cancel`)
    return response.data
  },

  async acceptInvitation(token: string): Promise<{ status: string; detail: string }> {
    const response = await api.post(`/workspace/invitations/accept`, null, {
      params: { token }
    })
    return response.data
  },

  async rejectInvitation(token: string): Promise<{ status: string; detail: string }> {
    const response = await api.post(`/workspace/invitations/reject`, null, {
      params: { token }
    })
    return response.data
  }
}
