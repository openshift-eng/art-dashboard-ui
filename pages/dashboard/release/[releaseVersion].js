import React, {useEffect} from "react";
import {Layout, Menu, message} from "antd";
import OPENSHIFT_VERSION_SELECT from "../../../components/release/openshift_version_select";
import RELEASE_BRANCH_DETAIL from "../../../components/release/release_branch_detail"
import {useRouter} from 'next/router'
import Head from "next/head";
import {RocketOutlined, ToolOutlined} from "@ant-design/icons";


function ReleaseHomePage() {
    const router = useRouter()
    const {releaseVersion} = router.query

    const {Footer, Sider} = Layout;

    message.config({
        maxCount: 2
    })

    const displayLoading = () => {
        message.loading({
            content: "Loading Data",
            duration: 0,
            style: {position: "fixed", left: "50%", top: "20%"}
        }).then(r => {/* do nothing */
        });
    }

    const destroyLoading = () => {

        message.destroy()
        message.success({
            content: "Loaded",
            duration: 2,
            style: {position: "fixed", left: "50%", top: "20%", color: "#316DC1"}
        }).then(r => {/* do nothing */
        })

    }

    useEffect(() => {
        displayLoading();
    }, [])


    const menuItems = [
        {
            key: "releaseStatusMenuItem",
            icon: <RocketOutlined/>,
            label: <a href={"/dashboard"}>Release status</a>
        },
        {
            key: "whatsNew",
            icon: <ToolOutlined/>,
            label: "Help"
        },
    ]

    return (

        <div>
            <Head>
                <title>ART Dashboard</title>
                <link rel="icon" href="/redhat-logo.png"/>
            </Head>
            <Layout>
                <Sider collapsed={false}>
                    <div>
                        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']} items={menuItems}/>

                    </div>
                </Sider>

                <Layout>

                    <div align={"center"} style={{
                        background: "white", height: "120px", float: "left"
                    }}>
                        <div className="center">
                            <h1 style={{color: "#316DC1", margin: "20px", fontSize: "50px"}}>OpenShift Release
                                Portal</h1>
                        </div>
                    </div>
                    <OPENSHIFT_VERSION_SELECT branch={releaseVersion}/>
                    <RELEASE_BRANCH_DETAIL branch={releaseVersion}
                                           destroyLoadingCallback={destroyLoading}/>
                    <Footer style={{textAlign: 'center'}}>
                        RedHat © 2023
                    </Footer>
                </Layout>
            </Layout>
        </div>
    );
}

export default ReleaseHomePage;
