import React, {Component} from "react";
import {advisory_ids_for_branch} from "../../api_calls/release_calls";
import {Table} from "antd";
import {LinkOutlined} from "@ant-design/icons";
import {Link} from "react-router-dom";


export default class Release_branch_detail extends Component{

    constructor(props) {
        super(props);
        this.state = {
            branch: this.props.branch_name,
            overview_table_data: []
        }

        advisory_ids_for_branch(this.state.branch).then((data) => {
            let table_data = [];
            for(const key in data){
                if(data.hasOwnProperty(key))
                    table_data.push({type: key, id: data[key], advisory_link: "https://errata.devel.redhat.com/advisory/" + data[key]})
            }
            this.setState({overview_table_data: table_data})
        })

    }


    render() {



        const overview_table_columns = [
            {
                title: "Advisory ID",
                key: "id",
                dataIndex: "id",
                align: "center",
                render: (data, record) => {
                    return (
                        <div>
                            <Link to={`/release/advisory/overview/${record["id"]}`}>
                                {record["id"]}
                            </Link>
                        </div>
                    )
                }
            },
            {
                title: "Advisory Type",
                key: "type",
                dataIndex: "type",
                align: "center",

            },
            {
                title: "Advisory Link",
                key: "advisory_link",
                dataIndex: "advisory_link",
                align: "center",
                render: (data, record) =>{
                    return (
                        <div>
                            <p><a href={record["advisory_link"]} target="_blank" rel="noopener noreferrer">{<LinkOutlined/>}</a></p>
                        </div>
                    )
                }
            }
        ]

        return(
            <div>
                <Table
                    title= {(currentDataSource) => {
                        return <h3 className="center">All Advisories for {this.state.branch}</h3>
                    }}
                    dataSource={this.state.overview_table_data}
                    columns={overview_table_columns}
                    style={{padding: "30px"}}
                    pagination={false}
                />
            </div>
        )
    }

}