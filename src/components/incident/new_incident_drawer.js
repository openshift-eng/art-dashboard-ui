import React, {Component} from "react";
import {Drawer, Form, Button, Col, Row, Input, Select, DatePicker, TimePicker, message} from 'antd';
import {create_incident} from "../../api_calls/incident_calls";
import ReactMarkdown from "react-markdown";

const {TextArea} = Input;
const { Option } = Select;

export default class New_incident_drawer extends Component{

    constructor(props) {
        super(props);

        this.state = {
            visibility: this.props.visibility,
            incident_start: undefined,
            incident_start_time: undefined,
            data: {}
        }

        this.onClose = this.onClose.bind(this);
        this.on_form_submit = this.on_form_submit.bind(this);
        this.start_date_on_change = this.start_date_on_change.bind(this);
        this.end_date_on_change = this.end_date_on_change.bind(this);
        this.update_editable_description = this.update_editable_description.bind(this);
        this.update_editable_impact = this.update_editable_impact.bind(this);
        this.update_editable_cause = this.update_editable_cause.bind(this);
        this.update_editable_remedy = this.update_editable_remedy.bind(this);
        this.update_editable_action_items = this.update_editable_action_items.bind(this);

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
            values["incident_end"] = this.state.incident_end;
        }

        create_incident(values).then(data =>{
            console.log(data);
            message.destroy()
            if(data["status"] === 0){
                message.success({content: "Incident Created", duration: 2, style: {position: "fixed", left: "50%", top: "20%", color: "#316DC1"}})
                this.props.refresh_callback();
            }
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

    update_editable_description(event){
        let data = this.state.data;
        data["description"] = event.target.value;
        this.setState({data: data});
    }

    update_editable_impact(event){
        let data = this.state.data;
        data["impact"] = event.target.value;
        this.setState({data: data});
    }

    update_editable_cause(event){
        let data = this.state.data;
        data["cause"] = event.target.value;
        this.setState({data: data});
    }

    update_editable_remedy(event){
        let data = this.state.data;
        data["remedy"] = event.target.value;
        this.setState({data: data});
    }

    update_editable_action_items(event){
        let data = this.state.data;
        data["action_items"] = event.target.value;
        this.setState({data: data});
    }



    render() {
        return (
            <div>
                <Drawer
                    title={"Report New Incident"}
                    width={"80%"}
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
                                    name="title"
                                    label="Title"
                                    rules={[{ required: true, message: 'Please enter the incident title' }]}
                                >
                                    <TextArea
                                        placeholder="Please enter incident title"
                                        autoSize={{maxRows: 1}}
                                        allowClear={true}
                                        showCount={true}
                                        maxLength={100}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={10} style={{margin: "10px"}}>
                                <Form.Item
                                    name="description"
                                    label="Description"
                                    rules={[{ required: true, message: 'Please enter the incident description' }]}
                                >
                                    <TextArea
                                        placeholder="Please enter incident description"
                                        autoSize={{minRows: 1, maxRows: 20}}
                                        allowClear={true}
                                        showCount={true}
                                        maxLength={20000}
                                        onChange={this.update_editable_description}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={10} style={{margin: "10px"}}>
                                <p>Preview</p>
                                <div style={{ borderStyle: "groove", padding: "10px", maxHeight: "450px", overflowY: "auto"}}>
                                    <ReactMarkdown source={this.state.data["description"]} escapeHtml={false}/>
                                </div>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={10} style={{margin: "10px"}}>
                                <Form.Item
                                    name="impact"
                                    label="Impact"
                                    rules={[{ required: false, message: 'Please enter the incident impact' }]}
                                >
                                    <TextArea
                                        placeholder="Please enter incident impact"
                                        autoSize={{maxRows: 20}}
                                        allowClear={true}
                                        showCount={true}
                                        maxLength={20000}
                                        onChange={this.update_editable_impact}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={10} style={{margin: "10px"}}>
                                <p>Preview</p>
                                <div style={{ borderStyle: "groove", padding: "10px", maxHeight: "450px", overflowY: "auto"}}>
                                    <ReactMarkdown source={this.state.data["impact"]} escapeHtml={false}/>
                                </div>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={10} style={{margin: "10px"}}>
                                <Form.Item
                                    name="cause"
                                    label="Cause"
                                    rules={[{ required: false, message: 'Please enter the incident cause' }]}
                                >
                                    <TextArea
                                        placeholder="Please enter incident cause"
                                        autoSize={{maxRows: 20}}
                                        allowClear={true}
                                        showCount={true}
                                        maxLength={20000}
                                        onChange={this.update_editable_cause}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={10} style={{margin: "10px"}}>
                                <p>Preview</p>
                                <div style={{ borderStyle: "groove", padding: "10px", maxHeight: "450px", overflowY: "auto"}}>
                                    <ReactMarkdown source={this.state.data["cause"]} escapeHtml={false}/>
                                </div>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={10} style={{margin: "10px"}}>
                                <Form.Item
                                    name="remedy"
                                    label="Remedy"
                                    rules={[{ required: false, message: 'Please enter the incident remedy' }]}
                                >
                                    <TextArea
                                        placeholder="Please enter incident remedy"
                                        autoSize={{maxRows: 20}}
                                        allowClear={true}
                                        showCount={true}
                                        maxLength={20000}
                                        onChange={this.update_editable_remedy}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={10} style={{margin: "10px"}}>
                                <p>Preview</p>
                                <div style={{ borderStyle: "groove", padding: "10px", maxHeight: "450px", overflowY: "auto"}}>
                                    <ReactMarkdown source={this.state.data["remedy"]} escapeHtml={false}/>
                                </div>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={10} style={{margin: "10px"}}>
                                <Form.Item
                                    name="action_items"
                                    label="Action Items"
                                    rules={[{ required: false, message: 'Please enter the incident action items' }]}
                                >
                                    <TextArea
                                        placeholder="Please enter incident action items"
                                        autoSize={{maxRows: 20}}
                                        allowClear={true}
                                        showCount={true}
                                        maxLength={20000}
                                        onChange={this.update_editable_action_items}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={10} style={{margin: "10px"}}>
                                <p>Preview</p>
                                <div style={{ borderStyle: "groove", padding: "10px", maxHeight: "450px", overflowY: "auto"}}>
                                    <ReactMarkdown source={this.state.data["action_items"]} escapeHtml={false}/>
                                </div>
                            </Col>
                        </Row>

                    </Form>

                </Drawer>
            </div>
        );
    }
}