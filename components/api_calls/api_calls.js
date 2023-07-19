import axios from 'axios';

let server_endpoint = null;

if (process.env.NEXT_PUBLIC_RUN_ENV === "dev") {
    server_endpoint = "http://localhost:8080/";
} else {
    server_endpoint = process.env.NEXT_PUBLIC_ART_DASH_SERVER_ROUTE;
}

export function makeApiCall(urlPath, method, headers = {}, params = {}) {
    const url = `${server_endpoint}${urlPath}`;
    
    return axios({
        method: method,
        url: url,
        headers: headers,
        params: params
    })
    .then(response => {
        console.log('Success:', response);
        return response.data;
    })
    .catch(error => {
        console.error('Error:', error);
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.error('Request:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Message:', error.message);
        }
        console.error('Config:', error.config);
    });
}
