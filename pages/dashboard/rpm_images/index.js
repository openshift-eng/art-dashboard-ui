import React, { useEffect, useState } from 'react';
import { Layout, Menu, Typography, Spin, Card, message } from 'antd';
import { RocketOutlined, ReloadOutlined, FileImageOutlined } from '@ant-design/icons';
import Head from 'next/head';
import OPENSHIFT_VERSION_SELECT from "../../../components/release/openshift_version_select";
import ImagesList from "../../../components/release/RpmsImagesList";
import {getReleaseBranchesFromOcpBuildData} from "../../../components/api_calls/release_calls";
import { gaVersion } from "../../../components/api_calls/release_calls";

const { Footer, Sider } = Layout;
const { Title } = Typography;

message.config({
    maxCount: 2
});

function RpmImages() {
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [initialVersion, setInitialVersion] = useState(null);
    const [loadingData, setLoadingData] = useState(true); // New loading state
    const [gaVersionValue, setGaVersionValue] = useState(null);

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

    useEffect(() => {
        getReleaseBranchesFromOcpBuildData().then(loopData => {
            const versions = loopData.map(detail => detail["name"]);
            setInitialVersion(versions[0]); // set initial version to the latest version
            setSelectedVersion(versions[0]); // start loading data for the latest version
        });
    
        gaVersion()
            .then(response => {
                setGaVersionValue(response.payload);
            })
            .catch(error => {
                console.error('Failed to fetch GA version:', error);
            });
    
        message.loading({
            content: "Loading Data",
            duration: 0,
            style: {position: "fixed", left: "50%", top: "20%"}
        });
    }, []);
    

    const handleLoaded = () => {
        message.destroy();
        message.success({
            content: "Loaded",
            duration: 2,
            style: {position: "fixed", left: "50%", top: "20%", color: "#316DC1"}
        });
        setLoadingData(false); // set loadingData to false when data is loaded
    };

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
                    {selectedVersion && gaVersionValue && 
                        <Title level={2} style={{ paddingLeft: '20px' }}>
                            <code>
                                {selectedVersion === `openshift-${gaVersionValue}` ?
                                    `${selectedVersion} (GA)`
                                    :
                                    selectedVersion
                                }
                            </code>
                        </Title>
                    }
                    <div align="right">
                    <OPENSHIFT_VERSION_SELECT initialVersion={initialVersion} onVersionChange={setSelectedVersion} />
                    </div>
                </div>

                    
                    <div style={selectedVersion ? { marginLeft: '20px' } : { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        {selectedVersion 
                            ? <Card style={{ width: '100%' }}>
                                <ImagesList branch={selectedVersion} onLoaded={handleLoaded} />
                            </Card>
                            : <Spin size="large" /> 
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
