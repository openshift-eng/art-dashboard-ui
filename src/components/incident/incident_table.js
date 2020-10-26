import React, {Component} from "react";
import {message, Table} from "antd";
import { Typography } from 'antd';
import {DeleteColumnOutlined, DeleteOutlined, EditOutlined, ExpandOutlined} from "@ant-design/icons";
import Update_incident_drawer from "./update_incident_drawer";
import Detailed_view_modal from "./detailed_view_modal";
import Popconfirm from "antd/es/popconfirm";
import {delete_incident, get_all_incident_reports} from "../../api_calls/incident_calls";
import {withRouter} from "react-router";


const { Paragraph, Text } = Typography;


class Incident_table extends Component{

    constructor(props) {
        super(props);
        this.state = {
            data: this.props.data["data"],
            query_params: this.props.query_params,
            valid_incident_ids: []
        }

        this.set_valid_incident_ids(this.state.data);

        this.hide_incident_update_view = this.hide_incident_update_view.bind(this);
        this.show_incident_update_view = this.show_incident_update_view.bind(this);
        this.show_incident_detailed_view = this.show_incident_detailed_view.bind(this);
        this.hide_incident_detailed_view = this.hide_incident_detailed_view.bind(this);
        this.show_update_view_callback_from_detailed_view = this.show_update_view_callback_from_detailed_view.bind(this);
    }

    set_valid_incident_ids(data){

        let ids = [];

        if(data !== undefined){
            data.forEach(data=>{
                ids.push(data["pk"].toString());
            })
        }

        this.setState({"valid_incident_ids": ids}, ()=>{
            this.handle_query_params(this.state.query_params);
        });

    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState({data: nextProps.data["data"]},()=>{
            this.setState({query_params: nextProps.query_params},()=>{
                this.set_valid_incident_ids(this.state.data);
            });
        });
    }

    handle_query_params(query_params){
        if(query_params.page !== undefined &&
           query_params.page !== null){

            if(query_params.page === "detailed"){
                if (query_params.hasOwnProperty("id") &&
                    !isNaN(query_params.id) &&
                    this.state.valid_incident_ids.includes(query_params.id.toString())){

                        let update_value = {}
                        update_value["visible_modal_"+query_params.id] = true;
                        this.setState(update_value);
                }
            }else if(query_params.page === "update"){
                if (query_params.hasOwnProperty("id") &&
                    !isNaN(query_params.id) &&
                    this.state.valid_incident_ids.includes(query_params.id.toString())){

                    let update_value = {}
                    update_value["visible_update_"+query_params.id] = true;
                    this.setState(update_value);
                }
            }else{
                console.log(JSON.stringify(this.state));
            }
        }
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
        this.setState(state_var, ()=>{
            this.props.history.push("/incidents/?page=home");
        });
    }

    show_incident_update_view(record){
        let state_val = "visible_update_"+record["pk"];
        let state_var = {}
        state_var[state_val] = true;
        this.setState(state_var);
    }

    show_update_view_callback_from_detailed_view(incident_id){
        let state_val = "visible_modal_"+incident_id.toString();
        let state_var = {}
        state_var[state_val] = false;
        this.setState(state_var, ()=>{
            this.props.history.push("/incidents/?page=update&id="+incident_id.toString());
        })
    }

    hide_incident_update_view(record){
        let state_val = "visible_update_"+record["log_incident_id"];
        let state_var = {}
        state_var[state_val] = false;
        this.setState(state_var, ()=>{
            this.props.history.push("/incidents/?page=home");
        });
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
                title: "Title",
                render: (data, record) => {
                    return(
                        <div>
                            <Paragraph ellipsis={{rows: 2, expandable: false}}> {record["fields"]["title"]}</Paragraph>
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
                                    <EditOutlined  onClick={() => this.props.history.push("/incidents/?page=update&id="+record["pk"])}/>
                                </a>
                                <Update_incident_drawer visibility = {this.state["visible_update_"+record["pk"]]} data={record} modal_close_function={this.hide_incident_update_view} refresh_callback={this.props.refresh_callback}/>
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
                                    {/*<ExpandOutlined  onClick={() => this.show_incident_detailed_view(record)}/>*/}
                                    <ExpandOutlined  onClick={() => this.props.history.push("/incidents/?page=detailed&id="+record["pk"])}/>
                                </a>
                            </a>
                            <Detailed_view_modal visible= {this.state["visible_modal_"+record["pk"]]} data={record} modal_close_function={this.hide_incident_detailed_view} update_view_show_callback={this.show_update_view_callback_from_detailed_view}/>
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
                                            this.props.refresh_callback();
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

export default withRouter(Incident_table);