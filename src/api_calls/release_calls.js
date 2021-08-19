let server_endpoint = null

if (process.env.REACT_APP_RUN_ENV === "dev"){
    server_endpoint = "http://localhost:8000/"
}else if (process.env.REACT_APP_RUN_ENV === "staging"){
    server_endpoint = "http://art-dash-ui-art-build-dev.apps.ocp4.prod.psi.redhat.com/"
}else{
    server_endpoint = "http://art-dash-ui-art-build-dev.apps.ocp4.prod.psi.redhat.com/"
}


export async function get_release_branches_from_ocp_build_data() {


    const response = await fetch(server_endpoint + process.env.REACT_APP_OCP_BUILD_DATA_OPENSHIFT_BRANCH_ENDPOINT, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();
}


export async function remaining_git_requests() {

    const response = await fetch(server_endpoint + process.env.REACT_APP_GIT_HUB_RATE_LIMIT_ENDPOINT, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();

}

export async function advisory_ids_for_branch(branch_name) {

    const response = await fetch(server_endpoint + process.env.REACT_APP_CURRENT_ADVISORY_IDS_FOR_A_BRANCH_OCP_BUILD_DATA + branch_name, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();

}

export async function advisory_details_for_advisory_id(advisory_id) {

    const response = await fetch(server_endpoint + process.env.REACT_APP_ADVISORY_DETAILS_FOR_AN_ADVISORY_ID + advisory_id, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();

}

export async function user_details_for_user_id(user_id) {

    const response = await fetch(server_endpoint + process.env.REACT_APP_USER_DETAILS_FOR_A_USER_ID + user_id, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();
}
