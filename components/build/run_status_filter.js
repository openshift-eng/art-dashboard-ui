import React, {Component} from "react";
import {Select} from "antd";

const {Option} = Select;


export default class Run_status_filter extends Component{

    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    onChange(value){

        let cond = null;
        if (value === "=0"){
            cond = "=";
        }else{
            cond = "!="
        }
        let where_cond = { "brew_faultCode": [{"value": "0", "cond": cond, "like_or_where": "where", "name": "Build Status"}]}
        this.props.search_callback(where_cond);
    }

    render() {
        return (
            <div>
                <Select style={{width: "100%"}} onChange={this.onChange}>
                    <Option value="=0">Success</Option>
                    <Option value="!=0">Failure</Option>
                </Select>
            </div>
        );
    }

}