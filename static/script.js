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

function createRow(result) {
    const row = document.createElement("tr");

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
        "konflux": `<img src="static/konflux.png" alt="Konflux" title="Konflux" style="height: 25px;">`,
        "brew": `<img src="static/brew.png" alt="Brew" title="Brew" style="height: 25px;">`,
    };
    const engineDisplay = engineIcons[engine] || engine;

    // Create the row
    row.innerHTML = `
        <td>${result["name"]}</td>
        <td>${outcomeDisplay}</td>
        <td class="nvr-td"><a href="/build?nvr=${result.nvr}" target="_blank">${result.nvr}</a></td>
        <td>${result["assembly"]}</td>
        <td>${result["group"]}</td>
        <td>${result["completed"]}</td>
        <td>${engineDisplay}</td>
        <td><a href="/packages?nvr=${result.nvr}" target="_blank">🔍</a></td>
        <td><a href="${result["source"]}" target="_blank">🔗️</a></td>
        <td><a href="${result["pipeline URL"]}" target="_blank">🔗</a></td>
        <td><a href="${result["art-job-url"]}" target="_blank">🔗</a></td>
    `;

    return row;
}

function updateStatusBar(cachedCount, filteredCount) {
    const statusTextBar = document.getElementById("statusText");
    statusTextBar.textContent = `Results: ${cachedCount} cached, ${filteredCount} filtered`;
}

document.getElementById("searchButton").addEventListener("click", function (event) {
    event.preventDefault()
    cachedResults = [];  // clear cached search results
    noResultsMessage.style.display = "none";

    // Show loading gif
    showLoading();

    // Prevent DOM scrolling
    const scrollContainer = document.querySelector(".results-container");
    scrollContainer.style.overflow = 'hidden';  // prevent scrolling

    const form = document.getElementById("searchForm");
    const formData = new FormData(form);

    // Convert FormData to query string
    const queryParams = new URLSearchParams(formData).toString();
    const url = `/search?${queryParams}`;

    // Update the browser URL with search parameters
    window.history.pushState({}, '', url);

    fetch(
        url, {
        method: "GET",
        headers: { "X-Requested-With": "XMLHttpRequest" },
    })
        .then((response) => response.json())
        .then((data) => {
            // Cache the results
            cachedResults = data;

            const tableBody = document.querySelector("#resultsTable tbody");
            tableBody.innerHTML = ""; // Clear existing rows

            // If no results are returned, show the "No Results" message
            // Otherwise, populate table with new results
            if (data.length === 0) {
                noResultsMessage.style.display = "block";
            } else {
                data.forEach(result => {
                    const row = createRow(result);
                    tableBody.appendChild(row);
                });
            }

            updateStatusBar(cachedResults.length, cachedResults.length);

            // Hide loading gif
            hideLoading();

            // re-enable scrolling
            scrollContainer.style.overflow = 'auto';
        }).catch((error) => {
            console.error("Error:", error);
        });
});

document.addEventListener("DOMContentLoaded", () => {
    const versionDropdown = document.getElementById("group");

    // Ensure the loading overlay is hidden initially
    hideLoading();

    // Set default date cut off
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 7);
    const formattedDate = currentDate.toISOString().split('T')[0];
    document.getElementById('after').value = formattedDate;

    // Fetch the versions from the server
    fetch("/get_versions")
        .then((response) => response.json())
        .then((versions) => {
            // Clear the dropdown
            versionDropdown.innerHTML = "";

            // Add a "-" entry to match any version
            option = document.createElement("option");
            option.value = '-';
            option.textContent = '-';
            versionDropdown.appendChild(option)

            // Populate the dropdown with fetched options
            versions.forEach((version) => {
                const option = document.createElement("option");
                option.value = version;
                option.textContent = version;
                versionDropdown.appendChild(option);
            });

            // Preserve the group value from the query string if present
            const currentGroup = initialQueryParams?.group;
            if (currentGroup) {
                versionDropdown.value = currentGroup;
            }
        }).catch((error) => console.error("Error fetching versions:", error));

    // Populate form fields with initial query parameters
    const form = document.getElementById("searchForm");
    for (const [key, value] of Object.entries(initialQueryParams || {})) {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) input.value = value;
    }

    // Populate the results table with initial results
    const isSearch = window.location.search != '';
    if (isSearch && initialResults) {
        const tableBody = document.querySelector("#resultsTable tbody");
        tableBody.innerHTML = ""; // Clear existing rows
        if (initialResults.length === 0) {
            noResultsMessage.style.display = "block";
        } else {
            initialResults.forEach(result => {
                const row = createRow(result);
                tableBody.appendChild(row);
            });
        }
        updateStatusBar(initialResults.length, initialResults.length);
    }
});

document.getElementById("filterButton").addEventListener("click", function () {
    event.preventDefault(); // Prevent the default form submission behavior

    // Collect the form values into search filters
    const form = document.getElementById("searchForm");
    const formData = new FormData(form);

    // Clear the results table
    const tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = '';

    // Filter cached results based on filter criteria
    const filteredResults = cachedResults.filter(result => matchesFilters(result, formData));

    filteredResults.forEach(filteredResult => {
        const row = createRow(filteredResult);
        tbody.appendChild(row);
    });

    updateStatusBar(cachedResults.length, filteredResults.length);
});

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
            if (value != '-' && result['group'] != value) {
                return false;
            }
        } else if (key == 'after') {
            resultDate = new Date(result['completed']);
            afterDate = new Date(value);
            if (resultDate < afterDate) {
                return false;
            }
        } else if (key == 'engine') {
            if (value != 'both' && result['engine'] != value) {
                return false;
            }
        } else {
            // Generic filter logic for other keys
            try {
                const regex = new RegExp(value, "i"); // Create a case-insensitive regex
                if (!regex.test(result[key])) {
                    return false; // Return false if regex does not match
                }
            } catch (e) {
                console.error(`Invalid regex for 'name': ${value}`, e);
                return false; // If regex is invalid, consider it not matching
            }
        }
    }

    return true;
}

document.getElementById("helpIcon").addEventListener("click", function() {
    const dialog = document.getElementById("instructionsDialog");
    dialog.style.display = "block";  // Make it visible
    setTimeout(() => {
        dialog.classList.add("show");  // Trigger zoomIn animation
    }, 10);  // Delay slightly to allow the dialog to be visible first
});

document.getElementById("closeDialogButton").addEventListener("click", function() {
    const dialog = document.getElementById("instructionsDialog");
    dialog.classList.remove("show");  // Remove zoomIn class
    dialog.classList.add("hide");  // Add zoomOut class

    setTimeout(() => {
        dialog.style.display = "none";  // Hide the dialog after animation
        dialog.classList.remove("hide");  // Reset the hide class for future use
    }, 400);  // Match the animation duration
});
