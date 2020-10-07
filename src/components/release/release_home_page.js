import React, {Component} from "react";
import Release_status_table from "./status/release_status_table";
import Release_branch_detail from "./release_branch_detail";
import {message} from "antd";
import {get_release_branches_from_ocp_build_data} from "../../api_calls/release_calls";
import Openshift_version_select from "./openshift_version_select";


export default class Release_home_page extends Component{

    constructor(props) {
        super(props);


        this.state = {
            release_table_data: [],
            current_branch: undefined,
            loaded_shown: false,
        }

        message.config({
            maxCount: 2
        })

        this.destroy_loading = this.destroy_loading.bind(this);

    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState({current_branch: nextProps.match.params["branch"]});
    }

    display_loading(){
        message.loading({content: "Loading Data", duration:0, style: {position: "fixed", left: "50%", top: "20%"}});
    }

    destroy_loading(){

        message.destroy()
        message.success({content: "Loaded", duration: 2, style: {position: "fixed", left: "50%", top: "20%", color: "#316DC1"}})

    }


    render() {

        return (
            <div>
                {this.display_loading()}
                <Openshift_version_select/>
                <Release_branch_detail branch={this.props.match.params.branch} destroy_loading_callback={this.destroy_loading}/>
            </div>
        );
    }
}
