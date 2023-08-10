import axios from 'axios';

// Setting axios defaults for CSRF token
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

let server_endpoint = null;

if (process.env.NEXT_PUBLIC_RUN_ENV === "dev") {
    server_endpoint = "http://localhost:8080";
} else {
    server_endpoint = process.env.NEXT_PUBLIC_ART_DASH_SERVER_ROUTE;
}


export function makeApiCall(urlPath, method, data = {}, headers = {}, params = {}, req = null) {
    if (!server_endpoint || !urlPath) {
        return;
    }

    if (!urlPath.startsWith('/')) {
        urlPath = '/' + urlPath;
    }


    const url = `${server_endpoint}${urlPath}`;
    
    // If it's a server-side call, forward the cookies from the incoming request
    if (req) {
        headers.Cookie = req.headers.cookie;
    }

    return axios({
        method: method,
        url: url,
        headers: headers,
        params: params,
        data: data,
        withCredentials: true
    })
    .then(response => {
        return response.data;
    })
    .catch(error => {
        console.error("API call failed:", error);
        return { detail: 'Request failed' };
    });
}