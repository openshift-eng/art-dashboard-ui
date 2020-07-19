import React, {Component} from "react";
import Attribute_transfer_filter_fields_modal from "./attribute_transfer_filter_fields_modal";
import Search_filters_popover from "./search_filters_popover";
import {Link, Redirect} from "react-router-dom";
import {get_builds} from "../../api_calls/build_calls";
import Build_history_table from "./build_history_table";
import {Button} from "antd";


export default class Build_history_home extends Component{

    constructor(props) {
        super(props);
        this.state = {
            query_params: this.props.location.search,
            data: [],
            filter_attribute_selection_modal_visible: false,
            query_redirect_string: undefined
        }

        this.load_updated_data(this.state.query_params);

        this.filter_button_toggle_modal_visibility = this.filter_button_toggle_modal_visibility.bind(this);
        this.redirect_to_updated_query_params = this.redirect_to_updated_query_params.bind(this);

    }

    filter_button_toggle_modal_visibility(){
        if(this.state.filter_attribute_selection_modal_visible){
            this.setState({"filter_attribute_selection_modal_visible": false})
        }else{
            this.setState({"filter_attribute_selection_modal_visible": true})
        }
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState({query_redirect_string: undefined})
        this.load_updated_data(nextProps.location.search);
    }


    load_updated_data(query_params){

        if (query_params.length !== 0 && query_params[0] === '?'){
            query_params = query_params.slice(1);
        }

        if(query_params !== "" && query_params !== null)
            this.setState({build_filter_where_cond: JSON.parse(decodeURIComponent(query_params))})

        query_params = decodeURIComponent(query_params);

        get_builds(query_params).then((data) => {
           this.setState({data: data["data"]});
        });

    }

    redirect_to_updated_query_params(where_cond, for_search_filter=false, search_clicked=false){

        let queryString = encodeURIComponent(JSON.stringify(where_cond));
        this.setState({query_redirect_string: queryString})
    }

    render() {

        if(this.state.query_redirect_string !== undefined){
            return <Redirect to={"/build/history/?" + this.state.query_redirect_string}/>;

        }

        else{

            return (
                <div style={{padding: "30px"}}>
                    <Attribute_transfer_filter_fields_modal
                        visible={this.state.filter_attribute_selection_modal_visible}
                        handler={this.filter_button_toggle_modal_visibility}
                        handler_to_update_build_table_data={this.redirect_to_updated_query_params}/>
                    <Search_filters_popover handleFilterBuildParamsButton={this.filter_button_toggle_modal_visibility} data={this.state.build_filter_where_cond}/>
                    <Button/>
                    <Build_history_table data={this.state.data} simple_filter_callback={this.redirect_to_updated_query_params}/>
                </div>
            );

        }


    }

}