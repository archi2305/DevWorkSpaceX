'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export interface Keybindings {
  createTask: string
  createProject: string
  search: string
  close: string
  assignTask: string
}

const DEFAULT_BINDINGS: Keybindings = {
  createTask: 'n',
  createProject: 'p',
  search: '/',
  close: 'Escape',
  assignTask: 'A' // Captures Shift+A
}

interface ShortcutContextType {
  bindings: Keybindings
  updateBinding: (action: keyof Keybindings, newKey: string) => void
  resetBindings: () => void
}

const ShortcutContext = createContext<ShortcutContextType | undefined>(undefined)

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [bindings, setBindings] = useState<Keybindings>(DEFAULT_BINDINGS)

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('user_keyboard_shortcuts')
    if (saved) {
      try {
        setBindings({ ...DEFAULT_BINDINGS, ...JSON.parse(saved) })
      } catch {
        setBindings(DEFAULT_BINDINGS)
      }
    }
  }, [])

  const updateBinding = (action: keyof Keybindings, newKey: string) => {
    setBindings((prev) => {
      const next = { ...prev, [action]: newKey }
      localStorage.setItem('user_keyboard_shortcuts', JSON.stringify(next))
      return next
    })
  }

  const resetBindings = () => {
    setBindings(DEFAULT_BINDINGS)
    localStorage.removeItem('user_keyboard_shortcuts')
  }

  // Bind hotkey event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input element
      const activeEl = document.activeElement
      const isTyping =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')

      if (isTyping && e.key !== 'Escape') return

      // Match trigger conditions
      const keyLower = e.key.toLowerCase()

      // 1. Create Task
      if (keyLower === bindings.createTask.toLowerCase() && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        router.push('/calendar')
      }

      // 2. Create Project
      if (keyLower === bindings.createProject.toLowerCase() && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        router.push('/projects')
      }

      // 3. Search (focus search inputs or toggle palette)
      if (e.key === bindings.search && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        // Dispatch Cmd+K mock to open CommandPalette
        const kEvent = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          bubbles: true
        })
        window.dispatchEvent(kEvent)
      }

      // 4. Assign Task (Shift+A)
      if (e.key === bindings.assignTask && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        router.push('/team')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [bindings, router])

  return (
    <ShortcutContext.Provider value={{ bindings, updateBinding, resetBindings }}>
      {children}
    </ShortcutContext.Provider>
  )
}

export function useShortcuts() {
  const context = useContext(ShortcutContext)
  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutProvider')
  }
  return context
}
