import React, { useEffect, useState } from 'react';
import { Layout, Menu, Typography, Spin, Card } from 'antd';
import { RocketOutlined, ReloadOutlined, FileImageOutlined } from '@ant-design/icons';
import Head from 'next/head';
import OPENSHIFT_VERSION_SELECT from "../../../components/release/openshift_version_select";
import ImagesList from "../../../components/release/RpmsImagesList";
import {getReleaseBranchesFromOcpBuildData} from "../../../components/api_calls/release_calls";

const { Footer, Sider } = Layout;

function RpmImages() {
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [initialVersion, setInitialVersion] = useState(null);

    useEffect(() => {
        getReleaseBranchesFromOcpBuildData().then(loopData => {
            const versions = loopData.map(detail => detail["name"]);
            setInitialVersion(versions[0]); // set initial version to the latest version
            setSelectedVersion(versions[0]); // start loading data for the latest version
        });
    }, []);

    const menuItems = [
        {
            key: "releaseStatusMenuItem",
            icon: <RocketOutlined />,
            label: <a href={"/dashboard"}><p style={{fontSize: "medium"}}>Release status</p></a>
        },
        {
            key: "buildHistory",
            icon: <ReloadOutlined />,
            label: <a href={"/dashboard/build/history"}><p style={{fontSize: "medium"}}>Build History</p></a>
        },
        {
            key: "rpmImages",
            icon: <FileImageOutlined />,
            label: <a href={"/dashboard/rpm_images"}><p style={{fontSize: "medium"}}>RPMs & Images</p></a>
        },
    ];

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
                    <div align={"center"} style={{background: "white", height: "120px", float: "left"}}>
                        <div className="center">
                            <h1 style={{color: "#316DC1", margin: "20px", fontSize: "4.2rem", fontWeight: "normal"}}>
                                OpenShift Release Portal
                            </h1>
                        </div>
                    </div>

                    <div className={"version-header"} style={{ display: 'flex', justifyContent: 'space-between', padding: '30px' }}>
                        {selectedVersion && 
                            <h2 className="ant-typography" style={{ paddingLeft: '20px' }}>
                                <code>{selectedVersion} </code>
                            </h2>
                        }
                        <div align="right">
                        <OPENSHIFT_VERSION_SELECT initialVersion={initialVersion} onVersionChange={setSelectedVersion} />
                        </div>
                    </div>

                    <div style={selectedVersion ? { marginLeft: '20px' } : { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        {selectedVersion 
                            ? <Card style={{ width: '100%' }}>
                                <ImagesList branch={selectedVersion} />
                              </Card>
                            : <Spin size="large" /> // This will display a large loading spinner while `selectedVersion` is null
                        }
                    </div>             
                    <Footer style={{textAlign: 'center'}}>
                        RedHat © 2023
                    </Footer>
                </Layout>
            </Layout>
        </div>
    );
}

export default RpmImages;