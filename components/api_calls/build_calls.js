import { makeApiCall } from './api_calls';

export async function getBuilds(searchParams) {
    let params = {};

    for (const key in searchParams) {
        let value = searchParams[key];

        // Check if the value is enclosed in double or single quotes using regex.
        const isEnclosedInQuotes = /^["'][a-zA-Z0-9-]+["']$/.test(value);
        
        if (isEnclosedInQuotes) {
            value = value.substring(1, value.length - 1); // Strip the quotes
            params[key] = value; // Exact match
        } else {
            if (key === "time_iso" || key === "page" || key === "brew_task_state")
                params[key] = value; // Exact match for the excepted keys
            else
                params[`${key}__icontains`] = value; // Partial match
        }
    }

    const headers = {
        'Accept': 'application/json',
        "Content-Type": "application/json"
    };

    return makeApiCall(process.env.NEXT_PUBLIC_BUILD_ENDPOINT, 'GET', {}, headers, params)
        .catch(error => console.error('Error:', error));
}
