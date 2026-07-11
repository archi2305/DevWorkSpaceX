'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import {
  GitPullRequest,
  GitCommit,
  GitBranch,
  AlertCircle,
  ExternalLink,
  Settings,
  Link2,
  RefreshCw,
  Loader,
  Server,
  Code
} from 'lucide-react'
import { githubService, GithubRepository, GithubPullRequest, GithubCommit, GithubIssue, GithubBranch, GithubDeployment } from '@/services/github'
import { projectService } from '@/services/project'
import { taskService } from '@/services/task'

export default function GithubPage() {
  const queryClient = useQueryClient()
  const [selectedRepoId, setSelectedRepoId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'prs' | 'commits' | 'issues' | 'branches' | 'deployments'>('prs')
  const [linkPrId, setLinkPrId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')

  // 1. Repositories
  const { data: repos = [], isLoading: loadingRepos, refetch: refetchRepos } = useQuery<GithubRepository[]>({
    queryKey: ['github-repos'],
    queryFn: githubService.getRepositories
  })

  // Auto-select first repo
  useEffect(() => {
    if (repos.length > 0 && !selectedRepoId) {
      setSelectedRepoId(repos[0].id)
    }
  }, [repos, selectedRepoId])

  // 2. Active Tab Queries
  const { data: prs = [], isLoading: loadingPrs } = useQuery<GithubPullRequest[]>({
    queryKey: ['github-prs', selectedRepoId],
    queryFn: () => githubService.getPullRequests(selectedRepoId || undefined),
    enabled: !!selectedRepoId
  })

  const { data: commits = [], isLoading: loadingCommits } = useQuery<GithubCommit[]>({
    queryKey: ['github-commits', selectedRepoId],
    queryFn: () => githubService.getCommits(selectedRepoId),
    enabled: !!selectedRepoId && activeTab === 'commits'
  })

  const { data: issues = [], isLoading: loadingIssues } = useQuery<GithubIssue[]>({
    queryKey: ['github-issues', selectedRepoId],
    queryFn: () => githubService.getIssues(selectedRepoId),
    enabled: !!selectedRepoId && activeTab === 'issues'
  })

  const { data: branches = [], isLoading: loadingBranches } = useQuery<GithubBranch[]>({
    queryKey: ['github-branches', selectedRepoId],
    queryFn: () => githubService.getBranches(selectedRepoId),
    enabled: !!selectedRepoId && activeTab === 'branches'
  })

  const { data: deployments = [], isLoading: loadingDeployments } = useQuery<GithubDeployment[]>({
    queryKey: ['github-deployments', selectedRepoId],
    queryFn: () => githubService.getDeployments(selectedRepoId),
    enabled: !!selectedRepoId && activeTab === 'deployments'
  })

  // 3. Load workspace tasks for linking dropdown
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects()
  })

  // Load all tasks inside the first project
  const firstProjectId = projects[0]?.id
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ['tasks', firstProjectId],
    queryFn: () => taskService.getTasks(firstProjectId),
    enabled: !!firstProjectId
  })

  // 4. Link Mutation
  const linkMutation = useMutation({
    mutationFn: ({ prId, taskId }: { prId: string; taskId: string }) =>
      githubService.linkTaskToPR(prId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-prs'] })
      setLinkPrId(null)
      setSelectedTaskId('')
    }
  })

  const handleLinkPr = (prId: string) => {
    if (selectedTaskId) {
      linkMutation.mutate({ prId, taskId: selectedTaskId })
    }
  }

  const handleOAuthConnect = async () => {
    try {
      const url = await githubService.getOAuthUrl()
      window.open(url, '_blank')
    } catch (err) {
      alert('OAuth failed to fetch authorize link.')
    }
  }

  const loadingContent = loadingRepos || (selectedRepoId && (
    (activeTab === 'prs' && loadingPrs) ||
    (activeTab === 'commits' && loadingCommits) ||
    (activeTab === 'issues' && loadingIssues) ||
    (activeTab === 'branches' && loadingBranches) ||
    (activeTab === 'deployments' && loadingDeployments)
  ))

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header section */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5 text-left">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <svg className="h-6 w-6 text-[#A7ADB5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg> GitHub Integrations
            </h1>
            <p className="text-xs text-[#A7ADB5] mt-1">Connect repositories, link issues, track pull requests, and audit branch pipelines.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOAuthConnect}
              className="px-4 py-2 border border-white/[0.08] hover:bg-[#1D2024] text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Settings className="h-4 w-4" /> Connect via OAuth
            </button>
            <span className="text-[9px] bg-[#5BB98C]/15 text-[#5BB98C] px-2 py-0.5 rounded font-bold uppercase">Webhook Ready</span>
          </div>
        </div>

        {/* Repository Selector */}
        <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <Code className="h-5 w-5 text-[#A7ADB5]" />
            <div>
              <label className="text-[10px] font-extrabold text-[#7E848C] uppercase tracking-wider block">Active Repository</label>
              <select
                value={selectedRepoId}
                onChange={(e) => setSelectedRepoId(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-white outline-none cursor-pointer mt-0.5 focus:text-[#5BB98C]"
              >
                {repos.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.full_name}
                  </option>
                ))}
                {repos.length === 0 && <option value="">No Repositories Linked</option>}
              </select>
            </div>
          </div>

          <button
            onClick={() => refetchRepos()}
            className="p-2 rounded-xl border border-white/[0.06] bg-[#1D2024] hover:bg-[#23272B] text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/[0.06] gap-6">
          {(['prs', 'commits', 'issues', 'branches', 'deployments'] as const).map((tab) => {
            const isActive = activeTab === tab
            const label = tab === 'prs' ? 'Pull Requests' : tab.charAt(0).toUpperCase() + tab.slice(1)
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 relative -bottom-[2px] ${
                  isActive ? 'border-[#5BB98C] text-white' : 'border-transparent text-[#7E848C] hover:text-white'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Main Body */}
        {loadingContent ? (
          <div className="flex h-64 items-center justify-center">
            <Loader className="h-6 w-6 text-[#5BB98C] animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 1. Pull Requests */}
            {activeTab === 'prs' && (
              <div className="grid grid-cols-1 gap-3">
                {prs.map((pr) => (
                  <div key={pr.id} className="p-4 border border-white/[0.06] bg-[#171A1D] rounded-2xl flex flex-wrap items-center justify-between gap-4 text-left">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <GitPullRequest className="h-4 w-4 text-[#5BB98C]" />
                        <span className="text-xs font-bold text-white">#{pr.number} {pr.title}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[10px] text-[#7E848C]">
                        <span className={`px-2 py-0.5 rounded font-extrabold uppercase text-[9px] ${
                          pr.state === 'open' ? 'bg-[#5BB98C]/15 text-[#5BB98C]' : 'bg-purple-500/15 text-purple-400'
                        }`}>{pr.state}</span>
                        <a href={pr.html_url} target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">
                          View on GitHub <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {pr.task_id ? (
                        <span className="text-[10px] bg-white/[0.04] border border-white/5 rounded-lg px-2.5 py-1.5 text-white font-mono flex items-center gap-1">
                          <Link2 className="h-3 w-3 text-[#5BB98C]" /> Linked to Task
                        </span>
                      ) : linkPrId === pr.id ? (
                        <div className="flex items-center gap-2 bg-[#1D2024] border border-white/[0.06] rounded-xl px-2 py-1">
                          <select
                            value={selectedTaskId}
                            onChange={(e) => setSelectedTaskId(e.target.value)}
                            className="bg-transparent border-none text-[10px] text-[#A7ADB5] outline-none cursor-pointer focus:text-white"
                          >
                            <option value="">Select Task...</option>
                            {tasks.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.title}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleLinkPr(pr.id)}
                            className="px-2.5 py-1 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold rounded-lg text-[9px] cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setLinkPrId(pr.id)}
                          className="px-3 py-1.5 border border-white/[0.08] hover:bg-[#1D2024] text-white font-bold rounded-xl text-[10px] flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Link2 className="h-3 w-3" /> Link Task
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {prs.length === 0 && (
                  <div className="py-12 border border-dashed border-white/10 rounded-2xl text-center bg-[#171A1D] text-[#7E848C] text-xs">
                    No pull requests detected in this repository.
                  </div>
                )}
              </div>
            )}

            {/* 2. Commits */}
            {activeTab === 'commits' && (
              <div className="grid grid-cols-1 gap-3">
                {commits.map((c) => (
                  <div key={c.id} className="p-4 border border-white/[0.06] bg-[#171A1D] rounded-2xl flex flex-wrap items-center justify-between gap-4 text-left">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <GitCommit className="h-4 w-4 text-blue-400" />
                        <span className="text-xs font-bold text-white">{c.message}</span>
                      </div>
                      <span className="text-[10px] text-[#7E848C] block">Committed by {c.author}</span>
                    </div>

                    <a
                      href={c.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#1D2024] hover:bg-[#23272B] border border-white/[0.06] text-white font-mono text-[9px] rounded-lg flex items-center gap-1"
                    >
                      {c.sha.slice(0, 7)} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Issues */}
            {activeTab === 'issues' && (
              <div className="grid grid-cols-1 gap-3">
                {issues.map((issue) => (
                  <div key={issue.id} className="p-4 border border-white/[0.06] bg-[#171A1D] rounded-2xl flex flex-wrap items-center justify-between gap-4 text-left">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs font-bold text-white">#{issue.number} {issue.title}</span>
                      </div>
                      <span className="text-[9px] bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded font-extrabold uppercase inline-block">{issue.state}</span>
                    </div>

                    <a href={issue.html_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl border border-white/[0.06] bg-[#1D2024] hover:bg-[#23272B] text-white">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Branches */}
            {activeTab === 'branches' && (
              <div className="grid grid-cols-1 gap-3">
                {branches.map((b) => (
                  <div key={b.id} className="p-4 border border-white/[0.06] bg-[#171A1D] rounded-2xl flex flex-wrap items-center justify-between gap-4 text-left">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">{b.name}</span>
                    </div>

                    {b.protected && (
                      <span className="text-[9px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded font-bold uppercase">
                        Protected
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 5. Deployments */}
            {activeTab === 'deployments' && (
              <div className="grid grid-cols-1 gap-3">
                {deployments.map((d) => (
                  <div key={d.id} className="p-4 border border-white/[0.06] bg-[#171A1D] rounded-2xl flex flex-wrap items-center justify-between gap-4 text-left">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-blue-400" />
                        <span className="text-xs font-bold text-white">Deployed to {d.environment}</span>
                      </div>
                      <span className="text-[10px] text-[#7E848C] block">Updated: {new Date(d.updated_at).toLocaleString()}</span>
                    </div>

                    <span className={`text-[9px] px-2.5 py-1 rounded font-extrabold uppercase ${
                      d.status === 'success' ? 'bg-[#5BB98C]/15 text-[#5BB98C]' : 'bg-red-500/15 text-red-400'
                    }`}>{d.status}</span>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </MainLayout>
  )
}
