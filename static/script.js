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
    outcome = result.outcome
    let outcomeDisplay;
    if (outcome.toLowerCase() === "success") {
        outcomeDisplay = "✅";
    } else if (outcome.toLowerCase() === "failure") {
        outcomeDisplay = "❌";
    } else {
        outcomeDisplay = outcome; // Fallback for other cases
    }

    // Create the row
    row.innerHTML = `
        <td>${result["name"]}</td>
        <td>${outcomeDisplay}</td>
        <td class="nvr-td">${result.NVR}</td>
        <td>${result["assembly"]}</td>
        <td>${result["group"]}</td>
        <td>${result["completed"]}</td>
        <td><a href="${result["source"]}" target="_blank">Source URL</a></td>
        <td><a href="${result["pipeline URL"]}" target="_blank">Pipeline URL</a></td>
        <td><a href="${result["art job URL"]}" target="_blank">ART Job URL</a></td>
    `;

    return row;
}

function updateStatusBar(cachedCount, filteredCount) {
    const statusTextBar = document.getElementById("statusText");
    statusTextBar.textContent = `Results: ${cachedCount} cached, ${filteredCount} filtered`;
}

document.getElementById("searchButton").addEventListener("click", function () {
    cachedResults = [];  // clear cached search results
    noResultsMessage.style.display = "none";
    showLoading();
    const form = document.getElementById("searchForm");
    const formData = new FormData(form);

    fetch("/search", {
        method: "POST",
        body: formData,
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

            hideLoading();
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

            // Populate the dropdown with fetched options
            versions.forEach((version) => {
                const option = document.createElement("option");
                option.value = version;
                option.textContent = version;
                versionDropdown.appendChild(option);
            });

            // Add a "-" entry to match any version
            option = document.createElement("option");
            option.value = '-';
            option.textContent = '-';
            versionDropdown.appendChild(option)
        })
        .catch((error) => console.error("Error fetching versions:", error));
});

document.getElementById("clearButton").addEventListener("click", function () {
    // Reset all form fields to their default values
    const form = document.getElementById("searchForm");
    form.reset();

    document.getElementById("outcome").value = ""; // Set default value for Outcome dropdown
    document.getElementById("group").value = ""; // Clear version input field
    document.getElementById("name").value = ""; // Clear version input field
    document.getElementById("assembly").value = ""; // Reset to default Assembly value
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

            if (key === "name") {
                try {
                    const regex = new RegExp(value, "i"); // Create a case-insensitive regex
                    if (!regex.test(result["name"])) {
                        return false; // Return false if regex does not match
                    }
                } catch (e) {
                    console.error(`Invalid regex for 'name': ${value}`, e);
                    return false; // If regex is invalid, consider it not matching
                }
            } else if (key === "outcome") {
                if (value != 'both' && result['outcome'] != value) {
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
            } else {
                // Generic filter logic for other keys
                if (result[key] && result[key].toString().toLowerCase() !== value.toLowerCase()) {
                    return false;
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
