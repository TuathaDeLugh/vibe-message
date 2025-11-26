# Local Kubernetes Deployment Guide

This guide provides step-by-step instructions to deploy the message application stack (frontend, backend, and notification-demo) to a local Kubernetes cluster.

## Prerequisites

Install the following tools before proceeding:

### Required Tools

1. **Docker** - Container runtime

   ```bash
   # Verify installation
   docker --version
   ```

2. **kubectl** - Kubernetes CLI

   ```bash
   # Verify installation
   kubectl version --client
   ```

3. **Local Kubernetes Cluster** - Choose one:
   - **kind** (Kubernetes in Docker) - Recommended
   - **minikube** - Alternative option
   - **Docker Desktop** - Built-in Kubernetes

### Install kind (Recommended)

```bash
# macOS
brew install kind

# Linux
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Verify
kind version
```

### Install minikube (Alternative)

```bash
# macOS
brew install minikube

# Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Verify
minikube version
```

## Step 1: Create Local Kubernetes Cluster

### Option A: Using kind

```bash
kind create cluster --name message-app-cluster
```

### Option B: Using minikube

```bash
minikube start --driver=docker
```

### Option C: Using Docker Desktop

Enable Kubernetes in Docker Desktop settings (Settings → Kubernetes → Enable Kubernetes).

## Step 2: Install nginx Ingress Controller

### For kind

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

Wait for the ingress controller to be ready:

```bash
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=90s
```

### For minikube

```bash
minikube addons enable ingress
```

### For Docker Desktop

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

Wait for the ingress controller:

```bash
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=90s
```

## Step 3: Configure Database Connection

**IMPORTANT:** Before deploying, you must configure the database connection string.

Edit the file `k8s/backend-secret.yaml` and replace the placeholder values:

```yaml
stringData:
  # REPLACE THIS with your actual PostgreSQL connection string
  DATABASE_URL: "postgresql://user:password@host:5432/database"

  # REPLACE with a secure random JWT secret
  JWT_SECRET: "your-secure-jwt-secret-here"

  # REPLACE with your VAPID keys (from your .env file)
  VAPID_PUBLIC_KEY: "your-vapid-public-key"
  VAPID_PRIVATE_KEY: "your-vapid-private-key"
  VAPID_SUBJECT: "mailto:your-email@example.com"
```

**Where to find these values:**

- `DATABASE_URL`: Your PostgreSQL connection string (from `server/.env`)
- `JWT_SECRET`: Generate with `openssl rand -base64 32` or use existing from `server/.env`
- `VAPID_*`: Copy from your `server/.env` file

## Step 4: Build and Deploy

### For Linux / macOS

From the repository root, run the deployment script:

```bash
chmod +x scripts/build_and_deploy_local.sh
./scripts/build_and_deploy_local.sh
```

### For Windows

From the repository root, run the PowerShell script:

```powershell
.\scripts\build_and_deploy_local.ps1
```

**Note:** You may need to allow script execution:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### What the script does

This script will:

1. Detect your cluster type (kind/minikube/docker-desktop)
2. Build Docker images for all three applications
3. Load images into your local cluster
4. Apply all Kubernetes manifests
5. Wait for deployments to be ready
6. Display access information

## Step 5: Access Applications

### For kind or Docker Desktop

Access applications directly at:

- **Frontend**: http://localhost/
- **Backend API**: http://localhost/api/
- **Notification Demo**: http://localhost/demo/

### For minikube

Run in a separate terminal (keep it running):

```bash
minikube tunnel
```

Then access:

- **Frontend**: http://localhost/
- **Backend API**: http://localhost/api/
- **Notification Demo**: http://localhost/demo/

## Verification Steps

### 1. Check all pods are running

```bash
kubectl get pods -n message-app
```

Expected output: All pods should show `STATUS: Running` and `READY: 1/1`

### 2. Check services

```bash
kubectl get svc -n message-app
```

Expected output: Three services (frontend, backend, demo) with `TYPE: ClusterIP`

### 3. Check ingress

```bash
kubectl get ingress -n message-app
```

Expected output: One ingress with `CLASS: nginx` and `ADDRESS` populated

### 4. Test endpoints

```bash
# Test frontend
curl http://localhost/

# Test backend health
curl http://localhost/api/health

# Test demo
curl http://localhost/demo/
```

## Troubleshooting

### Pods not starting

Check pod status and events:

```bash
kubectl describe pod -n message-app -l app=frontend
kubectl describe pod -n message-app -l app=backend
kubectl describe pod -n message-app -l app=demo
```

View pod logs:

```bash
kubectl logs -n message-app -l app=frontend
kubectl logs -n message-app -l app=backend
kubectl logs -n message-app -l app=demo
```

### Backend pod CrashLoopBackOff

This usually means the database connection failed. Check:

1. Verify `DATABASE_URL` in `k8s/backend-secret.yaml` is correct
2. Ensure your PostgreSQL database is accessible from the cluster
3. Check backend logs:
   ```bash
   kubectl logs -n message-app -l app=backend
   ```

### Ingress not working

Check ingress controller is running:

```bash
kubectl get pods -n ingress-nginx
```

Describe the ingress for events:

```bash
kubectl describe ingress -n message-app
```

Check ingress controller logs:

```bash
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

### Images not found (ImagePullBackOff)

This means images weren't loaded into the cluster. Re-run:

```bash
# For kind
kind load docker-image local/frontend:latest
kind load docker-image local/server:latest
kind load docker-image local/demo:latest

# For minikube
minikube image load local/frontend:latest
minikube image load local/server:latest
minikube image load local/demo:latest
```

### Port conflicts

If port 80 is already in use, use port-forwarding instead:

```bash
# Frontend on port 8080
kubectl port-forward -n message-app svc/frontend 8080:80

# Backend on port 8081
kubectl port-forward -n message-app svc/backend 8081:5000

# Demo on port 8082
kubectl port-forward -n message-app svc/demo 8082:3000
```

Then access at:

- Frontend: http://localhost:8080/
- Backend: http://localhost:8081/
- Demo: http://localhost:8082/

## Useful Commands

### View all resources

```bash
kubectl get all -n message-app
```

### Restart a deployment

```bash
kubectl rollout restart deployment/backend -n message-app
kubectl rollout restart deployment/frontend -n message-app
kubectl rollout restart deployment/demo -n message-app
```

### Update secrets

After editing `k8s/backend-secret.yaml`:

```bash
kubectl apply -f k8s/backend-secret.yaml
kubectl rollout restart deployment/backend -n message-app
```

### Scale deployments

```bash
kubectl scale deployment/backend --replicas=2 -n message-app
```

### Execute commands in a pod

```bash
# Get a shell in the backend pod
kubectl exec -it -n message-app deployment/backend -- sh

# Run a specific command
kubectl exec -n message-app deployment/backend -- env
```

### View resource usage

```bash
kubectl top pods -n message-app
kubectl top nodes
```

## Clean Up

### Delete all resources

```bash
kubectl delete namespace message-app
```

### Delete the cluster

```bash
# For kind
kind delete cluster --name message-app-cluster

# For minikube
minikube delete
```

## Production Considerations

This setup is for **local development only**. For production:

1. Use proper secrets management (e.g., Sealed Secrets, External Secrets Operator)
2. Configure resource limits based on actual usage
3. Set up horizontal pod autoscaling
4. Use persistent volumes for stateful components
5. Configure proper TLS/SSL certificates
6. Set up monitoring and logging (Prometheus, Grafana, ELK)
7. Implement proper backup and disaster recovery
8. Use a managed Kubernetes service (GKE, EKS, AKS)
9. Configure network policies for security
10. Set up CI/CD pipelines for automated deployments

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kind Documentation](https://kind.sigs.k8s.io/)
- [minikube Documentation](https://minikube.sigs.k8s.io/)
- [nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
