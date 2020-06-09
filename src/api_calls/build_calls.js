require('dotenv').config()

export async function get_build_data_without_filters() {

    const data = {
                 "where": "",
                 "limit": 100
             };

    const response = await fetch(process.env.REACT_APP_BUILD_ENDPOINT, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    return await response.json();
}

export async function get_build_data_witt_filters(filters) {

    /*
    expect filters to be in following format

    {
        where: {
            "brew.build_ids": "20031234"
        }
    }
     */


    let where_str = []

    for(let key in filters){
        if (filters.hasOwnProperty(key)){
            if (key === "where"){
                for( let wherekey in filters[key]){
                    if(filters[key].hasOwnProperty(wherekey)){
                        if(filters[key][wherekey] !== undefined)
                            where_str.push(`\`${wherekey}\`=\"${filters[key][wherekey]}\"`)
                    }
                }
            }
        }
    }
    let where_cond;
    if (where_str.length === 0)
        where_cond = ""
    else
        where_cond = where_str.join(" and ");
    let data = {
        "where": where_cond,
        "limit": 100
    }

    if (filters.hasOwnProperty("next_token")){
        data["next_token"] = filters["next_token"];
    }

    const response = await fetch(process.env.REACT_APP_BUILD_ENDPOINT, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    return await response.json();
}
