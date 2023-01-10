import React, {Component} from 'react';
import {Alert} from "antd";


export default class BuildAlert extends Component {

    render() {
        return (
            <Alert message={this.props.message} type={this.props.type} closable onClick={this.props.close_func}/>
        )
    }
}