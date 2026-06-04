// ART Build Failures Dashboard

const FAILURE_TYPE_COLORS = {
    'build-failure': '#f44336',
    'ec-failure': '#ff9800',
    'release-failure': '#9c27b0',
    'rebase-failure': '#2196f3',
};

let allData = [];
let currentData = [];
let currentSort = { field: 'failure_count', ascending: false };
let currentView = 'table';

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    loadFilters();
    refreshData();

    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    document.getElementById('refresh-data').addEventListener('click', refreshData);
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
});

// --- Data Loading ---

async function loadFilters() {
    try {
        const [groups, types] = await Promise.all([
            fetch('/api/groups').then(r => r.json()),
            fetch('/api/failure-types').then(r => r.json()),
        ]);

        const groupSelect = document.getElementById('group-filter');
        groups.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g;
            opt.textContent = g;
            groupSelect.appendChild(opt);
        });

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
        const response = await fetch('/api/failures');
        allData = await response.json();
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
    const group = document.getElementById('group-filter').value;
    const type = document.getElementById('type-filter').value;
    const name = document.getElementById('name-filter').value.toLowerCase();

    currentData = allData.filter(f => {
        if (group && f.group !== group) return false;
        if (type && f.failure_type !== type) return false;
        if (name && !f.name.toLowerCase().includes(name)) return false;
        return true;
    });

    currentData.sort((a, b) => b.failure_count - a.failure_count);
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

    const bubbleData = currentData.filter(f => f.failure_count > 1);

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
    params.append('outcome', 'Success');
    params.append('outcome', 'Failure');
    return `${BUILD_HISTORY_BASE}/?${params}`;
}

function formatFailureType(type) {
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
