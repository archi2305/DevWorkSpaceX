import { api } from './api'

export interface SearchProject {
  id: string
  name: string
  description: string | null
}

export interface SearchTask {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
}

export interface SearchMember {
  id: string
  email: string
  full_name: string
  profile_image: string | null
}

export interface SearchDocument {
  id: string
  title: string
  content: string | null
}

export interface SearchComment {
  id: string
  content: string
  task_id: string | null
  project_id: string | null
}

export interface SearchFile {
  id: string
  name: string
  file_type: string
  size: number
}

export interface GlobalSearchResponse {
  projects: SearchProject[]
  tasks: SearchTask[]
  members: SearchMember[]
  documents: SearchDocument[]
  comments: SearchComment[]
  files: SearchFile[]
}

export const searchService = {
  /**
   * Run workspace global queries.
   */
  async search(query: string): Promise<GlobalSearchResponse> {
    const response = await api.get<GlobalSearchResponse>('/search', {
      params: { q: query }
    })
    return response.data
  }
}
