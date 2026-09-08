# Day 3: CI/CD Pipeline

## Overview
This document covers the continuous integration and continuous deployment pipeline for the FashionShop project, utilizing GitHub Actions and AWS ECR.

## Architecture

```text
Developer -> GitHub (Push) -> GitHub Actions
                                ├── Lint & Test
                                ├── Build Docker Images
                                └── Push to AWS ECR
```

## GitHub Secrets
To authenticate and push to ECR, the following secrets must be configured in the GitHub repository:
- `AWS_ACCESS_KEY_ID`: IAM user access key
- `AWS_SECRET_ACCESS_KEY`: IAM user secret key
- `AWS_REGION`: Target AWS region (e.g., `us-east-1`)
- `ECR_REGISTRY`: The ECR registry URI

## Setting up ECR Repositories
Create repositories for both the frontend and backend:
```bash
aws ecr create-repository --repository-name fashionshop-frontend
aws ecr create-repository --repository-name fashionshop-backend
```

## Triggering Deployments
The pipeline triggers automatically on pushes to the `main` branch. 
Manual deployment pushes can be run using the `docker-push.sh` script:
```bash
./scripts/docker-push.sh --registry <ECR_REGISTRY>
```

## Verification
After deployment, run the smoke test script to verify services:
```bash
./scripts/smoke-test.sh http://<deployment-url>
```
