import React, { useEffect, useState, useCallback, useRef } from "react";
import { advisory_details_for_advisory_id, advisory_ids_for_branch } from "../api_calls/release_calls";
import { Empty, Popover, Typography, message } from "antd";
import RELEASE_BRANCH_DETAIL_TABLE from "./release_branch_detail_table";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Pagination } from 'antd';
import { useRouter } from 'next/router'

const { Title } = Typography;

function ReleaseBranchDetail(props) {
    const [overviewTableData, setOverviewTableData] = useState(undefined);
    const [advisoryDetails, setAdvisoryDetails] = useState(undefined);
    const [current, setCurrent] = useState(undefined);
    const [currentJira, setCurrentJira] = useState(undefined);
    const [totalPages, setTotalPages] = useState(1);
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(null);
    const currentRef = useRef(current);
    const [isRouterReady, setIsRouterReady] = useState(false);
    const [isAdvisoryDetailsLoading, setIsAdvisoryDetailsLoading] = useState(false);
    const [isBranchDataLoading, setIsBranchDataLoading] = useState(false);

    const FIXED_ORDER = ["Extras", "Image", "Metadata", "Microshift", "Rpm"];

    // Display loading message
    const displayLoading = useCallback(() => {
        message.loading({
            content: "Loading Data",
            duration: 0,
            style: { position: "fixed", left: "50%", top: "20%" }
        });
    }, []);

    // Destroy loading message
    const destroyLoading = useCallback(() => {
        message.destroy();
        message.success({
            content: "Loaded",
            duration: 2,
            style: { position: "fixed", left: "50%", top: "20%", color: "#316DC1" }
        });
    }, []);

    const generateDataForEachAdvisory = useCallback(() => {
        setIsAdvisoryDetailsLoading(true); // Set loading state to true at the beginning
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

        Promise.all(promises)
            .then((advisories_data) => {
                advisories_data = advisories_data.filter(item => item !== null); // Remove nulls if any

                // Explicitly sort based on FIXED_ORDER
                advisories_data.sort((a, b) => {
                    return FIXED_ORDER.indexOf(a.type) - FIXED_ORDER.indexOf(b.type);
                });

                setAdvisoryDetails(advisories_data);
            })
            .finally(() => {
                setIsAdvisoryDetailsLoading(false); // Set loading state to false at the end
            });
    }, [overviewTableData]);

    const getBranchData = useCallback(async (branch, page) => {
        const targetPage = page || currentPage;
        if (!branch || page === undefined) return;

        setIsBranchDataLoading(true); // Start loading
        displayLoading();

        try {
            const data = await advisory_ids_for_branch(branch);

            const currentVersionKey = Object.keys(data)[page - 1];
            setCurrentJira(data[currentVersionKey][1]);
            setTotalPages(Object.keys(data).length);

            const tableData = Object.entries(data[currentVersionKey][0]).map(([type, id]) => ({
                type: type,
                id: id,
                advisory_link: "https://errata.devel.redhat.com/advisory/" + id
            }));
            setOverviewTableData(tableData);

            // Set current version after fetching data
            setCurrent(currentVersionKey);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsBranchDataLoading(false); // End loading
        }
    }, [currentPage, displayLoading]);

    // Handle page changes
    const handlePageChange = useCallback(newPage => {
        router.replace({
            pathname: router.pathname,
            query: { ...router.query, page: newPage }
        }, undefined, { shallow: true });
    }, [router]);

    useEffect(() => {
        // Update the ref when current changes
        currentRef.current = current;
    }, [current]);

    useEffect(() => {
        if (!router.isReady) {
            return;
        }
        setIsRouterReady(true);
        const newPage = parseInt(router.query.page, 10);
        if (!isNaN(newPage)) {
            setCurrentPage(newPage); // Update currentPage with URL's query parameter
        } else {
            setCurrentPage(1); // Fallback to page 1 if no valid page in URL
        }
    }, [router.isReady, router.query.page]);

    // Effect for data fetching
    useEffect(() => {
        if (props.branch && currentPage !== null && isRouterReady) {
            setIsBranchDataLoading(true); // Start branch data loading
            setIsAdvisoryDetailsLoading(true); // Start advisory details loading
            displayLoading();
            getBranchData(props.branch, currentPage);
        }
    }, [props.branch, currentPage, getBranchData, isRouterReady]);

    useEffect(() => {
        // This effect is for handling the cleanup/loading messages.
        if (advisoryDetails && advisoryDetails.length > 0) {
            destroyLoading();
        }
    }, [advisoryDetails]);

    useEffect(() => {
        // This effect is responsible for processing data once the overviewTableData is set/updated.
        if (current && overviewTableData) {
            generateDataForEachAdvisory();
        }
    }, [current, overviewTableData]);

    // Effect for handling loading state
    useEffect(() => {
        // Check if both data fetching and processing are complete
        if (!isBranchDataLoading && !isAdvisoryDetailsLoading) {
            destroyLoading(); // Hide the loading message
        }
    }, [isBranchDataLoading, isAdvisoryDetailsLoading]);

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
            <div style={{ paddingLeft: "40px", paddingTop: "40px" }}>
                <Title level={4}>
                    <code> {current ? current : props.branch} <Popover content={popover(current)} trigger="hover">
                        <InfoCircleOutlined style={{ color: "#1677ff" }} />
                    </Popover> </code>
                </Title>
                <p style={{ paddingLeft: "10px" }}>
                    <a href={`https://issues.redhat.com/browse/${currentJira}`}>{currentJira}</a>
                </p>
            </div>
            {
                advisoryDetails ?
                    <>
                        <RELEASE_BRANCH_DETAIL_TABLE data={advisoryDetails} currentPage={currentPage} totalPages={totalPages} />
                        <Pagination current={currentPage} onChange={handlePageChange} total={totalPages} showSizeChanger={false}
                            pageSize={1} />
                    </>
                    :
                    <Empty />
            }
        </div>
    );
}

export default ReleaseBranchDetail;