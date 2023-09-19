import React, {useEffect, useState} from "react";
import {advisory_details_for_advisory_id, advisory_ids_for_branch} from "../api_calls/release_calls";
import {Empty, Popover, Typography} from "antd";
import RELEASE_BRANCH_DETAIL_TABLE from "./release_branch_detail_table";
import {InfoCircleOutlined} from "@ant-design/icons";
import { Pagination } from 'antd';

const {Title} = Typography;


function ReleaseBranchDetail(props) {
    const [overviewTableData, setOverviewTableData] = useState(undefined);
    const [advisoryDetails, setAdvisoryDetails] = useState(undefined);
    const [current, setCurrent] = useState(undefined);
    const [currentJira, setCurrentJira] = useState(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);


    const FIXED_ORDER = ["Extras", "Image", "Metadata", "Microshift", "Rpm"];

    const generateDataForEachAdvisory = () => {
        setAdvisoryDetails([]);
        const promises = overviewTableData.map((data, index) => {
            return advisory_details_for_advisory_id(data.id).then(data_api => {
                if (data_api["data"]) {
                    return {
                        advisory_details: data_api["data"]["advisory_details"],
                        bug_details: data_api["data"]["bugs"],
                        bug_summary: data_api["data"]["bug_summary"],
                        type: data.type
                    };
                }
                return null;
            });
        });
    
        Promise.all(promises).then((advisories_data) => {
            advisories_data = advisories_data.filter(item => item !== null); // Remove nulls if any
            
            // Explicitly sort based on FIXED_ORDER
            advisories_data.sort((a, b) => {
                return FIXED_ORDER.indexOf(a.type) - FIXED_ORDER.indexOf(b.type);
            });
            
            console.log("Sorted advisories_data: ", advisories_data);  // Debugging line
            setAdvisoryDetails(advisories_data);
        });
    };

    const getBranchData = (branch) => {
        advisory_ids_for_branch(branch).then((data) => {
            const allAdvisories = Object.keys(data);
            
            // Sort advisories here, e.g., in ascending order of advisory ID
            allAdvisories.sort((a, b) => a - b);
                    
            setCurrent(allAdvisories[currentPage - 1]);
            setCurrentJira(data[allAdvisories[currentPage - 1]][1]);
            setTotalPages(allAdvisories.length);
    
            let table_data = [];
            for (const key in data[allAdvisories[currentPage - 1]][0]) {
                if (data[allAdvisories[currentPage - 1]][0].hasOwnProperty(key)) {
                    table_data.push({
                        type: key,
                        id: data[allAdvisories[currentPage - 1]][0][key],
                        advisory_link: "https://errata.devel.redhat.com/advisory/" + data[allAdvisories[currentPage - 1]][0][key]
                    });
                }
            }
            setOverviewTableData(table_data);
        });
    };
    

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    useEffect(() => {
        if (overviewTableData) {
            generateDataForEachAdvisory();
        }
    }, [overviewTableData])

    useEffect(() => {
        getBranchData(props.branch);
    }, [props.branch, currentPage]);


    useEffect(() => {
        if (advisoryDetails && advisoryDetails.length > 0 ) {
            props.destroyLoadingCallback();
        }
    }, [advisoryDetails])

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
                        <RELEASE_BRANCH_DETAIL_TABLE data={advisoryDetails} currentPage={currentPage} totalPages={totalPages}/>
                        <Pagination current={currentPage} total={totalPages} onChange={handlePageChange} showSizeChanger={false}/>
                    </>
                    :
                    <Empty/>
            }
        </div>
    )
}

export default ReleaseBranchDetail;