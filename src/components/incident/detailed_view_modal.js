import React, {Component} from "react";
import {Typography, Modal, Button, Col, Row} from "antd";
import { HighlightOutlined, SmileOutlined, SmileFilled } from '@ant-design/icons';
import {get_all_incident_reports, update_incident} from "../../api_calls/incident_calls";
import TextArea from "antd/es/input/TextArea";
import ReactMarkdown from "react-markdown";


const {Title, Paragraph, Text} = Typography;


export default class Detailed_view_modal extends Component{

    constructor(props) {
        super(props);
        this.state = {
            visible: props.visible,
            data: this.props.data
        }
        this.handleOk = this.handleOk.bind(this);
        this.update_editable_description = this.update_editable_description.bind(this);
        this.update_editable_impact = this.update_editable_impact.bind(this);
        this.update_editable_cause = this.update_editable_cause.bind(this);
        this.update_editable_remedy = this.update_editable_remedy.bind(this);
        this.update_editable_action_items = this.update_editable_action_items.bind(this);
        this.handle_update = this.handle_update.bind(this);
        this.update_from_detailed_view = this.update_from_detailed_view.bind(this);
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState({visible: nextProps.visible});
        this.setState({data: nextProps.data});
    }

    handleOk = () => {
        this.props.modal_close_function(this.state.data);
    }

    update_from_detailed_view() {
        this.props.update_view_show_callback(this.state.data["pk"]);
    }

    handle_update(){
        update_incident(this.state.data).then(data => {
            console.log(data);
        })
    }


    update_editable_description(val){
        let data = this.state.data;
        data["fields"]["description"] = val;
        this.setState({data: data});
    }

    update_editable_impact(val){
        let data = this.state.data;
        data["fields"]["impact"] = val;
        this.setState({data: data});
    }

    update_editable_cause(val){
        let data = this.state.data;
        data["fields"]["cause"] = val;
        this.setState({data: data});
    }

    update_editable_remedy(val){
        let data = this.state.data;
        data["fields"]["remedy"] = val;
        this.setState({data: data});
    }

    update_editable_action_items(val){
        let data = this.state.data;
        data["fields"]["action_items"] = val;
        this.setState({data: data});
    }

    render() {

        let description;
        let impact;
        let cause;
        let remedy;
        let action_items;
        let end_time = null;
        let start_time = null;
        let incident_id = null;

        if (this.state.data["fields"]["description"] === null){
            description = "Not Available"
        }else {
            description = this.state.data["fields"]["description"];
        }

        if (this.state.data["fields"]["impact"] === null){
            impact = "Not Available"
        }else{
            impact = this.state.data["fields"]["impact"];
        }

        if (this.state.data["fields"]["cause"] === null){
            cause = "Not Available"
        }else{
            cause = this.state.data["fields"]["cause"];
        }

        if (this.state.data["fields"]["remedy"] === null){
            remedy = "Not Available"
        }else{
            remedy = this.state.data["fields"]["remedy"];
        }

        if (this.state.data["fields"]["action_items"] === null){
            action_items = "Not Available"
        }else{
            action_items = this.state.data["fields"]["action_items"];
        }

        return(
            <Modal
                width={"75%"}
                title = "Detailed Incident Report"
                visible={this.state.visible}
                onOk={() => this.handleOk()}
                onCancel={() => this.handleOk()}
                footer={null}
            >
                <Row style={{paddingRight: "10px", paddingBottom: "20px", margin: "20px"}}>
                    <Col span={24}>
                        <Button primary={true} onClick={this.update_from_detailed_view}>Update</Button>
                    </Col>
                </Row>

                <Row>
                    <Col span={24}>
                        <Typography>
                            <Title level={4}>Description</Title>
                        </Typography>
                        <div style={{display: "flex", alignItems: "center"}}>
                            <div style={{ width: "100%", margin: "15px", padding: "15px", borderStyle: "groove"}}>
                                <ReactMarkdown source={description} escapeHtml={false}/>
                            </div>
                        </div>
                    </Col>
                </Row>

                <br/>

                <Row>
                    <Col span={24}>
                        <Typography>
                            <Title level={4}>Impact</Title>
                        </Typography>
                        <div style={{display: "flex", alignItems: "center"}}>
                            <div style={{ width: "100%", margin: "15px", padding: "15px", borderStyle: "groove"}}>
                                <ReactMarkdown source={impact} escapeHtml={false}/>
                            </div>
                        </div>
                    </Col>
                </Row>

                <br/>

                <Row>
                    <Col span={24}>
                        <Typography>
                            <Title level={4}>Cause</Title>
                        </Typography>
                        <div style={{display: "flex", alignItems: "center"}}>
                            <div style={{ width: "100%", margin: "15px", padding: "15px", borderStyle: "groove"}}>
                                <ReactMarkdown source={cause} escapeHtml={false}/>
                            </div>
                        </div>
                    </Col>
                </Row>

                <br/>

                <Row>
                    <Col span={24}>
                        <Typography>
                            <Title level={4}>Remedy</Title>
                        </Typography>
                        <div style={{display: "flex", alignItems: "center"}}>
                            <div style={{ width: "100%", margin: "15px", padding: "15px", borderStyle: "groove"}}>
                                <ReactMarkdown source={remedy} escapeHtml={false}/>
                            </div>
                        </div>
                    </Col>
                </Row>

                <br/>

                <Row>
                    <Col span={24}>
                        <Typography>
                            <Title level={4}>Action Items</Title>
                        </Typography>
                        <div style={{display: "flex", alignItems: "center"}}>
                            <div style={{ width: "100%", margin: "15px", padding: "15px", borderStyle: "groove"}}>
                                <ReactMarkdown source={action_items} escapeHtml={false}/>
                            </div>
                        </div>
                    </Col>
                </Row>


            </Modal>
        )
    }
}