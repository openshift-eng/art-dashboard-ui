let server_endpoint = null

if (process.env.REACT_APP_RUN_ENV === "dev"){
    server_endpoint = "http://localhost:8000/"
}else if (process.env.REACT_APP_RUN_ENV === "staging"){
    server_endpoint = "http://art-dashboard-server-1-art-build-dev.apps.ocp4.prod.psi.redhat.com/"
}else{
    server_endpoint = "http://art-dashboard-server-1-art-build-dev.apps.ocp4.prod.psi.redhat.com/"
}


export async function get_daily_overview_data() {

    const response = await fetch(server_endpoint + process.env.REACT_APP_DAILY_REPORT_OVERVIEW_ENDPOINT, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        }
    });

    return await response.json();
}

export async function get_expanded_data_for_a_date(date){
    let endpoint = server_endpoint + process.env.REACT_APP_DAILY_REPORT_BY_DATE_ENDPOINT;
    endpoint = endpoint+date;

    const response = await fetch(endpoint, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        }
    });
    return await response.json();
}

export async function get_expanded_data_for_a_date_and_fault_code(date){
    let endpoint = server_endpoint + process.env.REACT_APP_DAILY_REPORT_BY_FAULT_CODE_BY_DATEWISE;
    endpoint = endpoint+date;

    const response = await fetch(endpoint, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        }
    });
    return await response.json();
}

export async function get_daily_build_data_for_a_date(date){
    let endpoint = server_endpoint + process.env.REACT_APP_DAILY_BUILD_DATA_FOR_A_DATE;
    endpoint = endpoint+date;

    const response = await fetch(endpoint, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        }
    });
    return await response.json();
}


export async function get_daily_build_data_for_a_date_for_a_column(column_name, column_value, date){
    let endpoint = server_endpoint + process.env.REACT_APP_DAILY_BUILD_DATA_FOR_A_COLUMN_AND_DATE;
    endpoint = endpoint.replace(/\{0\}/g, column_name);
    endpoint = endpoint.replace(/\{1\}/g, column_value);
    endpoint = endpoint.replace(/\{2\}/g, date);

    const response = await fetch(endpoint, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        }
    });
    return await response.json();
}
