import React, {Component} from "react";
import {Table} from "antd";


export default class Daily_overview_expanded_detailed_summary_table extends Component{

    constructor(props) {
        super(props);
        this.state = {
            table_data: this.props.data
        }
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState({table_data: nextProps.data});
    }

    render() {

        const table_column = [
            {
                title: "Label Name",
                key: "label_name",
                dataIndex: "label_name"
            },
            {
                title: "Total Build Attempts",
                key: "total",
                dataIndex: "total"
            },
            {
                title: "Successful Builds",
                key: "success",
                dataIndex: "success"
            },
            {
                title: "Failed Builds",
                key: "failure",
                dataIndex: "failure"
            },
            {
                title: "Success Rate",
                key: "success_rate",
                dataIndex: "success_rate"
            }
        ]

        return(
            <div style={{padding: "30px"}}>
                <Table dataSource={this.state.table_data} columns={table_column} pagination={false}>
                </Table>
            </div>
        )
    }
}