let server_endpoint = null

if (process.env.NEXT_PUBLIC_RUN_ENV === "dev") {
    server_endpoint = "http://localhost:8080"
} else {
    server_endpoint = process.env.NEXT_PUBLIC_ART_DASH_SERVER_ROUTE + "/"
}

export async function getBuilds(searchParams) {

    let query = ""
    for (const key in searchParams) {
        let value = searchParams[key]

        if ((value[0] === "\"" && value[value.length - 1] === "\"") || (value[0] === "'" && value[value.length - 1] === "'")) {
            value = value.substring(1, value.length - 1)
            query += `${key}=${value}&`
            continue
        }

        if (key !== "time_iso" && key !== "page" && key !== "brew_task_state")
            query += `${key}__icontains=${value}&`
        else
            query += `${key}=${value}&`
    }

    if (!(query === "")) {
        query = "?" + query.substring(0, query.length - 1)  // Remove additional & at the end and add ? to the beginning
    }

    const response = await fetch(server_endpoint + process.env.NEXT_PUBLIC_BUILD_ENDPOINT + query, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        }
    });

    return await response.json();

}
