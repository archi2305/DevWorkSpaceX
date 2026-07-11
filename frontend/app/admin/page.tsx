'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import {
  ShieldAlert,
  Users,
  Briefcase,
  HardDrive,
  Settings,
  Activity,
  Trash2,
  UserCheck,
  LayoutGrid,
  Loader,
  Lock,
  Plus
} from 'lucide-react'
import { teamService } from '@/services/team'
import { projectService } from '@/services/project'
import { fileService } from '@/services/file'
import { workspaceService } from '@/services/workspace'
import { auditService } from '@/services/audit'

export default function AdminPanelPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'projects' | 'storage' | 'workspace' | 'audit'>('overview')

  // 1. Fetch Datasets
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['workspace-members'],
    queryFn: teamService.getWorkspaceMembers
  })

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects()
  })

  const { data: files = [], isLoading: loadingFiles } = useQuery({
    queryKey: ['files'],
    queryFn: () => fileService.getFiles()
  })

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['workspace-settings'],
    queryFn: workspaceService.getSettings
  })

  const { data: auditLogs = [], isLoading: loadingAudit } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => auditService.getAuditLogs({})
  })

  // 2. Mutations
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      teamService.updateMemberRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    }
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => teamService.removeMember(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    }
  })

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })

  const deleteFileMutation = useMutation({
    mutationFn: (id: string) => fileService.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    }
  })

  const updateWorkspaceMutation = useMutation({
    mutationFn: (data: any) => workspaceService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-settings'] })
    }
  })

  // Calculations
  const totalStorage = files.reduce((acc, curr) => acc + (curr.size || 0), 0)
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isLoading = loadingMembers || loadingProjects || loadingFiles || loadingSettings || loadingAudit

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5 text-left">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-500" /> Admin Control Deck
            </h1>
            <p className="text-xs text-[#A7ADB5] mt-1">Workspace-wide permission levels, repository storage, branding setups, and audit logs.</p>
          </div>
          <span className="text-[9px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded font-bold uppercase">SuperAdmin Scope</span>
        </div>

        {/* Tab Buttons Navigation */}
        <div className="flex border-b border-white/[0.06] gap-6 flex-wrap">
          {([
            { id: 'overview', label: 'Overview', icon: LayoutGrid },
            { id: 'users', label: 'Users & Roles', icon: Users },
            { id: 'projects', label: 'Projects', icon: Briefcase },
            { id: 'storage', label: 'Storage', icon: HardDrive },
            { id: 'workspace', label: 'Branding', icon: Settings },
            { id: 'audit', label: 'Audit Logs', icon: Activity }
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 relative -bottom-[2px] flex items-center gap-1.5 ${
                  isActive ? 'border-[#5BB98C] text-white' : 'border-transparent text-[#7E848C] hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {tab.label}
              </button>
            )
          })}
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader className="h-6 w-6 text-[#5BB98C] animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 text-left">
                    <span className="text-[9px] font-bold text-[#7E848C] uppercase tracking-wider block">Total Members</span>
                    <span className="text-2xl font-extrabold text-white mt-1 block">{members.length} Users</span>
                  </div>
                  <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 text-left">
                    <span className="text-[9px] font-bold text-[#7E848C] uppercase tracking-wider block">Managed Projects</span>
                    <span className="text-2xl font-extrabold text-white mt-1 block">{projects.length} Repos</span>
                  </div>
                  <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 text-left">
                    <span className="text-[9px] font-bold text-[#7E848C] uppercase tracking-wider block">Storage Used</span>
                    <span className="text-2xl font-extrabold text-white mt-1 block">{formatBytes(totalStorage)}</span>
                  </div>
                  <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 text-left">
                    <span className="text-[9px] font-bold text-[#7E848C] uppercase tracking-wider block">Audits Registered</span>
                    <span className="text-2xl font-extrabold text-white mt-1 block">{auditLogs.length} Events</span>
                  </div>
                </div>

                <div className="p-5 border border-[#5BB98C]/20 bg-[#5BB98C]/5 rounded-2xl text-left space-y-2">
                  <span className="text-[9px] bg-[#5BB98C]/15 text-[#5BB98C] px-2 py-0.5 rounded font-bold uppercase inline-block">Security Compliant</span>
                  <h4 className="text-xs font-extrabold text-white">System Integrity & Access Controls</h4>
                  <p className="text-[10px] text-[#A7ADB5] leading-relaxed">
                    This workspace is backed by PostgreSQL audit logs. All actions, deletes, and invite settings are logged immutably.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: USERS & ROLES */}
            {activeTab === 'users' && (
              <div className="border border-white/[0.06] bg-[#171A1D] rounded-2xl overflow-hidden shadow-md text-left">
                <table className="w-full text-xs text-[#A7ADB5] border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="p-4 font-bold text-white">Name</th>
                      <th className="p-4 font-bold text-white">Email</th>
                      <th className="p-4 font-bold text-white">Role</th>
                      <th className="p-4 font-bold text-white text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m: any) => (
                      <tr key={m.user.id} className="border-b border-white/[0.04] hover:bg-white/[0.01]">
                        <td className="p-4 font-semibold text-white">{m.user.full_name}</td>
                        <td className="p-4">{m.user.email}</td>
                        <td className="p-4">
                          <select
                            value={m.role}
                            onChange={(e) => updateRoleMutation.mutate({ userId: m.user.id, role: e.target.value })}
                            className="bg-[#1D2024] border border-white/[0.06] rounded px-2 py-1 text-xs text-white outline-none"
                          >
                            <option value="Admin">Admin</option>
                            <option value="Member">Member</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => removeMemberMutation.mutate(m.user.id)}
                            className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                            title="Remove User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: PROJECTS */}
            {activeTab === 'projects' && (
              <div className="grid grid-cols-1 gap-3">
                {projects.map((p: any) => (
                  <div key={p.id} className="p-4 border border-white/[0.06] bg-[#171A1D] rounded-2xl flex flex-wrap items-center justify-between gap-4 text-left shadow-md">
                    <div>
                      <span className="text-xs font-bold text-white">{p.name}</span>
                      <span className="text-[10px] text-[#7E848C] block mt-0.5">Status: {p.status} | Progress: {p.progress}%</span>
                    </div>

                    <button
                      onClick={() => deleteProjectMutation.mutate(p.id)}
                      className="p-2 border border-white/[0.08] hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: STORAGE */}
            {activeTab === 'storage' && (
              <div className="space-y-4 text-left">
                <div className="p-4 border border-white/[0.06] bg-[#171A1D] rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block">Total Database Assets Space</span>
                    <span className="text-sm font-extrabold text-white mt-1 block">{formatBytes(totalStorage)}</span>
                  </div>
                </div>

                <div className="border border-white/[0.06] bg-[#171A1D] rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-[#A7ADB5] border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="p-4 font-bold text-white">File Name</th>
                        <th className="p-4 font-bold text-white">Size</th>
                        <th className="p-4 font-bold text-white">Type</th>
                        <th className="p-4 font-bold text-white text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.filter((f: any) => !f.is_folder).map((file: any) => (
                        <tr key={file.id} className="border-b border-white/[0.04] hover:bg-white/[0.01]">
                          <td className="p-4 font-semibold text-white">{file.name}</td>
                          <td className="p-4">{formatBytes(file.size || 0)}</td>
                          <td className="p-4">{file.mime_type || 'Unknown'}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => deleteFileMutation.mutate(file.id)}
                              className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: BRANDING */}
            {activeTab === 'workspace' && settings && (
              <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 text-left space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Workspace Name</label>
                  <input
                    type="text"
                    defaultValue={settings.name}
                    onBlur={(e) => updateWorkspaceMutation.mutate({ name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Workspace Logo URL</label>
                  <input
                    type="text"
                    defaultValue={settings.logo_url || ''}
                    onBlur={(e) => updateWorkspaceMutation.mutate({ logo_url: e.target.value || null })}
                    className="w-full px-3.5 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    defaultChecked={settings.allow_member_invites}
                    onChange={(e) => updateWorkspaceMutation.mutate({ allow_member_invites: e.target.checked })}
                    className="rounded border-white/10 bg-[#1D2024] text-[#5BB98C] focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                    id="allow_invites"
                  />
                  <label htmlFor="allow_invites" className="text-xs text-[#A7ADB5] cursor-pointer">Allow team members to invite new users</label>
                </div>
              </div>
            )}

            {/* TAB 6: AUDIT LOGS */}
            {activeTab === 'audit' && (
              <div className="border border-white/[0.06] bg-[#171A1D] rounded-2xl overflow-hidden text-left shadow-md">
                <table className="w-full text-xs text-[#A7ADB5] border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="p-4 font-bold text-white">Timestamp</th>
                      <th className="p-4 font-bold text-white">Action</th>
                      <th className="p-4 font-bold text-white">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.slice(0, 30).map((log: any) => (
                      <tr key={log.id} className="border-b border-white/[0.04] hover:bg-white/[0.01]">
                        <td className="p-4 font-mono">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-4 font-bold text-white">{log.action}</td>
                        <td className="p-4 leading-relaxed">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

      </div>
    </MainLayout>
  )
}
