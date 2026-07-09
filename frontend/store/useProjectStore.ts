import { create } from 'zustand'

interface ProjectState {
  searchQuery: string
  sortBy: string
  statusFilter: string
  viewArchived: boolean
  activeModal: 'project' | 'task' | null

  // Actions
  setSearchQuery: (query: string) => void
  setSortBy: (sort: string) => void
  setStatusFilter: (filter: string) => void
  setViewArchived: (archived: boolean) => void
  setActiveModal: (modal: 'project' | 'task' | null) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  searchQuery: '',
  sortBy: 'newest',
  statusFilter: '',
  viewArchived: false,
  activeModal: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setViewArchived: (archived) => set({ viewArchived: archived }),
  setActiveModal: (modal) => set({ activeModal: modal }),
}))
