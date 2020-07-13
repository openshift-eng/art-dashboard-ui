import React, {Component} from "react";
import Release_status_table from "./status/release_status_table";
import Github_rate_limit_status_bar from "./status/github_rate_limit_status_bar";
import {Col, Row} from "antd";
import Release_branch_detail from "./release_branch_detail";


export default class Release_home_page extends Component{

    constructor(props) {
        super(props);

        this.state = {
            page_type: "all",
            query_params: {}
        }

        this.state.query_params = this.parse_query_params(this.props);
        const page_type  = this.state.query_params["type"];
        this.state.page_type = page_type;

    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState({query_params: this.parse_query_params(nextProps)}, () => {
            this.setState({page_type: this.state.query_params["type"]})
        })
    }

    parse_query_params(props){

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

    render() {

        const page_type = this.state.page_type;

        return (
            <div>
                <Row style={{backgroundColor: "white", margin: "30px", marginBottom: "0px"}} className="center">
                    <Col span={24}>
                        <Github_rate_limit_status_bar/>
                    </Col>
                </Row>
                {(page_type === "all") && <Release_status_table/>}
                {(page_type === "branch") && <Release_branch_detail branch_name={this.state.query_params["branch"]}/>}
            </div>
        );
    }
}
