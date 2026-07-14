# Deployment Guide

## Included Production Assets

- `backend/Dockerfile` for the FastAPI API.
- `frontend/Dockerfile` for the standalone Next.js app.
- `docker-compose.yml` for local/containerized operation.
- `docker-compose.prod.yml` for image-based production runtime configuration.
- `nginx/nginx.conf` for reverse proxy, rate limiting, static caching, health checks, and WebSockets.
- `.env.example` and `.env.production` templates for environment management.
- `.github/workflows/ci-cd.yml` for test, build, publish, deploy, migration, and health-check automation.
- `/health` backend endpoint and `/api/health` frontend endpoint.
- `backend/app/core/logging.py` for structured JSON logging.

## Local Docker Run

1. Create an environment file:

   ```bash
   cp .env.example .env
   ```

2. Replace all development secrets in `.env`, especially `SECRET_KEY`, `JWT_SECRET_KEY`, and database credentials.

3. Build and start the stack:

   ```bash
   docker compose up --build
   ```

4. Verify services:

   ```bash
   curl http://localhost/health
   curl http://localhost:8000/health
   curl http://localhost:3000/api/health
   ```

## Production Environment

Required variables:

```bash
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DB=...
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@RDS_HOST:5432/DB
REDIS_URL=redis://ELASTICACHE_HOST:6379/0
SECRET_KEY=...
JWT_SECRET_KEY=...
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
OAUTH_REDIRECT_BASE_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
LOG_LEVEL=INFO
LOG_FORMAT=json
```

Optional variables include OAuth provider credentials, SMTP settings, and S3 configuration from `.env.production`.

## GitHub Actions CI/CD

The workflow runs on pull requests and pushes to `main`/`develop`.

Required GitHub secrets for production deployment:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
ECS_CLUSTER
ECS_SERVICE
ECS_BACKEND_TASK_DEFINITION
ECS_SUBNET_IDS
ECS_SECURITY_GROUP_IDS
PRODUCTION_BASE_URL
```

Images are published to:

```text
ghcr.io/<owner>/<repo>/backend:<sha>
ghcr.io/<owner>/<repo>/frontend:<sha>
ghcr.io/<owner>/<repo>/backend:latest
ghcr.io/<owner>/<repo>/frontend:latest
```

For ECS, configure task definitions to pull the GHCR images and inject secrets through AWS Secrets Manager or SSM Parameter Store.

## AWS Deployment

Recommended AWS services:

- ECS Fargate for `nginx`, `frontend`, and `backend` containers.
- Application Load Balancer for public ingress and health checks.
- ACM for TLS certificates.
- Route 53 for DNS.
- RDS PostgreSQL for the database.
- ElastiCache Redis for Redis.
- S3 for uploads/exports when file storage is enabled.
- CloudWatch Logs for container logs.
- Secrets Manager or SSM Parameter Store for secrets.

High-level steps:

1. Create VPC subnets, security groups, RDS PostgreSQL, and ElastiCache Redis.
2. Create an ECS cluster and task definition with three containers: `nginx`, `frontend`, and `backend`.
3. Point the NGINX container at port `80`; keep backend and frontend internal to the task/service.
4. Configure the ALB listener on `443` with ACM TLS and target the ECS service on NGINX port `80`.
5. Configure ALB health checks against `/health`.
6. Store production secrets in AWS Secrets Manager or SSM and inject them into the backend/frontend containers.
7. Push to `main`; GitHub Actions builds images, forces ECS deployment, runs Alembic migrations, and verifies `/health`.

## Database Migrations

Run migrations before or during deployment:

```bash
docker compose run --rm backend python -m alembic upgrade head
```

The CI workflow runs the same command as a one-off ECS Fargate task after forcing a new deployment.

## Logging

The backend emits structured JSON logs with request metadata. In containers, ship stdout/stderr to CloudWatch. The backend also writes `logs/app.log` inside the container for local debugging.

Recommended CloudWatch retention:

- Development/staging: 7 to 14 days.
- Production: 30 to 90 days, based on compliance needs.

## Health Checks

- Backend: `GET /health`, checks database connectivity.
- Frontend: `GET /api/health`, checks the Next.js runtime.
- NGINX: `GET /health`, proxies to backend health.
- Production frontend API base: `https://yourdomain.com/api`; NGINX strips `/api` before forwarding requests to FastAPI.

Use `/health` as the ALB target group health-check path.

## Rollback

1. Find the previous successful image SHA in GitHub Actions or GHCR.
2. Update ECS task definition image tags to the previous SHA.
3. Deploy the previous task definition revision.
4. Re-run `/health` and smoke-test login, projects, and task workflows.

Avoid rolling back database migrations automatically unless a migration-specific downgrade has been reviewed.
