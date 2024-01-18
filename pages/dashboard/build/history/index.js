import React, { useEffect, useState, useCallback } from "react";
import { getBuilds } from "../../../../components/api_calls/build_calls";
import BUILD_HISTORY_TABLE from "../../../../components/build/build_history_table";
import { RocketOutlined, ReloadOutlined, FileImageOutlined } from "@ant-design/icons";
import Head from "next/head";
import { Layout, Menu } from "antd";
import { useRouter } from 'next/router';

export default function BUILD_HISTORY_HOME() {
    const [data, setData] = useState([]);
    const [searchParams, setSearchParams] = useState({})
    const [page, setPage] = useState(1);
    const [nvr, setNvr] = useState(""); // Updated from buildNo to nvr
    const [DistgitName, setDistgitName] = useState("");
    const [buildStatus, setBuildStatus] = useState("");
    const [taskId, setTaskId] = useState("");
    const [version, setVersion] = useState("");
    const [cgit, setCgit] = useState("");
    const [sourceCommit, setSourceCommit] = useState("");
    const [jenkinsBuild, setJenkinsBuild] = useState("");
    const [time, setTime] = useState("");
    const [totalCount, setTotalCount] = useState(undefined);
    const router = useRouter();
    const [streamOnly, setStreamOnly] = useState(false);

    const { Footer, Sider } = Layout;

    const onPageChange = (pageNo) => {
        setPage(pageNo);
        updateURLWithFilters({ ...searchParams, page: pageNo }); // Update searchParams with the new page number
    }


    const updateURLWithFilters = useCallback((updatedParams) => {
        // Merge the current searchParams with the new parameters
        const mergedParams = { ...searchParams, ...updatedParams };

        // Filter out empty or null parameters
        Object.keys(mergedParams).forEach(key => {
            if (mergedParams[key] === "" || mergedParams[key] == null) {
                delete mergedParams[key];
            }
        });

        // Construct the new URL with the filtered parameters
        const newURL = new URL(window.location.href);
        newURL.search = new URLSearchParams(mergedParams).toString();
        window.history.pushState({}, '', newURL.toString());

        // Update the searchParams state
        setSearchParams(mergedParams);
    }, [searchParams]);

    const onNvrChange = useCallback((nvrValue) => { // Updated from onBuildNoChange to onNvrChange
        setNvr(nvrValue.trim());
        updateURLWithFilters({ build_0_nvr: nvrValue.trim() }); // Updated to use build_0_nvr
    }, [updateURLWithFilters]);

    const onDistgitNameChange = useCallback((name) => {
        setDistgitName(name.trim());
        updateURLWithFilters({ dg_name: name.trim() });
    }, [updateURLWithFilters]);

    const onBuildStatusChange = useCallback((status) => {
        setBuildStatus(status);
        updateURLWithFilters({ ...searchParams, brew_task_state: status });
    }, [updateURLWithFilters]);

    const onTaskIdChange = useCallback((task) => {
        setTaskId(task.trim());
        updateURLWithFilters({ ...searchParams, brew_task_id: task.trim() });
    }, [updateURLWithFilters]);

    const onVersionChange = (ver) => {
        const trimmedVer = ver.trim();
        let updatedParams = { ...searchParams };

        if (trimmedVer) {
            updatedParams.group = `openshift-${trimmedVer}`;
        } else {
            delete updatedParams.group; // Remove 'group' key if version is cleared
        }

        // Update the URL
        const newURL = new URL(window.location.href);
        newURL.search = new URLSearchParams(updatedParams).toString();
        window.history.pushState({}, '', newURL.toString());

        // Now update the state
        setSearchParams(updatedParams);
        setVersion(trimmedVer);
    };

    const onCgitChange = useCallback((cgitId) => {
        setCgit(cgitId.trim());
        updateURLWithFilters({ ...searchParams, dg_commit: cgitId.trim() });
    }, [updateURLWithFilters]);

    const onSourceCommitChange = useCallback((commit) => {
        setSourceCommit(commit.trim());
        updateURLWithFilters({ ...searchParams, label_io_openshift_build_commit_id: commit.trim() });
    }, [updateURLWithFilters]);

    const onJenkinsBuildChange = useCallback((data) => {
        setJenkinsBuild(data.trim());
        updateURLWithFilters({ ...searchParams, jenkins_build_url: data.trim() });
    }, [updateURLWithFilters]);

    const onTimeChange = useCallback((data) => {
        if (data) {
            data = data.split("|")
            if (data.length === 2) {
                const isoTime = `${data[0].trim()}T${data[1].trim()}Z`;
                setTime(isoTime);
                updateURLWithFilters({ ...searchParams, time_iso: isoTime });
            }
        } else {
            setTime("");
            updateURLWithFilters({ ...searchParams, time_iso: "" });
        }
    }, [updateURLWithFilters]);

    // useEffect for initializing state from URL params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const loadedParams = Object.fromEntries(params.entries());

        setNvr(loadedParams["build_0_nvr"] || "");
        setDistgitName(loadedParams["dg_name"] || "");
        setBuildStatus(loadedParams["brew_task_state"] || "");
        setTaskId(loadedParams["brew_task_id"] || "");
        setVersion(loadedParams["group"] ? loadedParams["group"].replace('openshift-', '') : "");
        setCgit(loadedParams["dg_commit"] || "");
        setSourceCommit(loadedParams["label_io_openshift_build_commit_id"] || "");
        setJenkinsBuild(loadedParams["jenkins_build_url"] || "");
        setTime(loadedParams["time_iso"] || "");

        // Initialize searchParams based on URL params
        setSearchParams(loadedParams);
    }, [router]);

    useEffect(() => {
        let isMounted = true;

        const getData = () => {
            getBuilds(searchParams, streamOnly).then((fetchedData) => {
                if (isMounted && fetchedData && Array.isArray(fetchedData["results"])) {
                    setData(fetchedData["results"]);
                    setTotalCount(fetchedData["results"].length);
                }
            });
        };

        getData();

        return () => {
            isMounted = false;
        };
    }, [searchParams, streamOnly]);


    const handleStreamToggle = (checked) => {
        setStreamOnly(checked);
    };

    const menuItems = [
        {
            key: "releaseStatusMenuItem",
            icon: <RocketOutlined />,
            label: <a href={"/dashboard"}><p style={{ fontSize: "medium" }}>Release status</p></a>
        },
        {
            key: "buildHistory",
            icon: <ReloadOutlined />,
            label: <a href={"/dashboard/build/history"}><p style={{ fontSize: "medium" }}>Build History</p></a>
        },
        {
            key: "rpmImages",
            icon: <FileImageOutlined />,
            label: <a href={"/dashboard/rpm_images"}><p style={{ fontSize: "medium" }}>RPMs & Images</p></a>
        }
    ]

    return (

        <div>
            <Head>
                <title>ART Dashboard</title>
                <link rel="icon" href="/redhat-logo.png" />
            </Head>
            <Layout>
                <Sider collapsed={false}>
                    <div style={{ paddingTop: "10px" }}>
                        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']} items={menuItems} />

                    </div>
                </Sider>

                <Layout>

                    <div align={"center"} style={{
                        background: "white", height: "120px", float: "left"
                    }}>
                        <div className="center">
                            <h1 style={{
                                color: "#316DC1",
                                margin: "20px",
                                fontSize: "4.2rem",
                                fontWeight: "normal"
                            }}>OpenShift Release
                                Portal</h1>
                        </div>
                    </div>
                    <BUILD_HISTORY_TABLE data={data} nvr={nvr} buildStatus={buildStatus} taskId={taskId} DistgitName={DistgitName}
                        version={version} cgit={cgit} sourceCommit={sourceCommit} jenkinsBuild={jenkinsBuild}
                        time={time} totalCount={totalCount} streamOnly={streamOnly}
                        onChange={onPageChange} onNvrChange={onNvrChange}
                        onDistgitNameChange={onDistgitNameChange} onBuildStatusChange={onBuildStatusChange}
                        onTaskIdChange={onTaskIdChange} onVersionChange={onVersionChange}
                        onCgitChange={onCgitChange} onSourceCommitChange={onSourceCommitChange}
                        onTimeChange={onTimeChange} onJenkinsBuildChange={onJenkinsBuildChange}
                        onStreamToggle={handleStreamToggle} />
                    <Footer style={{ textAlign: 'center' }}>
                        RedHat © 2023
                    </Footer>
                </Layout>
            </Layout>
        </div>


    );

}