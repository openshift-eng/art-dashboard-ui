import React, {Component} from "react";
import {Drawer, Form, Button, Col, Row, Input, Select, DatePicker, Typography, message} from 'antd';
import {update_incident} from "../../api_calls/incident_calls";
import moment from "moment";

const {TextArea} = Input;

export default class Update_incident_drawer extends Component{

    constructor(props) {
        super(props);

        this.state = {
            visibility: this.props.visibility,
            data: this.format_incoming_data(props.data)
        }

        this.onClose = this.onClose.bind(this);
        this.on_form_submit = this.on_form_submit.bind(this);
        this.format_incoming_data = this.format_incoming_data.bind(this);
        this.update_editable_description = this.update_editable_description.bind(this);
        this.update_editable_impact = this.update_editable_impact.bind(this);
        this.update_editable_cause = this.update_editable_cause.bind(this);
        this.update_editable_remedy = this.update_editable_remedy.bind(this);
        this.update_editable_action_items = this.update_editable_action_items.bind(this);
        this.start_date_on_change = this.start_date_on_change.bind(this);
        this.end_date_on_change = this.end_date_on_change.bind(this);

        message.config({
            maxCount: 2
        })

    }

    format_incoming_data(data){

        let formatted_data = {}

        formatted_data["log_incident_id"] = data["pk"];
        formatted_data["description"] = data["fields"]["description"];
        formatted_data["impact"] = data["fields"]["impact"];
        formatted_data["cause"] = data["fields"]["cause"];
        formatted_data["remedy"] = data["fields"]["remedy"];
        formatted_data["action_items"] = data["fields"]["action_items"];
        formatted_data["incident_start"] = data["fields"]["incident_start"];

        if (data["fields"]["incident_end"] !== undefined && data["fields"]["incident_end"] !== null){
            formatted_data["incident_end"] = data["fields"]["incident_end"];
        }else{
            formatted_data["incident_end"] = undefined;
        }

        return formatted_data;
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState({visibility: nextProps.visibility});
        this.setState({data: this.format_incoming_data(nextProps.data)});
    }

    onClose(){
        this.props.modal_close_function(this.state.data);
    }

    on_form_submit(values){
        // not using values since it is sending json with undefined values
        // ideally should use values to update json and in completion
        // callback of setstate handle_update should be called.
        this.handle_update();
    }

    start_date_on_change(date, dateString){
        let data = this.state.data;
        data["incident_start"] = dateString;
        this.setState({data: data});
    }

    end_date_on_change(date, dateString){
        let data = this.state.data;
        data["incident_end"] = dateString;
        this.setState({data: data});
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

    handle_update(){
        message.loading({content: "Updating Incident", duration:0, style: {position: "fixed", left: "50%", top: "20%"}})

        update_incident(this.state.data).then(data => {
            message.destroy()
            if(data["status"] === 0){
                message.success({content: "Incident Updated", duration: 2, style: {position: "fixed", left: "50%", top: "20%", color: "#316DC1"}})
                this.props.refresh_callback();
            }
            else
                message.error({content: "Failed to create Incident", duration: 2, style: {position: "fixed", left: "50%", top: "20%", color: "#316DC1"}})

        })
    }

    render() {

        let end_date_available = false;

        if (this.state.data["incident_end"] !== undefined && this.state.data["incident_end"] !== null){
            end_date_available = true;
        }

        let description = this.state.data["description"];

        return (
            <div>
                <Drawer
                    title={"Update incident"}
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
                                    Update
                                </Button>
                            </div>
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                {console.log(this.state.data["incident_start"])}
                                <Form.Item
                                    name="incident_start"
                                    label="Incident Start Date (Default Current UTC)(Optional)"
                                    rules={[{ required: false, message: 'Please enter the incident start date' }]}
                                >
                                    <DatePicker defaultValue={moment(this.state.data["incident_start"], "YYYY-MM-DD HH:mm:ss")} showTime={true} style={{width: "80%", paddingRight: "10%"}} placeholder={"Incident start date (Default Current UTC)"} format={"YYYY-MM-DD HH:mm:ss"} value={this.state.date} onChange={this.start_date_on_change}/>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                {console.log(this.state.data["description"])}
                                <Form.Item
                                    name="incident_end"
                                    label="Incident End Date (Optional)"
                                    rules={[{ required: false, message: 'Please enter the incident end date' }]}
                                >
                                    {end_date_available && <DatePicker defaultValue={moment(this.state.data["incident_end"], "YYYY-MM-DD HH:mm:ss")} showTime={true} style={{width: "80%", paddingRight: "10%"}} placeholder={"Incident end date"} format={"YYYY-MM-DD HH:mm:ss"} value={this.state.date} onChange={this.end_date_on_change}/>}
                                    {!end_date_available && <DatePicker showTime={true} style={{width: "80%", paddingRight: "10%"}} placeholder={"Incident end date"} format={"YYYY-MM-DD HH:mm:ss"} value={this.state.date} onChange={this.end_date_on_change}/>}
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="description"
                                    label="Description"
                                    rules={[{ required: false, message: 'Please enter the incident description' }]}
                                >
                                    {console.log(this.state.data["description"])}
                                    <TextArea
                                        onChange={this.update_editable_description}
                                        placeholder="Please enter incident description"
                                        maxLength={20000}
                                        autoSize
                                        allowClear={true}
                                        defaultValue={description}/>
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
                                    {console.log(this.state.data["description"])}
                                    <TextArea
                                        onChange={this.update_editable_impact}
                                        maxLength={20000}
                                        placeholder="Please enter incident impact"
                                        autoSize
                                        allowClear={true}
                                        defaultValue={this.state.data["impact"]}/>
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
                                    {console.log(this.state.data["description"])}
                                    <TextArea
                                        onChange={this.update_editable_cause}
                                        maxLength={20000}
                                        placeholder="Please enter incident cause"
                                        autoSize
                                        allowClear={true}
                                        defaultValue={this.state.data["cause"]}/>
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
                                    {console.log(this.state.data["description"])}
                                    <TextArea
                                        onChange={this.update_editable_remedy}
                                        maxLength={20000}
                                        placeholder="Please enter incident remedy"
                                        autoSize
                                        allowClear={true}
                                        defaultValue={this.state.data["remedy"]}/>
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
                                    {console.log(this.state.data["description"])}
                                    <TextArea
                                        onChange={this.update_editable_action_items}
                                        maxLength={20000}
                                        placeholder="Please enter incident action items"
                                        autoSize
                                        allowClear={true}
                                        defaultValue={this.state.data["action_items"]}/>
                                </Form.Item>
                            </Col>
                        </Row>



                    </Form>

                </Drawer>
            </div>
        );
    }
}