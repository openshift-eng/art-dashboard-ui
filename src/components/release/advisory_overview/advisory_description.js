import React, {Component} from "react";
import {Descriptions} from "antd";


export default class Advisory_description extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: []
        }

        this.update_data(this.props);
    }

    update_data(props) {
        if (props.data.length >= 1) {
            this.setState({data: props.data[0]})
        } else {
            this.setState({data: []})
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        this.update_data(nextProps);
    }

    render() {
        return (
            <div>
                <Descriptions title={this.state.data.id}>

                    <Descriptions.Item label={"Advisory Type"}>
                        {this.state.data.advisory_type}
                    </Descriptions.Item>

                    <Descriptions.Item label={"Advisory Status"}>
                        {this.state.data.status}
                    </Descriptions.Item>

                    <Descriptions.Item label={"Advisory Synopsis"}>
                        {this.state.data.synopsis}
                    </Descriptions.Item>

                    <Descriptions.Item label={"QA Status"}>
                        {this.state.data.qa_complete}
                    </Descriptions.Item>

                    <Descriptions.Item label={"Docs Status"}>
                        {this.state.data.doc_complete}
                    </Descriptions.Item>

                    <Descriptions.Item label={"Security Approval"}>
                        {this.state.data.security_approved}
                    </Descriptions.Item>

                    <Descriptions.Item label={"Release Date"}>
                        {this.state.data.release_date}
                    </Descriptions.Item>

                </Descriptions>
            </div>
        );
    }

}