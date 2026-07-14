'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService, Notification } from '@/services/notification'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Loader,
  UserPlus,
  MessageSquare,
  Play,
  FolderKanban,
  AtSign,
  X
} from 'lucide-react'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const queryClient = useQueryClient()
  const containerRef = useRef<HTMLDivElement>(null)

  // Query notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
    refetchInterval: 30000 // Poll every 30 seconds for WebSocket fallback
  })

  // Query unread count
  const { data: unreadCount = { count: 0 } } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000
  })

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    }
  })

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    }
  })

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    }
  })

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  const handleMarkAsRead = (notificationId: string) => {
    markReadMutation.mutate(notificationId)
  }

  const handleMarkAllAsRead = () => {
    markAllReadMutation.mutate()
  }

  const handleDelete = (notificationId: string) => {
    deleteMutation.mutate(notificationId)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Task Assigned':
        return <UserPlus className="h-4 w-4 text-blue-400" />
      case 'Comment Added':
        return <MessageSquare className="h-4 w-4 text-purple-400" />
      case 'Sprint Started':
        return <Play className="h-4 w-4 text-green-400" />
      case 'Project Updated':
        return <FolderKanban className="h-4 w-4 text-yellow-400" />
      case 'Mention':
        return <AtSign className="h-4 w-4 text-pink-400" />
      default:
        return <Bell className="h-4 w-4 text-gray-400" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'Task Assigned':
        return 'bg-blue-500/10 border-blue-500/20'
      case 'Comment Added':
        return 'bg-purple-500/10 border-purple-500/20'
      case 'Sprint Started':
        return 'bg-green-500/10 border-green-500/20'
      case 'Project Updated':
        return 'bg-yellow-500/10 border-yellow-500/20'
      case 'Mention':
        return 'bg-pink-500/10 border-pink-500/20'
      default:
        return 'bg-gray-500/10 border-gray-500/20'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Notification Panel */}
      <div
        ref={containerRef}
        className="relative w-full max-w-md h-full bg-[#171A1D] border-l border-white/[0.1] shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-5 w-5 text-[#5BB98C]" />
              {unreadCount.count > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#EB5757] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount.count > 9 ? '9+' : unreadCount.count}
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold text-white">Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount.count > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-[#7E848C] hover:text-white transition-colors disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/5 text-[#7E848C] hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-6 w-6 text-[#5BB98C] animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-[#7E848C] mb-4" />
              <p className="text-sm text-[#7E848C]">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-white/[0.02] transition-colors ${
                    !notification.is_read ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)} mt-0.5`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{notification.title}</p>
                          <p className="text-xs text-[#A7ADB5] mt-1 line-clamp-2">{notification.message}</p>
                        </div>
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markReadMutation.isPending}
                            className="p-1 rounded hover:bg-white/5 text-[#5BB98C] hover:text-white transition-colors disabled:opacity-50"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-[#7E848C]">{formatTime(notification.created_at)}</span>
                        <button
                          onClick={() => handleDelete(notification.id)}
                          disabled={deleteMutation.isPending}
                          className="text-[10px] text-[#7E848C] hover:text-[#EB5757] transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] bg-[#111315]">
          <div className="flex items-center justify-between text-[10px] text-[#7E848C]">
            <span>Real-time notifications via WebSocket</span>
            <span>{notifications.length} total</span>
          </div>
        </div>
      </div>
    </div>
  )
}
