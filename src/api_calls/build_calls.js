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

export async function get_build_data_witt_filters(filters, order=null) {

    /*
    expect filters to be in following format

    {
        where: {
            "brew.build_ids": "20031234"
        }
    }
     */

    /*
    Latest Followed Format:

    {
	"where": {
		"brew.build_ids": [{
			"value": "1206338",
			"like_or_where": "where"
		}],
		"build.0.package_id": [{
			"value": "67164",
			"like_or_where": "where"
		}]
	},
	"limit": 100,
	"next_token": ""
}

     */

    console.log(JSON.stringify(filters));

    let where_str = []

    for(let key in filters){
        if (filters.hasOwnProperty(key)){
            if (key === "where"){
                for( let wherekey in filters[key]){
                    if(filters[key].hasOwnProperty(wherekey)){
                        if(filters[key][wherekey] !== undefined){
                            filters[key][wherekey].forEach((value, index) =>{
                                if(value["like_or_where"] === "where"){
                                    if( "cond" in value){
                                        where_str.push(`\`${wherekey}\`${value["cond"]}\"${value["value"]}\"`);
                                    }else{
                                        where_str.push(`\`${wherekey}\`=\"${value["value"]}\"`);
                                    }
                                }else if(value["like_or_where"] === "like"){
                                    where_str.push(`\`${wherekey}\` like \"%${value["value"]}%\"`)
                                }
                            })

                        }
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

    if (order !== null){
        data["order_by"] = order;
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

export async function auto_complete_nvr() {

    const response = await fetch(process.env.REACT_APP_AUTOCOMPLETE_FOR_NVR, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        }
    });

    return await response.json();

}

export async function get_builds(request_params){

    console.log(request_params);

    const response = await fetch(process.env.REACT_APP_BUILD_MYSQL_ENDPOINT, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        },
        body: JSON.stringify(request_params)
    });

    return await response.json();

}