# ART Build History

Search for build records in BigQuery, and display the results in a table view.

## Features

- Set search filters as needed
- Click "Search" to look up build records in BigQuery; results are cached client-side
- Tune the filters to limit the displayed results; click "Filter" to affect the rendered HTML; cached results are not cleared
- Share a search by copying the full URL containing the query string

## Deployment

For complete deployment instructions, including two-stage Docker builds, secrets management, and troubleshooting, see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

Quick start:

```bash
# Create or select namespace
oc new-project my-namespace  # or: oc project existing-namespace

# Set environment variables (REQUIRED)
export OPENSHIFT_NAMESPACE=$(oc project -q)
export REDIS_PASSWORD="your-redis-password"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/gcp-credentials.json"

# Deploy everything (secrets, builds, deployment)
ansible-playbook ansible/deploy.yaml
```

## Local Development

```bash
# Setup virtual environment
make venv

# Run linter
make lint

# Auto-fix code issues
make fix

# Build Docker images
make docker-base    # Build base image with dependencies (slow)
make docker-build   # Build app image (fast)

# Run locally
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/gcp-credentials.json"
make docker-run
```

Access the app at http://localhost:8000

## Project Structure

- `app.py` - Main Flask application
- `static/` - Static assets (CSS, JS)
- `templates/` - HTML templates
- `docker/` - Dockerfiles for local development and OpenShift builds
  - `Dockerfile` - App image (uses base image)
  - `Dockerfile.base` - Base image with dependencies
- `ansible/` - Ansible playbooks for deployment automation
  - `deploy.yaml` - Full deployment (setup + build all)
  - `setup.yaml` - Create all resources (run once)
  - `build-base.yaml` - Build base image with dependencies
  - `update.yaml` - Fast app rebuild
  - `build-all.yaml` - Build base + app images
- `openshift/` - OpenShift manifests
  - BuildConfigs, DeploymentConfig, Service, Route, ImageStream
- `pyproject.toml` - Python dependencies and project metadata
- `uv.lock` - Locked dependency versions
- `Makefile` - Development commands
- `DEPLOYMENT.md` - Complete deployment guide
