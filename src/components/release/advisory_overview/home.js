import React, {Component} from "react";
import {advisory_details_for_advisory_id} from "../../../api_calls/release_calls";
import ADVISORY_DESCRIPTION from "./advisory_description";
import BUG_TABLE from "./bug_table";


export default class Advisory_Overview_Home extends Component {
    constructor(props) {
        super(props);

        this.state = {
            advisory_id: this.props.match.params.advisoryId,
            description_data: [],
            bug_table_data: [],
        }

        advisory_details_for_advisory_id(this.state.advisory_id).then(data => {
            this.setState({description_data: data["data"]["advisory_details"]});
            this.setState({bug_table_data: data["data"]["bugs"]})
        })

    }

    render() {
        return (
            <div style={{padding: "30px"}}>
                <ADVISORY_DESCRIPTION data={this.state.description_data}/>
                <BUG_TABLE data={this.state.bug_table_data}/>
            </div>
        )
    }
}