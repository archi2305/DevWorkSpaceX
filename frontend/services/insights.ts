import { api } from './api'

export interface InsightsResponse {
  insights: string
}

export const insightsService = {
  async getWorkspaceInsights(): Promise<InsightsResponse> {
    const response = await api.get<InsightsResponse>('/ai/insights')
    return response.data
  }
}
