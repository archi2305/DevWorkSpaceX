# DevWorkspace X Production Architecture

```mermaid
flowchart LR
    user["Users"] --> route53["Route 53"]
    route53 --> alb["AWS Application Load Balancer<br/>TLS via ACM"]
    alb --> nginx["NGINX reverse proxy<br/>ECS/Fargate task"]
    nginx --> frontend["Next.js frontend<br/>ECS/Fargate container"]
    nginx --> backend["FastAPI backend<br/>ECS/Fargate container"]
    backend --> rds["Amazon RDS PostgreSQL"]
    backend --> redis["Amazon ElastiCache Redis"]
    backend --> s3["Amazon S3<br/>uploads/exports"]
    backend --> logs["CloudWatch Logs"]
    frontend --> logs
    nginx --> logs
    gha["GitHub Actions"] --> ghcr["GitHub Container Registry"]
    ghcr --> backend
    ghcr --> frontend
    gha --> ecs["Amazon ECS deployment"]
    ecs --> backend
    ecs --> frontend
```

## Runtime Flow

1. Route 53 points the application domain to an AWS Application Load Balancer.
2. ACM terminates TLS at the load balancer.
3. The load balancer forwards HTTP traffic to the NGINX container.
4. NGINX routes `/api/*`, `/health`, and `/notifications/ws` WebSocket traffic to FastAPI and all other requests to Next.js.
5. FastAPI stores relational data in PostgreSQL, uses Redis for cache/queue-oriented workloads, and writes structured logs to stdout/file for CloudWatch collection.
6. GitHub Actions validates, builds, publishes images to GHCR, triggers ECS redeployment, runs migrations, and checks `/health`.
