let server_endpoint = null

if (process.env.REACT_APP_RUN_ENV === "dev") {
    server_endpoint = "http://localhost:8000/"
} else {
    server_endpoint = process.env.REACT_APP_ART_DASH_SERVER_ROUTE + "/"
}

export async function get_all_incident_reports() {


    const response = await fetch(server_endpoint + process.env.REACT_APP_REPORTED_INCIDENTS, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();
}

export async function update_incident(incident_record) {

    console.log(incident_record);

    const response = await fetch(server_endpoint + process.env.REACT_APP_REPORTED_INCIDENTS, {
        method: "PATCH",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        },
        body: JSON.stringify(incident_record)
    });

    return await response.json();

}

export async function create_incident(incident_record) {


    const response = await fetch(server_endpoint + process.env.REACT_APP_REPORTED_INCIDENTS, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        },
        body: JSON.stringify(incident_record)
    });

    return await response.json();

}

export async function delete_incident(incident_id) {

    let data = {
        "log_incident_id": incident_id
    }

    const response = await fetch(server_endpoint + process.env.REACT_APP_REPORTED_INCIDENTS, {
        method: "DELETE",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    return await response.json();

}
