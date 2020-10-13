import React, {Component} from "react";
import {message, Table} from "antd";
import { Typography } from 'antd';
import {DeleteColumnOutlined, DeleteOutlined, EditOutlined, ExpandOutlined} from "@ant-design/icons";
import Update_incident_drawer from "./update_incident_drawer";
import Detailed_view_modal from "./detailed_view_modal";
import Popconfirm from "antd/es/popconfirm";
import {delete_incident} from "../../api_calls/incident_calls";

const { Paragraph, Text } = Typography;


export default class Incident_table extends Component{

    constructor(props) {
        super(props);
        this.state = {
            data: this.props.data["data"]
        }

        this.hide_incident_update_view = this.hide_incident_update_view.bind(this);
        this.show_incident_update_view = this.show_incident_update_view.bind(this);
        this.show_incident_detailed_view = this.show_incident_detailed_view.bind(this);
        this.hide_incident_detailed_view = this.hide_incident_detailed_view.bind(this);
        this.delete_incident_view = this.delete_incident_view.bind(this);
        this.cancel_delete = this.cancel_delete.bind(this);
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState({data: nextProps.data["data"]})
    }

    show_incident_detailed_view(record){
        let state_val = "visible_modal_"+record["pk"];
        let state_var = {}
        state_var[state_val] = true;
        this.setState(state_var);
    }

    hide_incident_detailed_view(record){
        let state_val = "visible_modal_"+record["pk"];
        let state_var = {}
        state_var[state_val] = false;
        this.setState(state_var);
    }

    show_incident_update_view(record){
        let state_val = "visible_update_"+record["pk"];
        let state_var = {}
        state_var[state_val] = true;
        this.setState(state_var);
    }

    hide_incident_update_view(record){
        let state_val = "visible_update_"+record["log_incident_id"];
        let state_var = {}
        state_var[state_val] = false;
        this.setState(state_var);
    }

    delete_incident_view(event){
        console.log(event)
    }

    cancel_delete(record){
        alert("No delete" + record["pk"]);
    }

    render() {

        const columns = [
            {
              title: "Incident ID",
              key: "pk",
              dataIndex: "pk"
            },
            {
                title: "Start Time",
                render: (data, record) => {
                    let start_time = null;
                    if (record["fields"]["incident_start"] === null){
                        start_time = "Not Available";
                    }else{
                        start_time = record["fields"]["incident_start"];
                        start_time = start_time.split("Z")[0];
                        start_time = start_time.split("T");
                        start_time = start_time[0] + " " + start_time[1].split(".")[0];
                    }
                    return (
                        <div>
                            <p>{start_time}</p>
                        </div>
                    )
                }
            },
            {
                title: "End Time",
                render: (data, record) => {
                    let end_time = null;
                    if (record["fields"]["incident_end"] === null){
                        end_time = "Not Available";
                    }else{
                        end_time = record["fields"]["incident_end"];
                        end_time = end_time.split("Z")[0];
                        end_time = end_time.split("T");
                        end_time = end_time[0] + " " + end_time[1].split(".")[0];
                    }
                    return (
                        <div>
                            <p>{end_time}</p>
                        </div>
                    )
                }
            },
            {
                title: "Description",
                render: (data, record) => {
                    return(
                        <div>
                            <Paragraph ellipsis={{rows: 2, expandable: false}}>{record["fields"]["description"]}</Paragraph>
                        </div>
                    )
                }
            },
            {
                title: "Update",
                render: (data, record) => {
                    return(
                            <div>
                                <a>
                                    <EditOutlined  onClick={() => this.show_incident_update_view(record)}/>
                                </a>

                                <Update_incident_drawer visibility = {this.state["visible_update_"+record["pk"]]} data={record} modal_close_function={this.hide_incident_update_view}/>
                            </div>
                        )

                }
            },
            {
                title: "Detailed View",
                render: (data, record) =>{
                    return(
                        <div>
                            <a>
                                <a>
                                    <ExpandOutlined  onClick={() => this.show_incident_detailed_view(record)}/>
                                </a>
                            </a>
                            <Detailed_view_modal visible= {this.state["visible_modal_"+record["pk"]]} data={record} modal_close_function={this.hide_incident_detailed_view}/>
                        </div>
                    )
                }
            },
            {
                title: "Delete",
                render: (data, record) =>{
                    return(
                        <div>
                            <Popconfirm
                                title="Are you sure you want to delete this incident record?"
                                onConfirm={() => {
                                    delete_incident(record["pk"]).then(data=>{
                                        if(data["status"] === 0){
                                            message.success({content: "Incident Deleted", duration: 2, style: {position: "fixed", left: "50%", top: "20%", color: "#316DC1"}})
                                        }else{
                                            message.error({content: "Failed to delete Incident", duration: 2, style: {position: "fixed", left: "50%", top: "20%", color: "#316DC1"}})
                                        }
                                    })
                                }}
                                onCancel={()=>{

                                }}
                                okText="Delete"
                                cancelText="Cancel"
                                okButtonProps={{"record": record}}
                            >
                                <a>
                                    <DeleteOutlined/>
                                </a>
                            </Popconfirm>
                        </div>
                    )
                }
            }

        ]


        return (
            <div>
                <Table columns={columns} dataSource={this.state.data}/>
            </div>
        );
    }

}