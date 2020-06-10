import React, { useState, Component } from 'react';
import {Form, Row, Col, Input, Button, Select, AutoComplete} from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import {FormInstance} from "antd/lib/form";
import {DatePicker} from "antd";
const { Option } = Select;

export default class AdvancedSearchForm extends Component{

    formRef = React.createRef();

    constructor(props) {
        super(props);

        this.state = {
            expand: false,
            setExpand: () => {
                if(this.state.expand){
                    this.setState({expand: false})
                }else{
                    this.setState({expand: true})
                }
            }
        }
    }

    getFields = () => {

        const search_fields_to_show = {
            "brew.build_ids":{
                "name": "Build ID",
                "required": false,
                "ant_element": <Input placeholder="Build ID" />
            },
            "build.0.package_id":{
                "name": "Package ID",
                "required": false,
                "ant_element": <Input placeholder="Package ID" />
            },
            "time.iso": {
                "name": "Build Time",
                "required": false,
                "ant_element": <DatePicker placeholder="Build Time"/>
            }
        }

        const count = this.state.expand ? 10 : 6;
        const children = [];

        for(let key in search_fields_to_show){
            if(search_fields_to_show.hasOwnProperty(key)){
                children.push(<Col span={16} key={key}>
                    <Form.Item
                        name={key}
                        label={search_fields_to_show[key]['name']}
                        rules={[
                            {
                                required: search_fields_to_show[key]['required'],
                                message: search_fields_to_show[key]['name'],
                            },
                        ]}
                    >
                        {search_fields_to_show[key]["ant_element"]}
                    </Form.Item>
                </Col>,);
            }
        }

        return children;
    };

    onFinish = values => {
        console.log('Received values of form: ', values);
        this.props.handler_to_update_build_table_data(values, true);
        this.formRef.current.resetFields();
    };

    render() {

        return (
            <Form
                ref={this.formRef}
                name="advanced_search"
                className="ant-advanced-search-form"
                onFinish={this.onFinish}
            >
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
