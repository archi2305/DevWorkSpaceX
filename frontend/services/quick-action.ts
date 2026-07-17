import { api } from './api'

export interface SeedResponse {
  message: string
  project_id: string
  tasks_seeded: number
}

export interface MacroResponse {
  message: string
  actions_run: string[]
}

export const quickActionService = {
  async seedWorkspace(): Promise<SeedResponse> {
    const response = await api.post<SeedResponse>('/quick-actions/seed')
    return response.data
  },

  async triggerMacro(macroName: string): Promise<MacroResponse> {
    const response = await api.post<MacroResponse>('/quick-actions/trigger-macro', {
      macro_name: macroName
    })
    return response.data
  }
}
