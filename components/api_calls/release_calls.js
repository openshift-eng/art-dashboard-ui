let server_endpoint = null

if (process.env.NEXT_PUBLIC_RUN_ENV === "dev") {
    server_endpoint = "http://localhost:8080/"
} else {
    server_endpoint = process.env.NEXT_PUBLIC_ART_DASH_SERVER_ROUTE + "/"

    // OPENSHIFT_BUILD_NAMESPACE env variable is obtained inside pod during its run
    server_endpoint = server_endpoint.replace(/\{0\}/g, process.env.NEXT_PUBLIC_OPENSHIFT_BUILD_NAMESPACE);
}


export async function getReleaseBranchesFromOcpBuildData() {

    const response = await fetch(server_endpoint + process.env.NEXT_PUBLIC_API_ENDPOINT + process.env.NEXT_PUBLIC_OCP_BUILD_DATA_OPENSHIFT_BRANCH_ENDPOINT, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();
}


export async function remaining_git_requests() {

    const response = await fetch(server_endpoint + process.env.NEXT_PUBLIC_GIT_HUB_RATE_LIMIT_ENDPOINT, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();

}

export async function advisory_ids_for_branch(branch_name) {

    const response = await fetch(server_endpoint + process.env.NEXT_PUBLIC_API_ENDPOINT + process.env.NEXT_PUBLIC_CURRENT_ADVISORY_IDS_FOR_A_BRANCH_OCP_BUILD_DATA + branch_name, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();

}

export async function advisory_details_for_advisory_id(advisory_id) {

    const response = await fetch(server_endpoint + process.env.NEXT_PUBLIC_API_ENDPOINT + process.env.NEXT_PUBLIC_ADVISORY_DETAILS_FOR_AN_ADVISORY_ID + advisory_id, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();

}

export async function user_details_for_user_id(user_id) {

    const response = await fetch(server_endpoint + process.env.NEXT_PUBLIC_USER_DETAILS_FOR_A_USER_ID + user_id, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();
}


export async function gaVersion() {
    const response = await fetch(server_endpoint + process.env.NEXT_PUBLIC_API_ENDPOINT + "/ga-version", {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();
}