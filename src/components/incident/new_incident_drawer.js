import React, {Component} from "react";
import {Drawer, Form, Button, Col, Row, Input, Select, DatePicker, TimePicker, message} from 'antd';
import {create_incident} from "../../api_calls/incident_calls";

const {TextArea} = Input;
const { Option } = Select;

export default class New_incident_drawer extends Component{

    constructor(props) {
        super(props);

        this.state = {
            visibility: this.props.visibility,
            incident_start: undefined,
            incident_start_time: undefined,
        }

        this.onClose = this.onClose.bind(this);
        this.on_form_submit = this.on_form_submit.bind(this);
        this.start_date_on_change = this.start_date_on_change.bind(this);
        this.end_date_on_change = this.end_date_on_change.bind(this);

        message.config({
            maxCount: 2
        })

    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState({visibility: nextProps.visibility})
    }

    onClose(){
        this.props.draw_close_callback();
    }

    on_form_submit(values){

        message.loading({content: "Creating Incident", duration:0, style: {position: "fixed", left: "50%", top: "20%"}})

        if (values["incident_start"] !== null && values["incident_start"] !== undefined){
            values["incident_start"] = this.state.incident_start;
        }

        if (values["incident_end"] !== null && values["incident_end"] !== undefined){
            values["incident_end"] = this.state.incident_start;
        }

        create_incident(values).then(data =>{
            message.destroy()
            if(data["status"] === 0)
                message.success({content: "Incident Created", duration: 2, style: {position: "fixed", left: "50%", top: "20%", color: "#316DC1"}})
            else
                message.error({content: "Failed to create Incident", duration: 2, style: {position: "fixed", left: "50%", top: "20%", color: "#316DC1"}})
            this.onClose();
        })
    }

    start_date_on_change(date, dateString){
        this.setState({incident_start: dateString});
    }

    end_date_on_change(date, dateString){
        this.setState({incident_end: dateString})
    }



    render() {
        return (
            <div>
                <Drawer
                    title={"Report New Incident"}
                    width={"65%"}
                    onClose={this.onClose}
                    visible={this.state.visibility}
                    bodyStyle={{paddingBottom: 80}}
                    footer={null}
                >

                    <Form layout="vertical" hideRequiredMark onFinish={this.on_form_submit}>

                        <Form.Item >
                            <div
                                style={{
                                    textAlign: 'right',
                                }}
                            >
                                <Button type="primary" htmlType={"submit"}>
                                    Submit
                                </Button>
                            </div>
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="incident_start"
                                    label="Incident Start Date (Default Current UTC)(Optional)"
                                    rules={[{ required: false, message: 'Please enter the incident start date' }]}
                                >
                                    <DatePicker showTime={true} style={{width: "80%", paddingRight: "10%"}} placeholder={"Incident start date (Default Current UTC)"} format={"YYYY-MM-DD HH:mm:ss"} onChange={this.start_date_on_change}/>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="incident_end"
                                    label="Incident End Date (Optional)"
                                    rules={[{ required: false, message: 'Please enter the incident end date' }]}
                                >
                                    <DatePicker showTime={true} style={{width: "80%", paddingRight: "10%"}} placeholder={"Incident end date"} format={"YYYY-MM-DD HH:mm:ss"} onChange={this.end_date_on_change}/>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="description"
                                    label="Description"
                                    rules={[{ required: true, message: 'Please enter the incident description' }]}
                                >
                                    <TextArea placeholder="Please enter incident description" autoSize allowClear={true}/>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="impact"
                                    label="Impact"
                                    rules={[{ required: false, message: 'Please enter the incident impact' }]}
                                >
                                    <TextArea placeholder="Please enter incident impact" autoSize/>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="cause"
                                    label="Cause"
                                    rules={[{ required: false, message: 'Please enter the cause of incident' }]}
                                >
                                    <TextArea placeholder="Please enter the cause of incident" autoSize/>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="remedy"
                                    label="Remedy"
                                    rules={[{ required: false, message: 'Please enter the incident remedy' }]}
                                >
                                    <TextArea placeholder="Please enter incident remedy" autoSize/>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="action_items"
                                    label="Action Items"
                                    rules={[{ required: false, message: 'Please enter the action items for the incidents' }]}
                                >
                                    <TextArea placeholder="Please enter the action items for the incidents" autoSize/>
                                </Form.Item>
                            </Col>
                        </Row>



                    </Form>

                </Drawer>
            </div>
        );
    }
}