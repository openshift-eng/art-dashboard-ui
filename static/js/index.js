let cachedResults = [];
let lastDisplayedResults = []; // Track what was actually displayed from the last search
let allBranches = [];
let allSourceRepos = [];
let highlightedIndex = -1;
let lastSearchParamsKey = '';

// Sorting state
let currentSortColumn = null;
let currentSortDirection = null; // 'asc' or 'desc'
const SORT_STATE_KEY = 'tableSortState';

// Date picker instance
let datePickerInstance = null;

// Filter preview debounce timer
let filterPreviewTimer = null;

function buildParamsKey(params) {
    const entries = Array.from(params.entries()).sort(([aKey, aVal], [bKey, bVal]) => {
        if (aKey === bKey) return aVal.localeCompare(bVal);
        return aKey.localeCompare(bKey);
    });
    return entries.map(([key, value]) => `${key}=${value}`).join('&');
}

function getCurrentSearchParams() {
    const form = document.getElementById("searchForm");
    return new URLSearchParams(new FormData(form));
}

function updateFilterButtonVisibility() {
    const filterButton = document.getElementById("filterButton");
    if (!filterButton) return;
    if (!cachedResults || cachedResults.length === 0) {
        filterButton.style.display = "none";
        return;
    }
    if (filterButton.dataset.visible === 'true') {
        filterButton.style.display = "inline-block";
        return;
    }
    const currentKey = buildParamsKey(getCurrentSearchParams());
    if (currentKey !== lastSearchParamsKey) {
        filterButton.dataset.visible = 'true';
        filterButton.style.display = "inline-block";
    } else {
        filterButton.style.display = "none";
    }
}

/**
 * Loads sort state from localStorage.
 */
function loadSortState() {
    const saved = localStorage.getItem(SORT_STATE_KEY);
    if (saved) {
        try {
            const state = JSON.parse(saved);
            currentSortColumn = state.column;
            currentSortDirection = state.direction;
        } catch (e) {
            console.error('Error loading sort state:', e);
        }
    }
}

/**
 * Saves sort state to localStorage.
 */
function saveSortState() {
    if (currentSortColumn && currentSortDirection) {
        localStorage.setItem(SORT_STATE_KEY, JSON.stringify({
            column: currentSortColumn,
            direction: currentSortDirection
        }));
    }
}

/**
 * Updates the visual indicators on table headers to show current sort state.
 */
function updateSortIndicators() {
    document.querySelectorAll('th.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        const column = th.dataset.column;
        if (column === currentSortColumn) {
            th.classList.add(`sort-${currentSortDirection}`);
        }
    });
}

/**
 * Sorts results based on the specified column.
 */
function sortResults(results, column, direction) {
    const sorted = [...results]; // Create a copy to avoid mutating original

    sorted.sort((a, b) => {
        let aVal, bVal;

        // Get values based on column
        switch (column) {
            case 'name':
                aVal = a.name || '';
                bVal = b.name || '';
                break;
            case 'outcome':
                // Sort order: failure, pending, success
                const outcomeOrder = { 'failure': 0, 'pending': 1, 'success': 2 };
                aVal = outcomeOrder[a.outcome] ?? 3;
                bVal = outcomeOrder[b.outcome] ?? 3;
                break;
            case 'nvr':
                aVal = a.nvr || '';
                bVal = b.nvr || '';
                break;
            case 'source':
                aVal = a.source || '';
                bVal = b.source || '';
                break;
            case 'assembly':
                aVal = a.assembly || '';
                bVal = b.assembly || '';
                break;
            case 'group':
                aVal = a.group || '';
                bVal = b.group || '';
                break;
            case 'time':
                // Use start_time for sorting (already in Date format from backend)
                aVal = a.start_time ? new Date(a.start_time).getTime() : 0;
                bVal = b.start_time ? new Date(b.start_time).getTime() : 0;
                break;
            case 'plr':
                aVal = a['pipeline URL'] || '';
                bVal = b['pipeline URL'] || '';
                break;
            case 'its':
                const itsOrder = { 'failed': 0, 'n/a': 1, 'passed': 2 };
                aVal = itsOrder[a['ec_status']] ?? 1;
                bVal = itsOrder[b['ec_status']] ?? 1;
                break;
            default:
                return 0;
        }

        // Compare values
        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            comparison = aVal - bVal;
        } else {
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            comparison = aStr.localeCompare(bStr);
        }

        // Apply direction
        return direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
}

/**
 * Handles clicking on a sortable column header.
 */
function handleColumnSort(column) {
    // Toggle direction if clicking the same column, otherwise default to ascending
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }

    saveSortState();
    updateSortIndicators();

    // Re-display results with new sort
    const form = document.getElementById("searchForm");
    const formData = new FormData(form);

    // Clear lastDisplayedResults so status bar shows counts relative to deduplicated cache
    lastDisplayedResults = [];

    // Deduplicate raw cached results first, then apply filters
    const deduplicated = filterDuplicatePending(cachedResults);
    const filteredResults = deduplicated.filter(result => matchesFilters(result, formData));
    displayResults(filteredResults);
}

/**
 * Sets up click handlers for sortable column headers.
 */
function setupColumnSorting() {
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.column;
            handleColumnSort(column);
        });
    });
}

/**
 * Calculates date range based on preset.
 */
function getDateRangeForPreset(preset) {
    const endDate = new Date();
    const startDate = new Date();

    switch (preset) {
        case '24h':
            startDate.setDate(endDate.getDate() - 1);
            break;
        case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
        case 'custom':
            return null; // Let user choose
        default:
            return null;
    }

    return [startDate, endDate];
}

/**
 * Updates the active state of date preset buttons.
 */
function updateDatePresetButtons(activePreset) {
    document.querySelectorAll('.date-preset-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.preset === activePreset) {
            btn.classList.add('active');
        }
    });
}

/**
 * Handles clicking on a date preset button.
 */
function handleDatePreset(preset) {
    updateDatePresetButtons(preset);

    if (preset === 'custom') {
        // Just mark as custom, let user interact with date picker
        return;
    }

    const dateRange = getDateRangeForPreset(preset);
    if (dateRange && datePickerInstance) {
        datePickerInstance.setDate(dateRange);
    }
}

/**
 * Sets up date preset button handlers.
 */
function setupDatePresets() {
    document.querySelectorAll('.date-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            handleDatePreset(preset);
        });
    });

    // When user manually opens date picker, mark as "Custom"
    if (datePickerInstance) {
        datePickerInstance.config.onOpen.push(() => {
            updateDatePresetButtons('custom');
        });
    }
}

document.getElementById("toggleButton").addEventListener("click", function() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("collapsed");
    this.innerHTML = sidebar.classList.contains("collapsed") ? "❯" : "❮";
});

// Multi-select dropdown functionality
const multiSelectState = {};

const outcomeLabels = {
    'success': '✅ Success',
    'failure': '❌ Failure',
    'pending': '⏳ Pending'
};

function getOutcomeValue(checkbox) {
    return checkbox.dataset.value || checkbox.value;
}

// Get outcome checkboxes by their specific IDs to avoid browser auto-fill corruption
function getOutcomeCheckboxes() {
    return [
        document.getElementById('outcome-success'),
        document.getElementById('outcome-failure'),
        document.getElementById('outcome-pending')
    ].filter(cb => cb !== null);
}

function normalizeOutcomeCheckboxValues() {
    const success = document.getElementById('outcome-success');
    const failure = document.getElementById('outcome-failure');
    const pending = document.getElementById('outcome-pending');

    if (success) success.value = success.dataset.value || 'success';
    if (failure) failure.value = failure.dataset.value || 'failure';
    if (pending) pending.value = pending.dataset.value || 'pending';
}

// Standalone function to update outcome display text based on current checkbox state
function updateOutcomeDisplay() {
    const display = document.getElementById('outcome-display');
    if (!display) return;

    const checkboxes = getOutcomeCheckboxes();
    const selected = checkboxes
        .filter(cb => cb.checked)
        .map(cb => outcomeLabels[getOutcomeValue(cb)] || getOutcomeValue(cb));

    const textSpan = display.querySelector('.multiselect-text');
    if (selected.length === 0) {
        textSpan.textContent = 'Select outcomes...';
    } else if (selected.length === checkboxes.length) {
        textSpan.textContent = 'All outcomes';
    } else {
        textSpan.textContent = selected.join(', ');
    }
}

function setupMultiSelect(containerId, displayId, dropdownId) {
    const container = document.getElementById(containerId);
    const display = document.getElementById(displayId);
    const dropdown = document.getElementById(dropdownId);

    // Only add event listeners once
    if (!multiSelectState[containerId]) {
        multiSelectState[containerId] = true;

        function toggleDropdown() {
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
            display.querySelector('.multiselect-arrow').textContent = isVisible ? '▼' : '▲';
        }

        function hideDropdown() {
            dropdown.style.display = 'none';
            display.querySelector('.multiselect-arrow').textContent = '▼';
        }

        display.addEventListener('click', toggleDropdown);
        display.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleDropdown();
            }
        });

        const checkboxes = getOutcomeCheckboxes();
        checkboxes.forEach(cb => {
            cb.addEventListener('change', updateOutcomeDisplay);
        });

        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                hideDropdown();
            }
        });
    }

    // Always update display (for when checkboxes are programmatically changed)
    updateOutcomeDisplay();
}

function getSelectedOutcomes() {
    return getOutcomeCheckboxes().filter(cb => cb.checked).map(cb => getOutcomeValue(cb));
}

function showLoading() {
    document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none";
}

// Store current warnings for re-display
let currentWarnings = [];

function showToast(message, icon = "⚠️", duration = 8000) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-content">${message}</span>
        <button class="toast-close" title="Dismiss">&times;</button>
    `;

    // Add close button handler
    toast.querySelector(".toast-close").addEventListener("click", () => {
        closeToast(toast);
    });

    container.appendChild(toast);

    // Auto-dismiss after duration
    if (duration > 0) {
        setTimeout(() => {
            closeToast(toast);
        }, duration);
    }
}

function closeToast(toast) {
    if (!toast || toast.classList.contains("closing")) return;
    toast.classList.add("closing");
    setTimeout(() => {
        toast.remove();
    }, 300); // Match animation duration
}

function showWarnings(warnings) {
    if (!warnings || !Array.isArray(warnings) || warnings.length === 0) {
        currentWarnings = [];
        updateWarningIndicator();
        return;
    }
    currentWarnings = warnings;
    updateWarningIndicator();
    warnings.forEach(warning => {
        showToast(warning, "⚠️");
    });
}

function updateWarningIndicator() {
    const indicator = document.getElementById("warningIndicator");
    if (!indicator) return;
    indicator.style.display = currentWarnings.length > 0 ? "inline" : "none";
}

function redisplayWarnings() {
    if (currentWarnings.length === 0) return;
    currentWarnings.forEach(warning => {
        showToast(warning, "⚠️");
    });
}

function showCustomAlert(message, icon = "⚠️") {
    const overlay = document.getElementById("alertOverlay");
    const dialog = document.getElementById("customAlertDialog");
    const alertIcon = document.getElementById("alertIcon");
    const alertMessage = document.getElementById("alertMessage");

    // Set the message and icon
    alertMessage.textContent = message;
    alertIcon.textContent = icon;

    // Show overlay and dialog
    overlay.style.display = "block";
    dialog.style.display = "block";

    // Trigger animation after a short delay
    setTimeout(() => {
        dialog.classList.add("show");
    }, 10);
}

function hideCustomAlert() {
    const overlay = document.getElementById("alertOverlay");
    const dialog = document.getElementById("customAlertDialog");

    dialog.classList.remove("show");
    dialog.classList.add("hide");

    setTimeout(() => {
        dialog.style.display = "none";
        overlay.style.display = "none";
        dialog.classList.remove("hide");
    }, 400);
}

function createRow(result) {
    const row = document.createElement("tr");

    // Helper: format relative time
    function timeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp + " UTC");
        const seconds = Math.floor((now - then) / 1000);

        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'week', seconds: 604800 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 },
            { label: 'second', seconds: 1 }
        ];

        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
            }
        }
        return 'just now';
    }

    // Determine the Outcome display value
    const outcome = result.outcome?.toLowerCase() || "";
    const outcomeDisplay = {
        "success": "✅",
        "failure": "❌",
        "pending": "⏳",
    }[outcome] || outcome;

    // Build time + relative time
    const buildTime = result["time"];
    const localBuildTime = new Date(buildTime + " UTC").toLocaleString();
    const completedBuildTime = timeAgo(buildTime);
    const buildTimeDisplay = `${localBuildTime}<br><em style="color: #777;">(${completedBuildTime})</em>`;

    // Source commit link
    const shortCommit = result.commitish ? result.commitish.substring(0, 7) : '';
    const sourceLink = result.source && shortCommit ? `<a href="${result.source}/tree/${result.commitish}" target="_blank" title="View source tree">${shortCommit}</a>` : '';

    // Extract pipeline run suffix from pipeline URL
    const pipelineUrl = result["pipeline URL"] || "";
    let pipelineRunLink = "";
    if (pipelineUrl) {
        const urlParts = pipelineUrl.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        // Extract the suffix after the last dash (e.g., "tr79m" from "ose-4-13-ose-baremetal-installer-tr79m")
        const dashIndex = lastPart.lastIndexOf('-');
        let pipelineRunSuffix = dashIndex !== -1 ? lastPart.substring(dashIndex + 1) : lastPart;
        // Take only last 6 characters to keep it compact
        pipelineRunSuffix = pipelineRunSuffix.slice(-6);
        pipelineRunLink = `<a href="${pipelineUrl}" target="_blank" title="Pipeline run: ${lastPart}">${pipelineRunSuffix}</a>`;
    }

    // EC status (ITS) display — text with hyperlink for Pass/Fail
    const ecStatus = (result["ec_status"] || "n/a").toLowerCase();
    const ecPipelineUrl = result["ec_pipeline_url"] || "";
    let ecDisplay;
    if (ecStatus === "passed" && ecPipelineUrl) {
        ecDisplay = `<a href="${ecPipelineUrl}" target="_blank" title="EC verification passed">Pass</a>`;
    } else if (ecStatus === "failed" && ecPipelineUrl) {
        ecDisplay = `<a href="${ecPipelineUrl}" target="_blank" title="EC verification failed">Fail</a>`;
    } else {
        ecDisplay = "N/A";
    }

    // Create the row
    const groupParam = result["group"] ? `&group=${encodeURIComponent(result["group"])}` : '';
    const outcomeParam = result.outcome ? `&outcome=${encodeURIComponent(result.outcome)}` : '';
    const typeParam = result.type ? `&type=${encodeURIComponent(result.type)}` : '';
    row.innerHTML = `
        <td data-column="name">${result["name"]}</td>
        <td data-column="outcome">${outcomeDisplay}</td>
        <td data-column="nvr" class="nvr-td"><a href="/build?nvr=${result.nvr}&record_id=${result.record_id}${groupParam}${outcomeParam}${typeParam}" target="_blank" title="Build details">${result.nvr}</a></td>
        <td data-column="source">${sourceLink}</td>
        <td data-column="assembly">${result["assembly"]}</td>
        <td data-column="group">${result["group"]}</td>
        <td data-column="time">${buildTimeDisplay}</td>
        <td data-column="plr">${pipelineRunLink}</td>
        <td data-column="its" title="EC verification: ${ecStatus}">${ecDisplay}</td>
        <td data-column="links">
            <a href="/logs?nvr=${result.nvr}&record_id=${result.record_id}${groupParam}" target="_blank" title="Build logs">📜️</a>
            <a href="${result["art-job-url"]}" target="_blank" title="ART job URL">🎨</a>
        </td>
    `;

    return row;
}

const MAX_RESULTS = 1000;

function updateStatusBar(cachedCount, displayedCount) {
    const statusMessage = document.getElementById("statusMessage");

    if (cachedCount === 0) {
        statusMessage.textContent = "No results loaded";
        return;
    }

    let message = `Showing ${displayedCount} results`;
    if (cachedCount >= MAX_RESULTS) {
        message += ` — May be truncated (limit: ${MAX_RESULTS})`;
    }
    statusMessage.textContent = message;
}

/**
 * Shows a real-time preview of how many results would match current filter criteria.
 */
function updateFilterPreview() {
    const filterPreview = document.getElementById("filterPreview");

    // Only show preview if we have cached results
    if (!cachedResults || cachedResults.length === 0) {
        filterPreview.style.display = "none";
        return;
    }

    // Calculate how many results would match current filters
    const form = document.getElementById("searchForm");
    const formData = new FormData(form);

    // Deduplicate raw cached results first, then apply filters
    const deduplicated = filterDuplicatePending(cachedResults);
    const preFilteredResults = deduplicated.filter(result => matchesFilters(result, formData));
    const previewCount = preFilteredResults.length;
    const currentDisplayedCount = document.querySelectorAll("#resultsTable tbody tr:not(.virtual-padding-top):not(.virtual-padding-bottom)").length;

    // Only show preview if filter criteria would change the results
    if (previewCount !== currentDisplayedCount) {
        filterPreview.textContent = `⚡ Preview: ${previewCount} results with current filters`;
        filterPreview.style.display = "inline";
    } else {
        filterPreview.style.display = "none";
    }
}

/**
 * Debounced version of updateFilterPreview for real-time updates.
 */
function debouncedFilterPreview() {
    clearTimeout(filterPreviewTimer);
    filterPreviewTimer = setTimeout(() => {
        updateFilterPreview();
    }, 300); // 300ms debounce
}

function displayResults(results) {
    const tableBody = document.querySelector("#resultsTable tbody");
    tableBody.innerHTML = "";

    // Results are already deduplicated (either from performSearch or from cachedResults)
    let filteredResults = results;

    // Apply sorting if a column is selected
    if (currentSortColumn && currentSortDirection) {
        filteredResults = sortResults(filteredResults, currentSortColumn, currentSortDirection);
    }

    if (filteredResults.length === 0) {
        document.getElementById("noResultsMessage").style.display = "block";
    } else {
        document.getElementById("noResultsMessage").style.display = "none";
        filteredResults.forEach(result => {
            const row = createRow(result);
            tableBody.appendChild(row);
        });

        // Reapply column visibility to newly created rows
        const visibility = loadColumnVisibility();
        applyColumnVisibility(visibility);
    }

    // For status bar: use lastDisplayedResults if showing search results,
    // otherwise use deduplicated cached results (for frontend filters)
    const totalCount = lastDisplayedResults.length > 0 ? lastDisplayedResults.length : filterDuplicatePending(cachedResults).length;
    updateStatusBar(totalCount, filteredResults.length);

    // Hide filter preview when results are displayed
    const filterPreview = document.getElementById("filterPreview");
    if (filterPreview) {
        filterPreview.style.display = "none";
    }
}

function filterDuplicatePending(results) {
    // Group results by NVR
    const nvrGroups = {};

    results.forEach(result => {
        const nvr = result.nvr;
        if (!nvrGroups[nvr]) {
            nvrGroups[nvr] = [];
        }
        nvrGroups[nvr].push(result);
    });

    // Filter out pending builds that have a completed version
    const filteredResults = [];

    Object.values(nvrGroups).forEach(group => {
        // Check if there's both a pending and a completed build
        const hasPending = group.some(r => r.outcome?.toLowerCase() === 'pending');
        const hasCompleted = group.some(r => {
            const outcome = r.outcome?.toLowerCase();
            return outcome === 'success' || outcome === 'failure';
        });

        if (hasPending && hasCompleted) {
            // Only include the completed builds
            group.forEach(result => {
                const outcome = result.outcome?.toLowerCase();
                if (outcome === 'success' || outcome === 'failure') {
                    filteredResults.push(result);
                }
            });
        } else {
            // Include all builds for this NVR
            filteredResults.push(...group);
        }
    });

    return filteredResults;
}

function performSearch(queryParams = null) {
    showLoading();
    const scrollContainer = document.querySelector(".results-container");
    scrollContainer.style.overflow = 'hidden';

    const form = document.getElementById("searchForm");
    const formData = queryParams || new FormData(form);
    const paramsKey = buildParamsKey(new URLSearchParams(formData));

    // Store user's selected outcomes for frontend filtering
    const selectedOutcomes = formData.getAll('outcome');

    // Always fetch all outcomes from backend so that filterDuplicatePending() can properly
    // detect which pending builds have completed versions. We'll filter by outcome on the frontend.
    const backendFormData = new FormData();
    for (const [key, value] of formData.entries()) {
        if (key === 'outcome') {
            // Skip outcome filter - we'll apply it on frontend after deduplication
            continue;
        }
        backendFormData.append(key, value);
    }

    const queryString = new URLSearchParams(backendFormData).toString();
    const url = `/search?${queryString}`;

    fetch(url, {
        method: "GET",
        headers: { "X-Requested-With": "XMLHttpRequest" },
    })
    .then((response) => {
        if (!response.ok) {
            // Try to extract error message from response
            return response.text().then(text => {
                // Check if it's an HTML error page (Flask debug page)
                const titleMatch = text.match(/<title>([^<]+)/);
                if (titleMatch) {
                    throw new Error(titleMatch[1].replace(' // Werkzeug Debugger', '').trim());
                }
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            });
        }
        return response.json();
    })
    .then((data) => {
        // Check if the response contains an error
        if (data && data.error) {
            cachedResults = [];
            lastDisplayedResults = [];
            displayResults([]);
            hideLoading();
            scrollContainer.style.overflow = 'auto';
            showCustomAlert(data.error, "⚠️");
            return;
        }
        
        // Handle new response format with builds and warnings
        const builds = data.builds || data;  // Support both old and new format
        const warnings = data.warnings || [];

        // Cache the raw results from backend (all outcomes)
        cachedResults = builds;

        // Deduplicate and filter for display
        const deduplicated = filterDuplicatePending(builds);

        // Filter to selected outcomes if user specified any
        let resultsToDisplay = deduplicated;
        if (selectedOutcomes.length > 0) {
            const selectedLower = selectedOutcomes.map(o => o.toLowerCase());
            resultsToDisplay = deduplicated.filter(result => {
                return selectedLower.includes(result.outcome?.toLowerCase());
            });
        }

        // Track what we're displaying from this search
        lastDisplayedResults = resultsToDisplay;
        displayResults(resultsToDisplay);
        hideLoading();
        scrollContainer.style.overflow = 'auto';
        
        // Show any warnings as toast notifications
        showWarnings(warnings);
        
        lastSearchParamsKey = paramsKey;
        const filterButton = document.getElementById("filterButton");
        if (filterButton) {
            filterButton.dataset.visible = 'false';
        }
        updateFilterButtonVisibility();
    })
    .catch((error) => {
        console.error("Search error:", error);
        hideLoading();
        scrollContainer.style.overflow = 'auto';
        cachedResults = [];
        lastDisplayedResults = [];
        displayResults([]);
        showCustomAlert(`Search failed: ${error.message}`, "❌");
        const filterButton = document.getElementById("filterButton");
        if (filterButton) {
            filterButton.dataset.visible = 'false';
        }
        updateFilterButtonVisibility();
    });
}

function filterResults() {
    const form = document.getElementById("searchForm");
    const formData = new FormData(form);

    // Clear lastDisplayedResults so status bar shows counts relative to deduplicated cache
    lastDisplayedResults = [];

    // Deduplicate raw cached results first, then apply filters
    const deduplicated = filterDuplicatePending(cachedResults);
    const filteredResults = deduplicated.filter(result => matchesFilters(result, formData));
    displayResults(filteredResults);
    const filterButton = document.getElementById("filterButton");
    if (filterButton) {
        filterButton.dataset.visible = 'true';
        filterButton.style.display = "inline-block";
    }

    // Hide filter preview after applying filters
    const filterPreview = document.getElementById("filterPreview");
    if (filterPreview) {
        filterPreview.style.display = "none";
    }
}

function downloadResults() {
    const form = document.getElementById("searchForm");
    const formData = new FormData(form);

    const filteredResults = cachedResults.filter(result => matchesFilters(result, formData));
    if (filteredResults.length === 0) {
        showCustomAlert("No results to download. Please perform a search first.");
        return;
    }

    // Convert results to JSON string (pretty-printed for readability)
    const jsonStr = JSON.stringify(filteredResults, null, 2);

    // Create a Blob with the JSON content
    const blob = new Blob([jsonStr], { type: "application/json" });

    // Create a temporary link and trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "results.json"; // <-- filename
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function matchesFilters(result, filterParams) {
    // Collect all selected outcomes first (multi-select)
    const selectedOutcomes = filterParams.getAll('outcome');

    // Check outcome filter (must match at least one selected outcome)
    if (selectedOutcomes.length > 0) {
        if (!selectedOutcomes.includes(result['outcome'])) {
            return false;
        }
    }

    for (let [key, value] of filterParams.entries()) {
        if (!value) continue; // Skip empty filter values

        // Skip outcome - already handled above
        if (key === "outcome") {
            continue;
        } else if (key == 'group') {
            if (result['group'] != value) {
                return false;
            }
        } else if (key == 'record_id') {
            if (!result['record_id'] || result['record_id'] !== value) {
                return false;
            }
        } else if (key == 'commitish') {
            // Starts-with matching for commitish/source commit (case-insensitive)
            if (!result['commitish'] || !result['commitish'].toLowerCase().startsWith(value.toLowerCase())) {
                return false;
            }
        } else if (key == 'source_repo') {
            // Pattern match since displayed names have https://github.com/ stripped
            if (!result['source'] || !result['source'].toLowerCase().includes(value.toLowerCase())) {
                return false;
            }
        } else if (key == 'image_sha_tag') {
            // OR logic: matches image_pullspec with sha256:{value} OR image_tag containing value OR nvr containing value
            const lowerValue = value.toLowerCase();
            const pullspecMatch = result['image_pullspec'] && result['image_pullspec'].toLowerCase().includes('sha256:' + lowerValue);
            const tagMatch = result['image_tag'] && result['image_tag'].toLowerCase().includes(lowerValue);
            const nvrMatch = result['nvr'] && result['nvr'].toLowerCase().includes(lowerValue);
            if (!pullspecMatch && !tagMatch && !nvrMatch) {
                return false;
            }
        } else if (key == 'dateRange') {
            const resultDate = new Date(result['completed']);
            // Parse date range "YYYY-MM-DD to YYYY-MM-DD"
            const dates = value.split(' to ');
            if (dates.length >= 1 && dates[0]) {
                const startDate = new Date(dates[0]);
                if (resultDate < startDate) {
                    return false;
                }
            }
            if (dates.length >= 2 && dates[1]) {
                const endDate = new Date(dates[1]);
                // Set end date to end of day
                endDate.setHours(23, 59, 59, 999);
                if (resultDate > endDate) {
                return false;
                }
            }
        } else if (key == 'engine') {
            if (value != 'both' && result['engine'] != value) {
                return false;
            }
        } else if (key == 'assembly') {
            // '*' matches any assembly
            if (value != '*' && result['assembly'] != value) {
                return false;
            }
        } else {
            try {
                const regex = new RegExp(value, "i");
                if (!regex.test(result[key])) {
                    return false;
                }
            } catch (e) {
                console.error(`Invalid regex for '${key}': ${value}`, e);
                return false;
            }
        }
    }

    return true;
}

function setupStaticAutocomplete(input, dropdown, options) {
    let highlightedIdx = -1;

    function filterOptions(query) {
        // For small option lists, always show all options
        // This ensures users see all choices even when field has a value
        if (options.length <= 5) return options;
        if (!query) return options;
        const lowercaseQuery = query.toLowerCase();
        return options.filter(opt => opt.toLowerCase().includes(lowercaseQuery));
    }

    function showDropdown(items) {
        dropdown.innerHTML = '';
        highlightedIdx = -1;

        if (items.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            div.textContent = item === '*' ? '* (any)' : item;
            div.dataset.value = item;
            div.dataset.index = index;

            div.addEventListener('click', () => {
                input.value = item;
                dropdown.style.display = 'none';
                highlightedIdx = -1;
            });

            dropdown.appendChild(div);
        });

        dropdown.style.display = 'block';
    }

    function hideDropdown() {
        dropdown.style.display = 'none';
        highlightedIdx = -1;
    }

    function highlightItem(index) {
        const items = dropdown.querySelectorAll('.autocomplete-item');
        items.forEach((item, i) => {
            item.classList.toggle('highlighted', i === index);
        });

        if (index >= 0 && items[index]) {
            items[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    input.addEventListener('input', () => {
        const query = input.value.trim();
        const filtered = filterOptions(query);
        showDropdown(filtered);
    });

    input.addEventListener('focus', () => {
        const query = input.value.trim();
        const filtered = filterOptions(query);
        showDropdown(filtered);
    });

    input.addEventListener('keydown', (e) => {
        const items = dropdown.querySelectorAll('.autocomplete-item');
        const isVisible = dropdown.style.display === 'block';

        if (!isVisible) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                highlightedIdx = Math.min(highlightedIdx + 1, items.length - 1);
                highlightItem(highlightedIdx);
                break;
            case 'ArrowUp':
                e.preventDefault();
                highlightedIdx = Math.max(highlightedIdx - 1, -1);
                highlightItem(highlightedIdx);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIdx >= 0 && items[highlightedIdx]) {
                    input.value = items[highlightedIdx].dataset.value;
                }
                // If no item is highlighted, keep the user's custom value
                hideDropdown();
                break;
            case 'Escape':
                hideDropdown();
                break;
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            hideDropdown();
        }
    });
}

function setupSourceRepoAutocomplete(input, dropdown) {
    let highlightedIdx = -1;

    function filterRepos(query) {
        if (!query) return allSourceRepos;
        const lowercaseQuery = query.toLowerCase();
        return allSourceRepos.filter(repo => repo.toLowerCase().includes(lowercaseQuery));
    }

    function showDropdown(repos) {
        dropdown.innerHTML = '';
        highlightedIdx = -1;

        if (repos.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        repos.forEach((repo, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = repo;
            item.dataset.index = index;

            item.addEventListener('click', () => {
                input.value = repo;
                dropdown.style.display = 'none';
                highlightedIdx = -1;
            });

            dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
    }

    function hideDropdown() {
        dropdown.style.display = 'none';
        highlightedIdx = -1;
    }

    function highlightItem(index) {
        const items = dropdown.querySelectorAll('.autocomplete-item');
        items.forEach((item, i) => {
            item.classList.toggle('highlighted', i === index);
        });

        if (index >= 0 && items[index]) {
            items[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    input.addEventListener('input', () => {
        const query = input.value.trim();
        const filtered = filterRepos(query);
        showDropdown(filtered);
    });

    input.addEventListener('focus', () => {
        const query = input.value.trim();
        const filtered = filterRepos(query);
        showDropdown(filtered);
    });

    input.addEventListener('keydown', (e) => {
        const items = dropdown.querySelectorAll('.autocomplete-item');
        const isVisible = dropdown.style.display === 'block';

        if (!isVisible) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                highlightedIdx = Math.min(highlightedIdx + 1, items.length - 1);
                highlightItem(highlightedIdx);
                break;
            case 'ArrowUp':
                e.preventDefault();
                highlightedIdx = Math.max(highlightedIdx - 1, -1);
                highlightItem(highlightedIdx);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIdx >= 0 && items[highlightedIdx]) {
                    input.value = items[highlightedIdx].textContent;
                }
                // If no item is highlighted, keep the user's custom value
                hideDropdown();
                break;
            case 'Escape':
                hideDropdown();
                break;
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            hideDropdown();
        }
    });
}

function setupAutocomplete(input, dropdown) {
    function filterBranches(query) {
        if (!query) return allBranches;

        const lowercaseQuery = query.toLowerCase();
        return allBranches.filter(branch =>
            branch.toLowerCase().includes(lowercaseQuery)
        );
    }

    function showDropdown(branches) {
        dropdown.innerHTML = '';
        highlightedIndex = -1;

        if (branches.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        branches.forEach((branch, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = branch;
            item.dataset.index = index;

            item.addEventListener('click', () => {
                input.value = branch;
                dropdown.style.display = 'none';
                highlightedIndex = -1;
            });

            dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
    }

    function hideDropdown() {
        dropdown.style.display = 'none';
        highlightedIndex = -1;
    }

    function highlightItem(index) {
        const items = dropdown.querySelectorAll('.autocomplete-item');
        items.forEach((item, i) => {
            item.classList.toggle('highlighted', i === index);
        });

        // Scroll highlighted item into view
        if (index >= 0 && items[index]) {
            items[index].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }

    // Input event for filtering
    input.addEventListener('input', () => {
        const query = input.value.trim();
        const filteredBranches = filterBranches(query);
        showDropdown(filteredBranches);
    });

    // Focus event to show dropdown
    input.addEventListener('focus', () => {
        const query = input.value.trim();
        const filteredBranches = filterBranches(query);
        showDropdown(filteredBranches);
    });

    // Keyboard navigation
    input.addEventListener('keydown', (e) => {
        const items = dropdown.querySelectorAll('.autocomplete-item');
        const isVisible = dropdown.style.display === 'block';

        if (!isVisible) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
                highlightItem(highlightedIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                highlightedIndex = Math.max(highlightedIndex - 1, -1);
                highlightItem(highlightedIndex);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && items[highlightedIndex]) {
                    // Select the highlighted item
                    input.value = items[highlightedIndex].textContent;
                }
                // If no item is highlighted, keep the user's custom value
                hideDropdown();
                break;
            case 'Escape':
                hideDropdown();
                break;
        }
    });

    // Click outside to hide dropdown
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            hideDropdown();
        }
    });
}

// Extract datetime from NVR string (format YYYYMMDDHHMM embedded in NVR)
function extractNvrDatetime(nvr) {
    if (!nvr) return null;
    const match = nvr.match(/-(\d{12})\./);
    if (!match) return null;
    try {
        const dtStr = match[1];
        const year = parseInt(dtStr.substring(0, 4));
        const month = parseInt(dtStr.substring(4, 6)) - 1; // JS months are 0-indexed
        const day = parseInt(dtStr.substring(6, 8));
        return new Date(year, month, day);
    } catch (e) {
        return null;
    }
}

// Column visibility management
const COLUMN_VISIBILITY_KEY = 'columnVisibility';

function loadColumnVisibility() {
    const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Error parsing column visibility from localStorage:', e);
        }
    }
    // Default: all columns visible
    return {
        name: true,
        outcome: true,
        nvr: true,
        source: true,
        assembly: true,
        group: true,
        time: true,
        plr: true,
        its: true,
        links: true
    };
}

function saveColumnVisibility(visibility) {
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(visibility));
}

function applyColumnVisibility(visibility) {
    // Apply to table headers
    document.querySelectorAll('th[data-column]').forEach(th => {
        const column = th.dataset.column;
        if (visibility[column] === false) {
            th.classList.add('hidden');
        } else {
            th.classList.remove('hidden');
        }
    });

    // Apply to table cells
    document.querySelectorAll('td[data-column]').forEach(td => {
        const column = td.dataset.column;
        if (visibility[column] === false) {
            td.classList.add('hidden');
        } else {
            td.classList.remove('hidden');
        }
    });
}

function setupColumnVisibilityToggle() {
    const toggleIcon = document.getElementById('columnToggleIcon');
    const dropdown = document.getElementById('columnVisibilityDropdown');
    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');

    // Load saved visibility state
    const visibility = loadColumnVisibility();

    // Set checkbox states from saved visibility
    checkboxes.forEach(cb => {
        const column = cb.dataset.column;
        cb.checked = visibility[column] !== false;
    });

    // Apply initial visibility
    applyColumnVisibility(visibility);

    // Toggle dropdown on icon click
    toggleIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
    });

    // Handle checkbox changes
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const column = cb.dataset.column;
            visibility[column] = cb.checked;
            saveColumnVisibility(visibility);
            applyColumnVisibility(visibility);
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!toggleIcon.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Setup column visibility toggle
    setupColumnVisibilityToggle();

    // Setup column sorting
    loadSortState();
    setupColumnSorting();
    updateSortIndicators();

    // Check URL parameters to determine date range initialization
    const urlParams = new URLSearchParams(window.location.search);
    const urlDateRange = urlParams.get('dateRange');
    const urlNvr = urlParams.get('nvr');

    let datePickerDefault = null;
    
    if (urlDateRange) {
        // Use explicit dateRange from URL
        const dates = urlDateRange.split(' to ');
        if (dates.length >= 2) {
            datePickerDefault = [dates[0], dates[1]];
        } else if (dates.length === 1 && dates[0]) {
            datePickerDefault = [dates[0]];
        }
    } else if (urlNvr && extractNvrDatetime(urlNvr)) {
        // NVR has embedded datetime - leave dateRange empty so backend derives it
        datePickerDefault = null;
    } else {
        // Default: 2 days ago to today
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 2);
        const endDate = new Date();
        datePickerDefault = [startDate, endDate];
    }

    // Initialize flatpickr and store instance
    datePickerInstance = flatpickr("#dateRange", {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: datePickerDefault,
        onOpen: []
    });

    // Setup date preset buttons
    setupDatePresets();

    // Determine initial active preset based on default date range
    if (!urlDateRange && !urlNvr) {
        // Default is 2 days, mark "Custom" as active
        updateDatePresetButtons('custom');
    } else if (urlDateRange) {
        // User has explicit date range, mark as Custom
        updateDatePresetButtons('custom');
    }

    hideLoading();

    // Check if we're on a search results page (from server-side render)
    const isSearchPage = document.body.dataset.isSearchPage === 'true';

    const form = document.getElementById("searchForm");

    // If we have initial results from server, cache raw results and deduplicate for display
    if (isSearchPage && window.initialResults) {
        // Cache raw results from server (all outcomes)
        cachedResults = window.initialResults;

        // Deduplicate for display
        const deduplicated = filterDuplicatePending(window.initialResults);

        // Apply outcome filter from URL params if specified
        const selectedOutcomes = urlParams.getAll('outcome');
        let resultsToDisplay = deduplicated;
        if (selectedOutcomes.length > 0) {
            const selectedLower = selectedOutcomes.map(o => o.toLowerCase());
            resultsToDisplay = deduplicated.filter(result => {
                return selectedLower.includes(result.outcome?.toLowerCase());
            });
        }

        // Track what we're displaying from this search
        lastDisplayedResults = resultsToDisplay;
        displayResults(resultsToDisplay);
        lastSearchParamsKey = buildParamsKey(urlParams);
        const filterButton = document.getElementById("filterButton");
        if (filterButton) {
            filterButton.dataset.visible = 'false';
        }
        updateFilterButtonVisibility();
    }
    // Otherwise, if we have search parameters, perform search
    else if (urlParams.size > 0) {
        // Populate form fields from URL
        urlParams.forEach((value, key) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = value;
        });

        performSearch(urlParams);
        lastSearchParamsKey = buildParamsKey(urlParams);
    }
    else {
        lastSearchParamsKey = buildParamsKey(getCurrentSearchParams());
        const filterButton = document.getElementById("filterButton");
        if (filterButton) {
            filterButton.dataset.visible = 'false';
        }
        updateFilterButtonVisibility();
    }

    form.addEventListener('input', () => {
        updateFilterButtonVisibility();
        debouncedFilterPreview();
    });
    form.addEventListener('change', () => {
        updateFilterButtonVisibility();
        debouncedFilterPreview();
    });

    // Fetch all branches for autocomplete (independent of search)
    const groupInput = document.getElementById("group");
    const groupDropdown = document.getElementById("group-dropdown");

    fetch("/get_groups")
        .then((response) => response.json())
        .then((groups) => {
            allBranches = groups;

            // Set value from URL if present
            if (urlParams.has('group')) {
                groupInput.value = urlParams.get('group');
            }
        })
        .catch((error) => console.error("Error fetching groups:", error));

    // Setup autocomplete functionality
    setupAutocomplete(groupInput, groupDropdown);

    // Fetch source repos for autocomplete
    const sourceRepoInput = document.getElementById("source_repo");
    const sourceRepoDropdown = document.getElementById("source_repo-dropdown");

    fetch("/get_source_repos")
        .then((response) => response.json())
        .then((repos) => {
            allSourceRepos = repos;

            // Set value from URL if present
            if (urlParams.has('source_repo')) {
                sourceRepoInput.value = urlParams.get('source_repo');
            }
        })
        .catch((error) => console.error("Error fetching source repos:", error));

    // Setup source repo autocomplete
    setupSourceRepoAutocomplete(sourceRepoInput, sourceRepoDropdown);

    // Setup Assembly autocomplete with static options
    const assemblyInput = document.getElementById("assembly");
    const assemblyDropdown = document.getElementById("assembly-dropdown");
    const assemblyOptions = ["stream", "test", "*"];
    setupStaticAutocomplete(assemblyInput, assemblyDropdown, assemblyOptions);

    normalizeOutcomeCheckboxValues();

    // Setup Outcome multi-select
    setupMultiSelect('outcome-container', 'outcome-display', 'outcome-dropdown');

    // Set outcome checkboxes from URL if present
    if (urlParams.has('outcome')) {
        const outcomes = urlParams.getAll('outcome');
        const checkboxes = getOutcomeCheckboxes();
        checkboxes.forEach(cb => {
            cb.checked = outcomes.includes(getOutcomeValue(cb));
        });
        updateOutcomeDisplay();
    }
});

document.getElementById("searchButton").addEventListener("click", function (event) {
    event.preventDefault();

    const form = document.getElementById("searchForm");
    const formData = new FormData(form);
    const queryParams = new URLSearchParams(formData);

    // Update browser URL without reloading
    window.history.pushState({}, '', `/?${queryParams.toString()}`);

    performSearch(formData);
});

document.getElementById("filterButton").addEventListener("click", function (event) {
    event.preventDefault();
    filterResults();
});

document.getElementById("downloadButton").addEventListener("click", function (event) {
    event.preventDefault();
    downloadResults();
});

document.getElementById("warningIndicator").addEventListener("click", function() {
    redisplayWarnings();
});

document.getElementById("helpIcon").addEventListener("click", function() {
    const dialog = document.getElementById("instructionsDialog");
    dialog.style.display = "block";
    setTimeout(() => {
        dialog.classList.add("show");
    }, 10);
});

document.getElementById("closeDialogButton").addEventListener("click", function() {
    const dialog = document.getElementById("instructionsDialog");
    dialog.classList.remove("show");
    dialog.classList.add("hide");

    setTimeout(() => {
        dialog.style.display = "none";
        dialog.classList.remove("hide");
    }, 400);
});

document.getElementById("alertOkButton").addEventListener("click", function() {
    hideCustomAlert();
});

// Close alert when clicking on overlay
document.getElementById("alertOverlay").addEventListener("click", function() {
    hideCustomAlert();
});

document.querySelector(".sidebar-title a").addEventListener("click", function(e) {
    e.preventDefault();
    // Reset form
    const form = document.getElementById("searchForm");

    // Reset text inputs
    form.querySelector("#name").value = "";
    form.querySelector("#nvr").value = "";
    form.querySelector("#record_id").value = "";
    form.querySelector("#assembly").value = "stream";
    form.querySelector("#source_repo").value = "";
    form.querySelector("#commitish").value = "";
    form.querySelector("#art-job-url").value = "";

    // Reset outcome checkboxes (default: only success checked)
    const outcomeCheckboxes = getOutcomeCheckboxes();
    outcomeCheckboxes.forEach(cb => {
        cb.checked = getOutcomeValue(cb) === 'success';
    });
    updateOutcomeDisplay();

    // Reset select dropdowns
    form.querySelector("#engine").value = "konflux";
    form.querySelector("#group").value = "";

    // Reset date picker to default (2 days ago)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 2);
    const endDate = new Date();
    if (datePickerInstance) {
        datePickerInstance.setDate([startDate, endDate]);
    }
    updateDatePresetButtons('custom');

    // Clear any existing search results
    cachedResults = [];
    lastDisplayedResults = [];
    document.querySelector("#resultsTable tbody").innerHTML = "";
    document.getElementById("noResultsMessage").style.display = "none";
    updateStatusBar(0, 0);

    // Clear the URL parameters
    window.history.pushState({}, document.title, window.location.pathname);

    // Clear cached results
    cachedResults = [];
    lastDisplayedResults = [];

    lastSearchParamsKey = buildParamsKey(getCurrentSearchParams());
    const filterButton = document.getElementById("filterButton");
    if (filterButton) {
        filterButton.dataset.visible = 'false';
    }
    updateFilterButtonVisibility();
});
