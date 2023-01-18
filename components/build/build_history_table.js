import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import {Empty, Pagination, Table, Tooltip} from "antd";
import React from "react";


export default function BUILD_HISTORY_TABLE(props) {


    const columns = [
        {
            title: 'Build',
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
            title: "Status",
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
            title: "Task ID",
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
            title: "Package Name",
            align: "center",
            dataIndex: "dg_name",
            key: "dg_name"
        },
        {
            title: "Version",
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
            title: "CGIT",
            align: "center",
            dataIndex: "build_0_source",
            key: "build_0_source",
            render: (data, record) => {

                const http_link = "http://pkgs.devel.redhat.com/cgit/" + record["dg_namespace"] + "/" + record["dg_name"] + "/tree/?id=" + record["dg_commit"];
                return (
                    <a href={http_link} target="_blank" rel="noopener noreferrer">{"#" + record["dg_commit"]}</a>
                )

            }
        },
        {
            title: "Source Commit",
            align: "center",
            dataIndex: "label_io_openshift_build_commit_url",
            key: "label_io_openshift_build_commit_url",
            render: (data, record) => {
                if (record["label_io_openshift_build_commit_url"] !== null)
                    return (
                        <a href={record["label_io_openshift_build_commit_url"]} target="_blank"
                           rel="noopener noreferrer">{"#" + record["label_io_openshift_build_commit_url"].slice(-8)}</a>
                    )
                else
                    return (
                        <p>Not Available</p>
                    )
            }
        },
        {
            title: "Time",
            align: "center",
            dataIndex: "build_time_iso",
            key: "build_time_iso",
            render: (data) => {
                return (
                    data.substring(11, 16) + " | " + data.substring(0, 10)
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