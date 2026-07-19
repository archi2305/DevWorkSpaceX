import { api } from './api'

export interface AIChatResponse {
  conversation_id: string
  title: string
  reply: string
}

export interface AIConversation {
  id: string
  title: string
  created_at: string
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface AIGeneratedTask {
  title: string
  description: string
  priority: string
  status: string
}

export const aiService = {
  /**
   * Post prompt message to AI thread.
   */
  async chat(prompt: string, conversationId?: string): Promise<AIChatResponse> {
    const response = await api.post<AIChatResponse>('/ai/chat', {
      prompt,
      conversation_id: conversationId
    })
    return response.data
  },

  /**
   * Load active chat threads.
   */
  async getConversations(): Promise<AIConversation[]> {
    const response = await api.get<AIConversation[]>('/ai/conversations')
    return response.data
  },

  /**
   * Load chat history log messages.
   */
  async getMessages(conversationId: string): Promise<AIMessage[]> {
    const response = await api.get<AIMessage[]>(`/ai/conversations/${conversationId}/messages`)
    return response.data
  },

  /**
   * Delete thread.
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await api.delete(`/ai/conversations/${conversationId}`)
  },

  /**
   * Get dynamic sprint suggestion report.
   */
  async getSprintPlan(): Promise<{ reply: string }> {
    const response = await api.get<{ reply: string }>('/ai/sprint-plan')
    return response.data
  },

  /**
   * Get workspace blockers diagnostic report.
   */
  async getBlockers(): Promise<{ reply: string }> {
    const response = await api.get<{ reply: string }>('/ai/blockers')
    return response.data
  },

  /**
   * Get status summary for specific project.
   */
  async getProjectSummary(projectId: string): Promise<{ reply: string }> {
    const response = await api.get<{ reply: string }>(`/ai/project-summary/${projectId}`)
    return response.data
  },

  /**
   * Generate proposed tasks based on workspace constraints.
   */
  async generateTasks(): Promise<AIGeneratedTask[]> {
    const response = await api.post<AIGeneratedTask[]>('/ai/generate-tasks')
    return response.data
  },

  /**
   * Fetch custom prompt library templates.
   */
  async getSavedPrompts(): Promise<any[]> {
    const response = await api.get('/ai/prompts')
    return response.data
  },

  /**
   * Save a prompt template to PostgreSQL.
   */
  async savePrompt(title: string, content: string): Promise<any> {
    const response = await api.post('/ai/prompts', { title, content })
    return response.data
  },

  /**
   * Delete prompt template from user library.
   */
  async deletePrompt(id: string): Promise<void> {
    await api.delete(`/ai/prompts/${id}`)
  },

  /**
   * Generate structured project plan.
   */
  async generateProjectPlan(params: {
    prompt: string
    project_type?: string
    difficulty?: string
    timeline?: string
    team_size?: string
    tech_stack?: string
  }): Promise<any> {
    const response = await api.post('/api/ai/project-planner', params)
    return response.data
  },

  /**
   * Refine project plan interactively via copilot chat.
   */
  async copilotChat(currentProject: any, message: string): Promise<any> {
    const response = await api.post('/api/ai/copilot-chat', {
      current_project: currentProject,
      message
    })
    return response.data
  }
}

export interface TechStack {
  frontend: string
  backend: string
  database: string
}

export interface ProjectTask {
  title: string
  description: string
  priority: string
}

export interface ProjectPlanResponse {
  title: string
  description: string
  features: string[]
  tech_stack: TechStack
  milestones: string[]
  tasks: ProjectTask[]
}

/**
 * Send request to generate a software project plan.
 */
export async function generateProjectPlan(params: {
  idea: string
  project_type: string
  difficulty: string
  timeline: string
  preferred_stack?: string
}): Promise<ProjectPlanResponse> {
  const response = await api.post<ProjectPlanResponse>('/api/ai/project-plan', params)
  return response.data
}

export interface ImplementationTask {
  title: string
  description: string
  priority: string
  estimated_hours: number
}

export interface MilestonePlanResponse {
  milestone: string
  overview: string
  subtasks: ImplementationTask[]
  api_endpoints: string[]
  database_tables: string[]
  folder_structure: string
}

export interface DatabaseColumn {
  name: string
  type: string
  primary_key: boolean
  nullable: boolean
  unique: boolean
}

export interface DatabaseTable {
  name: string
  description: string
  columns: DatabaseColumn[]
}

export interface Relationship {
  from_table: string
  to_table: string
  relationship_type: string
}

export interface DatabaseDesignResponse {
  database: string
  tables: DatabaseTable[]
  relationships: Relationship[]
  indexes: string[]
}

export interface ApiEndpoint {
  method: string
  path: string
  description: string
}

export interface ApiResource {
  name: string
  endpoints: ApiEndpoint[]
}

export interface AuthenticationEndpoint {
  method: string
  path: string
  description: string
}

export interface AuthenticationDesign {
  login: AuthenticationEndpoint
  register: AuthenticationEndpoint
}

export interface ApiDesignResponse {
  base_url: string
  resources: ApiResource[]
  authentication: AuthenticationDesign
  request_examples: Record<string, any>
  response_examples: Record<string, any>
  status_codes: number[]
}

export interface ArchitectureFolderStructure {
  backend: string[]
  frontend: string[]
}

export interface ArchitectureResponse {
  architecture_style: string
  modules: string[]
  folder_structure: ArchitectureFolderStructure
  external_services: string[]
  communication: string
}

export async function generateMilestonePlan(params: {
  project_title: string
  milestone: string
  preferred_stack?: string
}): Promise<MilestonePlanResponse> {
  const response = await api.post<MilestonePlanResponse>('/api/ai/milestone-plan', params)
  return response.data
}

export async function generateDatabaseDesign(params: {
  project_title: string
  description: string
  preferred_database?: string
}): Promise<DatabaseDesignResponse> {
  const response = await api.post<DatabaseDesignResponse>('/api/ai/database-design', params)
  return response.data
}

export async function generateApiDesign(params: {
  project_title: string
  description: string
  database_tables: string[]
}): Promise<ApiDesignResponse> {
  const response = await api.post<ApiDesignResponse>('/api/ai/api-design', params)
  return response.data
}

export async function generateArchitecture(params: {
  project_title: string
  description: string
  tech_stack: TechStack
  database_tables: string[]
  api_resources: string[]
}): Promise<ArchitectureResponse> {
  const response = await api.post<ArchitectureResponse>('/api/ai/architecture', params)
  return response.data
}
