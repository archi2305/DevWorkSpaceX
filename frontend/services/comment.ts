import { api } from './api'

export interface UserMini {
  id: string
  email: string
  full_name: string
  profile_image: string | null
}

export interface CommentReply {
  id: string
  comment_id: string
  user_id: string
  content: string
  content_markdown?: string
  mentions?: string[]
  reactions?: Record<string, string[]>
  attachments?: Array<{ name: string; url: string; size: number; type: string }>
  created_at: string
  updated_at: string
  user: UserMini
}

export interface CommentResponse {
  id: string
  content: string
  content_markdown?: string
  task_id: string | null
  project_id: string | null
  user_id: string
  mentions?: string[]
  reactions?: Record<string, string[]>
  attachments?: Array<{ name: string; url: string; size: number; type: string }>
  created_at: string
  updated_at: string
  user: UserMini
  replies: CommentReply[]
}

export interface CommentCreate {
  content: string
  content_markdown?: string
  mentions?: string[]
  attachments?: Array<{ name: string; url: string; size: number; type: string }>
}

export interface CommentUpdate {
  content: string
  content_markdown?: string
  mentions?: string[]
  attachments?: Array<{ name: string; url: string; size: number; type: string }>
}

export interface ReactionResponse {
  emoji: string
  user_ids: string[]
  count: number
}

export const commentService = {
  /**
   * Load comments list for specific task.
   */
  async getTaskComments(taskId: string): Promise<CommentResponse[]> {
    const response = await api.get<CommentResponse[]>(`/tasks/${taskId}/comments`)
    return response.data
  },

  /**
   * Add a comment to task.
   */
  async addTaskComment(taskId: string, data: CommentCreate): Promise<CommentResponse> {
    const response = await api.post<CommentResponse>(`/tasks/${taskId}/comments`, data)
    return response.data
  },

  /**
   * Load project-level general discussion comments.
   */
  async getProjectDiscussions(projectId: string): Promise<CommentResponse[]> {
    const response = await api.get<CommentResponse[]>(`/projects/${projectId}/discussions`)
    return response.data
  },

  /**
   * Post project general discussion.
   */
  async addProjectDiscussion(projectId: string, data: CommentCreate): Promise<CommentResponse> {
    const response = await api.post<CommentResponse>(`/projects/${projectId}/discussions`, data)
    return response.data
  },

  /**
   * Modify comment.
   */
  async editComment(commentId: string, data: CommentUpdate): Promise<CommentResponse> {
    const response = await api.patch<CommentResponse>(`/comments/${commentId}`, data)
    return response.data
  },

  /**
   * Delete comment.
   */
  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/comments/${commentId}`)
  },

  /**
   * Post a reply to parent comment thread.
   */
  async replyToComment(commentId: string, data: CommentCreate): Promise<CommentReply> {
    const response = await api.post<CommentReply>(`/comments/${commentId}/reply`, data)
    return response.data
  },

  /**
   * Add or remove emoji reaction to comment.
   */
  async addCommentReaction(commentId: string, emoji: string): Promise<ReactionResponse> {
    const response = await api.post<ReactionResponse>(`/comments/${commentId}/reactions`, { emoji })
    return response.data
  },

  /**
   * Add or remove emoji reaction to reply.
   */
  async addReplyReaction(replyId: string, emoji: string): Promise<ReactionResponse> {
    const response = await api.post<ReactionResponse>(`/replies/${replyId}/reactions`, { emoji })
    return response.data
  },

  /**
   * Upload attachment for comments.
   */
  async uploadAttachment(file: File): Promise<{ filename: string; url: string; size: number; type: string }> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post<{ filename: string; url: string; size: number; type: string }>(
      '/upload-attachment',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response.data
  }
}
