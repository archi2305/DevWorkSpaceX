# DevWorkspace X Architecture Documentation

## System Overview

DevWorkspace X is a comprehensive workspace management SaaS platform built with a modern microservices architecture. The system provides project management, task tracking, collaboration tools, and advanced features like audit logging, export capabilities, and CI/CD automation.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            User Layer                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Web App    │  │  Mobile App  │  │   CLI Tools  │  │  Third Party │ │
│  │  (Next.js)   │  │  (React Native)│   (Python)     │  │   Integrations│ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼──────────────────┼──────────────────┼──────────────────┼───────┘
          │                  │                  │                  │
┌─────────┴──────────────────┴──────────────────┴──────────────────┴───────┐
│                         Presentation Layer                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                    NGINX Reverse Proxy                               │ │
│  │         (SSL Termination, Load Balancing, Static Files)              │ │
│  └──────────────────────────┬───────────────────────────────────────────┘ │
└─────────────────────────────┼────────────────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
┌─────────┴─────────┐                   ┌─────────┴─────────┐
│   Frontend Layer  │                   │   Backend Layer   │
│  ┌───────────────┐│                   │  ┌───────────────┐│
│  │  Next.js App  ││                   │  │  FastAPI App   ││
│  │  (React + TS) ││                   │  │  (Python 3.11) ││
│  │  - SPA        ││                   │  │  - REST API   ││
│  │  - SSR        ││                   │  │  - WebSocket  ││
│  │  - Static     ││                   │  │  - Auth       ││
│  └───────┬───────┘│                   │  └───────┬───────┘│
└──────────┼────────┘                   └──────────┼────────┘
           │                                       │
┌──────────┴───────────────────────────────────────┴──────────┐
│                      Application Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Auth    │  │ Projects │  │  Tasks   │  │  Files   │  │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Audit   │  │  Export  │  │  AI      │  │  Webhook │  │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└──────────────────────┬─────────────────────────────────────┘
                       │
┌──────────────────────┴─────────────────────────────────────┐
│                      Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │    Redis     │  │  S3 Storage  │     │
│  │  (Primary)   │  │   (Cache)    │  │  (Files)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │    Redis     │  │  CloudFront  │     │
│  │  (Replica)   │  │   (Session)  │  │    (CDN)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Pages      │  │  Components  │  │   Hooks      │     │
│  │              │  │              │  │              │     │
│  │ - /          │  │ - Layout     │  │ - useAuth    │     │
│  │ - /projects  │  │ - UI Libs    │  │ - useQuery   │     │
│  │ - /tasks     │  │ - Forms      │  │ - useCollab  │     │
│  │ - /audit     │  │ - Charts     │  │ - useSocket  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Services   │  │   State     │  │   Utils      │     │
│  │              │  │              │  │              │     │
│  │ - api.ts     │  │ - Zustand   │√ │ - helpers    │     │
│  │ - audit.ts   │  │ - Context   │  │ - validators │     │
│  │ - export.ts  │  │ - Redux     │  │ - formatters │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   API Routes │  │  Middleware  │  │  Dependencies │     │
│  │              │  │              │  │              │     │
│  │ - auth       │  │ - CORS       │  │ - get_db     │     │
│  │ - users      │  │ - Auth       │  │ - get_user   │     │
│  │ - projects   │  │ - Logging    │  │ - get_redis  │     │
│  │ - tasks      │  │ - Rate Limit │  │ - get_s3     │     │
│  │ - audit      │  │ - Errors     │  │              │     │
│  │ - export     │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Services   │  │   Models     │  │   Schemas    │     │
│  │              │  │              │  │              │     │
│  │ - auth       │  │ - User       │  │ - User       │     │
│  │ - project    │  │ - Project    │  │ - Project    │     │
│  │ - task       │  │ - Task       │  │ - Task       │     │
│  │ - audit      │  │ - Activity   │  │ - Activity   │     │
│  │ - export     │  │ - Document   │  │ - Document   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### Request Flow

```
User Request
    │
    ▼
┌─────────────┐
│   NGINX     │ (SSL Termination, Routing)
└──────┬──────┘
       │
       ├──────────┐
       │          │
       ▼          ▼
┌──────────┐  ┌──────────┐
│ Frontend │  │ Backend  │
│ (Next.js)│  │ (FastAPI)│
└────┬─────┘  └────┬─────┘
     │            │
     │            ▼
     │      ┌──────────┐
     │      │  Auth    │ (JWT Validation)
     │      └────┬─────┘
     │           │
     │           ▼
     │      ┌──────────┐
     │      │ Business │ (Service Layer)
     │      │  Logic   │
     │      └────┬─────┘
     │           │
     │           ▼
     │      ┌──────────┐
     │      │  Data    │ (ORM/Cache)
     │      │  Access  │
     │      └────┬─────┘
     │           │
     │           ├──────────┐
     │           │          │
     │           ▼          ▼
     │      ┌──────────┐  ┌──────────┐
     │      │PostgreSQL│  │  Redis   │
     │      └──────────┘  └──────────┘
     │
     ▼
┌──────────┐
│ Response │
└──────────┘
```

### WebSocket Flow

```
Client
    │
    ▼ (WebSocket Connection)
┌─────────────┐
│   NGINX     │ (WebSocket Proxy)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  FastAPI    │ (WebSocket Endpoint)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Redis Pub  │ (Message Broker)
│   /Sub      │
└──────┬──────┘
       │
       ├──────────┐
       │          │
       ▼          ▼
┌──────────┐  ┌──────────┐
│ Clients  │  │ Services │
└──────────┘  └──────────┘
```

## Database Architecture

### Schema Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Users     │  │  Workspaces  │  │  Workspace   │     │
│  │              │  │              │  │  Members     │     │
│  │ - id         │  │ - id         │  │ - id         │     │
│  │ - email      │  │ - name       │  │ - user_id    │     │
│  │ - password   │  │ - slug       │  │ - workspace  │     │
│  │ - name       │  │ - settings   │  │ - role       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Projects    │  │    Tasks     │  │  Documents   │     │
│  │              │  │              │  │              │     │
│  │ - id         │  │ - id         │  │ - id         │     │
│  │ - name       │  │ - title      │  │ - title      │     │
│  │ - workspace  │  │ - project    │  │ - project    │     │
│  │ - owner      │  │ - assignee   │  │ - owner      │     │
│  │ - status     │  │ - status     │  │ - content    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Activities   │  │  FileAssets  │  │  Labels      │     │
│  │              │  │              │  │              │     │
│  │ - id         │  │ - id         │  │ - id         │     │
│  │ - user       │  │ - name       │  │ - name       │     │
│  │ - action     │  │ - project    │  │ - color      │     │
│  │ - category   │  │ - path       │  │ - workspace  │     │
│  │ - metadata   │  │ - size       │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Sprints     │  │ Milestones   │  │  Integrations│     │
│  │              │  │              │  │              │     │
│  │ - id         │  │ - id         │  │ - id         │     │
│  │ - name       │  │ - name       │  │ - type       │     │
│  │ - project    │  │ - project    │  │ - config     │     │
│  │ - dates      │  │ - due_date   │  │ - status     │     │
│  │ - status     │  │ - status     │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Relationships

```
Users ───< Workspace_Members >── Workspaces
  │                │                   │
  │                │                   ├── Projects
  │                │                   │    ├── Tasks
  │                │                   │    ├── Documents
  │                │                   │    ├── FileAssets
  │                │                   │    ├── Sprints
  │                │                   │    └── Milestones
  │                │                   │
  │                │                   ├── Labels
  │                │                   │
  │                │                   └── Integrations
  │                │
  └── Activities (Audit Logs)
```

## Security Architecture

### Authentication Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. Login Request
     ▼
┌──────────┐
│  Backend │
└────┬─────┘
     │
     │ 2. Validate Credentials
     ▼
┌──────────┐
│PostgreSQL│
└────┬─────┘
     │
     │ 3. User Data
     ▼
┌──────────┐
│  Backend │
└────┬─────┘
     │
     │ 4. Generate JWT
     ▼
┌──────────┐
│  Client  │ (Store JWT)
└────┬─────┘
     │
     │ 5. API Request + JWT
     ▼
┌──────────┐
│  Backend │
└────┬─────┘
     │
     │ 6. Validate JWT
     ▼
┌──────────┐
│  Access  │ (Granted/Denied)
└──────────┘
```

### Authorization Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Role-Based Access Control                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Owner     │  │    Admin     │  │   Member     │     │
│  │              │  │              │  │              │     │
│  │ - Full Access│  │ - Manage     │  │ - View Only  │     │
│  │ - Settings   │  │ - Projects   │  │ - Tasks      │     │
│  │ - Billing    │  │ - Tasks      │  │ - Comments   │     │
│  │ - Members    │  │ - Members    │  │ - Limited    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Viewer     │  │   Guest     │  │  System      │     │
│  │              │  │              │  │              │     │
│  │ - Read Only  │  │ - Limited    │  │ - Full Access│     │
│  │ - Public     │  │ - Temporary  │  │ - Internal   │     │
│  │ - No Edit    │  │ - Invited    │  │ - Admin      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

### Docker Compose Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Host                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │    Redis     │  │   Backend    │     │
│  │  Container   │  │  Container   │  │  Container   │     │
│  │  :5432       │  │  :6379       │  │  :8000       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Frontend    │  │    NGINX     │  │   Volumes    │     │
│  │  Container   │  │  Container   │  │              │     │
│  │  :3000       │  │  :80/:443    │  │ - postgres   │     │
│  └──────────────┘  └──────────────┘  │ - redis      │     │
│                                    │ - uploads    │     │
│                                    │ - logs       │     │
│                                    └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### AWS ECS Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                       AWS Cloud                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Route 53    │  │  CloudFront  │  │     ALB      │     │
│  │  (DNS)       │  │    (CDN)     │  │  (Load Bal.) │     │
│  └──────────────┘  └──────────────┘  └──────┬───────┘     │
│                                          │                   │
│  ┌──────────────┐  ┌──────────────┐      │                   │
│  │  VPC         │  │  Security    │      │                   │
│  │  - Public    │  │  Groups      │      │                   │
│  │  - Private   │  └──────────────┘      │                   │
│  └──────────────┘                        │                   │
│                                          │                   │
│  ┌──────────────┐  ┌──────────────┐      │                   │
│  │   ECS        │  │   Fargate    │◄─────┘                   │
│  │  Cluster     │  │  Tasks       │                         │
│  │              │  │              │                         │
│  │ - Frontend   │  │ - Backend    │                         │
│  │ - Backend    │  │ - Frontend   │                         │
│  └──────┬───────┘  └──────────────┘                         │
│         │                                                   │
│         ├──────────┐                                        │
│         │          │                                        │
│         ▼          ▼                                        │
│  ┌──────────┐  ┌──────────┐                                │
│  │   RDS    │  │ElastiCache│                                │
│  │PostgreSQL│  │  Redis   │                                │
│  └──────────┘  └──────────┘                                │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────┐                                                │
│  │    S3    │                                                │
│  │  Files   │                                                │
│  └──────────┘                                                │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ CloudWatch   │  │ Secrets Mgr  │  │ CloudTrail   │     │
│  │  (Logs)      │  │  (Secrets)   │  │  (Audit)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## CI/CD Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Push/PR    │  │   Trigger    │  │   Workflow   │     │
│  │   Event      │  │   Pipeline   │  │   Start      │     │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘     │
│         │                                │                   │
│         ▼                                ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Checkout   │  │   Setup      │  │   Install    │     │
│  │   Code       │  │   Env        │  │   Deps       │     │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘     │
│         │                                │                   │
│         └──────────┬─────────────────────┘                   │
│                    │                                         │
│                    ▼                                         │
│          ┌──────────────┐                                   │
│          │     Test     │                                   │
│          │  - Backend   │                                   │
│          │  - Frontend  │                                   │
│          │  - Lint      │                                   │
│          └──────┬───────┘                                   │
│                 │                                         │
│                 ▼                                         │
│          ┌──────────────┐                                   │
│          │     Build     │                                   │
│          │  - Docker     │                                   │
│          │  - Images     │                                   │
│          └──────┬───────┘                                   │
│                 │                                         │
│                 ▼                                         │
│          ┌──────────────┐                                   │
│          │     Push     │                                   │
│          │  - Registry   │                                   │
│          │  - Tags       │                                   │
│          └──────┬───────┘                                   │
│                 │                                         │
│                 ▼                                         │
│          ┌──────────────┐                                   │
│          │   Deploy     │                                   │
│          │  - AWS ECS   │                                   │
│          │  - Migrations│                                   │
│          │  - Health     │                                   │
│          └──────┬───────┘                                   │
│                 │                                         │
│                 ▼                                         │
│          ┌──────────────┐                                   │
│          │   Notify     │                                   │
│          │  - Slack     │                                   │
│          │  - Email     │                                   │
│          └──────────────┘                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring Stack                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Application │  │  Container   │  │  Infra       │     │
│  │  Metrics     │  │  Metrics     │  │  Metrics     │     │
│  │              │  │              │  │              │     │
│  │ - Response   │  │ - CPU        │  │ - Network    │     │
│  │ - Errors     │  │ - Memory     │  │ - Disk       │     │
│  │ - Requests   │  │ - Network    │  │ - Load       │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                │                │                   │
│         └────────────────┴────────────────┘                   │
│                           │                                   │
│                           ▼                                   │
│                  ┌──────────────┐                             │
│                  │  CloudWatch  │                             │
│                  │  (Metrics)   │                             │
│                  └──────┬───────┘                             │
│                         │                                    │
│                         ├──────────┐                          │
│                         │          │                          │
│                         ▼          ▼                          │
│                  ┌──────────┐  ┌──────────┐                 │
│                  │ Alarms   │  │ Dashboards│                 │
│                  └────┬─────┘  └────┬─────┘                 │
│                       │            │                          │
│                       └──────┬─────┘                          │
│                              ▼                               │
│                    ┌──────────────┐                           │
│                    │  SNS Topic   │                           │
│                    │  (Alerts)    │                           │
│                    └──────┬───────┘                           │
│                           │                                   │
│                           ▼                                   │
│                    ┌──────────────┐                           │
│                    │  Slack/Email │                           │
│                    │  Notification│                           │
│                    └──────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: Zustand, React Context
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0
- **Cache**: Redis 7
- **Authentication**: JWT (python-jose)
- **Validation**: Pydantic
- **File Processing**: openpyxl (Excel)
- **Logging**: python-json-logger

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: NGINX
- **CI/CD**: GitHub Actions
- **Cloud Provider**: AWS
- **Container Orchestration**: ECS Fargate
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis
- **Storage**: S3
- **CDN**: CloudFront
- **Monitoring**: CloudWatch
- **Secrets**: AWS Secrets Manager

## Performance Considerations

### Database Optimization
- Indexed columns for frequently queried fields
- Connection pooling with SQLAlchemy
- Read replicas for scaling
- Query optimization with EXPLAIN ANALYZE

### Caching Strategy
- Redis for session storage
- Application-level caching
- CDN for static assets
- Browser caching headers

### Scalability
- Horizontal scaling with ECS
- Auto-scaling based on CPU/memory
- Load balancing with ALB
- Database read replicas

## Security Considerations

### Data Protection
- Encryption at rest (RDS, S3)
- Encryption in transit (TLS)
- Secrets management (AWS Secrets Manager)
- Regular security audits

### Access Control
- Role-based access control (RBAC)
- JWT authentication with expiration
- API rate limiting
- IP whitelisting

### Compliance
- Audit logging for all actions
- Data retention policies
- GDPR compliance features
- SOC 2 readiness

## Disaster Recovery

### Backup Strategy
- Automated daily backups
- Point-in-time recovery (RDS)
- Cross-region replication
- Regular backup testing

### High Availability
- Multi-AZ deployment
- Load balancing
- Auto-scaling
- Health checks

### Recovery Procedures
- Documented runbooks
- Regular disaster recovery drills
- Team training
- Communication plans

## Future Enhancements

### Planned Improvements
- [ ] GraphQL API
- [ ] Microservices architecture
- [ ] Event-driven architecture
- [ ] Real-time collaboration
- [ ] Mobile applications
- [ ] Advanced analytics
- [ ] Machine learning features
- [ ] Multi-tenant architecture
- [ ] Edge computing
- [ ] Serverless components

### Scalability Roadmap
- [ ] Database sharding
- [ ] Geographic distribution
- [ ] Advanced caching layers
- [ ] CDN optimization
- [ ] Performance monitoring
