require('dotenv').config()

export async function get_release_branches_from_ocp_build_data() {


    const response = await fetch(process.env.REACT_APP_OCP_BUILD_DATA_OPENSHIFT_BRANCH_ENDPOINT, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();
}


export async function remaining_git_requests() {

    const response = await fetch(process.env.REACT_APP_GIT_HUB_RATE_LIMIT_ENDPOINT, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();

}