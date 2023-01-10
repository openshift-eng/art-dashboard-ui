import React, {Component} from "react";
import {Popover, Button} from "antd";
import {FilterTwoTone} from "@ant-design/icons";
import SEARCH_FILTERS_POPOVER_TAGS from "./search_filters_popover_tags";


export default class Search_filters_popover extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: props.data
        }
    }

    UNSAFE_UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        this.setState({data: nextProps.data});
        console.log(JSON.stringify(this.state.data));
    }

    getPopoverContent() {

        let popoverData = [];

        if (this.state.data !== undefined) {
            const data = this.state.data;
            for (const key in data) {
                if (data.hasOwnProperty(key) && key === "order") {
                    continue;
                } else if (data.hasOwnProperty(key)) {
                    data[key].forEach((value) => {
                        popoverData.push(value);
                    });
                }
            }
        }

        if (popoverData.length > 0) {
            return popoverData.map((value) => {
                return (<SEARCH_FILTERS_POPOVER_TAGS data={value}/>);
            });
        } else {
            popoverData.push({"name": "No filters applied."});
            return popoverData.map((value) => {
                return (<SEARCH_FILTERS_POPOVER_TAGS data={value}/>);
            });
        }

    }

    render() {

        return (
            <Popover content={this.getPopoverContent()} title="Applied Filters" placement="leftBottom" className="right"
                     onClick={this.props.handleFilterBuildParamsButton}>
                <Button
                    size="medium"
                    className="right"
                    style={{
                        marginBottom: "20px",
                        background: "#316DC1",
                        color: "white"
                    }}

                    onClick={this.props.handleFilterBuildParamsButton}
                    icon={<FilterTwoTone/>}>Advanced Filters
                </Button>
                <Button/>
            </Popover>
        );
    }
}