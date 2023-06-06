import axios from 'axios';

let server_endpoint = null

if (process.env.NEXT_PUBLIC_RUN_ENV === "dev") {
    server_endpoint = "http://localhost:8080/"
} else {
    server_endpoint = process.env.NEXT_PUBLIC_ART_DASH_SERVER_ROUTE + "/"

    // OPENSHIFT_BUILD_NAMESPACE env variable is obtained inside pod during its run
    server_endpoint = server_endpoint.replace(/\{0\}/g, process.env.NEXT_PUBLIC_OPENSHIFT_BUILD_NAMESPACE);
}

export function fetchRpmsImages(branchName) {
    const url = `${server_endpoint}api/v1/rpms_images_fetcher?release=${branchName}`;
    return axios.get(url)
    .then(response => response.data)
    .catch(error => console.error('Error:', error));
}
