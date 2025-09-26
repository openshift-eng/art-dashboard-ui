// Toggle container logs visibility
function toggleContainer(headerElement) {
    const containerItem = headerElement.parentElement;
    const logsDiv = containerItem.querySelector('.container-logs');
    const toggleIcon = headerElement.querySelector('.toggle-icon');

    if (logsDiv.style.display === 'none' || logsDiv.style.display === '') {
        // Expand the container
        logsDiv.style.display = 'block';
        headerElement.classList.add('expanded');
        toggleIcon.textContent = '▼';
    } else {
        // Collapse the container
        logsDiv.style.display = 'none';
        headerElement.classList.remove('expanded');
        toggleIcon.textContent = '▶';
    }
}
