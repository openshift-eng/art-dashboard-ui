import React, {Component} from "react";
import {DatePicker} from "antd";
import moment from "moment";


export default class Datepicker_filter extends Component {

    constructor(props) {
        super(props);
        this.state = {
            date: "",
            placeholder: this.props.placeholder
        }
        this.date_on_change = this.date_on_change.bind(this);
    }

    UNSAFE_UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        this.setState({placeholder: nextProps.placeholder})
    }

    date_on_change(date, dateString) {

        this.setState({date: moment(dateString)}, () => {
            let where_cond = {
                "build_time_iso": [{
                    "value": dateString,
                    "cond": "=",
                    "like_or_where": "like",
                    "name": "Build Time ISO"
                }]
            }
            this.props.search_callback(where_cond);
        })
    }

    render() {
        return (
            <div>
                <DatePicker style={{width: "80%", paddingRight: "10%"}} placeholder={this.state.placeholder}
                            format={"YYYY-MM-DD"} value={this.state.date} onChange={this.date_on_change}/>
            </div>
        )
    }

}