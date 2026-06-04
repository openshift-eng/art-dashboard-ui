# Pipeline URL Icons Implementation

## Summary

Updated the Build Failures Dashboard to display pipeline URLs with appropriate icons for Jenkins and Konflux pipelines.

## Changes Made

### Backend Changes (`app.py`)

1. **Updated `_fetch_failures_for_type()` function** (lines 117-167):
   - Now fetches both `jenkins_url` and `pipeline_url` from Redis
   - Changed from fetching single URL field to fetching both fields in parallel
   - Returns both fields in the failure record dictionary

2. **Updated docstrings** to reflect the new data structure including both URL fields

### Mock Data Changes (`mock_data.py`)

1. **Updated `_generate_pipeline_urls()` function**:
   - Renamed from `_generate_pipeline_url()` (singular)
   - Now returns a tuple of `(jenkins_url, pipeline_url)`
   - Implements logic:
     - Rebase failures: Only Jenkins URLs
     - Other failures: 70% Jenkins, 30% Konflux pipeline URLs
   
2. **Updated `generate_mock_failures()` function**:
   - Now generates both `jenkins_url` and `pipeline_url` fields
   - Updated to match production data structure

### Frontend Changes

#### JavaScript (`static/js/failures.js`)

1. **Added `renderPipelineLinks()` function** (lines 337-354):
   - Takes both `jenkinsUrl` and `pipelineUrl` parameters
   - Renders icon links for each URL type present
   - Uses appropriate icons: Jenkins icon for Jenkins URLs, Konflux icon for pipeline URLs
   - Returns "-" if no URLs are present

2. **Updated `renderTable()` function** (line 156):
   - Changed from rendering a simple "View" link to calling `renderPipelineLinks()`
   - Now displays icon-based links for both URL types

#### CSS (`static/css/failures.css`)

1. **Updated `.pipeline-link` styles** (lines 259-270):
   - Changed from text-based link to icon-based link
   - Added flexbox layout for proper icon alignment
   - Added hover opacity effect
   - Removed color styling (icons are self-colored)

2. **Added `.pipeline-icon` styles** (lines 271-275):
   - Fixed icon size at 20x20 pixels
   - Ensures icons display as blocks for proper sizing

#### Icons (`static/images/`)

1. **Using `jenkins-icon.png`**:
   - Jenkins butler mascot icon (250x346 PNG)
   - Displayed at 24x24 pixels in the UI

2. **Using `konflux-icon.png`**:
   - Konflux logo icon (62x63 PNG)
   - Displayed at 24x24 pixels in the UI

## Data Structure

Each failure record now includes:
```json
{
  "name": "component-name",
  "group": "openshift-4.19",
  "failure_type": "build-failure",
  "failure_count": 5,
  "jenkins_url": "https://art-jenkins.../job/build%252Focp4/123/",
  "pipeline_url": "https://console.redhat.com/.../pipelineruns/component-build-abc123"
}
```

- One or both URL fields may be empty strings
- If both are present, both icons will be displayed
- If neither is present, "-" is displayed

## Icons

The dashboard uses PNG icons for both pipeline types:

- `static/images/jenkins-icon.png` - Jenkins butler mascot (250x346, scaled to 24x24)
- `static/images/konflux-icon.png` - Konflux logo (62x63, scaled to 24x24)

Both icons are displayed at 24x24 pixels with hover opacity effects.

## Testing

The implementation can be tested with:
```bash
# Start in dev mode with mock data
ART_DASH_DEV=1 python app.py

# Access at http://localhost:8080
```

The mock data includes a mix of:
- Records with only Jenkins URLs (~70%)
- Records with only Konflux pipeline URLs (~30%)
- Rebase failures (always Jenkins only)

## Future Enhancements

Potential improvements:
- Add tooltips showing full URL on icon hover
- Add different icon styles for different Jenkins job types
- Add status indicators (success/failure) to icons
- Support for additional pipeline systems
