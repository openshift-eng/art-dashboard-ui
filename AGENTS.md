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
| Caching | Redis (with dev mode fallback) |
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
│   └── logs.html             # Build logs viewer page
├── static/
│   ├── css/                  # Page-specific stylesheets
│   │   ├── base.css          # Global styles, dark theme
│   │   ├── index.css         # Search page styles (sidebar, table)
│   │   ├── build.css         # Build details page styles
│   │   └── logs.css          # Logs page styles
│   ├── js/                   # Client-side JavaScript
│   │   ├── index.js          # Main search/filter logic, AJAX
│   │   ├── build.js          # Copy-to-clipboard, package filtering
│   │   └── logs.js           # Log container toggle logic
│   └── images/               # Static assets (favicon, loading gif)
│       └── palette.svg       # Art palette favicon
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
| `/get_groups` | GET | Fetch distinct group names from BigQuery for autocomplete |
| `/get_source_repos` | GET | Fetch distinct source repositories from BigQuery |
| `/build` | GET | Show detailed info for a specific build by NVR and record_id |
| `/logs` | GET | Display task run container logs for a build |

**Key Constants**:
- `DELTA_SEARCH = 180 days` - Maximum time window for searches
- `CACHE_EXPIRY = 7 days` - Redis cache TTL
- `MAX_BUILDS = 1000` - Maximum results returned per query

**Build Types Supported**:
- `KonfluxBuildRecord` - Standard container image builds
- `KonfluxBundleBuildRecord` - Operator bundle builds
- `KonfluxFbcBuildRecord` - File-Based Catalog builds

**Dev Mode**:
- Set `ART_DASH_DEV=1` environment variable to enable
- Gracefully bypasses Redis if unavailable
- Uses in-memory cache fallback for groups and source repos

### Frontend

**Search Page (`index.html` + `index.js`)**:
- Collapsible sidebar with search filters:
  - Name, Group, Assembly, Outcome (multi-select), Engine
  - Date range picker ("Completed between" in UTC)
  - NVR, Image sha256/tag, Source repository, Source commit
  - ART job URL, Record ID
- Autocomplete for "Group" and "Source repository" fields (fetched from BigQuery)
- Static autocomplete for "Assembly" field (stream, test, *)
- Client-side caching of search results (`cachedResults` array)
- "Search" button queries backend; "Filter Results" button filters cached results locally
- Filter button appears only when search parameters have changed
- Results displayed in table with links to build details and logs
- Status bar shows: "Results: X (Y filtered)" with truncation warning at 1000 results
- Source column shows abbreviated commit hash linking to GitHub

**Build Details (`build.html` + `build.js`)**:
- Organized sections: Build Identity, Build Status, Image Information, Source Code, Build Links
- Copy-to-clipboard buttons for important fields (NVR, pullspec, commits)
- Installed Packages and Installed RPMs sections with real-time filter inputs
- Download JSON button for full build data
- Parent image search links
- Collapsible sections for packages, RPMs, and additional information

**Logs Page (`logs.html` + `logs.js`)**:
- Build Identity section with NVR and metadata
- Collapsible container log sections (auto-expanded if log output exists)
- Red highlighting for non-zero exit codes
- Download JSON button for log data
- Shows container run info for all builds (not just failures)

---

## Data Flow

```
1. User submits search form
   ↓
2. Frontend makes AJAX GET to /search with query params
   ↓
3. Backend queries BigQuery via KonfluxDb (3 parallel queries for image/bundle/fbc)
   ↓
4. Results merged, sorted by end_time, filtered by date range, limited to 1000
   ↓
5. JSON returned to frontend, cached in browser memory
   ↓
6. User can re-filter cached results client-side without new DB queries
```

**Caching Strategy**:
- Build details are cached in Redis (7-day TTL)
- Search results are cached client-side in JavaScript memory
- Group names and source repos cached in Redis (1 hour / 1 week respectively)
- Dev mode uses in-memory fallback when Redis unavailable

**Query Optimization**:
- `group` parameter passed to all detail pages for BigQuery clustering efficiency
- Large columns (`installed_packages`, `installed_rpms`) excluded from search queries
- Only fetched when viewing specific build details

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

---

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Set GCP credentials
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcp-credentials.json

# Enable dev mode (optional - bypasses Redis if unavailable)
export ART_DASH_DEV=1

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
- All datetimes use UTC timezone (`timezone.utc`)

### JavaScript
- Vanilla JS, no frameworks
- Global state in module-level variables (`cachedResults`, `allGroups`, `allSourceRepos`)
- DOM manipulation via `document.getElementById` / `querySelector`
- Event listeners attached in `DOMContentLoaded`
- Real-time filtering for package/RPM lists

### CSS
- Dark theme (background `#1e1e1e`, text `#f0f0f0`)
- Primary accent color: `#4caf50` (green)
- Page-specific CSS files extending `base.css`
- Mobile-friendly with collapsible sidebar (max-width: 280px)

### Templates
- Jinja2 with `{% extends "base.html" %}`
- Block structure: `title`, `head`, `content`, `scripts`
- Server-side variables passed via `render_template()`

---

## Important Patterns

### Search vs. Filter
- **Search** (`performSearch()`): Makes HTTP request to `/search`, updates `cachedResults`
- **Filter Results** (`filterResults()`): Filters existing `cachedResults` using pattern matching, no HTTP
- Filter button appears when form parameters differ from last search

### Build Type Routing
When navigating to `/build`, the `type` query param determines which BigQuery table to query:
- `image` → `KonfluxBuildRecord`
- `bundle` → `KonfluxBundleBuildRecord`  
- `fbc` → `KonfluxFbcBuildRecord`
- If not specified, searches all three tables

### Group Parameter
All detail pages (`/build`, `/logs`) accept a `group` parameter to optimize BigQuery queries via clustering.

### Embargoed Build Handling
Embargoed builds (`embargoed=True`) are:
- Filtered from search results (image builds only)
- Not displayed on the build details page
- **Exception**: Builds with "golang" in the group name are shown even if marked embargoed

### URL Sharing
Search parameters are pushed to browser history, allowing URL sharing:
```javascript
window.history.pushState({}, '', `/?${queryParams.toString()}`);
```

### NVR Timestamp Extraction
NVRs contain embedded timestamps (format: `YYYYMMDDHHMM`) used for:
- Determining time window for taskrun log queries
- Reducing query scope to ±2 days around build time

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
4. Update form reset logic in `index.js`

### Adding a New Build Detail Field
1. The field must exist in the `KonfluxBuildRecord` model (from artcommonlib)
2. Add to appropriate section in `build.html` (Build Identity, Build Status, etc.)
3. Add special rendering logic if needed (links, copy buttons)
4. Add to `displayed_keys` list to exclude from "Additional Information"

### Modifying Styles
- Global changes: `static/css/base.css`
- Page-specific: Corresponding CSS file (e.g., `index.css` for search page)
- Color scheme uses CSS variables pattern is not implemented; colors are hardcoded

### Adding a New Page
1. Create template in `templates/` extending `base.html`
2. Add route in `app.py` `add_routes()` method
3. Create corresponding CSS in `static/css/`
4. Create corresponding JS in `static/js/` if interactive
5. Include `group` parameter in links for query optimization

---

## Testing Notes

- No automated tests exist in this repository
- Manual testing via browser with real BigQuery data
- For development without GCP access, mock the `KonfluxDb` class
- Use `ART_DASH_DEV=1` to run without Redis

---

## Security Considerations

- GCP credentials stored as Kubernetes secret, never in code
- Embargoed builds explicitly filtered to prevent disclosure (except golang builds)
- No authentication on the web interface (relies on network-level access control)
- TLS termination at OpenShift router edge
