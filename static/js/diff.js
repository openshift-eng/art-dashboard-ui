// diff.js - JavaScript for package diff page

document.addEventListener('DOMContentLoaded', function() {
    // Download JSON button
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            // Get current URL and add format=json
            const url = new URL(window.location.href);
            url.searchParams.set('format', 'json');
            window.open(url.toString(), '_blank');
        });
    }
});

// Toggle collapsible sections
function toggleSection(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.collapse-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        if (icon) icon.classList.add('expanded');
    } else {
        content.style.display = 'none';
        if (icon) icon.classList.remove('expanded');
    }
}

// Copy to clipboard function
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(function() {
        const originalText = button.textContent;
        button.textContent = '✓';
        setTimeout(function() {
            button.textContent = originalText;
        }, 1500);
    }).catch(function(err) {
        console.error('Failed to copy:', err);
    });
}

// Filter replaced packages table
function filterReplacedPackages() {
    const filter = document.getElementById('replaced-filter').value.toLowerCase();
    const table = document.getElementById('replaced-table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    let visibleCount = 0;
    const totalCount = rows.length;
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(filter)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    const countElement = document.getElementById('replaced-count');
    if (countElement) {
        if (filter) {
            countElement.textContent = `(${visibleCount} of ${totalCount} packages)`;
        } else {
            countElement.textContent = `(${totalCount} packages)`;
        }
    }
}

// Filter shared packages list
function filterSharedPackages() {
    const filter = document.getElementById('shared-filter').value.toLowerCase();
    const list = document.getElementById('shared-list');
    if (!list) return;
    
    const items = list.querySelectorAll('li');
    let visibleCount = 0;
    const totalCount = items.length;
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(filter)) {
            item.style.display = '';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    const countElement = document.getElementById('shared-count');
    if (countElement) {
        if (filter) {
            countElement.textContent = `(${visibleCount} of ${totalCount} packages)`;
        } else {
            countElement.textContent = `(${totalCount} packages)`;
        }
    }
}
