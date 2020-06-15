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

    /*
    Latest Followed Format:

    {
	"where": {
		"brew.build_ids": {
			"value": "1206338",
			"like_or_where": "where"
		},
		"build.0.package_id": {
			"value": "67164",
			"like_or_where": "where"
		}
	},
	"limit": 100,
	"next_token": ""
}

     */



    let where_str = []

    for(let key in filters){
        if (filters.hasOwnProperty(key)){
            if (key === "where"){
                for( let wherekey in filters[key]){
                    if(filters[key].hasOwnProperty(wherekey)){
                        if(filters[key][wherekey] !== undefined){
                            if(filters[key][wherekey]["like_or_where"] === "where"){
                                where_str.push(`\`${wherekey}\`=\"${filters[key][wherekey]["value"]}\"`)
                            }else if(filters[key][wherekey]["like_or_where"] === "like"){
                                where_str.push(`\`${wherekey}\` like \"%${filters[key][wherekey]["value"]}%\"`)
                            }
                        }
                            //where_str.push(`\`${wherekey}\`=\"${filters[key][wherekey]}\"`)
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
