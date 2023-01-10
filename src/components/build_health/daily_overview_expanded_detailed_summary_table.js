import React, {Component} from "react";
import {Table, Input} from "antd";
import {Link} from "react-router-dom";


export default class Daily_overview_expanded_detailed_summary_table extends Component {

    constructor(props) {
        super(props);
        this.state = {
            table_data: this.props.data,
            label_name_filter: []

        }

        let label_name_filter = this.generate_column_filter("label_name", this.props.data)
        this.setState({label_name_filter: label_name_filter})

    }

    generate_column_filter(column_name, data) {
        let all_values = {}
        let filter = []

        if (data !== undefined) {
            data.forEach((val) => {
                if (!(all_values.hasOwnProperty(val[column_name]))) {
                    all_values[val[column_name]] = 1;
                    filter.push({text: val[column_name], value: val[column_name]})
                }
            });
        }


        return filter;
    }

    UNSAFE_UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        this.setState({table_data: nextProps.data});
        this.setState({label_name_filter: this.generate_column_filter("label_name", nextProps.data)})
    }

    render_single_digit_to_double_datetime(digit) {
        digit = digit.toString()
        if (digit.length === 1) {
            return "0" + digit;
        }
        return digit;

    }

    render() {

        const table_column = [
            {
                title: "Label Name",
                key: "label_name",
                dataIndex: "label_name",
                filters: this.state.label_name_filter,
                onFilter: (value, record) => record.label_name === value,
                render: (data, record) => {

                    return (
                        <Link
                            to={`/health/daily/build/${record.date}?type=column_search&column=label_name&value=${record.label_name}`}>{record.label_name}</Link>
                    )
                }
            },
            {
                title: "Total Build Attempts",
                key: "total",
                dataIndex: "total",
                sorter: (a, b) => a.total - b.total
            },
            {
                title: "Successful Builds",
                key: "success",
                dataIndex: "success",
                sorter: (a, b) => a.success - b.success
            },
            {
                title: "Failed Builds",
                key: "failure",
                dataIndex: "failure",
                sorter: (a, b) => a.failure - b.failure
            },
            {
                title: "Success Rate",
                key: "success_rate",
                dataIndex: "success_rate",
                sorter: (a, b) => a.success_rate - b.success_rate
            }
        ]

        return (
            <div>
                <Table dataSource={this.state.table_data} columns={table_column} pagination={false}>
                </Table>
            </div>
        )
    }
}