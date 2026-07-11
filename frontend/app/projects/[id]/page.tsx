'use client'

import React, { useState, useEffect, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, Calendar, User as UserIcon, Trash2, Edit3, 
  Clock, AlertCircle, X, Layers, CheckSquare, 
  Sparkles, FileText, Archive, ArchiveRestore, Star, Pin, Plus, Tag, Filter, Edit, Move, Check,
  Link2, Network, GitFork, Lock, PlusCircle, AlertOctagon
} from 'lucide-react'
import { projectService } from '@/services/project'
import { taskService, TaskResponse } from '@/services/task'
import { teamService } from '@/services/team'
import { labelService } from '@/services/label'
import { LabelsManager } from '@/components/labels/labels-manager'
import { AdvancedFiltersPanel, FilterCriteria } from '@/components/filters/advanced-filters-panel'
import { TimerWidget } from '@/components/time-logs/timer-widget'
import { TimeLogsManager } from '@/components/time-logs/time-logs-manager'
import { useAuth } from '@/hooks/useAuth'
import { CommentsList } from '@/components/comments/comments-list'
import { useCollaboration } from '@/hooks/use-collaboration'

import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface PageProps {
  params: Promise<{ id: string }>
}

const colors = ['blue', 'green', 'yellow', 'purple', 'red', 'indigo', 'pink', 'orange', 'teal']
const icons = ['🚀', '🎨', '💻', '🔒', '📊', '⚡', '🤖', '🌍', '🛠️']

// Color mapping matching color theme values
const colorClasses: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  blue: { bg: 'bg-[#5BB98C]/10', text: 'text-[#5BB98C]', border: 'border-[#5BB98C]/20', dot: 'bg-[#5BB98C]' },
  green: { bg: 'bg-[#5BB98C]/10', text: 'text-[#5BB98C]', border: 'border-[#5BB98C]/20', dot: 'bg-[#5BB98C]' },
  yellow: { bg: 'bg-[#F2C94C]/10', text: 'text-[#F2C94C]', border: 'border-[#F2C94C]/20', dot: 'bg-[#F2C94C]' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-500' },
  red: { bg: 'bg-[#EB5757]/10', text: 'text-[#EB5757]', border: 'border-[#EB5757]/20', dot: 'bg-[#EB5757]' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', dot: 'bg-indigo-500' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20', dot: 'bg-pink-500' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-500' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', dot: 'bg-teal-500' },
}

export default function ProjectDetailsPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { sendKanbanUpdate } = useCollaboration(id)
  
  // Fetch project details
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProjectById(id),
    retry: 1,
  })

  // Advanced Filter state variables
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    statuses: [],
    priorities: [],
    dueDate: '',
    sprintId: '',
    labelIds: [],
    assigneeId: '',
    createdStart: '',
    createdEnd: '',
    updatedStart: '',
    updatedEnd: ''
  })
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)

  // Map state to query string criteria params
  const apiFilters = {
    ...(filterCriteria.statuses.length > 0 ? { status: filterCriteria.statuses.join(',') } : {}),
    ...(filterCriteria.priorities.length > 0 ? { priority: filterCriteria.priorities.join(',') } : {}),
    ...(filterCriteria.dueDate ? { due_date: filterCriteria.dueDate } : {}),
    ...(filterCriteria.sprintId ? { sprint_id: filterCriteria.sprintId } : {}),
    ...(filterCriteria.labelIds.length > 0 ? { label_ids: filterCriteria.labelIds.join(',') } : {}),
    ...(filterCriteria.assigneeId ? { assignee_id: filterCriteria.assigneeId } : {}),
    ...(filterCriteria.createdStart ? { created_at_start: new Date(filterCriteria.createdStart).toISOString() } : {}),
    ...(filterCriteria.createdEnd ? { created_at_end: new Date(filterCriteria.createdEnd + 'T23:59:59').toISOString() } : {}),
    ...(filterCriteria.updatedStart ? { updated_at_start: new Date(filterCriteria.updatedStart).toISOString() } : {}),
    ...(filterCriteria.updatedEnd ? { updated_at_end: new Date(filterCriteria.updatedEnd + 'T23:59:59').toISOString() } : {})
  }

  // Fetch tasks associated with this project
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', { project_id: id, ...apiFilters }],
    queryFn: () => taskService.getTasks(id, apiFilters),
  })

  // Editing modal fields
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isTaskCreateOpen, setIsTaskCreateOpen] = useState(false)
  
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor] = useState('blue')
  const [editIcon, setEditIcon] = useState('🚀')
  const [editStatus, setEditStatus] = useState('In Progress')
  const [editPriority, setEditPriority] = useState('Medium')
  const [editProgress, setEditProgress] = useState(0)
  const [editVisibility, setEditVisibility] = useState('Workspace')
  const [editCoverImage, setEditCoverImage] = useState('')

  // Fetch workspace members
  const { data: allWorkspaceMembers = [] } = useQuery({
    queryKey: ['workspace-members'],
    queryFn: teamService.getWorkspaceMembers
  })

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [filterLabelId, setFilterLabelId] = useState('')
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false)

  // Load project-scoped labels
  const { data: allLabels = [] } = useQuery({
    queryKey: ['labels', id],
    queryFn: () => labelService.getLabels(id)
  })

  // Task creation fields
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskStatus, setTaskStatus] = useState('Todo')
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [taskPriority, setTaskPriority] = useState('Medium')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskAssigneeId, setTaskAssigneeId] = useState('')

  // Kanban Board States
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [activeTask, setActiveTask] = useState<TaskResponse | null>(null)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [newColTitle, setNewColTitle] = useState('')
  const [editingColId, setEditingColId] = useState<string | null>(null)
  const [renameTitle, setRenameTitle] = useState('')

  // Task editing fields
  const [editTargetTask, setEditTargetTask] = useState<TaskResponse | null>(null)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDesc, setEditTaskDesc] = useState('')
  const [editTaskStatus, setEditTaskStatus] = useState('Todo')
  const [editLabelIds, setEditLabelIds] = useState<string[]>([])
  const [editTaskPriority, setEditTaskPriority] = useState('Medium')
  const [editTaskDueDate, setEditTaskDueDate] = useState('')
  const [editTaskAssigneeId, setEditTaskAssigneeId] = useState('')

  // Extended fields for creation
  const [taskStoryPoints, setTaskStoryPoints] = useState<number | ''>('')
  const [taskEstimatedTime, setTaskEstimatedTime] = useState<number | ''>('')

  // Extended fields for editing
  const [editStoryPoints, setEditStoryPoints] = useState<number | ''>('')
  const [editEstimatedTime, setEditEstimatedTime] = useState<number | ''>('')
  const [editAttachments, setEditAttachments] = useState<{ name: string; url: string }[]>([])
  const [newAttachmentName, setNewAttachmentName] = useState('')
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('')
  
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Dependency & Subtask state fields
  const [editParentTaskId, setEditParentTaskId] = useState('')
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [newDepTargetId, setNewDepTargetId] = useState('')
  const [newDepType, setNewDepType] = useState('blocked_by')

  // Sync edit form parameters once query resolves
  useEffect(() => {
    if (project) {
      setEditName(project.name)
      setEditDescription(project.description || '')
      setEditColor(project.color || 'blue')
      setEditIcon(project.icon || '🚀')
      setEditStatus(project.status)
      setEditPriority(project.priority)
      setEditProgress(project.progress)
      setEditVisibility(project.visibility)
      setEditCoverImage(project.cover_image || '')
    }
  }, [project])

  useEffect(() => {
    if (editTargetTask) {
      setEditTaskTitle(editTargetTask.title)
      setEditTaskDesc(editTargetTask.description || '')
      setEditTaskStatus(editTargetTask.status)
      setEditTaskPriority(editTargetTask.priority)
      setEditTaskDueDate(editTargetTask.due_date || '')
      setEditTaskAssigneeId(editTargetTask.assignee_id || '')
      setEditLabelIds((editTargetTask.labels || []).map(l => l.id))
      setEditStoryPoints(editTargetTask.story_points ?? '')
      setEditEstimatedTime(editTargetTask.estimated_time ?? '')
      setEditAttachments(editTargetTask.attachments || [])
      setEditParentTaskId(editTargetTask.parent_id || '')
    }
  }, [editTargetTask])

  // Subtask & Dependency Query Hooks
  const { data: projectDependencies = [], refetch: refetchProjectDeps } = useQuery({
    queryKey: ['project-dependencies', id],
    queryFn: () => taskService.getProjectDependencies(id),
    enabled: !!id
  })

  const { data: subtasksList = [], refetch: refetchSubtasks } = useQuery({
    queryKey: ['subtasks', editTargetTask?.id],
    queryFn: () => taskService.getSubtasks(editTargetTask!.id),
    enabled: !!editTargetTask?.id
  })

  const { data: dependenciesList = [], refetch: refetchDeps } = useQuery({
    queryKey: ['dependencies', editTargetTask?.id],
    queryFn: () => taskService.getDependencies(editTargetTask!.id),
    enabled: !!editTargetTask?.id
  })

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTargetTask || !newSubtaskTitle.trim()) return
    try {
      await taskService.createTask({
        title: newSubtaskTitle,
        project_id: id,
        parent_id: editTargetTask.id
      })
      setNewSubtaskTitle('')
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: id }] })
      refetchSubtasks()
    } catch (err) {
      alert('Failed to add subtask.')
    }
  }

  const handleAddDependency = async () => {
    if (!editTargetTask || !newDepTargetId) return
    try {
      await taskService.addDependency(editTargetTask.id, newDepTargetId, newDepType)
      setNewDepTargetId('')
      refetchDeps()
      refetchProjectDeps()
    } catch (err) {
      alert('Failed to add dependency link.')
    }
  }

  const handleRemoveDependency = async (depId: string) => {
    if (!editTargetTask) return
    try {
      await taskService.removeDependency(editTargetTask.id, depId)
      refetchDeps()
      refetchProjectDeps()
    } catch (err) {
      alert('Failed to remove dependency link.')
    }
  }

  const handleSaveTaskEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTargetTask || !editTaskTitle.trim()) return
    setSaveLoading(true)
    try {
      await taskService.updateTask(editTargetTask.id, {
        title: editTaskTitle,
        description: editTaskDesc || null,
        status: editTaskStatus,
        priority: editTaskPriority,
        due_date: editTaskDueDate || null,
        assignee_id: editTaskAssigneeId || null,
        parent_id: editParentTaskId || null,
        story_points: editStoryPoints === '' ? null : Number(editStoryPoints),
        estimated_time: editEstimatedTime === '' ? null : Number(editEstimatedTime),
        attachments: editAttachments,
        completed: editTaskStatus === 'Done'
      } as any)
      await labelService.assignLabelsToTask(editTargetTask.id, editLabelIds)
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: id }] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      setEditTargetTask(null)
    } catch (err) {
      alert('Failed to update task settings.')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return

    setSaveLoading(true)
    setSaveError(null)
    try {
      await projectService.updateProject(id, {
        name: editName,
        description: editDescription || null,
        color: editColor,
        icon: editIcon,
        status: editStatus,
        priority: editPriority,
        progress: Number(editProgress),
        visibility: editVisibility,
        cover_image: editCoverImage || null,
      } as any)
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setIsEditOpen(false)
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to update project settings.'
      setSaveError(errMsg)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleArchiveToggle = async () => {
    setSaveLoading(true)
    try {
      if (project?.is_archived) {
        await projectService.restoreProject(id)
      } else {
        await projectService.archiveProject(id)
      }
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err: any) {
      alert('Failed to archive project.')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleFavoriteToggle = async () => {
    try {
      await projectService.favoriteProject(id)
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    } catch (err) {
      console.error('Failed to toggle favorite', err)
    }
  }

  const handlePinToggle = async () => {
    try {
      await projectService.pinProject(id)
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    } catch (err) {
      console.error('Failed to toggle pin', err)
    }
  }

  const handleDelete = async () => {
    setSaveLoading(true)
    try {
      await projectService.deleteProject(id)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setIsDeleteOpen(false)
      router.push('/')
    } catch (err: any) {
      alert('Delete operation failed.')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return
    setSaveLoading(true)
    try {
      const newTask = await taskService.createTask({
        title: taskTitle,
        description: taskDesc || undefined,
        status: taskStatus,
        priority: taskPriority,
        due_date: taskDueDate || undefined,
        assignee_id: taskAssigneeId || undefined,
        project_id: id,
        story_points: taskStoryPoints === '' ? undefined : Number(taskStoryPoints),
        estimated_time: taskEstimatedTime === '' ? undefined : Number(taskEstimatedTime),
        completed: taskStatus === 'Done'
      })
      if (selectedLabelIds.length > 0) {
        await labelService.assignLabelsToTask(newTask.id, selectedLabelIds)
      }
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: id }] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      setIsTaskCreateOpen(false)
      setTaskTitle('')
      setTaskDesc('')
      setSelectedLabelIds([])
      setTaskStatus('Todo')
      setTaskPriority('Medium')
      setTaskDueDate('')
      setTaskAssigneeId('')
      setTaskStoryPoints('')
      setTaskEstimatedTime('')
    } catch (err) {
      alert('Failed to create task.')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDuplicateTask = async (taskId: string) => {
    try {
      await taskService.duplicateTask(taskId)
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: id }] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      setEditTargetTask(null)
    } catch {
      alert('Failed to duplicate task.')
    }
  }

  const handleArchiveTask = async (taskId: string) => {
    try {
      await taskService.archiveTask(taskId)
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: id }] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      setEditTargetTask(null)
    } catch {
      alert('Failed to archive task.')
    }
  }

  const handleRestoreTask = async (taskId: string) => {
    try {
      await taskService.restoreTask(taskId)
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: id }] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      setEditTargetTask(null)
    } catch {
      alert('Failed to restore task.')
    }
  }

  const handleDeleteTaskDirect = async (taskId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this task?')
    if (!confirmDelete) return
    try {
      await taskService.deleteTask(taskId)
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: id }] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      setEditTargetTask(null)
    } catch {
      alert('Failed to delete task.')
    }
  }

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      await taskService.toggleTaskComplete(taskId, !currentCompleted)
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: id }] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      console.error('Failed to toggle task', err)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId)
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: id }] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
    } catch (err) {
      console.error('Failed to delete task', err)
    }
  }

  const getSyncedColumns = () => {
    const rawCols = project?.kanban_columns || [
      { id: 'Todo', title: 'To Do', taskIds: [] },
      { id: 'In Progress', title: 'In Progress', taskIds: [] },
      { id: 'Review', title: 'Review', taskIds: [] },
      { id: 'Done', title: 'Done', taskIds: [] }
    ]

    const filteredTasks = tasks.filter(t => !filterLabelId || t.labels.some(l => l.id === filterLabelId))
    const activeTaskIds = new Set(filteredTasks.map(t => t.id))
    const allocatedTaskIds = new Set<string>()

    const syncedCols = rawCols.map(col => {
      const validTaskIds = col.taskIds.filter(tid => activeTaskIds.has(tid))
      validTaskIds.forEach(tid => allocatedTaskIds.add(tid))
      return { ...col, taskIds: validTaskIds }
    })

    if (syncedCols.length > 0) {
      filteredTasks.forEach(t => {
        if (!allocatedTaskIds.has(t.id)) {
          const matchedCol = syncedCols.find(col => col.id === t.status) || syncedCols[0]
          matchedCol.taskIds.push(t.id)
        }
      })
    }

    return syncedCols
  }

  const handleBulkMove = async (targetColId: string) => {
    if (selectedTaskIds.length === 0) return
    try {
      await Promise.all(
        selectedTaskIds.map(tid => taskService.updateTask(tid, { status: targetColId, completed: targetColId === 'Done' }))
      )
      const currentCols = getSyncedColumns()
      const updated = currentCols.map(col => {
        const filtered = col.taskIds.filter(tid => !selectedTaskIds.includes(tid))
        if (col.id === targetColId) {
          return { ...col, taskIds: [...filtered, ...selectedTaskIds] }
        }
        return { ...col, taskIds: filtered }
      })

      await projectService.updateProject(id, { kanban_columns: updated })
      setSelectedTaskIds([])
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: id }] })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      alert('Failed to perform bulk move operation.')
    }
  }

  const handleAddColumn = async (title: string) => {
    if (!title.trim()) return
    const newColId = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4)
    const currentCols = getSyncedColumns()
    const updated = [...currentCols, { id: newColId, title, taskIds: [] }]
    await projectService.updateProject(id, { kanban_columns: updated })
    queryClient.invalidateQueries({ queryKey: ['project', id] })
  }

  const handleRenameColumn = async (colId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    const currentCols = getSyncedColumns()
    const updated = currentCols.map(col => col.id === colId ? { ...col, title: newTitle } : col)
    await projectService.updateProject(id, { kanban_columns: updated })
    queryClient.invalidateQueries({ queryKey: ['project', id] })
  }

  const handleDeleteColumn = async (colId: string) => {
    const currentCols = getSyncedColumns()
    if (currentCols.length <= 1) {
      alert('You must keep at least one column on the Kanban board.')
      return
    }
    const targetCol = currentCols.find(col => col.id === colId)
    const remainingCols = currentCols.filter(col => col.id !== colId)
    
    if (targetCol && targetCol.taskIds.length > 0) {
      const fallbackColId = remainingCols[0].id
      await Promise.all(
        targetCol.taskIds.map(tid => taskService.updateTask(tid, { status: fallbackColId }))
      )
      remainingCols[0].taskIds = [...remainingCols[0].taskIds, ...targetCol.taskIds]
    }

    await projectService.updateProject(id, { kanban_columns: remainingCols })
    queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: id }] })
    queryClient.invalidateQueries({ queryKey: ['project', id] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeId = active.id as string
    const matchedTask = tasks.find(t => t.id === activeId)
    if (matchedTask) {
      setActiveTask(matchedTask)
    } else {
      setActiveColumnId(activeId)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setActiveColumnId(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const currentCols = getSyncedColumns()

    const activeColIdx = currentCols.findIndex(c => c.id === activeId)
    const overColIdx = currentCols.findIndex(c => c.id === overId)
    if (activeColIdx !== -1 && overColIdx !== -1) {
      if (activeColIdx !== overColIdx) {
        const updated = arrayMove(currentCols, activeColIdx, overColIdx)
        await projectService.updateProject(id, { kanban_columns: updated })
        queryClient.invalidateQueries({ queryKey: ['project', id] })
      }
      return
    }

    let sourceCol = currentCols.find(col => col.taskIds.includes(activeId))
    let destCol = currentCols.find(col => col.id === overId || col.taskIds.includes(overId))

    if (!sourceCol || !destCol) return

    if (sourceCol.id === destCol.id) {
      const activeIdx = sourceCol.taskIds.indexOf(activeId)
      const overIdx = sourceCol.taskIds.indexOf(overId)
      if (activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx) {
        sourceCol.taskIds = arrayMove(sourceCol.taskIds, activeIdx, overIdx)
        await projectService.updateProject(id, { kanban_columns: currentCols })
        queryClient.invalidateQueries({ queryKey: ['project', id] })
      }
    } else {
      sourceCol.taskIds = sourceCol.taskIds.filter(tid => tid !== activeId)
      const overIdx = destCol.taskIds.indexOf(overId)
      if (overIdx !== -1) {
        destCol.taskIds.splice(overIdx, 0, activeId)
      } else {
        destCol.taskIds.push(activeId)
      }

      await taskService.updateTask(activeId, { status: destCol.id, completed: destCol.id === 'Done' })
      sendKanbanUpdate(activeId, destCol.id)
      await projectService.updateProject(id, { kanban_columns: currentCols })
      
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: id }] })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  }

  const handleAssignProjectMember = async (userId: string) => {
    try {
      await teamService.assignProjectMember(id, userId)
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      setIsAddMemberOpen(false)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to assign project member.')
    }
  }

  const handleRemoveProjectMember = async (userId: string) => {
    try {
      await teamService.removeProjectMember(id, userId)
      queryClient.invalidateQueries({ queryKey: ['project', id] })
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove project member.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111315] text-[#F5F5F5] p-8 flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 border-4 border-[#5BB98C]/20 border-t-[#5BB98C] rounded-full animate-spin" />
        <p className="text-sm text-[#A7ADB5]">Loading project details...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#111315] text-[#F5F5F5] p-8 flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-12 w-12 text-[#EB5757]" />
        <h2 className="text-lg font-semibold text-[#F5F5F5]">Project Not Found</h2>
        <p className="text-sm text-[#A7ADB5]">This project does not exist or you lack access permissions.</p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 rounded-lg bg-[#5BB98C] px-4 py-2 text-xs font-semibold text-[#111315] hover:bg-[#5BB98C]/90 transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft className="h-4 w-4" /> Go back to Dashboard
        </button>
      </div>
    )
  }

  const themeClass = colorClasses[project.color || 'blue'] || colorClasses.blue
  const isOwner = user?.id === project.owner_id

  // Column distributions
  const filteredTasks = tasks.filter(t => {
    if (filterLabelId) {
      return (t.labels || []).some(lbl => lbl.id === filterLabelId)
    }
    return true
  })

  const columnTasks = {
    todo: filteredTasks.filter(t => !t.completed && t.priority !== 'High' && t.priority !== 'Urgent'),
    inprogress: filteredTasks.filter(t => !t.completed && (t.priority === 'High' || t.priority === 'Urgent')),
    done: filteredTasks.filter(t => t.completed)
  }

  return (
    <div className="min-h-screen bg-[#111315] text-[#F5F5F5] p-8 space-y-8 transition-colors duration-300">
      {/* Cover Image Banner */}
      {project.cover_image && (
        <div className="w-full h-48 rounded-2xl overflow-hidden border border-white/[0.06] relative bg-[#171A1D]/30 shadow-inner">
          <img src={project.cover_image} alt={project.name} className="w-full h-full object-cover opacity-90 transition-opacity hover:opacity-100 duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111315] via-transparent to-transparent" />
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="rounded-xl border border-white/[0.06] bg-[#171A1D] p-2.5 text-[#A7ADB5] hover:bg-[#23272B] hover:text-[#F5F5F5] transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-4xl p-2.5 bg-[#171A1D] rounded-xl border border-white/[0.06] shadow-sm hover:scale-105 transition-transform duration-300">{project.icon || '🚀'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">{project.name}</h1>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${themeClass.text} ${themeClass.border} ${themeClass.bg}`}>
                  {project.status}
                </span>
                <span className="text-xs rounded-full border border-white/[0.06] bg-[#1D2024] px-2.5 py-0.5 text-[#A7ADB5] font-medium">
                  {project.visibility}
                </span>
                {project.is_archived && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F2C94C]/10 px-2.5 py-0.5 text-xs font-semibold text-[#F2C94C] border border-[#F2C94C]/20">
                    Archived
                  </span>
                )}
                <div className="flex items-center gap-1.5 border-l border-white/[0.06] pl-2.5 ml-1">
                  <button
                    onClick={handleFavoriteToggle}
                    className="text-[#7E848C] hover:text-[#F2C94C] transition-colors cursor-pointer"
                  >
                    <Star className={`h-4.5 w-4.5 ${project.is_favorite ? 'text-[#F2C94C] fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handlePinToggle}
                    className="text-[#7E848C] hover:text-[#5BB98C] transition-colors cursor-pointer"
                  >
                    <Pin className={`h-4.5 w-4.5 ${project.is_pinned ? 'text-[#5BB98C]' : ''}`} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-[#7E848C] mt-1.5 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 ${
                isAdvancedFiltersOpen
                  ? 'bg-[#5BB98C]/10 border-[#5BB98C]/20 text-[#5BB98C]'
                  : 'bg-[#171A1D] border-white/[0.06] text-[#F5F5F5] hover:bg-[#23272B]'
              }`}
            >
              <Filter className="h-3.5 w-3.5" /> Filters
            </button>
            <button
              onClick={() => setIsLabelManagerOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#171A1D] px-4 py-2.5 text-xs font-semibold text-[#F5F5F5] hover:bg-[#23272B] transition-all cursor-pointer shadow-sm hover:-translate-y-0.5"
            >
              <Tag className="h-3.5 w-3.5" /> Manage Tags
            </button>
            <button
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#171A1D] px-4 py-2.5 text-xs font-semibold text-[#F5F5F5] hover:bg-[#23272B] transition-all cursor-pointer shadow-sm hover:-translate-y-0.5"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit Project
            </button>
            <button
              onClick={handleArchiveToggle}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 ${
                project.is_archived
                  ? 'bg-[#F2C94C]/10 border-[#F2C94C]/20 text-[#F2C94C] hover:bg-[#F2C94C]/20'
                  : 'bg-[#171A1D] border-white/[0.06] text-[#F5F5F5] hover:bg-[#23272B]'
              }`}
            >
              {project.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
              {project.is_archived ? 'Restore' : 'Archive'}
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#EB5757]/10 border border-[#EB5757]/20 px-4 py-2.5 text-xs font-semibold text-[#EB5757] hover:bg-[#EB5757]/20 transition-all cursor-pointer shadow-sm hover:-translate-y-0.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {isAdvancedFiltersOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <AdvancedFiltersPanel
            projectId={id}
            criteria={filterCriteria}
            onChange={setFilterCriteria}
            onReset={() =>
              setFilterCriteria({
                statuses: [],
                priorities: [],
                dueDate: '',
                sprintId: '',
                labelIds: [],
                assigneeId: '',
                createdStart: '',
                createdEnd: '',
                updatedStart: '',
                updatedEnd: ''
              })
            }
            onClose={() => setIsAdvancedFiltersOpen(false)}
          />
        </motion.div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* About Project Card */}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#171A1D] to-[#111315] p-6 space-y-4 shadow-lg hover:shadow-xl transition-all duration-300">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#7E848C] text-left">About Project</h2>
            <p className="text-sm text-[#A7ADB5] leading-relaxed text-left font-medium">
              {project.description || 'No description provided for this project.'}
            </p>
            
            {/* Progress Visual */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#7E848C] uppercase tracking-wide">Overall Progress</span>
                <span className="text-sm font-bold text-[#5BB98C]">{project.progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#1D2024] overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[#5BB98C] to-[#B7E4C7] rounded-full shadow"
                />
              </div>
            </div>
          </div>

          {/* Kanban Section with Real Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7E848C]">Sprint Kanban Board</h2>
              <button
                onClick={() => setIsTaskCreateOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-[#5BB98C] hover:text-[#B7E4C7] transition-colors font-bold cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create Task
              </button>
            </div>

            {/* Labels filter pill bar */}
            {allLabels.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-[#171A1D] border border-white/[0.04] p-2 rounded-xl text-left">
                <span className="text-[10px] font-bold text-[#7E848C] uppercase px-1">Filter:</span>
                <button
                  onClick={() => setFilterLabelId('')}
                  className={`text-[9px] px-2.5 py-1 rounded-lg font-bold transition-all border cursor-pointer ${
                    !filterLabelId ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-[#A7ADB5] border-transparent'
                  }`}
                >
                  All Tasks
                </button>
                {allLabels.map((lbl) => (
                  <button
                    key={lbl.id}
                    onClick={() => setFilterLabelId(lbl.id)}
                    className={`text-[9px] px-2.5 py-1 rounded-lg font-bold transition-all border cursor-pointer ${
                      filterLabelId === lbl.id ? 'border-white/40 font-extrabold scale-105 shadow-sm' : 'border-transparent opacity-65 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: lbl.color,
                      color: '#111315'
                    }}
                  >
                    {lbl.name}
                  </button>
                ))}
              </div>
            )}
            
            {/* Multi-select Actions Toolbar */}
            {selectedTaskIds.length > 0 && (
              <div className="flex items-center justify-between bg-[#5BB98C]/15 border border-[#5BB98C]/30 p-3.5 rounded-2xl text-left">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Check className="h-4.5 w-4.5 text-[#5BB98C]" /> {selectedTaskIds.length} tasks selected
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#A7ADB5] uppercase">Bulk Move to:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleBulkMove(e.target.value)
                    }}
                    value=""
                    className="px-3 py-1.5 bg-[#1D2024] border border-white/5 rounded-xl text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="">Choose Column...</option>
                    {getSyncedColumns().map(col => (
                      <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setSelectedTaskIds([])}
                    className="text-xs font-bold text-[#EB5757] hover:underline px-2.5 py-1.5"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            {/* Kanban Columns Grid wrapper with DndContext */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                <SortableContext
                  items={getSyncedColumns().map(c => c.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {getSyncedColumns().map(col => (
                    <SortableColumn
                      key={col.id}
                      col={col}
                      tasks={tasks}
                      filterLabelId={filterLabelId}
                      selectedTaskIds={selectedTaskIds}
                      setSelectedTaskIds={setSelectedTaskIds}
                      editingColId={editingColId}
                      setEditingColId={setEditingColId}
                      renameTitle={renameTitle}
                      setRenameTitle={setRenameTitle}
                      handleRenameColumn={handleRenameColumn}
                      handleDeleteColumn={handleDeleteColumn}
                      setEditTargetTask={setEditTargetTask}
                      handleDeleteTask={handleDeleteTask}
                      handleToggleTask={handleToggleTask}
                      setIsTaskCreateOpen={setIsTaskCreateOpen}
                      projectDependencies={projectDependencies}
                    />
                  ))}
                </SortableContext>

                {/* Column CRUD: Create Column Button */}
                <div className="w-80 flex-shrink-0 rounded-2xl border border-dashed border-white/[0.06] bg-[#171A1D]/20 p-4 h-48 flex flex-col justify-center items-center text-center">
                  <p className="text-xs font-bold text-[#7E848C]">Add Custom Status</p>
                  <div className="mt-3 flex gap-1.5 w-full">
                    <input
                      type="text"
                      placeholder="Column Title"
                      value={newColTitle}
                      onChange={(e) => setNewColTitle(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-[#1D2024] border border-white/[0.06] rounded-xl text-xs text-white outline-none focus:border-[#5BB98C]"
                    />
                    <button
                      onClick={() => {
                        if (newColTitle.trim()) {
                          handleAddColumn(newColTitle)
                          setNewColTitle('')
                        }
                      }}
                      className="px-3 py-1.5 bg-[#5BB98C] text-[#111315] font-bold rounded-xl text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Drag Overlay Portal */}
              <DragOverlay>
                {activeTask ? (
                  <div className="p-3 rounded-xl border border-[#5BB98C]/40 bg-[#1D2024] flex flex-col gap-1.5 text-left opacity-90 shadow-2xl w-72">
                    <span className="text-xs font-semibold text-[#F5F5F5]">{activeTask.title}</span>
                    <span className="text-[9px] text-[#A7ADB5]">{activeTask.priority}</span>
                  </div>
                ) : activeColumnId ? (
                  <div className="w-80 rounded-2xl border border-white/10 bg-[#171A1D] p-4 flex flex-col min-h-[340px] opacity-90 shadow-2xl text-left">
                    <span className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
                      {getSyncedColumns().find(c => c.id === activeColumnId)?.title || "Column"}
                    </span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Empty Documentation Placeholder */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#7E848C] text-left">Documentation Docs</h2>
            <div className="rounded-2xl border border-dashed border-white/[0.06] bg-[#171A1D]/40 p-10 flex flex-col items-center justify-center text-center shadow-inner">
              <FileText className="h-10 w-10 text-[#7E848C]/40 mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-[#F5F5F5]">No Documentation Yet</h3>
              <p className="text-xs text-[#A7ADB5] mt-1.5 max-w-[280px]">
                Create specs, guidelines, and resource links to keep your team aligned.
              </p>
              <button
                onClick={() => alert('Create Documentation is under development.')}
                className="mt-4 px-4 py-2 text-xs font-bold bg-[#1D2024] hover:bg-[#23272B] border border-white/[0.06] text-[#5BB98C] hover:text-[#B7E4C7] rounded-xl transition-all cursor-pointer shadow-sm"
              >
                + Create Document
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar details */}
        <div className="space-y-6">
          {/* Active Timer Widget */}
          <TimerWidget />

          {/* Metadata Card */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#171A1D] p-6 space-y-4 shadow-lg">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#7E848C] text-left">Project Metadata</h2>
            
            <div className="space-y-3.5 pt-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-white/[0.06]">
                <span className="text-[#A7ADB5] font-medium">Created by</span>
                <span className="font-semibold text-[#F5F5F5] flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-[#7E848C]" />
                  {isOwner ? 'You' : 'Workspace Collaborator'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/[0.06]">
                <span className="text-[#A7ADB5] font-medium">Current Status</span>
                <span className="font-semibold text-[#F5F5F5] flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${themeClass.dot}`} />
                  {project.status}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/[0.06]">
                <span className="text-[#A7ADB5] font-medium">Priority Level</span>
                <span className="font-bold text-[#F5F5F5] uppercase tracking-wide text-[10px]">{project.priority}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/[0.06]">
                <span className="text-[#A7ADB5] font-medium">Visibility Level</span>
                <span className="font-bold text-[#F5F5F5] uppercase tracking-wide text-[10px]">{project.visibility}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/[0.06]">
                <span className="text-[#A7ADB5] font-medium">Team Size</span>
                <span className="font-semibold text-[#F5F5F5]">{project.members?.length || 0} members</span>
              </div>
            </div>
          </div>

          {/* Project Members Section */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#171A1D] p-6 space-y-4 shadow-lg text-left">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7E848C]">Assigned Team</h2>
              <button
                onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
                className="text-[10px] font-bold text-[#5BB98C] hover:text-[#B7E4C7] transition-all cursor-pointer"
              >
                + Add Member
              </button>
            </div>

            {/* List members */}
            <div className="space-y-2.5">
              {project.members && project.members.length > 0 ? (
                project.members.map((m: any) => {
                  const initials = m.full_name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                  return (
                    <div key={m.id} className="flex items-center justify-between group/member text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-[#1D2024] border border-white/[0.06] flex items-center justify-center font-bold text-[10px] text-[#5BB98C]">
                          {m.profile_image ? (
                            <img src={m.profile_image} alt={m.full_name} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            initials || '?'
                          )}
                        </div>
                        <span className="text-[#F5F5F5] font-medium truncate w-32">{m.full_name}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveProjectMember(m.id)}
                        className="text-[10px] text-[#EB5757] hover:text-red-400 opacity-0 group-hover/member:opacity-100 transition-opacity cursor-pointer font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )
                })
              ) : (
                <p className="text-[10px] text-[#7E848C]">No members assigned to this project yet.</p>
              )}
            </div>

            {/* Add Member Dropdown/List panel */}
            {isAddMemberOpen && (
              <div className="pt-2 border-t border-white/[0.06] space-y-2">
                <p className="text-[9px] font-bold text-[#7E848C] uppercase tracking-wider">Select Teammate</p>
                <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1">
                  {allWorkspaceMembers
                    .filter((wm) => !project.members?.some((pm: any) => pm.id === wm.user.id))
                    .map((member) => (
                      <button
                        key={member.user.id}
                        onClick={() => handleAssignProjectMember(member.user.id)}
                        className="w-full text-left p-1.5 rounded-lg hover:bg-[#1D2024] text-[10px] text-[#A7ADB5] hover:text-[#F5F5F5] transition-all cursor-pointer truncate block"
                      >
                        {member.user.full_name} ({member.role})
                      </button>
                    ))}
                  {allWorkspaceMembers.filter((wm) => !project.members?.some((pm: any) => pm.id === wm.user.id)).length === 0 && (
                    <p className="text-[9px] text-[#7E848C]">All workspace members are already assigned.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Project Discussions Panel */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#171A1D] p-6 space-y-4 shadow-lg">
            <CommentsList projectId={project.id} />
          </div>

          {/* Task Counter */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#171A1D] p-6 space-y-4 shadow-lg">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#7E848C] text-left">Upcoming Project Tasks</h2>
            
            {tasks.filter(t => !t.completed).length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-6">
                <CheckSquare className="h-8 w-8 text-[#7E848C]/40 mb-2" />
                <p className="text-xs text-[#7E848C] font-semibold">No upcoming deadlines assigned</p>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {tasks.filter(t => !t.completed).slice(0, 3).map(task => (
                  <div key={task.id} className="p-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] hover:bg-[#23272B] transition-colors flex justify-between items-center text-left">
                    <span className="truncate w-36 text-[#F5F5F5] font-semibold">{task.title}</span>
                    <span className="text-[10px] text-[#A7ADB5] font-medium">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#171A1D] p-6 space-y-4 shadow-lg">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#7E848C] text-left">Recent Activity</h2>
            
            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                <Sparkles className="h-4.5 w-4.5 text-[#5BB98C] flex-shrink-0" />
                <div className="text-left">
                  <p className="text-[#F5F5F5] font-semibold">Project initialized</p>
                  <p className="text-[10px] text-[#7E848C] mt-0.5">By Owner • {new Date(project.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Project Modal Overlay */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#171A1D] p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsEditOpen(false)}
                className="absolute right-4 top-4 rounded-xl p-1.5 text-[#A7ADB5] hover:bg-white/5 hover:text-[#F5F5F5] transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <h3 className="text-lg font-bold text-[#F5F5F5] mb-2 text-left">Edit Project Settings</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                {saveError && (
                  <div className="p-3 text-xs font-medium rounded-xl bg-[#EB5757]/10 border border-[#EB5757]/20 text-[#EB5757]">
                    {saveError}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label htmlFor="epname" className="text-xs font-semibold text-[#A7ADB5] block text-left">Project Name</label>
                  <input
                    id="epname"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Project name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-sm text-[#F5F5F5] outline-none focus:border-[#5BB98C]"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label htmlFor="epdesc" className="text-xs font-semibold text-[#A7ADB5] block text-left">Description</label>
                  <textarea
                    id="epdesc"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Project description"
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-sm text-[#F5F5F5] outline-none focus:border-[#5BB98C] resize-none"
                  />
                </div>

                {/* Status & Priority Row */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1.5">
                    <label htmlFor="epstatus" className="text-xs font-semibold text-[#A7ADB5] block">Status</label>
                    <select
                      id="epstatus"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-sm text-[#F5F5F5] outline-none focus:border-[#5BB98C] cursor-pointer"
                    >
                      <option value="Pending" className="bg-[#171A1D]">Pending</option>
                      <option value="In Progress" className="bg-[#171A1D]">In Progress</option>
                      <option value="Review" className="bg-[#171A1D]">Review</option>
                      <option value="Completed" className="bg-[#171A1D]">Completed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="eppriority" className="text-xs font-semibold text-[#A7ADB5] block">Priority</label>
                    <select
                      id="eppriority"
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-sm text-[#F5F5F5] outline-none focus:border-[#5BB98C] cursor-pointer"
                    >
                      <option value="Low" className="bg-[#171A1D]">Low</option>
                      <option value="Medium" className="bg-[#171A1D]">Medium</option>
                      <option value="High" className="bg-[#171A1D]">High</option>
                      <option value="Urgent" className="bg-[#171A1D]">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Progress Slider */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="epprogress" className="text-xs font-semibold text-[#A7ADB5] block">Progress ({editProgress}%)</label>
                  <input
                    id="epprogress"
                    type="range"
                    min="0"
                    max="100"
                    value={editProgress}
                    onChange={(e) => setEditProgress(Number(e.target.value))}
                    className="w-full h-8 accent-[#5BB98C] bg-transparent cursor-pointer"
                  />
                </div>

                {/* Visibility selector */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="epvisibility" className="text-xs font-semibold text-[#A7ADB5] block">Visibility Level</label>
                  <select
                    id="epvisibility"
                    value={editVisibility}
                    onChange={(e) => setEditVisibility(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-sm text-[#F5F5F5] outline-none focus:border-[#5BB98C] cursor-pointer"
                  >
                    <option value="Workspace" className="bg-[#171A1D]">Workspace</option>
                    <option value="Private" className="bg-[#171A1D]">Private</option>
                    <option value="Public" className="bg-[#171A1D]">Public</option>
                  </select>
                </div>

                {/* Cover Image Input */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="epcover" className="text-xs font-semibold text-[#A7ADB5] block">Cover Image URL</label>
                  <input
                    id="epcover"
                    type="text"
                    value={editCoverImage}
                    onChange={(e) => setEditCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-sm text-[#F5F5F5] outline-none focus:border-[#5BB98C]"
                  />
                </div>

                {/* Icon selection */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-[#A7ADB5] block">Project Icon</label>
                  <div className="flex gap-2">
                    {icons.map((ico) => (
                      <button
                        key={ico}
                        type="button"
                        onClick={() => setEditIcon(ico)}
                        className={`text-xl p-2 rounded-xl border transition-all cursor-pointer ${
                          editIcon === ico ? 'border-[#5BB98C] bg-[#5BB98C]/10' : 'border-white/[0.06] bg-[#1D2024] hover:bg-[#23272B]'
                        }`}
                      >
                        {ico}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color selection */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-[#A7ADB5] block">Project Color Theme</label>
                  <div className="flex gap-2">
                    {colors.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setEditColor(col)}
                        className={`h-7 w-7 rounded-full border-2 transition-all cursor-pointer ${
                          colorClasses[col]?.dot || 'bg-[#5BB98C]'
                        } ${
                          editColor === col ? 'border-[#F5F5F5] scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    disabled={saveLoading}
                    className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#A7ADB5] hover:bg-[#1D2024] hover:text-[#F5F5F5] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold px-4 py-2.5 text-xs transition-all cursor-pointer shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Creation Modal */}
      <AnimatePresence>
        {isTaskCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#171A1D] p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsTaskCreateOpen(false)}
                className="absolute right-4 top-4 rounded-xl p-1.5 text-[#A7ADB5] hover:bg-white/5 hover:text-[#F5F5F5] transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <h3 className="text-base font-bold text-[#F5F5F5] mb-4 text-left">Create New Project Task</h3>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-[#A7ADB5] block">Task Title</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Build API Schema validations"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-sm text-[#F5F5F5] focus:border-[#5BB98C] outline-none"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-[#A7ADB5] block">Description</label>
                  <textarea
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Provide details about this action item..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-sm text-[#F5F5F5] focus:border-[#5BB98C] outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#A7ADB5] block">Status</label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-[#F5F5F5] outline-none focus:border-[#5BB98C] cursor-pointer"
                    >
                      <option value="Todo" className="bg-[#171A1D]">Todo</option>
                      <option value="In Progress" className="bg-[#171A1D]">In Progress</option>
                      <option value="Review" className="bg-[#171A1D]">Review</option>
                      <option value="Done" className="bg-[#171A1D]">Done</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#A7ADB5] block">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-[#F5F5F5] outline-none focus:border-[#5BB98C] cursor-pointer"
                    >
                      <option value="Low" className="bg-[#171A1D]">Low</option>
                      <option value="Medium" className="bg-[#171A1D]">Medium</option>
                      <option value="High" className="bg-[#171A1D]">High</option>
                      <option value="Urgent" className="bg-[#171A1D]">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-[#A7ADB5] block">Tags & Labels</label>
                  <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto p-2 border border-white/[0.06] bg-[#1D2024] rounded-xl">
                    {allLabels.map((lbl) => {
                      const isSelected = selectedLabelIds.includes(lbl.id)
                      return (
                        <button
                          key={lbl.id}
                          type="button"
                          onClick={() => {
                            setSelectedLabelIds(prev =>
                              prev.includes(lbl.id) ? prev.filter(id => id !== lbl.id) : [...prev, lbl.id]
                            )
                          }}
                          className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? 'border-white/40 shadow-sm'
                              : 'opacity-50 border-transparent'
                          }`}
                          style={{
                            backgroundColor: lbl.color,
                            color: '#111315'
                          }}
                        >
                          {lbl.name}
                        </button>
                      )
                    })}
                    {allLabels.length === 0 && (
                      <span className="text-[10px] text-[#7E848C] italic">No project labels created yet.</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-[#A7ADB5] block">Assignee (Optional)</label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-[#F5F5F5] outline-none focus:border-[#5BB98C] cursor-pointer"
                  >
                    <option value="" className="bg-[#171A1D]">Unassigned</option>
                    {allWorkspaceMembers.map((member) => (
                      <option key={member.user.id} value={member.user.id} className="bg-[#171A1D]">
                        {member.user.full_name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#A7ADB5] block">Story Points</label>
                    <input
                      type="number"
                      value={taskStoryPoints}
                      onChange={(e) => setTaskStoryPoints(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 5"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-[#F5F5F5] focus:border-[#5BB98C] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#A7ADB5] block">Estimate (Hours)</label>
                    <input
                      type="number"
                      value={taskEstimatedTime}
                      onChange={(e) => setTaskEstimatedTime(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 16"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-[#F5F5F5] focus:border-[#5BB98C] outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsTaskCreateOpen(false)}
                    className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#A7ADB5] hover:bg-[#1D2024] hover:text-[#F5F5F5] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold px-4 py-2.5 text-xs transition-all cursor-pointer shadow-md"
                  >
                    {saveLoading ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editTargetTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl rounded-2xl border border-white/[0.06] bg-[#171A1D] p-6 shadow-2xl relative flex flex-col md:flex-row gap-6"
            >
              <button
                onClick={() => setEditTargetTask(null)}
                className="absolute right-4 top-4 rounded-xl p-1.5 text-[#A7ADB5] hover:bg-white/5 hover:text-[#F5F5F5] transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              {/* Left Column: Form details */}
              <div className="w-full md:w-1/2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold text-[#F5F5F5] text-left">Edit Task Details</h3>
                    <div className="flex gap-2 mr-6">
                      <button
                        type="button"
                        onClick={() => handleDuplicateTask(editTargetTask.id)}
                        title="Duplicate Task"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
                      >
                        <Layers className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (editTargetTask.is_archived) {
                            handleRestoreTask(editTargetTask.id)
                          } else {
                            handleArchiveTask(editTargetTask.id)
                          }
                        }}
                        title={editTargetTask.is_archived ? "Restore Task" : "Archive Task"}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
                      >
                        {editTargetTask.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTaskDirect(editTargetTask.id)}
                        title="Delete Task"
                        className="p-1.5 rounded-lg bg-[#EB5757]/10 hover:bg-[#EB5757]/20 text-[#EB5757] transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <form onSubmit={handleSaveTaskEdit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-[#A7ADB5] block">Task Title</label>
                  <input
                    type="text"
                    required
                    value={editTaskTitle}
                    onChange={(e) => setEditTaskTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-sm text-[#F5F5F5] focus:border-[#5BB98C] outline-none"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-[#A7ADB5] block">Description</label>
                  <textarea
                    value={editTaskDesc}
                    onChange={(e) => setEditTaskDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-sm text-[#F5F5F5] focus:border-[#5BB98C] outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#A7ADB5] block">Status</label>
                    <select
                      value={editTaskStatus}
                      onChange={(e) => setEditTaskStatus(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-[#F5F5F5] outline-none focus:border-[#5BB98C] cursor-pointer"
                    >
                      <option value="Todo" className="bg-[#171A1D]">Todo</option>
                      <option value="In Progress" className="bg-[#171A1D]">In Progress</option>
                      <option value="Review" className="bg-[#171A1D]">Review</option>
                      <option value="Done" className="bg-[#171A1D]">Done</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#A7ADB5] block">Priority</label>
                    <select
                      value={editTaskPriority}
                      onChange={(e) => setEditTaskPriority(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-[#F5F5F5] outline-none focus:border-[#5BB98C] cursor-pointer"
                    >
                      <option value="Low" className="bg-[#171A1D]">Low</option>
                      <option value="Medium" className="bg-[#171A1D]">Medium</option>
                      <option value="High" className="bg-[#171A1D]">High</option>
                      <option value="Urgent" className="bg-[#171A1D]">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-[#A7ADB5] block">Tags & Labels</label>
                  <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto p-2 border border-white/[0.06] bg-[#1D2024] rounded-xl">
                    {allLabels.map((lbl) => {
                      const isSelected = editLabelIds.includes(lbl.id)
                      return (
                        <button
                          key={lbl.id}
                          type="button"
                          onClick={() => {
                            setEditLabelIds(prev =>
                              prev.includes(lbl.id) ? prev.filter(id => id !== lbl.id) : [...prev, lbl.id]
                            )
                          }}
                          className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? 'border-white/40 shadow-sm'
                              : 'opacity-50 border-transparent'
                          }`}
                          style={{
                            backgroundColor: lbl.color,
                            color: '#111315'
                          }}
                        >
                          {lbl.name}
                        </button>
                      )
                    })}
                    {allLabels.length === 0 && (
                      <span className="text-[10px] text-[#7E848C] italic">No project labels created yet.</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-[#A7ADB5] block">Assignee (Optional)</label>
                  <select
                    value={editTaskAssigneeId}
                    onChange={(e) => setEditTaskAssigneeId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-[#F5F5F5] outline-none focus:border-[#5BB98C] cursor-pointer"
                  >
                    <option value="" className="bg-[#171A1D]">Unassigned</option>
                    {allWorkspaceMembers.map((member) => (
                      <option key={member.user.id} value={member.user.id} className="bg-[#171A1D]">
                        {member.user.full_name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-[#A7ADB5] block">Parent Task (Optional)</label>
                  <select
                    value={editParentTaskId}
                    onChange={(e) => setEditParentTaskId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-[#F5F5F5] outline-none focus:border-[#5BB98C] cursor-pointer"
                  >
                    <option value="" className="bg-[#171A1D]">None (Root Task)</option>
                    {tasks.filter(t => t.id !== editTargetTask.id && !t.parent_id).map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#171A1D]">
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#A7ADB5] block">Story Points</label>
                    <input
                      type="number"
                      value={editStoryPoints}
                      onChange={(e) => setEditStoryPoints(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 5"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-[#F5F5F5] focus:border-[#5BB98C] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#A7ADB5] block">Estimate (Hours)</label>
                    <input
                      type="number"
                      value={editEstimatedTime}
                      onChange={(e) => setEditEstimatedTime(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 16"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-[#F5F5F5] focus:border-[#5BB98C] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-[#A7ADB5] block">Attachments</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAttachmentName}
                        onChange={(e) => setNewAttachmentName(e.target.value)}
                        placeholder="File name (e.g. Design Spec)"
                        className="flex-1 px-3 py-1.5 border border-white/[0.06] bg-[#1D2024] text-xs text-white rounded-lg outline-none"
                      />
                      <input
                        type="text"
                        value={newAttachmentUrl}
                        onChange={(e) => setNewAttachmentUrl(e.target.value)}
                        placeholder="Link URL"
                        className="flex-1 px-3 py-1.5 border border-white/[0.06] bg-[#1D2024] text-xs text-white rounded-lg outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newAttachmentName.trim() && newAttachmentUrl.trim()) {
                            setEditAttachments(prev => [...prev, { name: newAttachmentName, url: newAttachmentUrl }])
                            setNewAttachmentName('')
                            setNewAttachmentUrl('')
                          }
                        }}
                        className="px-3 py-1.5 bg-[#5BB98C] text-[#111315] font-bold rounded-lg text-xs"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {editAttachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-white">
                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{att.name}</a>
                          <button
                            type="button"
                            onClick={() => setEditAttachments(prev => prev.filter((_, i) => i !== idx))}
                            className="text-[#EB5757] hover:text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-[#A7ADB5] block">Due Date</label>
                  <input
                    type="date"
                    value={editTaskDueDate}
                    onChange={(e) => setEditTaskDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-[#1D2024] text-xs text-[#F5F5F5] focus:border-[#5BB98C] outline-none cursor-pointer"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setEditTargetTask(null)}
                    className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#A7ADB5] hover:bg-[#1D2024] hover:text-[#F5F5F5] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold px-4 py-2.5 text-xs transition-all cursor-pointer shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
              </div>
              </div>

              {/* Right Column: Subtasks, Dependencies, Visual Graph, Time Tracking & Comments */}
              <div className="w-full md:w-1/2 border-t md:border-t-0 md:border-l border-white/[0.06] pt-6 md:pt-0 md:pl-6 overflow-y-auto max-h-[600px] space-y-6 text-left">
                
                {/* 1. Subtasks Widget */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#A7ADB5] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-[#5BB98C]" /> Subtasks ({subtasksList.filter(s => s.completed).length}/{subtasksList.length})
                  </h4>

                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {subtasksList.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-2.5 bg-[#1D2024]/80 border border-white/[0.04] rounded-xl hover:border-white/10 transition-all">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={sub.completed}
                            onChange={async (e) => {
                              try {
                                await taskService.updateTask(sub.id, { completed: e.target.checked })
                                refetchSubtasks()
                                queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: id }] })
                              } catch (err) {
                                alert('Failed to update subtask status.')
                              }
                            }}
                            className="rounded border-white/10 bg-[#1D2024] text-[#5BB98C] focus:ring-[#5BB98C] h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className={`text-xs ${sub.completed ? 'line-through text-[#7E848C]' : 'text-white'}`}>{sub.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm('Delete subtask?')) {
                              try {
                                await taskService.deleteTask(sub.id)
                                refetchSubtasks()
                                queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: id }] })
                              } catch (err) {
                                alert('Failed to delete subtask.')
                              }
                            }
                          }}
                          className="text-[#EB5757] hover:text-red-400 p-1 rounded hover:bg-white/5"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {subtasksList.length === 0 && (
                      <p className="text-[10px] text-[#7E848C] italic">No subtasks created for this task.</p>
                    )}
                  </div>

                  <form onSubmit={handleAddSubtask} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add new subtask..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-white/[0.06] bg-[#1D2024] text-xs text-white rounded-lg outline-none focus:border-[#5BB98C]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-[#5BB98C] text-[#111315] font-bold rounded-lg text-xs hover:bg-[#5BB98C]/90"
                    >
                      Add
                    </button>
                  </form>
                </div>

                {/* 2. Task Dependencies Widget */}
                <div className="border-t border-white/[0.06] pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-[#A7ADB5] uppercase tracking-wider flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-[#5BB98C]" /> Task Dependencies
                  </h4>

                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {dependenciesList.map((dep) => {
                      const isOutgoing = dep.task_id === editTargetTask.id
                      const otherTask = isOutgoing
                        ? tasks.find(t => t.id === dep.depends_on_id)
                        : tasks.find(t => t.id === dep.task_id)
                      if (!otherTask) return null
                      return (
                        <div key={dep.id} className="flex items-center justify-between p-2.5 bg-[#1D2024]/80 border border-white/[0.04] rounded-xl hover:border-white/10 transition-all">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-white truncate max-w-[200px]" title={otherTask.title}>
                              {otherTask.title}
                            </span>
                            <span className="text-[9px] text-[#A7ADB5] flex items-center gap-1">
                              {isOutgoing ? (
                                <>
                                  <Lock className="h-2.5 w-2.5 text-[#EB5757]" /> Blocked By ({otherTask.status})
                                </>
                              ) : (
                                <>
                                  <AlertOctagon className="h-2.5 w-2.5 text-[#F2C94C]" /> Blocks ({otherTask.status})
                                </>
                              )}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDependency(dep.id)}
                            className="text-[#EB5757] hover:text-red-400 p-1 rounded hover:bg-white/5"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    })}
                    {dependenciesList.length === 0 && (
                      <p className="text-[10px] text-[#7E848C] italic">No dependency links established yet.</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={newDepTargetId}
                      onChange={(e) => setNewDepTargetId(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-white/[0.06] bg-[#1D2024] text-xs text-white rounded-lg outline-none cursor-pointer"
                    >
                      <option value="">Select task to link...</option>
                      {tasks.filter(t => t.id !== editTargetTask.id).map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                    <select
                      value={newDepType}
                      onChange={(e) => setNewDepType(e.target.value)}
                      className="px-2 py-1.5 border border-white/[0.06] bg-[#1D2024] text-xs text-white rounded-lg outline-none cursor-pointer"
                    >
                      <option value="blocked_by">Blocked By</option>
                      <option value="relates">Relates To</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddDependency}
                      className="px-3 py-1.5 bg-[#5BB98C] text-[#111315] font-bold rounded-lg text-xs hover:bg-[#5BB98C]/90"
                    >
                      Link
                    </button>
                  </div>
                </div>

                {/* 3. Visual Dependency Graph Flow */}
                {dependenciesList.length > 0 && (
                  <div className="border-t border-white/[0.06] pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-[#A7ADB5] uppercase tracking-wider flex items-center gap-1.5">
                      <Network className="h-3.5 w-3.5 text-[#5BB98C]" /> Dependency Visualizer Flow
                    </h4>
                    <div className="bg-[#111315]/40 border border-white/[0.06] rounded-xl p-3.5 flex flex-col gap-4.5 overflow-x-auto min-h-[140px] justify-center items-center">
                      <div className="flex flex-wrap items-center justify-center gap-4 text-center">
                        
                        {/* Blocking tasks nodes */}
                        <div className="flex flex-col gap-2">
                          {dependenciesList.filter(d => d.task_id === editTargetTask.id).map((dep) => {
                            const other = tasks.find(t => t.id === dep.depends_on_id)
                            if (!other) return null
                            return (
                              <div key={dep.id} className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold max-w-[120px] truncate ${
                                other.completed ? 'bg-[#5BB98C]/10 border-[#5BB98C]/20 text-[#5BB98C]' : 'bg-[#EB5757]/10 border-[#EB5757]/20 text-[#EB5757]'
                              }`} title={other.title}>
                                {other.title}
                              </div>
                            )
                          })}
                          {dependenciesList.filter(d => d.task_id === editTargetTask.id).length === 0 && (
                            <span className="text-[9px] text-[#7E848C] italic">No Blockers</span>
                          )}
                        </div>

                        {/* Arrow Right connector */}
                        <div className="text-white/20 font-bold">➔</div>

                        {/* Center Current Task node */}
                        <div className="px-3.5 py-2.5 rounded-xl border border-[#5BB98C] bg-[#5BB98C]/10 text-[#5BB98C] text-[11px] font-bold max-w-[140px] text-center shadow-md">
                          {editTargetTask.title}
                          <span className="block text-[8px] text-[#A7ADB5] mt-1 font-semibold uppercase">{editTargetTask.status}</span>
                        </div>

                        {/* Arrow Right connector */}
                        <div className="text-white/20 font-bold">➔</div>

                        {/* Blocked tasks nodes */}
                        <div className="flex flex-col gap-2">
                          {dependenciesList.filter(d => d.depends_on_id === editTargetTask.id).map((dep) => {
                            const other = tasks.find(t => t.id === dep.task_id)
                            if (!other) return null
                            return (
                              <div key={dep.id} className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold max-w-[120px] truncate ${
                                other.completed ? 'bg-[#5BB98C]/10 border-[#5BB98C]/20 text-[#5BB98C]' : 'bg-white/5 border-white/10 text-white'
                              }`} title={other.title}>
                                {other.title}
                              </div>
                            )
                          })}
                          {dependenciesList.filter(d => d.depends_on_id === editTargetTask.id).length === 0 && (
                            <span className="text-[9px] text-[#7E848C] italic">Blocks None</span>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Time Tracking & Comments */}
                <div className="border-t border-white/[0.06] pt-4">
                  <TimeLogsManager projectId={id} taskId={editTargetTask.id} />
                </div>
                <div className="border-t border-white/[0.06] pt-4">
                  <CommentsList taskId={editTargetTask.id} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {isDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm rounded-2xl border border-[#EB5757]/20 bg-[#171A1D] p-6 shadow-2xl text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EB5757]/10 mx-auto mb-4 border border-[#EB5757]/20">
                <Trash2 className="h-6 w-6 text-[#EB5757]" />
              </div>
              <h3 className="text-base font-bold text-[#F5F5F5] mb-2">Delete Project?</h3>
              <p className="text-xs text-[#A7ADB5] mb-6 font-medium">
                Are you sure you want to delete <span className="text-[#F5F5F5] font-bold">&quot;{project.name}&quot;</span>? This action is permanent and deletes all associated workspace metadata.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={saveLoading}
                  className="flex-1 rounded-xl border border-white/[0.06] bg-[#1D2024] px-4 py-2.5 text-xs font-bold text-[#A7ADB5] hover:bg-[#23272B] hover:text-[#F5F5F5] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saveLoading}
                  className="flex-1 rounded-xl bg-[#EB5757] hover:bg-red-600 text-white font-bold px-4 py-2.5 text-xs transition-all cursor-pointer shadow-md"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Label Manager Modal Overlay */}
      <AnimatePresence>
        {isLabelManagerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="relative">
              <LabelsManager
                projectId={id}
                onClose={() => setIsLabelManagerOpen(false)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface SortableColumnProps {
  col: any
  tasks: TaskResponse[]
  filterLabelId: string
  selectedTaskIds: string[]
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>
  editingColId: string | null
  setEditingColId: (id: string | null) => void
  renameTitle: string
  setRenameTitle: (title: string) => void
  handleRenameColumn: (colId: string, newTitle: string) => void
  handleDeleteColumn: (colId: string) => void
  setEditTargetTask: (task: TaskResponse) => void
  handleDeleteTask: (taskId: string) => void
  handleToggleTask: (taskId: string, currentCompleted: boolean) => void
  setIsTaskCreateOpen: (open: boolean) => void
  projectDependencies: any[]
}

function SortableColumn({
  col,
  tasks,
  filterLabelId,
  selectedTaskIds,
  setSelectedTaskIds,
  editingColId,
  setEditingColId,
  renameTitle,
  setRenameTitle,
  handleRenameColumn,
  handleDeleteColumn,
  setEditTargetTask,
  handleDeleteTask,
  handleToggleTask,
  setIsTaskCreateOpen,
  projectDependencies
}: SortableColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.id,
    data: { type: 'column' }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1
  }

  const matchedTasks = col.taskIds
    .map((tid: any) => tasks.find(t => t.id === tid))
    .filter(Boolean) as TaskResponse[]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-80 flex-shrink-0 rounded-2xl border border-white/[0.06] bg-[#171A1D] p-4 flex flex-col min-h-[340px] shadow-sm text-left"
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-0" {...attributes} {...listeners}>
          <Move className="h-3.5 w-3.5 text-[#7E848C] cursor-grab active:cursor-grabbing flex-shrink-0" />
          {editingColId === col.id ? (
            <input
              type="text"
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              onBlur={() => {
                handleRenameColumn(col.id, renameTitle)
                setEditingColId(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameColumn(col.id, renameTitle)
                  setEditingColId(null)
                }
              }}
              autoFocus
              className="bg-[#1D2024] border border-[#5BB98C] rounded-lg px-2 py-0.5 text-xs text-white outline-none w-full"
            />
          ) : (
            <span
              onDoubleClick={() => {
                setEditingColId(col.id)
                setRenameTitle(col.title)
              }}
              className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider truncate cursor-pointer hover:text-white"
              title="Double click to rename"
            >
              {col.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-[10px] bg-[#1D2024] text-[#A7ADB5] rounded-full px-2 py-0.5 border border-white/[0.06] font-semibold">
            {matchedTasks.length}
          </span>
          <button
            type="button"
            onClick={() => {
              setEditingColId(col.id)
              setRenameTitle(col.title)
            }}
            className="text-[#7E848C] hover:text-white p-0.5 transition-colors cursor-pointer"
            title="Rename Column"
          >
            <Edit className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteColumn(col.id)}
            className="text-[#7E848C] hover:text-[#EB5757] p-0.5 transition-colors cursor-pointer"
            title="Delete Column"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <SortableContext items={col.taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 flex-1">
          {matchedTasks.map(task => (
            <SortableTask
              key={task.id}
              task={task}
              isSelected={selectedTaskIds.includes(task.id)}
              onSelectToggle={(checked) => {
                setSelectedTaskIds(prev =>
                  checked ? [...prev, task.id] : prev.filter(tid => tid !== task.id)
                )
              }}
              setEditTargetTask={setEditTargetTask}
              handleDeleteTask={handleDeleteTask}
              handleToggleTask={handleToggleTask}
              tasks={tasks}
              projectDependencies={projectDependencies}
            />
          ))}

          {matchedTasks.length === 0 && (
            <div className="h-36 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/[0.06] rounded-xl bg-[#111315]/40">
              <Layers className="h-7 w-7 text-[#7E848C]/40 mb-2" />
              <p className="text-xs text-[#7E848C] font-semibold">No tasks here</p>
              <button
                type="button"
                onClick={() => setIsTaskCreateOpen(true)}
                className="mt-3 text-[10px] font-bold text-[#5BB98C] hover:text-[#B7E4C7] transition-all cursor-pointer"
              >
                + Create Task
              </button>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

interface SortableTaskProps {
  task: TaskResponse
  isSelected: boolean
  onSelectToggle: (checked: boolean) => void
  setEditTargetTask: (task: TaskResponse) => void
  handleDeleteTask: (taskId: string) => void
  handleToggleTask: (taskId: string, currentCompleted: boolean) => void
  tasks: TaskResponse[]
  projectDependencies: any[]
}

function SortableTask({
  task,
  isSelected,
  onSelectToggle,
  setEditTargetTask,
  handleDeleteTask,
  handleToggleTask,
  tasks,
  projectDependencies
}: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task' }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1
  }

  // Calculate dependency badges
  const subtasks = tasks.filter(t => t.parent_id === task.id)
  const completedSubCount = subtasks.filter(t => t.completed).length
  const isBlocked = projectDependencies.some(d => 
    d.task_id === task.id && 
    d.dependency_type === 'blocked_by' && 
    !(tasks.find(t => t.id === d.depends_on_id)?.completed)
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-xl border border-white/[0.06] bg-[#1D2024] hover:bg-[#23272B] hover:border-[#5BB98C]/30 transition-all duration-200 flex flex-col gap-1.5 text-left relative group shadow-sm ${
        isSelected ? 'border-[#5BB98C]' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectToggle(e.target.checked)}
          className="mt-0.5 rounded border-white/10 bg-[#1D2024] text-[#5BB98C] focus:ring-[#5BB98C] h-3.5 w-3.5 cursor-pointer animate-none"
        />

        <div className="flex-1 min-w-0" {...attributes} {...listeners}>
          <span className={`text-xs font-semibold text-[#F5F5F5] break-words cursor-grab active:cursor-grabbing ${task.completed ? 'line-through opacity-60' : ''}`}>
            {task.title}
          </span>
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {task.labels.map(lbl => (
                <span key={lbl.id} className="text-[7.5px] px-1 py-0.5 rounded font-bold text-[#111315]" style={{ backgroundColor: lbl.color }}>
                  {lbl.name}
                </span>
              ))}
            </div>
          )}

          {/* Dependency badges */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {isBlocked && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-[#EB5757]/10 text-[#EB5757] text-[8px] font-bold border border-[#EB5757]/20">
                <Lock className="h-2.5 w-2.5" /> Blocked
              </span>
            )}
            {task.parent_id && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-white/5 text-[#A7ADB5] text-[8px] font-bold border border-white/10">
                Subtask
              </span>
            )}
            {subtasks.length > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-[#5BB98C]/10 text-[#5BB98C] text-[8px] font-bold border border-[#5BB98C]/20">
                <Layers className="h-2.5 w-2.5" /> Subtasks {completedSubCount}/{subtasks.length}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={() => handleToggleTask(task.id, task.completed)}
          className={`text-[#7E848C] hover:text-[#5BB98C] transition-colors cursor-pointer flex-shrink-0 ${task.completed ? 'text-[#5BB98C]' : ''}`}
        >
          <CheckSquare className="h-4 w-4 fill-current" />
        </button>
      </div>

      <div className="flex justify-between items-center text-[9px] text-[#A7ADB5] mt-1">
        <div className="flex items-center gap-2 font-semibold">
          <span>{task.priority}</span>
          {task.assignee && (
            <span title={`Assigned to ${task.assignee.full_name}`} className="text-[8px] bg-[#1D2024] border border-white/[0.06] text-[#5BB98C] rounded-full px-1.5 py-0.5 font-bold uppercase">
              {task.assignee.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          )}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button onClick={() => setEditTargetTask(task)} className="text-[#5BB98C] hover:text-[#B7E4C7] font-semibold cursor-pointer">
            Edit
          </button>
          <button onClick={() => handleDeleteTask(task.id)} className="text-[#EB5757] hover:text-red-400 font-semibold cursor-pointer">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
