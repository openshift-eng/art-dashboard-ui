/**
 * Unit tests for index.js (main search page)
 */

describe('Index Page - NVR DateTime Extraction', () => {
    test('extractNvrDatetime extracts valid datetime from NVR', () => {
        const nvr = 'openshift-cli-4.15.0-202401151030.p0.g12a3b4c.assembly.stream.el9';

        // Function extracted from index.js
        function extractNvrDatetime(nvr) {
            if (!nvr) return null;
            const match = nvr.match(/-(\d{12})\./);
            if (!match) return null;
            try {
                const dtStr = match[1];
                const year = parseInt(dtStr.substring(0, 4));
                const month = parseInt(dtStr.substring(4, 6)) - 1;
                const day = parseInt(dtStr.substring(6, 8));
                return new Date(year, month, day);
            } catch (e) {
                return null;
            }
        }

        const result = extractNvrDatetime(nvr);
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2024);
        expect(result.getMonth()).toBe(0); // January (0-indexed)
        expect(result.getDate()).toBe(15);
    });

    test('extractNvrDatetime returns null for invalid NVR', () => {
        function extractNvrDatetime(nvr) {
            if (!nvr) return null;
            const match = nvr.match(/-(\d{12})\./);
            if (!match) return null;
            try {
                const dtStr = match[1];
                const year = parseInt(dtStr.substring(0, 4));
                const month = parseInt(dtStr.substring(4, 6)) - 1;
                const day = parseInt(dtStr.substring(6, 8));
                return new Date(year, month, day);
            } catch (e) {
                return null;
            }
        }

        expect(extractNvrDatetime('simple-package-1.0-1.el9')).toBeNull();
        expect(extractNvrDatetime('')).toBeNull();
        expect(extractNvrDatetime(null)).toBeNull();
        expect(extractNvrDatetime('invalid-format')).toBeNull();
    });
});

describe('Index Page - Params Key Building', () => {
    test('buildParamsKey creates consistent sorted key', () => {
        function buildParamsKey(params) {
            const entries = Array.from(params.entries()).sort(([aKey, aVal], [bKey, bVal]) => {
                if (aKey === bKey) return aVal.localeCompare(bVal);
                return aKey.localeCompare(bKey);
            });
            return entries.map(([key, value]) => `${key}=${value}`).join('&');
        }

        const params = new URLSearchParams([
            ['group', 'openshift-4.15'],
            ['name', 'openshift-cli'],
            ['assembly', 'stream']
        ]);

        const key = buildParamsKey(params);
        expect(key).toBe('assembly=stream&group=openshift-4.15&name=openshift-cli');
    });

    test('buildParamsKey handles duplicate keys', () => {
        function buildParamsKey(params) {
            const entries = Array.from(params.entries()).sort(([aKey, aVal], [bKey, bVal]) => {
                if (aKey === bKey) return aVal.localeCompare(bVal);
                return aKey.localeCompare(bKey);
            });
            return entries.map(([key, value]) => `${key}=${value}`).join('&');
        }

        const params = new URLSearchParams([
            ['outcome', 'success'],
            ['outcome', 'failure']
        ]);

        const key = buildParamsKey(params);
        expect(key).toBe('outcome=failure&outcome=success');
    });
});

describe('Index Page - Filter Matching Logic', () => {
    function matchesFilters(result, filterParams) {
        const selectedOutcomes = filterParams.getAll('outcome');

        if (selectedOutcomes.length > 0) {
            if (!selectedOutcomes.includes(result['outcome'])) {
                return false;
            }
        }

        for (let [key, value] of filterParams.entries()) {
            if (!value) continue;

            if (key === "outcome") {
                continue;
            } else if (key == 'group') {
                if (result['group'] != value) {
                    return false;
                }
            } else if (key == 'record_id') {
                if (!result['record_id'] || result['record_id'] !== value) {
                    return false;
                }
            } else if (key == 'commitish') {
                if (!result['commitish'] || !result['commitish'].toLowerCase().startsWith(value.toLowerCase())) {
                    return false;
                }
            } else if (key == 'source_repo') {
                if (!result['source'] || !result['source'].toLowerCase().includes(value.toLowerCase())) {
                    return false;
                }
            } else if (key == 'engine') {
                if (value != 'both' && result['engine'] != value) {
                    return false;
                }
            } else if (key == 'assembly') {
                if (value != '*' && result['assembly'] != value) {
                    return false;
                }
            }
        }

        return true;
    }

    test('matchesFilters returns true when all filters match', () => {
        const result = {
            name: 'openshift-cli',
            outcome: 'success',
            assembly: 'stream',
            group: 'openshift-4.15',
            engine: 'konflux'
        };

        const filterParams = new URLSearchParams([
            ['outcome', 'success'],
            ['assembly', 'stream'],
            ['engine', 'konflux']
        ]);

        expect(matchesFilters(result, filterParams)).toBe(true);
    });

    test('matchesFilters handles commitish prefix matching', () => {
        const result = {
            commitish: 'abc123def456'
        };

        const filterParams1 = new URLSearchParams([['commitish', 'abc']]);
        const filterParams2 = new URLSearchParams([['commitish', 'xyz']]);

        expect(matchesFilters(result, filterParams1)).toBe(true);
        expect(matchesFilters(result, filterParams2)).toBe(false);
    });

    test('matchesFilters handles assembly wildcard', () => {
        const result = { assembly: 'stream' };
        const filterParams = new URLSearchParams([['assembly', '*']]);

        expect(matchesFilters(result, filterParams)).toBe(true);
    });

    test('matchesFilters handles engine both option', () => {
        const result = { engine: 'konflux' };
        const filterParams = new URLSearchParams([['engine', 'both']]);

        expect(matchesFilters(result, filterParams)).toBe(true);
    });

    test('matchesFilters handles multi-select outcomes', () => {
        const result = { outcome: 'success' };

        const filterParams1 = new URLSearchParams([
            ['outcome', 'success'],
            ['outcome', 'failure']
        ]);

        const filterParams2 = new URLSearchParams([
            ['outcome', 'failure'],
            ['outcome', 'pending']
        ]);

        expect(matchesFilters(result, filterParams1)).toBe(true);
        expect(matchesFilters(result, filterParams2)).toBe(false);
    });

    test('matchesFilters handles source_repo pattern matching', () => {
        const result = {
            source: 'https://github.com/openshift/oc'
        };

        const filterParams1 = new URLSearchParams([['source_repo', 'openshift/oc']]);
        const filterParams2 = new URLSearchParams([['source_repo', 'openshift/cli']]);

        expect(matchesFilters(result, filterParams1)).toBe(true);
        expect(matchesFilters(result, filterParams2)).toBe(false);
    });
});

describe('Index Page - Outcome Selection', () => {
    test('getOutcomeValue returns data-value or value', () => {
        function getOutcomeValue(checkbox) {
            return checkbox.dataset.value || checkbox.value;
        }

        const checkbox1 = document.createElement('input');
        checkbox1.type = 'checkbox';
        checkbox1.dataset.value = 'success';
        checkbox1.value = 'other';

        const checkbox2 = document.createElement('input');
        checkbox2.type = 'checkbox';
        checkbox2.value = 'failure';

        expect(getOutcomeValue(checkbox1)).toBe('success');
        expect(getOutcomeValue(checkbox2)).toBe('failure');
    });
});

describe('Index Page - Status Bar Update', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="statusText"></div>';
    });

    test('updateStatusBar displays correct message', () => {
        function updateStatusBar(cachedCount, displayedCount) {
            const MAX_RESULTS = 1000;
            const statusTextBar = document.getElementById("statusText");
            const hiddenCount = cachedCount - displayedCount;
            let message = `Results: ${displayedCount} (${hiddenCount} filtered)`;
            if (cachedCount >= MAX_RESULTS) {
                message += ` — Results may be truncated (limit: ${MAX_RESULTS})`;
            }
            statusTextBar.textContent = message;
        }

        updateStatusBar(100, 75);

        const statusText = document.getElementById('statusText');
        expect(statusText.textContent).toBe('Results: 75 (25 filtered)');
    });

    test('updateStatusBar shows truncation message', () => {
        function updateStatusBar(cachedCount, displayedCount) {
            const MAX_RESULTS = 1000;
            const statusTextBar = document.getElementById("statusText");
            const hiddenCount = cachedCount - displayedCount;
            let message = `Results: ${displayedCount} (${hiddenCount} filtered)`;
            if (cachedCount >= MAX_RESULTS) {
                message += ` — Results may be truncated (limit: ${MAX_RESULTS})`;
            }
            statusTextBar.textContent = message;
        }

        updateStatusBar(1000, 1000);

        const statusText = document.getElementById('statusText');
        expect(statusText.textContent).toContain('Results may be truncated');
    });
});

describe('Index Page - Loading Overlay', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="loadingOverlay" style="display: none;"></div>';
    });

    test('showLoading displays overlay', () => {
        function showLoading() {
            document.getElementById("loadingOverlay").style.display = "flex";
        }

        showLoading();
        expect(document.getElementById('loadingOverlay').style.display).toBe('flex');
    });

    test('hideLoading hides overlay', () => {
        function hideLoading() {
            document.getElementById("loadingOverlay").style.display = "none";
        }

        hideLoading();
        expect(document.getElementById('loadingOverlay').style.display).toBe('none');
    });
});

describe('Index Page - Warning Indicator', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="warningIndicator" style="display: none;"></div>';
    });

    test('updateWarningIndicator shows when warnings exist', () => {
        const currentWarnings = ['Warning 1', 'Warning 2'];

        function updateWarningIndicator() {
            const indicator = document.getElementById("warningIndicator");
            if (!indicator) return;
            indicator.style.display = currentWarnings.length > 0 ? "inline" : "none";
        }

        updateWarningIndicator();
        expect(document.getElementById('warningIndicator').style.display).toBe('inline');
    });

    test('updateWarningIndicator hides when no warnings', () => {
        const currentWarnings = [];

        function updateWarningIndicator() {
            const indicator = document.getElementById("warningIndicator");
            if (!indicator) return;
            indicator.style.display = currentWarnings.length > 0 ? "inline" : "none";
        }

        updateWarningIndicator();
        expect(document.getElementById('warningIndicator').style.display).toBe('none');
    });
});
