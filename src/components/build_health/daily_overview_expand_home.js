import React, {Component} from "react";
import {
    get_expanded_data_for_a_date,
    get_expanded_data_for_a_date_and_fault_code
} from "../../api_calls/build_health_calls";
import StatisticsComp from "./statistics";
import {Row, Col, Progress} from "antd";
import {Divider} from "antd";
import Daily_overview_expanded_detailed_summary_table from "./daily_overview_expanded_detailed_summary_table";


export default class Daily_overview_expand_home extends Component {

    constructor(props) {
        super(props);
        this.state = {
            date: this.props.match.params.date
        }

        get_expanded_data_for_a_date(this.state.date).then(data => {
            this.setState({total: data["data"]["total"]});
            this.setState({success: data["data"]["success"]});
            this.setState({failure: data["data"]["failure"]});
            this.setState({success_rate: data["data"]["success_rate"]});
            this.setState({expanded_detail_summary_table_data: data["data"]["table_data"]})
        })

        get_expanded_data_for_a_date_and_fault_code(this.state.date).then(data => {
            console.log(data);
            this.setState({pie_chart_data: data["data"]})
        });
    }

    render() {
        return (
            <div style={{backgroundColor: "white", margin: "30px", padding: "30px"}}>
                <Divider>Statistics</Divider>
                <br/>
                <Row className="center">
                    <Col span={24}>
                        <StatisticsComp title="Date" value={this.state.date}/>
                    </Col>
                </Row>
                <br/>

                <Row className="center">
                    <Col span={6}>
                        <StatisticsComp title="Total Build Attempts" value={this.state.total}/>
                    </Col>
                    <Col span={6}>
                        <StatisticsComp title="Successful Builds" value={this.state.success}/>
                    </Col>
                    <Col span={6}>
                        <StatisticsComp title="Failed Builds" value={this.state.failure}/>
                    </Col>
                    <Col span={6}>
                        <p>Success Rate</p>
                        <Progress
                            type="circle"
                            strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068',
                            }}
                            percent={Math.round(this.state.success_rate)}
                        />
                    </Col>
                </Row>
                <br/>
                <Divider>Detail Summary</Divider>
                <Daily_overview_expanded_detailed_summary_table data={this.state.expanded_detail_summary_table_data}/>
            </div>
        )
    }

}