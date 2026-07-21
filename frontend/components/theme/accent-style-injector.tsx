'use client'

import React, { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { api } from '@/services/api'

interface WorkspaceSettings {
  theme: string
  accent_color: string
}

export function AccentStyleInjector() {
  const { theme, setTheme } = useTheme()

  // Load Workspace Settings (including theme & accent_color)
  const { data: settings } = useQuery<WorkspaceSettings>({
    queryKey: ['workspace-settings'],
    queryFn: async () => {
      const resp = await api.get('/workspace/settings')
      return resp.data
    }
  })

  const hasSetInitialTheme = React.useRef(false)

  useEffect(() => {
    if (settings?.theme && !hasSetInitialTheme.current) {
      const localPref = localStorage.getItem('theme')
      if (!localPref) {
        setTheme(settings.theme || 'dark')
      }
      hasSetInitialTheme.current = true
    }
  }, [settings?.theme, setTheme])

  if (!settings) return null

  const accent = settings.accent_color || '#5BB98C'

  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        :root, .dark, .linear, .green {
          --primary: ${accent} !important;
          --accent: ${accent} !important;
          --sidebar-primary: ${accent} !important;
          --sidebar-accent: ${accent}18 !important; /* 10% opacity */
          --sidebar-ring: ${accent} !important;
          --ring: ${accent} !important;
        }
      `
    }} />
  )
}
