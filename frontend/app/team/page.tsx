'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Users,
  Search,
  UserPlus,
  Trash2,
  Mail,
  Shield,
  Calendar,
  X,
  Briefcase,
  CheckCircle,
  Clock,
  ChevronRight,
  Loader
} from 'lucide-react'
import { teamService, WorkspaceMember } from '@/services/team'
import { useCollaboration } from '@/hooks/use-collaboration'

const rolesList = ['Owner', 'Admin', 'Developer', 'Designer', 'Viewer']

export default function TeamPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  
  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null)

  // Invite form inputs
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('Developer')
  const [inviteError, setInviteError] = useState<string | null>(null)

  const { onlineUsers } = useCollaboration()

  // Query workspace members
  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ['workspace-members'],
    queryFn: teamService.getWorkspaceMembers
  })

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: teamService.inviteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setIsInviteOpen(false)
      setInviteEmail('')
      setInviteName('')
      setInviteRole('Developer')
      setInviteError(null)
    },
    onError: (err: any) => {
      setInviteError(err.response?.data?.detail || 'Invitation failed.')
    }
  })

  // Role update mutation
  const roleUpdateMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      teamService.updateMemberRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: teamService.removeMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setSelectedMember(null)
    }
  })

  // Load dynamic profile details for selected teammate
  const { data: profileDetails, isLoading: isProfileLoading } = useQuery({
    queryKey: ['member-profile', selectedMember?.id],
    queryFn: () => teamService.getMemberProfile(selectedMember!.id),
    enabled: !!selectedMember?.id
  })

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !inviteName.trim()) return
    setInviteError(null)
    inviteMutation.mutate({
      email: inviteEmail,
      full_name: inviteName,
      role: inviteRole
    })
  }

  const handleRoleChange = (memberId: string, role: string) => {
    roleUpdateMutation.mutate({ id: memberId, role })
  }

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member from the workspace?')) {
      removeMutation.mutate(memberId)
    }
  }

  // Filtering members list
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = roleFilter === 'All' || member.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <MainLayout>
      <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-8 py-6">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 text-left">
            <h1 className="text-xl font-bold text-[#F5F5F5] tracking-tight">Workspace Team</h1>
            <p className="text-xs text-[#A7ADB5]">
              Manage invitations, security credentials, and department roles.
            </p>
          </div>
          <button
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold px-4 py-2.5 text-xs transition-all cursor-pointer shadow-md self-start"
          >
            <UserPlus className="h-4 w-4" /> Invite Member
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7E848C]" />
            <input
              type="text"
              placeholder="Search member name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.06] bg-[#171A1D] text-xs text-[#F5F5F5] placeholder-[#7E848C] focus:border-[#5BB98C] outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#A7ADB5]">Filter Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#171A1D] text-xs text-[#F5F5F5] outline-none focus:border-[#5BB98C] cursor-pointer"
            >
              <option value="All">All Roles</option>
              {rolesList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((placeholder) => (
              <div
                key={placeholder}
                className="h-40 rounded-2xl border border-white/[0.06] bg-[#171A1D] animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/5 text-xs text-red-400 text-left">
            Failed to query workspace team logs.
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/[0.06] rounded-2xl bg-[#171A1D]/40 p-6">
            <Users className="h-10 w-10 text-[#7E848C]/40 mb-3" />
            <h3 className="text-sm font-bold text-[#F5F5F5]">No Members Found</h3>
            <p className="text-xs text-[#A7ADB5] mt-1.5 max-w-[280px]">
              Try adjusting your query filter or invite a teammate to collaborate!
            </p>
          </div>
        ) : (
          /* Members Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => {
              const initials = member.user.full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              const isOnline = onlineUsers.some(u => u.id === member.user.id)

              return (
                <motion.div
                  key={member.id}
                  layoutId={member.id}
                  className="rounded-2xl border border-white/[0.06] bg-[#171A1D] p-5 flex flex-col justify-between hover:border-[#5BB98C]/30 hover:shadow-lg transition-all duration-300 group relative"
                >
                  <div className="flex items-start gap-3.5 text-left">
                    {/* Avatar initials badge */}
                    <div className="relative flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-[#1D2024] border border-white/[0.06] flex items-center justify-center font-bold text-xs text-[#5BB98C]">
                        {member.user.profile_image ? (
                          <img
                            src={member.user.profile_image}
                            alt={member.user.full_name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          initials || '?'
                        )}
                      </div>
                      <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#171A1D] ${
                        isOnline ? 'bg-[#5BB98C]' : 'bg-[#7E848C]'
                      }`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-bold text-[#F5F5F5] truncate">
                          {member.user.full_name}
                        </h3>
                        <span className="text-[9px] bg-[#1D2024] border border-white/[0.06] text-[#5BB98C] rounded px-1.5 py-0.5 font-semibold">
                          {member.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#A7ADB5] truncate mt-0.5">
                        {member.user.email}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[8px] text-[#7E848C] uppercase font-bold tracking-wide">
                          {isOnline ? 'Active Now' : 'Away'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-3.5 mt-4">
                    {/* Role update select */}
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3 w-3 text-[#7E848C]" />
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="bg-transparent border-none text-[10px] text-[#A7ADB5] focus:text-[#F5F5F5] outline-none font-semibold cursor-pointer py-0.5"
                      >
                        {rolesList.map((r) => (
                          <option key={r} value={r} className="bg-[#171A1D] text-[#F5F5F5]">
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="text-[9px] font-bold text-[#5BB98C] hover:text-[#B7E4C7] cursor-pointer"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#EB5757] hover:text-red-400 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Roles Permission Matrix Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#171A1D] p-6 space-y-4 shadow-lg text-left mt-10">
          <div className="border-b border-white/[0.06] pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-[#5BB98C]" /> Workspace Roles & Permissions Matrix
            </h2>
            <p className="text-[11px] text-[#A7ADB5] mt-1">Workspace operations mapped to dynamic user roles policies.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[#7E848C]">
                  <th className="py-2.5 font-bold uppercase tracking-wider">Role</th>
                  <th className="py-2.5 text-center font-bold uppercase tracking-wider">Manage Workspace</th>
                  <th className="py-2.5 text-center font-bold uppercase tracking-wider">Invite Members</th>
                  <th className="py-2.5 text-center font-bold uppercase tracking-wider">Create Projects</th>
                  <th className="py-2.5 text-center font-bold uppercase tracking-wider">Delete Projects</th>
                  <th className="py-2.5 text-center font-bold uppercase tracking-wider">Delete Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-[#A7ADB5]">
                {[
                  { role: 'Owner', manage: true, invite: true, create: true, del_proj: true, del_ws: true },
                  { role: 'Admin', manage: true, invite: true, create: true, del_proj: false, del_ws: false },
                  { role: 'Developer', manage: false, invite: false, create: true, del_proj: false, del_ws: false },
                  { role: 'Designer', manage: false, invite: false, create: true, del_proj: false, del_ws: false },
                  { role: 'Viewer', manage: false, invite: false, create: false, del_proj: false, del_ws: false },
                ].map((row) => (
                  <tr key={row.role} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-bold text-white">{row.role}</td>
                    <td className="py-3 text-center">{row.manage ? <span className="text-[#5BB98C] font-semibold">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="py-3 text-center">{row.invite ? <span className="text-[#5BB98C] font-semibold">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="py-3 text-center">{row.create ? <span className="text-[#5BB98C] font-semibold">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="py-3 text-center">{row.del_proj ? <span className="text-[#5BB98C] font-semibold">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="py-3 text-center">{row.del_ws ? <span className="text-[#5BB98C] font-semibold">✓</span> : <span className="text-red-400">✗</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invite Modal */}
        <AnimatePresence>
          {isInviteOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#171A1D] p-6 shadow-2xl relative"
              >
                <button
                  onClick={() => {
                    setIsInviteOpen(false)
                    setInviteError(null)
                  }}
                  className="absolute right-4 top-4 rounded-xl p-1.5 text-[#A7ADB5] hover:bg-white/5 hover:text-[#F5F5F5] transition-all cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>

                <h3 className="text-base font-bold text-[#F5F5F5] mb-2 text-left">Invite Workspace Member</h3>
                <p className="text-xs text-[#A7ADB5] mb-4 text-left">
                  Collaborate with teammates by inviting them to this workspace environment.
                </p>

                {inviteError && (
                  <div className="p-3 mb-3 text-xs font-semibold rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-left">
                    {inviteError}
                  </div>
                )}

                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-[#A7ADB5] block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="e.g. Robin Van Persie"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-sm text-[#F5F5F5] focus:border-[#5BB98C] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-[#A7ADB5] block">Email Address</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="e.g. robin@dev.workspace"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-sm text-[#F5F5F5] focus:border-[#5BB98C] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-[#A7ADB5] block">Workspace Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-[#F5F5F5] outline-none focus:border-[#5BB98C] cursor-pointer"
                    >
                      {rolesList.map((r) => (
                        <option key={r} value={r} className="bg-[#171A1D]">
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsInviteOpen(false)
                        setInviteError(null)
                      }}
                      className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#A7ADB5] hover:bg-[#1D2024] hover:text-[#F5F5F5] transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inviteMutation.isPending}
                      className="rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold px-4 py-2.5 text-xs transition-all cursor-pointer shadow-md"
                    >
                      {inviteMutation.isPending ? 'Inviting...' : 'Send Invitation'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Member Profile Sheets/Modal */}
        <AnimatePresence>
          {selectedMember && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#171A1D] p-6 shadow-2xl relative text-left"
              >
                <button
                  onClick={() => setSelectedMember(null)}
                  className="absolute right-4 top-4 rounded-xl p-1.5 text-[#A7ADB5] hover:bg-white/5 hover:text-[#F5F5F5] transition-all cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>

                <div className="flex items-center gap-4 border-b border-white/[0.06] pb-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-[#1D2024] border border-white/[0.06] flex items-center justify-center font-bold text-lg text-[#5BB98C]">
                    {selectedMember.user.profile_image ? (
                      <img
                        src={selectedMember.user.profile_image}
                        alt={selectedMember.user.full_name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      selectedMember.user.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F5F5]">{selectedMember.user.full_name}</h3>
                    <p className="text-xs text-[#A7ADB5] mt-0.5">{selectedMember.user.email}</p>
                    <span className="inline-block text-[9px] bg-[#5BB98C]/10 border border-[#5BB98C]/20 text-[#5BB98C] rounded-full px-2 py-0.5 font-bold mt-1.5">
                      {selectedMember.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#7E848C] uppercase tracking-wider">Account Metadata & Workload</h4>
                    <div className="grid grid-cols-2 gap-2.5 bg-[#1D2024] border border-white/[0.06] rounded-xl p-3.5 text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-[#7E848C]">Joined</span>
                        <span className="text-white font-bold">{new Date(selectedMember.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-[#7E848C]">Workload State</span>
                        {(() => {
                          const tc = profileDetails?.tasks_count ?? 0
                          if (tc >= 8) return <span className="text-[#EB5757] font-bold">High Load ({tc})</span>
                          if (tc >= 4) return <span className="text-orange-400 font-bold">Medium Load ({tc})</span>
                          if (tc > 0) return <span className="text-[#5BB98C] font-bold">Optimal ({tc})</span>
                          return <span className="text-[#7E848C] font-medium">None</span>
                        })()}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-[#7E848C]">Projects Count</span>
                        <span className="text-[#5BB98C] font-extrabold">{profileDetails?.projects_count ?? 0}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-[#7E848C]">Status</span>
                        <span className="text-[#5BB98C] font-bold">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Workload Assignments */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#7E848C] uppercase tracking-wider">Active Task Assignments</h4>
                    <div className="bg-[#1D2024] border border-white/[0.06] rounded-xl p-3.5 text-xs text-[#A7ADB5] space-y-2 max-h-[150px] overflow-y-auto">
                      {isProfileLoading ? (
                        <div className="flex justify-center py-2"><Loader className="h-4 w-4 text-[#5BB98C] animate-spin" /></div>
                      ) : (profileDetails as any)?.assigned_tasks?.length > 0 ? (
                        (profileDetails as any).assigned_tasks.map((task: any) => (
                          <div key={task.id} className="flex justify-between items-center border-b border-white/[0.04] pb-1.5 last:border-0 last:pb-0">
                            <span className="text-white font-semibold truncate max-w-[200px]" title={task.title}>{task.title}</span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-[#A7ADB5]">{task.status}</span>
                              <span className="text-[8px] text-[#EB5757] font-bold uppercase">{task.priority}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="italic text-[10px] text-[#7E848C]">No active task assignments.</p>
                      )}
                    </div>
                  </div>

                  {/* Recent Activities Feed */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#7E848C] uppercase tracking-wider">Recent Activity Logs</h4>
                    <div className="bg-[#1D2024] border border-white/[0.06] rounded-xl p-3.5 text-xs text-[#A7ADB5] space-y-2 max-h-[150px] overflow-y-auto">
                      {isProfileLoading ? (
                        <div className="flex justify-center py-2"><Loader className="h-4 w-4 text-[#5BB98C] animate-spin" /></div>
                      ) : profileDetails?.recent_activities?.length > 0 ? (
                        profileDetails.recent_activities.map((act: any) => (
                          <div key={act.id} className="border-b border-white/[0.04] pb-1.5 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center text-[10px] font-bold text-white">
                              <span>{act.action}</span>
                              <span className="text-[8px] text-[#7E848C] font-normal">{new Date(act.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[10px] text-[#7E848C] mt-0.5">{act.details}</p>
                          </div>
                        ))
                      ) : (
                        <p className="italic text-[10px] text-[#7E848C]">No recent activity logs recorded.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  )
}
