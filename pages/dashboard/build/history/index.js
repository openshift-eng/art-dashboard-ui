import React, {useEffect, useState} from "react";
import {getBuilds} from "../../../../components/api_calls/build_calls";
import BUILD_HISTORY_TABLE from "../../../../components/build/build_history_table"
import {RocketOutlined, ReloadOutlined, FileImageOutlined} from "@ant-design/icons";
import Head from "next/head";
import {Layout, Menu} from "antd";


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

    const {Footer, Sider} = Layout;

    const onPageChange = (pageNo) => {
        setPage(pageNo)
    }

    const onBuildNoChange = (build) => {
        setBuildNo(build.trim())
    }

    const onPackageNameChange = (pkg) => {
        setPackageName(pkg.trim())
    }

    const onBuildStatusChange = (status) => {
        setBuildStatus(status.trim())
    }

    const onTaskIdChange = (task) => {
        setTaskId(task.trim())
    }

    const onVersionChange = (ver) => {
        setVersion(ver.trim())
    }

    const onCgitChange = (cgitId) => {
        setCgit(cgitId.trim())
    }

    const onSourceCommitChange = (commit) => {
        setSourceCommit(commit.trim())
    }

    const onJenkinsBuildChange = (data) => {
        setJenkinsBuild(data.trim())
    }

    const onTimeChange = (data) => {
        if (data) {
            data = data.split("|")
            if (data.length === 2)
                setTime(`${data[0].trim()}T${data[1].trim()}Z`)
        } else {
            setTime("")
        }

    }


    const getData = () => {
        searchParams["page"] = page

        if (buildNo !== "") {
            searchParams["build_0_id"] = buildNo
        } else {
            delete searchParams["build_0_id"]
        }

        if (packageName !== "") {
            searchParams["dg_name"] = packageName
        } else {
            delete searchParams["dg_name"]
        }

        if (buildStatus !== "") {
            searchParams["brew_task_state"] = buildStatus
        } else {
            delete searchParams["brew_task_state"]
        }

        if (taskId !== "") {
            searchParams["brew_task_id"] = taskId
        } else {
            delete searchParams["brew_task_id"]
        }

        if (version !== "") {
            searchParams["group"] = `openshift-${version}`
        } else {
            delete searchParams["group"]
        }

        if (cgit !== "") {
            searchParams["dg_commit"] = cgit
        } else {
            delete searchParams["dg_commit"]
        }

        if (sourceCommit !== "") {
            searchParams["label_io_openshift_build_commit_id"] = sourceCommit
        } else {
            delete searchParams["label_io_openshift_build_commit_id"]
        }

        if (time !== "") {
            searchParams["time_iso"] = time
        } else {
            delete searchParams["time_iso"]
        }

        if (jenkinsBuild !== "") {
            searchParams["jenkins_build_url"] = jenkinsBuild
        } else {
            delete searchParams["jenkins_build_url"]
        }

        getBuilds(searchParams).then((data) => {
            setData(data["results"]);
            setTotalCount(data["count"]);

        });

    }

    useEffect(() => {
        getData()
    }, [page, buildNo, packageName, buildStatus, taskId, version, cgit, sourceCommit, jenkinsBuild, time])

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
                    <BUILD_HISTORY_TABLE data={data} totalCount={totalCount} onChange={onPageChange}
                                         onBuildNoChange={onBuildNoChange} onPackageNameChange={onPackageNameChange}
                                         onBuildStatusChange={onBuildStatusChange} onTaskIdChange={onTaskIdChange}
                                         onVersionChange={onVersionChange} onCgitChange={onCgitChange}
                                         onSourceCommitChange={onSourceCommitChange} onTimeChange={onTimeChange}
                                         onJenkinsBuildChange={onJenkinsBuildChange}/>
                    <Footer style={{textAlign: 'center'}}>
                        RedHat © 2023
                    </Footer>
                </Layout>
            </Layout>
        </div>


    );

}