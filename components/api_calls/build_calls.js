import { makeApiCall } from './api_calls';

export async function getBuilds(searchParams, streamOnly) {
    let params = {};

    if (streamOnly !== undefined) {
        params.stream_only = streamOnly;
    }

    for (const key in searchParams) {
        let value = searchParams[key];

        // Check if the value is enclosed in double or single quotes using regex.
        const isEnclosedInQuotes = /^["'][a-zA-Z0-9-_.]+["']$/.test(value);
        
        if (isEnclosedInQuotes) {
            // Exact match: strip the quotes and add to params
            value = value.substring(1, value.length - 1);
            params[key] = value;
        } else {
            // For specific keys, use exact match; for others, use partial match
            if (["time_iso", "page", "brew_task_state"].includes(key)) {
                params[key] = value;
            } else {
                params[`${key}__icontains`] = value; // Partial match for other keys
            }
        }
    }

    const headers = {
        'Accept': 'application/json',
        "Content-Type": "application/json"
    };

    // Make the API call with the adjusted params
    return makeApiCall(process.env.NEXT_PUBLIC_BUILD_ENDPOINT, 'GET', {}, headers, params)
        .catch(error => console.error('Error:', error));
}
