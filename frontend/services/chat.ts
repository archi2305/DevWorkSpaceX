import { api } from './api'
import { UserResponse } from './auth'

export interface ChatChannelResponse {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface ChatChannelCreate {
  name: string
  description?: string
}

export interface ChannelMessageResponse {
  id: string
  channel_id: string
  user_id: string
  content: string
  created_at: string
  user: UserResponse
}

export const chatService = {
  async getChannels(): Promise<ChatChannelResponse[]> {
    const response = await api.get<ChatChannelResponse[]>('/chat/channels')
    return response.data
  },

  async createChannel(data: ChatChannelCreate): Promise<ChatChannelResponse> {
    const response = await api.post<ChatChannelResponse>('/chat/channels', data)
    return response.data
  },

  async getChannelMessages(channelId: string, limit = 50): Promise<ChannelMessageResponse[]> {
    const response = await api.get<ChannelMessageResponse[]>(`/chat/channels/${channelId}/messages`, {
      params: { limit }
    })
    return response.data
  }
}
