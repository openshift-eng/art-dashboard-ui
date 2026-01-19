// Filter list functionality for packages and RPMs
function filterList(inputId, listId, countId, label) {
    const filter = document.getElementById(inputId).value.toLowerCase();
    const list = document.getElementById(listId);
    const items = list.querySelectorAll('li');
    let visibleCount = 0;
    let totalCount = items.length;

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(filter)) {
            item.style.display = '';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });

    // Update the count display
    const countElement = document.getElementById(countId);
    if (filter) {
        countElement.textContent = `(${visibleCount} of ${totalCount} ${label})`;
    } else {
        countElement.textContent = `(${totalCount} ${label})`;
    }
}

// Copy to clipboard functionality for build details page
async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);

        // Visual feedback
        const originalIcon = button.textContent;
        button.textContent = '✓';
        button.classList.add('copied');

        // Reset after 2 seconds
        setTimeout(() => {
            button.textContent = originalIcon;
            button.classList.remove('copied');
        }, 2000);

    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');

            // Visual feedback
            const originalIcon = button.textContent;
            button.textContent = '✓';
            button.classList.add('copied');

            setTimeout(() => {
                button.textContent = originalIcon;
                button.classList.remove('copied');
            }, 2000);

        } catch (fallbackErr) {
            console.error('Copy failed:', fallbackErr);
            button.textContent = '✗';
            setTimeout(() => {
                button.textContent = '📋';
            }, 2000);
        }

        document.body.removeChild(textArea);
    }
}

// Toggle collapsible sections
function toggleSection(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.collapse-icon');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▼';
    } else {
        content.style.display = 'none';
        icon.textContent = '▶';
    }
}

// Initialize build page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Download JSON functionality
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const url = new URL(window.location.href);
            url.searchParams.set('format', 'json');

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = `${data.nvr || 'build'}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(downloadUrl);
                })
                .catch(err => console.error('Download failed:', err));
        });
    }

    // Calculate and display build duration
    const durationEl = document.getElementById('build-duration');
    if (durationEl) {
        const startTime = durationEl.dataset.startTime;
        const endTime = durationEl.dataset.endTime;

        if (startTime && endTime) {
            try {
                const start = new Date(startTime);
                const end = new Date(endTime);
                const diffMs = end - start;

                if (diffMs >= 0) {
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

                    let durationStr = '';
                    if (hours > 0) durationStr += hours + 'h ';
                    if (minutes > 0 || hours > 0) durationStr += minutes + 'm ';
                    durationStr += seconds + 's';

                    durationEl.textContent = durationStr.trim();
                } else {
                    durationEl.textContent = 'N/A';
                }
            } catch (e) {
                durationEl.textContent = 'N/A';
            }
        } else {
            durationEl.textContent = 'N/A';
        }
    }

    // Set up parent image search links (for NVR entries only)
    document.querySelectorAll('a.parent-search-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const nvr = this.dataset.nvr;

            // Extract name from NVR (everything before -v<version>-<release>)
            // NVR format: <name>-<version>-<release>
            // Version typically starts with 'v' followed by digits (e.g., v4.18.0)
            let name = '';
            const versionMatch = nvr.match(/^(.+)-v\d+\.\d+/);
            if (versionMatch) {
                name = versionMatch[1];
            } else {
                // Fallback: try to find pattern like -<digits>.<digits>
                const fallbackMatch = nvr.match(/^(.+)-\d+\.\d+/);
                if (fallbackMatch) {
                    name = fallbackMatch[1];
                }
            }

            // Build search URL with name (for clustering efficiency) and NVR
            // The NVR contains an embedded datetime which the backend will extract
            // to derive the appropriate date range
            const searchUrl = new URL('/', window.location.origin);
            if (name) {
                searchUrl.searchParams.set('name', name);
            }
            searchUrl.searchParams.set('nvr', nvr);
            searchUrl.searchParams.set('assembly', '*');

            // Open in new tab
            window.open(searchUrl.toString(), '_blank');
        });
    });
});
