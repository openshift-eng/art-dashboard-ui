import React, {Component} from "react";
import {Carousel, List} from "antd";


function onChange(a, b, c) {
    console.log(a, b, c);
}

export default class Whatsnew_carousel extends Component{

    render() {

        const data_july_30_2020 = [
            "Release Page: The page now has previous advisories as well for an OpenShift version."
        ]

        const data_july_29_2020 = [
            "Build History: Build status icon has link to brew task.",
            "Build History: Source commit shows commit id instead of link icon.",
            "Release: No github developer api stats on release home page."
        ]

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

        const data_july_21_2020 = [
            "Release: Revamped openshift branch page. Sample Endpoint : /release/status/?type=branch&branch=openshift-4.6",
            "Release: Dropdown to select openshift branch to get advisory details."
        ]

        return (
            <div style={{ margin: "30px"}} className="center">

                <List
                    size="large"
                    style={{backgroundColor: "white"}}
                    header={<div>New Features: July 30th 2020</div>}
                    footer={<div>Try them out!</div>}
                    bordered
                    dataSource={data_july_30_2020}
                    renderItem={item => <List.Item>{item}</List.Item>}
                />

                <br/>

                <List
                    size="large"
                    style={{backgroundColor: "white"}}
                    header={<div>New Features: July 29th 2020</div>}
                    footer={<div>Try them out!</div>}
                    bordered
                    dataSource={data_july_29_2020}
                    renderItem={item => <List.Item>{item}</List.Item>}
                />

                <br/>

                <List
                    size="large"
                    style={{backgroundColor: "white"}}
                    header={<div>New Features: July 27th 2020</div>}
                    footer={<div>Try them out!</div>}
                    bordered
                    dataSource={data_july_27_2020}
                    renderItem={item => <List.Item>{item}</List.Item>}
                />

                <br/>

                <List
                    size="large"
                    style={{backgroundColor: "white"}}
                    header={<div>New Features: July 21st 2020</div>}
                    footer={<div>Try them out!</div>}
                    bordered
                    dataSource={data_july_21_2020}
                    renderItem={item => <List.Item>{item}</List.Item>}
                />
                <br/>

                <List
                    size="large"
                    style={{backgroundColor: "white"}}
                    header={<div>New Features: July 15th 2020</div>}
                    footer={<div>Try them out!</div>}
                    bordered
                    dataSource={data_july_15_2020}
                    renderItem={item => <List.Item>{item}</List.Item>}
                />

                <br/>

                <List
                    size="large"
                    style={{backgroundColor: "white"}}
                    header={<div>New Features: July 13th 2020</div>}
                    footer={<div>Try them out!</div>}
                    bordered
                    dataSource={data_july_13_2020}
                    renderItem={item => <List.Item>{item}</List.Item>}
                />
                <br/>
                <List
                    size="large"
                    style={{backgroundColor: "white"}}
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