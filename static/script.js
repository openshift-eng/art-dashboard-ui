let cachedResults = [];

document.getElementById("toggleButton").addEventListener("click", function() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("collapsed");
    this.innerHTML = sidebar.classList.contains("collapsed") ? "❯" : "❮";
});

function showLoading() {
    document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none";
}

function showCustomAlert(message, icon = "⚠️") {
    const overlay = document.getElementById("alertOverlay");
    const dialog = document.getElementById("customAlertDialog");
    const alertIcon = document.getElementById("alertIcon");
    const alertMessage = document.getElementById("alertMessage");

    // Set the message and icon
    alertMessage.textContent = message;
    alertIcon.textContent = icon;

    // Show overlay and dialog
    overlay.style.display = "block";
    dialog.style.display = "block";

    // Trigger animation after a short delay
    setTimeout(() => {
        dialog.classList.add("show");
    }, 10);
}

function hideCustomAlert() {
    const overlay = document.getElementById("alertOverlay");
    const dialog = document.getElementById("customAlertDialog");

    dialog.classList.remove("show");
    dialog.classList.add("hide");

    setTimeout(() => {
        dialog.style.display = "none";
        overlay.style.display = "none";
        dialog.classList.remove("hide");
    }, 400);
}

function createRow(result) {
    const row = document.createElement("tr");

    // Helper: format relative time
    function timeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const seconds = Math.floor((now - then) / 1000);

        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'week', seconds: 604800 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 },
            { label: 'second', seconds: 1 }
        ];

        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
            }
        }
        return 'just now';
    }

    // Determine the Outcome display value
    const outcome = result.outcome?.toLowerCase() || "";
    const outcomeDisplay = {
        "success": "✅",
        "failure": "❌",
        "pending": "⏳",
    }[outcome] || outcome;

    // Engine icons
    const engine = result.engine?.toLowerCase() || "";
    const engineIcons = {
        "konflux": '<img src="static/konflux.png" alt="Konflux" title="Konflux" style="height: 25px;">',
        "brew": '<img src="static/brew.png" alt="Brew" title="Brew" style="height: 25px;">',
    };
    const engineDisplay = engineIcons[engine] || engine;

    // Completed + relative time
    const completed = result["completed"];
    const completedRelative = timeAgo(completed);
    const completedDisplay = `${completed}<br><em style="color: #777;">(${completedRelative})</em>`;

    // Create the row
    row.innerHTML = `
        <td>${result["name"]}</td>
        <td>${outcomeDisplay}</td>
        <td class="nvr-td"><a href="/build?nvr=${result.nvr}&outcome=${result.outcome}&type=${result.type}" target="_blank">${result.nvr}</a></td>
        <td>${result["assembly"]}</td>
        <td>${result["group"]}</td>
        <td>${completedDisplay}</td>
        <td>${engineDisplay}</td>
        <td><a href="/packages?nvr=${result.nvr}" target="_blank">🔍</a></td>
        <td>
            <a href="${result["source"]}" target="_blank" title="Source commit URL">🧬</a>
            <a href="${result["pipeline URL"]}" target="_blank" title="Build pipeline URL">🛠️</a>
            <a href="${result["art-job-url"]}" target="_blank" title="ART job URL">🎨</a>
        </td>
    `;

    return row;
}

function updateStatusBar(cachedCount, filteredCount) {
    const statusTextBar = document.getElementById("statusText");
    statusTextBar.textContent = `Results: ${cachedCount} cached, ${filteredCount} filtered`;
}

function displayResults(results) {
    const tableBody = document.querySelector("#resultsTable tbody");
    tableBody.innerHTML = "";

    if (results.length === 0) {
        document.getElementById("noResultsMessage").style.display = "block";
    } else {
        document.getElementById("noResultsMessage").style.display = "none";
        results.forEach(result => {
            const row = createRow(result);
            tableBody.appendChild(row);
        });
    }

    updateStatusBar(cachedResults.length, results.length);
}

function performSearch(queryParams = null) {
    showLoading();
    const scrollContainer = document.querySelector(".results-container");
    scrollContainer.style.overflow = 'hidden';

    const form = document.getElementById("searchForm");
    const formData = queryParams || new FormData(form);

    const queryString = new URLSearchParams(formData).toString();
    const url = `/search?${queryString}`;

    fetch(url, {
        method: "GET",
        headers: { "X-Requested-With": "XMLHttpRequest" },
    })
    .then((response) => response.json())
    .then((data) => {
        cachedResults = data;
        displayResults(data);
        hideLoading();
        scrollContainer.style.overflow = 'auto';
    })
    .catch((error) => {
        console.error("Error:", error);
        hideLoading();
    });
}

function filterResults() {
    const form = document.getElementById("searchForm");
    const formData = new FormData(form);

    const filteredResults = cachedResults.filter(result => matchesFilters(result, formData));
    displayResults(filteredResults);
}

function downloadResults() {
    const form = document.getElementById("searchForm");
    const formData = new FormData(form);

    const filteredResults = cachedResults.filter(result => matchesFilters(result, formData));
    if (filteredResults.length === 0) {
        showCustomAlert("No results to download. Please perform a search first.");
        return;
    }

    // Convert results to JSON string (pretty-printed for readability)
    const jsonStr = JSON.stringify(filteredResults, null, 2);

    // Create a Blob with the JSON content
    const blob = new Blob([jsonStr], { type: "application/json" });

    // Create a temporary link and trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "results.json"; // <-- filename
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function matchesFilters(result, filterParams) {
    for (let [key, value] of filterParams.entries()) {
        if (!value) continue; // Skip empty filter values

        if (key === "outcome") {
            if (value == 'completed') {
                if(!['success', 'failure'].includes(result['outcome']))
                    return false;
            } else if(result['outcome'] != value) {
                return false;
            }
        } else if (key == 'group') {
            if (result['group'] != value) {
                return false;
            }
        } else if (key == 'commitish') {
            if (result['commitish'] != value) {
                return false;
            }
        } else if (key == 'after') {
            const resultDate = new Date(result['completed']);
            const afterDate = new Date(value);
            if (resultDate < afterDate) {
                return false;
            }
        } else if (key == 'engine') {
            if (value != 'both' && result['engine'] != value) {
                return false;
            }
        } else {
            try {
                const regex = new RegExp(value, "i");
                if (!regex.test(result[key])) {
                    return false;
                }
            } catch (e) {
                console.error(`Invalid regex for '${key}': ${value}`, e);
                return false;
            }
        }
    }

    return true;
}

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Flatpickr
    flatpickr("#after", {
        dateFormat: "Y-m-d",
        defaultDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });

    hideLoading();

    // Set default date cut off
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 7);
    const formattedDate = currentDate.toISOString().split('T')[0];
    document.getElementById('after').value = formattedDate;

    // Check if we're on a search results page (from server-side render)
    const isSearchPage = document.body.dataset.isSearchPage === 'true';
    const urlParams = new URLSearchParams(window.location.search);

    // If we have initial results from server, cache them
    if (isSearchPage && window.initialResults) {
        cachedResults = window.initialResults;
        displayResults(cachedResults);
    }
    // Otherwise, if we have search parameters, perform search
    else if (urlParams.size > 0) {
        // Populate form fields from URL
        const form = document.getElementById("searchForm");
        urlParams.forEach((value, key) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = value;
        });

        performSearch(urlParams);
    }

    // Fetch versions (independent of search)
    const versionDropdown = document.getElementById("group");

    fetch("/get_versions")
        .then((response) => response.json())
        .then((versions) => {
            versionDropdown.innerHTML = "";

            let option = document.createElement("option");
            option.value = '';
            option.textContent = '';
            versionDropdown.appendChild(option);

            // Add options
            versions.forEach((version) => {
                const option = document.createElement("option");
                option.value = version;
                option.textContent = version;
                versionDropdown.appendChild(option);
            });

            if (urlParams.has('group')) {
                // Set version from URL if present
                versionDropdown.value = urlParams.get('group');
            } else {
                // Sort versions numerically and select most recent
                const mostRecent = versions.sort((a, b) => {
                    const [aMajor, aMinor] = a.split('.').map(Number);
                    const [bMajor, bMinor] = b.split('.').map(Number);
                    return bMajor - aMajor || bMinor - aMinor;
                })[0];
                versionDropdown.value = mostRecent;
            }
        })
        .catch((error) => console.error("Error fetching versions:", error));
});

document.getElementById("searchButton").addEventListener("click", function (event) {
    event.preventDefault();

    const form = document.getElementById("searchForm");
    const formData = new FormData(form);
    const queryParams = new URLSearchParams(formData);

    // Update browser URL without reloading
    window.history.pushState({}, '', `/?${queryParams.toString()}`);

    performSearch(formData);
});

document.getElementById("searchButton").addEventListener("click", function (event) {
    event.preventDefault();
    performSearch();
});

document.getElementById("filterButton").addEventListener("click", function (event) {
    event.preventDefault();
    filterResults();
});

document.getElementById("downloadButton").addEventListener("click", function (event) {
    event.preventDefault();
    downloadResults();
});

document.getElementById("helpIcon").addEventListener("click", function() {
    const dialog = document.getElementById("instructionsDialog");
    dialog.style.display = "block";
    setTimeout(() => {
        dialog.classList.add("show");
    }, 10);
});

document.getElementById("closeDialogButton").addEventListener("click", function() {
    const dialog = document.getElementById("instructionsDialog");
    dialog.classList.remove("show");
    dialog.classList.add("hide");

    setTimeout(() => {
        dialog.style.display = "none";
        dialog.classList.remove("hide");
    }, 400);
});

document.getElementById("alertOkButton").addEventListener("click", function() {
    hideCustomAlert();
});

// Close alert when clicking on overlay
document.getElementById("alertOverlay").addEventListener("click", function() {
    hideCustomAlert();
});

document.querySelector(".results-container h1").addEventListener("click", function() {
    // Reset form
    const form = document.getElementById("searchForm");

    // Reset text inputs
    form.querySelector("#name").value = "";
    form.querySelector("#nvr").value = "";
    form.querySelector("#assembly").value = "stream";
    form.querySelector("#commitish").value = "";
    form.querySelector("#art-job-url").value = "";

    // Reset select dropdowns
    form.querySelector("#outcome").value = "success";
    form.querySelector("#engine").value = "konflux";
    form.querySelector("#group").value = "";

    // Reset date picker
    flatpickr("#after", {
        dateFormat: "Y-m-d",
        defaultDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });

    // Clear any existing search results
    cachedResults = [];
    document.querySelector("#resultsTable tbody").innerHTML = "";
    document.getElementById("noResultsMessage").style.display = "none";
    updateStatusBar(0, 0);

    // Clear the URL parameters
    window.history.pushState({}, document.title, window.location.pathname);

    // Clear cached results
    cachedResults = [];
});