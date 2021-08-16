let server_endpoint = null

if (process.env.REACT_APP_RUN_ENV === "dev"){
    server_endpoint = "http://localhost:8000/"
}else{
    server_endpoint = process.env.ART_DASH_SERVER_ROUTE + "/"
}

export async function auto_complete_nvr() {

    const response = await fetch(server_endpoint + process.env.REACT_APP_AUTOCOMPLETE_FOR_NVR, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();

}

export async function get_builds(request_params){

    const response = await fetch(server_endpoint + process.env.REACT_APP_BUILD_ENDPOINT, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        },
        body: JSON.stringify(request_params)
    });

    return await response.json();

}
