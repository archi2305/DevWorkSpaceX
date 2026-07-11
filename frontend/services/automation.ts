import { api } from './api'

export interface AutomationRule {
  id: string
  project_id: string
  name: string
  trigger_event: string // 'task_completed', 'due_date_passed', 'sprint_completed'
  action_type: string   // 'move_to_done', 'notify_owner', 'archive_sprint'
  action_target: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export const automationService = {
  async getAutomations(projectId: string): Promise<AutomationRule[]> {
    const response = await api.get<AutomationRule[]>('/automations', {
      params: { project_id: projectId }
    })
    return response.data
  },

  async createAutomationRule(data: {
    project_id: string
    name: string
    trigger_event: string
    action_type: string
    action_target?: string | null
    is_active?: boolean
  }): Promise<AutomationRule> {
    const response = await api.post<AutomationRule>('/automations', data)
    return response.data
  },

  async updateAutomationRule(id: string, data: Partial<AutomationRule>): Promise<AutomationRule> {
    const response = await api.patch<AutomationRule>(`/automations/${id}`, data)
    return response.data
  },

  async deleteAutomationRule(id: string): Promise<void> {
    await api.delete(`/automations/${id}`)
  },

  async triggerDueDates(projectId: string): Promise<any> {
    const response = await api.post<any>('/automations/trigger/due-dates', null, {
      params: { project_id: projectId }
    })
    return response.data
  }
}
