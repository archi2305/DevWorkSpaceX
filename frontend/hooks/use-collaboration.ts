'use client'

import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export interface OnlineUser {
  id: string
  full_name: string
  email: string
}

export interface TypingState {
  user_name: string
  task_id: string
}

export function useCollaboration(projectId?: string, taskId?: string) {
  const queryClient = useQueryClient()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [typingStates, setTypingStates] = useState<Record<string, string>>({}) // task_id -> user_name
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectDelayRef = useRef(1000)

  const connect = () => {
    if (typeof window === 'undefined') return

    // Clean up existing
    if (socketRef.current) {
      socketRef.current.close()
    }

    const token = localStorage.getItem('access_token') || ''
    if (!token) return

    const wsUrl = `ws://127.0.0.1:8001/collaboration/ws?token=${token}`
    const ws = new WebSocket(wsUrl)
    socketRef.current = ws

    ws.onopen = () => {
      reconnectDelayRef.current = 1000 // Reset backoff delay
    }

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        const eventType = payload.type

        if (eventType === 'presence') {
          setOnlineUsers(payload.users || [])
        } else if (eventType === 'typing') {
          const { task_id, is_typing, sender } = payload
          setTypingStates((prev) => {
            const next = { ...prev }
            if (is_typing) {
              next[task_id] = sender.full_name
            } else {
              delete next[task_id]
            }
            return next
          })
        } else if (eventType === 'kanban_update') {
          // Auto refresh task queries
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
          queryClient.invalidateQueries({ queryKey: ['projects'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard-unified'] })
          queryClient.invalidateQueries({ queryKey: ['analytics'] })
        } else if (eventType === 'comment_added') {
          // Auto refresh task comments
          queryClient.invalidateQueries({ queryKey: ['task-comments'] })
          queryClient.invalidateQueries({ queryKey: ['project-discussions'] })
        } else if (eventType === 'dashboard_refresh') {
          // Refresh entire workspace/dashboard counts
          queryClient.invalidateQueries({ queryKey: ['dashboard-unified'] })
          queryClient.invalidateQueries({ queryKey: ['workspace-settings'] })
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }

    ws.onclose = () => {
      // Exponential backoff reconnect
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, 30000)
        connect()
      }, reconnectDelayRef.current)
    }

    ws.onerror = (err) => {
      console.error('WebSocket connection error:', err)
      ws.close()
    }
  }

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (socketRef.current) {
        // Remove close handler to avoid reconnect during unmount
        socketRef.current.onclose = null
        socketRef.current.close()
      }
    }
  }, [projectId, taskId])

  // Outgoing messages
  const sendTyping = (targetTaskId: string, isTyping: boolean) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'typing',
          task_id: targetTaskId,
          is_typing: isTyping
        })
      )
    }
  }

  const sendKanbanUpdate = (targetTaskId: string, status: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'kanban_update',
          task_id: targetTaskId,
          status: status
        })
      )
    }
  }

  const sendCommentAdded = (targetTaskId: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'comment_added',
          task_id: targetTaskId
        })
      )
    }
  }

  const sendDashboardRefresh = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'dashboard_refresh'
        })
      )
    }
  }

  return {
    onlineUsers,
    typingStates,
    sendTyping,
    sendKanbanUpdate,
    sendCommentAdded,
    sendDashboardRefresh
  }
}
