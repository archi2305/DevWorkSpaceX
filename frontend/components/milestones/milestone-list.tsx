'use client'

import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { milestoneService, Milestone } from '@/services/milestone'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, MoreVertical, Plus, Archive, Trash2, Edit } from 'lucide-react'
import { format } from 'date-fns'

interface MilestoneListProps {
  projectId: string
}

export function MilestoneList({ projectId }: MilestoneListProps) {
  const queryClient = useQueryClient()
  const [showDialog, setShowDialog] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    status: 'Planned'
  })

  const { data: milestones, isLoading } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => milestoneService.getMilestones(projectId)
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => milestoneService.createMilestone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
      setShowDialog(false)
      resetForm()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => milestoneService.updateMilestone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
      setShowDialog(false)
      setEditingMilestone(null)
      resetForm()
    }
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => milestoneService.archiveMilestone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => milestoneService.deleteMilestone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
    }
  })

  const resetForm = () => {
    setFormData({ title: '', description: '', due_date: '', status: 'Planned' })
    setEditingMilestone(null)
  }

  const handleCreate = () => {
    resetForm()
    setShowDialog(true)
  }

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setFormData({
      title: milestone.title,
      description: milestone.description || '',
      due_date: milestone.due_date || '',
      status: milestone.status
    })
    setShowDialog(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingMilestone) {
      updateMutation.mutate({ id: editingMilestone.id, data: formData })
    } else {
      createMutation.mutate({ ...formData, project_id: projectId })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500'
      case 'Active': return 'bg-blue-500'
      case 'Planned': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Loading milestones...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Milestones</h3>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {milestones && milestones.length > 0 ? (
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(milestone.status)}`} />
                    <h4 className="font-medium">{milestone.title}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-muted-foreground">
                      {milestone.status}
                    </span>
                  </div>
                  
                  {milestone.description && (
                    <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {milestone.due_date && (
                      <div className={`flex items-center gap-1 ${isOverdue(milestone.due_date) && milestone.status !== 'Completed' ? 'text-red-400' : ''}`}>
                        <Calendar className="h-4 w-4" />
                        {format(new Date(milestone.due_date), 'MMM dd, yyyy')}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${milestone.progress_percentage}%` }}
                        />
                      </div>
                      <span className="text-xs">{milestone.progress_percentage}%</span>
                    </div>
                    <span className="text-xs">
                      {milestone.completed_tasks}/{milestone.total_tasks} tasks
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(milestone)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => archiveMutation.mutate(milestone.id)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(milestone.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground border border-dashed border-white/10 rounded-lg">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No milestones yet</p>
          <p className="text-sm mt-1">Create your first milestone to track project progress</p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingMilestone ? 'Edit Milestone' : 'Create Milestone'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Milestone title"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Milestone description"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={(e: React.MouseEvent) => { e.preventDefault(); setShowDialog(false); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingMilestone ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
