'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commentService, CommentResponse } from '@/services/comment'
import { useAuth } from '@/hooks/useAuth'
import { useCollaboration } from '@/hooks/use-collaboration'
import {
  MessageSquare,
  Send,
  CornerDownRight,
  Edit2,
  Trash2,
  Smile,
  X,
  Check,
  Loader
} from 'lucide-react'

interface CommentsListProps {
  taskId?: string
  projectId?: string
}

export function CommentsList({ taskId, projectId }: CommentsListProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { sendCommentAdded, typingStates, sendTyping } = useCollaboration(projectId, taskId)
  
  // Inputs states
  const [newComment, setNewComment] = useState('')
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  
  // Edit states
  const [activeEditId, setActiveEditId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  // Query Comments
  const { data: comments = [], isLoading } = useQuery<CommentResponse[]>({
    queryKey: taskId ? ['task-comments', taskId] : ['project-discussions', projectId],
    queryFn: () => {
      if (taskId) return commentService.getTaskComments(taskId)
      if (projectId) return commentService.getProjectDiscussions(projectId)
      return Promise.resolve([])
    },
    enabled: !!taskId || !!projectId
  })

  // Mutations
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => {
      if (taskId) return commentService.addTaskComment(taskId, content)
      if (projectId) return commentService.addProjectDiscussion(projectId, content)
      return Promise.reject()
    },
    onSuccess: () => {
      setNewComment('')
      sendCommentAdded(taskId || projectId || '')
      queryClient.invalidateQueries({
        queryKey: taskId ? ['task-comments', taskId] : ['project-discussions', projectId]
      })
    }
  })

  const addReplyMutation = useMutation({
    mutationFn: (data: { commentId: string; content: string }) =>
      commentService.replyToComment(data.commentId, data.content),
    onSuccess: () => {
      setReplyContent('')
      setActiveReplyId(null)
      sendCommentAdded(taskId || projectId || '')
      queryClient.invalidateQueries({
        queryKey: taskId ? ['task-comments', taskId] : ['project-discussions', projectId]
      })
    }
  })

  const editCommentMutation = useMutation({
    mutationFn: (data: { id: string; content: string }) =>
      commentService.editComment(data.id, data.content),
    onSuccess: () => {
      setActiveEditId(null)
      queryClient.invalidateQueries({
        queryKey: taskId ? ['task-comments', taskId] : ['project-discussions', projectId]
      })
    }
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (id: string) => commentService.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: taskId ? ['task-comments', taskId] : ['project-discussions', projectId]
      })
    }
  })

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    addCommentMutation.mutate(newComment)
  }

  const handlePostReply = (commentId: string) => {
    if (!replyContent.trim()) return
    addReplyMutation.mutate({ commentId, content: replyContent })
  }

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) return
    editCommentMutation.mutate({ id: commentId, content: editContent })
  }

  // Format Mentions and basic Markdown
  const formatCommentText = (text: string) => {
    // 1. Mentions (@username) regex highlight
    const mentionRegex = /(@[a-zA-Z0-9_]+)/g
    const parts = text.split(mentionRegex)
    
    return parts.map((part, index) => {
      if (part.match(mentionRegex)) {
        return (
          <span key={index} className="px-1.5 py-0.5 rounded bg-[#5BB98C]/15 border border-[#5BB98C]/20 text-[#5BB98C] font-semibold text-[10px] inline-block mx-0.5">
            {part}
          </span>
        )
      }
      return part
    })
  }

  // Emoji insertions
  const insertEmoji = (emoji: string, type: 'new' | 'reply' | 'edit') => {
    if (type === 'new') setNewComment(prev => prev + emoji)
    if (type === 'reply') setReplyContent(prev => prev + emoji)
    if (type === 'edit') setEditContent(prev => prev + emoji)
  }

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-white/[0.06] pb-2">
        <MessageSquare className="h-4 w-4 text-[#5BB98C]" />
        <span>{taskId ? 'Task Comments' : 'Project Discussions'} ({comments.length})</span>
      </div>

      {/* Loading indicator */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader className="h-4 w-4 text-[#5BB98C] animate-spin" />
        </div>
      ) : (
        /* Comment feeds list */
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-2 border-b border-white/[0.04] pb-3 text-left">
              
              {/* Header: Author + Edit actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#5BB98C]/15 text-[#5BB98C] border border-[#5BB98C]/20 flex items-center justify-center text-[10px] font-bold">
                    {comment.user.full_name[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-white">{comment.user.full_name}</span>
                    <span className="text-[8px] text-[#7E848C] ml-2 font-medium">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Author actions */}
                {user?.id === comment.user_id && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setActiveEditId(comment.id)
                        setEditContent(comment.content)
                      }}
                      className="p-1 rounded hover:bg-white/5 text-[#7E848C] hover:text-white transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      className="p-1 rounded hover:bg-white/5 text-[#7E848C] hover:text-[#EB5757] transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Comment Content Body */}
              {activeEditId === comment.id ? (
                <div className="space-y-2 pt-1">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] rounded-lg text-xs text-white outline-none focus:border-[#5BB98C]"
                  />
                  <div className="flex items-center justify-between">
                    {/* Emojis selector */}
                    <div className="flex gap-1">
                      {['👍', '🔥', '🚀', '👀'].map(e => (
                        <button key={e} type="button" onClick={() => insertEmoji(e, 'edit')} className="text-xs hover:scale-115 transition-transform">{e}</button>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setActiveEditId(null)}
                        className="p-1 rounded bg-white/5 text-[#A7ADB5] hover:text-white cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleSaveEdit(comment.id)}
                        className="p-1 rounded bg-[#5BB98C]/20 border border-[#5BB98C]/30 text-[#5BB98C] cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-[#F5F5F5] leading-relaxed whitespace-pre-line pl-8">
                  {formatCommentText(comment.content)}
                </p>
              )}

              {/* Replies Thread list */}
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex gap-2 pl-8 items-start pt-1.5 text-left">
                  <CornerDownRight className="h-4.5 w-4.5 text-[#7E848C] flex-shrink-0" />
                  <div className="flex-1 p-2 rounded-xl bg-[#1D2024]/50 border border-white/[0.04]">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-white">{reply.user.full_name}</span>
                      <span className="text-[7px] text-[#7E848C]">
                        {new Date(reply.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#A7ADB5] mt-1 whitespace-pre-line">
                      {formatCommentText(reply.content)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Nested Reply Form trigger */}
              <div className="pl-8 pt-1 text-left">
                {activeReplyId === comment.id ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full px-3 py-1.5 border border-white/[0.06] bg-[#1D2024] rounded-lg text-[10px] text-white outline-none focus:border-[#5BB98C]"
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        {['👍', '🔥', '🚀', '👀'].map(e => (
                          <button key={e} type="button" onClick={() => insertEmoji(e, 'reply')} className="text-xs hover:scale-115 transition-transform">{e}</button>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setActiveReplyId(null)}
                          className="text-[9px] font-semibold text-[#7E848C] hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handlePostReply(comment.id)}
                          className="text-[9px] font-semibold text-[#5BB98C] hover:underline cursor-pointer"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setActiveReplyId(comment.id)
                      setReplyContent('')
                    }}
                    className="text-[9px] text-[#7E848C] hover:text-white hover:underline cursor-pointer"
                  >
                    Reply to thread
                  </button>
                )}
              </div>

            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-xs text-[#7E848C] italic text-center py-6">No comments recorded yet. Start the discussion!</p>
          )}
        </div>
      )}

      {/* Typing indicator indicator */}
      {typingStates[taskId || projectId || ''] && (
        <div className="text-left px-1.5 py-0.5">
          <p className="text-[9px] text-[#5BB98C] italic animate-pulse">
            {typingStates[taskId || projectId || '']} is typing...
          </p>
        </div>
      )}

      {/* Main Comment Input Form */}
      <form onSubmit={handlePostComment} className="pt-1 flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => {
            setNewComment(e.target.value)
            sendTyping(taskId || projectId || '', e.target.value.length > 0)
          }}
          placeholder="Add comment, use @name to mention..."
          className="flex-1 px-3 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || addCommentMutation.isPending}
          className="p-2 rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  )
}
