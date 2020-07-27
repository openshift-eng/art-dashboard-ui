import React, {Component} from "react";
import {Carousel, List} from "antd";


function onChange(a, b, c) {
    console.log(a, b, c);
}

export default class Whatsnew_carousel extends Component{

    render() {

        const data_july_27_2020 = [
            "Build History: Data source migrated from SimpleDB to MySQL. Faster results. Now can support even more advanced filters.",
            "Build History: Support for link with query parameters to support link sharing for filtered results.",
            "Build History: Export history data to csv.",
            "Build History: Aesthetic UI changes. Cleaner \"More Details\" popup."
        ]

        const data_july_15_2020 = [
            "Release: Release status page for each openshift version. Sample Endpoint: /release/status/?type=branch&branch=openshift-4.6"
        ]

        const data_july_09_2020 = [
            "Build History: Advanced Filters has option to sort results based on columns.",
            "Build History: Semantically correct icons in the table.",
            "Build History: Quick Search over table headers.",
            "Build Health: Build History for the date available.",
            "Build Health: Build History for a particular package under health section.",
            "Build Health: All the tables under health have required sort and filter over columns.",
            "What's New: And the what's new section :)"
        ]

        const data_july_13_2020 = [
            "Release: Home Page for all the openshift versions. Endpoint : /release/status/?type=all",
            "Release: Status for specific openshift versions with all the advisories. Sample Endpoint : /release/status/?type=branch&branch=openshift-4.6",
            "Release: overview for specific advisory. Sample Endpoint : /release/advisory/overview/54579"
        ]

        return (
            <div style={{ margin: "30px", backgroundColor: "white"}} className="center">

                <List
                    size="large"
                    header={<div>New Features: July 20th 2020</div>}
                    footer={<div>Try them out!</div>}
                    bordered
                    dataSource={data_july_27_2020}
                    renderItem={item => <List.Item>{item}</List.Item>}
                />

                <br/>

                <List
                    size="large"
                    header={<div>New Features: July 15th 2020</div>}
                    footer={<div>Try them out!</div>}
                    bordered
                    dataSource={data_july_15_2020}
                    renderItem={item => <List.Item>{item}</List.Item>}
                />

                <br/>

                <List
                    size="large"
                    header={<div>New Features: July 13th 2020</div>}
                    footer={<div>Try them out!</div>}
                    bordered
                    dataSource={data_july_13_2020}
                    renderItem={item => <List.Item>{item}</List.Item>}
                />
                <br/>
                <List
                    size="large"
                    header={<div>New Features: July 9th 2020</div>}
                    footer={<div>Try them out!</div>}
                    bordered
                    dataSource={data_july_09_2020}
                    renderItem={item => <List.Item>{item}</List.Item>}
                />
            </div>
        )
    }

}