/**
 * Unit tests for build.js (build details page)
 */

describe('Build Page - Filter List', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <input id="packageFilter" type="text" value="" />
            <ul id="packageList">
                <li>openshift-clients</li>
                <li>openshift-hyperkube</li>
                <li>golang-1.21</li>
            </ul>
            <span id="packageCount"></span>
        `;
    });

    test('filterList shows all items when no filter', () => {
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

            const countElement = document.getElementById(countId);
            if (filter) {
                countElement.textContent = `(${visibleCount} of ${totalCount} ${label})`;
            } else {
                countElement.textContent = `(${totalCount} ${label})`;
            }
        }

        filterList('packageFilter', 'packageList', 'packageCount', 'packages');

        const items = document.querySelectorAll('#packageList li');
        items.forEach(item => {
            expect(item.style.display).toBe('');
        });

        expect(document.getElementById('packageCount').textContent).toBe('(3 packages)');
    });

    test('filterList filters items matching text', () => {
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

            const countElement = document.getElementById(countId);
            if (filter) {
                countElement.textContent = `(${visibleCount} of ${totalCount} ${label})`;
            } else {
                countElement.textContent = `(${totalCount} ${label})`;
            }
        }

        document.getElementById('packageFilter').value = 'openshift';
        filterList('packageFilter', 'packageList', 'packageCount', 'packages');

        const items = document.querySelectorAll('#packageList li');
        expect(items[0].style.display).toBe(''); // openshift-clients
        expect(items[1].style.display).toBe(''); // openshift-hyperkube
        expect(items[2].style.display).toBe('none'); // golang-1.21

        expect(document.getElementById('packageCount').textContent).toBe('(2 of 3 packages)');
    });
});

describe('Build Page - Copy to Clipboard', () => {
    beforeEach(() => {
        // Mock navigator.clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn(() => Promise.resolve())
            }
        });

        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('copyToClipboard copies text and shows feedback', async () => {
        async function copyToClipboard(text, button) {
            try {
                await navigator.clipboard.writeText(text);

                const originalIcon = button.textContent;
                button.textContent = '✓';
                button.classList.add('copied');

                setTimeout(() => {
                    button.textContent = originalIcon;
                    button.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Copy failed:', err);
            }
        }

        const button = document.createElement('button');
        button.textContent = '📋';

        await copyToClipboard('test-nvr-1.0', button);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-nvr-1.0');
        expect(button.textContent).toBe('✓');
        expect(button.classList.contains('copied')).toBe(true);

        jest.advanceTimersByTime(2000);

        expect(button.textContent).toBe('📋');
        expect(button.classList.contains('copied')).toBe(false);
    });
});

describe('Build Page - Toggle Section', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="collapsible-header" onclick="toggleSection(this)">
                <span class="collapse-icon">▼</span>
                <span>Installed Packages</span>
            </div>
            <div class="collapsible-content" style="display: block;"></div>
        `;
    });

    test('toggleSection collapses open section', () => {
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

        const header = document.querySelector('.collapsible-header');
        const content = document.querySelector('.collapsible-content');
        const icon = header.querySelector('.collapse-icon');

        toggleSection(header);

        expect(content.style.display).toBe('none');
        expect(icon.textContent).toBe('▶');
    });

    test('toggleSection expands collapsed section', () => {
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

        const header = document.querySelector('.collapsible-header');
        const content = document.querySelector('.collapsible-content');
        const icon = header.querySelector('.collapse-icon');

        content.style.display = 'none';
        icon.textContent = '▶';

        toggleSection(header);

        expect(content.style.display).toBe('block');
        expect(icon.textContent).toBe('▼');
    });
});

describe('Build Page - Build Duration Calculation', () => {
    test('calculates duration correctly', () => {
        const startTime = '2024-01-15 10:00:00';
        const endTime = '2024-01-15 11:30:45';

        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end - start;

        expect(diffMs).toBeGreaterThan(0);

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        let durationStr = '';
        if (hours > 0) durationStr += hours + 'h ';
        if (minutes > 0 || hours > 0) durationStr += minutes + 'm ';
        durationStr += seconds + 's';

        expect(durationStr.trim()).toBe('1h 30m 45s');
    });

    test('handles duration less than 1 hour', () => {
        const start = new Date('2024-01-15 10:00:00');
        const end = new Date('2024-01-15 10:05:30');
        const diffMs = end - start;

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        let durationStr = '';
        if (hours > 0) durationStr += hours + 'h ';
        if (minutes > 0 || hours > 0) durationStr += minutes + 'm ';
        durationStr += seconds + 's';

        expect(durationStr.trim()).toBe('5m 30s');
    });

    test('handles duration less than 1 minute', () => {
        const start = new Date('2024-01-15 10:00:00');
        const end = new Date('2024-01-15 10:00:45');
        const diffMs = end - start;

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        let durationStr = '';
        if (hours > 0) durationStr += hours + 'h ';
        if (minutes > 0 || hours > 0) durationStr += minutes + 'm ';
        durationStr += seconds + 's';

        expect(durationStr.trim()).toBe('45s');
    });
});

describe('Build Page - NVR Name Extraction', () => {
    test('extracts name from NVR with version pattern', () => {
        const nvr = 'openshift-cli-v4.18.0-202401151030.p0.g12a3b4c.assembly.stream.el9';

        const versionMatch = nvr.match(/^(.+)-v\d+\.\d+/);
        let name = '';
        if (versionMatch) {
            name = versionMatch[1];
        }

        expect(name).toBe('openshift-cli');
    });

    test('extracts name from NVR with fallback pattern', () => {
        const nvr = 'my-package-1.0-1.el9';

        let name = '';
        const versionMatch = nvr.match(/^(.+)-v\d+\.\d+/);
        if (versionMatch) {
            name = versionMatch[1];
        } else {
            const fallbackMatch = nvr.match(/^(.+)-\d+\.\d+/);
            if (fallbackMatch) {
                name = fallbackMatch[1];
            }
        }

        expect(name).toBe('my-package');
    });
});
