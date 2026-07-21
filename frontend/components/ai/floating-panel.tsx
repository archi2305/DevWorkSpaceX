'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Send,
  X,
  Loader,
  MessageSquare,
  Bot,
  HelpCircle,
  AlertTriangle,
  Play,
  ClipboardList,
  History,
  Trash2,
  Plus
} from 'lucide-react'
import { aiService, AIMessage, AIConversation, AIGeneratedTask } from '@/services/ai'
import { taskService } from '@/services/task'
import { useQueryClient } from '@tanstack/react-query'

export function FloatingAIPanel() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  
  // Chat thread states
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [activeConvoId, setActiveConvoId] = useState<string | undefined>(undefined)
  const [messages, setMessages] = useState<AIMessage[]>([])
  
  // Inputs & loaders
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [showThreadHistory, setShowThreadHistory] = useState(false)
  
  // AI Task generation preview list
  const [generatedTasks, setGeneratedTasks] = useState<AIGeneratedTask[]>([])
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Prompt library templates
  const [promptTemplates, setPromptTemplates] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      loadConversations()
      loadTemplates()
    }
  }, [isOpen])

  useEffect(() => {
    if (activeConvoId) {
      loadMessages(activeConvoId)
    } else {
      setMessages([])
    }
  }, [activeConvoId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading, generatedTasks])

  // Click outside to close drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // Only close if clicking outside panel and not on the toggle button
        const fab = document.getElementById('ai-floating-fab')
        if (fab && fab.contains(event.target as Node)) return
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const loadConversations = async () => {
    try {
      const list = await aiService.getConversations()
      setConversations(list)
    } catch (err) {
      console.error('Failed to load chat history threads', err)
    }
  }

  const loadTemplates = async () => {
    try {
      const list = await aiService.getSavedPrompts()
      setPromptTemplates(list)
    } catch (err) {
      console.error('Failed to load prompt templates library', err)
    }
  }

  const handleSaveTemplate = async () => {
    if (!prompt.trim()) return
    const title = prompt.slice(0, 22) + '...'
    try {
      await aiService.savePrompt(title, prompt)
      loadTemplates()
    } catch (err) {
      console.error('Failed to save prompt to library', err)
    }
  }

  const loadMessages = async (id: string) => {
    setLoading(true)
    try {
      const history = await aiService.getMessages(id)
      setMessages(history)
    } catch (err) {
      console.error('Failed to fetch conversation history', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewConversation = () => {
    setActiveConvoId(undefined)
    setMessages([])
    setGeneratedTasks([])
    setShowThreadHistory(false)
  }

  const handleSendPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!prompt.trim() || loading) return

    const userMsgText = prompt
    setPrompt('')

    // Append optimistic user message
    const tempUserMsg: AIMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: userMsgText,
      created_at: new Date().toISOString()
    }
    setMessages((prev) => [...prev, tempUserMsg])
    setLoading(true)

    try {
      const res = await aiService.chat(userMsgText, activeConvoId)
      
      if (!activeConvoId && res.conversation_id) {
        setActiveConvoId(res.conversation_id)
        loadConversations()
      }

      const aiMsg: AIMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        content: res.reply,
        created_at: new Date().toISOString()
      }
      setMessages((prev) => [...prev, aiMsg])

      if ((res as any).tasks && (res as any).tasks.length > 0) {
        setGeneratedTasks((res as any).tasks)
      }
    } catch (err) {
      console.error('Failed to process AI response', err)
      const errorMsg: AIMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        content: 'Apologies, I ran into an error processing your request. Please try again.',
        created_at: new Date().toISOString()
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmTask = async (taskItem: AIGeneratedTask, index: number) => {
    try {
      await taskService.createTask({
        title: taskItem.title,
        description: taskItem.description,
        priority: taskItem.priority || 'medium',
        status: 'todo'
      })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] })

      setGeneratedTasks((prev) => prev.filter((_, idx) => idx !== index))
    } catch (err) {
      console.error('Failed to create task from AI recommendation', err)
    }
  }

  return (
    <>
      {/* Floating Trigger Button (FAB) */}
      <motion.button
        id="ai-floating-fab"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl hover:shadow-primary/30 transition-all cursor-pointer border border-primary/20"
        title="Toggle AI Architect Copilot"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </motion.button>

      {/* Slide-in Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 w-[420px] max-w-[calc(100vw-3rem)] h-[620px] max-h-[calc(100vh-8rem)] rounded-3xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl z-50 flex flex-col overflow-hidden text-left"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-white/[0.01] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">AI Architect Copilot</h3>
                  <p className="text-[9px] text-muted-foreground">DevWorkspace Assistant</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowThreadHistory(!showThreadHistory)}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Thread History"
                >
                  <History className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNewConversation}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="New Thread"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Conversation Threads Drawer Overlay */}
            {showThreadHistory && (
              <div className="p-3 border-b border-border bg-background/50 space-y-2 max-h-40 overflow-y-auto">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Past Conversations</span>
                {conversations.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground">No saved threads yet.</p>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveConvoId(c.id)
                          setShowThreadHistory(false)
                        }}
                        className={`w-full p-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          activeConvoId === c.id ? 'bg-primary/10 text-primary' : 'hover:bg-white/5 text-foreground'
                        }`}
                      >
                        <span className="truncate">{c.title || 'Untitled Session'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Scrollable Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {messages.length === 0 && (
                <div className="text-center py-10 space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">How can I assist your project?</h4>
                  <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                    Ask questions about database schemas, API specs, deployment configs, or project milestones.
                  </p>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl space-y-1 ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground font-medium rounded-br-none'
                        : 'bg-white/[0.03] border border-border text-foreground rounded-bl-none'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
                  <Loader className="h-4 w-4 animate-spin text-primary" /> AI thinking...
                </div>
              )}

              {/* Generated tasks action widgets */}
              {generatedTasks.length > 0 && (
                <div className="p-3.5 rounded-2xl border border-primary/20 bg-primary/5 space-y-2.5">
                  <span className="text-[9px] font-bold text-primary uppercase tracking-wider block">Recommended Tasks</span>
                  <div className="space-y-2">
                    {generatedTasks.map((t, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl border border-border bg-card flex items-center justify-between gap-2">
                        <div className="min-w-0 text-left space-y-0.5">
                          <span className="text-xs font-bold text-foreground block truncate">{t.title}</span>
                          <span className="text-[9px] text-muted-foreground block truncate">{t.description}</span>
                        </div>
                        <button
                          onClick={() => handleConfirmTask(t, idx)}
                          className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-[9px] shrink-0 cursor-pointer"
                        >
                          Add Task
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Template Library selectors */}
            {promptTemplates.length > 0 && (
              <div className="px-4 py-2 border-t border-border bg-card flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-thin">
                {promptTemplates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setPrompt(tmpl.content)}
                    className="text-[9px] bg-background hover:bg-white/5 border border-border text-muted-foreground hover:text-primary px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex-shrink-0"
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            )}

            {/* Prompt Input Form */}
            <form onSubmit={handleSendPrompt} className="p-4 border-t border-border bg-card flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask workspace copilot..."
                disabled={loading}
                className="flex-1 px-3 py-2 border border-border bg-background text-xs text-foreground placeholder-muted-foreground rounded-xl outline-none focus:border-primary transition-colors disabled:opacity-50 font-medium"
              />
              {prompt.trim() && (
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  title="Save prompt as template"
                  className="p-2 rounded-xl bg-background border border-border hover:bg-white/5 text-primary flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="p-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
