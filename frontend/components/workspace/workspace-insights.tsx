'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Brain,
  AlertTriangle,
  TrendingDown,
  Users,
  Target,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Loader,
  RefreshCw,
  Zap,
  Activity,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { workspaceInsightsService, ComprehensiveInsights, ProjectRisk, BlockedTask, SlowProgressProject, MemberWorkload, SprintPrediction, CompletionForecast } from '@/services/workspace-insights'

interface WorkspaceInsightsProps {
  className?: string
}

export function WorkspaceInsights({ className = '' }: WorkspaceInsightsProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'risks' | 'blocked' | 'slow' | 'workload' | 'sprints' | 'forecasts'>('overview')
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Query comprehensive insights
  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ['workspace-insights'],
    queryFn: () => workspaceInsightsService.getAllInsights(),
    refetchInterval: 60000 // Refresh every minute
  })

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getPredictionColor = (prediction: string) => {
    switch (prediction) {
      case 'on_track': return 'text-green-400'
      case 'at_risk': return 'text-yellow-400'
      case 'behind_schedule': return 'text-red-400'
      case 'no_progress': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getWorkloadColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
            <Brain className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Workspace Insights</h2>
            <p className="text-xs text-[#7E848C]">AI-generated workspace analysis</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="px-3 py-2 border border-white/[0.08] hover:bg-[#1D2024] text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'overview', icon: BarChart3, label: 'Overview' },
          { id: 'risks', icon: AlertTriangle, label: 'Project Risks' },
          { id: 'blocked', icon: XCircle, label: 'Blocked Tasks' },
          { id: 'slow', icon: TrendingDown, label: 'Slow Progress' },
          { id: 'workload', icon: Users, label: 'Member Workload' },
          { id: 'sprints', icon: Target, label: 'Sprint Predictions' },
          { id: 'forecasts', icon: Calendar, label: 'Completion Forecasts' }
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id as any)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              activeSection === id 
                ? 'bg-[#5BB98C]/10 text-[#5BB98C] border border-[#5BB98C]/20' 
                : 'bg-[#171A1D] text-[#7E848C] border border-white/[0.06] hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-[#171A1D] border border-white/[0.06] rounded-xl p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-6 w-6 text-[#5BB98C] animate-spin" />
          </div>
        ) : !insights ? (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-[#7E848C] mx-auto mb-4" />
            <p className="text-sm text-[#7E848C]">No insights available</p>
          </div>
        ) : (
          <>
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#1D2024] rounded-lg p-4 border border-white/[0.04]">
                    <p className="text-[10px] text-[#7E848C] uppercase tracking-wider">Project Risks</p>
                    <p className="text-2xl font-bold text-red-400">{insights.project_risks.length}</p>
                  </div>
                  <div className="bg-[#1D2024] rounded-lg p-4 border border-white/[0.04]">
                    <p className="text-[10px] text-[#7E848C] uppercase tracking-wider">Blocked Tasks</p>
                    <p className="text-2xl font-bold text-yellow-400">{insights.blocked_tasks.length}</p>
                  </div>
                  <div className="bg-[#1D2024] rounded-lg p-4 border border-white/[0.04]">
                    <p className="text-[10px] text-[#7E848C] uppercase tracking-wider">Slow Projects</p>
                    <p className="text-2xl font-bold text-orange-400">{insights.slow_progress.length}</p>
                  </div>
                  <div className="bg-[#1D2024] rounded-lg p-4 border border-white/[0.04]">
                    <p className="text-[10px] text-[#7E848C] uppercase tracking-wider">Team Members</p>
                    <p className="text-2xl font-bold text-blue-400">{Object.keys(insights.member_workload).length}</p>
                  </div>
                </div>

                {/* Quick Insights */}
                <div className="space-y-3">
                  {insights.project_risks.slice(0, 3).map((risk, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${getSeverityColor(risk.severity)}`}>
                      <p className="text-xs font-bold capitalize">{risk.type}</p>
                      <p className="text-[10px] mt-1">{risk.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project Risks Section */}
            {activeSection === 'risks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Project Risks
                  </h3>
                  <span className="text-xs text-[#7E848C]">{insights.project_risks.length} risk(s)</span>
                </div>
                
                {insights.project_risks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-8 w-8 text-[#5BB98C] mx-auto mb-2" />
                    <p className="text-xs text-[#7E848C]">No project risks detected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {insights.project_risks.map((risk, i) => (
                      <div key={i} className={`p-4 rounded-lg border ${getSeverityColor(risk.severity)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold capitalize">{risk.type}</span>
                          <span className="text-[10px] uppercase font-bold">{risk.severity}</span>
                        </div>
                        <p className="text-xs mb-2">{risk.description}</p>
                        <p className="text-[10px] text-[#7E848C]">💡 {risk.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Blocked Tasks Section */}
            {activeSection === 'blocked' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Blocked Tasks
                  </h3>
                  <span className="text-xs text-[#7E848C]">{insights.blocked_tasks.length} blocked</span>
                </div>
                
                {insights.blocked_tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-8 w-8 text-[#5BB98C] mx-auto mb-2" />
                    <p className="text-xs text-[#7E848C]">No blocked tasks</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {insights.blocked_tasks.map((task, i) => (
                      <div key={i} className={`p-4 rounded-lg border ${getSeverityColor(task.severity)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold">{task.task_title}</span>
                          <span className="text-[10px] uppercase font-bold">{task.severity}</span>
                        </div>
                        <p className="text-xs text-[#7E848C]">{task.reason}</p>
                        <p className="text-[10px] text-[#7E848C] mt-1">Blocked since: {new Date(task.blocked_since).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Slow Progress Section */}
            {activeSection === 'slow' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Slow Progress Projects
                  </h3>
                  <span className="text-xs text-[#7E848C]">{insights.slow_progress.length} slow</span>
                </div>
                
                {insights.slow_progress.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-[#5BB98C] mx-auto mb-2" />
                    <p className="text-xs text-[#7E848C]">All projects progressing well</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {insights.slow_progress.map((project, i) => (
                      <div key={i} className={`p-4 rounded-lg border ${getSeverityColor(project.severity)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold">{project.project_name}</span>
                          <span className="text-[10px] uppercase font-bold">{project.severity}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div>
                            <p className="text-[10px] text-[#7E848C]">Velocity</p>
                            <p className="text-sm font-bold text-white">{project.current_velocity} tasks/week</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#7E848C]">Progress</p>
                            <p className="text-sm font-bold text-white">{project.completed_tasks}/{project.total_tasks}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-[#7E848C] mt-2">💡 {project.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Member Workload Section */}
            {activeSection === 'workload' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Member Workload
                  </h3>
                  <span className="text-xs text-[#7E848C]">{Object.keys(insights.member_workload).length} members</span>
                </div>
                
                <div className="space-y-3">
                  {Object.values(insights.member_workload).map((member, i) => (
                    <div key={i} className="p-4 bg-[#1D2024] rounded-lg border border-white/[0.04]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-[#7E848C]" />
                          <div>
                            <p className="text-xs font-bold text-white">{member.user_name}</p>
                            <p className="text-[10px] text-[#7E848C]">{member.user_email}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold ${getWorkloadColor(member.workload_level)}`}>
                          {member.workload_level} workload
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div>
                          <p className="text-[10px] text-[#7E848C]">Total</p>
                          <p className="text-sm font-bold text-white">{member.total_tasks}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#7E848C]">Completed</p>
                          <p className="text-sm font-bold text-green-400">{member.completed_tasks}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#7E848C]">In Progress</p>
                          <p className="text-sm font-bold text-[#5BB98C]">{member.in_progress_tasks}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#7E848C]">Rate</p>
                          <p className="text-sm font-bold text-white">{member.completion_rate.toFixed(0)}%</p>
                        </div>
                      </div>

                      {member.overdue_tasks > 0 && (
                        <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
                          <p className="text-[10px] text-red-400 font-bold">{member.overdue_tasks} overdue task(s)</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sprint Predictions Section */}
            {activeSection === 'sprints' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Sprint Predictions
                  </h3>
                  <span className="text-xs text-[#7E848C]">{insights.sprint_predictions.length} sprints</span>
                </div>
                
                <div className="space-y-3">
                  {insights.sprint_predictions.map((prediction, i) => (
                    <div key={i} className="p-4 bg-[#1D2024] rounded-lg border border-white/[0.04]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-white">{prediction.sprint_name}</span>
                        <span className={`text-xs font-bold ${getPredictionColor(prediction.prediction)}`}>
                          {prediction.prediction.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div>
                          <p className="text-[10px] text-[#7E848C]">Progress</p>
                          <p className="text-sm font-bold text-white">{prediction.completion_rate}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#7E848C]">Velocity</p>
                          <p className="text-sm font-bold text-white">{prediction.velocity} pts/day</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#7E848C]">Days Left</p>
                          <p className="text-sm font-bold text-white">{prediction.days_remaining}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#7E848C]">Confidence</p>
                          <p className="text-sm font-bold text-white">{(prediction.confidence * 100).toFixed(0)}%</p>
                        </div>
                      </div>

                      {prediction.estimated_completion_date && (
                        <p className="text-[10px] text-[#7E848C] mb-2">
                          Est. completion: {new Date(prediction.estimated_completion_date).toLocaleDateString()}
                        </p>
                      )}

                      {prediction.recommendations.length > 0 && (
                        <div className="space-y-1">
                          {prediction.recommendations.map((rec, j) => (
                            <p key={j} className="text-[10px] text-[#7E848C]">💡 {rec}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion Forecasts Section */}
            {activeSection === 'forecasts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Completion Forecasts
                  </h3>
                  <span className="text-xs text-[#7E848C]">{Object.keys(insights.completion_forecasts).length} projects</span>
                </div>
                
                <div className="space-y-3">
                  {Object.values(insights.completion_forecasts).map((forecast, i) => (
                    <div key={i} className="p-4 bg-[#1D2024] rounded-lg border border-white/[0.04]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-white">{forecast.project_name}</span>
                        <span className={`text-xs font-bold ${forecast.is_on_track ? 'text-green-400' : forecast.is_on_track === false ? 'text-red-400' : 'text-gray-400'}`}>
                          {forecast.is_on_track === true ? 'On Track' : forecast.is_on_track === false ? 'Behind' : 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div>
                          <p className="text-[10px] text-[#7E848C]">Progress</p>
                          <p className="text-sm font-bold text-white">{forecast.current_progress}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#7E848C]">Velocity</p>
                          <p className="text-sm font-bold text-white">{forecast.velocity} pts/week</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#7E848C]">Remaining</p>
                          <p className="text-sm font-bold text-white">{forecast.remaining_points} pts</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#7E848C]">Confidence</p>
                          <p className="text-sm font-bold text-white">{(forecast.confidence * 100).toFixed(0)}%</p>
                        </div>
                      </div>

                      {forecast.estimated_completion_date && (
                        <p className="text-[10px] text-[#7E848C]">
                          Est. completion: {new Date(forecast.estimated_completion_date).toLocaleDateString()}
                        </p>
                      )}

                      {forecast.days_ahead_or_behind !== null && (
                        <p className={`text-[10px] ${forecast.days_ahead_or_behind >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {forecast.days_ahead_or_behind >= 0 ? '+' : ''}{forecast.days_ahead_or_behind} days
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
