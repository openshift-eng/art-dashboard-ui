# Deployment Guide

This guide explains how to deploy the Build Failures Dashboard to OpenShift.

**NEW:** Smart credential management - only update the secrets you want to change. Existing secrets are preserved unless credentials are explicitly provided.

## Prerequisites

1. **OpenShift CLI (`oc`)** installed and logged in
2. **Ansible** with `kubernetes.core` collection installed
3. **OpenShift namespace** (required)
4. **Credentials** (optional - used to update secrets):
   - Redis password
   - Jira email and token (in `/tmp` files)

## Environment Setup

### Required

The **only mandatory** environment variable is:

```bash
export OPENSHIFT_NAMESPACE="your-namespace"
```

### Optional - Secret Updates

Provide these credentials only when you want to **update** the corresponding secrets:

```bash
# Update Redis secret
export REDIS_PASSWORD="new-redis-password"

# Update Jira secret (both files must exist)
# These should already exist at:
ls -la /tmp/JIRA_EMAIL /tmp/JIRA_TOKEN
```

### Smart Credential Behavior

- **If credentials are provided**: Secrets are created/updated
- **If credentials are NOT provided**: Existing secrets are used (if they exist)
- **If secrets don't exist and credentials not provided**: Deployment warns but continues

This allows you to:
1. Deploy without re-entering all credentials every time
2. Update specific secrets without affecting others
3. Initial setup provides all credentials, future deploys can skip them

## Quick Start

### Recommended: Using Make

```bash
# Set required environment variables
export OPENSHIFT_NAMESPACE="art-build-failures"
export REDIS_PASSWORD="your-redis-password"

# Initial setup (validates credentials and creates all resources)
make deploy-setup

# Build base image (first time only)
make deploy-base

# Build and deploy application
make deploy
```

The `make deploy-setup` command will:
1. Validate all required credentials (fails if any are missing)
2. Load Jira credentials from `/tmp/JIRA_EMAIL` and `/tmp/JIRA_TOKEN`
3. Create all OpenShift resources including secrets

### Alternative: Using the Helper Script

```bash
# Set required variables
export OPENSHIFT_NAMESPACE="art-build-failures"
export REDIS_PASSWORD="your-redis-password"

# Run the deployment script (validates and loads credentials)
./scripts/deploy-with-jira.sh
```

### Manual Deployment (Not Recommended)

If you need to run ansible directly:

```bash
# Validate and load credentials first
source scripts/load-credentials.sh

# Then run ansible
ansible-playbook ansible/setup.yaml
ansible-playbook ansible/build-base.yaml
ansible-playbook ansible/update.yaml
```

## Deployment Steps Explained

### 1. Setup (ansible/setup.yaml)

Creates the following resources in OpenShift:

**Secrets:**
- `redis-server-password` - Contains Redis password
- `jira-credentials` - Contains Jira email and token

**Build Resources:**
- `ImageStream: art-build-failures` (tags: base, latest)
- `BuildConfig: art-build-failures-base` (Python base image)
- `BuildConfig: art-build-failures` (Application image)

**Runtime Resources:**
- `Service: art-build-failures` (port 8080)
- `Route: art-build-failures` (external access)
- `DeploymentConfig: art-build-failures` (1 replica)

### 2. Build Base Image (ansible/build-base.yaml)

Builds the base Python image with all dependencies. This only needs to be run:
- On first deployment
- When dependencies change in `pyproject.toml`
- When updating Python version

### 3. Build/Update App (ansible/update.yaml)

Builds the application image and triggers a new deployment. Run this:
- After code changes
- To deploy updates
- After modifying templates or static files

## Updating the Deployment

### Code Changes Only

```bash
ansible-playbook ansible/update.yaml
```

### Dependency Changes

```bash
ansible-playbook ansible/build-all.yaml
```

This rebuilds both base and app images.

### Secret Updates

If you need to update Jira or Redis credentials:

```bash
# Update environment variables
export JIRA_EMAIL="new-email@redhat.com"
export JIRA_TOKEN="new-token"
export REDIS_PASSWORD="new-password"

# Re-run setup to update secrets
ansible-playbook ansible/setup.yaml
```

The deployment will automatically pick up the new secrets on next rollout.

## Verification

### Check Deployment Status

```bash
# Check if pods are running
oc get pods -n $OPENSHIFT_NAMESPACE

# Check deployment status
oc get dc art-build-failures -n $OPENSHIFT_NAMESPACE

# View logs
oc logs -f dc/art-build-failures -n $OPENSHIFT_NAMESPACE
```

### Test the Application

```bash
# Get the route URL
ROUTE_URL=$(oc get route art-build-failures -n $OPENSHIFT_NAMESPACE -o jsonpath='{.spec.host}')
echo "Dashboard URL: https://$ROUTE_URL"

# Test API endpoint
curl -s "https://$ROUTE_URL/api/failures" | jq '.[0]'
```

You should see failure records with `jira_ticket` fields.

### Verify Jira Integration

Check the logs for Jira connection messages:

```bash
oc logs -f dc/art-build-failures -n $OPENSHIFT_NAMESPACE | grep -i jira
```

Expected log lines:
```
INFO Jira client initialized successfully
INFO Querying Jira with JQL: project = ART AND ...
INFO Found XX open Jira tickets
INFO Indexed XX Jira tickets by (image_name, group)
```

If you see warnings instead:
```
WARNING JIRA_TOKEN not set — Jira links will not be available
WARNING Failed to initialize Jira client: ...
WARNING Failed to fetch Jira tickets: ...
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod events
oc describe pod -l app=art-build-failures -n $OPENSHIFT_NAMESPACE

# Check deployment config
oc describe dc art-build-failures -n $OPENSHIFT_NAMESPACE
```

Common issues:
- Image pull failures → Check BuildConfigs
- CrashLoopBackOff → Check logs for Python errors
- Secret mount errors → Verify secrets exist

### Jira Integration Not Working

1. **Verify secrets are set:**
   ```bash
   oc get secret jira-credentials -n $OPENSHIFT_NAMESPACE -o yaml
   ```

2. **Check environment variables in pod:**
   ```bash
   oc rsh dc/art-build-failures -n $OPENSHIFT_NAMESPACE
   echo $JIRA_EMAIL
   echo ${JIRA_TOKEN:0:10}  # Show first 10 chars
   exit
   ```

3. **Test Jira connection from pod:**
   ```bash
   oc rsh dc/art-build-failures -n $OPENSHIFT_NAMESPACE
   python test_jira_real.py
   exit
   ```

### Redis Connection Issues

1. **Verify VPN is active** (Redis is on internal network)

2. **Check Redis password secret:**
   ```bash
   oc get secret redis-server-password -n $OPENSHIFT_NAMESPACE -o yaml
   ```

3. **Test Redis connection from pod:**
   ```bash
   oc rsh dc/art-build-failures -n $OPENSHIFT_NAMESPACE
   python -c "from artcommonlib import redis; import asyncio; asyncio.run(redis.get_keys('count:*'))"
   exit
   ```

## Rollback

If a deployment goes wrong:

```bash
# Rollback to previous version
oc rollback dc/art-build-failures -n $OPENSHIFT_NAMESPACE

# Or rollback to specific revision
oc rollback dc/art-build-failures --to-version=2 -n $OPENSHIFT_NAMESPACE
```

## Cleanup

To remove all resources:

```bash
# Delete deployment
oc delete dc art-build-failures -n $OPENSHIFT_NAMESPACE

# Delete service and route
oc delete svc art-build-failures -n $OPENSHIFT_NAMESPACE
oc delete route art-build-failures -n $OPENSHIFT_NAMESPACE

# Delete build configs and image stream
oc delete bc art-build-failures -n $OPENSHIFT_NAMESPACE
oc delete bc art-build-failures-base -n $OPENSHIFT_NAMESPACE
oc delete is art-build-failures -n $OPENSHIFT_NAMESPACE

# Delete secrets
oc delete secret redis-server-password -n $OPENSHIFT_NAMESPACE
oc delete secret jira-credentials -n $OPENSHIFT_NAMESPACE
```

## Production Checklist

Before deploying to production:

- [ ] VPN access is active
- [ ] Redis password is correct
- [ ] Jira credentials are valid (test with `test_jira_real.py`)
- [ ] OpenShift namespace has necessary permissions
- [ ] Resource limits are appropriate for expected load
- [ ] Route TLS is configured
- [ ] Monitoring/alerting is set up
- [ ] Backup/disaster recovery plan is in place

## Security Notes

- **Secrets are stored in OpenShift secrets**, not in config files
- **Never commit credentials** to git
- **Jira token has limited scope** to ART project only
- **Redis password** should be rotated periodically
- **Route should use TLS** in production (configured by default)

## Related Documentation

- [JIRA_INTEGRATION.md](JIRA_INTEGRATION.md) - Jira integration details
- [README.md](README.md) - Application overview
- [ansible/setup.yaml](ansible/setup.yaml) - Deployment playbook source
