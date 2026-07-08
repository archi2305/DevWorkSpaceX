import { create } from 'zustand'
import { projectService, ProjectResponse, ProjectCreateInput } from '@/services/project'

interface ProjectState {
  projects: ProjectResponse[]
  recentProjects: ProjectResponse[]
  currentProject: ProjectResponse | null
  loading: boolean
  error: string | null
  searchQuery: string

  // Actions
  fetchProjects: (search?: string) => Promise<void>
  fetchRecentProjects: () => Promise<void>
  fetchProjectById: (id: string) => Promise<ProjectResponse>
  createProject: (input: ProjectCreateInput) => Promise<ProjectResponse>
  updateProject: (id: string, updateData: Partial<ProjectResponse>) => Promise<ProjectResponse>
  deleteProject: (id: string) => Promise<void>
  setSearchQuery: (query: string) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  recentProjects: [],
  currentProject: null,
  loading: false,
  error: null,
  searchQuery: '',

  /**
   * Load projects using search filters.
   */
  fetchProjects: async (search) => {
    set({ loading: true, error: null })
    try {
      const data = await projectService.getProjects(search)
      set({ projects: data, loading: false })
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to fetch projects.'
      set({ error: errMsg, loading: false })
    }
  },

  /**
   * Fetch recent projects list.
   */
  fetchRecentProjects: async () => {
    try {
      const data = await projectService.getRecentProjects()
      set({ recentProjects: data })
    } catch (err: any) {
      console.error('Failed to fetch recent projects', err)
    }
  },

  /**
   * Load project details.
   */
  fetchProjectById: async (id) => {
    set({ loading: true, error: null })
    try {
      const data = await projectService.getProjectById(id)
      set({ currentProject: data, loading: false })
      return data
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to fetch project details.'
      set({ error: errMsg, loading: false })
      throw err
    }
  },

  /**
   * Add new project with optimistic updating.
   */
  createProject: async (input) => {
    set({ loading: true, error: null })
    try {
      const newProject = await projectService.createProject(input)
      // Synchronize list state immediately
      set((state) => ({
        projects: [newProject, ...state.projects],
        loading: false,
      }))
      return newProject
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to create project.'
      set({ error: errMsg, loading: false })
      throw err
    }
  },

  /**
   * Modify project with optimistic updates.
   */
  updateProject: async (id, updateData) => {
    // Save current state snapshot for rollbacks
    const previousProjects = get().projects
    const previousCurrent = get().currentProject

    // Optimistically update local state values
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updateData } : p)),
      currentProject: state.currentProject?.id === id ? { ...state.currentProject, ...updateData } : state.currentProject,
    }))

    try {
      const updated = await projectService.updateProject(id, updateData)
      // Sync with final server response
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
        currentProject: state.currentProject?.id === id ? updated : state.currentProject,
      }))
      return updated
    } catch (err: any) {
      // Rollback to snapshot on failure
      set({ projects: previousProjects, currentProject: previousCurrent })
      const errMsg = err.response?.data?.detail || 'Failed to update project.'
      set({ error: errMsg })
      throw err
    }
  },

  /**
   * Remove project with optimistic updates.
   */
  deleteProject: async (id) => {
    const previousProjects = get().projects

    // Optimistically remove from list
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      recentProjects: state.recentProjects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }))

    try {
      await projectService.deleteProject(id)
    } catch (err: any) {
      // Rollback to snapshot on failure
      set({ projects: previousProjects })
      const errMsg = err.response?.data?.detail || 'Failed to delete project.'
      set({ error: errMsg })
      throw err
    }
  },

  /**
   * Update text search string.
   */
  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },
}))
