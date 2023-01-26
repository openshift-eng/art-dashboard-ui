import {CheckOutlined, CloseOutlined, InfoCircleOutlined} from "@ant-design/icons";
import {Col, Empty, Pagination, Row, Table, Tooltip, Input, Select, Popover} from "antd";
import React from "react";

const {Search} = Input;
const {Option} = Select;

export default function BUILD_HISTORY_TABLE(props) {
    const text = "Partial search enabled. For exact search, enclose within quotes."

    const columns = [
        {
            title: () => {
                return (
                    <Row>
                        <Col span={24} className="left">
                            Build &nbsp;
                            <Popover content={text}>
                                <InfoCircleOutlined style={{color: "#1677ff"}}/>
                            </Popover>
                        </Col>
                        <Col span={24}>
                            <Search placeholder={"Build Id"} onSearch={props.onBuildNoChange}/>
                        </Col>
                    </Row>
                )
            },
            align: "center",
            dataIndex: "build_0_id",
            key: "build_0_id",
            render: (text, record) => {
                if (record["build_0_id"]) {
                    return (
                        <div>
                            <a href={process.env.NEXT_PUBLIC_BREW_BUILD_LINK + record["build_0_id"]}
                               target="_blank" rel="noopener noreferrer">
                                {record["build_0_id"]}
                            </a>
                        </div>
                    )
                } else {
                    return (
                        <div>
                            Not Available
                        </div>
                    )
                }
            }
        },
        {
            title: () => {
                return (
                    <Row>
                        <Col span={24} className="left">
                            Status
                        </Col>
                        <Col span={24}>
                            <Select style={{width: "100%"}} onChange={props.onBuildStatusChange}>
                                <Option value="success"><Tooltip title={"Success"}><CheckOutlined style={{color: "#52c41a"}}/></Tooltip></Option>
                                <Option value="failure"><Tooltip title={"Failure"}><CloseOutlined style={{color: "#f55d42"}}/></Tooltip></Option>
                                <Option value="">Both</Option>
                            </Select>
                        </Col>
                    </Row>
                )
            },
            dataIndex: "brew_faultCode",
            key: "brew_faultCode",
            align: "center",
            render: (text, record) => {
                if (record["brew_faultCode"] === 0) {
                    return (
                        <div>
                            <CheckOutlined style={{color: "#52c41a"}}/>
                        </div>
                    )
                } else {
                    return (
                        <div>
                            <Tooltip title={"Fault Code is " + record["brew_faultCode"]}>
                                <CloseOutlined style={{color: "#f55d42"}}/>
                            </Tooltip>
                        </div>
                    )
                }
            }
        },
        {
            title: () => {
                return (
                    <Row>
                        <Col span={24} className="left">
                            Task ID &nbsp;
                            <Popover content={text}>
                                <InfoCircleOutlined style={{color: "#1677ff"}}/>
                            </Popover>
                        </Col>
                        <Col span={24}>
                            <Search placeholder={"Task Id"} onSearch={props.onTaskIdChange}/>
                        </Col>
                    </Row>
                )
            },
            align: "center",
            dataIndex: "brew_task_id",
            key: "brew_task_id",
            render: (text, record) => {
                return (
                    <div>
                        <a href={process.env.NEXT_PUBLIC_BREW_TASK_LINK + record["brew_task_id"]}
                           target="_blank" rel="noopener noreferrer">{record["brew_task_id"]}</a>
                    </div>
                )
            }
        },
        {
            title: () => {
                return (
                    <Row>
                        <Col span={24} className="left">
                            Package Name &nbsp;
                            <Popover content={text}>
                                <InfoCircleOutlined style={{color: "#1677ff"}}/>
                            </Popover>
                        </Col>
                        <Col span={24}>
                            <Search placeholder={"Package Name"} onSearch={props.onPackageNameChange}/>
                        </Col>
                    </Row>
                )
            },
            align: "center",
            dataIndex: "dg_name",
            key: "dg_name"
        },
        {
            title: () => {
                return (
                    <Row>
                        <Col span={24} className="left">
                            Version &nbsp;
                            <Popover content={text}>
                                <InfoCircleOutlined style={{color: "#1677ff"}}/>
                            </Popover>
                        </Col>
                        <Col span={24}>
                            <Search placeholder={"Version"} onSearch={props.onVersionChange}/>
                        </Col>
                    </Row>
                )
            },
            key: "group",
            align: "center",
            dataIndex: "group",
            render: (data) => {
                return (
                    data.split("-")[1]
                )
            }
        },
        {
            title: () => {
                return (
                    <Row>
                        <Col span={24} className="left">
                            CGIT &nbsp;
                            <Popover content={text}>
                                <InfoCircleOutlined style={{color: "#1677ff"}}/>
                            </Popover>
                        </Col>
                        <Col span={24}>
                            <Search placeholder={"CGIT Id"} onSearch={props.onCgitChange}/>
                        </Col>
                    </Row>
                )
            },
            align: "center",
            dataIndex: "build_0_source",
            key: "build_0_source",
            render: (data, record) => {

                const http_link = "http://pkgs.devel.redhat.com/cgit/" + record["dg_namespace"] + "/" + record["dg_name"] + "/tree/?id=" + record["dg_commit"];
                return (
                    <a href={http_link} target="_blank" rel="noopener noreferrer">{record["dg_commit"]}</a>
                )

            }
        },
        {
            title: () => {
                return (
                    <Row>
                        <Col span={24} className="left">
                            Source Commit &nbsp;
                            <Popover content={text}>
                                <InfoCircleOutlined style={{color: "#1677ff"}}/>
                            </Popover>
                        </Col>
                        <Col span={24}>
                            <Search placeholder={"Full Git SHA"} onSearch={props.onSourceCommitChange}/>
                        </Col>
                    </Row>
                )
            },
            align: "center",
            dataIndex: "label_io_openshift_build_commit_url",
            key: "label_io_openshift_build_commit_url",
            render: (data, record) => {
                if (record["label_io_openshift_build_commit_url"] !== null)
                    return (
                        <a href={record["label_io_openshift_build_commit_url"]} target="_blank"
                           rel="noopener noreferrer">{record["label_io_openshift_build_commit_id"].slice(0, 8)}</a>
                    )
                else
                    return (
                        <p>Not Available</p>
                    )
            }
        },
        {
            title: () => {
                return (
                    <Row>
                        <Col span={24} className="left">
                            Jenkins Build &nbsp;
                            <Popover content={text}>
                                <InfoCircleOutlined style={{color: "#1677ff"}}/>
                            </Popover>
                        </Col>
                        <Col span={24}>
                            <Search placeholder={"Jenkins Build No"} onSearch={props.onJenkinsBuildChange}/>
                        </Col>
                    </Row>
                )
            },
            align: "center",
            dataIndex: "jenkins_build_url",
            key: "jenkins_build_url",
            render: (data, record) => {

                return (
                    <a href={data} target="_blank"
                       rel="noopener noreferrer">{record["jenkins_build_number"]}</a>
                )

            }
        },
        {
            title: () => {
                return (
                    <Row>
                        <Col span={24} className="left">
                            Time &nbsp;
                            <Popover content={"Partial search not possible"}>
                                <InfoCircleOutlined style={{color: "#1677ff"}}/>
                            </Popover>
                        </Col>
                        <Col span={24}>
                            <Search placeholder={"eg: 2022-08-01 | 18:52:36\n"} onSearch={props.onTimeChange}/>
                        </Col>
                    </Row>
                )
            },
            align: "center",
            dataIndex: "build_time_iso",
            key: "build_time_iso",
            render: (data) => {
                return (
                    data.substring(0, 10) + " | " + data.substring(11, 19)
                )
            }
        }
    ]


    return (
        props.data ?
            <div style={{padding: "30px"}}>
                <div>
                    <Table dataSource={props.data} columns={columns} pagination={false}/>
                    <div align={"right"} style={{paddingTop: "10px"}}>
                        <Pagination onChange={props.onChange} total={props.totalCount} pageSize={15}
                                    showSizeChanger={false}/>
                    </div>
                </div>

            </div>
            :
            <Empty/>
    );
}