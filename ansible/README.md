# Deployment Guide

Deploy the ART Build Failures dashboard to OpenShift.

## Prerequisites

1. **OpenShift CLI** (`oc`) installed and logged in
2. **Ansible** with `kubernetes.core` collection:
   ```bash
   ansible-galaxy collection install kubernetes.core
   ```
3. **Redis password** for the ART Redis instance

## Deploy from scratch

### 1. Create the project

```bash
oc new-project art-build-failures
```

Or use an existing namespace:

```bash
oc project art-build-failures
```

### 2. Set environment variables

```bash
export OPENSHIFT_NAMESPACE=$(oc project -q)
export REDIS_PASSWORD="your-redis-password-here"
```

### 3. Deploy everything

From the repo root:

```bash
make deploy-all
```

This runs the full pipeline:
1. **Setup** — creates secret, imagestream, buildconfigs, service, route, deploymentconfig
2. **Build base** — installs Python dependencies (~2-3 minutes)
3. **Build app** — copies application code (~10-20 seconds)
4. **Auto-deploy** — the DeploymentConfig picks up the new image automatically

### 4. Get the route URL

```bash
oc get route art-build-failures -o jsonpath='{.spec.host}'
```

## Day-to-day operations

### Code changes only (fast)

After pushing code changes to the `art-build-failures` branch:

```bash
make deploy
```

This rebuilds only the app image (~10-20 seconds). Dependencies are not rebuilt.

### Dependency changes (slow)

After updating `pyproject.toml` or `uv.lock`:

```bash
make deploy-base
```

This rebuilds the base image (~2-3 minutes). The app image rebuilds automatically via ImageChange trigger.

### Full redeploy

```bash
make deploy-all
```

## Troubleshooting

```bash
# Check build status
oc get builds
oc logs -f bc/art-build-failures-base
oc logs -f bc/art-build-failures

# Check pod status
oc get pods
oc logs -f dc/art-build-failures

# Verify secret exists
oc get secret redis-server-password

# Force redeploy
oc rollout latest dc/art-build-failures
```

## What gets created

| Resource | Name |
|----------|------|
| Secret | `redis-server-password` |
| ImageStream | `art-build-failures` (tags: `base`, `latest`) |
| BuildConfig | `art-build-failures-base` (dependencies) |
| BuildConfig | `art-build-failures` (application code) |
| Service | `art-build-failures` (port 8080) |
| Route | `art-build-failures` (TLS edge) |
| DeploymentConfig | `art-build-failures` (1 replica) |

## Notes

- The `redis-server-password` secret is shared with art-build-history if deployed in the same namespace. The setup playbook will update it either way.
- No GCP credentials are needed — this app only reads from Redis, not BigQuery.
- The app uses the same Redis instance as all other ART tools (`master.redis.gwprhd.use1.cache.amazonaws.com`).
