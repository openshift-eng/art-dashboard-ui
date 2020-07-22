import React, {Component} from "react";
import {Select} from "antd";
import {get_release_branches_from_ocp_build_data} from "../../api_calls/release_calls";
import {Redirect} from "react-router";
import {Link} from "react-router-dom";

const {Option} = Select;


export default class Openshift_version_select extends Component{

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            loading: true,
            on_select_version: undefined
        }

        get_release_branches_from_ocp_build_data().then(data => {

            let select_data = [];
            data.forEach((openshift_version_detail) => {
                select_data.push(openshift_version_detail["name"]);
            });

            this.setState({data: select_data}, ()=>{
                this.setState({loading: false})
            })
        })

        this.generate_select_option_from_state_date = this.generate_select_option_from_state_date.bind(this);
        this.onChange = this.onChange.bind(this);

    }

    onChange(value){
        this.setState({on_select_version: value})
    }

    generate_select_option_from_state_date(state_data){

        return state_data.map((openshift_version) => {
            return(
                <Option value={openshift_version}>{openshift_version}</Option>
            )
        })
    }

    render() {
        if(this.state.on_select_version === undefined){
            return (
                <div>
                    <Select loading={this.state.loading} placeholder={"OpenShift Version"} onChange={this.onChange}>
                        {this.generate_select_option_from_state_date(this.state.data)}
                    </Select>
                </div>
            );
        }else{
            return(<Redirect to={`/release/status/detail/${this.state.on_select_version}`}/>);
        }

    }

}