require('dotenv').config()

export async function get_daily_overview_data() {

    const response = await fetch(process.env.REACT_APP_DAILY_REPORT_OVERVIEW_ENDPOINT, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        }
    });

    return await response.json();
}