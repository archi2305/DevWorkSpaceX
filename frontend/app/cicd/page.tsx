'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Server,
  AlertTriangle,
  RefreshCw,
  Loader,
  Code
} from 'lucide-react'
import { githubService, GithubRepository, GithubWorkflowRun, GithubDeployment } from '@/services/github'

export default function CICDPage() {
  const [selectedRepoId, setSelectedRepoId] = useState<string>('')

  // 1. Repositories list
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

  // 2. Query Workflow runs (Builds)
  const { data: runs = [], isLoading: loadingRuns, refetch: refetchRuns } = useQuery<GithubWorkflowRun[]>({
    queryKey: ['workflow-runs', selectedRepoId],
    queryFn: () => githubService.getWorkflowRuns(selectedRepoId),
    enabled: !!selectedRepoId
  })

  // 3. Query Deployments
  const { data: deployments = [], isLoading: loadingDeployments } = useQuery<GithubDeployment[]>({
    queryKey: ['deployments', selectedRepoId],
    queryFn: () => githubService.getDeployments(selectedRepoId),
    enabled: !!selectedRepoId
  })

  // Calculate metrics
  const latestRun = runs[0]
  const buildStatus = latestRun ? (latestRun.conclusion === 'success' ? 'Passing' : 'Failing') : 'No Builds'
  const failuresCount = runs.filter((r) => r.conclusion === 'failure').length
  const deploymentsCount = deployments.filter((d) => d.status === 'success').length

  const handleManualSync = () => {
    refetchRepos()
    if (selectedRepoId) {
      refetchRuns()
    }
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header section */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5 text-left">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <Activity className="h-6 w-6 text-[#5BB98C]" /> CI/CD Actions Cockpit
            </h1>
            <p className="text-xs text-[#A7ADB5] mt-1">Real-time status updates, environment deployments, and build pipeline telemetry.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualSync}
              className="p-2.5 rounded-xl border border-white/[0.06] bg-[#171A1D] hover:bg-[#23272B] text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <span className="text-[9px] bg-[#5BB98C]/15 text-[#5BB98C] px-2 py-0.5 rounded font-bold uppercase">Actions Connected</span>
          </div>
        </div>

        {/* Repository selector */}
        <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <Code className="h-5 w-5 text-[#A7ADB5]" />
            <div>
              <label className="text-[10px] font-extrabold text-[#7E848C] uppercase tracking-wider block">Repository Scope</label>
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
        </div>

        {/* Summary Widgets Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Build status */}
          <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 text-left flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block">Latest Build Status</span>
              <span className="text-xl font-extrabold text-white mt-1.5 block">{buildStatus}</span>
            </div>
            {buildStatus === 'Passing' ? (
              <CheckCircle2 className="h-8 w-8 text-[#5BB98C]" />
            ) : buildStatus === 'Failing' ? (
              <XCircle className="h-8 w-8 text-red-400" />
            ) : (
              <Clock className="h-8 w-8 text-[#7E848C]" />
            )}
          </div>

          {/* Active deployments */}
          <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 text-left flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block">Active Deployments</span>
              <span className="text-xl font-extrabold text-white mt-1.5 block">{deploymentsCount} Environments</span>
            </div>
            <Server className="h-8 w-8 text-blue-400" />
          </div>

          {/* Pipeline failures */}
          <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl p-5 text-left flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] font-bold text-[#7E848C] uppercase tracking-wider block">Build Failures Count</span>
              <span className="text-xl font-extrabold text-white mt-1.5 block">{failuresCount} Failed Runs</span>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>

        </div>

        {/* Main telemetry tables */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Recent workflow runs table */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider text-left">Recent Actions Build Logs</h3>
            
            {loadingRuns ? (
              <div className="flex h-48 items-center justify-center border border-white/[0.06] bg-[#171A1D] rounded-2xl">
                <Loader className="h-5 w-5 text-[#5BB98C] animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {runs.map((run) => (
                  <div key={run.id} className="p-4 border border-white/[0.06] bg-[#171A1D] rounded-2xl flex flex-wrap items-center justify-between gap-4 text-left shadow-md">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {run.conclusion === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-[#5BB98C]" />
                        ) : run.conclusion === 'failure' ? (
                          <XCircle className="h-4 w-4 text-red-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
                        )}
                        <span className="text-xs font-bold text-white">Run #{run.run_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#7E848C]">
                        <span>Event: {run.event}</span>
                        <span>•</span>
                        <span>Created: {new Date(run.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <a
                      href={run.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 border border-white/[0.08] hover:bg-[#1D2024] text-white text-[10px] font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      View Logs <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
                {runs.length === 0 && (
                  <div className="py-12 border border-dashed border-white/10 rounded-2xl text-[#7E848C] text-xs bg-[#171A1D]">
                    No recent builds registered.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar environments tracker */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider text-left">Pipeline Deployments</h3>
            
            {loadingDeployments ? (
              <div className="flex h-48 items-center justify-center border border-white/[0.06] bg-[#171A1D] rounded-2xl">
                <Loader className="h-5 w-5 text-[#5BB98C] animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {deployments.map((d) => (
                  <div key={d.id} className="p-4 border border-white/[0.06] bg-[#171A1D] rounded-2xl text-left space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white uppercase">{d.environment}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        d.status === 'success' ? 'bg-[#5BB98C]/15 text-[#5BB98C]' : 'bg-red-500/15 text-red-400'
                      }`}>{d.status}</span>
                    </div>

                    <div className="text-[10px] text-[#A7ADB5] leading-relaxed">
                      Auto-triggered from `main` branch. Deployments are secure and verified.
                    </div>
                  </div>
                ))}
                {deployments.length === 0 && (
                  <div className="py-12 border border-dashed border-white/10 rounded-2xl text-[#7E848C] text-xs bg-[#171A1D]">
                    No active environments linked.
                  </div>
                )}
              </div>
            )}

            {/* Future Ready Card */}
            <div className="p-4 border border-[#5BB98C]/20 bg-[#5BB98C]/5 rounded-2xl text-left space-y-2">
              <span className="text-[9px] bg-[#5BB98C]/15 text-[#5BB98C] px-2 py-0.5 rounded font-bold uppercase inline-block">Future Ready</span>
              <h4 className="text-xs font-extrabold text-white">External Runner Actions Ready</h4>
              <p className="text-[10px] text-[#A7ADB5] leading-relaxed">
                Connect external builders via the project webhooks endpoint. Simulates automated pushes and test runs.
              </p>
            </div>

          </div>

        </div>

      </div>
    </MainLayout>
  )
}
