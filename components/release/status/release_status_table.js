import React, {Component} from "react";
import {Table} from "antd";
import {Link} from "react-router-dom";


export default class Release_status_table extends Component {

    constructor(props) {
        super(props);

        this.state = {
            table_data: this.props.data
        }


    }

    UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        this.setState({table_data: nextProps.data});
    }

    render() {

        const table_column = [
            {
                key: "name",
                dataIndex: "name",
                title: "OpenShift Branch",
                align: "center",
                render: (data, record) => {
                    return (
                        <div>
                            <Link to={`/release/status/detail/${record["name"]}`}>{record["name"]}</Link>
                        </div>
                    )
                }
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
                <Table
                    dataSource={this.state.table_data}
                    columns={table_column}
                    style={{padding: "30px"}}
                    bordered
                    pagination={false}
                />
            </div>
        );
    }

}