const { makeApiCall } = require('./api_calls');

const headers = {
    'Accept': 'application/json',
    "Content-Type": "application/json"
};

function getReleaseBranchesFromOcpBuildData() {
    const url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}${process.env.NEXT_PUBLIC_OCP_BUILD_DATA_OPENSHIFT_BRANCH_ENDPOINT}`;
    return makeApiCall(url, 'GET', headers);
}

function remaining_git_requests() {
    const url = `${process.env.NEXT_PUBLIC_GIT_HUB_RATE_LIMIT_ENDPOINT}`;
    return makeApiCall(url, 'GET', headers);
}

function advisory_ids_for_branch(branch_name) {
    const url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}${process.env.NEXT_PUBLIC_CURRENT_ADVISORY_IDS_FOR_A_BRANCH_OCP_BUILD_DATA}${branch_name}`;
    return makeApiCall(url, 'GET', headers);
}

function advisory_details_for_advisory_id(advisory_id) {
    const url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}${process.env.NEXT_PUBLIC_ADVISORY_DETAILS_FOR_AN_ADVISORY_ID}${advisory_id}`;
    return makeApiCall(url, 'GET', headers);
}

function user_details_for_user_id(user_id) {
    const url = `${process.env.NEXT_PUBLIC_USER_DETAILS_FOR_A_USER_ID}${user_id}`;
    return makeApiCall(url, 'GET', headers);
}

function gaVersion() {
    const currentTime = new Date().getTime();  // Moved the definition up

    if (typeof localStorage !== 'undefined') {
        const cachedGaVersion = localStorage.getItem('gaVersion');
        const cachedTimestamp = localStorage.getItem('gaVersionTimestamp');
        
        const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

        // If cached version exists and it's not older than a day
        if (cachedGaVersion && cachedTimestamp && (currentTime - cachedTimestamp < oneDayInMilliseconds)) {
            return Promise.resolve({ payload: cachedGaVersion });
        } 
    }
    
    // If localStorage is not available or cached data is stale
    const url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/ga-version`;
    return makeApiCall(url, 'GET', headers)
        .then(response => {
            if (typeof localStorage !== 'undefined') {
                // Save the new value and timestamp to local storage
                localStorage.setItem('gaVersion', response.payload);
                localStorage.setItem('gaVersionTimestamp', currentTime.toString());
            }
            return response;
        });
}

module.exports = {
    getReleaseBranchesFromOcpBuildData,
    remaining_git_requests,
    advisory_ids_for_branch,
    advisory_details_for_advisory_id,
    user_details_for_user_id,
    gaVersion
};