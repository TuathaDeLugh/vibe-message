# 🚀 Production Deployment Guide - vibe-message Platform

## 👉 **Your project will run on port: 80 (HTTP) / 443 (HTTPS)**

When deployed with Kubernetes + Ingress (recommended):
- **Frontend**: `http://localhost/` or `https://your-domain.com/`
- **Backend API**: `http://localhost/api/` or `https://your-domain.com/api/`
- **Demo App**: `http://localhost/demo/` or `https://your-domain.com/demo/`
- **API Documentation**: `http://localhost/api/api-docs/`

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Requirements](#2-requirements)
3. [Environment Variables](#3-environment-variables)
4. [Backend Deployment](#4-backend-deployment)
5. [Frontend Deployment](#5-frontend-deployment)
6. [Database Setup](#6-database-setup)
7. [Docker Deployment](#7-docker-deployment)
8. [Kubernetes Deployment](#8-kubernetes-deployment)
9. [Ingress & Reverse Proxy](#9-ingress--reverse-proxy)
10. [CI/CD Setup](#10-cicd-setup)
11. [Security & Hardening](#11-security--hardening)
12. [Monitoring & Logs](#12-monitoring--logs)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Project Overview

**vibe-message** is a Firebase Cloud Messaging-style notification platform with:

- **Backend**: Node.js + Express + TypeScript (Port 5000)
- **Frontend**: React + Vite + Nginx (Port 80 in container)
- **Demo App**: Next.js (Port 3000)
- **Database**: PostgreSQL 16
- **SDK**: JavaScript SDK for client integration

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Ingress (Port 80/443)                    │
│                      nginx-ingress                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│   Frontend   │      │   Backend    │     │     Demo     │
│  (React/Vite)│      │  (Express)   │     │  (Next.js)   │
│   Port: 80   │      │  Port: 5000  │     │  Port: 3000  │
└──────────────┘      └──────────────┘     └──────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │  PostgreSQL  │
                      │  Port: 5432  │
                      └──────────────┘
```

---

## 2. Requirements

### Development Environment
- **Node.js**: v18+ (v22 recommended)
- **npm**: v9+
- **PostgreSQL**: v14+ (v16 recommended)
- **Docker**: v20+ (for containerized deployment)
- **kubectl**: v1.27+ (for Kubernetes deployment)

### Production Environment
- **Kubernetes Cluster**: v1.27+
  - KIND (local development)
  - Minikube (local development)
  - GKE, EKS, AKS (cloud production)
- **Nginx Ingress Controller**
- **PostgreSQL**: Managed service or self-hosted
- **SSL Certificate**: For HTTPS (Let's Encrypt recommended)

### System Resources (Minimum)
- **Backend**: 128Mi RAM, 100m CPU
- **Frontend**: 64Mi RAM, 50m CPU
- **Demo**: 128Mi RAM, 100m CPU
- **PostgreSQL**: 512Mi RAM, 500m CPU

---

## 3. Environment Variables

### Backend Environment Variables

#### Required (Secrets)
```bash
# Database Connection
DATABASE_URL="postgresql://username:password@host:5432/messagedb"

# JWT Authentication
JWT_SECRET="your-secure-random-jwt-secret-key-min-32-chars"

# VAPID Keys for Web Push (generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_SUBJECT="mailto:your-email@domain.com"

# Super Admin Credentials
SUPER_ADMIN_EMAIL="admin@yourdomain.com"
SUPER_ADMIN_PASSWORD="SecurePassword@123"
SUPER_ADMIN_NAME="Super Admin"
```

#### Optional (ConfigMap)
```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN="https://yourdomain.com"
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

### Frontend Environment Variables

Frontend uses **build-time** environment variables (Vite):

```bash
# API URL (set in Dockerfile before build)
VITE_API_URL=/api
```

> **Note**: In Kubernetes deployment, the frontend uses `/api` as a relative path, which the Ingress routes to the backend service.

### Demo App Environment Variables

No environment variables required for the demo app.

---

## 4. Backend Deployment

### Local Development

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Setup Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Generate VAPID Keys**
   ```bash
   npx web-push generate-vapid-keys
   # Copy output to .env
   ```

4. **Initialize Database**
   ```bash
   npm run db:setup
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   # Server runs on http://localhost:3000
   ```

### Production Build

1. **Build TypeScript**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   # Runs on PORT from environment (default: 5000)
   ```

### Docker Deployment

```bash
# Build image
docker build -t vibe-message/backend:latest ./server

# Run container
docker run -d \
  --name vibe-backend \
  -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/messagedb" \
  -e JWT_SECRET="your-jwt-secret" \
  -e VAPID_PUBLIC_KEY="your-public-key" \
  -e VAPID_PRIVATE_KEY="your-private-key" \
  -e VAPID_SUBJECT="mailto:you@domain.com" \
  vibe-message/backend:latest
```

---

## 5. Frontend Deployment

### Local Development

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Link SDK** (if developing locally)
   ```bash
   cd ../sdk
   npm install
   npm run build
   npm link
   
   cd ../frontend
   npm link vibe-message
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

### Production Build

1. **Build for Production**
   ```bash
   npm run build
   # Output in ./dist directory
   ```

2. **Serve with Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /var/www/vibe-message;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /push-sw.js {
           add_header Service-Worker-Allowed /;
           add_header Cache-Control "no-cache";
       }
   }
   ```

### Docker Deployment

```bash
# Build image (includes Nginx)
docker build -t vibe-message/frontend:latest ./frontend

# Run container
docker run -d \
  --name vibe-frontend \
  -p 80:80 \
  vibe-message/frontend:latest
```

---

## 6. Database Setup

### PostgreSQL Installation

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS
```bash
brew install postgresql@16
brew services start postgresql@16
```

### Database Initialization

1. **Create Database**
   ```bash
   sudo -u postgres psql
   ```
   ```sql
   CREATE DATABASE messagedb;
   CREATE USER yourusername WITH PASSWORD 'yourpassword';
   GRANT ALL PRIVILEGES ON DATABASE messagedb TO yourusername;
   \q
   ```

2. **Initialize Schema**
   ```bash
   cd server
   npm run db:setup
   ```

### PostgreSQL Configuration for Production

Edit `/etc/postgresql/16/main/postgresql.conf`:

```conf
# Connection Settings
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'all'
log_duration = on

# Performance
work_mem = 4MB
maintenance_work_mem = 64MB
```

Edit `/etc/postgresql/16/main/pg_hba.conf`:

```conf
# Allow connections from Kubernetes pods
host    messagedb    yourusername    10.244.0.0/16    md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

## 7. Docker Deployment

### Using Individual Containers

1. **Build All Images**
   ```bash
   docker build -t local/frontend:latest ./frontend
   docker build -t local/server:latest ./server
   docker build -t local/demo:latest ./notification-demo
   ```

2. **Create Network**
   ```bash
   docker network create vibe-network
   ```

3. **Run PostgreSQL**
   ```bash
   docker run -d \
     --name postgres \
     --network vibe-network \
     -e POSTGRES_DB=messagedb \
     -e POSTGRES_USER=umang \
     -e POSTGRES_PASSWORD=secret1234 \
     -v postgres-data:/var/lib/postgresql/data \
     -p 5432:5432 \
     postgres:16-alpine
   ```

4. **Run Backend**
   ```bash
   docker run -d \
     --name backend \
     --network vibe-network \
     -e DATABASE_URL="postgresql://umang:secret1234@postgres:5432/messagedb" \
     -e JWT_SECRET="your-jwt-secret" \
     -e VAPID_PUBLIC_KEY="your-public-key" \
     -e VAPID_PRIVATE_KEY="your-private-key" \
     -e VAPID_SUBJECT="mailto:you@domain.com" \
     -e PORT=5000 \
     -p 5000:5000 \
     local/server:latest
   ```

5. **Run Frontend**
   ```bash
   docker run -d \
     --name frontend \
     --network vibe-network \
     -p 80:80 \
     local/frontend:latest
   ```

6. **Run Demo**
   ```bash
   docker run -d \
     --name demo \
     --network vibe-network \
     -p 3000:3000 \
     local/demo:latest
   ```

### Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: vibe-postgres
    environment:
      POSTGRES_DB: messagedb
      POSTGRES_USER: umang
      POSTGRES_PASSWORD: secret1234
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U umang"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./server
    container_name: vibe-backend
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: "postgresql://umang:secret1234@postgres:5432/messagedb"
      JWT_SECRET: "your-jwt-secret-change-in-production"
      VAPID_PUBLIC_KEY: "your-vapid-public-key"
      VAPID_PRIVATE_KEY: "your-vapid-private-key"
      VAPID_SUBJECT: "mailto:service@yourdomain.com"
      SUPER_ADMIN_EMAIL: "admin@yourdomain.com"
      SUPER_ADMIN_PASSWORD: "SuperAdmin@123"
      SUPER_ADMIN_NAME: "Super Admin"
      PORT: "5000"
      NODE_ENV: "production"
      CORS_ORIGIN: "http://localhost"
      ALLOWED_ORIGINS: "http://localhost"
    ports:
      - "5000:5000"

  frontend:
    build: ./frontend
    container_name: vibe-frontend
    depends_on:
      - backend
    ports:
      - "80:80"

  demo:
    build: ./notification-demo
    container_name: vibe-demo
    ports:
      - "3000:3000"

volumes:
  postgres-data:
```

**Deploy with Docker Compose:**
```bash
docker-compose up -d
```

**Access:**
- Frontend: http://localhost
- Backend: http://localhost:5000
- Demo: http://localhost:3000

---

## 8. Kubernetes Deployment

### Prerequisites

1. **Install kubectl**
   ```bash
   # Linux
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

   # macOS
   brew install kubectl
   ```

2. **Setup Local Kubernetes Cluster**

   **KIND (Recommended for local development):**
   ```bash
   # Install KIND
   curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
   chmod +x ./kind
   sudo mv ./kind /usr/local/bin/kind

   # Create cluster with port mappings
   kind create cluster --name message-app-cluster --config kind-config.yaml
   ```

   **Minikube:**
   ```bash
   # Install Minikube
   curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
   sudo install minikube-linux-amd64 /usr/local/bin/minikube

   # Start cluster
   minikube start
   ```

3. **Install Nginx Ingress Controller**

   **For KIND:**
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
   
   # Wait for ingress to be ready
   kubectl wait --namespace ingress-nginx \
     --for=condition=ready pod \
     --selector=app.kubernetes.io/component=controller \
     --timeout=90s
   ```

   **For Minikube:**
   ```bash
   minikube addons enable ingress
   ```

### Deployment Steps

#### Option 1: Automated Script (Recommended)

```bash
# Make script executable
chmod +x scripts/build_and_deploy_local.sh

# Run deployment script
./scripts/build_and_deploy_local.sh
```

This script will:
- Build all Docker images
- Load images into the cluster
- Apply all Kubernetes manifests
- Wait for deployments to be ready
- Display access information

#### Option 2: Manual Deployment

1. **Build Docker Images**
   ```bash
   docker build -t local/frontend:latest ./frontend
   docker build -t local/server:latest ./server
   docker build -t local/demo:latest ./notification-demo
   ```

2. **Load Images into Cluster**

   **KIND:**
   ```bash
   kind load docker-image local/frontend:latest --name message-app-cluster
   kind load docker-image local/server:latest --name message-app-cluster
   kind load docker-image local/demo:latest --name message-app-cluster
   ```

   **Minikube:**
   ```bash
   minikube image load local/frontend:latest
   minikube image load local/server:latest
   minikube image load local/demo:latest
   ```

3. **Configure Secrets**

   Edit `k8s/backend-secret.yaml` and update:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: Generate with `openssl rand -hex 32`
   - `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`: Generate with `npx web-push generate-vapid-keys`
   - `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_NAME`

4. **Apply Kubernetes Manifests**
   ```bash
   # Create namespace
   kubectl apply -f k8s/namespace.yaml

   # Apply secrets and configmaps
   kubectl apply -f k8s/backend-secret.yaml
   kubectl apply -f k8s/backend-configmap.yaml

   # Deploy applications
   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/frontend-deployment.yaml
   kubectl apply -f k8s/demo-deployment.yaml

   # Create services
   kubectl apply -f k8s/backend-service.yaml
   kubectl apply -f k8s/frontend-service.yaml
   kubectl apply -f k8s/demo-service.yaml

   # Apply ingress
   kubectl apply -f k8s/ingress.yaml
   ```

5. **Verify Deployment**
   ```bash
   # Check pods
   kubectl get pods -n message-app

   # Check services
   kubectl get svc -n message-app

   # Check ingress
   kubectl get ingress -n message-app
   ```

### Access Your Application

**KIND / Docker Desktop:**
```
Frontend: http://localhost/
Backend:  http://localhost/api/
Demo:     http://localhost/demo/
API Docs: http://localhost/api/api-docs/
```

**Minikube:**
```bash
# Run in separate terminal
minikube tunnel

# Then access at http://localhost/
```

### Kubernetes Management Commands

```bash
# View logs
kubectl logs -n message-app -l app=backend --tail=100
kubectl logs -n message-app -l app=frontend --tail=100
kubectl logs -n message-app -l app=demo --tail=100

# Restart deployments
kubectl rollout restart deployment/backend -n message-app
kubectl rollout restart deployment/frontend -n message-app
kubectl rollout restart deployment/demo -n message-app

# Scale deployments
kubectl scale deployment/backend --replicas=3 -n message-app

# Port-forward (alternative access)
kubectl port-forward -n message-app svc/backend 8081:5000
kubectl port-forward -n message-app svc/frontend 8080:80
kubectl port-forward -n message-app svc/demo 8082:3000

# Delete all resources
kubectl delete namespace message-app
```

---

## 9. Ingress & Reverse Proxy

### Nginx Ingress Configuration

The project includes an Ingress configuration at `k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: message-app-ingress
  namespace: message-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    nginx.ingress.kubernetes.io/use-regex: "true"
spec:
  ingressClassName: nginx
  rules:
    - host: localhost
      http:
        paths:
          # Backend API
          - path: /api(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: backend
                port:
                  number: 5000
          # Demo app
          - path: /demo(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: demo
                port:
                  number: 3000
          # Frontend (must be last)
          - path: /()(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

### SSL/HTTPS Setup with Let's Encrypt

1. **Install cert-manager**
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

2. **Create ClusterIssuer**

   Create `k8s/letsencrypt-issuer.yaml`:
   ```yaml
   apiVersion: cert-manager.io/v1
   kind: ClusterIssuer
   metadata:
     name: letsencrypt-prod
   spec:
     acme:
       server: https://acme-v02.api.letsencrypt.org/directory
       email: your-email@domain.com
       privateKeySecretRef:
         name: letsencrypt-prod
       solvers:
       - http01:
           ingress:
             class: nginx
   ```

   Apply:
   ```bash
   kubectl apply -f k8s/letsencrypt-issuer.yaml
   ```

3. **Update Ingress for HTTPS**

   Add to `k8s/ingress.yaml`:
   ```yaml
   metadata:
     annotations:
       cert-manager.io/cluster-issuer: "letsencrypt-prod"
       nginx.ingress.kubernetes.io/ssl-redirect: "true"
   spec:
     tls:
     - hosts:
       - yourdomain.com
       secretName: vibe-message-tls
     rules:
     - host: yourdomain.com
       # ... rest of configuration
   ```

4. **Apply Updated Ingress**
   ```bash
   kubectl apply -f k8s/ingress.yaml
   ```

### Standalone Nginx Reverse Proxy

If not using Kubernetes, configure Nginx:

```nginx
upstream backend {
    server localhost:5000;
}

upstream demo {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Backend API
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Demo app
    location /demo/ {
        proxy_pass http://demo/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        root /var/www/vibe-message;
        try_files $uri $uri/ /index.html;
    }

    # Service Worker
    location /push-sw.js {
        root /var/www/vibe-message;
        add_header Service-Worker-Allowed /;
        add_header Cache-Control "no-cache";
    }
}
```

---

## 10. CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Backend
        uses: docker/build-push-action@v5
        with:
          context: ./server
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/backend:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/backend:${{ github.sha }}

      - name: Build and push Frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/frontend:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/frontend:${{ github.sha }}

      - name: Build and push Demo
        uses: docker/build-push-action@v5
        with:
          context: ./notification-demo
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/demo:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/demo:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG }}" | base64 -d > kubeconfig
          export KUBECONFIG=./kubeconfig

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/backend backend=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/backend:${{ github.sha }} -n message-app
          kubectl set image deployment/frontend frontend=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/frontend:${{ github.sha }} -n message-app
          kubectl set image deployment/demo demo=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/demo:${{ github.sha }} -n message-app
          kubectl rollout status deployment/backend -n message-app
          kubectl rollout status deployment/frontend -n message-app
          kubectl rollout status deployment/demo -n message-app
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  REGISTRY: registry.gitlab.com
  IMAGE_PREFIX: $CI_PROJECT_PATH

build-backend:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $REGISTRY/$IMAGE_PREFIX/backend:$CI_COMMIT_SHA ./server
    - docker push $REGISTRY/$IMAGE_PREFIX/backend:$CI_COMMIT_SHA

build-frontend:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $REGISTRY/$IMAGE_PREFIX/frontend:$CI_COMMIT_SHA ./frontend
    - docker push $REGISTRY/$IMAGE_PREFIX/frontend:$CI_COMMIT_SHA

deploy:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context $KUBE_CONTEXT
    - kubectl set image deployment/backend backend=$REGISTRY/$IMAGE_PREFIX/backend:$CI_COMMIT_SHA -n message-app
    - kubectl set image deployment/frontend frontend=$REGISTRY/$IMAGE_PREFIX/frontend:$CI_COMMIT_SHA -n message-app
  only:
    - main
```

---

## 11. Security & Hardening

### Environment Security

1. **Never commit secrets to Git**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.production
   k8s/*-secret.yaml
   ```

2. **Use Kubernetes Secrets**
   ```bash
   # Create secret from file
   kubectl create secret generic backend-secret \
     --from-env-file=.env.production \
     -n message-app

   # Or from literal values
   kubectl create secret generic backend-secret \
     --from-literal=JWT_SECRET=$(openssl rand -hex 32) \
     -n message-app
   ```

3. **Rotate Secrets Regularly**
   ```bash
   # Generate new JWT secret
   openssl rand -hex 32

   # Update secret
   kubectl edit secret backend-secret -n message-app
   kubectl rollout restart deployment/backend -n message-app
   ```

### Database Security

1. **Use Strong Passwords**
   ```bash
   # Generate secure password
   openssl rand -base64 32
   ```

2. **Restrict Network Access**
   ```sql
   -- PostgreSQL: Allow only specific IPs
   -- Edit pg_hba.conf
   host    messagedb    umang    10.244.0.0/16    md5
   ```

3. **Enable SSL for Database Connections**
   ```bash
   DATABASE_URL="postgresql://user:pass@host:5432/messagedb?sslmode=require"
   ```

### Application Security

1. **Enable CORS Properly**
   ```typescript
   // In backend config
   ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
   ```

2. **Use HTTPS Only in Production**
   ```nginx
   # Force HTTPS redirect
   if ($scheme != "https") {
       return 301 https://$server_name$request_uri;
   }
   ```

3. **Set Security Headers**
   ```nginx
   add_header X-Frame-Options "SAMEORIGIN" always;
   add_header X-Content-Type-Options "nosniff" always;
   add_header X-XSS-Protection "1; mode=block" always;
   add_header Referrer-Policy "no-referrer-when-downgrade" always;
   add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
   ```

4. **Implement Rate Limiting**
   ```typescript
   // Already implemented in backend
   // See: server/src/middleware/rateLimiter.ts
   ```

### Kubernetes Security

1. **Use Network Policies**
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: backend-network-policy
     namespace: message-app
   spec:
     podSelector:
       matchLabels:
         app: backend
     policyTypes:
     - Ingress
     ingress:
     - from:
       - podSelector:
           matchLabels:
             app: frontend
       ports:
       - protocol: TCP
         port: 5000
   ```

2. **Use Pod Security Standards**
   ```yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: message-app
     labels:
       pod-security.kubernetes.io/enforce: restricted
       pod-security.kubernetes.io/audit: restricted
       pod-security.kubernetes.io/warn: restricted
   ```

3. **Limit Resource Usage**
   ```yaml
   # Already configured in deployments
   resources:
     requests:
       memory: "128Mi"
       cpu: "100m"
     limits:
       memory: "256Mi"
       cpu: "200m"
   ```

---

## 12. Monitoring & Logs

### Kubernetes Logs

```bash
# View real-time logs
kubectl logs -f -n message-app -l app=backend
kubectl logs -f -n message-app -l app=frontend
kubectl logs -f -n message-app -l app=demo

# View logs from all pods
kubectl logs -n message-app --all-containers=true --tail=100

# View logs from specific time
kubectl logs -n message-app -l app=backend --since=1h

# Export logs to file
kubectl logs -n message-app -l app=backend > backend-logs.txt
```

### Prometheus & Grafana Setup

1. **Install Prometheus Stack**
   ```bash
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm repo update
   
   helm install prometheus prometheus-community/kube-prometheus-stack \
     --namespace monitoring \
     --create-namespace
   ```

2. **Access Grafana**
   ```bash
   kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
   # Access at http://localhost:3000
   # Default credentials: admin / prom-operator
   ```

3. **Add ServiceMonitor for Backend**
   ```yaml
   apiVersion: monitoring.coreos.com/v1
   kind: ServiceMonitor
   metadata:
     name: backend-monitor
     namespace: message-app
   spec:
     selector:
       matchLabels:
         app: backend
     endpoints:
     - port: http
       path: /metrics
   ```

### Application Monitoring

Add health check endpoints (already implemented):

```typescript
// Backend health check
GET /health

// Response
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-11-26T16:48:10.000Z"
}
```

### Log Aggregation with ELK Stack

1. **Install Elasticsearch**
   ```bash
   helm repo add elastic https://helm.elastic.co
   helm install elasticsearch elastic/elasticsearch -n logging --create-namespace
   ```

2. **Install Kibana**
   ```bash
   helm install kibana elastic/kibana -n logging
   ```

3. **Install Filebeat**
   ```bash
   helm install filebeat elastic/filebeat -n logging
   ```

---

## 13. Troubleshooting

### Common Issues

#### 1. Pod CrashLoopBackOff

**Symptoms:**
```bash
kubectl get pods -n message-app
# Shows: CrashLoopBackOff
```

**Diagnosis:**
```bash
# Check pod logs
kubectl logs -n message-app <pod-name>

# Check pod events
kubectl describe pod -n message-app <pod-name>
```

**Common Causes:**
- Missing environment variables
- Database connection failure
- Port already in use
- Insufficient resources

**Solutions:**
```bash
# Check secrets
kubectl get secret backend-secret -n message-app -o yaml

# Verify database connectivity
kubectl exec -it -n message-app <backend-pod> -- sh
# Inside pod:
nc -zv postgres 5432

# Increase resources
kubectl edit deployment backend -n message-app
# Increase memory/CPU limits
```

#### 2. Ingress Not Working

**Symptoms:**
- 404 errors when accessing http://localhost/
- Connection refused

**Diagnosis:**
```bash
# Check ingress status
kubectl get ingress -n message-app
kubectl describe ingress message-app-ingress -n message-app

# Check ingress controller
kubectl get pods -n ingress-nginx
```

**Solutions:**
```bash
# Reinstall ingress controller (KIND)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# For Minikube, enable tunnel
minikube tunnel

# Check service endpoints
kubectl get endpoints -n message-app
```

#### 3. Database Connection Failed

**Symptoms:**
```
❌ Failed to start server: Error: connect ECONNREFUSED
```

**Solutions:**

**For Kubernetes with external PostgreSQL:**
```bash
# Find Docker network gateway
docker network inspect kind | grep Gateway
# Use gateway IP in DATABASE_URL (e.g., 172.23.0.1)

# Update secret
kubectl edit secret backend-secret -n message-app
# Change DATABASE_URL to use gateway IP
```

**For in-cluster PostgreSQL:**
```bash
# Deploy PostgreSQL
kubectl apply -f k8s/postgres-deployment.yaml

# Update DATABASE_URL
DATABASE_URL="postgresql://umang:secret1234@postgres:5432/messagedb"
```

#### 4. Frontend Can't Connect to Backend

**Symptoms:**
- API calls fail with CORS errors
- Network errors in browser console

**Solutions:**

1. **Check CORS configuration:**
   ```bash
   kubectl edit configmap backend-config -n message-app
   # Update ALLOWED_ORIGINS
   ```

2. **Verify Ingress routing:**
   ```bash
   kubectl get ingress -n message-app -o yaml
   # Check path routing
   ```

3. **Test backend directly:**
   ```bash
   kubectl port-forward -n message-app svc/backend 5000:5000
   curl http://localhost:5000/health
   ```

#### 5. Images Not Found in Cluster

**Symptoms:**
```
Failed to pull image "local/server:latest": rpc error: code = Unknown desc = failed to pull and unpack image
```

**Solutions:**

**KIND:**
```bash
# Load images
kind load docker-image local/server:latest --name message-app-cluster
kind load docker-image local/frontend:latest --name message-app-cluster
kind load docker-image local/demo:latest --name message-app-cluster
```

**Minikube:**
```bash
# Load images
minikube image load local/server:latest
minikube image load local/frontend:latest
minikube image load local/demo:latest
```

#### 6. Service Worker Not Registering

**Symptoms:**
- Push notifications not working
- Service worker 404 error

**Solutions:**

1. **Check service worker path:**
   ```javascript
   // In frontend code
   navigator.serviceWorker.register('/push-sw.js')
   ```

2. **Verify Nginx configuration:**
   ```nginx
   location /push-sw.js {
       add_header Service-Worker-Allowed /;
       add_header Cache-Control "no-cache";
   }
   ```

3. **Check file exists in container:**
   ```bash
   kubectl exec -it -n message-app <frontend-pod> -- ls -la /usr/share/nginx/html/push-sw.js
   ```

### Useful Debug Commands

```bash
# Get all resources in namespace
kubectl get all -n message-app

# Check resource usage
kubectl top pods -n message-app
kubectl top nodes

# Interactive shell in pod
kubectl exec -it -n message-app <pod-name> -- sh

# Copy files from pod
kubectl cp message-app/<pod-name>:/path/to/file ./local-file

# View events
kubectl get events -n message-app --sort-by='.lastTimestamp'

# Check DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup backend.message-app.svc.cluster.local

# Test network connectivity
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -- bash
# Inside pod:
curl http://backend.message-app.svc.cluster.local:5000/health
```

### Performance Optimization

1. **Enable Horizontal Pod Autoscaling**
   ```bash
   kubectl autoscale deployment backend -n message-app --cpu-percent=70 --min=2 --max=10
   ```

2. **Add Readiness/Liveness Probes** (already configured)

3. **Use PersistentVolumes for PostgreSQL** (already configured)

4. **Enable Caching**
   ```nginx
   # In Nginx config
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

---

## 📞 Support & Resources

### Documentation
- [Backend API Docs](http://localhost/api/api-docs/) (Swagger)
- [Kubernetes Docs](https://kubernetes.io/docs/)
- [Nginx Ingress Docs](https://kubernetes.github.io/ingress-nginx/)

### Project Files
- [`k8s/ENV-VARS.md`](./k8s/ENV-VARS.md) - Environment variables reference
- [`QUICKSTART-K8S.md`](./QUICKSTART-K8S.md) - Quick Kubernetes setup
- [`README.md`](./README.md) - Project overview

### Quick Reference

| Component | Port | Health Check | Logs Command |
|-----------|------|--------------|--------------|
| Backend | 5000 | `/health` | `kubectl logs -n message-app -l app=backend` |
| Frontend | 80 | N/A | `kubectl logs -n message-app -l app=frontend` |
| Demo | 3000 | `/` | `kubectl logs -n message-app -l app=demo` |
| PostgreSQL | 5432 | `pg_isready` | `kubectl logs -n message-app -l app=postgres` |

---

## 🎉 Deployment Checklist

Before going to production:

- [ ] Generate secure JWT_SECRET
- [ ] Generate VAPID keys for web push
- [ ] Configure DATABASE_URL with production database
- [ ] Set strong SUPER_ADMIN_PASSWORD
- [ ] Configure ALLOWED_ORIGINS for your domain
- [ ] Setup SSL/TLS certificates
- [ ] Enable HTTPS redirect
- [ ] Configure backup strategy for PostgreSQL
- [ ] Setup monitoring (Prometheus/Grafana)
- [ ] Configure log aggregation
- [ ] Test disaster recovery procedures
- [ ] Setup CI/CD pipeline
- [ ] Configure autoscaling
- [ ] Review and apply security best practices
- [ ] Test all endpoints
- [ ] Verify push notifications work
- [ ] Load test the application

---

**🚀 Happy Deploying!**
