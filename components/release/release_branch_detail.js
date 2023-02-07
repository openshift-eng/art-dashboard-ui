import React, {useEffect, useState} from "react";
import {advisory_details_for_advisory_id, advisory_ids_for_branch} from "../api_calls/release_calls";
import {Empty, Popover, Typography} from "antd";
import RELEASE_BRANCH_DETAIL_TABLE from "./release_branch_detail_table";
import {InfoCircleOutlined} from "@ant-design/icons";

const {Title} = Typography;


function ReleaseBranchDetail(props) {
    const [overviewTableData, setOverviewTableData] = useState(undefined);
    const [overviewTableDataPrevious, setOverviewTableDataPrevious] = useState(undefined);
    const [advisoryDetails, setAdvisoryDetails] = useState(undefined);
    const [advisoryDetailsPrevious, setAdvisoryDetailsPrevious] = useState(undefined);
    const [current, setCurrent] = useState(undefined)
    const [previous, setPrevious] = useState(undefined)
    const [currentJira, setCurrentJira] = useState(undefined)
    const [previousJira, setPreviousJira] = useState(undefined)


    const generateDataForEachAdvisory = () => {
        setAdvisoryDetails([]);
        let advisories_data = []

        const number_of_entries_in_overview_table_data = overviewTableData.length;

        let count = 0;

        overviewTableData.forEach((data, index) => {

            let advisory_data = {};

            advisory_details_for_advisory_id(data.id).then(data_api => {
                advisory_data["advisory_details"] = data_api["data"]["advisory_details"];
                advisory_data["bug_details"] = data_api["data"]["bugs"];
                advisory_data["bug_summary"] = data_api["data"]["bug_summary"];
                advisory_data["type"] = data.type;
                advisories_data.push(advisory_data);
                count += 1;

                if (count === number_of_entries_in_overview_table_data) {
                    setAdvisoryDetails(advisories_data);
                }

            });

        });
    }

    const generateDataForEachAdvisoryPrevious = () => {
        setAdvisoryDetailsPrevious([]);
        let advisories_data = []

        const number_of_entries_in_overview_table_data_previous = overviewTableDataPrevious.length;

        let count = 0;

        overviewTableDataPrevious.forEach((data, index) => {

            let advisory_data = {};

            advisory_details_for_advisory_id(data.id).then(data_api => {
                advisory_data["advisory_details"] = data_api["data"]["advisory_details"];
                advisory_data["bug_details"] = data_api["data"]["bugs"];
                advisory_data["bug_summary"] = data_api["data"]["bug_summary"];
                advisory_data["type"] = data.type;
                advisories_data.push(advisory_data);
                count += 1;
                if (number_of_entries_in_overview_table_data_previous === count) {
                    setAdvisoryDetailsPrevious(advisories_data);
                }
            });

        });

    }

    const getBranchData = (branch) => {

        advisory_ids_for_branch(branch).then((data) => {
            const current = Object.keys(data)[0];
            const previous = Object.keys(data)[1];

            setCurrent(current);
            setPrevious(previous);

            setCurrentJira(data[current][1])
            setPreviousJira(data[previous][1])

            let table_data = [];
            for (const key in data[current][0]) {

                if (data[current][0].hasOwnProperty(key)) {
                    table_data.push({
                        type: key,
                        id: data[current][0][key],
                        advisory_link: "https://errata.devel.redhat.com/advisory/" + data[current][0][key]
                    })
                }

            }
            setOverviewTableData(table_data);

            let table_data_previous = [];
            for (const key in data[previous][0]) {

                if (data[previous][0].hasOwnProperty(key))
                    table_data_previous.push({
                        type: key,
                        id: data[previous][0][key],
                        advisory_link: "https://errata.devel.redhat.com/advisory/" + data[previous][0][key]
                    })
            }

            setOverviewTableDataPrevious(table_data_previous);

        })

    }
    useEffect(() => {
        if (overviewTableData) {
            generateDataForEachAdvisory();
        }
    }, [overviewTableData])

    useEffect(() => {
        if (overviewTableDataPrevious) {
            generateDataForEachAdvisoryPrevious();
        }
    }, [overviewTableDataPrevious])

    useEffect(() => {
        if (props.branch) {
            getBranchData(props.branch);
        }
    }, [props.branch])

    useEffect(() => {
        if (advisoryDetails && advisoryDetailsPrevious && advisoryDetails.length > 0 && advisoryDetailsPrevious.length > 0) {
            props.destroyLoadingCallback();
        }
    }, [advisoryDetails, advisoryDetailsPrevious])

    const popover = (value) => (
        <div><a target="_blank" rel="noopener noreferrer"
                href={`https://amd64.ocp.releases.ci.openshift.org/releasestream/4-stable/release/${value}`}>amd64</a>&nbsp;|&nbsp;
            <a target="_blank" rel="noopener noreferrer"
               href={`https://s390x.ocp.releases.ci.openshift.org/releasestream/4-stable-s390x/release/${value}`}>s390x</a>&nbsp;|&nbsp;
            <a target="_blank" rel="noopener noreferrer"
               href={`https://ppc64le.ocp.releases.ci.openshift.org/releasestream/4-stable-ppc64le/release/${value}`}>ppc64le</a>&nbsp;|&nbsp;
            <a target="_blank" rel="noopener noreferrer"
               href={`https://arm64.ocp.releases.ci.openshift.org/releasestream/4-stable-arm64/release/${value}`}>arm64</a>
        </div>
    );

    return (
        <div>
            <div style={{paddingLeft: "40px", paddingTop: "40px"}}>
                <Title level={4}>
                    <code> {current} <Popover content={popover(current)} trigger="hover">
                        <InfoCircleOutlined style={{color: "#1677ff"}}/>
                    </Popover> </code>
                </Title>
                <p style={{paddingLeft: "10px"}}>
                    <a href={`https://issues.redhat.com/browse/${currentJira}`}>{currentJira}</a>
                </p>
            </div>
            {
                advisoryDetails ?
                    <>
                        <RELEASE_BRANCH_DETAIL_TABLE data={advisoryDetails}/>
                    </>
                    :
                    <Empty/>

            }
            <br/>
            <div style={{paddingLeft: "40px", paddingTop: "40px"}}>
                <Title level={4}>
                    <code> {previous} <Popover content={popover(previous)} trigger="hover">
                        <InfoCircleOutlined style={{color: "#1677ff"}}/>
                    </Popover> </code>
                </Title>
                <p style={{paddingLeft: "10px"}}>
                    <a href={`https://issues.redhat.com/browse/${previousJira}`}>{previousJira}</a>
                </p>
            </div>
            {
                advisoryDetailsPrevious && current !== previous ?
                    <>
                        <RELEASE_BRANCH_DETAIL_TABLE data={advisoryDetailsPrevious}/>
                    </>
                    :
                    <Empty/>

            }
        </div>
    )


}

export default ReleaseBranchDetail;
