import React, {Component} from "react";
import {Badge, Select, Table, Tag, Tooltip} from "antd";
import {AuditOutlined, DesktopOutlined} from "@ant-design/icons";
import {Link} from "react-router-dom";
import Openshift_version_select from "./openshift_version_select";
import {user_details_for_user_id} from "../../api_calls/release_calls";

const {Option} = Select;


export default class Release_branch_detail_table extends Component{

    constructor(props) {
        super(props);
        this.state = {
            data: []
        }

        this.transform_data(this.props.data).then((t_data)=> {
            console.log(JSON.stringify(t_data));
            this.setState({data: t_data});
        })
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.transform_data(nextProps.data).then((t_data)=>{
            this.setState({data: t_data});
        })
        // this.setState({data: this.transform_data(nextProps.data)});
    }

    async transform_data(table_data){

        let transformed_data = []
        table_data.forEach((data) => {
            let table_row = {}
            table_row["advisory_type"] = data["type"];
            table_row["publish_date"] = data["advisory_details"][0]["publish_date"];
            table_row["synopsis"] = data["advisory_details"][0]["synopsis"];
            table_row["errata_id"] = data["advisory_details"][0]["id"];
            table_row["release_date"] = data["advisory_details"][0]["release_date"];
            table_row["status"] = data["advisory_details"][0]["status"];
            table_row["qa_complete"] = data["advisory_details"][0]["qa_complete"];
            table_row["doc_complete"] = data["advisory_details"][0]["doc_complete"];
            table_row["security_approved"] = data["advisory_details"][0]["security_approved"];
            table_row["qe_reviewer_id"] = data["advisory_details"][0]["qe_reviewer_id"];

            if (data["advisory_details"][0]["qe_reviewer_details"] !== null){
                table_row["qe_reviewer_email_address"] = data["advisory_details"][0]["qe_reviewer_details"]["email_address"];
                table_row["qe_reviewer_realname"] = data["advisory_details"][0]["qe_reviewer_details"]["realname"];
            }else{
                table_row["qe_reviewer_email_address"] = "Not Available";
                table_row["qe_reviewer_realname"] = "Not Available";
            }

            table_row["doc_reviewer_id"] = data["advisory_details"][0]["doc_reviewer_id"];

            if (data["advisory_details"][0]["doc_reviewer_details"] !== null){
                table_row["doc_reviewer_email_address"] = data["advisory_details"][0]["doc_reviewer_details"]["email_address"];
                table_row["doc_reviewer_realname"] = data["advisory_details"][0]["doc_reviewer_details"]["realname"];
            }else{
                table_row["doc_reviewer_email_address"] = "Not Available";
                table_row["doc_reviewer_realname"] = "Not Available";
            }

            table_row["product_security_reviewer_id"] = data["advisory_details"][0]["product_security_reviewer_id"];

            if (data["advisory_details"][0]["product_security_reviewer_details"] !== null){
                table_row["product_security_reviewer_email_address"] = data["advisory_details"][0]["product_security_reviewer_details"]["email_address"];
                table_row["product_security_reviewer_realname"] = data["advisory_details"][0]["product_security_reviewer_details"]["realname"];
            }else{
                table_row["product_security_reviewer_email_address"] = "Not Available";
                table_row["product_security_reviewer_realname"] = "Not Available";
            }

            table_row["bug_summary"] = data["bug_summary"];

            transformed_data.push(table_row);
        });
        return transformed_data;
    }

    render() {

        const table_column = [
            {
                title: "Advisory Type",
                key: "advisory_type",
                dataIndex: "advisory_type",
                render: (data, record) => {
                    return(
                        <div>
                            <Link to={`/release/advisory/overview/${record["errata_id"]}`}>
                                <Tooltip title={record["synopsis"]}>
                                    {data[0].toUpperCase() + data.slice(1)}
                                </Tooltip>
                            </Link>
                        </div>
                    )
                }
            },
            {
                title: "Advisory Details",
                children: [
                    {
                        title: "Errata ID",
                        key: "errata_id",
                        dataIndex: "errata_id",
                        render: data => {
                            return (
                                <div>
                                    <a href={"https://errata.devel.redhat.com/advisory/" + data} target="_blank" rel="noopener noreferrer"><Tooltip title={"Errata Advisory Link"}>{
                                        data}</Tooltip></a>
                                </div>
                            )
                        }
                    },
                    {
                        title: "Advisory Status",
                        key: "status",
                        dataIndex: "status",
                        render: (data) => {
                            return(
                                <div>
                                    <Tag color={"green"}>
                                        {data}
                                    </Tag>
                                </div>
                            )
                        }
                    },
                    {
                        title: "Release Date",
                        key: "publish_date",
                        dataIndex: "publish_date",
                    }
                ]
            },
            {
                title: "Doc",
                children: [
                    {
                        title: "Doc Approval",
                        key: "doc_complete",
                        dataIndex: "doc_complete",
                        render: data => {
                            if(data === "Approved"){
                                return (
                                    <Tag color={"green"}>{data}</Tag>
                                )
                            }else if(data === "Requested"){
                                return(
                                    <Tag color={"blue"}>{data}</Tag>
                                )
                            }else{
                                return(
                                    <Tag color={"red"}>{data}</Tag>
                                )
                            }
                        }
                    },
                    {
                        title: "Doc Reviewer",
                        children: [
                            {
                                title: "Name",
                                key: "doc_reviewer_realname",
                                dataIndex: "doc_reviewer_realname",
                                render: (data, record) => {

                                    if(data === null){
                                        return(<p>Not Available</p>)
                                    }else{
                                        return(<p>{data}</p>)
                                    }
                                }
                            },
                            {
                                title: "Email",
                                key: "doc_reviewer_email_address",
                                dataIndex: "doc_reviewer_email_address",
                                render: (data, record) => {

                                    if(data === null){
                                        return(<p>Not Available</p>)
                                    }else{
                                        return(<p>{data}</p>)
                                    }
                                }
                            }
                        ]

                    }

                ]
            },
            {
                title: "Product Security",
                children: [
                    {
                        title: "Security Approval",
                        key: "security_approved",
                        dataIndex: "security_approved",
                        render: data => {
                            if(data === "Approved"){
                                return (
                                    <Tag color={"green"}>{data}</Tag>
                                )
                            }else if(data === "Requested"){
                                return(
                                    <Tag color={"blue"}>{data}</Tag>
                                )
                            }else{
                                return(
                                    <Tag color={"red"}>{data}</Tag>
                                )
                            }
                        }
                    },
                    {
                      title: "Reviewer",
                      children: [
                          {
                              title: "Name",
                              key: "product_security_reviewer_realname",
                              dataIndex: "product_security_reviewer_realname",
                              render: (data, record) => {
                                  if (record["product_security_reviewer_realname"] == null){
                                      return(<div>
                                          <p>Not Available</p>
                                      </div>)
                                  }else{
                                      return(<div>
                                          <p>{data}</p>
                                      </div>)
                                  }
                              }
                          },
                          {
                              title: "Email",
                              key: "product_security_reviewer_email_address",
                              dataIndex: "product_security_reviewer_email_address",
                              render: (data, record) => {
                                  if (record["product_security_reviewer_email_address"] == null){
                                      return(<div>
                                          <p>Not Available</p>
                                      </div>)
                                  }else{
                                      return(<div>
                                          <p>{data}</p>
                                      </div>)
                                  }
                              }
                          }
                      ]
                    }

                ]
            },
            {
                title: "Bugs",
                key: "bug_summary",
                dataIndex: "bug_summary",
                render: (bug_summary) => (
                    <span>
                        {bug_summary.map((bug_status) => {
                            let color = "red";
                            if(bug_status["bug_status"] === "CLOSED" || bug_status["bug_status"] === "VERIFIED"){
                                color = "green";
                            }else if(bug_status["bug_status"] === "ON_QA"){
                                color = "blue";
                            }else{
                                color = "red";
                            }

                            return(
                                <div>
                                    <Badge count={bug_status["count"]}>
                                        <Tag color={color} key={bug_status["bug_status"]}>
                                            {bug_status["bug_status"]}
                                        </Tag>
                                    </Badge>
                                    <br/>
                                    <br/>
                                </div>
                                );
                            })
                        }
                    </span>
                )
            }
        ]

        return (
            <div style={{padding: "40px"}}>
                <Table
                    dataSource={this.state.data}
                    columns={table_column}
                    bordered pagination={false}
                    title={() => <Openshift_version_select style={{flex:1}}/>}/>
            </div>
        );
    }

}