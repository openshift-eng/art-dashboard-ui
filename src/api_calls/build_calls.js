let server_endpoint = null

if (process.env.REACT_APP_RUN_ENV === "dev"){
    server_endpoint = "http://localhost:8000/"
}else if (process.env.REACT_APP_RUN_ENV === "staging"){
    server_endpoint = "http://art-dashboard-server-1-art-build-dev.apps.ocp4.prod.psi.redhat.com/"
}else{
    server_endpoint = "http://art-dashboard-server-1-art-build-dev.apps.ocp4.prod.psi.redhat.com/"
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
