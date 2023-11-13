import React, {useEffect, useState, useCallback} from "react";
import {getBuilds} from "../../../../components/api_calls/build_calls";
import BUILD_HISTORY_TABLE from "../../../../components/build/build_history_table";
import {RocketOutlined, ReloadOutlined, FileImageOutlined} from "@ant-design/icons";
import Head from "next/head";
import {Layout, Menu} from "antd";
import {useRouter} from 'next/router';

export default function BUILD_HISTORY_HOME() {
    const [data, setData] = useState([]);
    const [searchParams, setSearchParams] = useState({})
    const [page, setPage] = useState(1);
    const [buildNo, setBuildNo] = useState("");
    const [packageName, setPackageName] = useState("");
    const [buildStatus, setBuildStatus] = useState("");
    const [taskId, setTaskId] = useState("");
    const [version, setVersion] = useState("");
    const [cgit, setCgit] = useState("");
    const [sourceCommit, setSourceCommit] = useState("");
    const [jenkinsBuild, setJenkinsBuild] = useState("");
    const [time, setTime] = useState("");
    const [totalCount, setTotalCount] = useState(undefined);
    const router = useRouter();

    const {Footer, Sider} = Layout;

    const onPageChange = (pageNo) => {
        setPage(pageNo)
    }

    const updateURLWithFilters = useCallback((updatedParams) => {
        const mergedParams = { ...searchParams, ...updatedParams };
        const newURL = new URL(window.location.href);
        newURL.search = new URLSearchParams(mergedParams).toString();
        window.history.pushState({}, '', newURL.toString());
        setSearchParams(mergedParams);
    }, [searchParams]);

    const onBuildNoChange = useCallback((build) => {
        setBuildNo(build.trim());
        updateURLWithFilters({ build_0_id: build.trim() });
    }, [updateURLWithFilters]);

    const onPackageNameChange = useCallback((name) => {
        setPackageName(name.trim());
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

    const onVersionChange = useCallback((ver) => {
        setVersion(ver.trim());
        updateURLWithFilters({ ...searchParams, group: `openshift-${ver.trim()}` });
    }, [updateURLWithFilters]);

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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        let loadedParams = {};
        for (const [key, value] of params.entries()) {
            loadedParams[key] = value;
        }

        setSearchParams(loadedParams);

        // Set each state variable based on URL parameters
        setBuildNo(loadedParams["build_0_id"] || "");
        setPackageName(loadedParams["dg_name"] || "");
        setBuildStatus(loadedParams["brew_task_state"] || "");
        setTaskId(loadedParams["brew_task_id"] || "");
        setVersion(loadedParams["group"] ? loadedParams["group"].replace('openshift-', '') : "");
        setCgit(loadedParams["dg_commit"] || "");
        setSourceCommit(loadedParams["label_io_openshift_build_commit_id"] || "");
        setJenkinsBuild(loadedParams["jenkins_build_url"] || "");
        setTime(loadedParams["time_iso"] || "");
    }, [router]);

    
    useEffect(() => {
        let isMounted = true; // flag to check component mount status
    
        const getData = () => {
            getBuilds(searchParams).then((data) => {
                if (isMounted) {
                    setData(data["results"]);
                    setTotalCount(data["count"]);
                }
            });
        };
    
        getData();
    
        return () => {
            isMounted = false; // cleanup function to update flag when component unmounts
        };
    }, [searchParams, page]);
    
    const menuItems = [
        {
            key: "releaseStatusMenuItem",
            icon: <RocketOutlined/>,
            label: <a href={"/dashboard"}><p style={{fontSize: "medium"}}>Release status</p></a>
        },
        {
            key: "buildHistory",
            icon: <ReloadOutlined/>,
            label: <a href={"/dashboard/build/history"}><p style={{fontSize: "medium"}}>Build History</p></a>
        },
        {
            key: "rpmImages",
            icon: <FileImageOutlined/>,
            label: <a href={"/dashboard/rpm_images"}><p style={{fontSize: "medium"}}>RPMs & Images</p></a>
        }
    ]

    return (

        <div>
            <Head>
                <title>ART Dashboard</title>
                <link rel="icon" href="/redhat-logo.png"/>
            </Head>
            <Layout>
                <Sider collapsed={false}>
                    <div style={{paddingTop: "10px"}}>
                        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']} items={menuItems}/>

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
                    <BUILD_HISTORY_TABLE data={data} buildNo={buildNo} buildStatus={buildStatus} taskId={taskId} packageName={packageName} 
                                         version={version} cgit={cgit} sourceCommit={sourceCommit} jenkinsBuild={jenkinsBuild} 
                                         time={time} totalCount={totalCount} 
                                         onChange={onPageChange} onBuildNoChange={onBuildNoChange}
                                         onPackageNameChange={onPackageNameChange} onBuildStatusChange={onBuildStatusChange}
                                         onTaskIdChange={onTaskIdChange} onVersionChange={onVersionChange}
                                         onCgitChange={onCgitChange} onSourceCommitChange={onSourceCommitChange}
                                         onTimeChange={onTimeChange} onJenkinsBuildChange={onJenkinsBuildChange}/>
                    <Footer style={{textAlign: 'center'}}>
                        RedHat © 2023
                    </Footer>
                </Layout>
            </Layout>
        </div>


    );

}