# Local Kubernetes Build & Deploy Script for Windows
# PowerShell version

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Local Kubernetes Build & Deploy Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Detect cluster type
function Get-ClusterType {
    $context = kubectl config current-context 2>$null
    if ($context -match "kind") {
        return "kind"
    } elseif ($context -match "minikube") {
        return "minikube"
    } elseif ($context -match "docker-desktop") {
        return "docker-desktop"
    } else {
        return "unknown"
    }
}

$clusterType = Get-ClusterType
Write-Host "Detected cluster type: $clusterType" -ForegroundColor Green

# Image names
$frontendImage = "local/frontend:latest"
$backendImage = "local/server:latest"
$demoImage = "local/demo:latest"

# Build Docker images
Write-Host ""
Write-Host "Building Docker images..." -ForegroundColor Yellow

Write-Host "Building frontend..."
docker build -t $frontendImage ./frontend
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }

Write-Host "Building backend..."
docker build -t $backendImage ./server
if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }

Write-Host "Building notification-demo..."
docker build -t $demoImage ./notification-demo
if ($LASTEXITCODE -ne 0) { throw "Demo build failed" }

Write-Host "✓ All images built successfully" -ForegroundColor Green

# Load images into cluster
Write-Host ""
Write-Host "Loading images into cluster..." -ForegroundColor Yellow

switch ($clusterType) {
    "kind" {
        Write-Host "Loading images into kind cluster..."
        kind load docker-image $frontendImage
        kind load docker-image $backendImage
        kind load docker-image $demoImage
    }
    "minikube" {
        Write-Host "Loading images into minikube..."
        minikube image load $frontendImage
        minikube image load $backendImage
        minikube image load $demoImage
    }
    "docker-desktop" {
        Write-Host "Using Docker Desktop - images already available"
    }
    default {
        Write-Host "Warning: Unknown cluster type. Images may not be available in cluster." -ForegroundColor Red
        Write-Host "You may need to push images to a registry or manually load them."
    }
}

Write-Host "✓ Images loaded into cluster" -ForegroundColor Green

# Apply Kubernetes manifests
Write-Host ""
Write-Host "Applying Kubernetes manifests..." -ForegroundColor Yellow

# Create namespace
Write-Host "Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Apply secrets and configmaps
Write-Host "Applying secrets and configmaps..."
kubectl apply -f k8s/backend-secret.yaml
kubectl apply -f k8s/backend-configmap.yaml

# Apply deployments
Write-Host "Applying deployments..."
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/demo-deployment.yaml

# Apply services
Write-Host "Applying services..."
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/demo-service.yaml

# Apply ingress
Write-Host "Applying ingress..."
kubectl apply -f k8s/ingress.yaml

Write-Host "✓ All manifests applied" -ForegroundColor Green

# Wait for deployments
Write-Host ""
Write-Host "Waiting for deployments to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=120s deployment/frontend -n message-app
kubectl wait --for=condition=available --timeout=120s deployment/backend -n message-app
kubectl wait --for=condition=available --timeout=120s deployment/demo -n message-app

Write-Host "✓ All deployments are ready" -ForegroundColor Green

# Display status
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Namespace: message-app"
Write-Host ""
Write-Host "Pods:"
kubectl get pods -n message-app
Write-Host ""
Write-Host "Services:"
kubectl get svc -n message-app
Write-Host ""
Write-Host "Ingress:"
kubectl get ingress -n message-app
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Access Information:" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

switch ($clusterType) {
    "minikube" {
        Write-Host "For minikube, run in a separate terminal:" -ForegroundColor Yellow
        Write-Host "  minikube tunnel"
        Write-Host ""
        Write-Host "Then access:"
        Write-Host "  Frontend: http://localhost/"
        Write-Host "  Backend:  http://localhost/api/"
        Write-Host "  Demo:     http://localhost/demo/"
    }
    default {
        Write-Host "Access your applications at:"
        Write-Host "  Frontend: http://localhost/"
        Write-Host "  Backend:  http://localhost/api/"
        Write-Host "  Demo:     http://localhost/demo/"
        Write-Host ""
        Write-Host "Note: Ensure nginx ingress controller is installed and running" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Troubleshooting Commands:" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "View logs:"
Write-Host "  kubectl logs -n message-app -l app=frontend"
Write-Host "  kubectl logs -n message-app -l app=backend"
Write-Host "  kubectl logs -n message-app -l app=demo"
Write-Host ""
Write-Host "Describe pods:"
Write-Host "  kubectl describe pod -n message-app -l app=frontend"
Write-Host "  kubectl describe pod -n message-app -l app=backend"
Write-Host "  kubectl describe pod -n message-app -l app=demo"
Write-Host ""
Write-Host "Check ingress:"
Write-Host "  kubectl describe ingress -n message-app"
Write-Host ""
Write-Host "Port-forward (alternative access):"
Write-Host "  kubectl port-forward -n message-app svc/frontend 8080:80"
Write-Host "  kubectl port-forward -n message-app svc/backend 8081:5000"
Write-Host "  kubectl port-forward -n message-app svc/demo 8082:3000"
Write-Host "=========================================" -ForegroundColor Cyan
