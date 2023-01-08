import React, {useEffect, useState} from "react";
import {advisory_details_for_advisory_id, advisory_ids_for_branch} from "../../api_calls/release_calls";
import {Empty, Typography} from "antd";
import RELEASE_BRANCH_DETAIL_TABLE from "./release_branch_detail_table";

const {Title} = Typography;


function ReleaseBranchDetail(props) {
    const [overviewTableData, setOverviewTableData] = useState(undefined);
    const [overviewTableDataPrevious, setOverviewTableDataPrevious] = useState(undefined);
    const [advisoryDetails, setAdvisoryDetails] = useState(undefined);
    const [advisoryDetailsPrevious, setAdvisoryDetailsPrevious] = useState(undefined);


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

            let table_data = [];
            for (const key in data["current"]) {
                if (data["current"].hasOwnProperty(key))
                    table_data.push({
                        type: key,
                        id: data["current"][key],
                        advisory_link: "https://errata.devel.redhat.com/advisory/" + data["current"][key]
                    })
            }
            setOverviewTableData(table_data);

            let table_data_previous = [];
            for (const key in data["previous"]) {
                if (data["previous"].hasOwnProperty(key))
                    table_data_previous.push({
                        type: key,
                        id: data["previous"][key],
                        advisory_link: "https://errata.devel.redhat.com/advisory/" + data["previous"][key]
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


    return (
        <div>
            <Title style={{paddingLeft: "20px", paddingTop: "40px"}} level={2}><code>{props.branch}</code></Title>

            <Title style={{paddingLeft: "40px", paddingTop: "40px"}} level={4}>
                <code>{"Current Advisories"}</code>
            </Title>
            {
                advisoryDetails ?
                    <>
                        <RELEASE_BRANCH_DETAIL_TABLE data={advisoryDetails}/>
                    </>
                    :
                    <Empty/>

            }
            <br/>

            <Title style={{paddingLeft: "40px", paddingTop: "40px"}} level={4}>
                <code>{"Previous Advisories"}</code>
            </Title>

            {
                advisoryDetailsPrevious ?
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
