'use client'

import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commentService, CommentResponse, CommentCreate } from '@/services/comment'
import { useAuth } from '@/hooks/useAuth'
import { useCollaboration } from '@/hooks/use-collaboration'
import ReactMarkdown from 'react-markdown'
import {
  MessageSquare,
  Send,
  CornerDownRight,
  Edit2,
  Trash2,
  Smile,
  X,
  Check,
  Loader,
  Paperclip,
  Flame
} from 'lucide-react'

interface CommentsListProps {
  taskId?: string
  projectId?: string
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '🚀', '👀', '😂', '🎉', '💯', '✨', '🤔']

export function CommentsList({ taskId, projectId }: CommentsListProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { sendCommentAdded, typingStates, sendTyping } = useCollaboration(projectId, taskId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Inputs states
  const [newComment, setNewComment] = useState('')
  const [newCommentMarkdown, setNewCommentMarkdown] = useState('')
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; size: number; type: string }>>([])
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyAttachments, setReplyAttachments] = useState<Array<{ name: string; url: string; size: number; type: string }>>([])
  
  // Edit states
  const [activeEditId, setActiveEditId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editAttachments, setEditAttachments] = useState<Array<{ name: string; url: string; size: number; type: string }>>([])

  // Emoji picker states
  const [showEmojiPicker, setShowEmojiPicker] = useState<'new' | 'reply' | 'edit' | null>(null)

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
    mutationFn: (data: CommentCreate) => {
      if (taskId) return commentService.addTaskComment(taskId, data)
      if (projectId) return commentService.addProjectDiscussion(projectId, data)
      return Promise.reject()
    },
    onSuccess: () => {
      setNewComment('')
      setNewCommentMarkdown('')
      setAttachments([])
      sendCommentAdded(taskId || projectId || '')
      queryClient.invalidateQueries({
        queryKey: taskId ? ['task-comments', taskId] : ['project-discussions', projectId]
      })
    }
  })

  const addReplyMutation = useMutation({
    mutationFn: (data: { commentId: string; content: CommentCreate }) =>
      commentService.replyToComment(data.commentId, data.content),
    onSuccess: () => {
      setReplyContent('')
      setReplyAttachments([])
      setActiveReplyId(null)
      sendCommentAdded(taskId || projectId || '')
      queryClient.invalidateQueries({
        queryKey: taskId ? ['task-comments', taskId] : ['project-discussions', projectId]
      })
    }
  })

  const editCommentMutation = useMutation({
    mutationFn: (data: { id: string; content: CommentCreate }) =>
      commentService.editComment(data.id, data.content),
    onSuccess: () => {
      setActiveEditId(null)
      setEditContent('')
      setEditAttachments([])
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

  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => commentService.uploadAttachment(file),
    onSuccess: (data) => {
      const attachment = {
        name: data.filename,
        url: data.url,
        size: data.size,
        type: data.type
      }
      if (showEmojiPicker === 'new') {
        setAttachments([...attachments, attachment])
      } else if (showEmojiPicker === 'reply') {
        setReplyAttachments([...replyAttachments, attachment])
      } else if (showEmojiPicker === 'edit') {
        setEditAttachments([...editAttachments, attachment])
      }
    }
  })

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    addCommentMutation.mutate({
      content: newComment,
      content_markdown: newCommentMarkdown,
      mentions: parseMentions(newComment),
      attachments
    })
  }

  const handlePostReply = (commentId: string) => {
    if (!replyContent.trim()) return
    addReplyMutation.mutate({
      commentId,
      content: {
        content: replyContent,
        content_markdown: parseMarkdown(replyContent),
        mentions: parseMentions(replyContent),
        attachments: replyAttachments
      }
    })
  }

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) return
    editCommentMutation.mutate({
      id: commentId,
      content: {
        content: editContent,
        content_markdown: parseMarkdown(editContent),
        mentions: parseMentions(editContent),
        attachments: editAttachments
      }
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadAttachmentMutation.mutate(file)
    }
  }

  const handleReaction = (commentId: string, emoji: string, isReply = false) => {
    if (isReply) {
      // Handle reply reaction (would need reply ID)
      return
    }
    commentService.addCommentReaction(commentId, emoji).then(() => {
      queryClient.invalidateQueries({
        queryKey: taskId ? ['task-comments', taskId] : ['project-discussions', projectId]
      })
    })
  }

  const parseMentions = (text: string): string[] => {
    const mentions = text.match(/@(\w+)/g) || []
    return mentions.map(m => m.substring(1))
  }

  const parseMarkdown = (text: string): string => {
    // Simple markdown parsing
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  }

  const insertEmoji = (emoji: string) => {
    if (showEmojiPicker === 'new') setNewComment(prev => prev + emoji)
    if (showEmojiPicker === 'reply') setReplyContent(prev => prev + emoji)
    if (showEmojiPicker === 'edit') setEditContent(prev => prev + emoji)
    setShowEmojiPicker(null)
  }

  const removeAttachment = (index: number, type: 'new' | 'reply' | 'edit') => {
    if (type === 'new') setAttachments(attachments.filter((_, i) => i !== index))
    if (type === 'reply') setReplyAttachments(replyAttachments.filter((_, i) => i !== index))
    if (type === 'edit') setEditAttachments(editAttachments.filter((_, i) => i !== index))
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
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
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
                        setEditAttachments(comment.attachments || [])
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
                    rows={3}
                  />
                  
                  {/* Attachments */}
                  {editAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {editAttachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-[10px]">
                          <Paperclip className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{att.name}</span>
                          <button onClick={() => removeAttachment(idx, 'edit')} className="text-[#EB5757]">×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowEmojiPicker('edit')}
                        className="p-1 rounded hover:bg-white/5 text-[#7E848C] hover:text-white cursor-pointer"
                      >
                        <Smile className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1 rounded hover:bg-white/5 text-[#7E848C] hover:text-white cursor-pointer"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                      </button>
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
                <div className="pl-8">
                  <div className="text-[11px] text-[#F5F5F5] leading-relaxed prose prose-invert prose-sm max-w-none">
                    {comment.content_markdown ? (
                      <ReactMarkdown>{comment.content_markdown}</ReactMarkdown>
                    ) : (
                      <ReactMarkdown>{parseMarkdown(comment.content)}</ReactMarkdown>
                    )}
                  </div>
                  
                  {/* Attachments */}
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {comment.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-[10px] text-[#5BB98C] hover:bg-white/10 cursor-pointer"
                        >
                          <Paperclip className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{att.name}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Reactions */}
                  {comment.reactions && Object.keys(comment.reactions).length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {Object.entries(comment.reactions).map(([emoji, userIds]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(comment.id, emoji)}
                          className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                            userIds.includes(user?.id || '')
                              ? 'bg-[#5BB98C]/20 text-[#5BB98C] border border-[#5BB98C]/30'
                              : 'bg-white/5 text-[#A7ADB5] hover:bg-white/10'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="text-[9px]">{userIds.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                    <div className="text-[10px] text-[#A7ADB5] mt-1 prose prose-invert prose-sm max-w-none">
                      {reply.content_markdown ? (
                        <ReactMarkdown>{reply.content_markdown}</ReactMarkdown>
                      ) : (
                        <ReactMarkdown>{parseMarkdown(reply.content)}</ReactMarkdown>
                      )}
                    </div>
                    
                    {/* Reply Reactions */}
                    {reply.reactions && Object.keys(reply.reactions).length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {Object.entries(reply.reactions).map(([emoji, userIds]) => (
                          <button
                            key={emoji}
                            className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 cursor-pointer ${
                              userIds.includes(user?.id || '')
                                ? 'bg-[#5BB98C]/20 text-[#5BB98C]'
                                : 'bg-white/5 text-[#A7ADB5]'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[9px]">{userIds.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Nested Reply Form trigger */}
              <div className="pl-8 pt-1 text-left">
                {activeReplyId === comment.id ? (
                  <div className="space-y-1.5">
                    <textarea
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full px-3 py-1.5 border border-white/[0.06] bg-[#1D2024] rounded-lg text-[10px] text-white outline-none focus:border-[#5BB98C]"
                      rows={2}
                    />
                    
                    {/* Reply Attachments */}
                    {replyAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {replyAttachments.map((att, idx) => (
                          <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-[10px]">
                            <Paperclip className="h-3 w-3" />
                            <span className="truncate max-w-[100px]">{att.name}</span>
                            <button onClick={() => removeAttachment(idx, 'reply')} className="text-[#EB5757]">×</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowEmojiPicker('reply')}
                          className="p-1 rounded hover:bg-white/5 text-[#7E848C] hover:text-white cursor-pointer"
                        >
                          <Smile className="h-3.5 w-3.5" />
                        </button>
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
                      setReplyAttachments([])
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

      {/* Typing indicator */}
      {typingStates[taskId || projectId || ''] && (
        <div className="text-left px-1.5 py-0.5">
          <p className="text-[9px] text-[#5BB98C] italic animate-pulse">
            {typingStates[taskId || projectId || '']} is typing...
          </p>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute z-50 bg-[#1D2024] border border-white/10 rounded-lg p-2 shadow-xl">
          <div className="grid grid-cols-5 gap-1">
            {COMMON_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => insertEmoji(emoji)}
                className="text-lg hover:bg-white/10 rounded p-1 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.zip"
      />

      {/* Main Comment Input Form */}
      <form onSubmit={handlePostComment} className="pt-1 space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => {
            setNewComment(e.target.value)
            setNewCommentMarkdown(parseMarkdown(e.target.value))
            sendTyping(taskId || projectId || '', e.target.value.length > 0)
          }}
          placeholder="Add comment, use @name to mention... (Markdown supported)"
          className="w-full px-3 py-2 border border-white/[0.06] bg-[#1D2024] rounded-xl text-xs text-white placeholder-[#7E848C] focus:border-[#5BB98C] outline-none transition-colors resize-none"
          rows={2}
        />
        
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-[10px]">
                <Paperclip className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{att.name}</span>
                <button onClick={() => removeAttachment(idx, 'new')} className="text-[#EB5757]">×</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker('new')}
              className="p-2 rounded-lg hover:bg-white/5 text-[#7E848C] hover:text-white cursor-pointer"
            >
              <Smile className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-white/5 text-[#7E848C] hover:text-white cursor-pointer"
            >
              <Paperclip className="h-4 w-4" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!newComment.trim() || addCommentMutation.isPending}
            className="px-4 py-2 rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            Post
          </button>
        </div>
      </form>
    </div>
  )
}
