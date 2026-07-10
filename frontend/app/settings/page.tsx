'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Settings,
  Key,
  Shield,
  Link as LinkIcon,
  CreditCard,
  Trash2,
  Download,
  AlertTriangle,
  Upload,
  Globe,
  Monitor,
  Copy,
  Check,
  Loader,
  Plus
} from 'lucide-react'
import { workspaceService, WorkspaceSettings, APIKey, UserSession, ConnectedAccount } from '@/services/workspace'

type SettingsTab = 'general' | 'api-keys' | 'security' | 'integrations' | 'billing' | 'danger'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  
  // New Key Form
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKeyToken, setGeneratedKeyToken] = useState<string | null>(null)
  
  // Connected account name state (Mock)
  const [usernameInput, setUsernameInput] = useState('')

  // Query Settings
  const { data: settings, isLoading: loadingSettings } = useQuery<WorkspaceSettings>({
    queryKey: ['workspace-settings'],
    queryFn: () => workspaceService.getSettings()
  })

  // Query API Keys
  const { data: apiKeys = [], isLoading: loadingKeys } = useQuery<APIKey[]>({
    queryKey: ['workspace-api-keys'],
    queryFn: () => workspaceService.getAPIKeys(),
    enabled: activeTab === 'api-keys'
  })

  // Query Sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery<UserSession[]>({
    queryKey: ['workspace-sessions'],
    queryFn: () => workspaceService.getSessions(),
    enabled: activeTab === 'security'
  })

  // Query Connected Accounts
  const { data: connectedAccounts = [], isLoading: loadingAccounts } = useQuery<ConnectedAccount[]>({
    queryKey: ['workspace-connected-accounts'],
    queryFn: () => workspaceService.getConnectedAccounts(),
    enabled: activeTab === 'integrations'
  })

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<WorkspaceSettings>) => workspaceService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-settings'] })
    }
  })

  const createKeyMutation = useMutation({
    mutationFn: (name: string) => workspaceService.createAPIKey(name),
    onSuccess: (data) => {
      setGeneratedKeyToken(data.token)
      setNewKeyName('')
      queryClient.invalidateQueries({ queryKey: ['workspace-api-keys'] })
    }
  })

  const revokeKeyMutation = useMutation({
    mutationFn: (keyId: string) => workspaceService.revokeAPIKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-api-keys'] })
    }
  })

  const connectAccountMutation = useMutation({
    mutationFn: (data: { provider: string; username: string }) =>
      workspaceService.connectAccount(data.provider, data.username),
    onSuccess: () => {
      setUsernameInput('')
      queryClient.invalidateQueries({ queryKey: ['workspace-connected-accounts'] })
    }
  })

  const disconnectAccountMutation = useMutation({
    mutationFn: (id: string) => workspaceService.disconnectAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-connected-accounts'] })
    }
  })

  const handleExportData = async () => {
    try {
      const res = await workspaceService.exportWorkspaceData()
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.payload, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', dataStr)
      downloadAnchor.setAttribute('download', `workspace_export_${Date.now()}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
    } catch (err) {
      console.error('Failed to export workspace', err)
    }
  }

  const handleCopyToken = (token: string, id: string) => {
    navigator.clipboard.writeText(token)
    setCopiedKeyId(id)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  const handleDeleteWorkspace = async () => {
    const confirmation = window.confirm('Are you absolutely sure you want to delete this workspace? This action is permanent.')
    if (confirmation) {
      try {
        await workspaceService.deleteWorkspace()
        window.location.reload()
      } catch (err) {
        console.error('Failed to delete workspace', err)
      }
    }
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 text-left">
        
        {/* Settings Tab Sidebar Navigation */}
        <div className="w-full md:w-64 space-y-1">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider px-3 mb-4">Workspace Settings</h2>
          
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
              activeTab === 'general' ? 'bg-[#5BB98C]/10 text-[#5BB98C]' : 'text-[#A7ADB5] hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="h-4 w-4" /> General
          </button>
          
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
              activeTab === 'api-keys' ? 'bg-[#5BB98C]/10 text-[#5BB98C]' : 'text-[#A7ADB5] hover:bg-white/5 hover:text-white'
            }`}
          >
            <Key className="h-4 w-4" /> API Keys
          </button>
          
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
              activeTab === 'security' ? 'bg-[#5BB98C]/10 text-[#5BB98C]' : 'text-[#A7ADB5] hover:bg-white/5 hover:text-white'
            }`}
          >
            <Shield className="h-4 w-4" /> Sessions & Security
          </button>
          
          <button
            onClick={() => setActiveTab('integrations')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
              activeTab === 'integrations' ? 'bg-[#5BB98C]/10 text-[#5BB98C]' : 'text-[#A7ADB5] hover:bg-white/5 hover:text-white'
            }`}
          >
            <LinkIcon className="h-4 w-4" /> Connected Accounts
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
              activeTab === 'billing' ? 'bg-[#5BB98C]/10 text-[#5BB98C]' : 'text-[#A7ADB5] hover:bg-white/5 hover:text-white'
            }`}
          >
            <CreditCard className="h-4 w-4" /> Billing & Plan
          </button>

          <div className="pt-4 border-t border-white/[0.06] mt-4">
            <button
              onClick={() => setActiveTab('danger')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                activeTab === 'danger' ? 'bg-[#EB5757]/10 text-[#EB5757]' : 'text-[#EB5757] hover:bg-[#EB5757]/5'
              }`}
            >
              <Trash2 className="h-4 w-4" /> Danger Zone
            </button>
          </div>
        </div>

        {/* Tab Detail Pane */}
        <div className="flex-1 bg-[#171A1D] border border-white/[0.06] rounded-2xl p-6 md:p-8 space-y-6">
          {loadingSettings ? (
            <div className="flex justify-center items-center h-48">
              <Loader className="h-6 w-6 text-[#5BB98C] animate-spin" />
            </div>
          ) : (
            settings && (
              <>
                {/* 1. General Tab */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white">General Settings</h3>
                      <p className="text-[11px] text-[#A7ADB5] mt-1">Configure workspace names, timezones, themes, and member controls.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Name input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Workspace Name</label>
                        <input
                          type="text"
                          defaultValue={settings.name}
                          onBlur={(e) => updateSettingsMutation.mutate({ name: e.target.value })}
                          placeholder="My Workspace"
                          className="w-full px-3.5 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none transition-colors"
                        />
                      </div>

                      {/* Logo URL input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Workspace Logo URL</label>
                        <input
                          type="text"
                          defaultValue={settings.logo_url || ''}
                          onBlur={(e) => updateSettingsMutation.mutate({ logo_url: e.target.value || null })}
                          placeholder="https://example.com/logo.png"
                          className="w-full px-3.5 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none transition-colors"
                        />
                      </div>

                      {/* Theme selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Workspace Theme</label>
                          <select
                            value={settings.theme}
                            onChange={(e) => updateSettingsMutation.mutate({ theme: e.target.value })}
                            className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] text-xs text-white rounded-xl outline-none focus:border-[#5BB98C]"
                          >
                            <option value="dark">Charcoal Dark Theme</option>
                            <option value="light">Vercel White Theme</option>
                            <option value="system">Follow System Defaults</option>
                          </select>
                        </div>

                        {/* Timezone selection */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider">Workspace Timezone</label>
                          <select
                            value={settings.timezone}
                            onChange={(e) => updateSettingsMutation.mutate({ timezone: e.target.value })}
                            className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] text-xs text-white rounded-xl outline-none focus:border-[#5BB98C]"
                          >
                            <option value="UTC">UTC (Coordinated Universal Time)</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                          </select>
                        </div>
                      </div>

                      {/* Allow member invites check */}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="allow_invites"
                          checked={settings.allow_member_invites}
                          onChange={(e) => updateSettingsMutation.mutate({ allow_member_invites: e.target.checked })}
                          className="rounded border-white/10 bg-[#1D2024] text-[#5BB98C] focus:ring-[#5BB98C] h-4 w-4"
                        />
                        <label htmlFor="allow_invites" className="text-xs text-[#F5F5F5] cursor-pointer">
                          Allow team developers and designers to invite new members
                        </label>
                      </div>

                      {/* Email notifications check */}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="enable_email_notifications"
                          checked={settings.enable_email_notifications}
                          onChange={(e) => updateSettingsMutation.mutate({ enable_email_notifications: e.target.checked })}
                          className="rounded border-white/10 bg-[#1D2024] text-[#5BB98C] focus:ring-[#5BB98C] h-4 w-4 cursor-pointer"
                        />
                        <label htmlFor="enable_email_notifications" className="text-xs text-[#F5F5F5] cursor-pointer">
                          Enable email alerts for task assignments and mentions
                        </label>
                      </div>

                      {/* Desktop notifications check */}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="enable_desktop_notifications"
                          checked={settings.enable_desktop_notifications}
                          onChange={(e) => updateSettingsMutation.mutate({ enable_desktop_notifications: e.target.checked })}
                          className="rounded border-white/10 bg-[#1D2024] text-[#5BB98C] focus:ring-[#5BB98C] h-4 w-4 cursor-pointer"
                        />
                        <label htmlFor="enable_desktop_notifications" className="text-xs text-[#F5F5F5] cursor-pointer">
                          Enable real-time push desktop alerts for comments and project updates
                        </label>
                      </div>
                    </div>

                    {/* Export Workspace Backup */}
                    <div className="pt-6 border-t border-white/[0.06] space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-white">Export Workspace Backup</h4>
                        <p className="text-[10px] text-[#A7ADB5]">Download a complete JSON export file containing your projects, tasks, and documentation logs.</p>
                      </div>
                      <button
                        onClick={handleExportData}
                        className="px-4 py-2 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="h-4 w-4" /> Export Backup File
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. API Keys Tab */}
                {activeTab === 'api-keys' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white">Developer API Keys</h3>
                      <p className="text-[11px] text-[#A7ADB5] mt-1">Expose read/write hooks to sync tasks, projects, and deadlines externally.</p>
                    </div>

                    {/* API Key list */}
                    <div className="space-y-3">
                      {loadingKeys ? (
                        <div className="flex justify-center py-6">
                          <Loader className="h-4 w-4 text-[#5BB98C] animate-spin" />
                        </div>
                      ) : (
                        apiKeys.map((key) => (
                          <div key={key.id} className="p-3 border border-white/[0.04] bg-[#1D2024] rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-white">{key.name}</p>
                              <span className="text-[9px] text-[#7E848C] font-mono">Prefix: {key.key_prefix} | Generated {new Date(key.created_at).toLocaleDateString()}</span>
                            </div>

                            <button
                              onClick={() => revokeKeyMutation.mutate(key.id)}
                              className="p-2 rounded-lg bg-white/5 hover:bg-[#EB5757]/15 hover:text-[#EB5757] text-[#7E848C] transition-colors cursor-pointer"
                              title="Revoke Token"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                      {apiKeys.length === 0 && !loadingKeys && (
                        <p className="text-xs text-[#7E848C] italic text-center py-6">No developer keys configured. Generate one below.</p>
                      )}
                    </div>

                    {/* New Key Generator Form */}
                    <div className="pt-6 border-t border-white/[0.06] space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-white">Generate Developer API Key</h4>
                        <p className="text-[10px] text-[#A7ADB5] mt-0.5">API tokens are displayed once. Save them securely.</p>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          placeholder="e.g. CI/CD Deployment Token"
                          className="flex-1 px-3.5 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none transition-colors"
                        />
                        <button
                          onClick={() => createKeyMutation.mutate(newKeyName)}
                          disabled={!newKeyName.trim() || createKeyMutation.isPending}
                          className="px-4 py-2 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" /> Generate Key
                        </button>
                      </div>

                      {/* Display generated key */}
                      {generatedKeyToken && (
                        <div className="p-3 border border-yellow-500/20 bg-yellow-500/5 rounded-xl space-y-2">
                          <p className="text-[9px] font-extrabold text-yellow-500 uppercase tracking-wider">⚠️ SAVE THIS KEY NOW (IT WILL NOT BE SHOWN AGAIN)</p>
                          <div className="flex items-center justify-between bg-[#1D2024] p-2 rounded-lg border border-white/5 font-mono text-[10px]">
                            <span className="text-white select-all">{generatedKeyToken}</span>
                            <button
                              onClick={() => handleCopyToken(generatedKeyToken, 'token')}
                              className="p-1 rounded hover:bg-white/5 text-[#A7ADB5] hover:text-white"
                            >
                              {copiedKeyId === 'token' ? <Check className="h-3.5 w-3.5 text-[#5BB98C]" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Security Sessions Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white">Active Sessions & Security Log</h3>
                      <p className="text-[11px] text-[#A7ADB5] mt-1">Review active devices, IP addresses, and user-agent records authorized to access settings.</p>
                    </div>

                    <div className="space-y-3.5">
                      {loadingSessions ? (
                        <div className="flex justify-center py-6">
                          <Loader className="h-4 w-4 text-[#5BB98C] animate-spin" />
                        </div>
                      ) : (
                        sessions.map((sess) => (
                          <div key={sess.id} className="p-4 border border-white/[0.04] bg-[#1D2024] rounded-2xl flex items-start gap-3">
                            <Monitor className="h-5 w-5 text-[#5BB98C] mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-white">{sess.user_agent}</p>
                              <div className="flex items-center gap-2 text-[9px] text-[#7E848C]">
                                <span className="font-mono bg-white/5 px-1 py-0.2 rounded">{sess.ip_address}</span>
                                <span>•</span>
                                <span>Last Active: {new Date(sess.last_active).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Connected Accounts Integrations Tab */}
                {activeTab === 'integrations' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white">Connected Accounts</h3>
                      <p className="text-[11px] text-[#A7ADB5] mt-1">Link your workspace profiles to automate commits, repository integrations, and notifications.</p>
                    </div>

                    {/* Integrated list status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* GitHub integration card */}
                      {(() => {
                        const ghAccount = connectedAccounts.find(c => c.provider === 'github')
                        return (
                          <div className="p-4 border border-white/[0.04] bg-[#1D2024] rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">🐙 GitHub Profile</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                ghAccount ? 'bg-[#5BB98C]/15 text-[#5BB98C]' : 'bg-white/5 text-[#7E848C]'
                              }`}>
                                {ghAccount ? 'Connected' : 'Disconnected'}
                              </span>
                            </div>
                            
                            {ghAccount ? (
                              <div className="flex items-center justify-between text-xs pt-2">
                                <span className="text-[#A7ADB5] font-mono">@{ghAccount.username}</span>
                                <button
                                  onClick={() => disconnectAccountMutation.mutate(ghAccount.id)}
                                  className="text-[10px] text-[#EB5757] font-semibold hover:underline"
                                >
                                  Disconnect
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2 pt-2">
                                <input
                                  type="text"
                                  placeholder="GitHub Username"
                                  value={usernameInput}
                                  onChange={(e) => setUsernameInput(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-white/5 bg-[#171A1D] rounded-lg text-[10px] text-white outline-none focus:border-[#5BB98C]"
                                />
                                <button
                                  onClick={() => connectAccountMutation.mutate({ provider: 'github', username: usernameInput })}
                                  disabled={!usernameInput.trim()}
                                  className="w-full py-1.5 bg-[#5BB98C]/10 border border-[#5BB98C]/20 text-[#5BB98C] font-semibold rounded-lg text-[10px] transition-colors hover:bg-[#5BB98C] hover:text-[#111315]"
                                >
                                  Connect Profile
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {/* Slack integration card */}
                      {(() => {
                        const slackAccount = connectedAccounts.find(c => c.provider === 'slack')
                        return (
                          <div className="p-4 border border-white/[0.04] bg-[#1D2024] rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">💬 Slack Channel</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                slackAccount ? 'bg-[#5BB98C]/15 text-[#5BB98C]' : 'bg-white/5 text-[#7E848C]'
                              }`}>
                                {slackAccount ? 'Connected' : 'Disconnected'}
                              </span>
                            </div>

                            {slackAccount ? (
                              <div className="flex items-center justify-between text-xs pt-2">
                                <span className="text-[#A7ADB5] font-mono">#{slackAccount.username}</span>
                                <button
                                  onClick={() => disconnectAccountMutation.mutate(slackAccount.id)}
                                  className="text-[10px] text-[#EB5757] font-semibold hover:underline"
                                >
                                  Disconnect
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2 pt-2">
                                <input
                                  type="text"
                                  placeholder="Slack Channel Name"
                                  value={usernameInput}
                                  onChange={(e) => setUsernameInput(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-white/5 bg-[#171A1D] rounded-lg text-[10px] text-white outline-none focus:border-[#5BB98C]"
                                />
                                <button
                                  onClick={() => connectAccountMutation.mutate({ provider: 'slack', username: usernameInput })}
                                  disabled={!usernameInput.trim()}
                                  className="w-full py-1.5 bg-[#5BB98C]/10 border border-[#5BB98C]/20 text-[#5BB98C] font-semibold rounded-lg text-[10px] transition-colors hover:bg-[#5BB98C] hover:text-[#111315]"
                                >
                                  Connect Channel
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {/* 5. Billing Tab Placeholder */}
                {activeTab === 'billing' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white">Billing & Plan</h3>
                      <p className="text-[11px] text-[#A7ADB5] mt-1">Manage corporate subscriptions, seats quota limits, and billing schedules.</p>
                    </div>

                    <div className="p-5 border border-white/[0.04] bg-[#1D2024] rounded-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[8px] bg-[#5BB98C]/15 border border-[#5BB98C]/20 text-[#5BB98C] font-bold uppercase rounded px-1.5 py-0.5">CURRENT PLAN</span>
                        <h4 className="text-sm font-extrabold text-white mt-2">Linear Workspace Pro Tier</h4>
                        <p className="text-[10px] text-[#A7ADB5] mt-0.5">Unlimited projects, tasks, file storage, and webhook dispatches.</p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xl font-extrabold text-white">$12<span className="text-xs font-semibold text-[#A7ADB5]"> / seat / mo</span></p>
                        <span className="text-[9px] text-[#7E848C]">Next renewal invoice: Oct 15, 2026</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Danger Zone Tab */}
                {activeTab === 'danger' && (
                  <div className="space-y-6">
                    <div className="p-4 border border-[#EB5757]/20 bg-[#EB5757]/5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-[#EB5757]">
                        <AlertTriangle className="h-5 w-5" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">Critical Warning Zone</h4>
                      </div>
                      <p className="text-[10px] text-[#A7ADB5] leading-relaxed">
                        Deleting this workspace will immediately and permanently purge all associated projects, tasks, member permissions, documents, and logs. This operation is not reversible.
                      </p>

                      <button
                        onClick={handleDeleteWorkspace}
                        className="px-4 py-2 bg-[#EB5757] hover:bg-[#EB5757]/90 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer mt-2"
                      >
                        <Trash2 className="h-4 w-4" /> Permanently Delete Workspace
                      </button>
                    </div>
                  </div>
                )}
              </>
            )
          )}
        </div>

      </div>
    </MainLayout>
  )
}
