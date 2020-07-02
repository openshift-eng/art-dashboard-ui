import React, {Component} from "react";
import {Table} from "antd";
import {get_release_branches_from_ocp_build_data} from "../../../api_calls/release_calls";
import Github_rate_limit_status_bar from "./github_rate_limit_status_bar";


export default class Release_status_table extends Component{

    constructor(props) {
        super(props);

        this.state = {
            table_data: []
        }

        get_release_branches_from_ocp_build_data().then(data => {
            this.setState({table_data: data})
        })

    }

    render() {

        const table_column = [
            {
                key: "name",
                dataIndex: "name",
                title: "OpenShift Branch",
                align: "center"
            },
            {
                key: "version",
                dataIndex: "version",
                title: "OpenShift Version",
                align: "center"
            }
        ]


        return (
            <div>
                <Table dataSource={this.state.table_data}
                       columns={table_column}
                       style={{padding: "30px"}}
                       bordered
                       pagination={false}
                />
            </div>
        );
    }

}