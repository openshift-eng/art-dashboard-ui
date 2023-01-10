import React, {Component} from "react";
import {AutoComplete} from "antd";
import {auto_complete_nvr} from "../../api_calls/build_calls";


export default class Autocomplete_filter extends Component {

    constructor(props) {
        super(props);
        this.state = {
            placeholder: this.props.placeholder,
            options: []
        }

        this.update_options();
        this.onChange = this.onChange.bind(this);

    }

    format_data_for_use(data) {
        let options = []
        data.forEach(data_value => {
            options.push({value: data_value})
        });
        return options;
    }

    update_options() {
        auto_complete_nvr().then((data) => {
            data = this.format_data_for_use(data["data"]);
            this.setState({options: data})
        })
    }

    update_placeholder(placeholder) {
        this.setState({placeholder: placeholder})
    }

    UNSAFE_UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        this.update_options();
        this.update_placeholder(nextProps.placeholder);
    }


    onChange(value) {
        let where_cond = {"dg_qualified_name": [{"value": value, "cond": "=", "like_or_where": "like", "name": "NVR"}]}
        this.props.search_callback(where_cond);
    }

    render() {
        return (

            <AutoComplete style={{
                width: "90%",
                paddingRight: "10%"
            }}
                          allowClear={true}
                          options={this.state.options}
                          placeholder={this.state.placeholder}
                          value={this.state.value}
                          onSelect={this.onChange}
                          filterOption={(inputValue, option) =>
                              option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                          }
            />

        )
    }

}