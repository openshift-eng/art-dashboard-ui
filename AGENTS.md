# AGENTS.md - AI Agent Guide for ART Build History Dashboard

## Project Overview

**ART Build History** is a Flask-based web application that provides a searchable dashboard for OpenShift ART (Automated Release Team) build records. It queries build data from BigQuery (via the Konflux database) and displays results in an interactive table view with filtering, caching, and drill-down capabilities.

**Primary Purpose**: Allow ART team members and stakeholders to search, filter, and inspect Konflux/Brew build records for OpenShift container images, bundles, and FBC (File-Based Catalog) builds.

---

## Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11, Flask (async-enabled) |
| Frontend | Vanilla JavaScript, HTML5/Jinja2 templates, CSS3 |
| Database | Google BigQuery (via `artcommonlib`) |
| Caching | Redis |
| Deployment | OpenShift (DeploymentConfig), Gunicorn WSGI server |
| Container | UBI8 Python 3.11 base image |

### Application Structure

```
art-dashboard-ui/
├── app.py                    # Main Flask application (single file)
├── requirements.txt          # Python dependencies
├── Dockerfile                # Container build definition
├── templates/                # Jinja2 HTML templates
│   ├── base.html             # Base template with common layout
│   ├── index.html            # Main search/results page
│   ├── build.html            # Individual build details page
│   ├── logs.html             # Build logs viewer page
│   └── packages.html         # Installed packages list page
├── static/
│   ├── css/                  # Page-specific stylesheets
│   │   ├── base.css          # Global styles, dark theme
│   │   ├── index.css         # Search page styles (sidebar, table)
│   │   ├── build.css         # Build details page styles
│   │   ├── logs.css          # Logs page styles
│   │   └── packages.css      # Packages page styles
│   ├── js/                   # Client-side JavaScript
│   │   ├── index.js          # Main search/filter logic, AJAX
│   │   ├── build.js          # Copy-to-clipboard functionality
│   │   └── logs.js           # Log container toggle logic
│   └── images/               # Static assets (icons, loading gif)
└── resources/                # OpenShift deployment manifests
    ├── buildconfig.yaml      # S2I build configuration
    ├── deploymentconfig.yaml # Deployment with GCP secrets
    ├── is.yaml               # ImageStream definition
    ├── service.yaml          # ClusterIP service
    └── route.yaml            # External route with TLS
```

---

## Key Components

### Backend (`app.py`)

The entire backend is a single `KonfluxBuildHistory` class extending Flask:

| Route | Method | Purpose |
|-------|--------|---------|
| `/` | GET | Render main search page |
| `/search` | GET | Query builds from BigQuery, return JSON (AJAX) or rendered page |
| `/get_versions` | GET | Fetch OCP branch names from GitHub for autocomplete |
| `/build` | GET | Show detailed info for a specific build by NVR |
| `/logs` | GET | Display task run container logs for a build |
| `/packages` | GET | List installed RPM packages in a build |

**Key Constants**:
- `DELTA_SEARCH = 180 days` - Default time window for searches
- `CACHE_EXPIRY = 7 days` - Redis cache TTL
- `MAX_BUILDS = 1000` - Maximum results returned per query

**Build Types Supported**:
- `KonfluxBuildRecord` - Standard container image builds
- `KonfluxBundleBuildRecord` - Operator bundle builds
- `KonfluxFbcBuildRecord` - File-Based Catalog builds

### Frontend

**Search Page (`index.html` + `index.js`)**:
- Collapsible sidebar with search filters (name, group, assembly, outcome, engine, NVR, etc.)
- Autocomplete for "Group" field using fetched GitHub branches
- Client-side caching of search results (`cachedResults` array)
- "Search" button queries backend; "Filter" button filters cached results locally
- Results displayed in a sortable table with links to build details, logs, and packages
- Status bar shows cached vs. filtered result counts
- Flatpickr date picker for "completed after" filter

**Build Details (`build.html` + `build.js`)**:
- Key-value table of all build metadata
- Copy-to-clipboard buttons for important fields (NVR, pullspec, record_id)
- Auto-linking of URLs and commit hashes

**Logs Page (`logs.html` + `logs.js`)**:
- Collapsible container log sections
- Fetched from BigQuery task run records

---

## Data Flow

```
1. User submits search form
   ↓
2. Frontend makes AJAX GET to /search with query params
   ↓
3. Backend queries BigQuery via KonfluxDb (3 parallel queries for image/bundle/fbc)
   ↓
4. Results merged, sorted by end_time, limited to 1000
   ↓
5. JSON returned to frontend, cached in browser memory
   ↓
6. User can re-filter cached results client-side without new DB queries
```

**Caching Strategy**:
- Build details and package lists are cached in Redis (7-day TTL)
- Search results are cached client-side in JavaScript memory
- Embargoed builds are filtered out and not displayed

---

## External Dependencies

### Python Libraries (via `artcommonlib`)

The app heavily depends on `rh-art-tools` (installed from GitHub):
- `artcommonlib.redis` - Redis client wrapper
- `artcommonlib.bigquery` - BigQuery client
- `artcommonlib.konflux.konflux_db.KonfluxDb` - Database abstraction for build records
- `artcommonlib.konflux.konflux_build_record.*` - Build record model classes

### External Services

| Service | Purpose | Auth Method |
|---------|---------|-------------|
| Google BigQuery | Build record storage | GCP service account JSON |
| Redis | Result caching | Connection configured in artcommonlib |
| GitHub (ocp-build-data) | Branch list for autocomplete | Public git ls-remote |

---

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Set GCP credentials
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcp-credentials.json

# Run development server
python app.py
# Server starts on http://0.0.0.0:8000
```

For production (as in Dockerfile):
```bash
gunicorn app:app --workers 4 --bind 0.0.0.0:8000
```

---

## Code Conventions

### Python
- Single-file Flask application pattern
- Async routes for database operations (`async def`)
- Logging via `self._logger` (Flask's logger field avoided)
- Static methods for Redis key generation

### JavaScript
- Vanilla JS, no frameworks
- Global state in module-level variables (`cachedResults`, `allBranches`)
- DOM manipulation via `document.getElementById` / `querySelector`
- Event listeners attached in `DOMContentLoaded`

### CSS
- Dark theme (background `#1e1e1e`, text `#f0f0f0`)
- Primary accent color: `#4caf50` (green)
- Page-specific CSS files extending `base.css`
- Mobile-friendly with collapsible sidebar

### Templates
- Jinja2 with `{% extends "base.html" %}`
- Block structure: `title`, `head`, `content`, `scripts`
- Server-side variables passed via `render_template()`

---

## Important Patterns

### Search vs. Filter
- **Search** (`performSearch()`): Makes HTTP request to `/search`, updates `cachedResults`
- **Filter** (`filterResults()`): Filters existing `cachedResults` using regex matching, no HTTP

### Build Type Routing
When navigating to `/build`, the `type` query param determines which BigQuery table to query:
- `image` → `KonfluxBuildRecord`
- `bundle` → `KonfluxBundleBuildRecord`  
- `fbc` → `KonfluxFbcBuildRecord`

### Embargoed Build Handling
Embargoed builds (`embargoed=True`) are:
- Filtered from search results (image builds only)
- Not displayed on the build details page
- Not cached in Redis

### URL Sharing
Search parameters are pushed to browser history, allowing URL sharing:
```javascript
window.history.pushState({}, '', `/?${queryParams.toString()}`);
```

---

## Deployment (OpenShift)

### Prerequisites
1. GCP credentials secret:
   ```bash
   oc create secret generic gcp-credentials \
     --from-file=gcp-credentials.json=/path/to/creds.json
   ```

### Deploy Resources
```bash
oc create -f resources/is.yaml
oc create -f resources/buildconfig.yaml
oc create -f resources/deploymentconfig.yaml
oc create -f resources/service.yaml
oc create -f resources/route.yaml
```

### Key Configuration
- Image built from `openshift-eng/art-dashboard-ui` GitHub repo, `art-build-history` branch
- GCP credentials mounted at `/etc/secrets/gcp/gcp-credentials.json`
- Service exposed on port 8000, TLS terminated at router edge

---

## Common Tasks for AI Agents

### Adding a New Search Filter
1. Add input field to `templates/index.html` inside `#searchForm`
2. Handle the parameter in `app.py` `query()` method, add to `where_clauses` or `extra_patterns`
3. Update `matchesFilters()` in `static/js/index.js` for client-side filtering

### Adding a New Build Detail Field
1. The field must exist in the `KonfluxBuildRecord` model (from artcommonlib)
2. It will automatically appear in the build.html table (iterates `build.items()`)
3. Add special rendering logic in `build.html` Jinja2 if needed (links, copy buttons)

### Modifying Styles
- Global changes: `static/css/base.css`
- Page-specific: Corresponding CSS file (e.g., `index.css` for search page)
- Color scheme uses CSS variables pattern is not implemented; colors are hardcoded

### Adding a New Page
1. Create template in `templates/` extending `base.html`
2. Add route in `app.py` `add_routes()` method
3. Create corresponding CSS in `static/css/`
4. Create corresponding JS in `static/js/` if interactive

---

## Testing Notes

- No automated tests exist in this repository
- Manual testing via browser with real BigQuery data
- For development without GCP access, mock the `KonfluxDb` class

---

## Security Considerations

- GCP credentials stored as Kubernetes secret, never in code
- Embargoed builds explicitly filtered to prevent disclosure
- No authentication on the web interface (relies on network-level access control)
- TLS termination at OpenShift router edge

