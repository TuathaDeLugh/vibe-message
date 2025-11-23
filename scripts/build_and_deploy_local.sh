#!/bin/bash

set -e

echo "========================================="
echo "Local Kubernetes Build & Deploy Script"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect cluster type
detect_cluster() {
    if kubectl config current-context | grep -q "kind"; then
        echo "kind"
    elif kubectl config current-context | grep -q "minikube"; then
        echo "minikube"
    elif kubectl config current-context | grep -q "docker-desktop"; then
        echo "docker-desktop"
    else
        echo "unknown"
    fi
}

CLUSTER_TYPE=$(detect_cluster)
echo -e "${GREEN}Detected cluster type: ${CLUSTER_TYPE}${NC}"

# Image names
FRONTEND_IMAGE="local/frontend:latest"
BACKEND_IMAGE="local/server:latest"
DEMO_IMAGE="local/demo:latest"

# Build Docker images
echo ""
echo -e "${YELLOW}Building Docker images...${NC}"

echo "Building frontend..."
docker build -t ${FRONTEND_IMAGE} ./frontend

echo "Building backend..."
docker build -t ${BACKEND_IMAGE} ./server

echo "Building notification-demo..."
docker build -t ${DEMO_IMAGE} ./notification-demo

echo -e "${GREEN}✓ All images built successfully${NC}"

# Load images into cluster
echo ""
echo -e "${YELLOW}Loading images into cluster...${NC}"

case ${CLUSTER_TYPE} in
    "kind")
        echo "Loading images into kind cluster..."
        kind load docker-image ${FRONTEND_IMAGE}
        kind load docker-image ${BACKEND_IMAGE}
        kind load docker-image ${DEMO_IMAGE}
        ;;
    "minikube")
        echo "Loading images into minikube..."
        minikube image load ${FRONTEND_IMAGE}
        minikube image load ${BACKEND_IMAGE}
        minikube image load ${DEMO_IMAGE}
        ;;
    "docker-desktop")
        echo "Using Docker Desktop - images already available"
        ;;
    *)
        echo -e "${RED}Warning: Unknown cluster type. Images may not be available in cluster.${NC}"
        echo "You may need to push images to a registry or manually load them."
        ;;
esac

echo -e "${GREEN}✓ Images loaded into cluster${NC}"

# Apply Kubernetes manifests
echo ""
echo -e "${YELLOW}Applying Kubernetes manifests...${NC}"

# Create namespace
echo "Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Apply secrets and configmaps
echo "Applying secrets and configmaps..."
kubectl apply -f k8s/backend-secret.yaml
kubectl apply -f k8s/backend-configmap.yaml

# Apply deployments
echo "Applying deployments..."
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/demo-deployment.yaml

# Apply services
echo "Applying services..."
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/demo-service.yaml

# Apply ingress
echo "Applying ingress..."
kubectl apply -f k8s/ingress.yaml

echo -e "${GREEN}✓ All manifests applied${NC}"

# Wait for deployments
echo ""
echo -e "${YELLOW}Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available --timeout=120s deployment/frontend -n message-app
kubectl wait --for=condition=available --timeout=120s deployment/backend -n message-app
kubectl wait --for=condition=available --timeout=120s deployment/demo -n message-app

echo -e "${GREEN}✓ All deployments are ready${NC}"

# Display status
echo ""
echo "========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "========================================="
echo ""
echo "Namespace: message-app"
echo ""
echo "Pods:"
kubectl get pods -n message-app
echo ""
echo "Services:"
kubectl get svc -n message-app
echo ""
echo "Ingress:"
kubectl get ingress -n message-app
echo ""
echo "========================================="
echo "Access Information:"
echo "========================================="

case ${CLUSTER_TYPE} in
    "minikube")
        echo -e "${YELLOW}For minikube, run in a separate terminal:${NC}"
        echo "  minikube tunnel"
        echo ""
        echo "Then access:"
        echo "  Frontend: http://localhost/"
        echo "  Backend:  http://localhost/api/"
        echo "  Demo:     http://localhost/demo/"
        ;;
    "kind"|"docker-desktop")
        echo "Access your applications at:"
        echo "  Frontend: http://localhost/"
        echo "  Backend:  http://localhost/api/"
        echo "  Demo:     http://localhost/demo/"
        echo ""
        echo -e "${YELLOW}Note: Ensure nginx ingress controller is installed and running${NC}"
        ;;
esac

echo ""
echo "========================================="
echo "Troubleshooting Commands:"
echo "========================================="
echo "View logs:"
echo "  kubectl logs -n message-app -l app=frontend"
echo "  kubectl logs -n message-app -l app=backend"
echo "  kubectl logs -n message-app -l app=demo"
echo ""
echo "Describe pods:"
echo "  kubectl describe pod -n message-app -l app=frontend"
echo "  kubectl describe pod -n message-app -l app=backend"
echo "  kubectl describe pod -n message-app -l app=demo"
echo ""
echo "Check ingress:"
echo "  kubectl describe ingress -n message-app"
echo ""
echo "Port-forward (alternative access):"
echo "  kubectl port-forward -n message-app svc/frontend 8080:80"
echo "  kubectl port-forward -n message-app svc/backend 8081:5000"
echo "  kubectl port-forward -n message-app svc/demo 8082:3000"
echo "========================================="
