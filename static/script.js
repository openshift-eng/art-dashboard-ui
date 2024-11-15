document.getElementById("toggleButton").addEventListener("click", function() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("collapsed");
    this.innerHTML = sidebar.classList.contains("collapsed") ? "❯" : "❮";
});

document.getElementById("searchButton").addEventListener("click", function () {
    const form = document.getElementById("searchForm");
    const formData = new FormData(form);

    fetch("/search", {
        method: "POST",
        body: formData,
    })
        .then((response) => response.json())
        .then((data) => {
            const tableBody = document.querySelector("#resultsTable tbody");
            tableBody.innerHTML = ""; // Clear existing rows

            // Populate table with new results
            data.forEach((result) => {
                const row = document.createElement("tr");

                // Determine the Outcome display value
                let outcomeDisplay;
                if (result.Outcome.toLowerCase() === "success") {
                    outcomeDisplay = "✅";
                } else if (result.Outcome.toLowerCase() === "failure") {
                    outcomeDisplay = "❌";
                } else {
                    outcomeDisplay = result.Outcome; // Fallback for other cases
                }

                // Create the row
                row.innerHTML = `
                    <td>${result.Name}</td>
                    <td>${outcomeDisplay}</td>
                    <td>${result["OCP version"]}</td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch((error) => {
            console.error("Error:", error);
        });
});
