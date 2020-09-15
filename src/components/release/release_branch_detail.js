import React, {Component} from "react";
import {advisory_details_for_advisory_id, advisory_ids_for_branch} from "../../api_calls/release_calls";
import {Empty, Typography} from "antd";
import Release_branch_detail_table from "./release_branch_detail_table";

const {Title, Text} = Typography;


export default class Release_branch_detail extends Component{

    constructor(props) {
        super(props);
        this.state = {
            branch: this.props.branch,
            overview_table_data: [],
            advisory_details: [],
            loading_cards: true,
            overview_table_data_previous: [],
            advisory_details_previous: []
        }

        this.get_branch_data = this.get_branch_data.bind(this);
        this.get_branch_data();

    }

    get_branch_data(){

        advisory_ids_for_branch(this.state.branch).then((data) => {

            let table_data = [];
            for(const key in data["current"]){
                if(data["current"].hasOwnProperty(key))
                    table_data.push({type: key, id: data["current"][key], advisory_link: "https://errata.devel.redhat.com/advisory/" + data["current"][key]})
            }
            this.setState({overview_table_data: table_data}, () => {
                this.generate_data_for_each_advisory()
            })

            let table_data_previous = [];
            for(const key in data["previous"]){
                if(data["previous"].hasOwnProperty(key))
                    table_data_previous.push({type: key, id: data["previous"][key], advisory_link: "https://errata.devel.redhat.com/advisory/" + data["previous"][key]})
            }
            this.setState({overview_table_data_previous: table_data_previous}, () => {
                this.generate_data_for_each_advisory_previous()
            })

        })

    }

    componentWillReceiveProps(nextProps, nextContext) {

        this.setState({branch: nextProps.branch},()=>{
            this.get_branch_data();
        });
    }

    generate_data_for_each_advisory(){

        this.setState({advisory_details: []}, () => {

            let advisories_data = []

            const number_of_entries_in_overview_table_data = this.state.overview_table_data.length;

            let count = 0;

            this.state.overview_table_data.forEach((data, index) => {

                let advisory_data = {};

                advisory_details_for_advisory_id(data.id).then(data_api => {
                    advisory_data["advisory_details"] = data_api["data"]["advisory_details"];
                    advisory_data["bug_details"] = data_api["data"]["bugs"];
                    advisory_data["bug_summary"] = data_api["data"]["bug_summary"];
                    advisory_data["type"] = data.type;
                    advisories_data.push(advisory_data);
                    count += 1;

                    if(count === number_of_entries_in_overview_table_data){

                        this.setState({advisory_details: advisories_data}, ()=>{
                            this.props.destroy_loading_callback();
                        });
                        this.setState({loading_cards: false})
                    }

                });

            });
        })

    }

    generate_data_for_each_advisory_previous(){

        this.setState({advisory_details_previous: []}, () => {

            let advisories_data = []

            const number_of_entries_in_overview_table_data_previous = this.state.overview_table_data_previous.length;

            let count = 0;

            this.state.overview_table_data_previous.forEach((data, index) => {

                let advisory_data = {};

                advisory_details_for_advisory_id(data.id).then(data_api => {
                    advisory_data["advisory_details"] = data_api["data"]["advisory_details"];
                    advisory_data["bug_details"] = data_api["data"]["bugs"];
                    advisory_data["bug_summary"] = data_api["data"]["bug_summary"];
                    advisory_data["type"] = data.type;
                    advisories_data.push(advisory_data);
                    count += 1;
                    if(number_of_entries_in_overview_table_data_previous  === count){
                        this.setState({advisory_details_previous: advisories_data});
                        this.setState({loading_cards: false})
                    }
                });

            });
        })

    }


    render() {

        return(
            <div>

                <Title style={{paddingLeft: "20px", paddingTop: "40px"}} level={2}><Text code>{this.state.branch}</Text></Title>

                {this.state.loading_cards && <Empty/>}
                {!this.state.loading_cards && <Title style={{paddingLeft: "40px", paddingTop: "40px"}} level={4}><Text code>{"Current Advisories"}</Text></Title>}
                {!this.state.loading_cards && <Release_branch_detail_table data={this.state.advisory_details}/>}
                <br/>
                {!this.state.loading_cards && <Title style={{paddingLeft: "40px", paddingTop: "40px"}} level={4}><Text code>{"Previous Advisories"}</Text></Title>}
                {!this.state.loading_cards && <Release_branch_detail_table data={this.state.advisory_details_previous}/>}
            </div>
        )
    }

}
