# 🚀 Quick Deploy to KIND

**Simple, fast deployment to your KIND cluster.**

## 👉 Access After Deployment
- **Frontend**: http://localhost/
- **Backend API**: http://localhost/api/
- **Demo App**: http://localhost/demo/

---

## Prerequisites

✅ KIND cluster running (already done!)
✅ kubectl configured
✅ Docker running

---

## One-Command Deploy

```bash
sudo ./scripts/build_and_deploy_local.sh
```

That's it! The script will:
1. Build all Docker images
2. Load them into KIND
3. Deploy everything to Kubernetes
4. Wait for pods to be ready

---

## Manual Deploy (Step by Step)

### 1. Build Images
```bash
sudo docker build -t local/frontend:latest ./frontend
sudo docker build -t local/server:latest ./server
sudo docker build -t local/demo:latest ./notification-demo
```

### 2. Load into KIND
```bash
sudo kind load docker-image local/frontend:latest --name message-app-cluster
sudo kind load docker-image local/server:latest --name message-app-cluster
sudo kind load docker-image local/demo:latest --name message-app-cluster
```

### 3. Install Nginx Ingress (First Time Only)
```bash
sudo kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress to be ready
sudo kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

### 4. Deploy Application
```bash
# Create namespace
sudo kubectl apply -f k8s/namespace.yaml

# Deploy secrets and config
sudo kubectl apply -f k8s/backend-secret.yaml
sudo kubectl apply -f k8s/backend-configmap.yaml

# Deploy applications
sudo kubectl apply -f k8s/backend-deployment.yaml
sudo kubectl apply -f k8s/frontend-deployment.yaml
sudo kubectl apply -f k8s/demo-deployment.yaml

# Create services
sudo kubectl apply -f k8s/backend-service.yaml
sudo kubectl apply -f k8s/frontend-service.yaml
sudo kubectl apply -f k8s/demo-service.yaml

# Create ingress
sudo kubectl apply -f k8s/ingress.yaml
```

### 5. Wait for Pods
```bash
sudo kubectl wait --for=condition=available --timeout=120s deployment/frontend -n message-app
sudo kubectl wait --for=condition=available --timeout=120s deployment/backend -n message-app
sudo kubectl wait --for=condition=available --timeout=120s deployment/demo -n message-app
```

---

## Check Status

```bash
# View all pods
sudo kubectl get pods -n message-app

# View services
sudo kubectl get svc -n message-app

# View ingress
sudo kubectl get ingress -n message-app
```

---

## View Logs

```bash
# Backend logs
sudo kubectl logs -n message-app -l app=backend --tail=50

# Frontend logs
sudo kubectl logs -n message-app -l app=frontend --tail=50

# Demo logs
sudo kubectl logs -n message-app -l app=demo --tail=50

# Follow logs (real-time)
sudo kubectl logs -f -n message-app -l app=backend
```

---

## Restart Deployments

```bash
# Restart backend
sudo kubectl rollout restart deployment/backend -n message-app

# Restart frontend
sudo kubectl rollout restart deployment/frontend -n message-app

# Restart demo
sudo kubectl rollout restart deployment/demo -n message-app

# Restart all
sudo kubectl rollout restart deployment -n message-app
```

---

## Update After Code Changes

```bash
# 1. Rebuild the changed component
sudo docker build -t local/backend:latest ./server

# 2. Load into KIND
sudo kind load docker-image local/backend:latest --name message-app-cluster

# 3. Restart deployment
sudo kubectl rollout restart deployment/backend -n message-app

# 4. Watch rollout
sudo kubectl rollout status deployment/backend -n message-app
```

---

## Clean Up

```bash
# Delete all resources
sudo kubectl delete namespace message-app

# Delete cluster
sudo kind delete cluster --name message-app-cluster
```

---

## Troubleshooting

### Pod Not Starting?
```bash
# Check pod status
sudo kubectl describe pod -n message-app <pod-name>

# Check logs
sudo kubectl logs -n message-app <pod-name>
```

### Can't Access at localhost?
```bash
# Check ingress
sudo kubectl get ingress -n message-app

# Check ingress controller
sudo kubectl get pods -n ingress-nginx
```

### Database Connection Issues?
```bash
# Check backend secret
sudo kubectl get secret backend-secret -n message-app -o yaml

# The DATABASE_URL should use 172.23.0.1 (Docker gateway) if using host PostgreSQL
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `sudo kubectl get pods -n message-app` | List all pods |
| `sudo kubectl logs -n message-app -l app=backend` | View backend logs |
| `sudo kubectl rollout restart deployment/backend -n message-app` | Restart backend |
| `sudo kubectl delete pod <pod-name> -n message-app` | Delete specific pod |
| `sudo kubectl exec -it <pod-name> -n message-app -- sh` | Shell into pod |

---

**For detailed production deployment, SSL, monitoring, etc., see [DEPLOYMENT.md](./DEPLOYMENT.md)**
