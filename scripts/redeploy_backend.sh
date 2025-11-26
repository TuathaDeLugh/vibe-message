#!/bin/bash

set -e

echo "========================================="
echo "Redeploying Backend to Kind Cluster"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_IMAGE="local/server:latest"

# 1. Build Docker image
echo -e "${YELLOW}Building backend image...${NC}"
docker build -t ${BACKEND_IMAGE} ./server

# 2. Load image into Kind cluster
echo -e "${YELLOW}Loading image into Kind cluster...${NC}"
kind load docker-image ${BACKEND_IMAGE} --name message-app-cluster

# 3. Restart deployment
echo -e "${YELLOW}Restarting backend deployment...${NC}"
kubectl rollout restart deployment/backend -n message-app

# 4. Wait for rollout to complete
echo -e "${YELLOW}Waiting for rollout to complete...${NC}"
kubectl rollout status deployment/backend -n message-app

echo -e "${GREEN}✓ Backend redeployed successfully${NC}"
