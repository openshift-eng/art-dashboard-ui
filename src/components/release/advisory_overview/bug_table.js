import React, {Component} from "react";
import LinkOutlined from "@ant-design/icons/lib/icons/LinkOutlined";
import {Table} from "antd";


export default class Bug_table extends Component {
    constructor(props) {
        super(props);

        this.state = {
            data: []
        }

        this.setState({data: this.props.data});
    }

    UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        this.setState({data: nextProps.data});
    }

    render() {

        const table_column = [
            {
                title: "Bug ID",
                key: "id",
                dataIndex: "id",
            },
            {
                title: "Bug Status",
                key: "bug_status",
                dataIndex: "bug_status"
            },
            {
                title: "Bugzilla Link",
                key: "bug_link",
                dataIndex: "bug_link",
                render: (data, record) => {
                    return (
                        <div>
                            <a href={record["bug_link"]} target="_blank" rel="noopener noreferrer"><LinkOutlined/></a>
                        </div>
                    )
                }
            }
        ]

        return (
            <div>
                <Table dataSource={this.state.data} columns={table_column}/>
            </div>
        );
    }
}