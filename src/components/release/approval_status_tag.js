import React, {Component} from "react";
import {Tag} from "antd";


export default class Approval_status_tag extends Component {

    constructor(props) {
        super(props);
        this.state = {
            result: this.props.result,
            result_for: this.props.result_for
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        this.setState({result: nextProps.result});
        this.setState({result_for: nextProps.result_for});
    }

    render() {

        const result = this.state.result;

        if (result === 0) {
            return (
                <div>
                    <Tag color={"red"}>{"Unknown"}</Tag>
                </div>
            )
        } else if (result === 1) {
            return (
                <div>
                    <Tag color={"orange"}>{"Not Requested"}</Tag>
                </div>
            )
        } else if (result === 2) {
            return (
                <div>
                    <Tag color={"blue"}>{"Requested"}</Tag>
                </div>
            )
        } else if (result === 3) {
            return (
                <div>
                    <Tag color={"green"}>{"Approved"}</Tag>
                </div>
            )
        } else {
            return (
                <div>
                    <Tag color={"red"}>{"Unknown"}</Tag>
                </div>
            )
        }
    }

}