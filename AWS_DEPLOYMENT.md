# AWS Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying DevWorkspace X to AWS using ECS (Elastic Container Service), RDS, and other AWS services.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Docker installed locally
- GitHub repository with CI/CD configured
- Domain name (optional, for production)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Route 53 (DNS)                      │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  CloudFront (CDN)                       │
│              (Static Assets & Caching)                  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  Application Load Balancer              │
│                   (SSL Termination)                     │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌────────▼────────┐
│  ECS Cluster   │          │  ECS Cluster   │
│  (Frontend)    │          │  (Backend)     │
└────────────────┘          └────────────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌────────▼────────┐
│  RDS PostgreSQL│          │   ElastiCache  │
│   (Database)   │          │     (Redis)     │
└────────────────┘          └────────────────┘
        │
┌───────▼────────┐
│   S3 Bucket    │
│  (File Storage)│
└────────────────┘
```

## AWS Services Required

### 1. VPC (Virtual Private Cloud)
- Private subnets for database and cache
- Public subnets for load balancer
- Security groups for network isolation

### 2. ECS (Elastic Container Service)
- Fargate cluster for container orchestration
- Task definitions for frontend and backend
- Service definitions with auto-scaling

### 3. RDS (Relational Database Service)
- PostgreSQL instance
- Multi-AZ deployment for high availability
- Automated backups

### 4. ElastiCache
- Redis cluster for caching
- Redis replication for high availability

### 5. S3 (Simple Storage Service)
- File storage for user uploads
- Static asset hosting
- Lifecycle policies for cost optimization

### 6. CloudFront
- CDN for static assets
- SSL certificate via ACM
- Caching policies

### 7. Application Load Balancer
- Traffic distribution
- SSL termination
- Health checks

### 8. CloudWatch
- Logging and monitoring
- Alarms and notifications
- Metrics collection

### 9. Secrets Manager
- Secure storage for sensitive data
- Automatic rotation
- Integration with ECS

### 10. Route 53
- DNS management
- Domain registration
- Health-based routing

## Step-by-Step Deployment

### Step 1: Create VPC and Networking

```bash
# Create VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=devworkspacex-vpc}]'

# Create subnets
aws ec2 create-subnet \
  --vpc-id <VPC_ID> \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-subnet-1a}]'

aws ec2 create-subnet \
  --vpc-id <VPC_ID> \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-subnet-1b}]'

aws ec2 create-subnet \
  --vpc-id <VPC_ID> \
  --cidr-block 10.0.10.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-subnet-1a}]'

aws ec2 create-subnet \
  --vpc-id <VPC_ID> \
  --cidr-block 10.0.11.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-subnet-1b}]'

# Create Internet Gateway
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=devworkspacex-igw}]'

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway \
  --vpc-id <VPC_ID> \
  --internet-gateway-id <IGW_ID>

# Create NAT Gateway
aws ec2 allocate-address --domain vpc
aws ec2 create-nat-gateway \
  --subnet-id <PUBLIC_SUBNET_ID> \
  --allocation-id <ALLOCATION_ID>

# Create route tables
aws ec2 create-route-table \
  --vpc-id <VPC_ID> \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=public-rt}]'

aws ec2 create-route \
  --route-table-id <PUBLIC_RT_ID> \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id <IGW_ID>
```

### Step 2: Create Security Groups

```bash
# Backend security group
aws ec2 create-security-group \
  --group-name devworkspacex-backend-sg \
  --description "Security group for backend services" \
  --vpc-id <VPC_ID>

# Allow inbound from ALB
aws ec2 authorize-security-group-ingress \
  --group-id <BACKEND_SG_ID> \
  --protocol tcp \
  --port 8000 \
  --source-group <ALB_SG_ID>

# Frontend security group
aws ec2 create-security-group \
  --group-name devworkspacex-frontend-sg \
  --description "Security group for frontend services" \
  --vpc-id <VPC_ID>

# Allow inbound from ALB
aws ec2 authorize-security-group-ingress \
  --group-id <FRONTEND_SG_ID> \
  --protocol tcp \
  --port 3000 \
  --source-group <ALB_SG_ID>

# Database security group
aws ec2 create-security-group \
  --group-name devworkspacex-db-sg \
  --description "Security group for database" \
  --vpc-id <VPC_ID>

# Allow inbound from backend
aws ec2 authorize-security-group-ingress \
  --group-id <DB_SG_ID> \
  --protocol tcp \
  --port 5432 \
  --source-group <BACKEND_SG_ID>

# Redis security group
aws ec2 create-security-group \
  --group-name devworkspacex-redis-sg \
  --description "Security group for Redis" \
  --vpc-id <VPC_ID>

# Allow inbound from backend
aws ec2 authorize-security-group-ingress \
  --group-id <REDIS_SG_ID> \
  --protocol tcp \
  --port 6379 \
  --source-group <BACKEND_SG_ID>
```

### Step 3: Create RDS PostgreSQL Instance

```bash
# Create subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name devworkspacex-subnet-group \
  --db-subnet-group-description "Subnet group for DevWorkspace X" \
  --subnet-ids <PRIVATE_SUBNET_1A_ID> <PRIVATE_SUBNET_1B_ID>

# Create parameter group (optional)
aws rds create-db-parameter-group \
  --db-parameter-group-name devworkspacex-pg \
  --db-parameter-group-family postgres15 \
  --description "Custom parameter group"

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier devworkspacex-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --master-username devworkspace \
  --master-user-password <SECURE_PASSWORD> \
  --vpc-security-group-ids <DB_SG_ID> \
  --db-subnet-group-name devworkspacex-subnet-group \
  --multi-az \
  --backup-retention-period 7 \
  --deletion-protection

# Get database endpoint
aws rds describe-db-instances \
  --db-instance-identifier devworkspacex-db \
  --query 'DBInstances[0].Endpoint.Address'
```

### Step 4: Create ElastiCache Redis Cluster

```bash
# Create subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name devworkspacex-redis-subnet-group \
  --cache-subnet-group-description "Subnet group for Redis" \
  --subnet-ids <PRIVATE_SUBNET_1A_ID> <PRIVATE_SUBNET_1B_ID>

# Create parameter group
aws elasticache create-cache-parameter-group \
  --cache-parameter-group-name devworkspacex-redis \
  --cache-parameter-group-family redis7 \
  --description "Custom Redis parameter group"

# Create Redis cluster
aws elasticache create-replication-group \
  --replication-group-id devworkspacex-redis \
  --replication-group-description "Redis cluster for DevWorkspace X" \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-clusters 2 \
  --automatic-failover-enabled \
  --cache-subnet-group-name devworkspacex-redis-subnet-group \
  --security-group-ids <REDIS_SG_ID>

# Get Redis endpoint
aws elasticache describe-replication-groups \
  --replication-group-id devworkspacex-redis \
  --query 'ReplicationGroups[0].PrimaryEndpoint.Address'
```

### Step 5: Create S3 Bucket

```bash
# Create bucket
aws s3api create-bucket \
  --bucket devworkspacex-uploads \
  --region us-east-1 \
  --create-bucket-configuration LocationConstraint=us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket devworkspacex-uploads \
  --versioning-configuration Status=Enabled

# Set lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket devworkspacex-uploads \
  --lifecycle-configuration '{
    "Rules": [
      {
        "Id": "DeleteOldVersions",
        "Status": "Enabled",
        "NoncurrentVersionExpiration": {
          "NoncurrentDays": 30
        }
      }
    ]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket devworkspacex-uploads \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### Step 6: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster \
  --cluster-name devworkspacex-cluster \
  --service-connect-defaults namespace=devworkspacex

# Create task execution role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policies
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonECSTaskExecutionRolePolicy

# Create task role for application
aws iam create-role \
  --role-name devworkspacex-task-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach S3 access
aws iam attach-role-policy \
  --role-name devworkspacex-task-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Attach Secrets Manager access
aws iam attach-role-policy \
  --role-name devworkspacex-task-role \
  --policy-arn arn:aws:iam::aws:policy/secretsmanagerReadWrite
```

### Step 7: Create Task Definitions

#### Backend Task Definition

```bash
aws ecs register-task-definition \
  --family devworkspacex-backend \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu "1024" \
  --memory "2048" \
  --execution-role-arn arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole \
  --task-role-arn arn:aws:iam::<ACCOUNT_ID>:role/devworkspacex-task-role \
  --container-definitions '[
    {
      "name": "backend",
      "image": "<BACKEND_IMAGE>",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<ACCOUNT_ID>:secret:devworkspacex/database-url"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<ACCOUNT_ID>:secret:devworkspacex/redis-url"
        },
        {
          "name": "SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<ACCOUNT_ID>:secret:devworkspacex/secret-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/devworkspacex-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]'
```

#### Frontend Task Definition

```bash
aws ecs register-task-definition \
  --family devworkspacex-frontend \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu "512" \
  --memory "1024" \
  --execution-role-arn arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole \
  --container-definitions '[
    {
      "name": "frontend",
      "image": "<FRONTEND_IMAGE>",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/devworkspacex-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000 || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]'
```

### Step 8: Create Application Load Balancer

```bash
# Create load balancer
aws elbv2 create-load-balancer \
  --name devworkspacex-alb \
  --subnets <PUBLIC_SUBNET_1A_ID> <PUBLIC_SUBNET_1B_ID> \
  --security-groups <ALB_SG_ID> \
  --type application

# Create target groups
aws elbv2 create-target-group \
  --name devworkspacex-backend-tg \
  --port 8000 \
  --protocol HTTP \
  --vpc-id <VPC_ID> \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold 3 \
  --unhealthy-threshold 2

aws elbv2 create-target-group \
  --name devworkspacex-frontend-tg \
  --port 3000 \
  --protocol HTTP \
  --vpc-id <VPC_ID> \
  --target-type ip \
  --health-check-path / \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold 3 \
  --unhealthy-threshold 2

# Create listeners
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=<FRONTEND_TG_ARN>

# For HTTPS (requires SSL certificate)
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<CERT_ARN> \
  --default-actions Type=forward,TargetGroupArn=<FRONTEND_TG_ARN>
```

### Step 9: Create ECS Services

```bash
# Create backend service
aws ecs create-service \
  --cluster devworkspacex-cluster \
  --service-name devworkspacex-backend \
  --task-definition devworkspacex-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<PRIVATE_SUBNET_1A_ID>,<PRIVATE_SUBNET_1B_ID>],securityGroups=[<BACKEND_SG_ID>],assignPublicIp=DISABLED}" \
  --load-balancers targetGroupArn=<BACKEND_TG_ARN>,containerName=backend,containerPort=8000 \
  --health-check-grace-period-seconds 60

# Create frontend service
aws ecs create-service \
  --cluster devworkspacex-cluster \
  --service-name devworkspacex-frontend \
  --task-definition devworkspacex-frontend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<PRIVATE_SUBNET_1A_ID>,<PRIVATE_SUBNET_1B_ID>],securityGroups=[<FRONTEND_SG_ID>],assignPublicIp=DISABLED}" \
  --load-balancers targetGroupArn=<FRONTEND_TG_ARN>,containerName=frontend,containerPort=3000 \
  --health-check-grace-period-seconds 60
```

### Step 10: Configure Auto Scaling

```bash
# Register scalable target for backend
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/devworkspacex-cluster/devworkspacex-backend \
  --min-capacity 2 \
  --max-capacity 10 \
  --role-arn arn:aws:iam::<ACCOUNT_ID>:role/aws-application-autoscaling-service-role

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/devworkspacex-cluster/devworkspacex-backend \
  --policy-name devworkspacex-backend-scale-up \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ASGAverageCPUUtilization"
    },
    "ScaleOutCooldown": 300,
    "ScaleInCooldown": 300
  }'

# Repeat for frontend service
```

### Step 11: Store Secrets in Secrets Manager

```bash
# Store database URL
aws secretsmanager create-secret \
  --name devworkspacex/database-url \
  --secret-string "postgresql://devworkspace:<PASSWORD>@<RDS_ENDPOINT>:5432/devworkspace"

# Store Redis URL
aws secretsmanager create-secret \
  --name devworkspacex/redis-url \
  --secret-string "redis://<REDIS_ENDPOINT>:6379/0"

# Store secret key
aws secretsmanager create-secret \
  --name devworkspacex/secret-key \
  --secret-string "<YOUR_SECRET_KEY>"

# Store other secrets as needed
```

### Step 12: Configure CloudWatch

```bash
# Create log groups
aws logs create-log-group \
  --log-group-name /ecs/devworkspacex-backend \
  --retention-in-days 30

aws logs create-log-group \
  --log-group-name /ecs/devworkspacex-frontend \
  --retention-in-days 30

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name devworkspacex-backend-high-cpu \
  --alarm-description "Alert when backend CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=devworkspacex-backend

# Create SNS topic for notifications
aws sns create-topic --name devworkspacex-alerts
aws sns subscribe \
  --topic-arn <TOPIC_ARN> \
  --protocol email \
  --notification-endpoint your-email@example.com
```

### Step 13: Configure Route 53 (Optional)

```bash
# Create hosted zone if you have a domain
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference devworkspacex-deployment

# Create A record pointing to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": <ALB_ZONE_ID>,
          "DNSName": <ALB_DNS_NAME>,
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

## Cost Optimization

### 1. Use Reserved Instances
- Purchase reserved instances for predictable workloads
- Save up to 75% compared to on-demand pricing

### 2. Enable Auto Scaling
- Scale resources based on demand
- Avoid over-provisioning

### 3. Use S3 Lifecycle Policies
- Move old data to cheaper storage classes
- Delete unnecessary data automatically

### 4. Use Spot Instances
- For non-critical workloads
- Save up to 90% on compute costs

### 5. Monitor and Optimize
- Use AWS Cost Explorer
- Set up billing alerts
- Review resource utilization regularly

## Security Best Practices

### 1. Network Security
- Use private subnets for databases
- Implement security groups with least privilege
- Enable VPC flow logs

### 2. Data Security
- Enable encryption at rest and in transit
- Use AWS KMS for key management
- Regular security audits

### 3. Access Control
- Use IAM roles instead of access keys
- Implement least privilege principle
- Regularly review permissions

### 4. Monitoring and Logging
- Enable CloudTrail for API logging
- Use CloudWatch for monitoring
- Set up alerts for suspicious activity

## Troubleshooting

### Common Issues

#### 1. Container Fails to Start
- Check CloudWatch logs
- Verify task definition
- Check security group rules

#### 2. Database Connection Issues
- Verify security group allows traffic
- Check database endpoint
- Verify credentials in Secrets Manager

#### 3. Load Balancer Health Checks Failing
- Verify health check path
- Check security group rules
- Review application logs

#### 4. Auto Scaling Not Working
- Verify IAM permissions
- Check target tracking configuration
- Review CloudWatch metrics

## Maintenance

### Regular Tasks
- Review and update security groups
- Rotate secrets regularly
- Monitor costs and optimize
- Update container images
- Review and update IAM policies

### Backup Strategy
- Enable automated backups for RDS
- Regular snapshot of EBS volumes
- Backup S3 data with versioning
- Document disaster recovery procedures

## Monitoring and Alerts

Set up the following CloudWatch dashboards:
- CPU and memory utilization
- Request/response times
- Error rates
- Database connections
- Cache hit rates
- S3 storage usage

Configure alerts for:
- High CPU/memory usage
- Failed health checks
- Database connection failures
- API error rates
- Cost thresholds

## Disaster Recovery

### Backup Strategy
- Multi-AZ deployment for high availability
- Automated backups with point-in-time recovery
- Cross-region replication for critical data
- Regular testing of recovery procedures

### Recovery Procedures
1. Document recovery steps
2. Test recovery procedures regularly
3. Maintain up-to-date runbooks
4. Train team on recovery procedures

## Support and Resources

- AWS Documentation: https://docs.aws.amazon.com/
- ECS Documentation: https://docs.aws.amazon.com/ecs/
- RDS Documentation: https://docs.aws.amazon.com/rds/
- AWS Support: https://aws.amazon.com/support/
