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
  Plus,
  User as UserIcon,
  RefreshCw,
  Clock
} from 'lucide-react'
import { workspaceService, WorkspaceSettings, APIKey, UserSession, ConnectedAccount } from '@/services/workspace'
import { userPreferenceService } from '@/services/user-preference'
import { integrationService } from '@/services/integration'
import { exportService } from '@/services/export'

type SettingsTab = 'general' | 'preferences' | 'api-keys' | 'security' | 'integrations' | 'integrations-modular' | 'billing' | 'danger'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  // Modular Integrations states
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookName, setWebhookName] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [slackWebhook, setSlackWebhook] = useState('')
  const [discordWebhook, setDiscordWebhook] = useState('')
  const [gcalId, setGcalId] = useState('')

  // Query Integrations
  const { data: integrations = [], isLoading: loadingIntegrations } = useQuery({
    queryKey: ['workspace-integrations-modular'],
    queryFn: () => integrationService.getIntegrations(),
    enabled: activeTab === 'integrations-modular'
  })

  // Mutations
  const createIntegrationMutation = useMutation({
    mutationFn: (data: { provider: string; config: any }) => integrationService.createIntegration(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-integrations-modular'] })
      setWebhookUrl('')
      setWebhookName('')
      setGithubRepo('')
      setSlackWebhook('')
      setDiscordWebhook('')
      setGcalId('')
    }
  })

  const deleteIntegrationMutation = useMutation({
    mutationFn: (id: string) => integrationService.deleteIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-integrations-modular'] })
    }
  })
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

  const { data: preferences, isLoading: loadingPrefs } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => userPreferenceService.getPreferences(),
    enabled: activeTab === 'preferences'
  })

  // Mutations
  const updatePrefsMutation = useMutation({
    mutationFn: (data: any) => userPreferenceService.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] })
    }
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<WorkspaceSettings>) => workspaceService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-settings'] })
    }
  })

  // API Key creation parameters
  const [expiresInDays, setExpiresInDays] = useState<number>(30)
  const [keyScopes, setKeyScopes] = useState<string[]>(['read'])
  const [activeHistoryKeyId, setActiveHistoryKeyId] = useState<string | null>(null)

  // Query API Key usage history
  const { data: keyHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['workspace-api-key-history', activeHistoryKeyId],
    queryFn: () => workspaceService.getAPIKeyHistory(activeHistoryKeyId!),
    enabled: !!activeHistoryKeyId
  })

  const createKeyMutation = useMutation({
    mutationFn: (data: { name: string; expires_in_days?: number; scopes?: string[] }) =>
      workspaceService.createAPIKey(data.name, data.expires_in_days, data.scopes),
    onSuccess: (data) => {
      setGeneratedKeyToken(data.token)
      setNewKeyName('')
      queryClient.invalidateQueries({ queryKey: ['workspace-api-keys'] })
    }
  })

  const rotateKeyMutation = useMutation({
    mutationFn: (keyId: string) => workspaceService.rotateAPIKey(keyId),
    onSuccess: (data) => {
      setGeneratedKeyToken(data.token)
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
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
              activeTab === 'preferences' ? 'bg-[#5BB98C]/10 text-[#5BB98C]' : 'text-[#A7ADB5] hover:bg-white/5 hover:text-white'
            }`}
          >
            <UserIcon className="h-4 w-4" /> Preferences
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
            onClick={() => setActiveTab('integrations-modular')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
              activeTab === 'integrations-modular' ? 'bg-[#5BB98C]/10 text-[#5BB98C]' : 'text-[#A7ADB5] hover:bg-white/5 hover:text-white'
            }`}
          >
            <Globe className="h-4 w-4" /> Integrations (Workspace)
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
                {/* 1. Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white">User Preferences</h3>
                      <p className="text-[11px] text-[#A7ADB5] mt-1">Manage your personalized experience within the workspace.</p>
                    </div>
                    {loadingPrefs ? (
                      <div className="flex justify-center py-6">
                        <Loader className="h-4 w-4 text-[#5BB98C] animate-spin" />
                      </div>
                    ) : (
                      preferences && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider block">UI Theme</label>
                              <select
                                value={preferences.theme}
                                onChange={(e) => updatePrefsMutation.mutate({ theme: e.target.value })}
                                className="w-full px-3.5 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white"
                              >
                                <option value="System">System Default</option>
                                <option value="Dark">Dark Mode</option>
                                <option value="Light">Light Mode</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider block">Accent Color (Hex)</label>
                              <input
                                type="text"
                                value={preferences.accent_color}
                                onChange={(e) => updatePrefsMutation.mutate({ accent_color: e.target.value })}
                                className="w-full px-3.5 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider block">Interface Language</label>
                              <select
                                value={preferences.language}
                                onChange={(e) => updatePrefsMutation.mutate({ language: e.target.value })}
                                className="w-full px-3.5 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white"
                              >
                                <option value="en">English (US)</option>
                                <option value="es">Español</option>
                                <option value="fr">Français</option>
                              </select>
                            </div>
                          </div>

                          <div className="pt-2 space-y-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="shortcuts_enabled"
                                checked={preferences.keyboard_shortcuts_enabled}
                                onChange={(e) => updatePrefsMutation.mutate({ keyboard_shortcuts_enabled: e.target.checked })}
                                className="rounded border-white/10 bg-[#1D2024] text-[#5BB98C] h-4 w-4"
                              />
                              <label htmlFor="shortcuts_enabled" className="text-xs text-[#F5F5F5]">Enable Global Keyboard Shortcuts</label>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="email_notify"
                                checked={preferences.email_notifications}
                                onChange={(e) => updatePrefsMutation.mutate({ email_notifications: e.target.checked })}
                                className="rounded border-white/10 bg-[#1D2024] text-[#5BB98C] h-4 w-4"
                              />
                              <label htmlFor="email_notify" className="text-xs text-[#F5F5F5]">Receive Email Notifications</label>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="in_app_notify"
                                checked={preferences.in_app_notifications}
                                onChange={(e) => updatePrefsMutation.mutate({ in_app_notifications: e.target.checked })}
                                className="rounded border-white/10 bg-[#1D2024] text-[#5BB98C] h-4 w-4"
                              />
                              <label htmlFor="in_app_notify" className="text-xs text-[#F5F5F5]">Receive In-App Push Notifications</label>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

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
                            <option value="linear">Linear Slate Theme</option>
                            <option value="green">Forest Green Theme</option>
                          </select>
                        </div>

                        {/* Accent Color picker */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider block">Accent Branding Color</label>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="color"
                              value={settings.accent_color || '#5BB98C'}
                              onChange={(e) => updateSettingsMutation.mutate({ accent_color: e.target.value })}
                              className="w-10 h-8 rounded border border-white/[0.06] bg-[#1D2024] cursor-pointer"
                            />
                            <span className="text-xs font-mono text-[#A7ADB5] uppercase">{settings.accent_color || '#5BB98C'}</span>
                          </div>
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
                    <div className="pt-6 border-t border-white/[0.06] space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-white">Export Workspace Data</h4>
                        <p className="text-[10px] text-[#A7ADB5]">Download a complete dynamically generated export package containing all projects, tasks, documentations, and activities.</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          onClick={() => exportService.downloadExport('json')}
                          className="px-4 py-2 bg-[#1D2024] hover:bg-[#1D2024]/80 border border-white/[0.08] text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          JSON Format
                        </button>
                        <button
                          onClick={() => exportService.downloadExport('csv')}
                          className="px-4 py-2 bg-[#1D2024] hover:bg-[#1D2024]/80 border border-white/[0.08] text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          CSV Format
                        </button>
                        <button
                          onClick={() => exportService.downloadExport('excel')}
                          className="px-4 py-2 bg-[#1D2024] hover:bg-[#1D2024]/80 border border-white/[0.08] text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          Excel (XLS)
                        </button>
                        <button
                          onClick={() => exportService.downloadExport('markdown')}
                          className="px-4 py-2 bg-[#1D2024] hover:bg-[#1D2024]/80 border border-white/[0.08] text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          Markdown Summaries
                        </button>
                        <button
                          onClick={() => exportService.downloadExport('zip')}
                          className="px-4 py-2 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="h-4 w-4" /> Download ZIP Archive
                        </button>
                      </div>
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
                              <span className="text-[9px] text-[#7E848C] font-mono block mt-0.5">
                                Prefix: {key.key_prefix} | Scopes: ({key.scopes?.join(', ') || 'read'}) | Expires: {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => rotateKeyMutation.mutate(key.id)}
                                className="p-1.5 rounded-lg border border-white/[0.08] hover:bg-white/5 text-yellow-400 transition-colors cursor-pointer"
                                title="Rotate API Key"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setActiveHistoryKeyId(key.id)}
                                className="p-1.5 rounded-lg border border-white/[0.08] hover:bg-white/5 text-white transition-colors cursor-pointer"
                                title="Usage History Logs"
                              >
                                <Clock className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => revokeKeyMutation.mutate(key.id)}
                                className="p-1.5 rounded-lg border border-white/[0.08] hover:bg-white/5 text-red-400 transition-colors cursor-pointer"
                                title="Revoke Token"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                      {apiKeys.length === 0 && !loadingKeys && (
                        <p className="text-xs text-[#7E848C] italic text-center py-6">No developer keys configured. Generate one below.</p>
                      )}
                    </div>

                    {/* API Key Usage History logs */}
                    {activeHistoryKeyId && (
                      <div className="p-4 border border-white/[0.06] bg-[#1D2024] rounded-xl space-y-3">
                        <h4 className="text-xs font-bold text-white flex justify-between items-center">
                          <span>Usage history logs</span>
                          <button onClick={() => setActiveHistoryKeyId(null)} className="text-[10px] text-[#A7ADB5] hover:text-white">Close</button>
                        </h4>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {loadingHistory ? (
                            <div className="flex justify-center"><Loader className="h-3.5 w-3.5 animate-spin text-[#5BB98C]" /></div>
                          ) : (
                            keyHistory.map((hist) => (
                              <div key={hist.id} className="p-2 border border-white/[0.04] bg-[#121416] rounded-lg flex items-center justify-between text-[10px]">
                                <span className="font-mono text-white">{hist.method} {hist.endpoint}</span>
                                <span className={hist.status_code < 400 ? 'text-green-400' : 'text-red-400'}>{hist.status_code}</span>
                              </div>
                            ))
                          )}
                          {keyHistory.length === 0 && !loadingHistory && (
                            <div className="text-[#7E848C] text-center py-4">No usage history recorded.</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* New Key Generator Form */}
                    <div className="pt-6 border-t border-white/[0.06] space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-white">Generate Developer API Key</h4>
                        <p className="text-[10px] text-[#A7ADB5] mt-0.5">API tokens are displayed once. Save them securely.</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            placeholder="e.g. CI/CD Deployment Token"
                            className="flex-1 px-3.5 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none transition-colors"
                          />
                          <button
                            onClick={() => createKeyMutation.mutate({ name: newKeyName, expires_in_days: expiresInDays, scopes: keyScopes })}
                            disabled={!newKeyName.trim() || createKeyMutation.isPending}
                            className="px-4 py-2 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" /> Generate Key
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider block">Expiration</label>
                            <select
                              value={expiresInDays}
                              onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                              className="w-full px-3.5 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white"
                            >
                              <option value={7}>7 Days</option>
                              <option value={30}>30 Days</option>
                              <option value={90}>90 Days</option>
                              <option value={0}>No Expiration</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#A7ADB5] uppercase tracking-wider block">Permissions Scopes</label>
                            <div className="flex gap-4 pt-1.5">
                              <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={keyScopes.includes('read')}
                                  onChange={(e) => setKeyScopes(e.target.checked ? [...keyScopes, 'read'] : keyScopes.filter(s => s !== 'read'))}
                                  className="rounded text-[#5BB98C] bg-[#1D2024] h-3.5 w-3.5"
                                />
                                read
                              </label>
                              <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={keyScopes.includes('write')}
                                  onChange={(e) => setKeyScopes(e.target.checked ? [...keyScopes, 'write'] : keyScopes.filter(s => s !== 'write'))}
                                  className="rounded text-[#5BB98C] bg-[#1D2024] h-3.5 w-3.5"
                                />
                                write
                              </label>
                            </div>
                          </div>
                        </div>
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

                {/* Modular Integrations Tab */}
                {activeTab === 'integrations-modular' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white">Modular Workspace Integrations</h3>
                      <p className="text-[11px] text-[#A7ADB5] mt-1">Connect project changes, alerts, calendar syncing, and webhook notifications dynamically.</p>
                    </div>

                    {/* Active integrations listing */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-white">Active Connections</h4>
                      {loadingIntegrations ? (
                        <div className="flex justify-center"><Loader className="h-4 w-4 animate-spin text-[#5BB98C]" /></div>
                      ) : (
                        integrations.map((int) => (
                          <div key={int.id} className="p-3 border border-white/[0.04] bg-[#1D2024] rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-white">{int.provider}</p>
                              <span className="text-[9px] text-[#7E848C] font-mono">
                                Config: {JSON.stringify(int.config)}
                              </span>
                            </div>
                            <button
                              onClick={() => deleteIntegrationMutation.mutate(int.id)}
                              className="text-[10px] text-red-400 font-semibold hover:underline"
                            >
                              Disconnect
                            </button>
                          </div>
                        ))
                      )}
                      {integrations.length === 0 && !loadingIntegrations && (
                        <p className="text-xs text-[#7E848C] italic text-center py-4">No workspace integrations configured yet.</p>
                      )}
                    </div>

                    {/* Add Integrations Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
                      {/* GitHub config card */}
                      <div className="p-4 border border-white/[0.04] bg-[#1D2024] rounded-2xl space-y-3">
                        <h4 className="text-xs font-bold text-white">🐙 GitHub Integration</h4>
                        <input
                          type="text"
                          placeholder="e.g. owner/repo"
                          value={githubRepo}
                          onChange={(e) => setGithubRepo(e.target.value)}
                          className="w-full px-3 py-1.5 border border-white/5 bg-[#171A1D] rounded-lg text-[10px] text-white outline-none focus:border-[#5BB98C]"
                        />
                        <button
                          onClick={() => createIntegrationMutation.mutate({ provider: 'GitHub', config: { repository: githubRepo } })}
                          disabled={!githubRepo.trim() || createIntegrationMutation.isPending}
                          className="w-full py-1.5 bg-[#5BB98C]/10 border border-[#5BB98C]/20 text-[#5BB98C] font-semibold rounded-lg text-[10px] transition-colors hover:bg-[#5BB98C] hover:text-[#111315]"
                        >
                          Configure GitHub Sync
                        </button>
                      </div>

                      {/* Slack config card */}
                      <div className="p-4 border border-white/[0.04] bg-[#1D2024] rounded-2xl space-y-3">
                        <h4 className="text-xs font-bold text-white">💬 Slack Alert Webhook</h4>
                        <input
                          type="text"
                          placeholder="Slack Incoming Webhook URL"
                          value={slackWebhook}
                          onChange={(e) => setSlackWebhook(e.target.value)}
                          className="w-full px-3 py-1.5 border border-white/5 bg-[#171A1D] rounded-lg text-[10px] text-white outline-none focus:border-[#5BB98C]"
                        />
                        <button
                          onClick={() => createIntegrationMutation.mutate({ provider: 'Slack', config: { webhook_url: slackWebhook } })}
                          disabled={!slackWebhook.trim() || createIntegrationMutation.isPending}
                          className="w-full py-1.5 bg-[#5BB98C]/10 border border-[#5BB98C]/20 text-[#5BB98C] font-semibold rounded-lg text-[10px] transition-colors hover:bg-[#5BB98C] hover:text-[#111315]"
                        >
                          Configure Slack Sync
                        </button>
                      </div>

                      {/* Discord config card */}
                      <div className="p-4 border border-white/[0.04] bg-[#1D2024] rounded-2xl space-y-3">
                        <h4 className="text-xs font-bold text-white">👾 Discord Alert Webhook</h4>
                        <input
                          type="text"
                          placeholder="Discord Webhook URL"
                          value={discordWebhook}
                          onChange={(e) => setDiscordWebhook(e.target.value)}
                          className="w-full px-3 py-1.5 border border-white/5 bg-[#171A1D] rounded-lg text-[10px] text-white outline-none focus:border-[#5BB98C]"
                        />
                        <button
                          onClick={() => createIntegrationMutation.mutate({ provider: 'Discord', config: { webhook_url: discordWebhook } })}
                          disabled={!discordWebhook.trim() || createIntegrationMutation.isPending}
                          className="w-full py-1.5 bg-[#5BB98C]/10 border border-[#5BB98C]/20 text-[#5BB98C] font-semibold rounded-lg text-[10px] transition-colors hover:bg-[#5BB98C] hover:text-[#111315]"
                        >
                          Configure Discord Sync
                        </button>
                      </div>

                      {/* Google Calendar config card */}
                      <div className="p-4 border border-white/[0.04] bg-[#1D2024] rounded-2xl space-y-3">
                        <h4 className="text-xs font-bold text-white">📅 Google Calendar Sync</h4>
                        <input
                          type="text"
                          placeholder="Primary Calendar ID"
                          value={gcalId}
                          onChange={(e) => setGcalId(e.target.value)}
                          className="w-full px-3 py-1.5 border border-white/5 bg-[#171A1D] rounded-lg text-[10px] text-white outline-none focus:border-[#5BB98C]"
                        />
                        <button
                          onClick={() => createIntegrationMutation.mutate({ provider: 'Google Calendar', config: { calendar_id: gcalId } })}
                          disabled={!gcalId.trim() || createIntegrationMutation.isPending}
                          className="w-full py-1.5 bg-[#5BB98C]/10 border border-[#5BB98C]/20 text-[#5BB98C] font-semibold rounded-lg text-[10px] transition-colors hover:bg-[#5BB98C] hover:text-[#111315]"
                        >
                          Configure Calendar Sync
                        </button>
                      </div>

                      {/* Custom Webhook config card */}
                      <div className="p-4 border border-white/[0.04] bg-[#1D2024] rounded-2xl space-y-3 sm:col-span-2">
                        <h4 className="text-xs font-bold text-white">🔗 Custom Webhook Endpoint</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Webhook friendly name"
                            value={webhookName}
                            onChange={(e) => setWebhookName(e.target.value)}
                            className="w-full px-3 py-1.5 border border-white/5 bg-[#171A1D] rounded-lg text-[10px] text-white outline-none focus:border-[#5BB98C]"
                          />
                          <input
                            type="text"
                            placeholder="Target URL endpoint"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            className="w-full px-3 py-1.5 border border-white/5 bg-[#171A1D] rounded-lg text-[10px] text-white outline-none focus:border-[#5BB98C]"
                          />
                        </div>
                        <button
                          onClick={() => createIntegrationMutation.mutate({ provider: 'Webhook', config: { name: webhookName, target_url: webhookUrl } })}
                          disabled={!webhookUrl.trim() || createIntegrationMutation.isPending}
                          className="w-full py-1.5 bg-[#5BB98C]/10 border border-[#5BB98C]/20 text-[#5BB98C] font-semibold rounded-lg text-[10px] transition-colors hover:bg-[#5BB98C] hover:text-[#111315]"
                        >
                          Register Webhook Endpoint
                        </button>
                      </div>
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
