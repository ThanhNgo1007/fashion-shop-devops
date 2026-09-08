#!/usr/bin/env bash
# docker-push.sh
# Build and push Docker images to AWS ECR

set -euo pipefail

REGISTRY=""
TAG="latest"

usage() {
    echo "Usage: $0 --registry <registry> [--tag <tag>]"
    echo "  --registry   ECR Registry URI (e.g., 123456789012.dkr.ecr.us-east-1.amazonaws.com)"
    echo "  --tag        Image tag (default: latest)"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

if [[ -z "$REGISTRY" ]]; then
    echo "Error: --registry is required"
    usage
fi

SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "Starting Docker build and push for Registry: $REGISTRY, Tags: $TAG, $SHA"

# ECR login
echo "Logging into ECR..."
aws ecr get-login-password | docker login --username AWS --password-stdin "$REGISTRY"

echo "Building backend image..."
docker build -t "$REGISTRY/fashionshop-backend:$TAG" -t "$REGISTRY/fashionshop-backend:$SHA" ./backend

echo "Building frontend image..."
docker build -t "$REGISTRY/fashionshop-frontend:$TAG" -t "$REGISTRY/fashionshop-frontend:$SHA" ./frontend

echo "Pushing backend images..."
docker push "$REGISTRY/fashionshop-backend:$TAG"
docker push "$REGISTRY/fashionshop-backend:$SHA"

echo "Pushing frontend images..."
docker push "$REGISTRY/fashionshop-frontend:$TAG"
docker push "$REGISTRY/fashionshop-frontend:$SHA"

echo "Docker images successfully built and pushed!"
