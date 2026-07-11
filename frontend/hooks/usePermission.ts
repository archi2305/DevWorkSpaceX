'use client'

import { useQuery } from '@tanstack/react-query'
import { teamService } from '@/services/team'
import { useAuth } from '@/hooks/useAuth'

const DEFAULT_ROLE_PERMISSIONS = {
  Owner: [
    "create_project", "delete_project", "edit_project", "create_sprint",
    "invite_members", "delete_workspace", "edit_documentation", "manage_files",
    "create_api_keys"
  ],
  Admin: [
    "create_project", "edit_project", "create_sprint", "invite_members",
    "edit_documentation", "manage_files", "create_api_keys"
  ],
  Manager: [
    "create_project", "edit_project", "create_sprint",
    "edit_documentation", "manage_files"
  ],
  Developer: [
    "edit_project", "edit_documentation", "manage_files"
  ],
  Viewer: []
}

export function usePermission() {
  const { user } = useAuth()

  const { data: members = [] } = useQuery({
    queryKey: ['workspace-members'],
    queryFn: teamService.getWorkspaceMembers,
    enabled: !!user
  })

  const currentUserMember = members.find((m) => m.user.id === user?.id)
  const role = currentUserMember?.role || 'Viewer'

  const hasPermission = (permission: string): boolean => {
    if (role === 'Owner') return true
    const permissions = (DEFAULT_ROLE_PERMISSIONS[role as keyof typeof DEFAULT_ROLE_PERMISSIONS] || []) as string[]
    return permissions.includes(permission)
  }

  return {
    role,
    hasPermission,
    isLoading: !currentUserMember && members.length === 0
  }
}
