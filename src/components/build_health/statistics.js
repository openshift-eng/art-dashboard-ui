import React, {Component} from "react";
import {Statistic} from "antd";


export default class StatisticsComp extends Component {
    constructor(props) {
        super(props);

        this.state = {
            title: this.props.title,
            value: this.props.value
        }
    }

    UNSAFE_UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        this.setState({title: nextProps.title});
        this.setState({value: nextProps.value});
    }

    render() {
        return (
            <div>
                <Statistic title={this.state.title} value={this.state.value}/>

            </div>
        )
    }
}