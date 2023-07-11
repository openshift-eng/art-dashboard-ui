import { makeApiCall } from './api_calls';

const headers = {
    'Accept': 'application/json',
    "Content-Type": "application/json"
};

export function getReleaseBranchesFromOcpBuildData() {
    const url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}${process.env.NEXT_PUBLIC_OCP_BUILD_DATA_OPENSHIFT_BRANCH_ENDPOINT}`;
    return makeApiCall(url, 'GET', headers);
}

export function remaining_git_requests() {
    const url = `${process.env.NEXT_PUBLIC_GIT_HUB_RATE_LIMIT_ENDPOINT}`;
    return makeApiCall(url, 'GET', headers);
}

export function advisory_ids_for_branch(branch_name) {
    const url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}${process.env.NEXT_PUBLIC_CURRENT_ADVISORY_IDS_FOR_A_BRANCH_OCP_BUILD_DATA}${branch_name}`;
    return makeApiCall(url, 'GET', headers);
}

export function advisory_details_for_advisory_id(advisory_id) {
    const url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}${process.env.NEXT_PUBLIC_ADVISORY_DETAILS_FOR_AN_ADVISORY_ID}${advisory_id}`;
    return makeApiCall(url, 'GET', headers);
}

export function user_details_for_user_id(user_id) {
    const url = `${process.env.NEXT_PUBLIC_USER_DETAILS_FOR_A_USER_ID}${user_id}`;
    return makeApiCall(url, 'GET', headers);
}

export function gaVersion() {
    const url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/ga-version`;
    return makeApiCall(url, 'GET', headers);
}