# DevWorkspace X Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

## Overview

This guide covers the complete deployment process for DevWorkspace X, from local development to production deployment on AWS.

## Prerequisites

### Required Software
- Docker (20.10+)
- Docker Compose (2.0+)
- Python 3.11+
- Node.js 20+
- Git
- AWS CLI (for AWS deployment)
- PostgreSQL client (optional)

### Required Accounts
- GitHub account (for CI/CD)
- AWS account (for production deployment)
- Domain name (optional, for production)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/archi2305/DevWorkSpaceX.git
cd DevWorkSpaceX
```

### 2. Environment Configuration

```bash
# Copy environment example
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Docker Deployment

### Quick Start with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Individual Service Management

```bash
# Build specific service
docker-compose build backend

# Restart specific service
docker-compose restart backend

# View service logs
docker-compose logs backend

# Execute command in container
docker-compose exec backend python -m alembic upgrade head
```

### Environment Variables for Docker

Create a `.env` file in the root directory:

```env
# Database
POSTGRES_USER=devworkspace
POSTGRES_PASSWORD=devworkspace_password
POSTGRES_DB=devworkspace

# Application
SECRET_KEY=your-secret-key-change-in-production
ENVIRONMENT=production
CORS_ORIGINS=http://localhost,http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Production Deployment

### Option 1: Docker Compose Production

#### 1. Prepare Production Environment

```bash
# Copy production environment template
cp .env.production .env

# Edit with production values
nano .env
```

#### 2. Generate SSL Certificates

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# For production, use Let's Encrypt or your own certificates
```

#### 3. Deploy with Docker Compose

```bash
# Build and start production services
docker-compose -f docker-compose.yml up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f
```

#### 4. Database Migration

```bash
# Run migrations
docker-compose exec backend python -m alembic upgrade head

# Verify migration status
docker-compose exec backend python -m alembic current
```

### Option 2: AWS Deployment

See [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for detailed AWS deployment instructions.

#### Quick AWS Deployment Steps

1. **Configure AWS CLI**
```bash
aws configure
```

2. **Create Infrastructure**
```bash
# Use CloudFormation or Terraform for infrastructure as code
# Or follow the manual steps in AWS_DEPLOYMENT.md
```

3. **Push Docker Images**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push images
docker tag devworkspacex-backend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/devworkspacex-backend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/devworkspacex-backend:latest
```

4. **Deploy to ECS**
```bash
# Update ECS service
aws ecs update-service --cluster devworkspacex-cluster --service devworkspacex-backend --force-new-deployment
```

### Option 3: CI/CD Deployment

#### GitHub Actions Setup

1. **Configure GitHub Secrets**
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `SUBNET_ID`
   - `SECURITY_GROUP_ID`
   - `API_URL`
   - `SLACK_WEBHOOK` (optional)

2. **Push to Main Branch**
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

3. **Monitor Deployment**
- Check GitHub Actions tab for deployment status
- Monitor CloudWatch logs in AWS console
- Verify health checks pass

## Monitoring and Maintenance

### Health Checks

```bash
# Backend health check
curl http://localhost:8000/health

# Frontend health check
curl http://localhost:3000

# Docker health check
docker-compose ps
```

### Log Management

```bash
# View backend logs
docker-compose logs backend

# View frontend logs
docker-compose logs frontend

# View nginx logs
docker-compose logs nginx

# Tail logs in real-time
docker-compose logs -f backend
```

### Database Backups

```bash
# Manual backup
docker-compose exec postgres pg_dump -U devworkspace devworkspace > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U devworkspace devworkspace < backup.sql

# Automated backups (configure in docker-compose.yml or AWS)
```

### Updates and Upgrades

```bash
# Pull latest code
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose pull
docker-compose up -d --build

# Run database migrations
docker-compose exec backend python -m alembic upgrade head
```

### Performance Monitoring

Key metrics to monitor:
- CPU and memory utilization
- Response times
- Error rates
- Database connection pool usage
- Redis cache hit rate
- Disk space usage

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Symptoms:**
- Backend fails to start
- Connection refused errors

**Solutions:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify database credentials
docker-compose exec backend env | grep DATABASE_URL

# Restart database
docker-compose restart postgres
```

#### 2. Port Already in Use

**Symptoms:**
- Services fail to start
- Port binding errors

**Solutions:**
```bash
# Find process using the port
lsof -i :8000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change ports in docker-compose.yml
```

#### 3. Container Keeps Restarting

**Symptoms:**
- Container status shows "Restarting"
- Services unavailable

**Solutions:**
```bash
# Check container logs
docker-compose logs backend

# Check health status
docker-compose ps

# Inspect container
docker inspect devworkspacex_backend

# Restart container
docker-compose restart backend
```

#### 4. Migration Failures

**Symptoms:**
- Database schema errors
- Alembic conflicts

**Solutions:**
```bash
# Check current migration version
docker-compose exec backend python -m alembic current

# View migration history
docker-compose exec backend python -m alembic history

# Reset to specific migration (use with caution)
docker-compose exec backend python -m alembic downgrade base

# Then upgrade again
docker-compose exec backend python -m alembic upgrade head
```

#### 5. SSL Certificate Issues

**Symptoms:**
- HTTPS not working
- Certificate errors

**Solutions:**
```bash
# Verify certificate files exist
ls -la nginx/ssl/

# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Regenerate certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# Restart nginx
docker-compose restart nginx
```

### Debug Mode

Enable debug mode for detailed error messages:

```bash
# Set debug environment variable
export DEBUG=True

# Restart services
docker-compose down
docker-compose up -d
```

## Security Best Practices

### 1. Environment Variables

- Never commit `.env` files to version control
- Use strong, unique passwords
- Rotate secrets regularly
- Use AWS Secrets Manager for production

### 2. Database Security

- Use strong database passwords
- Enable SSL for database connections
- Restrict database access to backend only
- Regular database backups

### 3. API Security

- Enable HTTPS in production
- Implement rate limiting
- Use JWT tokens with expiration
- Validate all input data
- Enable CORS only for trusted origins

### 4. Container Security

- Use official Docker images
- Keep images updated
- Scan images for vulnerabilities
- Run containers as non-root user
- Limit container resources

### 5. Network Security

- Use private networks for databases
- Implement security groups
- Enable firewall rules
- Use VPN for admin access

### 6. Monitoring and Logging

- Enable audit logging
- Monitor for suspicious activity
- Set up alerts for security events
- Regular security audits

## Backup and Recovery

### Automated Backups

Configure automated backups:

```yaml
# In docker-compose.yml
postgres:
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./backups:/backups
  environment:
    - POSTGRES_BACKUP_SCHEDULE=@daily
```

### Manual Backup

```bash
# Database backup
docker-compose exec postgres pg_dump -U devworkspace devworkspace > backup_$(date +%Y%m%d).sql

# Volume backup
docker run --rm -v devworkspacex_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres_backup_$(date +%Y%m%d).tar.gz /data
```

### Disaster Recovery

1. **Restore Database**
```bash
# Restore from backup
docker-compose exec -T postgres psql -U devworkspace devworkspace < backup_20240714.sql
```

2. **Restore Volumes**
```bash
# Restore volume from backup
docker run --rm -v devworkspacex_postgres_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/postgres_backup_20240714.tar.gz -C /
```

3. **Verify Recovery**
```bash
# Check service health
docker-compose ps

# Run health checks
curl http://localhost:8000/health
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM tasks WHERE assignee_id = '...';
```

### 2. Caching Strategy

- Enable Redis caching for frequently accessed data
- Cache API responses with appropriate TTL
- Use CDN for static assets
- Implement browser caching headers

### 3. Resource Limits

```yaml
# In docker-compose.yml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G
      reservations:
        cpus: '1'
        memory: 2G
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend services
docker-compose up -d --scale backend=3

# Scale frontend services
docker-compose up -d --scale frontend=2
```

### Load Balancing

For production, use:
- AWS Application Load Balancer
- NGINX reverse proxy
- HAProxy

## Support and Resources

- **Documentation**: [README.md](./README.md)
- **AWS Deployment**: [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md)
- **Audit Dashboard**: [AUDIT_DASHBOARD.md](./AUDIT_DASHBOARD.md)
- **Export Feature**: [EXPORT_FEATURE.md](./EXPORT_FEATURE.md)
- **GitHub Issues**: https://github.com/archi2305/DevWorkSpaceX/issues

## Checklist

### Pre-Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates obtained
- [ ] DNS records configured
- [ ] Monitoring setup
- [ ] Backup strategy in place
- [ ] Security audit completed
- [ ] Load testing performed

### Post-Deployment Checklist
- [ ] Health checks passing
- [ ] Database connectivity verified
- [ ] API endpoints tested
- [ ] Frontend loading correctly
- [ ] Logs being collected
- [ ] Alerts configured
- [ ] Documentation updated
- [ ] Team notified

## Contact

For deployment issues or questions:
- Create a GitHub issue
- Contact the DevWorkspace X team
- Check the troubleshooting section above
