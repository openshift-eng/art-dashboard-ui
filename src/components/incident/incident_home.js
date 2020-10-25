import React, {Component} from "react";
import {Button, Row} from "antd";
import {PlusOutlined} from "@ant-design/icons";
import {get_all_incident_reports} from "../../api_calls/incident_calls";
import Incident_table from "./incident_table";
import New_incident_drawer from "./new_incident_drawer";
import {withRouter} from "react-router";

class Incident_home extends Component{

    constructor(props) {
        super(props);
        this.state = {
            "incident_table_data": [],
            "new_incident_drawer_visible": false,
            "query_params": this.handle_query_params(props)
        }
        this.open_drawer = this.open_drawer.bind(this);
        this.close_drawer = this.close_drawer.bind(this);
        this.refresh_table = this.refresh_table.bind(this);
        this.handle_query_params = this.handle_query_params.bind(this);
    }

    componentDidMount() {

        this.handle_query_params(this.props);

        get_all_incident_reports().then(data => {
            this.setState({"incident_table_data": data})
        })
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState({query_params: this.handle_query_params(nextProps)});
    }

    handle_query_params(props){

        if(!props.hasOwnProperty("location")){
            return {}
        }else{
            let query_params = {}
            let search_string = props.location.search;
            if(search_string !== ""){

                if(search_string[0] === "?")
                    search_string = search_string.substr(1);

                search_string.split("&").forEach(key_val =>{
                    const key = key_val.split("=")[0];
                    query_params[key] = key_val.split("=")[1];
                })
            }
            return query_params;
        }
    }

    refresh_table() {
        get_all_incident_reports().then(data => {
            this.setState({"incident_table_data": data})
        })
    }

    close_drawer(){
        this.setState({new_incident_drawer_visible: false})
    }

    open_drawer(){
        this.setState({new_incident_drawer_visible: true})
    }

    render() {
        return (
            <div style={{padding: "30px"}}>

                <Incident_table data={this.state.incident_table_data} refresh_callback={this.refresh_table} query_params={this.state.query_params}/>
                <New_incident_drawer visibility={this.state.new_incident_drawer_visible} draw_close_callback={this.close_drawer} refresh_callback={this.refresh_table}/>
                <Button type="primary" shape="circle" icon={<PlusOutlined/>} size={"large"}
                        style={{
                            position: "fixed",
                            right: "50px",
                            bottom: "50px",
                            boxShadow: "0 6px 14px 0 #666",
                            backgroundColor: "#316DC1"
                        }}
                        onClick={this.open_drawer}
                />
            </div>
        );
    }
}

export default withRouter(Incident_home);
