import React, {Component} from "react";
import 'antd/dist/antd.css';
import {
    get_daily_build_data_for_a_date,
    get_daily_build_data_for_a_date_for_a_column
} from "../../api_calls/build_health_calls";
import {Table, Tooltip} from "antd";
import {CheckOutlined, CloseOutlined, LinkOutlined} from "@ant-design/icons";


export default class Build_record_table extends Component{

    constructor(props) {
        super(props);


        this.state = {
            data: [],
            date: this.props.match.params.date,
            group_filter: [],
            label_name_filter: [],
            loading: true,
            query_params: undefined
        }

        let query_params = this.parse_query_params(this.props);
        let type = null;


        if(query_params.hasOwnProperty("type")){
            type = query_params["type"];
        }

        if(type === "all"){
            get_daily_build_data_for_a_date(this.state.date).then((data) => {
                this.setState({data: data["data"]});
                this.setState({group_filter:this.generate_openshift_group_filter(data["data"])});
                this.setState({label_name_filter: this.generate_openshift_label_name_filter(data["data"])});
                this.setState({loading: false});
            })
        } else if(type === "column_search"){
            if( query_params.hasOwnProperty("column") && query_params.hasOwnProperty("value")){
                get_daily_build_data_for_a_date_for_a_column(query_params["column"], query_params["value"], this.state.date).then((data) => {
                    this.setState({data: data["data"]});
                    this.setState({group_filter:this.generate_openshift_group_filter(data["data"])});
                    this.setState({label_name_filter: this.generate_openshift_label_name_filter(data["data"])});
                    this.setState({loading: false});
                })
            }
        }else{
            console.log("else")
        }
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

    generate_openshift_group_filter(data){

        let groups = {}
        let group_filter = []

        data.forEach((val) => {
            if (!(groups.hasOwnProperty(val["group"]))){
                groups[val["group"]] = 1;
                group_filter.push({text: val["group"], value: val["group"]})
            }
        });

        return group_filter;

    }

    generate_openshift_label_name_filter(data){

        let label_names = {}
        let label_name_filter = []

        data.forEach((val) => {
            if (!(label_names.hasOwnProperty(val["label_name"]))){
                label_names[val["label_name"]] = 1;
                label_name_filter.push({text: val["label_name"], value: val["label_name"]})
            }
        });

        return label_name_filter;

    }

    render_single_digit_to_double_datetime(digit){
        digit = digit.toString()
        if(digit.length === 1){
            return "0" + digit;
        }
        return digit;

    }

    render() {

        const table_column = [
            {
                title: 'Brew Build',
                dataIndex: "build_id",
                key: "build_id",
                render: (text, record) => (
                    <div>
                        <a href={process.env.REACT_APP_BREW_BUILD_LINK+record["build_id"]}
                           target="_blank" rel="noopener noreferrer">
                            {record["build_id"]}
                        </a>
                    </div>
                )
            },
            {
                title: "Build Status",
                dataIndex: "fault_code",
                key: "fault_code",
                render: (text, record) =>{
                    if(record["fault_code"] === "0"){
                        return(
                            <div>
                                <CheckOutlined style = {{color:  "#52c41a"}}/>
                            </div>
                        )
                    }

                    else{
                        return(
                            <div>
                                <Tooltip title={"Fault Code is " + record["fault_code"]}>
                                    <CloseOutlined style = {{color: "#f55d42"}}/>
                                </Tooltip>
                            </div>
                        )
                    }
                }
            },
            {
                title: "Brew Task",
                dataIndex: "task_id",
                key: "task_id",
                render: (data, record) => {
                    return(
                        <div>
                            <a href={process.env.REACT_APP_BREW_TASK_LINK+record["task_id"]}
                               target="_blank" rel="noopener noreferrer">{record["task_id"]}</a>
                        </div>
                    )

                }
            },
            {
              title: "Jenkins Build URL",
              dataIndex: "jenkins_build_url",
              key: "jenkins_build_url",
              render: (data, record) =>{
                  return (
                      <div>
                          <p><a href={record["jenkins_build_url"]}>{<LinkOutlined/>}</a></p>
                      </div>
                  )
              }
            },
            {
                title: "DistGit Name",
                dataIndex: "label_name",
                key: "label_name",
                filters: this.state.label_name_filter,
                onFilter: (value, record) => record.label_name === value,
                width: "20%",
                sorter: (a, b) => a.label_name.length - b.label_name.length

            },
            {
                title: "OpenShift Group",
                dataIndex: "group",
                key: "group",
                filters: this.state.group_filter,
                onFilter: (value, record) => record.group === value,
                width: "20%",
                sorter: (a, b) => parseFloat(a.group.split("-")[1]) - parseFloat(b.group.split("-")[1])

            },
            {
                title: "Build Time",
                dataIndex: "iso_time",
                key: "iso_time",
                render: (data, record) => {
                    let date = new Date(record["iso_time"])
                    return (
                        <p>{date.getFullYear()+'-' + this.render_single_digit_to_double_datetime((date.getMonth()+1)) + '-'+this.render_single_digit_to_double_datetime(date.getDate()) + ' ' + this.render_single_digit_to_double_datetime(date.getHours()) + ':' + this.render_single_digit_to_double_datetime(date.getMinutes()) + ":" + this.render_single_digit_to_double_datetime(date.getSeconds())}</p>
                    )
                }
            }
        ]

        return (
            <div>
                <Table dataSource={this.state.data} columns={table_column} style={{padding: "30px"}} loading={this.state.loading}/>
            </div>
        );
    }

}