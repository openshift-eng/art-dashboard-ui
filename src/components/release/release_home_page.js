import React, {Component} from "react";
import Release_status_table from "./status/release_status_table";
import Github_rate_limit_status_bar from "./status/github_rate_limit_status_bar";
import {Col, Row} from "antd";


export default class Release_home_page extends Component{
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <Row style={{backgroundColor: "white", margin: "30px", marginBottom: "0px"}} className="center">
                    <Col span={24}>
                        <Github_rate_limit_status_bar/>
                    </Col>
                </Row>
                <Release_status_table/>
            </div>
        );
    }
}

