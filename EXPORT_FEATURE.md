# Workspace Export Feature

## Overview

The Workspace Export feature allows users to export their workspace data in multiple formats (JSON, CSV, Excel, Markdown, ZIP) with dynamic selection of data types.

## Features

### Export Formats

- **JSON**: Structured data format with full field details
- **CSV**: Comma-separated values with section headers for multiple data types
- **Excel**: Microsoft Excel (.xlsx) with multiple sheets, styled headers, and auto-adjusted column widths
- **Markdown**: Human-readable documentation format with tables and sections
- **ZIP**: Complete archive containing all data types in both JSON and CSV formats, plus a comprehensive README.md

### Data Types

Users can selectively export the following data types:

- **Projects**: All project data including settings, status, priority, progress, and metadata
- **Tasks**: Complete task information with assignees, due dates, story points, and relationships
- **Documents**: Documentation pages with content, versions, and ownership
- **Files**: File assets and metadata including size, type, and folder structure
- **Activities**: Activity logs and history tracking
- **Labels**: Tags and labels for categorization
- **Milestones**: Project milestones with status and due dates
- **Sprints**: Sprint data including dates and status

## Backend API

### Endpoint

```
GET /workspace/export
```

### Query Parameters

- `format` (required): Export format - `json`, `csv`, `excel`, `markdown`, `zip`
- `data_types` (optional): Comma-separated list of data types - `projects,tasks,documents,files,activities,labels,milestones,sprints`

### Example Requests

```bash
# Export all data as JSON
GET /workspace/export?format=json

# Export only projects and tasks as Excel
GET /workspace/export?format=excel&data_types=projects,tasks

# Export everything as ZIP
GET /workspace/export?format=zip
```

### Response

All formats return a file download with appropriate headers:

- JSON: `application/json`
- CSV: `text/csv`
- Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Markdown: `text/markdown`
- ZIP: `application/zip`

Filenames include timestamp: `workspace_export_YYYYMMDD_HHMMSS.{extension}`

## Frontend Components

### ExportDialog Component

Located at: `frontend/components/export/export-dialog.tsx`

A React component that provides a user-friendly interface for:

1. Selecting export format with visual format cards
2. Choosing data types with checkboxes
3. Select/deselect all functionality
4. Export summary display
5. Loading state during export

#### Usage

```tsx
import { ExportDialog } from '@/components/export/export-dialog'

// Default trigger button
<ExportDialog />

// Custom trigger
<ExportDialog trigger={<YourCustomButton />} />
```

### Export Service

Located at: `frontend/services/export.ts`

TypeScript service with typed interfaces:

```typescript
export type ExportFormat = 'json' | 'csv' | 'excel' | 'markdown' | 'zip'
export type DataType = 'projects' | 'tasks' | 'documents' | 'files' | 'activities' | 'labels' | 'milestones' | 'sprints'

exportService.downloadExport(format: ExportFormat, dataTypes?: DataType[]): Promise<void>
```

## Data Extraction

### Comprehensive Field Mapping

The backend extracts comprehensive data from each model:

#### Projects
- Basic info: id, name, slug, description
- Visual: icon, cover_image, color
- Status: status, priority, progress
- Flags: is_favorite, is_pinned, is_archived, is_template, is_deleted
- Relationships: owner_id, workspace_id
- Dates: due_date, created_at, updated_at
- Advanced: kanban_columns, visibility

#### Tasks
- Basic: id, title, description, status
- Planning: due_date, priority, story_points, estimated_time
- Relationships: assignee_id, project_id, sprint_id, parent_id, milestone_id, release_id
- Flags: completed, is_archived, is_deleted
- Attachments: attachments (JSON array)
- Dates: deleted_at, created_at, updated_at

#### Documents
- Content: id, title, content, version
- Relationships: project_id, parent_id, owner_id
- Flags: is_favorite
- Dates: created_at, updated_at

#### Files
- File info: id, name, file_path, mime_type, size
- Structure: is_folder, parent_id
- Relationships: project_id, owner_id
- Dates: created_at, updated_at

#### Activities
- Action: id, user_id, action, details
- Target: target_type, target_name
- Date: created_at

## Excel Export Features

The Excel export uses `openpyxl` to create professional spreadsheets:

- **Multiple Sheets**: Each data type gets its own sheet
- **Styled Headers**: Bold white text on blue background
- **Auto-width**: Columns auto-adjust to content (max 50 chars)
- **Data Handling**: Complex types (lists/dicts) are JSON-stringified
- **Null Handling**: Empty cells for null values

## ZIP Export Structure

ZIP exports contain:

```
workspace_export_YYYYMMDD_HHMMSS.zip
├── projects.json
├── projects.csv
├── tasks.json
├── tasks.csv
├── documents.json
├── documents.csv
├── files.json
├── files.csv
├── activities.json
├── activities.csv
├── labels.json
├── labels.csv
├── milestones.json
├── milestones.csv
├── sprints.json
├── sprints.csv
├── README.md
└── full_export.json
```

## Installation

### Backend Dependencies

```bash
pip install openpyxl==3.1.5
```

Added to `backend/requirements.txt`

### Frontend Dependencies

```bash
npm install @radix-ui/react-dialog @radix-ui/react-checkbox @radix-ui/react-label
```

Added to `frontend/package.json`

## Usage Example

### From Workspace Page

1. Navigate to `/workspace`
2. Click the "Export" button in the header
3. Select desired format (JSON, CSV, Excel, Markdown, or ZIP)
4. Choose data types to include
5. Click "Export" to download

### Programmatic Usage

```typescript
import { exportService } from '@/services/export'

// Export specific data types
await exportService.downloadExport('excel', ['projects', 'tasks'])

// Export everything
await exportService.downloadExport('zip')
```

## File Locations

- **Backend API**: `backend/app/api/export.py`
- **Frontend Component**: `frontend/components/export/export-dialog.tsx`
- **Frontend Service**: `frontend/services/export.ts`
- **UI Components**: `frontend/components/ui/dialog.tsx`, `frontend/components/ui/checkbox.tsx`, `frontend/components/ui/label.tsx`
- **Workspace Page**: `frontend/app/workspace/page.tsx`

## Future Enhancements

Potential improvements:

- [ ] Add filtering options (date ranges, status filters)
- [ ] Support for custom field selection
- [ ] Scheduled/automated exports
- [ ] Export templates
- [ ] Incremental exports (only changed data)
- [ ] Export history and download links
- [ ] Bulk operations for multiple workspaces
