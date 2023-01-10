import React, {Component} from "react";
import {Tag} from "antd";

export default class Search_filters_popover_tags extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: this.props.data
        }

        console.log(this.state.data);
    }

    UNSAFE_UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        this.setState({data: this.props.data})
        console.log(this.state.data);
    }

    render() {

        let tag_content = ""

        if ("name" in this.state.data) {
            tag_content += (this.state.data["name"] + " ");
        }

        if ("like_or_where" in this.state.data) {
            if (this.state.data.hasOwnProperty("like_or_where")) {
                if (this.state.data["like_or_where"] === "where") {
                    if ("cond" in this.state.data) {
                        tag_content += (this.state.data["cond"] + " ");
                    } else {
                        tag_content += ("= ");
                    }
                } else if (this.state.data["like_or_where"] === "like") {
                    tag_content += "like ";
                }
            }
        }

        if ("value" in this.state.data) {
            tag_content += (this.state.data["value"])
        }

        return (
            <Tag color="blue">
                {tag_content}
            </Tag>
        );
    }
}