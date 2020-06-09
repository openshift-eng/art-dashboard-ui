import React, {Component} from "react";
import {Descriptions} from "antd";


export default class BuildDescription extends Component{

    constructor(props) {
        super(props);
        this.setState(this.props.description_data)
    }

    render() {
        return (
            <Descriptions title="Build Description">
                {/*<Descriptions.Item label="Image SHAs">{this.state["build.image_shas"]}</Descriptions.Item>*/}
                 <Descriptions.Item label="Something">{this.state}</Descriptions.Item>
            </Descriptions>
        );
    }
}