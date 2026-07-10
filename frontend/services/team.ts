import { api } from './api'

export interface MemberUser {
  id: string
  email: string
  full_name: string
  profile_image: string | null
}

export interface WorkspaceMember {
  id: string
  role: string
  user: MemberUser
  created_at: string
}

export interface WorkspaceInviteInput {
  email: string
  full_name: string
  role: string
}

export const teamService = {
  /**
   * Fetch all members in the workspace.
   */
  async getWorkspaceMembers(): Promise<WorkspaceMember[]> {
    const response = await api.get<WorkspaceMember[]>('/workspace/members')
    return response.data
  },

  /**
   * Invite a new member.
   */
  async inviteMember(data: WorkspaceInviteInput): Promise<WorkspaceMember> {
    const response = await api.post<WorkspaceMember>('/workspace/invite', data)
    return response.data
  },

  /**
   * Update a member's role.
   */
  async updateMemberRole(id: string, role: string): Promise<WorkspaceMember> {
    const response = await api.patch<WorkspaceMember>(`/workspace/member/${id}`, { role })
    return response.data
  },

  /**
   * Remove a member from the workspace.
   */
  async removeMember(id: string): Promise<void> {
    await api.delete(`/workspace/member/${id}`)
  },

  /**
   * Add a member to a specific project.
   */
  async assignProjectMember(projectId: string, userId: string): Promise<any> {
    const response = await api.post(`/workspace/projects/${projectId}/members`, { user_id: userId })
    return response.data
  },

  /**
   * Remove a member from a specific project.
   */
  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await api.delete(`/workspace/projects/${projectId}/members/${userId}`)
  },

  /**
   * Fetch detailed member profile with projects and tasks summary.
   */
  async getMemberProfile(id: string): Promise<any> {
    const response = await api.get(`/workspace/member/${id}/profile`)
    return response.data
  },

  /**
   * Fetch roles permissions matrix.
   */
  async getWorkspacePermissions(): Promise<any> {
    const response = await api.get('/workspace/permissions')
    return response.data
  }
}
