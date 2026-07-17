import { api } from './api'

export interface SupportTicketCreate {
  title: string
  description: string
  category: string
  priority: string
}

export interface SupportTicketResponse {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  created_at: string
  updated_at: string
}

export interface FAQResponse {
  question: string
  answer: string
  category: string
}

export const helpService = {
  async getFAQs(): Promise<FAQResponse[]> {
    const response = await api.get<FAQResponse[]>('/help/faqs')
    return response.data
  },

  async createTicket(data: SupportTicketCreate): Promise<SupportTicketResponse> {
    const response = await api.post<SupportTicketResponse>('/help/tickets', data)
    return response.data
  },

  async getTickets(): Promise<SupportTicketResponse[]> {
    const response = await api.get<SupportTicketResponse[]>('/help/tickets')
    return response.data
  }
}
