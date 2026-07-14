'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Brain,
  Zap,
  Target,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Loader,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Sparkles,
  ChevronRight,
  ChevronDown,
  RefreshCw
} from 'lucide-react'
import { aiSprintPlannerService, BacklogAnalysis, SprintPlan, Risk, StoryPointEstimation, PrioritySuggestion } from '@/services/ai-sprint-planner'
import { taskService } from '@/services/task'

interface AISprintPlannerProps {
  projectId: string
  sprintId?: string
}

export function AISprintPlanner({ projectId, sprintId }: AISprintPlannerProps) {
  const queryClient = useQueryClient()
  const [activeFeature, setActiveFeature] = useState<'analyze' | 'generate' | 'estimate' | 'priority' | 'risks' | 'goal' | 'history'>('analyze')
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [sprintCapacity, setSprintCapacity] = useState(8)
  const [showConversationHistory, setShowConversationHistory] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  // Get project tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => taskService.getTasks(projectId),
    enabled: !!projectId
  })

  // Backlog Analysis
  const { data: backlogAnalysis, isLoading: analyzingBacklog, refetch: analyzeBacklog } = useQuery({
    queryKey: ['backlog-analysis', projectId],
    queryFn: () => aiSprintPlannerService.analyzeBacklog(projectId, sprintId),
    enabled: activeFeature === 'analyze'
  })

  // Sprint Generation
  const { data: sprintPlan, isLoading: generatingSprint, refetch: generateSprint } = useQuery({
    queryKey: ['sprint-plan', projectId, sprintCapacity],
    queryFn: () => aiSprintPlannerService.generateSprint(projectId, sprintCapacity),
    enabled: false
  })

  const generateSprintMutation = useMutation({
    mutationFn: () => aiSprintPlannerService.generateSprint(projectId, sprintCapacity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint-plan'] })
    }
  })

  // Story Point Estimation
  const { data: storyPointEstimation, isLoading: estimatingPoints, refetch: estimatePoints } = useQuery({
    queryKey: ['story-points', selectedTaskId],
    queryFn: () => aiSprintPlannerService.estimateStoryPoints(selectedTaskId),
    enabled: !!selectedTaskId && activeFeature === 'estimate'
  })

  // Priority Suggestion
  const { data: prioritySuggestion, isLoading: suggestingPriority, refetch: suggestPriority } = useQuery({
    queryKey: ['priority-suggestion', selectedTaskId],
    queryFn: () => aiSprintPlannerService.suggestPriority(selectedTaskId),
    enabled: !!selectedTaskId && activeFeature === 'priority'
  })

  // Risk Identification
  const { data: riskAnalysis, isLoading: identifyingRisks, refetch: identifyRisks } = useQuery({
    queryKey: ['risk-analysis', selectedTaskIds],
    queryFn: () => aiSprintPlannerService.identifyRisks(selectedTaskIds),
    enabled: selectedTaskIds.length > 0 && activeFeature === 'risks'
  })

  // Conversation History
  const { data: conversations = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => aiSprintPlannerService.getConversations(),
    enabled: activeFeature === 'history'
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleGenerateSprint = () => {
    generateSprintMutation.mutate()
  }

  const handleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl">
            <Brain className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Sprint Planner</h2>
            <p className="text-xs text-[#7E848C]">Intelligent sprint planning assistance</p>
          </div>
        </div>
        <button
          onClick={() => setShowConversationHistory(!showConversationHistory)}
          className="px-3 py-2 border border-white/[0.08] hover:bg-[#1D2024] text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          {showConversationHistory ? 'Hide History' : 'Conversation History'}
        </button>
      </div>

      {/* Feature Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'analyze', icon: BarChart3, label: 'Analyze Backlog' },
          { id: 'generate', icon: Sparkles, label: 'Generate Sprint' },
          { id: 'estimate', icon: Target, label: 'Estimate Points' },
          { id: 'priority', icon: TrendingUp, label: 'Suggest Priority' },
          { id: 'risks', icon: AlertTriangle, label: 'Identify Risks' },
          { id: 'goal', icon: Zap, label: 'Generate Goal' }
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveFeature(id as any)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              activeFeature === id 
                ? 'bg-[#5BB98C]/10 text-[#5BB98C] border border-[#5BB98C]/20' 
                : 'bg-[#171A1D] text-[#7E848C] border border-white/[0.06] hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Conversation History Panel */}
      {showConversationHistory && (
        <div className="bg-[#171A1D] border border-white/[0.06] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversation History
            </h3>
            {loadingHistory && <Loader className="h-4 w-4 text-[#5BB98C] animate-spin" />}
          </div>
          {conversations.length === 0 ? (
            <p className="text-xs text-[#7E848C] text-center py-4">No conversation history yet</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {conversations.map((conv) => (
                <div key={conv.id} className="p-3 bg-[#1D2024] rounded-lg border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{conv.conversation_type}</span>
                    <span className="text-[10px] text-[#7E848C]">{new Date(conv.created_at).toLocaleDateString()}</span>
                  </div>
                  {conv.summary && <p className="text-[10px] text-[#7E848C]">{conv.summary}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feature Content */}
      <div className="bg-[#171A1D] border border-white/[0.06] rounded-xl p-6">
        {/* Analyze Backlog */}
        {activeFeature === 'analyze' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Backlog Analysis
              </h3>
              <button
                onClick={() => analyzeBacklog()}
                className="px-3 py-1.5 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Analyze
              </button>
            </div>

            {analyzingBacklog ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 text-[#5BB98C] animate-spin" />
              </div>
            ) : backlogAnalysis ? (
              <div className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#1D2024] rounded-lg p-4 border border-white/[0.04]">
                    <p className="text-[10px] text-[#7E848C] uppercase tracking-wider">Total Tasks</p>
                    <p className="text-2xl font-bold text-white">{backlogAnalysis.total_tasks}</p>
                  </div>
                  <div className="bg-[#1D2024] rounded-lg p-4 border border-white/[0.04]">
                    <p className="text-[10px] text-[#7E848C] uppercase tracking-wider">Completed</p>
                    <p className="text-2xl font-bold text-green-400">{backlogAnalysis.completed_tasks}</p>
                  </div>
                  <div className="bg-[#1D2024] rounded-lg p-4 border border-white/[0.04]">
                    <p className="text-[10px] text-[#7E848C] uppercase tracking-wider">Pending</p>
                    <p className="text-2xl font-bold text-[#5BB98C]">{backlogAnalysis.pending_tasks}</p>
                  </div>
                  <div className="bg-[#1D2024] rounded-lg p-4 border border-white/[0.04]">
                    <p className="text-[10px] text-[#7E848C] uppercase tracking-wider">Completion Rate</p>
                    <p className="text-2xl font-bold text-purple-400">{backlogAnalysis.completion_rate.toFixed(0)}%</p>
                  </div>
                </div>

                {/* Priority Distribution */}
                <div className="bg-[#1D2024] rounded-lg p-4 border border-white/[0.04]">
                  <h4 className="text-xs font-bold text-white mb-3">Priority Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(backlogAnalysis.priority_distribution).map(([priority, count]) => (
                      <div key={priority} className="flex items-center justify-between">
                        <span className="text-xs text-[#7E848C]">{priority}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-[#111315] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#5BB98C]" 
                              style={{ width: `${(count / backlogAnalysis.total_tasks) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-white font-bold">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-[#1D2024] rounded-lg p-4 border border-white/[0.04]">
                  <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    AI Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {backlogAnalysis.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-[#7E848C] flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-[#5BB98C] mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-[#7E848C]">Click "Analyze" to get backlog insights</p>
              </div>
            )}
          </div>
        )}

        {/* Generate Sprint */}
        {activeFeature === 'generate' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Sprint Plan
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-xs text-[#7E848C]">Sprint Capacity (tasks):</label>
              <input
                type="number"
                min="1"
                max="20"
                value={sprintCapacity}
                onChange={(e) => setSprintCapacity(parseInt(e.target.value) || 8)}
                className="w-20 bg-[#111315] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5BB98C]"
              />
              <button
                onClick={handleGenerateSprint}
                disabled={generatingSprint}
                className="px-4 py-2 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                {generatingSprint ? <Loader className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Generate Sprint
              </button>
            </div>

            {sprintPlan && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-500/20">
                  <h4 className="text-xs font-bold text-white mb-2">Sprint Goal</h4>
                  <p className="text-sm text-[#7E848C]">{sprintPlan.sprint_goal}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#1D2024] rounded-lg p-3 border border-white/[0.04]">
                    <p className="text-[10px] text-[#7E848C]">Total Story Points</p>
                    <p className="text-xl font-bold text-white">{sprintPlan.total_story_points}</p>
                  </div>
                  <div className="bg-[#1D2024] rounded-lg p-3 border border-white/[0.04]">
                    <p className="text-[10px] text-[#7E848C]">Tasks Selected</p>
                    <p className="text-xl font-bold text-white">{sprintPlan.tasks.length}</p>
                  </div>
                  <div className="bg-[#1D2024] rounded-lg p-3 border border-white/[0.04]">
                    <p className="text-[10px] text-[#7E848C]">Duration</p>
                    <p className="text-xl font-bold text-white">{sprintPlan.estimated_duration} weeks</p>
                  </div>
                </div>

                {sprintPlan.risks.length > 0 && (
                  <div className="bg-[#1D2024] rounded-lg p-4 border border-white/[0.04]">
                    <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      Identified Risks
                    </h4>
                    <div className="space-y-2">
                      {sprintPlan.risks.map((risk, i) => (
                        <div key={i} className={`p-3 rounded-lg border ${getSeverityColor(risk.severity)}`}>
                          <p className="text-xs font-bold capitalize">{risk.type}</p>
                          <p className="text-[10px] mt-1">{risk.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Estimate Story Points */}
        {activeFeature === 'estimate' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="h-4 w-4" />
              Estimate Story Points
            </h3>

            <div className="space-y-3">
              <label className="text-xs text-[#7E848C]">Select Task:</label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full bg-[#111315] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5BB98C]"
              >
                <option value="">Select a task...</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </div>

            {estimatingPoints ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="h-6 w-6 text-[#5BB98C] animate-spin" />
              </div>
            ) : storyPointEstimation && (
              <div className="bg-[#1D2024] rounded-lg p-4 border border-white/[0.04] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#7E848C]">Current Points:</span>
                  <span className="text-lg font-bold text-white">{storyPointEstimation.current_story_points || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#7E848C]">AI Estimated:</span>
                  <span className="text-lg font-bold text-[#5BB98C]">{storyPointEstimation.estimated_story_points}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Suggest Priority */}
        {activeFeature === 'priority' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Suggest Task Priority
            </h3>

            <div className="space-y-3">
              <label className="text-xs text-[#7E848C]">Select Task:</label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full bg-[#111315] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5BB98C]"
              >
                <option value="">Select a task...</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </div>

            {suggestingPriority ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="h-6 w-6 text-[#5BB98C] animate-spin" />
              </div>
            ) : prioritySuggestion && (
              <div className="bg-[#1D2024] rounded-lg p-4 border border-white/[0.04] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#7E848C]">Current Priority:</span>
                  <span className="text-lg font-bold text-white">{prioritySuggestion.current_priority}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#7E848C]">AI Suggested:</span>
                  <span className={`text-lg font-bold ${
                    prioritySuggestion.suggested_priority === 'High' ? 'text-red-400' :
                    prioritySuggestion.suggested_priority === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {prioritySuggestion.suggested_priority}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Identify Risks */}
        {activeFeature === 'risks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Identify Risks
              </h3>
              <button
                onClick={() => identifyRisks()}
                className="px-3 py-1.5 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Analyze
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-[#7E848C]">Select Tasks:</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tasks.map((task) => (
                  <label key={task.id} className="flex items-center gap-2 p-2 bg-[#1D2024] rounded-lg cursor-pointer hover:bg-white/[0.05]">
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.includes(task.id)}
                      onChange={() => handleTaskSelection(task.id)}
                      className="rounded border-white/[0.2]"
                    />
                    <span className="text-xs text-white">{task.title}</span>
                  </label>
                ))}
              </div>
            </div>

            {identifyingRisks ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="h-6 w-6 text-[#5BB98C] animate-spin" />
              </div>
            ) : riskAnalysis && riskAnalysis.risks.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-[#7E848C]">{riskAnalysis.total_risks} risk(s) identified</p>
                {riskAnalysis.risks.map((risk, i) => (
                  <div key={i} className={`p-4 rounded-lg border ${getSeverityColor(risk.severity)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold capitalize">{risk.type}</span>
                      <span className="text-[10px] uppercase font-bold">{risk.severity}</span>
                    </div>
                    <p className="text-xs">{risk.description}</p>
                  </div>
                ))}
              </div>
            ) : riskAnalysis && riskAnalysis.risks.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-[#5BB98C] mx-auto mb-2" />
                <p className="text-xs text-[#7E848C]">No risks identified</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Generate Goal */}
        {activeFeature === 'goal' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Generate Sprint Goal
            </h3>

            <div className="space-y-3">
              <label className="text-xs text-[#7E848C]">Select Tasks for Sprint:</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tasks.map((task) => (
                  <label key={task.id} className="flex items-center gap-2 p-2 bg-[#1D2024] rounded-lg cursor-pointer hover:bg-white/[0.05]">
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.includes(task.id)}
                      onChange={() => handleTaskSelection(task.id)}
                      className="rounded border-white/[0.2]"
                    />
                    <span className="text-xs text-white">{task.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => aiSprintPlannerService.generateSprintGoal(selectedTaskIds).then(goal => {
                alert(`Generated Sprint Goal: ${goal.sprint_goal}`)
              })}
              disabled={selectedTaskIds.length === 0}
              className="w-full py-2 bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Generate Goal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
