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
            build_date1_filter_value: "2020-01-01",
            build_date2_filter_value: "2020-12-31",
            error_alert_show: false,
            where_cond_holders: {
              "brew.faultCode":[{
                  "cond": "=",
                  "value": "0",
                  changeHandler: (cond) => {
                      let element = this.state["where_cond_holders"]["brew.faultCode"][0]
                      element["cond"] = cond;
                      this.setState({element})
                  },
                  onValueChangeHandler: (value) => {
                      let element = this.state["where_cond_holders"]["brew.faultCode"]
                      element["value"] = value;
                      this.setState({element})
                  }
              }],
              "time.iso": [
                  {
                      "cond": ">="
                  },
                  {
                      "cond": "<="
                  }
              ]
            },
            setExpand: () => {
                if(this.state.expand){
                    this.setState({expand: false})
                }else{
                    this.setState({expand: true})
                }
            },
            setBuild1DateFilter: (date, dateString) => {
                this.setState({build_date1_filter_value: dateString})
            },
            setBuild2DateFilter: (date, dateString) => {
                this.setState({build_date2_filter_value: dateString})
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

            "time.iso": [{
                "name": "Start Date",
                "required": false,
                "ant_element": <DatePicker style={{width: "300px"}} placeholder="Start Date" format={"YYYY-MM-DD"} value={this.state.build_date1_filter_value} onChange={this.state.setBuild1DateFilter}/>,
                "like_or_where": this.like_or_where_select,
                "formatter_state_variable": "build_date1_filter_value"
            },{
                "name": "End Date",
                "required": false,
                "ant_element": <DatePicker style={{width: "300px"}} placeholder="End Date" format={"YYYY-MM-DD"} value={this.state.build_date2_filter_value} onChange={this.state.setBuild2DateFilter}/>,
                "like_or_where": this.like_or_where_select,
                "formatter_state_variable": "build_date2_filter_value"
            }],
            "brew.faultCode": [{
                "name": "Build Status",
                "required": false,
                "ant_element": <Select style={{width: "300px"}} onChange={this.build_status_onchange}>
                    <Option value="=____0">Successful Builds</Option>
                    <Option value="!=____0">Failed Builds</Option>
                </Select>,
                "like_or_where": this.like_or_where_like_disabled,
                "formatter_state_variable": undefined
            }],
            "build.0.nvr": [{
                "name": "NVR",
                "required": false,
                "ant_element": <Input placeholder="NVR"/>,
                "like_or_where": this.like_or_where_select,
                "formatter_state_variable": undefined
            }],
            "dg.name": [{
                "name": "Dist Git Name",
                "required": false,
                "ant_element": <Input placeholder="Dist Git Name"/>,
                "like_or_where": this.like_or_where_select,
                "formatter_state_variable": undefined
            }],
            "label.name": [{
                "name": "Label Name",
                "required": false,
                "ant_element": <Input placeholder="Label Name"/>,
                "like_or_where": this.like_or_where_select,
                "formatter_state_variable": undefined
            }],
            "label.version": [{
                "name": "Label Version",
                "required": false,
                "ant_element": <Input placeholder="Label Version"/>,
                "like_or_where": this.like_or_where_select,
                "formatter_state_variable": undefined
            }],
            "jenkins.job_name": [{
                "name": "Jenkins Job Name",
                "required": false,
                "ant_element": <Input placeholder="Jenkins Job Name"/>,
                "like_or_where": this.like_or_where_select,
                "formatter_state_variable": undefined
            }]
        };

        this.error_alert_close = this.error_alert_close.bind(this);
    }

    build_status_onchange = (value) => {

        console.log(value);
        const value_split = value.split("____");
        let element = this.state["where_cond_holders"]["brew.faultCode"][0];
        element.changeHandler(value_split[0]);
        element.onValueChangeHandler(value_split[1])
    }

    getFields = () => {

        const count = this.state.expand ? 10 : 6;
        const children = [];

        for(let key in this.search_fields_to_show){
            if(this.search_fields_to_show.hasOwnProperty(key)){
                let ele_counter = 0;
                this.search_fields_to_show[key].forEach( (key_ele) => {
                    children.push(<Col span={24} key={ele_counter.toString() + "####" + key}>
                        <Form.Item label={key_ele["name"]}>

                            <Form.Item
                                className="left"
                                style={{paddingLeft: "30px", width: "300px" }}
                                name={ele_counter.toString() + "####" + key}
                                // label={search_fields_to_show[key]['name']}
                                rules={[
                                    {
                                        required: key_ele['required'],
                                        message: key_ele['name'],
                                    },
                                ]}
                            >
                                {key_ele["ant_element"]}
                            </Form.Item>
                            <Form.Item
                                className="right"
                                name={ele_counter.toString() + "####" + key + "____like.or.where"}
                                label={"Exact/Like"}
                                rules={[
                                    {
                                        required: key_ele['required'],
                                        message: key_ele['name'],
                                    },
                                ]}
                            >
                                {key_ele["like_or_where"]}
                            </Form.Item>
                        </Form.Item>

                    </Col>,);
                    ele_counter += 1;
                })
            }
        }

        return children;
    };

    validateFormInput = values => {
        console.log(JSON.stringify(values))
        let output_values = {}
        for(const key in values){
            // only if key in not undefined
            if(values.hasOwnProperty(key) && values[key] !== undefined){
                // split the key, for ex: build.ids will be ["build.ids"] and build.ids____like.or.where will become
                // ["build.ids", "like.or.where"]
                const first_key_split = key.split("####");
                const ele_count = parseInt(first_key_split[0]);
                const key_split = first_key_split[1].split("____")
                if(key_split.length === 1){
                    // if the key is not like.or.where
                    if(values[key + "____like.or.where"] === undefined){
                        // if like.or.where of this key ex: build.ids is not defined alert
                        //alert("Like/where missing for some filter fields.");
                        console.log(key);
                        return false;
                    }
                }
                else{
                    if(ele_count.toString() + "####" + values[key_split[0]] !== undefined){
                        // if the respective key of like.or.where is defined then
                        if(!output_values.hasOwnProperty(key_split[0]))
                            output_values[key_split[0]] = []

                        let output_value = {}

                        // if there is a formatted value stored for the input in state use that, which is generally set by onchange on
                        // antd component
                        if(this.search_fields_to_show[key_split[0]][ele_count]["formatter_state_variable"] !== undefined &&
                            key_split[0] in this.state.where_cond_holders){
                            output_value["value"] = this.state[this.search_fields_to_show[key_split[0]][ele_count]["formatter_state_variable"]];
                            output_value["cond"] = this.state.where_cond_holders[key_split[0]][ele_count]["cond"];
                        }else if(key_split[0] in this.state.where_cond_holders){
                            output_value["value"] = this.state.where_cond_holders[key_split[0]][ele_count]["value"];
                            output_value["cond"] = this.state.where_cond_holders[key_split[0]][ele_count]["cond"];
                        }else{
                            output_value["value"] = values[ele_count.toString() + "####" +key_split[0]]
                        }
                        output_value["like_or_where"] = values[key]
                        output_values[key_split[0]].push(output_value)
                    }else{
                        // else for now ignore, since like.or.where is selected but its key value is not defined.
                        // alert("Filter parameters are not proper.");
                        // return false;
                        console.log("here")
                    }

                }
            }
        }
        return output_values;
    }

    onFinish = values => {

        const form_validation_result = this.validateFormInput(values);

        console.log(JSON.stringify(form_validation_result));

        if(form_validation_result !== false){
            this.props.handler_to_update_build_table_data(form_validation_result, true, true);
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
