const axios = require('axios');

// Setting axios defaults for CSRF token
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

let server_endpoint = null;

if (process.env.NEXT_PUBLIC_RUN_ENV === "dev") {
    server_endpoint = "http://localhost:8080";
} else {
    server_endpoint = process.env.NEXT_PUBLIC_ART_DASH_SERVER_ROUTE;
}

function getCookie(cookies, name) {
    const value = `; ${cookies}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function makeApiCall(urlPath, method, data = {}, headers = {}, params = {}, req = null) {
    if (!server_endpoint || !urlPath) {
        return;
    }

    if (!urlPath.startsWith('/')) {
        urlPath = '/' + urlPath;
    }

    let token;
    if (req) {
        // Server-side
        token = getCookie(req.headers.cookie, 'token');
    } else if (typeof document !== 'undefined') {
        // Client-side
        token = getCookie(document.cookie, 'token');
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const url = `${server_endpoint}${urlPath}`;

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

        // If an error occurred, attempt to strigify the response data and
        // include it in the error message so that it can be displayed in the UI.
        let errorDetails = error.message;
        try {
            const errorResponseData = JSON.stringify(error.response?.data);
            errorDetails += `, ${errorResponseData}`;
        } catch (error) {
            console.error("Error parsing response data:", error);
        }
        return { detail: 'Request failed', 'message': `${errorDetails}` };
    });
}

module.exports = {
    makeApiCall
};