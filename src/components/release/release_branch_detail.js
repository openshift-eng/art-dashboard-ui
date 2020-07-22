import React, {Component} from "react";
import {advisory_details_for_advisory_id, advisory_ids_for_branch} from "../../api_calls/release_calls";
import {Empty, Typography} from "antd";
import {LinkOutlined} from "@ant-design/icons";
import {Link} from "react-router-dom";
import Release_branch_detail_card from "./release_branch_detail_card";
import Release_branch_detail_table from "./release_branch_detail_table";

const {Title, Text} = Typography;


export default class Release_branch_detail extends Component{

    constructor(props) {
        super(props);
        console.log("here")
        this.state = {
            branch: this.props.match.params.branch,
            overview_table_data: [],
            advisory_details: [],
            loading_cards: true
        }

        advisory_ids_for_branch(this.state.branch).then((data) => {
            let table_data = [];
            for(const key in data){
                if(data.hasOwnProperty(key))
                    table_data.push({type: key, id: data[key], advisory_link: "https://errata.devel.redhat.com/advisory/" + data[key]})
            }
            this.setState({overview_table_data: table_data}, () => {
                this.generate_data_for_each_advisory()
            })

        })

    }

    generate_data_for_each_advisory(){

        this.setState({advisory_details: []}, () => {

            let advisories_data = []

            this.state.overview_table_data.forEach((data) => {

                let advisory_data = {};

                advisory_details_for_advisory_id(data.id).then(data_api => {
                    advisory_data["advisory_details"] = data_api["data"]["advisory_details"];
                    advisory_data["bug_details"] = data_api["data"]["bugs"];
                    advisory_data["bug_summary"] = data_api["data"]["bug_summary"];
                    advisory_data["type"] = data.type;
                    advisories_data.push(advisory_data);
                    this.setState({advisory_details: advisories_data});
                    this.setState({loading_cards: false})
                });

            });
        })

    }

    render_advisory_cards(advisory_data){
        return advisory_data.map((data) => {
           return (
               <Release_branch_detail_card data={data}/>
           )
        });
    }


    render() {



        const overview_table_columns = [
            {
                title: "Advisory ID",
                key: "id",
                dataIndex: "id",
                align: "center",
                render: (data, record) => {
                    return (
                        <div>
                            <Link to={`/release/advisory/overview/${record["id"]}`}>
                                {record["id"]}
                            </Link>
                        </div>
                    )
                }
            },
            {
                title: "Advisory Type",
                key: "type",
                dataIndex: "type",
                align: "center",

            },
            {
                title: "Advisory Link",
                key: "advisory_link",
                dataIndex: "advisory_link",
                align: "center",
                render: (data, record) =>{
                    return (
                        <div>
                            <p><a href={record["advisory_link"]} target="_blank" rel="noopener noreferrer">{<LinkOutlined/>}</a></p>
                        </div>
                    )
                }
            }
        ]

        return(
            <div>
                <Title level={2} style={{paddingLeft: "20px", paddingTop: "40px"}}><Text code>{this.state.branch}</Text></Title>
                {/*<Table*/}
                {/*    title= {(currentDataSource) => {*/}
                {/*        return <h3 className="center">All Advisories for {this.state.branch}</h3>*/}
                {/*    }}*/}
                {/*    dataSource={this.state.overview_table_data}*/}
                {/*    columns={overview_table_columns}*/}
                {/*    style={{padding: "30px"}}*/}
                {/*    pagination={false}*/}
                {/*/>*/}
                {this.state.loading_cards && <Empty/>}
                <Release_branch_detail_table data={this.state.advisory_details}/>
                {/*{this.render_advisory_cards(this.state.advisory_details)}*/}
            </div>
        )
    }

}
