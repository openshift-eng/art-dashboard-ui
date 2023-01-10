import React, {Component} from "react";
import {Table} from "antd";


export default class Release_branch_detail_card_bug_summary_table extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: this.props.data
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        this.setState({data: nextProps.data})
    }

    render() {

        const table_column = [
            {
                title: "Bug Status",
                id: "bug_status",
                dataIndex: "bug_status",
                align: "center"
            },
            {
                title: "Status Count",
                id: "count",
                dataIndex: "count",
                align: "center"
            },
            {
                title: "Percentage Share",
                id: "percent",
                dataIndex: "percent",
                align: "center"
            }
        ]

        return (
            <div className={"center"}>
                <Table title={() => {
                    return <h6 className={"left"}>{"Bugs Summary"}</h6>
                }} dataSource={this.state.data} columns={table_column} pagination={false}/>
            </div>
        );
    }

}