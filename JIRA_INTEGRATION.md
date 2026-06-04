# Jira Integration for Build Failures Dashboard

This document describes the Jira integration added to the Build Failures Dashboard, which allows users to see and access Jira tickets associated with build failures directly from the dashboard.

## Overview

The dashboard now fetches and displays Jira tickets that are automatically created by the `images-health` pipeline for build failures. This provides a seamless link between the dashboard view of failures and the corresponding Jira tickets for tracking and resolution.

## Features

- **Automatic Jira Ticket Linking**: Fetches open Jira tickets for all failure types (build, EC, release, rebase)
- **Parallel Data Fetching**: Jira tickets are fetched in parallel with Redis data for optimal performance
- **Clickable Links**: Jira ticket keys are rendered as clickable links that open in a new tab
- **Support for All Failure Types**: Handles all four failure types:
  - `build-failure` → `art:image-build-failure`
  - `ec-failure` → `art:image-ec-failure`
  - `release-failure` → `art:image-release-failure`
  - `rebase-failure` → `art:image-rebase-failure`

## Architecture

### Backend Changes (app.py)

1. **New Dependencies**:
   - `from jira import JIRA`
   - `from pyartcd.jira_client import JIRAClient`

2. **New Environment Variables**:
   - `JIRA_TOKEN` (required) - Jira API token
   - `JIRA_EMAIL` (optional, defaults to `aos-art-automation@redhat.com`)
   - `JIRA_URL` (optional, defaults to `https://redhat.atlassian.net`)

3. **New Functions**:
   - `_get_jira_client()`: Lazily initializes the global Jira client
   - `_fetch_jira_tickets_for_failures()`: Queries Jira for open tickets and indexes them by (image_name, group)

4. **Modified API Endpoint**:
   - `/api/failures` now includes a `jira_ticket` field for each failure record
   - Fetches Jira tickets in parallel with Redis data using `asyncio.gather()`

### Frontend Changes

#### HTML (templates/failures.html)
- Added new `<col class="col-jira">` column definition
- Added new `<th>Jira</th>` header in the table

#### CSS (static/css/failures.css)
- Updated column width percentages to accommodate the Jira column
- Added `.jira-link` styles for ticket links

#### JavaScript (static/js/failures.js)
- Added `JIRA_BASE` constant for Jira URL construction
- Added `renderJiraLink()` function to render Jira ticket links
- Updated `renderTable()` to include Jira column in each row

### Mock Data Changes (mock_data.py)
- Added `jira_ticket` field to mock failures
- 30% chance of generating a Jira ticket for failures with count > 3
- Ticket format: `ART-XXXX` (matches real Jira ticket format)

## Configuration

### Development Mode (No Jira)
```bash
# Run without Jira integration (mock data)
ART_DASH_DEV=1 python app.py
```

### Production Mode (With Jira)
```bash
# Set required environment variables
export JIRA_TOKEN="your-jira-api-token"
export JIRA_EMAIL="your-email@redhat.com"  # optional
export REDIS_SERVER_PASSWORD="your-redis-password"

# Run the dashboard
python app.py
```

### OpenShift Deployment
Update the deployment config to include Jira credentials:

```yaml
env:
  - name: JIRA_TOKEN
    valueFrom:
      secretKeyRef:
        name: art-dashboard-secrets
        key: jira-token
  - name: JIRA_EMAIL
    value: "aos-art-automation@redhat.com"
  - name: REDIS_SERVER_PASSWORD
    valueFrom:
      secretKeyRef:
        name: art-dashboard-secrets
        key: redis-password
```

## Jira Query Logic

The dashboard queries Jira using the following JQL:
```jql
project = ART 
AND labels in ("art:image-build-failure","art:image-ec-failure","art:image-release-failure","art:image-rebase-failure") 
AND statusCategory != Done
```

For each ticket found, it extracts:
- `art:package:<image_name>` label → image name
- `art:group:<group>` label → group name

These are used to match Jira tickets to failures in the dashboard.

## How Jira Tickets Are Created

Jira tickets are automatically created by the `images-health` pipeline in `pyartcd`:

1. The pipeline runs periodically (e.g., daily)
2. It fetches build failures from Redis
3. For each failure, it queries Jira for existing open tickets
4. If no ticket exists, it creates a new one with appropriate labels
5. If a ticket exists, it updates the description and fail-count label
6. If a failure is resolved, the corresponding ticket is closed

See `/home/dpaolell/develop/github/openshift/art-tools/pyartcd/pyartcd/pipelines/images_health.py` for implementation details.

## Benefits

### Before This Change
- Users had to manually search Jira to find tickets for failures
- No direct link between dashboard and Jira tracking
- Slow workflow: dashboard → copy component name → search Jira → find ticket

### After This Change
- **One-click access**: Click the Jira ticket link to go directly to the ticket
- **Context awareness**: See which failures already have tickets vs. which need attention
- **Faster workflow**: Dashboard → click Jira link → done

## Replacing Slack Reports

This Jira integration is a key step toward replacing verbose Slack reports in `#forum-ocp-art` with dashboard links:

### Current Approach (Slack)
```
*Build Failures (3 images):*
- `ironic`: openshift-4.19 (Konflux): 26 failures (logs). | ART-4527
- `installer`: openshift-4.19 (Konflux): 20 failures (logs). | ART-7916
- `tools`: openshift-4.18 (Brew): 26 failures (logs). | ART-8787
```

### New Approach (Dashboard)
```
🔔 Build failures detected for openshift-4.19: https://art-dashboard.example.com/?group=openshift-4.19&type=build-failure
```

Users click the link and see:
- All failures for the group
- Failure counts, types, and trends
- Direct links to Jenkins/Konflux pipelines
- **Direct links to Jira tickets** (NEW!)

## Testing

Run the integration test:
```bash
python test_jira_integration.py
```

This verifies:
- All failures have a `jira_ticket` field
- Jira ticket format is correct (ART-XXXX)
- Mock data generates realistic Jira associations

## Future Enhancements

Potential improvements:
1. **Ticket Status Icons**: Show ticket status (Open, In Progress, etc.) with color coding
2. **Inline Ticket Details**: Hover tooltip showing ticket summary and status
3. **Create Ticket Button**: Allow users to create tickets directly from the dashboard
4. **Ticket Assignment**: Show who is assigned to each ticket
5. **Ticket Priority**: Display ticket priority level

## Troubleshooting

### Jira Links Don't Appear
- Check that `JIRA_TOKEN` environment variable is set
- Verify Jira credentials are valid: `curl -u "$JIRA_EMAIL:$JIRA_TOKEN" https://redhat.atlassian.net/rest/api/2/myself`
- Check logs for "Failed to fetch Jira tickets" warnings

### Wrong Tickets Shown
- Verify Jira label format matches expected pattern (`art:package:<name>`, `art:group:<group>`)
- Check that tickets have the correct failure type label (e.g., `art:image-build-failure`)
- Ensure tickets are not in "Done" status category

### Performance Issues
- Jira queries are cached per request (not per-failure)
- Consider adding Redis caching for Jira ticket data if needed
- Monitor Jira API rate limits

## Related Files

- Backend: `/home/dpaolell/develop/github/openshift/art-dashboard-ui/app.py`
- Frontend JS: `/home/dpaolell/develop/github/openshift/art-dashboard-ui/static/js/failures.js`
- Frontend HTML: `/home/dpaolell/develop/github/openshift/art-dashboard-ui/templates/failures.html`
- Frontend CSS: `/home/dpaolell/develop/github/openshift/art-dashboard-ui/static/css/failures.css`
- Mock Data: `/home/dpaolell/develop/github/openshift/art-dashboard-ui/mock_data.py`
- Tests: `/home/dpaolell/develop/github/openshift/art-dashboard-ui/test_jira_integration.py`
- images-health pipeline: `/home/dpaolell/develop/github/openshift/art-tools/pyartcd/pyartcd/pipelines/images_health.py`
