import { makeApiCall } from './api_calls';

export function fetchRpmsImages(branchName) {
    const url = `api/v1/rpms_images_fetcher?release=${branchName}`;
    return makeApiCall(url, "GET", {})
        .catch(error => console.error('Error:', error));
}