let server_endpoint = null

if (process.env.NEXT_PUBLIC_RUN_ENV === "dev") {
    server_endpoint = "http://localhost:8080"
} else {
    server_endpoint = process.env.NEXT_PUBLIC_ART_DASH_SERVER_ROUTE + "/"
}

export async function auto_complete_nvr() {

    const response = await fetch(server_endpoint + process.env.NEXT_PUBLIC_AUTOCOMPLETE_FOR_NVR, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();

}

export async function get_builds(searchParams) {

    let query = ""
    for (const key in searchParams) {
        query += `${key}__icontains=${searchParams[key]}&`
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
