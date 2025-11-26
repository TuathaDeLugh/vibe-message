#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Images
FRONTEND_IMAGE="local/frontend:latest"
BACKEND_IMAGE="local/server:latest"
DEMO_IMAGE="local/demo:latest"

update_backend() {
    echo -e "${BLUE}Updating Backend...${NC}"
    echo -e "${YELLOW}Building backend image...${NC}"
    docker build -t ${BACKEND_IMAGE} ./server
    
    echo -e "${YELLOW}Loading image into Kind cluster...${NC}"
    kind load docker-image ${BACKEND_IMAGE} --name message-app-cluster
    
    echo -e "${YELLOW}Restarting backend deployment...${NC}"
    kubectl rollout restart deployment/backend -n message-app
    
    echo -e "${GREEN}✓ Backend updated successfully${NC}"
}

update_frontend() {
    echo -e "${BLUE}Updating Frontend...${NC}"
    echo -e "${YELLOW}Building frontend image...${NC}"
    docker build -t ${FRONTEND_IMAGE} ./frontend
    
    echo -e "${YELLOW}Loading image into Kind cluster...${NC}"
    kind load docker-image ${FRONTEND_IMAGE} --name message-app-cluster
    
    echo -e "${YELLOW}Restarting frontend deployment...${NC}"
    kubectl rollout restart deployment/frontend -n message-app
    
    echo -e "${GREEN}✓ Frontend updated successfully${NC}"
}

update_demo() {
    echo -e "${BLUE}Updating Notification Demo...${NC}"
    echo -e "${YELLOW}Building demo image...${NC}"
    docker build -t ${DEMO_IMAGE} ./notification-demo
    
    echo -e "${YELLOW}Loading image into Kind cluster...${NC}"
    kind load docker-image ${DEMO_IMAGE} --name message-app-cluster
    
    echo -e "${YELLOW}Restarting demo deployment...${NC}"
    kubectl rollout restart deployment/demo -n message-app
    
    echo -e "${GREEN}✓ Demo updated successfully${NC}"
}

# Interactive Menu
echo "========================================="
echo "   Kubernetes Application Updater"
echo "========================================="
echo "Which component would you like to update?"
echo "1) Backend (Server)"
echo "2) Frontend"
echo "3) Notification Demo"
echo "4) All Components"
echo "5) Exit"
echo "========================================="
read -p "Enter your choice [1-5]: " choice

case $choice in
    1)
        update_backend
        ;;
    2)
        update_frontend
        ;;
    3)
        update_demo
        ;;
    4)
        update_backend
        update_frontend
        update_demo
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${YELLOW}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Update process complete!${NC}"
