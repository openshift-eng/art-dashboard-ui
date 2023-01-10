import React, {Component} from "react";
import {Col, notification, Row} from "antd";
import {remaining_git_requests} from "../../../api_calls/release_calls";
import STATISTICS_COMPONENTS from "./statistics_components";
import GITHUB_RATE_LIMIT_STATUS_BAR_COUNTDOWN from "./github_rate_limit_status_bar_countdown";
import {InfoCircleOutlined} from "@ant-design/icons";


export default class Github_rate_limit_status_bar extends Component {

    constructor(props) {
        super(props);

        this.state = {
            total: 0,
            remaining: 0,
            time_to_reset_secs: 0,
            time_to_reset_mins: 0,
        }

        remaining_git_requests().then(data => {
            this.setState({
                total: data["limit"],
                remaining: data["remaining"],
                time_to_reset_secs: data["reset_secs"],
                time_to_reset_mins: data["reset_mins"]
            })
        })
    }

    UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        remaining_git_requests().then(data => {
            console.log(data);
            this.setState({
                total: data["limit"],
                remaining: data["remaining"],
                time_to_reset_secs: data["reset_secs"],
                time_to_reset_mins: data["reset_mins"]
            })
        });
    }

    openNotification = () => {
        const args = {
            message: 'GitHub Rate Limit Stats',
            description:
                'The numbers shows rate limits stats for the github developer APIs used to get release content. The total represents the number of' +
                ' API hits allowed per hour. Time to reset represents time before the quota refreshes.',
            duration: 0,
        };
        notification.open(args);
    };

    render() {
        return (
            <div>
                <Row style={{padding: "30px"}} className="center">
                    <Col span={23}>
                        <p>GitHub Developer API Quota Stats</p>
                    </Col>
                    <Col span={1}>
                        <InfoCircleOutlined className="right" onClick={this.openNotification}/>
                    </Col>
                </Row>
                <Row style={{padding: "30px"}}>
                    <Col span={8}>
                        <STATISTICS_COMPONENTS title="Total" value={this.state.total}/>
                    </Col>
                    <Col span={8}>
                        <STATISTICS_COMPONENTS title="Remaining" value={this.state.remaining}/>
                    </Col>
                    <Col span={8}>
                        <GITHUB_RATE_LIMIT_STATUS_BAR_COUNTDOWN minutes={this.state.time_to_reset_mins}/>
                    </Col>
                </Row>
            </div>
        )
    }
}