document.getElementById('toggleButton').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    this.innerHTML = sidebar.classList.contains('collapsed') ? '❯' : '❮';
});

document.getElementById('searchButton').addEventListener('click', function() {
    const form = document.getElementById('searchForm');
    const formData = new FormData(form);
    const searchParams = {};
    
    for (const [key, value] of formData.entries()) {
        searchParams[key] = value;
    }
    
    console.log("Search Parameters:", searchParams);
    populateResultsTable(searchParams);
});

function populateResultsTable(searchParams) {
    const resultsTable = document.getElementById('resultsTable').querySelector('tbody');
    resultsTable.innerHTML = ''; // Clear previous results
    
    const row = document.createElement('tr');
    
    for (let i = 1; i <= 3; i++) {
        const cell = document.createElement('td');
        cell.textContent = searchParams[`param${i}`] || 'N/A';
        row.appendChild(cell);
    }
    
    resultsTable.appendChild(row);
}
