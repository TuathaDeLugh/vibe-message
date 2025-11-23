# Quick Start - Kubernetes Deployment

## TL;DR - One Command Deployment

### Prerequisites Check

```bash
# Verify you have these installed:
docker --version
kubectl version --client
kind version  # or minikube version
```

### 1. Create Cluster (if needed)

```bash
# Using kind (recommended)
kind create cluster --name message-app-cluster

# OR using minikube
minikube start --driver=docker
```

### 2. Install nginx Ingress

```bash
# For kind
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=90s

# For minikube
minikube addons enable ingress
```

### 3. Configure Database Connection

Edit `k8s/backend-secret.yaml` and replace:

```yaml
DATABASE_URL: "REPLACE_WITH_DB_CONNECTION_STRING"
```

With your actual PostgreSQL connection string from `server/.env`

### 4. Deploy Everything

```bash
# Linux/macOS
chmod +x scripts/build_and_deploy_local.sh
./scripts/build_and_deploy_local.sh

# Windows PowerShell
.\scripts\build_and_deploy_local.ps1
```

### 5. Access Applications

**For kind/Docker Desktop:**

- Frontend: http://localhost/
- Backend: http://localhost/api/
- Demo: http://localhost/demo/

**For minikube (run in separate terminal):**

```bash
minikube tunnel
```

Then access same URLs as above.

## Quick Troubleshooting

### Check Status

```bash
kubectl get all -n message-app
```

### View Logs

```bash
kubectl logs -n message-app -l app=backend --tail=50
```

### Restart Backend

```bash
kubectl rollout restart deployment/backend -n message-app
```

### Port Forward (if ingress not working)

```bash
kubectl port-forward -n message-app svc/frontend 8080:80
kubectl port-forward -n message-app svc/backend 8081:5000
kubectl port-forward -n message-app svc/demo 8082:3000
```

## File Structure

```
message/
├── frontend/
│   └── Dockerfile                    # React app with nginx
├── server/
│   └── Dockerfile                    # Node.js/Express backend
├── notification-demo/
│   └── Dockerfile                    # Next.js demo app
├── k8s/
│   ├── namespace.yaml                # message-app namespace
│   ├── backend-secret.yaml           # DB credentials (EDIT THIS!)
│   ├── backend-configmap.yaml        # Non-sensitive config
│   ├── frontend-deployment.yaml      # Frontend deployment
│   ├── backend-deployment.yaml       # Backend deployment
│   ├── demo-deployment.yaml          # Demo deployment
│   ├── frontend-service.yaml         # Frontend service
│   ├── backend-service.yaml          # Backend service
│   ├── demo-service.yaml             # Demo service
│   └── ingress.yaml                  # nginx ingress routing
├── scripts/
│   ├── build_and_deploy_local.sh     # Bash deployment script
│   └── build_and_deploy_local.ps1    # PowerShell deployment script
└── README-deploy.md                  # Full documentation
```

## What Gets Deployed

| Component | Image                 | Port | Path  | Service  |
| --------- | --------------------- | ---- | ----- | -------- |
| Frontend  | local/frontend:latest | 80   | /     | frontend |
| Backend   | local/server:latest   | 5000 | /api  | backend  |
| Demo      | local/demo:latest     | 3000 | /demo | demo     |

All deployed to namespace: `message-app`

## Common Issues

**Backend CrashLoopBackOff?**
→ Check DATABASE_URL in `k8s/backend-secret.yaml`

**ImagePullBackOff?**
→ Re-run the deployment script to reload images

**Ingress not working?**
→ Verify nginx ingress controller is running:

```bash
kubectl get pods -n ingress-nginx
```

**Port 80 in use?**
→ Use port-forward commands above

For detailed documentation, see [README-deploy.md](./README-deploy.md)
