import React, {Component} from "react";
import {get_build_data_without_filters} from "../../api_calls/build_calls";
import {get_build_data_witt_filters} from "../../api_calls/build_calls";
import {Table, Pagination, Modal, Button, Space, Spin, Row, Col} from "antd";
import 'antd/dist/antd.css';
import Attribute_transfer_filter_fields_modal from "./attribute_transfer_filter_fields_modal";
import {
    CheckOutlined,
    CloseOutlined, ExpandAltOutlined, ExpandOutlined,
    FilterFilled,
    FilterOutlined,
    FilterTwoTone,
    LinkOutlined
} from "@ant-design/icons";
import {SyncOutlined} from "@ant-design/icons";
import {EyeOutlined} from "@ant-design/icons";
import {PlusOutlined} from "@ant-design/icons";
import Search_filters_popover from "./search_filters_popover";
import {Tooltip} from "antd";
import Autocomplete_filter from "./autocomplete_filter";
import Datepicker_filter from "./datepicker_filter";
import Run_status_filter from "./run_status_filter";

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

        this.state.state_data = get_build_data_without_filters();

        this.state.state_data.then(data =>{
            this.setState({table_data: data["Items"]});
            this.setState({nextToken: data["NextToken"]});
            this.setState({loading_build_table_skeleton_property: false})
        });

        this.handleFilterBuildParamsButton = this.handleFilterBuildParamsButton.bind(this);
        this.handle_for_update_build_table_data = this.handle_for_update_build_table_data.bind(this);
        this.loadMoreClick = this.loadMoreClick.bind(this);
        this.handle_for_update_build_table_data_simple_filters = this.handle_for_update_build_table_data_simple_filters.bind(this);

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

        }else{
            this.handle_for_update_build_table_data_simple_filters(this.state.build_filter_where_cond);
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
            "dg.qualified_name": true,
            "label.version": true,
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

    unset_nextTokenSearchFilter(){

    }

    handle_for_update_build_table_data_simple_filters(where_cond){

        this.setState({loading_build_table_skeleton_property: true})

        this.setState({nextToken: undefined})
        this.setState({nextTokenSearchFilter: undefined})
        this.setState({nextTokenSearchFilterSimple: undefined})

        let filter = {
            where: where_cond,
            limit: 100
        }

        if (this.state.nextTokenSearchFilterSimple !== undefined) {
            filter["next_token"] = this.state.nextTokenSearchFilterSimple;
        }else{
            filter["next_token"] = "";
        }

        this.setState({build_filter_where_cond: where_cond})


        this.setState({state_data: get_build_data_witt_filters(filter)}, this.update_table);




    }

    update_table(){

        this.state.state_data.then(data => {
            this.setState({table_data: data["Items"]}, this.renderTableDataAntd);
            if(data.hasOwnProperty("NextToken")){
                this.setState({nextTokenSearchFilterSimple: data["NextToken"]})
            }else{
                this.setState({nextTokenSearchFilterSimple: undefined})
            }
            this.setState({loading_build_table_skeleton_property: false})
        });



    }

    handle_for_update_build_table_data(where_cond, for_search_filter=false, search_clicked=false){



        let order_by_string = null;

        // if the order by is in the where_cond, that from the form submit
        // then respect the new values, this will have for_search_filter = true, hence no
        // neeed to check
        if (where_cond !== "" && "order" in where_cond){
                let order = where_cond["order"];
                if (order["sort_filter_column"] !== undefined && order["sort_filter_order"] !== undefined) {
                    order_by_string = "" + order["sort_filter_column"] + " " + order["sort_filter_order"];
                    this.setState({order_by: order_by_string});
                }

                delete where_cond["order"];
        }
        // if it is from a search, but old search then where_cond will not have order and
        // hence should use old order by value from the state
        else if(for_search_filter === true){
            order_by_string = this.state.order_by;
            if("order" in where_cond)
                delete where_cond["order"]
        }

        let filter = {
            where: where_cond,
            limit: 100
        }

        if(search_clicked){
            this.setState({nextTokenSearchFilter: undefined})
        }

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

        if ( order_by_string !== null){
            this.setState({state_data: get_build_data_witt_filters(filter, order_by_string)})
        }else{
            this.setState({state_data: get_build_data_witt_filters(filter)})

        }

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
                title: 'Brew Build',
                dataIndex: "brew.build_ids",
                key: "brew.build_ids",
                render: (text, record) => (
                    <div>
                        <a href={process.env.REACT_APP_BREW_BUILD_LINK+record["brew.build_ids"]}
                           target="_blank" rel="noopener noreferrer">
                            {record["brew.build_ids"]}
                        </a>
                    </div>
                )
            },
            {
                title:()=>{
                    return (
                        <Row>
                            <Col span={24} className="left">
                                Build Status
                            </Col>
                            <Col span={24}>
                                <Run_status_filter search_callback={this.handle_for_update_build_table_data_simple_filters}/>
                            </Col>
                        </Row>
                    )
                },
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
                                <Tooltip title={"Fault Code is " + record["brew.faultCode"]}>
                                    <CloseOutlined style = {{color: "#f55d42"}}/>
                                </Tooltip>
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
                title:()=>{
                    return (
                        <Row>
                            <Col span={24} className="left">
                                Package
                            </Col>
                            <Col span={24}>
                                <Autocomplete_filter placeholder={"Package Name"} type={"nvr"} search_callback={this.handle_for_update_build_table_data_simple_filters}/>
                            </Col>
                        </Row>
                    )
                },
                dataIndex: "dg.qualified_name",
                key: "dg.qualified_name"
            },
            {
                title: "Version",
                key: "label.version",
                dataIndex: "label.version"
            },
            {
                title: "CGIT Link",
                dataIndex: "build.0.source",
                key: "build.0.source",
                render: (data, record) => {
                    const source = record["build.0.source"]
                    if(source !== undefined){
                        const split_pieces = source.split("#")
                        const git_link = split_pieces.slice(0,-1).join("")
                        let  http_link = "http://" + git_link.split("//").slice(1,).join() + "/tree/?id="+split_pieces[split_pieces.length-1]
                        http_link = http_link.replace(/.com\//g, ".com/cgit/")
                        return (
                            <a  href={http_link}
                                //href={split_pieces.slice(0,-1).join("") + "/tree/?id="+split_pieces[split_pieces.length-1]}
                                // href={process.env.REACT_APP_CGIT_BUILD_TABLE_LINK+split_pieces[split_pieces.length-1]}
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
                        <a href={record["label.io.openshift.build.commit.url"]} target="_blank" rel="noopener noreferrer"><LinkOutlined/></a>
                    )
                }
            },
            {
                title: ()=>{
                    return (
                        <Row>
                            <Col span={24} className="left">
                                Build Time ISO
                            </Col>
                            <Col span={24}>
                                <Datepicker_filter placeholder={"Build Date"} search_callback={this.handle_for_update_build_table_data_simple_filters}/>
                            </Col>
                        </Row>
                    )
                },
                dataIndex: "build.time.iso",
                key: "build.time.iso",
                render: (data, record) => {
                    let date = new Date(record["build.time.iso"])
                    return (
                        <p>{date.getFullYear()+'-' + this.render_single_digit_to_double_datetime((date.getMonth()+1)) + '-'+this.render_single_digit_to_double_datetime(date.getDate()) + ' ' + this.render_single_digit_to_double_datetime(date.getHours()) + ':' + this.render_single_digit_to_double_datetime(date.getMinutes()) + ":" + this.render_single_digit_to_double_datetime(date.getSeconds())}</p>
                    )
                }
            },
            {
                title: 'More Details',
                dataIndex: "more.details",
                key: "more.details",
                render: (text, record) => (
                    <div>
                        <a>
                            <ExpandOutlined  onClick={() => this.showBuildDescriptionModal(record)}/>
                        </a>
                        <Modal
                            title= {"Build Details"}
                            visible= {this.state["visible_modal_"+record["brew.build_ids"]]}
                            onOk={() => this.handleOkBuildDescriptionModal(record)}
                            onCancel={() => this.handleOkBuildDescriptionModal(record)}
                        >

                            <p>{"Image SHAs: " + ("brew.image_shas" in record.expanded && record.expanded["brew.image_shas"] !== "" ? record.expanded["brew.image_shas"] : "Not Available")}</p>
                            <p>{"Build package ID: " + ("build.0.package_id" in record.expanded ? record.expanded["build.0.package_id"] : "Not Available")}</p>
                            <p><a href={record.expanded["jenkins.build_url"]}>{"Jenkins Build Url"}</a></p>
                            <p>{"Jenkins Build Number: " + record.expanded["jenkins.build_number"]}</p>
                            <p>{"Jenkins Job Name: " + record.expanded["jenkins.job_name"]}</p>
                            <p>{"Build Name: " + ("build.0.name" in record.expanded && record.expanded["build.0.name"] !== "" ? record.expanded["build.0.name"] : "Not Available")}</p>
                            <p>{"Build Version: " + ("build.0.version" in record.expanded && record.expanded["build.0.version"] !== "" ? record.expanded["build.0.version"] : "Not Available")}</p>

                        </Modal>
                    </div>
                )
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
                <Button/>
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