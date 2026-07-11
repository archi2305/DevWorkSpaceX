'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Mail,
  RefreshCw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader,
  Copy,
  Check
} from 'lucide-react'
import { invitationService, WorkspaceInvitation } from '@/services/invitation'

export default function InvitationsPage() {
  const queryClient = useQueryClient()
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)

  // 1. Fetch invitations
  const { data: invitations = [], isLoading, refetch } = useQuery<WorkspaceInvitation[]>({
    queryKey: ['workspace-invitations'],
    queryFn: invitationService.getInvitations
  })

  // 2. Mutations
  const resendMutation = useMutation({
    mutationFn: (id: string) => invitationService.resendInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations'] })
    }
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => invitationService.cancelInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations'] })
    }
  })

  const acceptMutation = useMutation({
    mutationFn: (token: string) => invitationService.acceptInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    }
  })

  const rejectMutation = useMutation({
    mutationFn: (token: string) => invitationService.rejectInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations'] })
    }
  })

  const handleCopyToken = (id: string, token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedTokenId(id)
    setTimeout(() => setCopiedTokenId(null), 2000)
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header section */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5 text-left">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <Mail className="h-6 w-6 text-[#5BB98C]" /> Workspace Invitations
            </h1>
            <p className="text-xs text-[#A7ADB5] mt-1">Track pending token invites, resend expired requests, and manage access privileges.</p>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-white/[0.06] bg-[#171A1D] hover:bg-[#23272B] text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Invitations Table / List */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader className="h-6 w-6 text-[#5BB98C] animate-spin" />
          </div>
        ) : (
          <div className="border border-white/[0.06] bg-[#171A1D] rounded-2xl overflow-hidden shadow-md text-left">
            <table className="w-full text-xs text-[#A7ADB5] border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="p-4 font-bold text-white">Email Address</th>
                  <th className="p-4 font-bold text-white">Role</th>
                  <th className="p-4 font-bold text-white">Token</th>
                  <th className="p-4 font-bold text-white">Status</th>
                  <th className="p-4 font-bold text-white">Expires At</th>
                  <th className="p-4 font-bold text-white text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invite) => {
                  const isExpired = new Date(invite.expires_at) < new Date()
                  const displayStatus = invite.status === 'pending' && isExpired ? 'expired' : invite.status

                  return (
                    <tr key={invite.id} className="border-b border-white/[0.04] hover:bg-white/[0.01]">
                      <td className="p-4 font-semibold text-white">{invite.email}</td>
                      <td className="p-4">
                        <span className="text-[10px] bg-white/5 border border-white/10 text-white rounded px-2 py-0.5 font-bold uppercase">
                          {invite.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] max-w-[120px]">
                          <span className="truncate">{invite.token}</span>
                          <button
                            onClick={() => handleCopyToken(invite.id, invite.token)}
                            className="p-1 text-[#7E848C] hover:text-white cursor-pointer"
                          >
                            {copiedTokenId === invite.id ? <Check className="h-3 w-3 text-[#5BB98C]" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase inline-flex items-center gap-1 ${
                          displayStatus === 'accepted' ? 'bg-[#5BB98C]/15 text-[#5BB98C]' :
                          displayStatus === 'rejected' || displayStatus === 'cancelled' ? 'bg-red-500/15 text-red-400' :
                          displayStatus === 'expired' ? 'bg-yellow-500/15 text-yellow-500' :
                          'bg-blue-500/15 text-blue-400'
                        }`}>
                          {displayStatus === 'accepted' && <CheckCircle2 className="h-3 w-3" />}
                          {displayStatus === 'rejected' && <XCircle className="h-3 w-3" />}
                          {displayStatus === 'expired' && <AlertTriangle className="h-3 w-3" />}
                          {displayStatus === 'pending' && <Clock className="h-3 w-3" />}
                          {displayStatus}
                        </span>
                      </td>
                      <td className="p-4 text-[#7E848C]">
                        {new Date(invite.expires_at).toLocaleDateString()} {new Date(invite.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {invite.status === 'pending' && !isExpired && (
                            <>
                              <button
                                onClick={() => acceptMutation.mutate(invite.token)}
                                className="text-[10px] font-bold text-[#5BB98C] hover:underline cursor-pointer"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => rejectMutation.mutate(invite.token)}
                                className="text-[10px] font-bold text-red-400 hover:underline cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => cancelMutation.mutate(invite.id)}
                                className="text-[10px] font-bold text-[#7E848C] hover:underline cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {(invite.status === 'expired' || invite.status === 'cancelled' || isExpired) && (
                            <button
                              onClick={() => resendMutation.mutate(invite.id)}
                              className="text-[10px] font-bold text-[#5BB98C] hover:underline cursor-pointer"
                            >
                              Resend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {invitations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#7E848C] text-xs">
                      No workspace invitations created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </MainLayout>
  )
}
