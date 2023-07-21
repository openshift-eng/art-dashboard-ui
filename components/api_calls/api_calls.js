import axios from 'axios';

let server_endpoint = null;

if (process.env.NEXT_PUBLIC_RUN_ENV === "dev") {
    server_endpoint = "http://localhost:8080";
} else {
    server_endpoint = process.env.NEXT_PUBLIC_ART_DASH_SERVER_ROUTE;
}

function getCsrfToken() {
    if (typeof document === 'undefined' || !document.cookie) {
        return null;
    }
    const token = document.cookie.split(';')
        .map(c => c.trim())
        .filter(c => c.startsWith('csrftoken='));

    if (token.length === 0) {
        return null;
    }
    return decodeURIComponent(token[0].split('=')[1]);
}

export function makeApiCall(urlPath, method, data = {}, headers = {}, params = {}, req = null) {
    if (!server_endpoint || !urlPath) {
        return;
    }

    if (!urlPath.startsWith('/')) {
        urlPath = '/' + urlPath;
    }

    if (req) {
        headers['cookie'] = req.headers.cookie;
    }

    const url = `${server_endpoint}${urlPath}`;
    
    const csrfToken = getCsrfToken();
    if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
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
        return { detail: 'Request failed' };
    });
}
