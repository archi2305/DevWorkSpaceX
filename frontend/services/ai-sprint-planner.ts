import { api } from './api'

export interface BacklogAnalysis {
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  priority_distribution: {
    High: number
    Medium: number
    Low: number
  }
  average_complexity: number
  completion_rate: number
  recommendations: string[]
}

export interface SprintPlan {
  sprint_id: string
  tasks: any[]
  total_story_points: number
  capacity: number
  sprint_goal: string
  estimated_duration: number
  risks: Risk[]
}

export interface Risk {
  type: string
  severity: string
  description: string
  task_id: string | null
}

export interface StoryPointEstimation {
  task_id: string
  estimated_story_points: number
  current_story_points: number | null
}

export interface PrioritySuggestion {
  task_id: string
  suggested_priority: string
  current_priority: string
}

export interface RiskAnalysis {
  risks: Risk[]
  total_risks: number
}

export interface SprintGoal {
  sprint_goal: string
  task_count: number
}

export interface ConversationMessage {
  role: string
  content: string
  timestamp?: string
}

export interface Conversation {
  id: string
  conversation_type: string
  context: any
  summary: string | null
  tokens_used: number
  created_at: string
  updated_at: string
}

export const aiSprintPlannerService = {
  async analyzeBacklog(projectId: string, sprintId?: string): Promise<BacklogAnalysis> {
    const response = await api.post<BacklogAnalysis>('/ai/sprint-planner/analyze-backlog', {
      project_id: projectId,
      sprint_id: sprintId
    })
    return response.data
  },

  async generateSprint(projectId: string, capacity: number = 8, sprintDurationWeeks: number = 2): Promise<SprintPlan> {
    const response = await api.post<SprintPlan>('/ai/sprint-planner/generate-sprint', {
      project_id: projectId,
      capacity,
      sprint_duration_weeks: sprintDurationWeeks
    })
    return response.data
  },

  async estimateStoryPoints(taskId: string): Promise<StoryPointEstimation> {
    const response = await api.post<StoryPointEstimation>('/ai/sprint-planner/estimate-story-points', {
      task_id: taskId
    })
    return response.data
  },

  async suggestPriority(taskId: string, context?: any): Promise<PrioritySuggestion> {
    const response = await api.post<PrioritySuggestion>('/ai/sprint-planner/suggest-priority', {
      task_id: taskId,
      context
    })
    return response.data
  },

  async identifyRisks(taskIds: string[]): Promise<RiskAnalysis> {
    const response = await api.post<RiskAnalysis>('/ai/sprint-planner/identify-risks', {
      task_ids: taskIds
    })
    return response.data
  },

  async generateSprintGoal(taskIds: string[]): Promise<SprintGoal> {
    const response = await api.post<SprintGoal>('/ai/sprint-planner/generate-sprint-goal', {
      task_ids: taskIds
    })
    return response.data
  },

  async saveConversation(data: {
    conversation_type: string
    context?: any
    messages: ConversationMessage[]
    summary?: string
    tokens_used?: number
  }): Promise<{ conversation_id: string; created_at: string }> {
    const response = await api.post('/ai/sprint-planner/conversations', data)
    return response.data
  },

  async getConversations(conversationType?: string, limit: number = 20): Promise<Conversation[]> {
    const response = await api.get<Conversation[]>('/ai/sprint-planner/conversations', {
      params: { conversation_type: conversationType, limit }
    })
    return response.data
  },

  async getConversation(conversationId: string): Promise<Conversation & { messages: ConversationMessage[] }> {
    const response = await api.get<Conversation & { messages: ConversationMessage[] }>(
      `/ai/sprint-planner/conversations/${conversationId}`
    )
    return response.data
  }
}
