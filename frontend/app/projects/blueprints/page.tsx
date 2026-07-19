'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Layers,
  Search,
  SlidersHorizontal,
  FolderOpen,
  MessageSquare,
  Terminal,
  Copy,
  Edit2,
  Archive,
  Trash2,
  Plus,
  HelpCircle,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react'
import {
  listBlueprints,
  updateBlueprint,
  duplicateBlueprint,
  deleteBlueprint,
  BlueprintResponseSchema
} from '@/services/ai'
import { CardSkeleton } from '@/components/ui/Skeleton'

export default function BlueprintsPage() {
  const router = useRouter()
  const [blueprints, setBlueprints] = useState<BlueprintResponseSchema[]>([])
  const [loading, setLoading] = useState(true)

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [includeArchived, setIncludeArchived] = useState(false)

  // Rename modal states
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameTitle, setRenameTitle] = useState('')

  // Load blueprints list from backend
  const loadData = async () => {
    setLoading(true)
    try {
      const data = await listBlueprints({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        sort: sortBy,
        include_archived: includeArchived
      })
      setLockFiltersData(data)
    } catch (err) {
      console.error('Failed to load blueprints list', err)
    } finally {
      setLoading(false)
    }
  }

  // Workaround to bypass remote Postgres database search filtering if local in-memory queries are faster
  const [allBlueprints, setLockFiltersData] = useState<BlueprintResponseSchema[]>([])

  useEffect(() => {
    loadData()
  }, [searchQuery, statusFilter, sortBy, includeArchived])

  // Card action handlers
  const handleOpenBlueprint = (bp: BlueprintResponseSchema, redirectPath: string) => {
    // Inject active blueprint context parameters to localStorage for unified pages detection
    const combinedBlueprint = {
      project_plan: bp.overview,
      milestone_plan: bp.milestones,
      database_design: bp.database_design,
      api_design: bp.api_design,
      architecture: bp.architecture
    }
    localStorage.setItem('devworkspace_active_blueprint', JSON.stringify(combinedBlueprint))
    localStorage.setItem('devworkspace_active_blueprint_id', bp.id)
    router.push(redirectPath)
  }

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateBlueprint(id)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleArchive = async (id: string, currentArchived: boolean) => {
    try {
      await updateBlueprint(id, { is_archived: !currentArchived })
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blueprint permanently?')) return
    try {
      await deleteBlueprint(id)
      const currentActiveId = localStorage.getItem('devworkspace_active_blueprint_id')
      if (currentActiveId === id) {
        localStorage.removeItem('devworkspace_active_blueprint_id')
        localStorage.removeItem('devworkspace_active_blueprint')
      }
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const startRenaming = (bp: BlueprintResponseSchema) => {
    setRenamingId(bp.id)
    setRenameTitle(bp.title)
  }

  const saveRename = async () => {
    if (!renameTitle.trim() || !renamingId) return
    try {
      await updateBlueprint(renamingId, { title: renameTitle })
      setRenamingId(null)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-primary/10 via-card/50 to-primary/5 p-6 md:p-8 flex items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white">My Blueprints</h1>
              <p className="text-sm text-muted-foreground">
                Manage, duplicate, open, and continue working on your generated software architect blueprints.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/projects/ai-planner')}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold text-xs transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New Blueprint
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.005]">
          <div className="flex items-center gap-2 bg-[#09090b] border border-white/5 rounded-lg px-3 py-1.5 w-full md:w-80">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project name or technology..."
              className="bg-transparent border-none outline-none text-xs text-white placeholder-muted-foreground w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 rounded bg-[#09090b] border border-white/10 text-white outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 rounded bg-[#09090b] border border-white/10 text-white outline-none cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="recently_modified">Recently Modified</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="rounded border-white/10 bg-[#09090b] text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
              />
              <span className="text-muted-foreground">Include Archived</span>
            </label>
          </div>
        </div>

        {/* List grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : allBlueprints.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-white/10 bg-white/[0.005] text-center flex flex-col items-center justify-center space-y-3">
            <HelpCircle className="h-10 w-10 text-muted-foreground animate-pulse" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">No blueprints found</p>
              <p className="text-xs text-muted-foreground">
                Start by creating your very first specifications blueprint inside the AI Software Architect Project Planner.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {allBlueprints.map((bp) => {
              const tech = bp.tech_stack || {}
              const isDraft = bp.status === 'Draft'
              const numModules = bp.generated_code?.length || 0

              return (
                <div
                  key={bp.id}
                  className={`p-5 rounded-2xl border bg-card flex flex-col justify-between space-y-4 hover:border-primary/20 transition-all ${
                    bp.is_archived ? 'opacity-50 border-dashed border-white/10' : 'border-white/5'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      {renamingId === bp.id ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={renameTitle}
                            onChange={(e) => setRenameTitle(e.target.value)}
                            className="px-2 py-1 text-xs text-white bg-[#09090b] border border-white/10 rounded outline-none w-full"
                          />
                          <button
                            onClick={saveRename}
                            className="px-2.5 py-1 text-[10px] bg-primary text-black font-bold rounded cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setRenamingId(null)}
                            className="px-2 py-1 text-[10px] bg-white/5 hover:bg-white/10 text-white rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-white leading-tight">{bp.title}</h3>
                            {bp.is_archived && (
                              <span className="text-[8px] bg-yellow-500/20 text-yellow-400 font-bold uppercase rounded px-1 py-0.2">
                                ARCHIVED
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2">{bp.description || 'No description provided.'}</p>
                        </div>
                      )}

                      {!renamingId && (
                        <div className="flex items-center gap-1">
                          <span className={`text-[8px] font-bold uppercase rounded px-1.5 py-0.5 flex items-center gap-1 ${
                            isDraft ? 'bg-blue-500/10 text-blue-400' : 'bg-primary/10 text-primary'
                          }`}>
                            {isDraft ? <Clock className="h-2 w-2" /> : <CheckCircle2 className="h-2 w-2" />}
                            {bp.status}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tech details */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-white/5 pt-3">
                      <div>
                        <span className="text-muted-foreground block">Stack</span>
                        <span className="text-white font-semibold block truncate">
                          {tech.frontend ? `${tech.frontend} / ${tech.backend}` : 'Not configured'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Database</span>
                        <span className="text-white font-semibold block truncate">
                          {tech.database || 'Not configured'}
                        </span>
                      </div>
                    </div>

                    {/* Meta timestamps */}
                    <div className="flex items-center justify-between text-[8px] text-muted-foreground">
                      <span>Created: {new Date(bp.created_at).toLocaleDateString()}</span>
                      <span>Modified: {new Date(bp.updated_at).toLocaleDateString()}</span>
                      <span className="font-bold text-primary">{numModules} Module(s) Generated</span>
                    </div>
                  </div>

                  {/* Actions toolbar */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3 gap-2">
                    {/* Primary options */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => handleOpenBlueprint(bp, '/projects/ai-planner')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-white cursor-pointer"
                        title="Open Blueprint Planner"
                      >
                        <FolderOpen className="h-3 w-3" /> Planner
                      </button>
                      <button
                        onClick={() => handleOpenBlueprint(bp, '/projects/code-generator')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] font-bold cursor-pointer"
                        title="Open Code Generator"
                      >
                        <Terminal className="h-3 w-3" /> Generator
                      </button>
                    </div>

                    {/* Utility list */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startRenaming(bp)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                        title="Rename Blueprint"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(bp.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                        title="Duplicate Blueprint"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleArchive(bp.id, bp.is_archived)}
                        className={`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer ${
                          bp.is_archived ? 'text-yellow-500' : 'text-muted-foreground hover:text-white'
                        }`}
                        title={bp.is_archived ? 'Unarchive Blueprint' : 'Archive Blueprint'}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(bp.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete Blueprint"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
