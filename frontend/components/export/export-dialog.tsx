'use client'

import React, { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Download, FileJson, FileSpreadsheet, FileText, Archive, FileCode } from 'lucide-react'
import { exportService, ExportFormat, DataType } from '@/services/export'

const FORMAT_OPTIONS = [
  { value: 'json' as ExportFormat, label: 'JSON', icon: FileJson, description: 'Structured data format' },
  { value: 'csv' as ExportFormat, label: 'CSV', icon: FileSpreadsheet, description: 'Comma-separated values' },
  { value: 'excel' as ExportFormat, label: 'Excel', icon: FileSpreadsheet, description: 'Microsoft Excel (.xlsx)' },
  { value: 'markdown' as ExportFormat, label: 'Markdown', icon: FileText, description: 'Readable documentation' },
  { value: 'zip' as ExportFormat, label: 'ZIP', icon: Archive, description: 'Complete archive with all formats' },
]

const DATA_TYPE_OPTIONS = [
  { value: 'projects' as DataType, label: 'Projects', description: 'All project data and settings' },
  { value: 'tasks' as DataType, label: 'Tasks', description: 'All tasks with details' },
  { value: 'documents' as DataType, label: 'Documents', description: 'All documentation pages' },
  { value: 'files' as DataType, label: 'Files', description: 'File assets and metadata' },
  { value: 'activities' as DataType, label: 'Activity', description: 'Activity logs and history' },
  { value: 'labels' as DataType, label: 'Labels', description: 'Labels and tags' },
  { value: 'milestones' as DataType, label: 'Milestones', description: 'Project milestones' },
  { value: 'sprints' as DataType, label: 'Sprints', description: 'Sprint data' },
]

interface ExportDialogProps {
  trigger?: React.ReactNode
}

export function ExportDialog({ trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json')
  const [selectedDataTypes, setSelectedDataTypes] = useState<DataType[]>(['projects', 'tasks', 'documents'])
  const [isExporting, setIsExporting] = useState(false)

  const handleDataTypeToggle = (value: DataType) => {
    setSelectedDataTypes(prev => 
      prev.includes(value) 
        ? prev.filter(t => t !== value)
        : [...prev, value]
    )
  }

  const handleSelectAll = () => {
    if (selectedDataTypes.length === DATA_TYPE_OPTIONS.length) {
      setSelectedDataTypes([])
    } else {
      setSelectedDataTypes(DATA_TYPE_OPTIONS.map(opt => opt.value))
    }
  }

  const handleExport = async () => {
    if (selectedDataTypes.length === 0) {
      return
    }

    setIsExporting(true)
    try {
      await exportService.downloadExport(selectedFormat, selectedDataTypes)
      setOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      Export
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Workspace Data</DialogTitle>
          <DialogDescription>
            Select format and data types to export from your workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Export Format</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FORMAT_OPTIONS.map((format) => {
                const Icon = format.icon
                return (
                  <button
                    key={format.value}
                    onClick={() => setSelectedFormat(format.value)}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                      selectedFormat === format.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <Icon className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <div className="font-medium">{format.label}</div>
                      <div className="text-sm text-muted-foreground">{format.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Data Type Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Data Types</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {selectedDataTypes.length === DATA_TYPE_OPTIONS.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DATA_TYPE_OPTIONS.map((type) => (
                <div key={type.value} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-primary/5 transition-colors">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={selectedDataTypes.includes(type.value)}
                    onCheckedChange={() => handleDataTypeToggle(type.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={`type-${type.value}`}
                      className="font-medium cursor-pointer"
                    >
                      {type.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-sm">
              <span className="font-medium">Export Summary:</span> {selectedDataTypes.length} data type(s) as {selectedFormat.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={selectedDataTypes.length === 0 || isExporting}
          >
            {isExporting ? (
              <>
                <FileCode className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
