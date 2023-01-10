import React, {Component} from "react";
import {Statistic} from "antd";

export default class Statistics_components extends Component {

    render() {
        return (
            <div>
                <Statistic title={this.props.title} value={this.props.value}/>
            </div>
        )
    }
}