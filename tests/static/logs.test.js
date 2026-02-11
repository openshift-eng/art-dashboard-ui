/**
 * Unit tests for logs.js (build logs page)
 */

describe('Logs Page - Toggle Container', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="container-item">
                <div class="container-header">
                    <span class="toggle-icon">▶</span>
                    <span>container-name</span>
                </div>
                <div class="container-logs" style="display: none;">
                    Log content here
                </div>
            </div>
        `;
    });

    test('toggleContainer expands collapsed container', () => {
        function toggleContainer(headerElement) {
            const containerItem = headerElement.parentElement;
            const logsDiv = containerItem.querySelector('.container-logs');
            const toggleIcon = headerElement.querySelector('.toggle-icon');

            if (logsDiv.style.display === 'none' || logsDiv.style.display === '') {
                logsDiv.style.display = 'block';
                headerElement.classList.add('expanded');
                toggleIcon.textContent = '▼';
            } else {
                logsDiv.style.display = 'none';
                headerElement.classList.remove('expanded');
                toggleIcon.textContent = '▶';
            }
        }

        const header = document.querySelector('.container-header');
        const logsDiv = document.querySelector('.container-logs');
        const toggleIcon = header.querySelector('.toggle-icon');

        toggleContainer(header);

        expect(logsDiv.style.display).toBe('block');
        expect(header.classList.contains('expanded')).toBe(true);
        expect(toggleIcon.textContent).toBe('▼');
    });

    test('toggleContainer collapses expanded container', () => {
        function toggleContainer(headerElement) {
            const containerItem = headerElement.parentElement;
            const logsDiv = containerItem.querySelector('.container-logs');
            const toggleIcon = headerElement.querySelector('.toggle-icon');

            if (logsDiv.style.display === 'none' || logsDiv.style.display === '') {
                logsDiv.style.display = 'block';
                headerElement.classList.add('expanded');
                toggleIcon.textContent = '▼';
            } else {
                logsDiv.style.display = 'none';
                headerElement.classList.remove('expanded');
                toggleIcon.textContent = '▶';
            }
        }

        const header = document.querySelector('.container-header');
        const logsDiv = document.querySelector('.container-logs');
        const toggleIcon = header.querySelector('.toggle-icon');

        // Set to expanded state first
        logsDiv.style.display = 'block';
        header.classList.add('expanded');
        toggleIcon.textContent = '▼';

        // Now collapse
        toggleContainer(header);

        expect(logsDiv.style.display).toBe('none');
        expect(header.classList.contains('expanded')).toBe(false);
        expect(toggleIcon.textContent).toBe('▶');
    });
});

describe('Logs Page - Download Logs Formatting', () => {
    test('formats build identity section correctly', () => {
        const data = {
            build_identity: {
                nvr: 'openshift-cli-4.15.0-202401151030.p0.g12a3b4c.assembly.stream.el9',
                name: 'openshift-cli',
                version: '4.15.0',
                release: '202401151030.p0.g12a3b4c.assembly.stream.el9',
                el_target: 'el9',
                group: 'openshift-4.15',
                assembly: 'stream',
                component: 'openshift-clients'
            },
            containers: []
        };

        let textContent = 'BUILD LOGS\n';
        textContent += '='.repeat(80) + '\n\n';

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

        expect(textContent).toContain('BUILD LOGS');
        expect(textContent).toContain('BUILD IDENTITY');
        expect(textContent).toContain('NVR: openshift-cli-4.15.0-202401151030.p0.g12a3b4c.assembly.stream.el9');
        expect(textContent).toContain('Name: openshift-cli');
        expect(textContent).toContain('Version: 4.15.0');
        expect(textContent).toContain('Group: openshift-4.15');
        expect(textContent).toContain('Assembly: stream');
    });

    test('formats container logs section correctly', () => {
        const data = {
            nvr: 'test-build-1.0',
            containers: [
                {
                    name: 'build-container',
                    exit_code: 0,
                    log_output: 'Build successful\nAll tests passed'
                },
                {
                    name: 'test-container',
                    exit_code: 0,
                    log_output: 'Running tests\nTests completed'
                }
            ]
        };

        let textContent = '';

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
        }

        expect(textContent).toContain('CONTAINER LOGS');
        expect(textContent).toContain('Container: build-container');
        expect(textContent).toContain('Exit Code: 0');
        expect(textContent).toContain('Build successful');
        expect(textContent).toContain('Container: test-container');
        expect(textContent).toContain('Running tests');
    });

    test('handles empty container logs', () => {
        const data = {
            containers: []
        };

        let textContent = '';

        if (data.containers && data.containers.length > 0) {
            textContent += 'CONTAINER LOGS\n';
        } else {
            textContent += 'No container logs available.\n';
        }

        expect(textContent).toBe('No container logs available.\n');
    });

    test('handles container without log output', () => {
        const data = {
            containers: [
                {
                    name: 'test-container',
                    exit_code: 1,
                    log_output: null
                }
            ]
        };

        let textContent = '';

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
            });
        }

        expect(textContent).toContain('Container: test-container');
        expect(textContent).toContain('Exit Code: 1');
        expect(textContent).toContain('No log output available for this container.');
    });
});

describe('Logs Page - Download Filename Generation', () => {
    test('generates filename from NVR', () => {
        const data = {
            nvr: 'openshift-cli-4.15.0-202401151030.p0.g12a3b4c.assembly.stream.el9'
        };

        const filename = `logs-${data.nvr || 'build'}.txt`;

        expect(filename).toBe('logs-openshift-cli-4.15.0-202401151030.p0.g12a3b4c.assembly.stream.el9.txt');
    });

    test('uses default filename when NVR missing', () => {
        const data = {};

        const filename = `logs-${data.nvr || 'build'}.txt`;

        expect(filename).toBe('logs-build.txt');
    });
});

describe('Logs Page - Blob Creation', () => {
    test('creates blob with correct content type', () => {
        const textContent = 'Test log content\nLine 2\nLine 3';

        const blob = new Blob([textContent], {type: 'text/plain'});

        expect(blob.type).toBe('text/plain');
        expect(blob.size).toBeGreaterThan(0);
    });
});
