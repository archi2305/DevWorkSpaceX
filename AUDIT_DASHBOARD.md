# Audit Dashboard Feature

## Overview

The Audit Dashboard provides comprehensive tracking and monitoring of workspace activities, enabling administrators to review user actions, permission changes, and data modifications across the platform.

## Features

### Tracked Categories

The audit system tracks activities across five main categories:

- **Logins**: User authentication events, login attempts, and session management
- **Permission Changes**: Role modifications, permission grants/revokes, and access control updates
- **Project Changes**: Project creation, updates, deletions, and configuration changes
- **Task Changes**: Task creation, status updates, assignments, and modifications
- **Document Changes**: Document creation, edits, deletions, and access modifications

### Event Types

Each category supports granular event type tracking:

- **create**: New resource creation
- **update**: Modifications to existing resources
- **delete**: Resource removal
- **view**: Access/view events
- **export**: Data export activities
- **login**: Authentication events

### Filtering Capabilities

The dashboard provides comprehensive filtering options:

- **Date Range**: Filter logs by start and end dates
- **User Filter**: View activities by specific users
- **Category Filter**: Filter by activity category
- **Event Type Filter**: Filter by specific event types
- **Target Type Filter**: Filter by resource type (Project, Task, Document, etc.)
- **Action Search**: Search by action text

### Export Functionality

Export filtered audit logs to CSV format with all available fields for external analysis and compliance reporting.

## Backend API

### Enhanced Activity Model

The `ActivityLog` model has been enhanced with audit-specific fields:

```python
class ActivityLog(Base):
    id: UUID
    user_id: UUID
    category: str  # login, permission, project, task, document
    event_type: str  # create, update, delete, view, export
    action: str
    details: str
    target_type: str
    target_name: str
    target_id: UUID
    ip_address: str
    user_agent: str
    metadata: dict
    created_at: datetime
```

### API Endpoints

#### Get Audit Logs

```
GET /activities/audit
```

**Query Parameters:**
- `start_date` (optional): ISO format start date
- `end_date` (optional): ISO format end date
- `user_id` (optional): Filter by user UUID
- `category` (optional): Filter by category
- `event_type` (optional): Filter by event type
- `target_type` (optional): Filter by target type
- `action` (optional): Search by action text
- `limit` (optional): Max results (default: 100, max: 500)
- `offset` (optional): Number of results to skip

**Response:** Array of `ActivityResponse` objects

#### Get Audit Statistics

```
GET /activities/audit/stats
```

**Query Parameters:**
- `start_date` (optional): ISO format start date
- `end_date` (optional): ISO format end date

**Response:**
```json
{
  "total_logs": 1234,
  "category_counts": {
    "login": 45,
    "permission": 12,
    "project": 234,
    "task": 567,
    "document": 376
  },
  "event_type_counts": {
    "create": 234,
    "update": 567,
    "delete": 45,
    "view": 345,
    "export": 23,
    "login": 20
  }
}
```

#### Export Audit Logs

```
GET /activities/audit/export
```

**Query Parameters:** Same as `/activities/audit`

**Response:** CSV file download with all filtered logs

## Frontend Components

### Audit Dashboard Page

Located at: `frontend/app/audit/page.tsx`

Features:
- Real-time statistics cards showing total logs and category breakdowns
- Comprehensive filter panel with date range, category, event type, and search
- Interactive logs table with user information, timestamps, and action details
- Export functionality with loading states
- Refresh capabilities for real-time monitoring

### Audit Service

Located at: `frontend/services/audit.ts`

TypeScript service with typed interfaces:

```typescript
interface AuditLogResponse {
  id: string
  user_id: string
  category: string | null
  event_type: string | null
  action: string
  details: string
  target_type: string | null
  target_name: string | null
  target_id: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, any> | null
  created_at: string
  user: {
    id: string
    full_name: string
    email: string
    profile_image: string | null
  }
}

interface AuditLogFilters {
  start_date?: string
  end_date?: string
  user_id?: string
  category?: string
  event_type?: string
  target_type?: string
  action?: string
  limit?: number
  offset?: number
}
```

**Service Methods:**
- `getAuditLogs(filters)`: Retrieve filtered audit logs
- `getAuditStats(filters)`: Get audit statistics
- `exportAuditLogs(filters)`: Export logs to CSV

## Database Migration

A migration file has been created to enhance the activities table:

**File:** `backend/migrations/versions/enhance_activity_logs_for_audit.py`

**Changes:**
- Added `category` column (String, indexed)
- Added `event_type` column (String, indexed)
- Added `target_id` column (UUID)
- Added `ip_address` column (String)
- Added `user_agent` column (String)
- Added `metadata` column (JSON)
- Added indexes for `category`, `event_type`, and `created_at`

**To apply migration:**
```bash
cd backend
alembic upgrade head
```

## Usage

### Accessing the Audit Dashboard

1. Navigate to `/audit` in the application
2. The dashboard loads with recent activity logs and statistics
3. Use filters to narrow down specific activities
4. Click "Export" to download filtered logs as CSV

### Programmatic Usage

```typescript
import { auditService } from '@/services/audit'

// Get recent audit logs
const logs = await auditService.getAuditLogs({
  limit: 50,
  category: 'project'
})

// Get statistics for date range
const stats = await auditService.getAuditStats({
  start_date: '2026-01-01',
  end_date: '2026-12-31'
})

// Export filtered logs
await auditService.exportAuditLogs({
  category: 'permission',
  event_type: 'update',
  start_date: '2026-07-01'
})
```

### API Usage Examples

```bash
# Get all audit logs
curl -X GET "http://localhost:8000/activities/audit" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by category and date range
curl -X GET "http://localhost:8000/activities/audit?category=login&start_date=2026-07-01&end_date=2026-07-14" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get statistics
curl -X GET "http://localhost:8000/activities/audit/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Export logs
curl -X GET "http://localhost:8000/activities/audit/export?category=project" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o audit_logs.csv
```

## File Locations

- **Backend Model**: `backend/app/models/activity.py`
- **Backend API**: `backend/app/api/activity.py`
- **Backend Schema**: `backend/app/schemas/activity.py`
- **Migration**: `backend/migrations/versions/enhance_activity_logs_for_audit.py`
- **Frontend Page**: `frontend/app/audit/page.tsx`
- **Frontend Service**: `frontend/services/audit.ts`
- **Navigation**: `frontend/components/layout/sidebar.tsx`

## Security Considerations

- All audit endpoints require authentication
- IP addresses and user agents are captured for security monitoring
- Audit logs are immutable and cannot be deleted through the API
- Export functionality respects the same permission model as viewing logs
- Sensitive data in metadata should be handled appropriately

## Performance Considerations

- Indexes on `category`, `event_type`, and `created_at` ensure efficient filtering
- Pagination via `limit` and `offset` parameters prevents large result sets
- Statistics endpoint uses efficient count queries
- CSV export is limited to 10,000 records per export

## Future Enhancements

Potential improvements:

- [ ] Real-time WebSocket updates for live monitoring
- [ ] Alert rules for suspicious activity patterns
- [ ] Advanced analytics and trend visualization
- [ ] Integration with SIEM systems
- [ ] Custom retention policies
- [ ] Audit log archiving for long-term storage
- [ ] Role-based access control for audit viewing
- [ ] Comparison views for before/after states
- [ ] Geolocation tracking for IP addresses
- [ ] Anomaly detection and automated alerts
