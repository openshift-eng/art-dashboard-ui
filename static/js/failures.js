// ART Build Failures Dashboard

// Failure type colors (ec-failure refers to ITS - Image Test Suite)
const FAILURE_TYPE_COLORS = {
    'build-failure': '#f44336',
    'ec-failure': '#ff9800',  // ITS failures (displayed as "ITS Failure")
    'release-failure': '#9c27b0',
    'rebase-failure': '#2196f3',
};

let allData = [];
let currentData = [];
let currentSort = { field: 'failure_count', ascending: false };
let currentView = 'table';
let isInitialLoad = true;
let allGroups = [];
let highlightedIndex = -1;

// --- Initialization ---

document.addEventListener('DOMContentLoaded', async () => {
    await loadFilters();
    await refreshData();

    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    document.getElementById('refresh-data').addEventListener('click', refreshData);
    document.getElementById('download-json').addEventListener('click', downloadJSON);
    document.getElementById('view-table').addEventListener('click', () => switchView('table'));
    document.getElementById('view-bubbles').addEventListener('click', () => switchView('bubbles'));

    document.getElementById('name-filter').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyFilters();
        }
    });

    document.querySelectorAll('#failures-table th.sortable').forEach(th => {
        th.addEventListener('click', () => handleSort(th.dataset.sort));
    });

    // Setup group autocomplete
    const groupInput = document.getElementById('group-filter');
    const groupDropdown = document.getElementById('group-filter-dropdown');
    setupGroupAutocomplete(groupInput, groupDropdown);
});

// --- Data Loading ---

async function loadFilters() {
    try {
        const [groups, types] = await Promise.all([
            fetch('/api/groups').then(r => r.json()),
            fetch('/api/failure-types').then(r => r.json()),
        ]);

        // Store groups for autocomplete
        allGroups = groups;

        const typeSelect = document.getElementById('type-filter');
        types.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = formatFailureType(t);
            typeSelect.appendChild(opt);
        });
    } catch (err) {
        console.error('Failed to load filters:', err);
    }
}

async function refreshData() {
    const loading = document.getElementById('loadingOverlay');
    loading.style.display = 'flex';

    try {
        // Fetch both failures and groups on refresh
        const [failuresResponse, groupsResponse] = await Promise.all([
            fetch('/api/failures'),
            fetch('/api/groups')
        ]);
        allData = await failuresResponse.json();
        const groups = await groupsResponse.json();

        // Store groups for autocomplete
        allGroups = groups;

        // Get current values before updating
        const groupInput = document.getElementById('group-filter');
        const typeSelect = document.getElementById('type-filter');
        const nameInput = document.getElementById('name-filter');
        const currentGroupValue = groupInput.value;

        // On initial load, check URL params; on refresh, preserve current filter state
        let targetGroup, targetType, targetName;
        if (isInitialLoad) {
            const urlParams = new URLSearchParams(window.location.search);
            targetGroup = urlParams.get('group');
            targetType = urlParams.get('type');
            targetName = urlParams.get('name');
            isInitialLoad = false;
        } else {
            targetGroup = currentGroupValue;
            targetType = typeSelect.value;
            targetName = nameInput.value;
        }

        // Restore group filter value
        if (targetGroup) {
            groupInput.value = targetGroup;
        } else {
            groupInput.value = '';
        }

        // Restore type filter if valid
        if (targetType) {
            typeSelect.value = targetType;
        }

        // Restore name filter
        if (targetName) {
            nameInput.value = targetName;
        }

        applyFilters();
    } catch (err) {
        console.error('Failed to load failures:', err);
        allData = [];
        currentData = [];
    } finally {
        loading.style.display = 'none';
    }
}

function applyFilters() {
    const group = document.getElementById('group-filter').value.trim();
    const type = document.getElementById('type-filter').value;
    const name = document.getElementById('name-filter').value.toLowerCase();

    currentData = allData.filter(f => {
        // Support wildcard matching for group filter
        if (group) {
            if (!matchesWildcard(f.group, group)) return false;
        }
        if (type && f.failure_type !== type) return false;
        if (name && !f.name.toLowerCase().includes(name)) return false;
        return true;
    });

    currentData.sort((a, b) => b.failure_count - a.failure_count);
    updateFiltersInUrl();
    updateStats();
    renderCurrentView();
}

// --- View Switching ---

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');
    renderCurrentView();
}

function renderCurrentView() {
    const tableView = document.getElementById('table-view');
    const bubblesView = document.getElementById('bubbles-view');

    if (currentView === 'table') {
        tableView.style.display = 'block';
        bubblesView.style.display = 'none';
        renderTable();
    } else {
        tableView.style.display = 'none';
        bubblesView.style.display = 'block';
        renderBubbles();
    }
}

// --- Stats ---

function updateStats() {
    const totalFailures = currentData.reduce((sum, f) => sum + f.failure_count, 0);
    const uniqueComponents = new Set(currentData.map(f => f.name)).size;

    document.getElementById('stat-total').textContent = totalFailures.toLocaleString();
    document.getElementById('stat-components').textContent = uniqueComponents.toLocaleString();
}

// --- Table View ---

function renderTable() {
    const tbody = document.getElementById('failures-tbody');
    const noResults = document.getElementById('no-results');

    const sorted = sortData([...currentData]);

    if (sorted.length === 0) {
        tbody.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';

    const maxCount = Math.max(...sorted.map(f => f.failure_count), 1);

    tbody.innerHTML = sorted.map(f => {
        const intensity = Math.min(f.failure_count / maxCount, 1);
        const bgColor = `rgba(244, 67, 54, ${0.1 + intensity * 0.4})`;
        const pipelineDisplay = renderPipelineLinks(f.jenkins_url, f.pipeline_url);
        const jiraDisplay = renderJiraLink(f.jira_ticket);

        return `<tr>
            <td><strong>${escapeHtml(f.name)}</strong></td>
            <td>${escapeHtml(f.group)}</td>
            <td><span class="failure-type-badge ${f.failure_type}">${formatFailureType(f.failure_type)}</span></td>
            <td class="failure-count-cell" style="background-color: ${bgColor}">${f.failure_count}</td>
            <td>${pipelineDisplay}</td>
            <td>${jiraDisplay}</td>
        </tr>`;
    }).join('');
}

function handleSort(field) {
    if (currentSort.field === field) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.field = field;
        currentSort.ascending = field !== 'failure_count';
    }

    document.querySelectorAll('#failures-table th.sortable').forEach(th => {
        th.classList.remove('sort-active', 'sort-desc', 'sort-asc');
        th.querySelector('.sort-arrow').textContent = '';
    });

    const activeHeader = document.querySelector(`th[data-sort="${field}"]`);
    activeHeader.classList.add('sort-active', currentSort.ascending ? 'sort-asc' : 'sort-desc');
    activeHeader.querySelector('.sort-arrow').textContent = currentSort.ascending ? '▲' : '▼';

    renderTable();
}

function sortData(data) {
    const { field, ascending } = currentSort;
    return data.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
    });
}

// --- Bubble View ---

function renderBubbles() {
    const container = document.getElementById('bubble-chart');
    container.innerHTML = '';

    const bubbleData = currentData.filter(f => f.failure_count >= 1);

    if (bubbleData.length === 0) {
        container.innerHTML = '<p class="no-results-message">No failures found.</p>';
        return;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Shrink the pack area when few items so bubbles don't fill the canvas
    const maxBubbleDiameter = Math.min(width, height) / 3;
    const minDimForCount = Math.min(bubbleData.length * maxBubbleDiameter, Math.min(width, height));
    const packSize = Math.max(minDimForCount, maxBubbleDiameter);

    const hierarchy = d3.hierarchy({ children: bubbleData })
        .sum(d => d.failure_count || 1);

    const pack = d3.pack()
        .size([packSize, packSize])
        .padding(4);

    const root = pack(hierarchy);

    // Offset to center the pack area within the full canvas
    const offsetX = (width - packSize) / 2;
    const offsetY = (height - packSize) / 2;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const tooltip = document.getElementById('bubble-tooltip');

    const nodes = svg.selectAll('g')
        .data(root.leaves())
        .enter()
        .append('g')
        .attr('transform', d => `translate(${d.x + offsetX},${d.y + offsetY})`);

    nodes.append('circle')
        .attr('r', d => d.r)
        .attr('fill', d => FAILURE_TYPE_COLORS[d.data.failure_type] || '#666')
        .attr('fill-opacity', 0.7)
        .attr('stroke', d => FAILURE_TYPE_COLORS[d.data.failure_type] || '#666')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseover', (event, d) => {
            d3.select(event.target)
                .attr('fill-opacity', 0.9)
                .attr('stroke-width', 2.5);

            tooltip.innerHTML = `
                <div class="tooltip-name">${escapeHtml(d.data.name)}</div>
                <div class="tooltip-detail">Group: ${escapeHtml(d.data.group)}</div>
                <div class="tooltip-detail">Type: ${formatFailureType(d.data.failure_type)}</div>
                <div class="tooltip-detail">Failures: <span class="tooltip-count">${d.data.failure_count}</span></div>
            `;
            tooltip.style.opacity = '1';
        })
        .on('mousemove', (event) => {
            tooltip.style.left = (event.clientX + 12) + 'px';
            tooltip.style.top = (event.clientY - 10) + 'px';
        })
        .on('mouseout', (event) => {
            d3.select(event.target)
                .attr('fill-opacity', 0.7)
                .attr('stroke-width', 1.5);
            tooltip.style.opacity = '0';
        })
        .on('click', (event, d) => {
            window.open(buildHistoryUrl(d.data.name, d.data.group), '_blank');
        });

    // Labels inside bubbles (only for bubbles large enough)
    nodes.filter(d => d.r > 20)
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.2em')
        .attr('fill', '#fff')
        .attr('font-size', d => Math.min(d.r / 3, 14) + 'px')
        .attr('pointer-events', 'none')
        .text(d => truncateText(d.data.name, d.r));

    nodes.filter(d => d.r > 25)
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.2em')
        .attr('fill', '#ddd')
        .attr('font-size', d => Math.min(d.r / 4, 11) + 'px')
        .attr('pointer-events', 'none')
        .text(d => d.data.failure_count);

    // Legend
    const legendData = Object.entries(FAILURE_TYPE_COLORS);
    const legend = svg.append('g')
        .attr('transform', `translate(20, ${height - legendData.length * 22 - 10})`);

    legend.selectAll('g')
        .data(legendData)
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(0, ${i * 22})`)
        .each(function([type, color]) {
            const g = d3.select(this);
            g.append('circle')
                .attr('r', 6)
                .attr('cx', 6)
                .attr('cy', 6)
                .attr('fill', color)
                .attr('fill-opacity', 0.7);
            g.append('text')
                .attr('x', 18)
                .attr('y', 10)
                .attr('fill', '#aaa')
                .attr('font-size', '12px')
                .text(formatFailureType(type));
        });
}

// --- Download JSON ---

function downloadJSON() {
    const filename = `failures-${new Date().toISOString().slice(0, 10)}.json`;
    const json = JSON.stringify(currentData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- URL Parameter Handling ---

function loadFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);

    const group = params.get('group');
    const type = params.get('type');
    const name = params.get('name');

    if (group) {
        document.getElementById('group-filter').value = group;
    }
    if (type) {
        document.getElementById('type-filter').value = type;
    }
    if (name) {
        document.getElementById('name-filter').value = name;
    }
}

function updateFiltersInUrl() {
    const group = document.getElementById('group-filter').value;
    const type = document.getElementById('type-filter').value;
    const name = document.getElementById('name-filter').value;

    const params = new URLSearchParams();

    if (group) {
        params.set('group', group);
    }
    if (type) {
        params.set('type', type);
    }
    if (name) {
        params.set('name', name);
    }

    const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
}

// --- Utilities ---

const BUILD_HISTORY_BASE = 'https://art-build-history-art-build-history.apps.artc2023.pc3z.p1.openshiftapps.com';
const JIRA_BASE = 'https://redhat.atlassian.net/browse';

function renderPipelineLinks(jenkinsUrl, pipelineUrl) {
    const links = [];

    if (jenkinsUrl) {
        links.push(`<a href="${escapeHtml(jenkinsUrl)}" target="_blank" class="pipeline-link jenkins-link" title="Jenkins Pipeline">
            <img src="/static/images/jenkins-icon.png" alt="Jenkins" class="pipeline-icon">
        </a>`);
    }

    if (pipelineUrl) {
        links.push(`<a href="${escapeHtml(pipelineUrl)}" target="_blank" class="pipeline-link konflux-link" title="Konflux Pipeline">
            <img src="/static/images/konflux-icon.png" alt="Konflux" class="pipeline-icon">
        </a>`);
    }

    return links.length > 0 ? links.join(' ') : '-';
}

function renderJiraLink(jiraTicket) {
    if (!jiraTicket) {
        return '-';
    }
    const jiraUrl = `${JIRA_BASE}/${escapeHtml(jiraTicket)}`;
    return `<a href="${jiraUrl}" target="_blank" class="jira-link" title="View Jira ticket">${escapeHtml(jiraTicket)}</a>`;
}

function buildHistoryUrl(name, group) {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const fmt = d => d.toISOString().slice(0, 10);
    const dateRange = `${fmt(weekAgo)} to ${fmt(today)}`;
    const params = new URLSearchParams();
    params.set('name', name);
    params.set('group', group);
    params.set('assembly', 'stream');
    params.set('dateRange', dateRange);
    params.append('outcome', 'Failure');
    return `${BUILD_HISTORY_BASE}/?${params}`;
}

function formatFailureType(type) {
    // Map ec-failure to ITS for display (database still uses ec-failure)
    if (type === 'ec-failure') {
        return 'ITS Failure';
    }
    return type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function truncateText(text, radius) {
    const maxChars = Math.floor(radius / 4);
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars - 1) + '…';
}

/**
 * Matches a value against a pattern with wildcard support.
 * Supports * as a wildcard character.
 */
function matchesWildcard(value, pattern) {
    if (!pattern) return true;
    if (!value) return false;

    // Escape special regex characters except *
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    // Replace * with .*
    const regexPattern = '^' + escaped.replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexPattern, 'i'); // case-insensitive
    return regex.test(value);
}

/**
 * Setup autocomplete for group filter input.
 */
function setupGroupAutocomplete(input, dropdown) {
    function filterGroups(query) {
        if (!query) return allGroups;

        const lowercaseQuery = query.toLowerCase();

        // If query contains wildcard, show matching groups
        if (query.includes('*')) {
            return allGroups.filter(group => matchesWildcard(group, query));
        }

        // Otherwise, show groups that contain the query
        return allGroups.filter(group =>
            group.toLowerCase().includes(lowercaseQuery)
        );
    }

    function showDropdown(groups) {
        dropdown.innerHTML = '';
        highlightedIndex = -1;

        if (groups.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        groups.forEach((group, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = group;
            item.dataset.index = index;

            item.addEventListener('click', () => {
                input.value = group;
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
        if (index >= 0 && index < items.length) {
            items[index].scrollIntoView({ block: 'nearest' });
        }
    }

    input.addEventListener('input', () => {
        const query = input.value;
        const filtered = filterGroups(query);
        showDropdown(filtered);
    });

    input.addEventListener('focus', () => {
        const query = input.value;
        const filtered = filterGroups(query);
        showDropdown(filtered);
    });

    input.addEventListener('keydown', (e) => {
        const items = dropdown.querySelectorAll('.autocomplete-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
            highlightItem(highlightedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex = Math.max(highlightedIndex - 1, -1);
            highlightItem(highlightedIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < items.length) {
                items[highlightedIndex].click();
            } else {
                // Apply filter with current input value
                applyFilters();
            }
        } else if (e.key === 'Escape') {
            hideDropdown();
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            hideDropdown();
        }
    });
}
