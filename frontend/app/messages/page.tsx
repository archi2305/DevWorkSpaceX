'use client'

import React, { useEffect, useState, useRef } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { chatService, ChatChannelResponse, ChannelMessageResponse } from '@/services/chat'
import { useAuth } from '@/hooks/useAuth'
import { MessageSquare, Send, Plus, Hash, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MessagesPage() {
  const { user } = useAuth()
  const [channels, setChannels] = useState<ChatChannelResponse[]>([])
  const [selectedChannel, setSelectedChannel] = useState<ChatChannelResponse | null>(null)
  const [messages, setMessages] = useState<ChannelMessageResponse[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDesc, setNewChannelDesc] = useState('')
  const [error, setError] = useState('')
  
  const socketRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // 1. Fetch channels list
  const fetchChannels = async () => {
    try {
      const data = await chatService.getChannels()
      setChannels(data)
      if (data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0])
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err)
    }
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  // 2. Fetch messages when channel changes
  useEffect(() => {
    if (!selectedChannel) return

    const fetchMessages = async () => {
      try {
        const data = await chatService.getChannelMessages(selectedChannel.id)
        setMessages(data)
      } catch (err) {
        console.error('Failed to fetch messages:', err)
      }
    }

    fetchMessages()

    // 3. Configure WebSocket connection for live messages
    const token = localStorage.getItem('token') || ''
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const wsBase = apiBase.replace('http://', 'ws://').replace('https://', 'wss://')
    const wsUrl = `${wsBase}/collaboration/ws?token=${token}`

    const ws = new WebSocket(wsUrl)
    socketRef.current = ws

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'chat_message' && payload.channel_id === selectedChannel.id) {
          setMessages((prev) => [...prev, payload])
        }
      } catch (err) {
        console.error('WS message parse error:', err)
      }
    }

    return () => {
      ws.close()
    }
  }, [selectedChannel])

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 4. Send Message handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChannel || !socketRef.current) return

    if (socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'chat_message',
          channel_id: selectedChannel.id,
          content: newMessage
        })
      )
      setNewMessage('')
    } else {
      console.error('WebSocket is not open')
    }
  }

  // 5. Create Channel handler
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim()) return

    try {
      setError('')
      const created = await chatService.createChannel({
        name: newChannelName,
        description: newChannelDesc
      })
      setNewChannelName('')
      setNewChannelDesc('')
      setShowCreateDialog(false)
      await fetchChannels()
      setSelectedChannel(created)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create channel')
    }
  }

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-8rem)] rounded-2xl border border-white/5 bg-[#171a1d]/60 overflow-hidden backdrop-blur-xl">
        {/* Channels Sidebar */}
        <div className="w-64 border-r border-white/5 bg-[#09090b]/40 flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Channels
            </h2>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="p-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {channels.map((chan) => (
              <button
                key={chan.id}
                onClick={() => setSelectedChannel(chan)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                  selectedChannel?.id === chan.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`}
              >
                <Hash className="h-4 w-4 shrink-0" />
                <span className="truncate">{chan.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 flex flex-col bg-transparent">
          {selectedChannel ? (
            <>
              {/* Feed Header */}
              <div className="p-4 border-b border-white/5 bg-[#09090b]/20 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-1.5">
                    <Hash className="h-4 w-4 text-primary" /> {selectedChannel.name}
                  </h3>
                  {selectedChannel.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedChannel.description}</p>
                  )}
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">This is the start of the #{selectedChannel.name} channel.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="flex gap-3 items-start">
                      <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                        {msg.user?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{msg.user?.full_name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-white/90 bg-white/[0.02] border border-white/5 rounded-2xl rounded-tl-none px-4 py-2 max-w-lg">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-[#09090b]/20 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message #${selectedChannel.name}`}
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3 animate-pulse" />
              <p className="text-sm text-muted-foreground">Create a channel to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Channel Dialog */}
      <AnimatePresence>
        {showCreateDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#171a1d] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white">Create Channel</h3>
              
              <form onSubmit={handleCreateChannel} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Channel Name</label>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. backend-devs"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Description (Optional)</label>
                  <input
                    type="text"
                    value={newChannelDesc}
                    onChange={(e) => setNewChannelDesc(e.target.value)}
                    placeholder="Brief details about the channel"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                  />
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateDialog(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-sm font-semibold text-white hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  )
}
