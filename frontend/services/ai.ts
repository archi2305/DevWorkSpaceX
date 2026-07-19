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
    const response = await api.post<{ reply: string }>('/api/ai/chat', {
      message: prompt
    })
    return {
      conversation_id: conversationId || 'session-chat',
      title: 'AI Chat',
      reply: response.data.reply
    }
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
    const response = await api.post<{ reply: string }>('/api/ai/chat', { message: 'Suggest Sprint Plan' })
    return response.data
  },

  /**
   * Get workspace blockers diagnostic report.
   */
  async getBlockers(): Promise<{ reply: string }> {
    const response = await api.post<{ reply: string }>('/api/ai/chat', { message: 'Find Blockers' })
    return response.data
  },

  /**
   * Get status summary for specific project.
   */
  async getProjectSummary(projectId: string): Promise<{ reply: string }> {
    const response = await api.post<{ reply: string }>('/api/ai/chat', { message: `Summarize project: ${projectId}` })
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

export interface ChatResponse {
  reply: string
}

export async function generateChat(message: string, projectContext?: any): Promise<ChatResponse> {
  const response = await api.post<ChatResponse>('/api/ai/chat', { message, project_context: projectContext })
  return response.data
}

export interface GeneratedFile {
  filename: string
  language: string
  content: string
}

export interface CodeGenerationResponse {
  files: GeneratedFile[]
}

export async function generateCode(params: {
  project_title: string
  blueprint_context: any
  category: string
  module: string
  language: string
  framework: string
  coding_style?: string
  comment_level?: string
  include_tests: boolean
  generate_doc: boolean
}): Promise<CodeGenerationResponse> {
  const response = await api.post<CodeGenerationResponse>('/api/ai/generate-code', params)
  return response.data
}

export interface BlueprintResponseSchema {
  id: string
  user_id: string
  title: string
  description?: string
  status: string
  is_archived: boolean
  created_at: string
  updated_at: string
  overview?: any
  tech_stack?: any
  features?: any[]
  database_design?: any
  api_design?: any
  architecture?: any
  milestones?: any
  generated_code?: any[]
  chat_history?: any[]
  metadata_info?: any
}

export async function createBlueprint(data: any): Promise<BlueprintResponseSchema> {
  const response = await api.post<BlueprintResponseSchema>('/api/ai/blueprints', data)
  return response.data
}

export async function listBlueprints(params?: {
  search?: string
  status?: string
  sort?: string
  include_archived?: boolean
}): Promise<BlueprintResponseSchema[]> {
  const response = await api.get<BlueprintResponseSchema[]>('/api/ai/blueprints', { params })
  return response.data
}

export async function getBlueprintDetail(id: string): Promise<BlueprintResponseSchema> {
  const response = await api.get<BlueprintResponseSchema>(`/api/ai/blueprints/${id}`)
  return response.data
}

export async function updateBlueprint(id: string, data: any): Promise<BlueprintResponseSchema> {
  const response = await api.put<BlueprintResponseSchema>(`/api/ai/blueprints/${id}`, data)
  return response.data
}

export async function duplicateBlueprint(id: string): Promise<BlueprintResponseSchema> {
  const response = await api.post<BlueprintResponseSchema>(`/api/ai/blueprints/${id}/duplicate`)
  return response.data
}

export async function deleteBlueprint(id: string): Promise<void> {
  await api.delete(`/api/ai/blueprints/${id}`)
}

export interface DocumentationResponse {
  doc_type: string
  filename: string
  content: string
}

export async function generateDocumentation(params: {
  project_context: any
  doc_type: string
}): Promise<DocumentationResponse> {
  const response = await api.post<DocumentationResponse>('/api/ai/generate-docs', params)
  return response.data
}

export interface ReviewRecommendation {
  title: string
  priority: string
  description: string
  fix_snippet?: string
}

export interface CategoryReview {
  category: string
  strengths: string[]
  weaknesses: string[]
  recommendations: ReviewRecommendation[]
}

export interface ReviewResponse {
  scores: Record<string, number>
  categories: CategoryReview[]
  overall_summary: string
}

export async function generateReview(params: {
  project_context: any
}): Promise<ReviewResponse> {
  const response = await api.post<ReviewResponse>('/api/ai/review', params)
  return response.data
}
