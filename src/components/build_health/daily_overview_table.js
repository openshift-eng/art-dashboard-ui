import React, {Component} from "react";
import {get_daily_overview_data} from "../../api_calls/build_health_calls";
import {Pagination, Table} from "antd";
import {BrowserRouter as Router, Link, Route, Switch, Redirect} from "react-router-dom";


export default class Daily_overview_table extends Component{

    constructor(props) {
        super(props);
        this.state = {
            table_data: []
        }

        get_daily_overview_data().then(data => {
            this.setState({table_data: data["data"]})
        });
    }

    render() {

        const table_columns = [
            {
                title: "Date",
                dataIndex: "date",
                key: "date",
                render: (data, record) => {
                    return (
                            <div>
                                <Link to={`/health/daily/detail/${record["date"]}`}>
                                    <p>{record["date"]}</p>
                                </Link>
                            </div>
                    )
                }
            },{
                title: "Total Builds",
                dataIndex: "total",
                key: "total"
            },{
                title: "Successful Builds",
                dataIndex: "success",
                key: "success"
            },{
                title: "Failed Builds",
                dataIndex: "failure",
                key: "failure"
            },{
                title: "Build Success Rate",
                dataIndex: "success_rate",
                key: "success_rate"
            },{
                title: "Build History",
                render: (data, record) => {
                    return(
                        <div>
                            <Link to={`/health/daily/build/${record["date"]}/?type=all`}>
                                <p>{record["date"]}</p>
                            </Link>
                        </div>
                    )
                }
            }
        ]

        return(
                <div
                    style={{padding: "30px"}}>
                    <Table dataSource={this.state.table_data}
                           columns={table_columns}
                           pagination={<Pagination defaultCurrent={0}/>}
                    />
                </div>
        )
    }

}