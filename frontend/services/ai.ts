import { api } from './api'

export interface AIChatResponse {
  conversation_id: string
  title: string
  reply: string
}

export interface AIConversation {
  id: string
  title: string
  created_at: string
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface AIGeneratedTask {
  title: string
  description: string
  priority: string
  status: string
}

export const aiService = {
  /**
   * Post prompt message to AI thread.
   */
  async chat(prompt: string, conversationId?: string): Promise<AIChatResponse> {
    const response = await api.post<AIChatResponse>('/ai/chat', {
      prompt,
      conversation_id: conversationId
    })
    return response.data
  },

  /**
   * Load active chat threads.
   */
  async getConversations(): Promise<AIConversation[]> {
    const response = await api.get<AIConversation[]>('/ai/conversations')
    return response.data
  },

  /**
   * Load chat history log messages.
   */
  async getMessages(conversationId: string): Promise<AIMessage[]> {
    const response = await api.get<AIMessage[]>(`/ai/conversations/${conversationId}/messages`)
    return response.data
  },

  /**
   * Delete thread.
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await api.delete(`/ai/conversations/${conversationId}`)
  },

  /**
   * Get dynamic sprint suggestion report.
   */
  async getSprintPlan(): Promise<{ reply: string }> {
    const response = await api.get<{ reply: string }>('/ai/sprint-plan')
    return response.data
  },

  /**
   * Get workspace blockers diagnostic report.
   */
  async getBlockers(): Promise<{ reply: string }> {
    const response = await api.get<{ reply: string }>('/ai/blockers')
    return response.data
  },

  /**
   * Get status summary for specific project.
   */
  async getProjectSummary(projectId: string): Promise<{ reply: string }> {
    const response = await api.get<{ reply: string }>(`/ai/project-summary/${projectId}`)
    return response.data
  },

  /**
   * Generate proposed tasks based on workspace constraints.
   */
  async generateTasks(): Promise<AIGeneratedTask[]> {
    const response = await api.post<AIGeneratedTask[]>('/ai/generate-tasks')
    return response.data
  },

  /**
   * Fetch custom prompt library templates.
   */
  async getSavedPrompts(): Promise<any[]> {
    const response = await api.get('/ai/prompts')
    return response.data
  },

  /**
   * Save a prompt template to PostgreSQL.
   */
  async savePrompt(title: string, content: string): Promise<any> {
    const response = await api.post('/ai/prompts', { title, content })
    return response.data
  },

  /**
   * Delete prompt template from user library.
   */
  async deletePrompt(id: string): Promise<void> {
    await api.delete(`/ai/prompts/${id}`)
  }
}
