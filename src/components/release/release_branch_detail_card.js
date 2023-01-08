import React, {Component} from "react";
import {Card, Col, Row, Tag, Result, Tooltip} from "antd";
import Approval_status_tag from "./approval_status_tag";
import Release_branch_detail_card_bug_summary_table from "./release_branch_detail_card_bug_summary_table";
import {AuditOutlined, DesktopOutlined} from "@ant-design/icons";
import {Link} from "react-router-dom";


export default class Release_branch_detail_card extends Component {

    constructor(props) {
        super(props);

        this.state = {
            data: this.props.data
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        this.setState({data: nextProps.data});
    }

    get_step_number(status) {
        let step = 0

        if (status === "Unknown")
            step = 0
        else if (status === "Not Requested")
            step = 1
        else if (status === "Requested")
            step = 2
        else if (status === "Approved")
            step = 3

        return step;
    }

    render() {

        const qa_complete = this.state.data["advisory_details"][0]["qa_complete"]
        const doc_complete = this.state.data["advisory_details"][0]["doc_complete"]
        const security_approved = this.state.data["advisory_details"][0]["security_approved"]


        let qa_step = this.get_step_number(qa_complete)
        let doc_step = this.get_step_number(doc_complete)
        let security_step = this.get_step_number(security_approved)

        return (
            <div style={{padding: "40px"}}>
                <Card hoverable={true}
                      extra={this.state.data["advisory_details"][0]["synopsis"]}
                      title={this.state.data.type[0].toUpperCase() + this.state.data.type.slice(1)}
                      actions={[
                          <a href={"https://errata.devel.redhat.com/advisory/" + this.state.data["advisory_details"][0]["id"]}
                             target="_blank" rel="noopener noreferrer"><Tooltip
                              title={"Errata Advisory Link"}><DesktopOutlined/></Tooltip></a>,
                          <Link to={`/release/advisory/overview/${this.state.data["advisory_details"][0]["id"]}`}>
                              <Tooltip title={"Advisory Overview"}>
                                  <AuditOutlined/>
                              </Tooltip>
                          </Link>
                      ]}>

                    <Row className={"center"}>
                        <Col span={8}>
                            <p>Errata Id</p>
                            <Tag color={"red"}>{this.state.data["advisory_details"][0]["id"]}</Tag>
                        </Col>
                        <Col span={8}>
                            <p>Advisory Status</p>
                            <Tag color="geekblue">{this.state.data["advisory_details"][0]["status"]}</Tag>
                        </Col>
                        <Col span={8}>
                            <p>Release Date</p>
                            <Tag color="green">{this.state.data["advisory_details"][0]["release_date"]}</Tag>
                        </Col>
                    </Row>
                    <br/>
                    <Row className={"center"}>
                        <Col span={8}>
                            <p>QE Status</p>
                            <Approval_status_tag result={qa_step} result_for={"QE Approval"}/>
                        </Col>
                        <Col span={8}>
                            <p>Doc Status</p>
                            <Approval_status_tag result={doc_step} result_for={"Doc Approval"}/>
                        </Col>
                        <Col span={8}>
                            <p>Security Status</p>
                            <Approval_status_tag result={security_step} result_for={"Security Approval"}/>
                        </Col>
                    </Row>
                    <br/>
                    <Row className={"center"}>
                        <Col span={8}>
                            <p>QE Reviewer</p>
                            {this.state.data.advisory_details[0].qe_reviewer_id === null &&
                                <Tag color={"red"}>Not Available</Tag>}
                            {this.state.data.advisory_details[0].qe_reviewer_id !== null && <Tag color={"green"}><a
                                href={"https://errata.devel.redhat.com/user/" + this.state.data.advisory_details[0].qe_reviewer_id}
                                target="_blank"
                                rel="noopener noreferrer">{this.state.data.advisory_details[0].qe_reviewer_id}</a></Tag>}
                        </Col>
                        <Col span={8}>
                            <p>Doc Reviewer</p>
                            {this.state.data.advisory_details[0].doc_reviewer_id === null &&
                                <Tag color={"red"}>Not Available</Tag>}
                            {this.state.data.advisory_details[0].doc_reviewer_id !== null && <Tag color={"green"}><a
                                href={"https://errata.devel.redhat.com/user/" + this.state.data.advisory_details[0].doc_reviewer_id}
                                target="_blank"
                                rel="noopener noreferrer">{this.state.data.advisory_details[0].doc_reviewer_id}</a></Tag>}
                        </Col>
                        <Col span={8}>
                            <p>Security Reviewer</p>
                            {this.state.data.advisory_details[0].product_security_reviewer_id === null &&
                                <Tag color={"red"}>Not Available</Tag>}
                            {this.state.data.advisory_details[0].product_security_reviewer_id !== null &&
                                <Tag color={"green"}><a
                                    href={"https://errata.devel.redhat.com/user/" + this.state.data.advisory_details[0].product_security_reviewer_id}
                                    target="_blank"
                                    rel="noopener noreferrer">{this.state.data.advisory_details[0].product_security_reviewer_id}</a></Tag>}
                        </Col>
                    </Row>
                    <br/>
                    <br/>
                    <Row>
                        <Col span={24}>
                            <Release_branch_detail_card_bug_summary_table data={this.state.data.bug_summary}/>
                        </Col>
                    </Row>
                </Card>
            </div>
        );
    }

}
