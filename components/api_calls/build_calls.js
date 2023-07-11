import { makeApiCall } from './api_calls';

export async function getBuilds(searchParams) {
    let params = {};

    for (const key in searchParams) {
        let value = searchParams[key];

        if ((value[0] === "\"" && value[value.length - 1] === "\"") || (value[0] === "'" && value[value.length - 1] === "'")) {
            value = value.substring(1, value.length - 1);
        }

        if (key !== "time_iso" && key !== "page" && key !== "brew_task_state")
            params[`${key}__icontains`] = value;
        else
            params[key] = value;
    }

    const headers = {
        'Accept': 'application/json',
        "Content-Type": "application/json"
    };

    return makeApiCall(process.env.NEXT_PUBLIC_BUILD_ENDPOINT, 'GET', headers, params)
        .catch(error => console.error('Error:', error));
}
