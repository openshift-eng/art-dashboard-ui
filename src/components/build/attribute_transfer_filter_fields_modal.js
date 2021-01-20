import React, {Component} from "react";
import {Modal} from "antd";
import AdvancedSearchForm from "./filter_fields_value_form";


export default class Attribute_transfer_filter_fields_modal extends Component{

    constructor(props) {
        super(props);
        this.state = {
            visible: props.visible,
            selected_filter_attributes_build: []
        }
        this.handler_for_ok_on_transfer_element = this.handler_for_ok_on_transfer_element.bind(this);
        this.handleOk = this.handleOk.bind(this);
    }

    handler_for_ok_on_transfer_element(selected_attributed){
        this.setState({selected_filter_attributes_build: selected_attributed});
        console.log(this.state.selected_filter_attributes_build);
    }


    handleOk = () => {
        this.setState({visible: false})
        this.props.handler()
        console.log(this.state)
    }

    render() {
        return(
        <Modal
            width={800}
            title="Filter Build Results"
            visible={this.props.visible}
            onOk={() => this.handleOk()}
            onCancel={() => this.handleOk()}
            footer={null}
        >
            {/*<Filter_field_transfer okHandler={this.handler_for_ok_on_transfer_element}></Filter_field_transfer>*/}
            <AdvancedSearchForm handler_to_update_build_table_data={this.props.handler_to_update_build_table_data} handle_close={this.handleOk}>
            </AdvancedSearchForm>
        </Modal>
        )
    }
}