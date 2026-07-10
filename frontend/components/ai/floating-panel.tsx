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

  useEffect(() => {
    if (isOpen) {
      loadConversations()
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
    // Auto-scroll chat box
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading, generatedTasks])

  const loadConversations = async () => {
    try {
      const list = await aiService.getConversations()
      setConversations(list)
    } catch (err) {
      console.error('Failed to load chat history threads', err)
    }
  }

  const loadMessages = async (id: string) => {
    setLoading(true)
    try {
      const history = await aiService.getMessages(id)
      setMessages(history)
      setGeneratedTasks([])
    } catch (err) {
      console.error('Failed to load messages', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendPrompt = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault()
    
    const queryStr = customPrompt || prompt
    if (!queryStr.trim()) return

    // Optimistically update UI thread with user message
    const tempUserMsg: AIMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: queryStr,
      created_at: new Date().toISOString()
    }
    setMessages((prev) => [...prev, tempUserMsg])
    setPrompt('')
    setLoading(true)
    setGeneratedTasks([])

    try {
      const response = await aiService.chat(queryStr, activeConvoId)
      if (!activeConvoId) {
        setActiveConvoId(response.conversation_id)
        loadConversations()
      } else {
        // Append response
        const tempAssistantMsg: AIMessage = {
          id: response.conversation_id + Math.random().toString(),
          role: 'assistant',
          content: response.reply,
          created_at: new Date().toISOString()
        }
        setMessages((prev) => [...prev, tempAssistantMsg])
      }
    } catch (err) {
      console.error('AI chat delivery failed', err)
      const errorMsg: AIMessage = {
        id: 'err',
        role: 'assistant',
        content: '⚠️ Failed to connect to AI Assistant services. Please check your network.',
        created_at: new Date().toISOString()
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  // Predefined Action triggers
  const handleTriggerSprintPlan = async () => {
    setMessages((prev) => [...prev, {
      id: 'usr-sprint',
      role: 'user',
      content: 'Suggest Sprint Plan',
      created_at: new Date().toISOString()
    }])
    setLoading(true)
    try {
      const res = await aiService.getSprintPlan()
      setMessages((prev) => [...prev, {
        id: 'ast-sprint',
        role: 'assistant',
        content: res.reply,
        created_at: new Date().toISOString()
      }])
    } catch {
      setMessages((prev) => [...prev, {
        id: 'err-sprint',
        role: 'assistant',
        content: '⚠️ Failed to compile sprint configuration suggestions.',
        created_at: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerBlockers = async () => {
    setMessages((prev) => [...prev, {
      id: 'usr-block',
      role: 'user',
      content: 'Find Blockers',
      created_at: new Date().toISOString()
    }])
    setLoading(true)
    try {
      const res = await aiService.getBlockers()
      setMessages((prev) => [...prev, {
        id: 'ast-block',
        role: 'assistant',
        content: res.reply,
        created_at: new Date().toISOString()
      }])
    } catch {
      setMessages((prev) => [...prev, {
        id: 'err-block',
        role: 'assistant',
        content: '⚠️ Failed to retrieve blocker details.',
        created_at: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerGenerateTasks = async () => {
    setMessages((prev) => [...prev, {
      id: 'usr-tasks',
      role: 'user',
      content: 'Generate Tasks',
      created_at: new Date().toISOString()
    }])
    setLoading(true)
    try {
      const tasks = await aiService.generateTasks()
      setGeneratedTasks(tasks)
      setMessages((prev) => [...prev, {
        id: 'ast-tasks',
        role: 'assistant',
        content: `I have generated **${tasks.length} proposed tasks** tailored to your current project scope. Review them below to allocate them to your active Kanban board.`,
        created_at: new Date().toISOString()
      }])
    } catch {
      setMessages((prev) => [...prev, {
        id: 'err-tasks',
        role: 'assistant',
        content: '⚠️ Failed to generate tasks suggestions.',
        created_at: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleImportTask = async (task: AIGeneratedTask, index: number) => {
    try {
      await taskService.createTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        completed: false
      })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      // Remove imported task from preview list
      setGeneratedTasks((prev) => prev.filter((_, idx) => idx !== index))
    } catch (err) {
      console.error('Failed to import task', err)
    }
  }

  const handleDeleteThread = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await aiService.deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeConvoId === id) {
        setActiveConvoId(undefined)
        setMessages([])
      }
    } catch (err) {
      console.error('Failed to delete thread', err)
    }
  }

  const handleResetChat = () => {
    setActiveConvoId(undefined)
    setMessages([])
    setGeneratedTasks([])
    setShowThreadHistory(false)
  }

  return (
    <>
      {/* Floating Sparkle Summoner Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#5BB98C] text-[#111315] flex items-center justify-center shadow-lg shadow-[#5BB98C]/25 cursor-pointer z-40 border border-white/10"
        title="AI Copilot Assistant"
      >
        <Sparkles className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-22 right-6 w-96 h-[550px] border border-white/[0.06] bg-[#171A1D] rounded-2xl flex flex-col overflow-hidden shadow-2xl z-40"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/[0.06] bg-[#1D2024] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#5BB98C]" />
                <div>
                  <h3 className="text-xs font-bold text-white leading-none">AI Assistant</h3>
                  <span className="text-[9px] text-[#A7ADB5]">Linear Copilot Workspace v1.0</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowThreadHistory(!showThreadHistory)}
                  className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${showThreadHistory ? 'text-[#5BB98C]' : 'text-[#7E848C]'}`}
                  title="Thread History"
                >
                  <History className="h-4 w-4" />
                </button>
                <button
                  onClick={handleResetChat}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#7E848C] hover:text-white transition-colors cursor-pointer"
                  title="New Thread"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#7E848C] hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Conversation Threads Dropdown overlay */}
            <AnimatePresence>
              {showThreadHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#1D2024] border-b border-white/[0.06] max-h-40 overflow-y-auto"
                >
                  <div className="p-2.5 space-y-1">
                    <p className="text-[8px] font-bold text-[#7E848C] uppercase tracking-wider px-2">Previous Chats</p>
                    {conversations.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setActiveConvoId(c.id)
                          setShowThreadHistory(false)
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-left transition-colors ${
                          activeConvoId === c.id ? 'bg-[#5BB98C]/10 text-[#5BB98C]' : 'hover:bg-white/5 text-[#A7ADB5] hover:text-white'
                        }`}
                      >
                        <span className="text-[10px] truncate max-w-[240px] font-medium">{c.title}</span>
                        <button
                          onClick={(e) => handleDeleteThread(c.id, e)}
                          className="p-1 rounded hover:bg-white/10 text-[#7E848C] hover:text-[#EB5757] transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {conversations.length === 0 && (
                      <p className="text-[10px] text-[#7E848C] italic text-center py-2">No threads found</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4" ref={scrollRef}>
              
              {/* Quick Action Pills (if new chat) */}
              {messages.length === 0 && (
                <div className="space-y-3 text-left py-6">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-[#F5F5F5]">Welcome, how can I assist today?</p>
                    <p className="text-[9px] text-[#A7ADB5]">Use direct commands or chat naturally with your workspace.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleTriggerSprintPlan}
                      className="p-2.5 rounded-xl border border-white/[0.04] bg-[#1D2024] hover:bg-[#23272B] text-left transition-colors text-[10px] font-medium text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <ClipboardList className="h-3.5 w-3.5 text-[#5BB98C]" /> Suggest Sprint Plan
                    </button>
                    <button
                      onClick={handleTriggerBlockers}
                      className="p-2.5 rounded-xl border border-white/[0.04] bg-[#1D2024] hover:bg-[#23272B] text-left transition-colors text-[10px] font-medium text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" /> Find Blockers
                    </button>
                    <button
                      onClick={handleTriggerGenerateTasks}
                      className="p-2.5 rounded-xl border border-white/[0.04] bg-[#1D2024] hover:bg-[#23272B] text-left transition-colors text-[10px] font-medium text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-blue-400" /> Generate Tasks
                    </button>
                    <button
                      onClick={() => handleSendPrompt(undefined, "Summarize active project statistics")}
                      className="p-2.5 rounded-xl border border-white/[0.04] bg-[#1D2024] hover:bg-[#23272B] text-left transition-colors text-[10px] font-medium text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-[#A7ADB5]" /> Summarize Project
                    </button>
                  </div>
                </div>
              )}

              {/* Chat messages */}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 max-w-[85%] text-left ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    m.role === 'user' ? 'bg-[#5BB98C] text-[#111315]' : 'bg-[#1D2024] text-white border border-white/5'
                  }`}>
                    {m.role === 'user' ? 'U' : 'AI'}
                  </div>

                  <div className={`p-3 rounded-2xl text-[11px] leading-relaxed whitespace-pre-line border ${
                    m.role === 'user'
                      ? 'bg-[#5BB98C]/10 border-[#5BB98C]/20 text-white rounded-tr-none'
                      : 'bg-[#1D2024] border-white/5 text-[#F5F5F5] rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}

              {/* Proposed Generated Tasks Cards (if any) */}
              {generatedTasks.length > 0 && (
                <div className="space-y-2 mt-2">
                  {generatedTasks.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 border border-white/[0.04] bg-[#1D2024] rounded-xl flex items-center justify-between text-left"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-[8px] bg-blue-500/20 text-blue-400 font-bold uppercase rounded px-1 py-0.2">AI TASK</span>
                        <p className="text-[10px] font-semibold text-white mt-1">{t.title}</p>
                        <p className="text-[8px] text-[#A7ADB5] mt-0.5 truncate">{t.description}</p>
                      </div>
                      <button
                        onClick={() => handleImportTask(t, idx)}
                        className="flex-shrink-0 p-1.5 rounded-lg bg-[#5BB98C]/15 border border-[#5BB98C]/20 hover:bg-[#5BB98C] hover:text-[#111315] text-[#5BB98C] transition-all cursor-pointer"
                        title="Import task"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Loader */}
              {loading && (
                <div className="flex gap-2.5 max-w-[85%] text-left">
                  <div className="h-6 w-6 rounded-full bg-[#1D2024] text-white flex items-center justify-center text-[9px] border border-white/5 animate-pulse">
                    AI
                  </div>
                  <div className="p-3 rounded-2xl bg-[#1D2024] border border-white/5 text-[#7E848C] flex items-center gap-1.5 rounded-tl-none">
                    <Loader className="h-3 w-3 animate-spin text-[#5BB98C]" /> Thinking...
                  </div>
                </div>
              )}

            </div>

            {/* Prompt Input Form */}
            <form onSubmit={handleSendPrompt} className="p-4 border-t border-white/[0.06] bg-[#1D2024]/40 flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask workspace copilot..."
                className="flex-1 px-3 py-2 border border-white/[0.06] bg-[#1D2024] text-xs text-white placeholder-[#7E848C] rounded-xl outline-none focus:border-[#5BB98C] transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="p-2 rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
