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
  created_at: string
  user: UserMini
}

export interface CommentResponse {
  id: string
  content: string
  task_id: string | null
  project_id: string | null
  user_id: string
  created_at: string
  user: UserMini
  replies: CommentReply[]
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
  async addTaskComment(taskId: string, content: string): Promise<CommentResponse> {
    const response = await api.post<CommentResponse>(`/tasks/${taskId}/comments`, { content })
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
  async addProjectDiscussion(projectId: string, content: string): Promise<CommentResponse> {
    const response = await api.post<CommentResponse>(`/projects/${projectId}/discussions`, { content })
    return response.data
  },

  /**
   * Modify comment.
   */
  async editComment(commentId: string, content: string): Promise<CommentResponse> {
    const response = await api.patch<CommentResponse>(`/comments/${commentId}`, { content })
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
  async replyToComment(commentId: string, content: string): Promise<CommentReply> {
    const response = await api.post<CommentReply>(`/comments/${commentId}/reply`, { content })
    return response.data
  }
}
