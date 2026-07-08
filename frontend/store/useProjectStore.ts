import { create } from 'zustand'
import { ProjectResponse } from '@/services/project'

interface ProjectState {
  searchQuery: string
  sortBy: string
  statusFilter: string
  viewArchived: boolean

  // Actions
  setSearchQuery: (query: string) => void
  setSortBy: (sort: string) => void
  setStatusFilter: (filter: string) => void
  setViewArchived: (archived: boolean) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  searchQuery: '',
  sortBy: 'newest',
  statusFilter: '',
  viewArchived: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setViewArchived: (archived) => set({ viewArchived: archived }),
}))
