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
};
