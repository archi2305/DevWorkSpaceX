'use client'

import React, { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { helpService, FAQResponse, SupportTicketResponse } from '@/services/help'
import { HelpCircle, ChevronDown, ChevronUp, Ticket, LifeBuoy, Clock, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function HelpPage() {
  const [faqs, setFaqs] = useState<FAQResponse[]>([])
  const [tickets, setTickets] = useState<SupportTicketResponse[]>([])
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  
  // Ticket Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('General')
  const [priority, setPriority] = useState('Medium')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchData = async () => {
    try {
      const faqData = await helpService.getFAQs()
      setFaqs(faqData)
      const ticketData = await helpService.getTickets()
      setTickets(ticketData)
    } catch (err) {
      console.error('Failed to load help data:', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    setLoading(true)
    try {
      await helpService.createTicket({ title, description, category, priority })
      setTitle('')
      setDescription('')
      setMessage('Ticket submitted successfully!')
      setTimeout(() => setMessage(''), 3000)
      fetchData()
    } catch (err) {
      console.error('Failed to submit ticket:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header banner */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-primary/10 via-card/50 to-primary/5 p-6 md:p-8 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <LifeBuoy className="h-8 w-8 text-primary" /> Support Desk
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Find answers to common workspace configuration questions or submit a support ticket directly to our engineers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Accordions (Left Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" /> Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="rounded-xl border border-white/5 bg-[#171a1d]/40 overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left font-medium text-white hover:bg-white/[0.02] transition-all"
                  >
                    <span>{faq.question}</span>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedFaq === index && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 text-sm text-muted-foreground border-t border-white/5 bg-white/[0.01]">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Desk (Right Column) */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" /> Submit a Ticket
            </h2>
            <form onSubmit={handleSubmitTicket} className="p-5 rounded-2xl border border-white/5 bg-[#171a1d]/60 backdrop-blur-xl space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize the problem"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#171a1d] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option>General</option>
                    <option>Task Board</option>
                    <option>Integrations</option>
                    <option>Data Export</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#171a1d] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the steps to reproduce"
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 resize-none"
                  required
                />
              </div>

              {message && <p className="text-xs text-primary">{message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? 'Submitting...' : 'Submit Support Ticket'}
              </button>
            </form>
          </div>
        </div>

        {/* Existing tickets list */}
        {tickets.length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Your Active Tickets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((t) => (
                <div key={t.id} className="p-4 rounded-xl border border-white/5 bg-[#171a1d]/40 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">{t.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                    <div className="flex gap-2 items-center pt-2">
                      <span className="text-[10px] bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-muted-foreground">{t.category}</span>
                      <span className={`text-[10px] rounded-full px-2 py-0.5 ${
                        t.priority === 'High' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-white/5 border border-white/10 text-muted-foreground'
                      }`}>{t.priority}</span>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                    <CheckCircle className="h-3 w-3" /> {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
