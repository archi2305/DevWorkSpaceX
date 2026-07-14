import { api } from './api'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export const notificationService = {
  /**
   * Get user notifications
   */
  async getNotifications(params?: { is_read?: boolean; type_filter?: string }): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/notifications', { params })
    return response.data
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await api.post<Notification>(`/notifications/${notificationId}/read`)
    return response.data
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/notifications/read-all')
    return response.data
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/notifications/unread-count')
    return response.data
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`)
  }
}
