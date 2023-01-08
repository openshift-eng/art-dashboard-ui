import React, {Component} from "react";
import {List, Table} from "antd";
import {Collapse} from 'antd';
import {LinkOutlined} from '@ant-design/icons';

const {Panel} = Collapse;


export default class Whatsnew_carousel extends Component {

    parse_based_on_section_request() {


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

        const data_july_13_2020 = [
            "Release: Home Page for all the openshift versions. Endpoint : /release/status/?type=all",
            "Release: Status for specific openshift versions with all the advisories. Sample Endpoint : /release/status/?type=branch&branch=openshift-4.6",
            "Release: overview for specific advisory. Sample Endpoint : /release/advisory/overview/54579"
        ]

        const data_july_21_2020 = [
            "Release: Revamped openshift branch page. Sample Endpoint : /release/status/?type=branch&branch=openshift-4.6",
            "Release: Dropdown to select openshift branch to get advisory details."
        ]

        const navigating_table_data = [
            {
                'section': 'Release',
                'url': 'http://art-dash-ui-aos-art-web.apps.ocp4.prod.psi.redhat.com/release/status/?type=all',
                'desc': 'This is where you can find all the major OpenShift versions. The current status of each release. You also find the current and the previous advisories ' +
                    'associated with each version with information about approval status, reviewer details, release date and current status.',
                'children': [
                    {
                        'section': 'Release Advisories',
                        'url': 'http://art-dash-ui-aos-art-web.apps.ocp4.prod.psi.redhat.com/release/status/detail/openshift-4.6',
                        'desc': 'This page has current and previous advisors (rpm, image, metadata, extras) details per OpenShift release version.'
                    },
                    {
                        'section': 'Advisory Details',
                        'url': 'http://art-dash-ui-aos-art-web.apps.ocp4.prod.psi.redhat.com/release/advisory/overview/54579',
                        'desc': 'This pages displays details for a particular advisory. The details include bugs, release date, status of release.'
                    }
                ]
            },
            {
                'section': 'Build',
                'url': undefined,
                'desc': 'This sections has data for all the builds for OpenShift builds attempted by ART team. The two major type of information' +
                    'is the build history and the build health.',
                children: [
                    {
                        'section': 'Build History',
                        'url': 'http://art-dash-ui-aos-art-web.apps.ocp4.prod.psi.redhat.com/build/history',
                        'desc': 'This page shows the complete history of all the build attempts made by ART team. The history can be filtered with ' +
                            'multiple parameters.'
                    },
                    {
                        'section': 'Build Health',
                        'url': undefined,
                        'desc': 'This sections has various pages to help understand the build history using daily reports and aggregated stats with options ' +
                            'to filter.',
                        children: [
                            {
                                'section': 'Daily Build Health',
                                'url': 'http://art-dash-ui-aos-art-web.apps.ocp4.prod.psi.redhat.com/health/daily/overview',
                                'desc': 'This page contains the daily overview and health of builds including success rate, failures.'
                            },
                            {
                                'section': 'Detail Daily Health',
                                'url': 'http://art-dash-ui-aos-art-web.apps.ocp4.prod.psi.redhat.com/health/daily/detail/2020-08-04',
                                'desc': 'This page is the expansion of health for a particular date. The page is easy to navigate and intuitive.'
                            }
                        ]
                    }
                ]
            }
        ]

        const features_table_data = [
            {
                'feature': 'Release',
                'desc': "OpenShift release version details.",
                'date': "July 13th 2020",
                children: [
                    {
                        'feature': 'Release Home',
                        'desc': 'Access to all the OpenShift version.',
                        'date': '13th July 2020'
                    },
                    {
                        'feature': 'Release Version',
                        'desc': 'Detailed view of a particular OpenShift version. The details include release status, dates, approval statuses, reviewers for attached advisories.',
                        'date': '13th July 2020',
                        children: [
                            {
                                'feature': 'Change OpenShift Version',
                                'desc': 'Change the OpenShift version in the detail page to load data for the selected version. Helpful in quickly navigating through different versions.',
                                'date': 'July 21st 2020'
                            },
                            {
                                'feature': 'Detailed Release Version',
                                'desc': 'Detailed data for a particular version. Includes bug history, statuses, dates, approvals and reviewers.',
                                'date': 'July 15th 2020'
                            },
                            {
                                'feature': 'Current Advisories',
                                'desc': 'The release version page has current advisories attached to the release version.',
                                'date': 'July 15th 2020'
                            },
                            {
                                'feature': 'Previous Advisories',
                                'desc': 'The release version page has previous advisories that were attached to the release version.',
                                'date': 'July 30th 2020'
                            }
                        ]
                    },

                ]
            },
            {
                'feature': 'Build',
                'desc': 'Attempted ART build data.',
                'date': 'July 1st 2020',
                children: [
                    {
                        'feature': 'Build History',
                        'desc': 'Displays all the builds attempted by ART.',
                        'date': 'July 1st 2020',
                        children: [
                            {
                                'feature': 'Quick Filters',
                                'desc': 'The history table has quick filters over the table header.',
                                'date': 'July 9th 2020',
                            },
                            {
                                'feature': 'Advanced Filters',
                                'desc': 'The history page has advanced filters to include multiple parameters to do search on.',
                                'date': 'July 1st 2020',
                            },
                            {
                                'feature': 'Export Build History',
                                'desc': 'The history page has option to export the filtered data into a csv.',
                                'date': 'July 27th 2020',
                            }
                        ]
                    },
                    {
                        'feature': 'Build Health',
                        'desc': 'Aggregated data for ART builds.',
                        'date': 'July 9th 2020',
                        children: [
                            {
                                'feature': 'Daily Overview',
                                'desc': 'Date wise overview of the builds.',
                                'date': 'July 9th 2020',
                            },
                            {
                                'feature': 'Expanded Daily Overview',
                                'desc': 'Detailed overview of builds for a date',
                                'date': 'July 9th 2020',
                            },
                            {
                                'feature': 'Quick Search',
                                'desc': 'All the tables in build history have quick search options on table header.',
                                'date': 'July 9th 2020',
                            }
                        ]
                    }
                ]
            }
        ]

        const features_table_column = [
            {
                title: 'Feature',
                key: 'feature',
                dataIndex: 'feature'
            },
            {
                title: 'Feature Description',
                key: 'desc',
                dataIndex: 'desc'
            },
            {
                title: 'Date on Inclusion',
                key: 'date',
                dataIndex: 'date'
            }
        ]

        const navigating_table_column = [
            {
                title: 'Section',
                key: 'section',
                dataIndex: 'section',
                width: "15%"
            },
            {
                title: 'Description',
                key: 'desc',
                dataIndex: 'desc',
                width: "75%"
            },
            {
                title: "URL",
                key: 'url',
                dataIndex: 'url',
                render: (data, record) => {
                    if (data !== undefined)
                        return (
                            <a href={data}><LinkOutlined/>
                            </a>
                        )
                    else {
                        return (
                            <p></p>
                        )
                    }
                },
                width: "10%"
            }

        ]


        return (
            <Collapse defaultActiveKey={"Portal Navigation"} accordion bordered={false}>
                <Panel key={"Portal Navigation"} header={"Portal Navigation"}>
                    <div style={{marginLeft: "50px", marginTop: "30px"}}>
                        <h5>
                            Sections
                        </h5>
                        <ul>
                            <li style={{margin: "10px", listStyleType: "circle"}}>
                                The OpenShift Release Portal can be used to access various information about the release
                                process and release status of OpenShift.
                            </li>
                            <li style={{margin: "10px", listStyleType: "circle"}}>
                                All the information is segregated into sections for ease of use.
                            </li>
                            <li style={{margin: "10px", listStyleType: "circle"}}>
                                The different sections can be access through navigation menu available on the left of
                                the page.
                            </li>
                        </ul>
                        <Table dataSource={navigating_table_data} columns={navigating_table_column} pagination={false}/>
                    </div>

                </Panel>
                <Panel key={"Features"} header={"Features"}>
                    <Table dataSource={features_table_data} columns={features_table_column} pagination={false}/>
                </Panel>
                <Panel key={"Feature History"} header={"Feature History"}>
                    <div style={{padding: "30px"}}>
                        <Collapse accordion defaultActiveKey={['1']}>
                            <Panel key={"1"} header={"July 30th 2020"}>
                                <List
                                    size="large"
                                    style={{backgroundColor: "white"}}
                                    header={<div>New Features: July 30th 2020</div>}
                                    footer={<div>Try them out!</div>}
                                    bordered
                                    dataSource={data_july_30_2020}
                                    renderItem={item => <List.Item>{item}</List.Item>}
                                />
                            </Panel>
                            <Panel key={"2"} header={"July 29th 2020"}>
                                <List
                                    size="large"
                                    style={{backgroundColor: "white"}}
                                    header={<div>New Features: July 29th 2020</div>}
                                    footer={<div>Try them out!</div>}
                                    bordered
                                    dataSource={data_july_29_2020}
                                    renderItem={item => <List.Item>{item}</List.Item>}
                                />
                            </Panel>
                            <Panel key={"3"} header={"July 27th 2020"}>
                                <List
                                    size="large"
                                    style={{backgroundColor: "white"}}
                                    header={<div>New Features: July 27th 2020</div>}
                                    footer={<div>Try them out!</div>}
                                    bordered
                                    dataSource={data_july_27_2020}
                                    renderItem={item => <List.Item>{item}</List.Item>}
                                />
                            </Panel>

                            <Panel key={"4"} header={"July 21st 2020"}>
                                <List
                                    size="large"
                                    style={{backgroundColor: "white"}}
                                    header={<div>New Features: July 21st 2020</div>}
                                    footer={<div>Try them out!</div>}
                                    bordered
                                    dataSource={data_july_21_2020}
                                    renderItem={item => <List.Item>{item}</List.Item>}
                                />
                            </Panel>

                            <Panel key={"5"} header={"July 15th 2020"}>
                                <List
                                    size="large"
                                    style={{backgroundColor: "white"}}
                                    header={<div>New Features: July 15th 2020</div>}
                                    footer={<div>Try them out!</div>}
                                    bordered
                                    dataSource={data_july_15_2020}
                                    renderItem={item => <List.Item>{item}</List.Item>}
                                />
                            </Panel>

                            <Panel key={"6"} header={"July 13th 2020"}>
                                <List
                                    size="large"
                                    style={{backgroundColor: "white"}}
                                    header={<div>New Features: July 13th 2020</div>}
                                    footer={<div>Try them out!</div>}
                                    bordered
                                    dataSource={data_july_13_2020}
                                    renderItem={item => <List.Item>{item}</List.Item>}
                                />
                            </Panel>

                            <Panel key={"7"} header={"July 9th 2020"}>
                                <List
                                    size="large"
                                    style={{backgroundColor: "white"}}
                                    header={<div>New Features: July 9th 2020</div>}
                                    footer={<div>Try them out!</div>}
                                    bordered
                                    dataSource={data_july_27_2020}
                                    renderItem={item => <List.Item>{item}</List.Item>}
                                />
                            </Panel>
                        </Collapse>
                    </div>
                </Panel>
            </Collapse>
        )

    }


    render() {

        return (
            <div style={{padding: "30px"}}>
                {this.parse_based_on_section_request()}
            </div>);
    }

}
