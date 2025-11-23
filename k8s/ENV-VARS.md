# Environment Variables Configuration for Kubernetes

## Overview

This document explains how environment variables are handled in the Kubernetes deployment for each application.

## Backend (server)

**Environment variables injected at runtime** via ConfigMap and Secret:

### From ConfigMap (`backend-config`)

- `PORT=5000`
- `NODE_ENV=production`
- `CORS_ORIGIN=http://localhost`

### From Secret (`backend-secret`)

- `DATABASE_URL` - PostgreSQL connection string ⚠️ **MUST BE CONFIGURED**
- `JWT_SECRET` - JWT signing key
- `VAPID_PUBLIC_KEY` - Web push public key
- `VAPID_PRIVATE_KEY` - Web push private key
- `VAPID_SUBJECT` - Web push subject (mailto:)

See [`k8s/backend-deployment.yaml`](file:///c:/Users/Umang%20Sailor/Desktop/Projects/message/k8s/backend-deployment.yaml) for the full configuration.

## Frontend (React + Vite)

**Environment variables set at build-time** in Dockerfile:

### Build-time Variable

- `VITE_API_URL=/api`

**Important Notes:**

- Vite environment variables are **build-time only** - they get compiled into the JavaScript bundle
- The Dockerfile creates a `.env` file with `VITE_API_URL=/api` before building
- This relative path `/api` works with the Kubernetes ingress routing
- The ingress routes `/api/*` → backend service

**Why relative path?**

- When accessed via `http://localhost/`, the frontend calls `/api` which the ingress routes to the backend
- This avoids hardcoding URLs and works seamlessly with the ingress configuration

See [`frontend/Dockerfile`](file:///c:/Users/Umang%20Sailor/Desktop/Projects/message/frontend/Dockerfile) lines 15-17.

## Notification Demo (Next.js)

**No environment variables configured.**

The notification-demo app doesn't use any environment variables. It's a client-side demo application.

## How to Modify Environment Variables

### Backend Runtime Variables

**Non-sensitive (ConfigMap):**

1. Edit [`k8s/backend-configmap.yaml`](file:///c:/Users/Umang%20Sailor/Desktop/Projects/message/k8s/backend-configmap.yaml)
2. Apply changes:
   ```bash
   kubectl apply -f k8s/backend-configmap.yaml
   kubectl rollout restart deployment/backend -n message-app
   ```

**Sensitive (Secret):**

1. Edit [`k8s/backend-secret.yaml`](file:///c:/Users/Umang%20Sailor/Desktop/Projects/message/k8s/backend-secret.yaml)
2. Apply changes:
   ```bash
   kubectl apply -f k8s/backend-secret.yaml
   kubectl rollout restart deployment/backend -n message-app
   ```

### Frontend Build-time Variables

To change the API URL or add new Vite variables:

1. Edit [`frontend/Dockerfile`](file:///c:/Users/Umang%20Sailor/Desktop/Projects/message/frontend/Dockerfile) line 17
2. Rebuild and redeploy:
   ```bash
   docker build -t local/frontend:latest ./frontend
   kind load docker-image local/frontend:latest  # or minikube image load
   kubectl rollout restart deployment/frontend -n message-app
   ```

**Example - Custom API URL:**

```dockerfile
# In frontend/Dockerfile, change line 17 to:
RUN echo "VITE_API_URL=https://api.example.com" > .env
```

### Demo App Variables

If you need to add environment variables to the demo app:

1. Create a ConfigMap for demo:

   ```yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: demo-config
     namespace: message-app
   data:
     NEXT_PUBLIC_API_URL: "http://localhost/api"
   ```

2. Update [`k8s/demo-deployment.yaml`](file:///c:/Users/Umang%20Sailor/Desktop/Projects/message/k8s/demo-deployment.yaml) to inject env vars:
   ```yaml
   env:
     - name: NEXT_PUBLIC_API_URL
       valueFrom:
         configMapKeyRef:
           name: demo-config
           key: NEXT_PUBLIC_API_URL
   ```

## Summary Table

| App      | Method            | Variables                                                       | Modifiable At                 |
| -------- | ----------------- | --------------------------------------------------------------- | ----------------------------- |
| Backend  | Runtime injection | DATABASE*URL, JWT_SECRET, VAPID*\*, PORT, NODE_ENV, CORS_ORIGIN | Runtime (kubectl apply)       |
| Frontend | Build-time        | VITE_API_URL=/api                                               | Build time (rebuild required) |
| Demo     | None              | N/A                                                             | N/A                           |

## Important Reminders

⚠️ **Before first deployment:**

- Edit `k8s/backend-secret.yaml` and replace `REPLACE_WITH_DB_CONNECTION_STRING` with your actual PostgreSQL connection string

⚠️ **Frontend API URL:**

- The frontend is built with `VITE_API_URL=/api` to work with ingress routing
- Do NOT change this unless you modify the ingress configuration

⚠️ **CORS Configuration:**

- The backend's `CORS_ORIGIN` is set to `http://localhost` in the ConfigMap
- Adjust this if deploying to a different domain
