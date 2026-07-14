# DevWorkspace X - Production Deployment Guide

This guide covers deploying DevWorkspace X to production using Docker, Docker Compose, and GitHub Actions.

## Prerequisites

- Docker and Docker Compose installed
- GitHub account with repository access
- Server with SSH access (Ubuntu 20.04+ recommended)
- Domain name configured
- SSL certificate (optional but recommended)

## Architecture Overview

```
┌─────────────┐
│   NGINX     │ (Port 80/443)
│  (Reverse   │
│   Proxy)    │
└──────┬──────┘
       │
   ┌───┴────┬──────┐
   │        │      │
┌──▼──┐ ┌──▼──┐ ┌─▼────┐
│Front│ │Back │ │Redis │
│ end │ │ end │ │      │
│:3000│ │:8000│ │:6379 │
└─────┘ └─────┘ └──────┘
           │
      ┌────▼────┐
      │PostgreSQL│
      │  :5432   │
      └──────────┘
```

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/devworkspacex.git
cd devworkspacex
```

### 2. Configure Environment Variables

Copy the production environment template:

```bash
cp .env.production .env
```

Edit `.env` with your production values:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/devworkspacex_prod

# Redis
REDIS_URL=redis://localhost:6379/0

# Security (CHANGE THESE IN PRODUCTION)
SECRET_KEY=your-super-secret-key-min-32-chars
JWT_SECRET_KEY=your-jwt-secret-key-min-32-chars

# Environment
ENVIRONMENT=production
DEBUG=false

# CORS
CORS_ORIGINS=https://your-domain.com

# OAuth
OAUTH_REDIRECT_BASE_URL=https://your-domain.com

# Frontend
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

### 3. Configure GitHub Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `DEPLOY_HOST`: Your server IP address
- `DEPLOY_USER`: SSH username (e.g., `ubuntu`)
- `DEPLOY_SSH_KEY`: Private SSH key for server access
- `DEPLOY_PORT`: SSH port (default: 22)
- `SLACK_WEBHOOK`: Optional Slack webhook for deployment notifications

## Local Testing

### Build and Test Locally

```bash
# Build Docker images
docker-compose -f docker-compose.prod.yml build

# Test locally
docker-compose -f docker-compose.prod.yml up

# Check health
curl http://localhost/health
```

## Server Setup

### 1. Initial Server Configuration

SSH into your server:

```bash
ssh user@your-server-ip
```

Update system and install Docker:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker docker-compose git

# Add user to docker group
sudo usermod -aG docker $USER
```

### 2. Setup Application Directory

```bash
sudo mkdir -p /opt/devworkspacex
sudo chown $USER:$USER /opt/devworkspacex
cd /opt/devworkspacex
```

### 3. Clone Repository

```bash
git clone https://github.com/your-org/devworkspacex.git .
```

### 4. Configure Environment

```bash
cp .env.production .env
nano .env  # Edit with your values
```

### 5. Setup SSL/TLS (Optional but Recommended)

Using Let's Encrypt with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Or use self-signed certificates for testing:

```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/nginx.key \
  -out /etc/nginx/ssl/nginx.crt
```

## Deployment

### Automated Deployment via GitHub Actions

1. Push to main branch:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

2. GitHub Actions will:
   - Build Docker images
   - Push to GitHub Container Registry
   - Deploy to server via SSH
   - Run health checks
   - Send Slack notification (if configured)

### Manual Deployment

```bash
cd /opt/devworkspacex

# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Post-Deployment Checks

### 1. Health Check

```bash
curl https://your-domain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "production",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 2. Check Services

```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Check frontend logs
docker-compose -f docker-compose.prod.yml logs frontend

# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx
```

### 3. Database Migrations

Run database migrations if needed:

```bash
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Monitoring and Maintenance

### View Logs

```bash
# All logs
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Restart Services

```bash
# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# Restart all services
docker-compose -f docker-compose.prod.yml restart
```

### Update Application

```bash
cd /opt/devworkspacex
git pull origin main
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Backup Database

```bash
# Backup
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U user devworkspacex_prod > backup.sql

# Restore
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U user devworkspacex_prod < backup.sql
```

### Clean Up

```bash
# Remove old images
docker system prune -a

# Remove unused volumes (CAUTION: deletes data)
docker volume prune
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check resource usage
docker stats

# Restart service
docker-compose -f docker-compose.prod.yml restart [service-name]
```

### Database Connection Issues

```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec backend python -c "from app.database.db import engine; engine.connect()"
```

### Nginx Issues

```bash
# Test nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Reload nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Reload nginx after renewal
docker-compose -f docker-compose.prod.yml restart nginx
```

## Security Best Practices

1. **Change default secrets** in `.env` file
2. **Use HTTPS** with valid SSL certificates
3. **Keep dependencies updated** regularly
4. **Enable firewall** (UFW on Ubuntu):
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
5. **Regular backups** of database and important files
6. **Monitor logs** for suspicious activity
7. **Use strong passwords** for database and secrets
8. **Limit SSH access** to specific IPs if possible
9. **Enable automatic security updates**:
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

## Scaling Considerations

### Horizontal Scaling

For higher loads, consider:

1. **Load Balancer**: Use AWS ALB or NGINX load balancing
2. **Multiple Backend Instances**: Scale backend horizontally
3. **Database Replication**: Use read replicas for read-heavy workloads
4. **Redis Cluster**: For distributed caching
5. **CDN**: Use CloudFront or similar for static assets

### Performance Optimization

1. **Enable HTTP/2** in NGINX
2. **Configure connection pooling** in PostgreSQL
3. **Use Redis for session storage**
4. **Enable query caching** where appropriate
5. **Monitor and optimize slow queries**

## Support

For issues or questions:
- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- Review GitHub Issues
- Contact DevOps team

## Rollback Procedure

If deployment fails:

```bash
cd /opt/devworkspacex
git log  # Find previous commit
git checkout [previous-commit-hash]
docker-compose -f docker-compose.prod.yml up -d
```

Or use GitHub Actions to rollback by reverting the commit and pushing again.
