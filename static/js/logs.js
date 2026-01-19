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

// Download logs as plain text
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('downloadLogsBtn')?.addEventListener('click', function() {
        const url = new URL(window.location.href);
        url.searchParams.set('format', 'json');

        fetch(url)
            .then(response => response.json())
            .then(data => {
                // Format data as plain text
                let textContent = 'BUILD LOGS\n';
                textContent += '='.repeat(80) + '\n\n';

                // Build Identity section
                if (data.build_identity) {
                    textContent += 'BUILD IDENTITY\n';
                    textContent += '-'.repeat(80) + '\n';
                    if (data.build_identity.nvr) {
                        textContent += `NVR: ${data.build_identity.nvr}\n`;
                    }
                    if (data.build_identity.name) {
                        textContent += `Name: ${data.build_identity.name}\n`;
                    }
                    if (data.build_identity.version) {
                        textContent += `Version: ${data.build_identity.version}\n`;
                    }
                    if (data.build_identity.release) {
                        textContent += `Release: ${data.build_identity.release}\n`;
                    }
                    if (data.build_identity.el_target) {
                        textContent += `EL Target: ${data.build_identity.el_target}\n`;
                    }
                    if (data.build_identity.group) {
                        textContent += `Group: ${data.build_identity.group}\n`;
                    }
                    if (data.build_identity.assembly) {
                        textContent += `Assembly: ${data.build_identity.assembly}\n`;
                    }
                    if (data.build_identity.component) {
                        textContent += `Component: ${data.build_identity.component}\n`;
                    }
                    textContent += '\n';
                }

                // Container logs section
                if (data.containers && data.containers.length > 0) {
                    textContent += 'CONTAINER LOGS\n';
                    textContent += '-'.repeat(80) + '\n\n';

                    data.containers.forEach((container, index) => {
                        textContent += `Container: ${container.name}\n`;
                        textContent += `Exit Code: ${container.exit_code}\n`;
                        textContent += '-'.repeat(80) + '\n';
                        if (container.log_output) {
                            textContent += container.log_output + '\n';
                        } else {
                            textContent += 'No log output available for this container.\n';
                        }
                        textContent += '\n';
                        if (index < data.containers.length - 1) {
                            textContent += '\n';
                        }
                    });
                } else {
                    textContent += 'No container logs available.\n';
                }

                // Create and download the file
                const blob = new Blob([textContent], {type: 'text/plain'});
                const downloadUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `logs-${data.nvr || 'build'}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);
            })
            .catch(error => {
                console.error('Download failed:', error);
                alert('Failed to download logs');
            });
    });
});
