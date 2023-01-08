import React, {Component} from "react";
import {Statistic} from "antd";

const {Countdown} = Statistic;

export default class Github_rate_limit_status_bar_countdown extends Component {

    render() {
        return (
            <div>
                <Countdown title="Minutes to reset" value={Date.now() + parseInt(this.props.minutes) * 60 * 1000}
                           format='mm'/>
            </div>
        )
    }
}