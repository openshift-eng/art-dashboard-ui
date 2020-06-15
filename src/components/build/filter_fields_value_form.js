import React, { Component } from 'react';
import {Form, Row, Col, Input, Button, Select, AutoComplete} from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import {DatePicker} from "antd";
import BuildAlert from "./alert";
const { Option } = Select;

export default class AdvancedSearchForm extends Component{

    formRef = React.createRef();

    constructor(props) {
        super(props);

        this.state = {
            expand: false,
            build_date_filter_value: "2020-01-01",
            error_alert_show: false,
            where_cond_holders: {
              "brew.faultCode":{
                  "cond": "=",
                  changeHandler: (cond) => {
                      let element = this.state["where_cond_holders"]["brew.faultCode"]
                      element.cond = cond;
                      this.setState({element})
                  }
              }
            },
            setExpand: () => {
                if(this.state.expand){
                    this.setState({expand: false})
                }else{
                    this.setState({expand: true})
                }
            },
            setBuildDateFilter: (date, dateString) => {
                this.setState({build_date_filter_value: dateString})
            }
        }

        this.like_or_where_select = <Select style={{width: "200px"}}>
            <Option value="like">Like</Option>
            <Option value="where">Where</Option>
        </Select>;

        this.like_or_where_where_disabled = <Select style={{width: "200px"}}>
            <Option value="like">Like</Option>
            <Option value="where" disabled>Where</Option>
        </Select>;

        this.like_or_where_like_disabled = <Select style={{width: "200px"}}>
            <Option value="like" disabled>Like</Option>
            <Option value="where">Where</Option>
        </Select>;

        this.search_fields_to_show = {
            "brew.build_ids":{
                "name": "Build ID",
                "required": false,
                "ant_element": <Input placeholder="Build ID" />,
                "like_or_where": this.like_or_where_select,
                "formatter_state_variable": undefined
            },
            "build.0.package_id":{
                "name": "Package ID",
                "required": false,
                "ant_element": <Input placeholder="Package ID"/>,
                "like_or_where": this.like_or_where_select,
                "formatter_state_variable": undefined
            },
            "time.iso": {
                "name": "Build Time",
                "required": false,
                "ant_element": <DatePicker placeholder="Build Time" format={"YYYY-MM-DD"} value={this.state.build_date_filter_value} onChange={this.state.setBuildDateFilter}/>,
                "like_or_where": this.like_or_where_where_disabled,
                "formatter_state_variable": "build_date_filter_value"
            },
            "brew.faultCode": {
                "name": "Build Status",
                "required": false,
                "ant_element": <Select style={{width: "200px"}} onChange={this.build_status_onchange}>
                    <Option value="0">Successful Builds</Option>
                    <Option value="!=" disabled>Failed Builds (Not Supported)</Option>
                </Select>,
                "like_or_where": this.like_or_where_like_disabled,
                "formatter_state_variable": undefined
            },
            "build.0.nvr": {
                "name": "NVR",
                "required": false,
                "ant_element": <Input placeholder="NVR"/>,
                "like_or_where": this.like_or_where_select,
                "formatter_state_variable": undefined
            }
        };

        this.error_alert_close = this.error_alert_close.bind(this);
    }

    build_status_onchange = (value) => {
        console.log(value);
    }

    getFields = () => {

        const count = this.state.expand ? 10 : 6;
        const children = [];

        for(let key in this.search_fields_to_show){
            if(this.search_fields_to_show.hasOwnProperty(key)){
                children.push(<Col span={16} key={key}>
                    <Form.Item label={this.search_fields_to_show[key]["name"]}>
                        <Input.Group>
                            <br/>
                            <Form.Item
                                name={key}
                                // label={search_fields_to_show[key]['name']}
                                rules={[
                                    {
                                        required: this.search_fields_to_show[key]['required'],
                                        message: this.search_fields_to_show[key]['name'],
                                    },
                                ]}
                            >
                                {this.search_fields_to_show[key]["ant_element"]}
                            </Form.Item>
                            <Form.Item
                                name={key+"____like.or.where"}
                                label={"Select Where or Like"}
                                rules={[
                                    {
                                        required: this.search_fields_to_show[key]['required'],
                                        message: this.search_fields_to_show[key]['name'],
                                    },
                                ]}
                            >
                                {this.search_fields_to_show[key]["like_or_where"]}
                            </Form.Item>

                        </Input.Group>
                    </Form.Item>

                </Col>,);
            }
        }

        return children;
    };

    validateFormInput = values => {
        let output_values = {}
        for(const key in values){
            // only if key in not undefined
            if(values.hasOwnProperty(key) && values[key] !== undefined){
                // split the key, for ex: build.ids will be ["build.ids"] and build.ids____like.or.where will become
                // ["build.ids", "like.or.where"]
                const key_split = key.split("____")
                if(key_split.length === 1){
                    // if the key is not like.or.where
                    if(values[key + "____like.or.where"] === undefined){
                        // if like.or.where of this key ex: build.ids is not defined alert
                        //alert("Like/where missing for some filter fields.");
                        return false;
                    }
                }
                else{
                    if(values[key_split[0]] !== undefined){
                        // if the respective key of like.or.where is defined then
                        output_values[key_split[0]] = {}
                        // if there is a formatted value stored for the input in state use that, which is generally set by onchange on
                        // antd component
                        if(this.search_fields_to_show[key_split[0]]["formatter_state_variable"] !== undefined){
                            output_values[key_split[0]]["value"] = this.state[this.search_fields_to_show[key_split[0]]["formatter_state_variable"]]
                        }else{
                            output_values[key_split[0]]["value"] = values[key_split[0]]
                        }
                        output_values[key_split[0]]["like_or_where"] = values[key]
                    }else{
                        // else for now ignore, since like.or.where is selected but its key value is not defined.
                        // alert("Filter parameters are not proper.");
                        // return false;
                    }

                }
            }
        }
        return output_values;
    }

    onFinish = values => {
        console.log('Received values of form: ', values);

        const form_validation_result = this.validateFormInput(values);

        if(form_validation_result !== false){
            console.log(form_validation_result)
            this.props.handler_to_update_build_table_data(form_validation_result, true);
            this.formRef.current.resetFields();
            this.setState({error_alert_show: false})
        }else{
            this.setState({error_alert_show: true});
        }
    };

    error_alert_close = () => {
        this.setState({error_alert_show: !this.error_alert_show})
    }

    render() {

        let error_alert_message = null;

        if(this.state.error_alert_show){
            error_alert_message = <Row><BuildAlert message="Filter fields are not filled properly.Make sure where/like is selected for all filled values." type="error" close_func={this.error_alert_close}/></Row>;
        }


        return (
            <Form
                ref={this.formRef}
                name="advanced_search"
                className="ant-advanced-search-form"
                onFinish={this.onFinish}
            >
                {error_alert_message}
                <Row gutter={72}>{this.getFields()}</Row>
                <Row>
                    <Col
                        span={72}
                        style={{
                            textAlign: 'right',
                        }}
                    >
                        <Button type="primary" htmlType="submit">
                            Search
                        </Button>
                        <Button
                            style={{
                                margin: '0 8px',
                            }}
                            onClick={() => {
                                this.formRef.current.resetFields();
                            }}
                        >
                            Clear
                        </Button>
                        <a
                            style={{
                                fontSize: 12,
                            }}
                            onClick={() => {
                                this.state.setExpand(!this.state.expand);
                            }}
                        >
                            {this.state.expand ? <UpOutlined /> : <DownOutlined />} Collapse
                        </a>
                    </Col>
                </Row>
            </Form>
        );

    }


};
