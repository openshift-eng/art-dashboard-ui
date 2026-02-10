# Deployment Guide

This document describes the deployment strategy for the ART Build History dashboard on OpenShift.

## Overview

The deployment uses a **two-stage Docker build** strategy to optimize build times:

1. **Base Image** (`art-build-history:base`) - Contains all Python dependencies
2. **App Image** (`art-build-history:latest`) - Contains application code only

This approach ensures that dependency builds (slow, ~2-3 minutes) only happen when `pyproject.toml` or `uv.lock` changes, while code changes rebuild quickly (~10-20 seconds).

## Architecture

```
┌─────────────────────────────────────────┐
│  BuildConfig: art-build-history-base    │
│  - Uses: Dockerfile.base                │
│  - Builds: Dependencies layer           │
│  - Output: art-build-history:base       │
│  - Triggers: ConfigChange, ImageChange  │
└──────────────┬──────────────────────────┘
               │
               │ Triggers rebuild
               ▼
┌─────────────────────────────────────────┐
│  BuildConfig: art-build-history         │
│  - Uses: Dockerfile                     │
│  - FROM: art-build-history:base         │
│  - Builds: Application code             │
│  - Output: art-build-history:latest     │
│  - Triggers: ConfigChange, ImageChange  │
└──────────────┬──────────────────────────┘
               │
               │ Triggers deployment
               ▼
┌─────────────────────────────────────────┐
│  DeploymentConfig: art-build-history    │
│  - Image: art-build-history:latest      │
│  - Secrets: redis, gcp-credentials      │
│  - Triggers: ConfigChange, ImageChange  │
└─────────────────────────────────────────┘
```

## Prerequisites

1. **OpenShift CLI** (`oc`) installed and configured
2. **Ansible** with `kubernetes.core` collection:
   ```bash
   ansible-galaxy collection install kubernetes.core
   ```

## Initial Deployment

### 1. Create/Select Namespace

First, create a new namespace or select an existing one:

```bash
# Create new namespace
oc new-project my-namespace

# Or switch to existing namespace
oc project my-namespace
```

### 2. Set Environment Variables

**Important:** You must explicitly set the target namespace to avoid accidental deployments.

```bash
# Set the target namespace (REQUIRED)
export OPENSHIFT_NAMESPACE=$(oc project -q)

# Set secrets (REQUIRED)
export REDIS_PASSWORD="your-redis-password-here"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/gcp-credentials.json"
```

### 3. Deploy Everything

Run the Ansible playbook to setup resources and trigger builds:

```bash
ansible-playbook ansible/deploy.yaml
```

This runs:
1. **Setup** - Creates all resources (secrets, imagestream, buildconfigs, service, route, deploymentconfig)
2. **Build-all** - Builds base image (~2-3 min) then app image (~10-20 sec)

Monitor the deployment:

```bash
# Check pods
oc get pods

# Get route URL
oc get route art-build-history
```

## Ansible Playbooks

The deployment is split into separate playbooks for different workflows:

### Initial Setup (Run Once)

```bash
ansible-playbook ansible/setup.yaml
```

Creates all OpenShift resources without building images. Run this once when deploying to a new namespace.

### Build Base Image (When Dependencies Change)

```bash
ansible-playbook ansible/build-base.yaml
```

Builds the base image with Python dependencies (~2-3 minutes). Run this when you update `pyproject.toml` or `uv.lock`.

### Update App Image (Fast - When Code Changes)

```bash
ansible-playbook ansible/update.yaml
```

Builds only the app image with your code (~10-20 seconds). Run this frequently during development when you update `app.py`, templates, or static files.

### Build All Images

```bash
ansible-playbook ansible/build-all.yaml
```

Builds base image then app image in sequence. Use for initial deployment or after dependency changes.

### Full Deployment (Setup + Build All)

```bash
ansible-playbook ansible/deploy.yaml
```

Runs setup + build-all. Use this for deploying to a brand new namespace.

## Updating the Application

### Code Changes Only

When you only modify Python code (`app.py`, templates, static files):

```bash
# Push changes to git
git push origin art-build-history

# Trigger app rebuild (fast ~10-20 seconds)
oc start-build art-build-history
```

The base image is NOT rebuilt, saving significant time.

### Dependency Changes

When you modify `pyproject.toml` or `uv.lock`:

```bash
# Update dependencies locally
uv sync

# Commit and push
git add pyproject.toml uv.lock
git commit -m "Update dependencies"
git push origin art-build-history

# Trigger base rebuild (slow ~2-3 minutes)
oc start-build art-build-history-base
```

The base build will automatically trigger the app build via ImageChange trigger.

## Local Development with Docker

### Build Images Locally

```bash
# Build base image (dependencies)
make docker-base

# Build app image (code)
make docker-build
```

### Run Locally

```bash
# Set required environment variables
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/gcp-credentials.json"

# Run container
make docker-run
```

Access the app at http://localhost:8000

## Troubleshooting

### Check Build Status

```bash
oc get builds
oc logs -f bc/art-build-history-base
oc logs -f bc/art-build-history
```

### Check Deployment Status

```bash
oc get pods
oc logs -f dc/art-build-history
oc describe dc/art-build-history
```

### Verify Secrets

```bash
oc get secrets
oc describe secret redis-server-password
oc describe secret gcp-credentials
```

### Force Rebuild

```bash
# Rebuild base image
oc start-build art-build-history-base

# Rebuild app image
oc start-build art-build-history
```

### Redeploy Application

```bash
oc rollout latest dc/art-build-history
```

## Resource Files

All OpenShift resources are in the `ansible/` directory:

- `deploy.yaml` - Ansible playbook for complete deployment
- `buildconfig-base.yaml` - Base image build config
- `buildconfig-app.yaml` - App image build config
- `deploymentconfig.yaml` - Application deployment
- `is.yaml` - ImageStream with `base` and `latest` tags
- `service.yaml` - Kubernetes service
- `route.yaml` - OpenShift route

## Security Notes

- **Never commit secrets to git** - All secrets come from environment variables
- Secrets are deployed via Ansible playbook from your local environment
- GCP credentials file is base64 encoded automatically by Ansible
- Redis password is stored as stringData (auto-encoded by Kubernetes)
