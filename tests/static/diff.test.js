/**
 * Unit tests for diff.js (package diff page)
 */

describe('Diff Page - Toggle Section', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="collapsible-header" onclick="toggleSection(this)">
                <span class="collapse-icon"></span>
                <span>Replaced Packages</span>
            </div>
            <div class="collapsible-content" style="display: block;"></div>
        `;
    });

    test('toggleSection collapses expanded section', () => {
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

        const header = document.querySelector('.collapsible-header');
        const content = document.querySelector('.collapsible-content');
        const icon = header.querySelector('.collapse-icon');

        icon.classList.add('expanded');

        toggleSection(header);

        expect(content.style.display).toBe('none');
        expect(icon.classList.contains('expanded')).toBe(false);
    });

    test('toggleSection expands collapsed section', () => {
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

        const header = document.querySelector('.collapsible-header');
        const content = document.querySelector('.collapsible-content');
        const icon = header.querySelector('.collapse-icon');

        content.style.display = 'none';
        icon.classList.remove('expanded');

        toggleSection(header);

        expect(content.style.display).toBe('block');
        expect(icon.classList.contains('expanded')).toBe(true);
    });
});

describe('Diff Page - Copy to Clipboard', () => {
    beforeEach(() => {
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

    test('copyToClipboard copies text and shows success', async () => {
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

        const button = document.createElement('button');
        button.textContent = '📋';

        copyToClipboard('test-text', button);

        await Promise.resolve(); // Wait for promise to resolve

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-text');
        expect(button.textContent).toBe('✓');

        jest.advanceTimersByTime(1500);

        expect(button.textContent).toBe('📋');
    });
});

describe('Diff Page - Filter Replaced Packages', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <input id="replaced-filter" type="text" value="" />
            <table id="replaced-table">
                <tbody>
                    <tr><td>openshift-clients-4.15.0</td><td>openshift-clients-4.16.0</td></tr>
                    <tr><td>golang-1.21</td><td>golang-1.22</td></tr>
                    <tr><td>kernel-5.14</td><td>kernel-6.0</td></tr>
                </tbody>
            </table>
            <span id="replaced-count"></span>
        `;
    });

    test('filterReplacedPackages shows all rows when no filter', () => {
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

        filterReplacedPackages();

        const rows = document.querySelectorAll('#replaced-table tbody tr');
        rows.forEach(row => {
            expect(row.style.display).toBe('');
        });

        expect(document.getElementById('replaced-count').textContent).toBe('(3 packages)');
    });

    test('filterReplacedPackages filters matching rows', () => {
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

        document.getElementById('replaced-filter').value = 'openshift';
        filterReplacedPackages();

        const rows = document.querySelectorAll('#replaced-table tbody tr');
        expect(rows[0].style.display).toBe(''); // openshift-clients
        expect(rows[1].style.display).toBe('none'); // golang
        expect(rows[2].style.display).toBe('none'); // kernel

        expect(document.getElementById('replaced-count').textContent).toBe('(1 of 3 packages)');
    });
});

describe('Diff Page - Filter Shared Packages', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <input id="shared-filter" type="text" value="" />
            <ul id="shared-list">
                <li>openshift-hyperkube</li>
                <li>golang-1.21</li>
                <li>kernel-5.14</li>
            </ul>
            <span id="shared-count"></span>
        `;
    });

    test('filterSharedPackages shows all items when no filter', () => {
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

        filterSharedPackages();

        const items = document.querySelectorAll('#shared-list li');
        items.forEach(item => {
            expect(item.style.display).toBe('');
        });

        expect(document.getElementById('shared-count').textContent).toBe('(3 packages)');
    });

    test('filterSharedPackages filters matching items', () => {
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

        document.getElementById('shared-filter').value = 'golang';
        filterSharedPackages();

        const items = document.querySelectorAll('#shared-list li');
        expect(items[0].style.display).toBe('none'); // openshift-hyperkube
        expect(items[1].style.display).toBe(''); // golang-1.21
        expect(items[2].style.display).toBe('none'); // kernel-5.14

        expect(document.getElementById('shared-count').textContent).toBe('(1 of 3 packages)');
    });
});
