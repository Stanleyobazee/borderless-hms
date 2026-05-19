# AWS Deployment Guide

This guide walks through deploying the Borderless Hospital Management System to AWS using Terraform and ECS Fargate.

---

## Architecture Overview

```
Internet → ALB → ECS Frontend (React/Nginx)
               → ECS Backend (FastAPI) → RDS PostgreSQL
```

| Resource | Details |
|----------|---------|
| Compute | ECS Fargate (no servers to manage) |
| Database | RDS PostgreSQL 16, Multi-AZ |
| Load Balancer | Application Load Balancer (ALB) |
| Container Registry | Amazon ECR |
| Networking | VPC with public/private subnets across 2 AZs |
| Monitoring | CloudWatch Logs + Alarms |

**Estimated cost: ~$164/month** (see README for breakdown)

---

## Prerequisites

Install the following tools before starting:

- [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [Terraform >= 1.10.0](https://developer.hashicorp.com/terraform/install)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## Step 1 — Configure AWS CLI

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-1`
- Default output format: `json`

Verify it works:

```bash
aws sts get-caller-identity
```

You should see your account ID and user ARN.

---

## Step 2 — Create Terraform Variables File

```bash
cd infrastructure
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
aws_region   = "us-east-1"
project_name = "borderless-hms"
environment  = "production"

# Generate with: openssl rand -hex 32
postgres_password = "YourStrongPassword@2024!"
jwt_secret_key    = "your-64-char-hex-string-here" [ run this command to generate it: openssl rand -hex 32]

# Optional: set to false to save ~$50/month for non-production
rds_multi_az = true

# Optional: use db.t3.micro to save cost for dev/staging
rds_instance_class = "db.t3.medium"

# S3 bucket name for storing Terraform state (must be globally unique)
state_bucket_name = "borderless-hms-terraform-state-<your-account-id>"
```

> Never commit `terraform.tfvars` to git — it contains secrets.

---

## Step 3 — Deploy ECR Repositories

ECR (Elastic Container Registry) stores your Docker images. Deploy this first so you have somewhere to push images.

```bash
cd infrastructure
terraform init
terraform apply -target=module.ecr
```

Type `yes` when prompted. This creates two ECR repositories:
- `borderless-hms-production/backend`
- `borderless-hms-production/frontend`

Note the repository URLs from the output:

```bash
terraform output frontend_ecr_repository_url
terraform output backend_ecr_repository_url
```

---

## Step 4 — Build and Push Docker Images

### Authenticate Docker to ECR

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 266735814791.dkr.ecr.us-east-1.amazonaws.com
```

Replace `<ACCOUNT_ID>` with your AWS account ID (from `aws sts get-caller-identity`).

### Build and Push Backend

```bash
cd backend
docker build -t <BACKEND_ECR_URL>:latest .
docker push <BACKEND_ECR_URL>:latest
```

### Build and Push Frontend

```bash
cd ../frontend
docker build --build-arg VITE_API_URL=/api/v1 -t <FRONTEND_ECR_URL>:latest .
docker push <FRONTEND_ECR_URL>:latest
```

Replace `<BACKEND_ECR_URL>` and `<FRONTEND_ECR_URL>` with the URLs from Step 3.

---

## Step 5 — (Optional) Enable Remote Terraform State

By default Terraform stores state locally. For team use or CI/CD, store it in S3.

### Create the S3 state bucket first

```bash
cd infrastructure
terraform apply -target=module.state_bucket
```

### Enable the S3 backend

Uncomment the `backend "s3"` block in `infrastructure/main.tf`:

```hcl
backend "s3" {
  bucket       = "borderless-hms-terraform-state-<your-account-id>"
  key          = "production/terraform.tfstate"
  region       = "us-east-1"
  encrypt      = true
  use_lockfile = true
}
```

Migrate existing local state to S3:

```bash
terraform init -migrate-state
```

---

## Step 6 — Deploy Full Infrastructure

```bash
cd infrastructure
terraform plan -out=tfplan
terraform apply tfplan
```

This takes **10–15 minutes** and creates:

- VPC with 2 public and 2 private subnets
- NAT Gateway for private subnet internet access
- Security groups for ALB, frontend, backend, and RDS
- RDS PostgreSQL 16 (Multi-AZ, encrypted, automated backups)
- Application Load Balancer with path-based routing
- ECS Fargate cluster with frontend and backend services
- Auto-scaling policies (CPU/memory based)
- CloudWatch log groups and alarms

---

## Step 7 — Verify the Deployment

### Get the ALB URL

```bash
terraform output alb_dns_name
```

### Test the health endpoint

```bash
curl http://<ALB_DNS>/health
```

Expected response:
```json
{"status": "healthy", "service": "Borderless HMS", ...}
```

### Check ECS services are running

```bash
aws ecs describe-services \
  --cluster borderless-hms-production-cluster \
  --services borderless-hms-production-backend borderless-hms-production-frontend \
  --query 'services[].{Name:serviceName,Running:runningCount,Status:status}'
```

Both services should show `runningCount: 2` and `status: ACTIVE`.

### Open the app

Navigate to the ALB DNS URL in your browser. Login with:

| Username | Password |
|----------|----------|
| admin | Admin@12345 |

---

## Step 8 — Set Up CI/CD with GitHub Actions

The pipeline in `.github/workflows/deploy.yml` automatically builds and deploys on every push to `main`.

### Add GitHub Secrets

In your GitHub repo go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |

### Pipeline Flow

```
Push to main
  → Run pytest tests
  → Build Docker images with BuildKit cache
  → Push to ECR with git SHA tag
  → Force new ECS deployment
  → Wait for services to stabilize
  → Print ALB URL
```

### Trigger a Manual Deploy

In GitHub go to **Actions → Build, Push & Deploy to AWS ECS → Run workflow**.

---

## Monitoring

### View Live Logs

```bash
# Backend logs
aws logs tail /ecs/borderless-hms-production/backend --follow

# Filter for errors only
aws logs filter-log-events \
  --log-group-name /ecs/borderless-hms-production/backend \
  --filter-pattern "ERROR"
```

### CloudWatch Alarms

Pre-configured alarms trigger when:
- Backend CPU > 80%
- Backend memory > 80%

View in AWS Console → CloudWatch → Alarms.

### Prometheus Metrics

```bash
curl http://<ALB_DNS>/metrics
```

### Shell Access into a Running Container

```bash
TASK_ARN=$(aws ecs list-tasks \
  --cluster borderless-hms-production-cluster \
  --service-name borderless-hms-production-backend \
  --query 'taskArns[0]' --output text)

aws ecs execute-command \
  --cluster borderless-hms-production-cluster \
  --task $TASK_ARN \
  --container backend \
  --interactive \
  --command "/bin/sh"
```

---

## Auto-Scaling Behaviour

| Load | Tasks | CPU | Action |
|------|-------|-----|--------|
| Baseline | 2 | ~5% | Minimum capacity |
| Medium (250 users) | 3–5 | ~65% | Scale-out triggered |
| Heavy (500 users) | 8–15 | ~75% | Multiple scale events |
| Peak | 20 | 80%+ | Maximum capacity |

---

## Cost Optimisation Tips

| Change | Saving |
|--------|--------|
| Set `rds_multi_az = false` for dev/staging | ~$50/month |
| Use `rds_instance_class = "db.t3.micro"` for dev | ~$35/month |
| Set `frontend_min_tasks = 1`, `backend_min_tasks = 1` | ~$18/month |
| Use Fargate Spot for non-critical services | ~70% on compute |

---

## Cleanup

To destroy all AWS resources and stop incurring charges:

```bash
cd infrastructure
terraform destroy
```

Type `yes` to confirm. This takes **5–10 minutes**.

> This will delete everything including the RDS database and all data. Make sure to take a snapshot first if you need to keep the data.

### Take an RDS snapshot before destroying

```bash
aws rds create-db-snapshot \
  --db-instance-identifier borderless-hms-production-db \
  --db-snapshot-identifier borderless-hms-final-snapshot
```
