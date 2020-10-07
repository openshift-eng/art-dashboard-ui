let server_endpoint = null

if (process.env.REACT_APP_RUN_ENV === "dev"){
    server_endpoint = "http://localhost:8000/"
}else if (process.env.REACT_APP_RUN_ENV === "staging"){
    server_endpoint = "http://buildinterfaceserver-art-build-dev.cloud.paas.psi.redhat.com/"
}else{
    server_endpoint = "http://buildinterfaceserver-art-jenkins.cloud.paas.psi.redhat.com/"
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