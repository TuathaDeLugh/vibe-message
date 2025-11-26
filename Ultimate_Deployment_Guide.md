# Ultimate Deployment Guide

This guide provides a complete walkthrough for setting up your environment, deploying the application stack, and managing updates on a local Kubernetes cluster using `kind`.

## 1. Prerequisites & Installation

### Install Docker
Ensure Docker is installed and running.
```bash
docker --version
```

### Install kubectl
The Kubernetes command-line tool.

**Linux:**
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

**macOS:**
```bash
brew install kubectl
```

### Install kind
Kubernetes in Docker.

**Linux:**
```bash
# For AMD64 / x86_64
[ $(uname -m) = x86_64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
# For ARM64
[ $(uname -m) = aarch64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-arm64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

**macOS:**
```bash
brew install kind
```

## 2. Cluster Setup

Create a cluster with the specific configuration to map ports 80 and 443.

```bash
kind create cluster --config kind-config.yaml --name message-app-cluster
```

**Note:** If you encounter permission errors with Docker, ensure your user is in the `docker` group or use `sudo`.

## 3. Deployment

### Step 1: Install Ingress Controller
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for it to be ready
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=90s
```

### Step 2: Configure Secrets
Edit `k8s/backend-secret.yaml` with your database credentials and keys.

### Step 3: Build and Deploy
Run the automated script to build images, load them into the cluster, and apply manifests.

```bash
chmod +x scripts/build_and_deploy_local.sh
./scripts/build_and_deploy_local.sh
```

## 4. Updating Applications (Zero-Downtime Updates)

To update an application (e.g., the backend) without recreating the entire cluster:

1.  **Rebuild the Image:**
    ```bash
    docker build -t local/server:latest ./server
    ```

2.  **Load Image into Cluster:**
    ```bash
    kind load docker-image local/server:latest --name message-app-cluster
    ```

3.  **Restart the Deployment:**
    This forces Kubernetes to pull the new image (since it's already loaded locally) and restart the pods.
    ```bash
    kubectl rollout restart deployment/backend -n message-app
    ```

**Shortcut:**
We have created a script for this specific workflow:
```bash
./scripts/redeploy_backend.sh
```

### Interactive Update Script
```bash
For a more flexible approach, use the interactive script to choose which component to update:
./scripts/update_app.sh
```
This script will present a menu allowing you to update the Backend, Frontend, Demo, or all components at once.

## 5. Access & Port Forwarding

### Default Access
If port 80 was available on your host during cluster creation, you can access the apps at:
- **Frontend:** http://localhost/
- **Backend:** http://localhost/api/
- **Demo:** http://localhost/demo/

### Custom Port Forwarding
If you want to access the application on a different port (e.g., 8080) or expose it to your local network (e.g., 192.168.1.x), use `kubectl port-forward`.

**Forward to Localhost only (Port 8080):**
```bash
# Forward frontend service to localhost:8080
kubectl port-forward -n message-app svc/frontend 8080:80
```
Access at: http://localhost:8080

**Forward to External IP (Expose to Network):**
To allow other devices on your network to access the service, bind to `0.0.0.0`.

```bash
# Forward frontend service to port 8080 on all interfaces
kubectl port-forward --address 0.0.0.0 -n message-app svc/frontend 8080:80
```
Access at: `http://<YOUR_LAN_IP>:8080` (e.g., `http://192.168.1.100:8080`)

**Forwarding Backend:**
```bash
kubectl port-forward --address 0.0.0.0 -n message-app svc/backend 5000:5000
```

## Troubleshooting

- **ImagePullBackOff:** The cluster cannot find the image. Ensure you ran `kind load docker-image ...`.
- **Permission Denied:** If Docker commands fail, try prepending `sudo`.
- **Ingress not connecting:** Ensure the Ingress Controller pod is running in the `ingress-nginx` namespace.
