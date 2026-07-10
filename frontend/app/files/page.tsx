'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Folder,
  File,
  FileImage,
  FileText,
  Upload,
  FolderPlus,
  Trash2,
  Edit,
  Download,
  Search,
  ArrowUp,
  ChevronRight,
  Loader,
  X,
  FileCheck,
  Filter,
  HardDrive
} from 'lucide-react'
import { fileService, FileAssetResponse } from '@/services/file'
import { projectService } from '@/services/project'

export default function FileExplorerPage() {
  const queryClient = useQueryClient()
  
  // Scopes and navigation
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [currentFolderId, setCurrentFolderId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest') // name, newest, size
  
  // Drag & drop highlight state
  const [isDragging, setIsDragging] = useState(false)
  
  // Breadcrumb history tracking
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([])
  
  // Modals / Overlays
  const [previewAsset, setPreviewAsset] = useState<FileAssetResponse | null>(null)
  
  // Load projects for project scope filter
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects()
  })

  // Load files in the current folder context
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['files', selectedProjectId, currentFolderId, searchQuery, sortBy],
    queryFn: () => fileService.getFiles({
      project_id: selectedProjectId || undefined,
      parent_id: currentFolderId || undefined,
      q: searchQuery || undefined,
      sort_by: sortBy
    })
  })

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, projId, parentId }: { file: File; projId?: string; parentId?: string }) =>
      fileService.uploadFile(file, projId, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    }
  })

  // Folder creation mutation
  const folderMutation = useMutation({
    mutationFn: fileService.createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    }
  })

  // Rename asset mutation
  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      fileService.renameAsset(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    }
  })

  // Delete asset mutation
  const deleteMutation = useMutation({
    mutationFn: fileService.deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      setPreviewAsset(null)
    }
  })

  // Handle Drag & Drop Upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files)
      filesArray.forEach((file) => {
        uploadMutation.mutate({
          file,
          projId: selectedProjectId || undefined,
          parentId: currentFolderId || undefined
        })
      })
    }
  }

  // Handle standard file picker selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files)
      filesArray.forEach((file) => {
        uploadMutation.mutate({
          file,
          projId: selectedProjectId || undefined,
          parentId: currentFolderId || undefined
        })
      })
    }
  }

  const handleCreateFolder = () => {
    const name = prompt('Enter folder name:')
    if (!name) return
    folderMutation.mutate({
      name,
      project_id: selectedProjectId || undefined,
      parent_id: currentFolderId || undefined
    })
  }

  const handleRename = (asset: FileAssetResponse) => {
    const name = prompt('Rename asset:', asset.name)
    if (!name || name === asset.name) return
    renameMutation.mutate({ id: asset.id, name })
  }

  const handleDelete = (asset: FileAssetResponse) => {
    if (confirm(`Are you sure you want to delete '${asset.name}'?`)) {
      deleteMutation.mutate(asset.id)
    }
  }

  // Navigation handlers
  const handleFolderClick = (folder: FileAssetResponse) => {
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }])
    setCurrentFolderId(folder.id)
  }

  const handleBreadcrumbClick = (id: string, index: number) => {
    if (id === '') {
      setFolderPath([])
      setCurrentFolderId('')
    } else {
      setFolderPath((prev) => prev.slice(0, index + 1))
      setCurrentFolderId(id)
    }
  }

  // Format file size
  const formatSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
  }

  // Select suitable icon
  const getFileIcon = (asset: FileAssetResponse) => {
    if (asset.is_folder) return <Folder className="h-9 w-9 text-[#5BB98C]" />
    const mime = asset.mime_type || ''
    if (mime.startsWith('image/')) return <FileImage className="h-9 w-9 text-blue-400" />
    if (mime.includes('pdf')) return <FileText className="h-9 w-9 text-[#EB5757]" />
    return <File className="h-9 w-9 text-[#7E848C]" />
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div className="text-left">
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <HardDrive className="h-6 w-6 text-[#5BB98C]" /> Workspace Storage
            </h1>
            <p className="text-xs text-[#A7ADB5] mt-1">Upload, download, or search files and folders.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Project Filter */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-white/[0.06] bg-[#171A1D] text-xs text-[#F5F5F5] outline-none cursor-pointer focus:border-[#5BB98C]"
            >
              <option value="">All Projects Files</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleCreateFolder}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.06] bg-[#1D2024] hover:bg-[#23272B] text-xs font-semibold text-[#F5F5F5] transition-colors cursor-pointer"
            >
              <FolderPlus className="h-4 w-4" /> New Folder
            </button>

            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-xs font-bold text-[#111315] cursor-pointer transition-colors shadow-md">
              <Upload className="h-4 w-4" /> Upload File
              <input type="file" onChange={handleFileChange} multiple className="hidden" />
            </label>
          </div>
        </div>

        {/* Toolbar Search / Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-xs text-[#7E848C] font-medium bg-[#171A1D] px-3 py-1.5 rounded-xl border border-white/[0.06] flex-wrap max-w-full">
            <button
              onClick={() => handleBreadcrumbClick('', -1)}
              className="hover:text-[#F5F5F5] transition-colors"
            >
              Root
            </button>
            {folderPath.map((path, idx) => (
              <React.Fragment key={path.id}>
                <ChevronRight className="h-3 w-3" />
                <button
                  onClick={() => handleBreadcrumbClick(path.id, idx)}
                  className="hover:text-[#F5F5F5] transition-colors font-semibold truncate max-w-[120px]"
                >
                  {path.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7E848C]" />
              <input
                type="text"
                placeholder="Search file names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-56 rounded-xl border border-white/[0.06] bg-[#171A1D] text-xs text-[#F5F5F5] placeholder-[#7E848C] outline-none focus:border-[#5BB98C]"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-white/[0.06] bg-[#171A1D] text-xs text-[#F5F5F5] outline-none cursor-pointer focus:border-[#5BB98C]"
            >
              <option value="newest">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
            </select>
          </div>
        </div>

        {/* Drag & Drop File Container */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`min-h-[50vh] rounded-2xl border-2 border-dashed p-6 transition-all duration-300 relative ${
            isDragging
              ? 'border-[#5BB98C] bg-[#5BB98C]/5'
              : 'border-white/[0.06] bg-[#171A1D]/30'
          }`}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-[#111315]/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center pointer-events-none z-20">
              <Upload className="h-10 w-10 text-[#5BB98C] animate-bounce mb-2" />
              <p className="text-sm font-bold text-white">Drop files anywhere to upload</p>
              <p className="text-xs text-[#7E848C] mt-1">Files will automatically save to current folder</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader className="h-7 w-7 text-[#5BB98C] animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Folder className="h-12 w-12 text-[#7E848C]/40 mb-3" />
              <h3 className="text-sm font-semibold text-white">This folder is empty</h3>
              <p className="text-xs text-[#A7ADB5] mt-1 max-w-xs">
                Drag and drop files here, or use the toolbar buttons to upload files and structure folders.
              </p>
            </div>
          ) : (
            /* Grid Explorer */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative flex flex-col justify-between p-4 rounded-xl border border-white/[0.04] bg-[#171A1D] hover:bg-[#1D2024] hover:border-[#5BB98C]/20 transition-all cursor-pointer select-none"
                  onClick={() => {
                    if (asset.is_folder) {
                      handleFolderClick(asset)
                    } else {
                      setPreviewAsset(asset)
                    }
                  }}
                >
                  {/* File icon / details */}
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-[#1D2024]/80 rounded-xl group-hover:bg-[#23272B] transition-colors">
                      {getFileIcon(asset)}
                    </div>
                    <div className="w-full">
                      <p className="text-xs font-semibold text-[#F5F5F5] truncate max-w-full" title={asset.name}>
                        {asset.name}
                      </p>
                      <p className="text-[10px] text-[#7E848C] mt-0.5">
                        {asset.is_folder ? 'Folder' : formatSize(asset.size)}
                      </p>
                    </div>
                  </div>

                  {/* Actions overlay dropdown */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!asset.is_folder && (
                      <a
                        href={fileService.getDownloadUrl(asset.id)}
                        download={asset.name}
                        onClick={(e) => e.stopPropagation()}
                        title="Download file"
                        className="p-1 rounded bg-[#1D2024] hover:bg-[#23272B] text-[#A7ADB5] hover:text-[#F5F5F5]"
                      >
                        <Download className="h-3 w-3" />
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRename(asset)
                      }}
                      title="Rename"
                      className="p-1 rounded bg-[#1D2024] hover:bg-[#23272B] text-[#A7ADB5] hover:text-[#F5F5F5] cursor-pointer"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(asset)
                      }}
                      className="p-1 rounded bg-[#1D2024] hover:bg-red-500/10 text-[#7E848C] hover:text-[#EB5757] cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload progress indicator */}
        {uploadMutation.isPending && (
          <div className="fixed bottom-6 right-6 bg-[#171A1D] border border-white/[0.06] rounded-xl p-4 shadow-2xl flex items-center gap-3 z-30">
            <Loader className="h-4 w-4 text-[#5BB98C] animate-spin" />
            <span className="text-xs text-white font-medium">Uploading file asset to storage...</span>
          </div>
        )}

        {/* Media Preview Lightbox Modal */}
        {previewAsset && (
          <div className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#171A1D] border border-white/[0.06] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-[#1D2024]/40">
                <div className="text-left min-w-0">
                  <h3 className="text-sm font-bold text-white truncate max-w-md">{previewAsset.name}</h3>
                  <p className="text-[10px] text-[#A7ADB5] mt-0.5">
                    {previewAsset.mime_type} • {formatSize(previewAsset.size)}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewAsset(null)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#7E848C] hover:text-[#F5F5F5] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Preview Body */}
              <div className="p-6 flex-1 flex items-center justify-center min-h-[300px] bg-[#111315]/60">
                {previewAsset.mime_type?.startsWith('image/') ? (
                  <img
                    src={fileService.getDownloadUrl(previewAsset.id)}
                    alt={previewAsset.name}
                    className="max-w-full max-h-[400px] rounded-xl object-contain border border-white/[0.06]"
                  />
                ) : previewAsset.mime_type === 'application/pdf' ? (
                  <iframe
                    src={fileService.getDownloadUrl(previewAsset.id)}
                    className="w-full h-[400px] rounded-xl border border-white/[0.06]"
                  />
                ) : (
                  <div className="text-center space-y-3">
                    <File className="h-12 w-12 text-[#7E848C] mx-auto animate-pulse" />
                    <p className="text-xs text-[#A7ADB5] max-w-xs mx-auto">
                      No direct visual preview supported for this file type. You can download the file to open it locally.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions footer */}
              <div className="p-4 bg-[#1D2024]/40 border-t border-white/[0.06] flex items-center justify-end gap-2.5">
                <button
                  onClick={() => handleDelete(previewAsset)}
                  className="px-3.5 py-1.5 rounded-xl border border-white/[0.06] hover:bg-red-500/10 text-xs text-[#EB5757] font-semibold cursor-pointer"
                >
                  Delete Asset
                </button>
                <a
                  href={fileService.getDownloadUrl(previewAsset.id)}
                  download={previewAsset.name}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-xs font-bold text-[#111315] transition-colors"
                >
                  <Download className="h-4.5 w-4.5" /> Download File
                </a>
              </div>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  )
}
