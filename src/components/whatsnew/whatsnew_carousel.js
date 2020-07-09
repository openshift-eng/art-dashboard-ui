import React, {Component} from "react";
import {Carousel, List} from "antd";


function onChange(a, b, c) {
    console.log(a, b, c);
}

export default class Whatsnew_carousel extends Component{

    render() {

        const data = [
            "Build History: Advanced Filters has option to sort results based on columns.",
            "Build History: Semantically correct icons in the table.",
            "Build History: Quick Search over table headers.",
            "Build Health: Build History for the date available.",
            "Build Health: Build History for a particular package under health section.",
            "Build Health: All the tables under health have required sort and filter over columns.",
            "What's New: And the what's new section :)"
        ]

        return (
            <div style={{ margin: "30px", backgroundColor: "white"}} className="center">
                <List
                    size="large"
                    header={<div>New Features</div>}
                    footer={<div>Try them out!</div>}
                    bordered
                    dataSource={data}
                    renderItem={item => <List.Item>{item}</List.Item>}
                />
            </div>
        )
    }

}