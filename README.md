# ART Build Failures Dashboard

A web dashboard for visualizing and tracking OpenShift build failures from Redis, with integrated Jira ticket linking.

## Features

- **Real-time Build Failure Tracking** - Displays failures from Redis across all OCP versions
- **Multiple Failure Types** - Supports build, EC, release, and rebase failures
- **Jira Integration** - Direct links to Jira tickets for each failure
- **Pipeline Links** - Quick access to Jenkins and Konflux pipeline runs
- **Dual Visualization** - Toggle between table and bubble chart views
- **Advanced Filtering** - Filter by group, failure type, and component name
- **Sortable Columns** - Click headers to sort by any column

## Quick Start

### Local Development (Mock Data)

```bash
# Create virtual environment
make venv

# Run with mock data (no credentials needed)
make run
```

Open http://localhost:8080

### Production Deployment

**Prerequisites:**
- OpenShift CLI (`oc`) logged in
- Ansible with `kubernetes.core` collection

```bash
# Minimum required: namespace
export OPENSHIFT_NAMESPACE="art-build-failures"

# Optional: set these to update secrets (otherwise uses existing secrets)
export REDIS_PASSWORD="your-redis-password"
# Jira credentials loaded from /tmp/JIRA_EMAIL and /tmp/JIRA_TOKEN if present

# Deploy to OpenShift
make deploy-setup  # Initial setup (creates/updates secrets)
make deploy-base   # Build base image (first time only)
make deploy        # Build and deploy app
```

**Smart Deployment:**
- **OPENSHIFT_NAMESPACE** is the only mandatory variable
- **REDIS_PASSWORD** and Jira credentials are optional
- If credentials are provided, secrets are updated
- If not provided, existing secrets are used (if available)
- Deployment warns if secrets are missing but doesn't fail

## Architecture

### Backend (Python/Flask)
- **app.py** - Main Flask application
- **Redis integration** - Fetches failure data from artcommonlib.redis
- **Jira integration** - Queries Jira for open tickets using pyartcd.jira_client
- **Parallel data fetching** - Redis and Jira data loaded concurrently

### Frontend (HTML/CSS/JavaScript)
- **Table view** - Sortable table with color-coded failure counts
- **Bubble chart** - D3.js visualization showing relative failure sizes
- **Responsive design** - Works on desktop and mobile
- **Real-time filtering** - Client-side filtering without page reloads

### Deployment (OpenShift/Ansible)
- **BuildConfigs** - Multi-stage builds (base Python image + app)
- **DeploymentConfig** - Single replica with automatic rollout
- **Secrets** - Redis password and Jira credentials stored securely
- **Route** - TLS-enabled external access

## Environment Variables

### Development

- `ART_DASH_DEV=1` - Enable dev mode (uses mock data, no Redis/Jira required)

### Production Deployment

**Required:**
- `OPENSHIFT_NAMESPACE` - Target OpenShift namespace (always required)

**Optional (updates secrets if provided):**
- `REDIS_PASSWORD` - Redis server password
- `/tmp/JIRA_EMAIL` - Jira account email (file)
- `/tmp/JIRA_TOKEN` - Jira API token (file)

**Runtime (in deployed pods):**
- `REDIS_SERVER_PASSWORD` - From `redis-server-password` secret
- `JIRA_EMAIL` - From `jira-credentials` secret
- `JIRA_TOKEN` - From `jira-credentials` secret
- `JIRA_URL` - Jira server URL (defaults to `https://redhat.atlassian.net`)

## Deployment Workflow

### Initial Setup

```bash
# 1. Validate credentials
export OPENSHIFT_NAMESPACE="art-build-failures"
export REDIS_PASSWORD="your-redis-password"
make deploy-setup

# 2. Build base image (includes Python and dependencies)
make deploy-base

# 3. Build and deploy application
make deploy
```

### Code Updates

```bash
# Just rebuild and deploy the app (skips base image)
make deploy
```

### Dependency Updates

```bash
# Rebuild both base and app images
make deploy-base
make deploy
```

## Credential Management

The deployment process uses `scripts/check-credentials.sh` to intelligently manage secrets:

### Required
✅ **OPENSHIFT_NAMESPACE** - Always required (deployment fails without it)

### Optional (Smart Updates)
- **REDIS_PASSWORD** - If set, updates the secret; otherwise uses existing secret
- **Jira credentials** - If both `/tmp/JIRA_EMAIL` and `/tmp/JIRA_TOKEN` exist, updates the secret; otherwise uses existing secret

### Example Outputs

**With all credentials:**
```
✓ OPENSHIFT_NAMESPACE: art-build-failures
✓ REDIS_PASSWORD: your-passw... (will update secret)
✓ JIRA_EMAIL: aos-team@redhat.com (will update secret)
✓ JIRA_TOKEN: ATATT3xFfG... (will update secret)

Deployment plan:
  Update Redis secret: true
  Update Jira secret: true
```

**With only namespace (uses existing secrets):**
```
✓ OPENSHIFT_NAMESPACE: art-build-failures
⚠ REDIS_PASSWORD not set (will use existing secret if available)
⚠ Jira credentials not provided (will use existing secret if available)

Deployment plan:
  Update Redis secret: false
  Update Jira secret: false
```

**Benefits:**
- Update only the secrets you want to change
- Re-deploy without re-entering all credentials
- Secrets persist across deployments unless explicitly updated

## Testing

### Unit Tests

```bash
# Test mock data includes Jira tickets
python test_jira_integration.py
```

### Integration Tests

```bash
# Test real Jira connection (requires JIRA_TOKEN)
export JIRA_TOKEN="your-token"
python test_jira_real.py
```

### Linting

```bash
make lint  # Check code style
make fix   # Auto-fix issues
```

## API Endpoints

### GET /api/failures

Returns all failure records with Jira ticket links.

**Response:**
```json
[
  {
    "name": "ironic",
    "group": "openshift-4.19",
    "failure_type": "build-failure",
    "failure_count": 26,
    "jenkins_url": "https://...",
    "pipeline_url": "https://...",
    "jira_ticket": "ART-1234"
  }
]
```

### GET /api/groups

Returns list of OCP version groups.

### GET /api/failure-types

Returns list of failure type identifiers.

## Jira Integration

### How It Works

1. Dashboard queries Jira on every page load
2. Searches for open tickets with labels:
   - `art:image-build-failure`
   - `art:image-ec-failure`
   - `art:image-release-failure`
   - `art:image-rebase-failure`
3. Matches tickets to failures using labels:
   - `art:package:<image_name>`
   - `art:group:<group_name>`
4. Displays ticket key as clickable link

### Ticket Creation

Jira tickets are automatically created by the `images-health` pipeline:
- Runs daily
- Creates tickets for new failures
- Updates existing tickets with fail counts
- Closes tickets when failures are resolved

See [JIRA_INTEGRATION.md](JIRA_INTEGRATION.md) for details.

## Project Structure

```
art-dashboard-ui/
├── app.py                      # Flask application
├── mock_data.py                # Mock data generator
├── pyproject.toml              # Python dependencies
├── Makefile                    # Development and deployment commands
├── templates/
│   ├── base.html               # Base template
│   └── failures.html           # Main dashboard page
├── static/
│   ├── css/
│   │   ├── base.css            # Global styles
│   │   └── failures.css        # Dashboard styles
│   ├── js/
│   │   └── failures.js         # Dashboard logic
│   └── images/
│       ├── jenkins-icon.png    # Pipeline icons
│       └── konflux-icon.png
├── ansible/
│   ├── setup.yaml              # Initial deployment setup
│   ├── build-base.yaml         # Base image build
│   ├── update.yaml             # App build and deploy
│   └── deploy.yaml             # Full deployment
├── openshift/
│   ├── buildconfig-base.yaml   # Base image build config
│   ├── buildconfig-app.yaml    # App image build config
│   ├── deploymentconfig.yaml   # Deployment config
│   ├── service.yaml            # Service config
│   ├── route.yaml              # Route config
│   └── is.yaml                 # ImageStream config
├── docker/
│   ├── Dockerfile.base         # Base image Dockerfile
│   └── Dockerfile              # App image Dockerfile
├── scripts/
│   ├── load-credentials.sh     # Credential validation
│   └── deploy-with-jira.sh     # Deployment helper
├── tests/
│   ├── test_jira_integration.py  # Mock data tests
│   └── test_jira_real.py         # Real Jira tests
└── docs/
    ├── JIRA_INTEGRATION.md     # Jira integration details
    ├── DEPLOYMENT.md           # Deployment guide
    └── CHANGES.md              # Change summary
```

## Troubleshooting

### Dashboard shows no data

- **Check VPN connection** (Redis is on internal network)
- **Verify REDIS_SERVER_PASSWORD** is correct
- **Check logs:** `oc logs -f dc/art-build-failures`

### Jira links not appearing

- **Verify JIRA_TOKEN is set** in deployment
- **Check logs for Jira errors:** `oc logs -f dc/art-build-failures | grep -i jira`
- **Test Jira connection:** Run `python test_jira_real.py` in pod

### Deployment fails with credential error

- **Ensure ALL credentials are set** before running `make deploy-setup`
- **Check `/tmp/JIRA_EMAIL` and `/tmp/JIRA_TOKEN` files exist**
- **Run:** `bash scripts/load-credentials.sh` to validate

### Page loads slowly

- **Check Redis connection latency** (VPN issues?)
- **Check Jira query time** (watch logs for "Querying Jira" timing)
- **Consider adding Redis cache** for Jira ticket data

## Contributing

1. Make changes in a feature branch
2. Run `make lint` to check code style
3. Test locally with `make run`
4. Update documentation if needed
5. Create pull request

## Related Documentation

- [JIRA_INTEGRATION.md](JIRA_INTEGRATION.md) - Jira integration architecture and configuration
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment instructions
- [CHANGES.md](CHANGES.md) - Summary of recent changes
- [PIPELINE_URL_ICONS.md](PIPELINE_URL_ICONS.md) - Pipeline icon implementation

## License

Internal Red Hat tooling - not for external distribution.

## Support

- **Slack:** #forum-ocp-art
- **Jira:** ART project
- **Source:** https://github.com/openshift/art-dashboard-ui
