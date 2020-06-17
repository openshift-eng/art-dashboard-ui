import React, {Component} from "react";
import {get_build_data_without_filters} from "../../api_calls/build_calls";
import {get_build_data_witt_filters} from "../../api_calls/build_calls";
import {Table, Pagination, Modal, Button, Space, Spin} from "antd";
import 'antd/dist/antd.css';
import Attribute_transfer_filter_fields_modal from "./attribute_transfer_filter_fields_modal";
import {CheckOutlined, CloseOutlined, FilterFilled, FilterOutlined, FilterTwoTone} from "@ant-design/icons";
import {SyncOutlined} from "@ant-design/icons";
import {EyeOutlined} from "@ant-design/icons";
import Search_filters_popover from "./search_filters_popover";

require('dotenv').config();


export default class BuildsTable extends Component{

    state = {
        table_data: []
    }

    constructor(props) {

        super(props);

        this.state = {
            table_data: [],
            build_description_data: {},
            filter_attribute_selection_modal_visisble: false,
            state_data: undefined,
            nextToken: undefined,
            nextTokenSearchFilter: undefined,
            loading_build_table_skeleton_property: true
        }

        // const state_data = get_build_data_witt_filters({
        //     where: {
        //         "brew.build_ids": "1206338",
        //         "build.0.package_id": "67164"
        //     }
        // });

        this.state.state_data = get_build_data_without_filters();

        this.state.state_data.then(data =>{
            this.setState({table_data: data["Items"]});
            this.setState({nextToken: data["NextToken"]});
            this.setState({loading_build_table_skeleton_property: false})
        });

        this.handleFilterBuildParamsButton = this.handleFilterBuildParamsButton.bind(this);
        this.handle_for_update_build_table_data = this.handle_for_update_build_table_data.bind(this);
        this.loadMoreClick = this.loadMoreClick.bind(this);

    }

    loadMoreClick(){

        if(this.state.nextToken !== undefined){
            if("filter_load_more" in this.state){
                if (this.state.filter_load_more === true){
                    this.handle_for_update_build_table_data(this.state.build_filter_where_cond, true)
                }else{
                    this.handle_for_update_build_table_data("");
                }
            }else{
                this.handle_for_update_build_table_data("");
            }

        }
    }

    renderTableDataAntd(){

        let table_object = []

        const required_columns = {
            "brew.build_ids": true,
            "brew.faultCode": true,
            "brew.task_id": true,
            "brew.task_state": true,
            "build.0.source": true,
            "build.time.iso": true,
            "build.0.nvr": true,
            "dg.name": true,
            "label.io.openshift.build.commit.url": true,
        }

        const required_expanded_columns = {

            "brew.image_shas": true,
            "build.0.package_id": true,
            "jenkins.build_url": true,
            "build.0.version": true,
            "build.0.name": true,
            "jenkins.build_number": true,
            "jenkins.job_name": true
        }

        if(this.state.table_data !== undefined){
            this.state.table_data.forEach(item =>{
                let table_row = {
                    "expanded":{}
                }
                item["Attributes"].forEach(attr => {

                    if(required_columns[attr["Name"]]){
                        table_row[attr["Name"]] = attr["Value"];
                    }

                    if(required_expanded_columns[attr["Name"]]){
                        table_row.expanded[attr["Name"]] = attr["Value"];
                    }

                });
                table_object.push(table_row);
            });
        }


        return table_object;

    }

    showBuildDescriptionModal(record){

        let key1 = "visible_modal_" + record["brew.build_ids"]
        let statevar = {}
        statevar[key1] = true;
        this.setState(statevar);
    }

    handleOkBuildDescriptionModal(record){
        let key1 = "visible_modal_" + record["brew.build_ids"]
        let statevar = {}
        statevar[key1] = false;
        this.setState(statevar);
    }

    handleFilterBuildParamsButton(){
        if(this.state.filter_attribute_selection_modal_visisble){
            this.setState({"filter_attribute_selection_modal_visisble": false})
        }else{
            this.setState({"filter_attribute_selection_modal_visisble": true})
        }
    }

    handle_for_update_build_table_data(where_cond, for_search_filter=false, search_clicked=false){

        let filter = {
            where: where_cond,
            limit: 100
        }

        if(search_clicked){
            this.setState({nextTokenSearchFilter: undefined})
        }

        console.log(for_search_filter)

        if ( for_search_filter === false){

            if (this.state.nextToken !== undefined){
                filter["next_token"] = this.state.nextToken;
            }else{
                filter["next_token"] = "";
            }

            this.setState({build_filter_where_cond: ""})
            this.setState({filter_load_more: false})

        }else{
            if (this.state.nextTokenSearchFilter !== undefined){
                filter["next_token"] = this.state.nextTokenSearchFilter;
            }else{
                filter["next_token"] = "";
            }
            this.setState({build_filter_where_cond: where_cond})
            this.setState({filter_load_more: true})
        }

        this.setState({loading_build_table_skeleton_property: true})
        this.setState({state_data: get_build_data_witt_filters(filter)})

        this.state.state_data.then(data => {
            this.setState({table_data: data["Items"]});
            if(data.hasOwnProperty("NextToken")){
                if(for_search_filter === false)
                    this.setState({nextToken: data["NextToken"]});
                else
                    this.setState({nextTokenSearchFilter: data["NextToken"]})
            }else{
                if(for_search_filter === false)
                    this.setState({nextToken: undefined})
                else
                    this.setState({nextTokenSearchFilter: undefined})

            }
            this.setState({loading_build_table_skeleton_property: false})
        }).then(() => {
            this.renderTableDataAntd();
        })


        //this.renderTableDataAntd();

    }

    render_single_digit_to_double_datetime(digit){
        digit = digit.toString()
        if(digit.length === 1){
            return "0" + digit;
        }
        return digit;

    }


    render(){

        const table_columns = [
            {
                title: 'Build Id',
                dataIndex: "brew.build_ids",
                key: "brew.build_ids",
                render: (text, record) => (
                    <div>
                        <a>
                        <p onClick={() => this.showBuildDescriptionModal(record)}>{record["brew.build_ids"]}</p>
                        </a>
                        <Modal
                            title= {"Build Description Detail: [" + record["brew.build_ids"] + "]"}
                            visible= {this.state["visible_modal_"+record["brew.build_ids"]]}
                            onOk={() => this.handleOkBuildDescriptionModal(record)}
                            onCancel={() => this.handleOkBuildDescriptionModal(record)}
                        >

                            <p>{"Image SHAs: " + record.expanded["brew.image_shas"]}</p>
                            <p>{"Build package ID: " + record.expanded["build.0.package_id"]}</p>
                            <p><a href={record.expanded["jenkins.build_url"]}>{"Jenkins Build Url"}</a></p>
                            <p>{"Jenkins Build Number: " + record.expanded["jenkins.build_number"]}</p>
                            <p>{"Jenkins Job Name: " + record.expanded["jenkins.job_name"]}</p>
                            <p>{"Build Name: " + record.expanded["build.0.name"]}</p>
                            <p>{"Build Version: " + record.expanded["build.0.version"]}</p>

                        </Modal>
                    </div>
                )
            },
            {
                title: "Build Status",
                dataIndex: "brew.faultCode",
                key: "brew.faultCode",
                render: (text, record) =>{
                    if(record["brew.faultCode"] === "0"){
                        return(
                            <div>
                                <CheckOutlined style = {{color:  "#52c41a"}}/>
                            </div>
                            )
                    }

                    else{
                        return(
                            <div>
                                <CloseOutlined style = {{color: "#f55d42"}}></CloseOutlined>
                            </div>
                            )
                    }
                }
            },
            {
                title: "Brew Task",
                dataIndex: "brew.task_id",
                key: "brew.task_id",
                render: (data, record) => {
                    return(
                        <div>
                            <a href={process.env.REACT_APP_BREW_TASK_LINK+record["brew.task_id"]}
                               target="_blank" rel="noopener noreferrer">{record["brew.task_id"]}</a>
                        </div>
                        )

                }
            },
            // {
            //     title: "Task State",
            //     dataIndex: "brew.task_state",
            //     key: "brew.task_state"
            // }
            {
                title: "NVR",
                dataIndex: "build.0.nvr",
                key: "build.0.nvr"
            },
            {
                title: "CGIT Link",
                dataIndex: "build.0.source",
                key: "build.0.source",
                render: (data, record) => {
                    const source = record["build.0.source"]
                    if(source !== undefined){
                        const split_pieces = source.split("#")
                        return (
                            <a href={process.env.REACT_APP_CGIT_BUILD_TABLE_LINK+split_pieces[split_pieces.length-1]}
                               target="_blank" rel="noopener noreferrer">
                                {/*{split_pieces[split_pieces.length-1]}*/}
                                {record["dg.name"]}
                            </a>
                        );
                    }else{
                        return (
                            <p></p>
                        );
                    }

                }
            },
            {
                title: "Source Commit",
                dataIndex: "label.io.openshift.build.commit.url",
                key: "label.io.openshift.build.commit.url",
                render: (data, record) => {
                    return(
                        <a href={record["label.io.openshift.build.commit.url"]} target="_blank" rel="noopener noreferrer"><EyeOutlined/></a>
                    )
                }
            },
            {
                title: "Build Time ISO",
                dataIndex: "build.time.iso",
                key: "build.time.iso",
                render: (data, record) => {
                    let date = new Date(record["build.time.iso"])
                    return (
                        <p>{date.getFullYear()+'-' + this.render_single_digit_to_double_datetime((date.getMonth()+1)) + '-'+this.render_single_digit_to_double_datetime(date.getDate()) + ' ' + this.render_single_digit_to_double_datetime(date.getHours()) + ':' + this.render_single_digit_to_double_datetime(date.getMinutes()) + ":" + this.render_single_digit_to_double_datetime(date.getSeconds())}</p>
                    )
                }
            }
        ]

        let loading_build_table = this.state.loading_build_table_skeleton_property;
        let build_table_loader_or_load_more = null;
        let show_table = null;
        if(loading_build_table){
            build_table_loader_or_load_more =
                <div className="center">
                    <Space size="middle">
                        <Spin size="large"></Spin>
                    </Space>
                </div>

        }else{
            build_table_loader_or_load_more =
                <div className="center">
                    <Button onClick={this.loadMoreClick} type="primary" shape="round" icon={<SyncOutlined spin/>} >Load More</Button>
                </div>
        }


        return (
            <div
            style={{padding: "30px"}}>
                <Attribute_transfer_filter_fields_modal
                    visible={this.state.filter_attribute_selection_modal_visisble}
                    handler={this.handleFilterBuildParamsButton}
                    handler_to_update_build_table_data={this.handle_for_update_build_table_data}/>
                {/*    <Button*/}
                {/*        size="large"*/}
                {/*        className="right"*/}

                {/*        style={{padding: "10px",*/}
                {/*            marginBottom: "20px",*/}
                {/*            background: "#316DC1",*/}
                {/*            color: "white"}}*/}

                {/*        onClick={this.handleFilterBuildParamsButton.bind(this)}*/}
                {/*        icon={<FilterTwoTone/>}>Filter*/}
                {/*    </Button>*/}
                {/*<Button></Button>*/}
                <Button></Button>
                <Search_filters_popover handleFilterBuildParamsButton={this.handleFilterBuildParamsButton} data={this.state.build_filter_where_cond}/>

                {!loading_build_table && <Table dataSource={this.renderTableDataAntd()}
                       columns={table_columns}
                       pagination={<Pagination defaultCurrent={0}/>}
                />}

                {build_table_loader_or_load_more}
            </div>
        )
    }
}