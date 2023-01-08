import React, {useEffect, useState} from 'react';
import {Layout, Menu, Spin} from 'antd';
import {Link, Route, Routes, Navigate} from "react-router-dom";
import {gaVersion} from "./api_calls/release_calls";
import {
    ToolOutlined,
    RocketOutlined
} from '@ant-design/icons';
import RELEASE_HOME_PAGE from "./components/release/release_home_page";
import Cookies from "js-cookie";


function App() {
    const [gaVersionValue, setGaVersionValue] = useState("4.11");   // Default set to 4.11

    const getGaVersion = () => {
        gaVersion().then(data => {
            if (data["status"] === "success") {
                setGaVersionValue(data["payload"]);
                Cookies.set("openshift_ga_version", data["payload"], {
                    maxAge: 3600 // Will expire after 1hr (value is in number of sec.)
                })
            }
        })
    }

    useEffect(() => {
        const gaFromCookie = Cookies.get("openshift_ga_version")

        if (gaFromCookie) {
            setGaVersionValue(gaFromCookie);
        } else {
            getGaVersion();
        }

    }, [])

    const {Header, Footer, Sider, Content} = Layout;

    return (
        <div>
            <Layout>
                <Sider collapsed={false}>
                    <div>
                        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
                            <Menu.Item key="releaseStatusMenuItem" icon={<RocketOutlined/>}>
                                <Link to={`/release/status?branch=openshift-${gaVersionValue}`}>
                                    Release status
                                </Link>
                            </Menu.Item>
                            <Menu.Item key={"whatsNew"} icon={<ToolOutlined/>}>
                                <Link to={"/help"}>
                                    Help
                                </Link>
                            </Menu.Item>
                        </Menu>
                    </div>
                </Sider>

                <Layout>

                    <Header style={{background: "white", height: "120px", float: "left"}}>
                        <div className="center">
                            <h1 style={{color: "#316DC1", margin: "20px"}}>OpenShift Release Portal</h1>
                        </div>
                    </Header>
                    {
                        gaVersionValue ?
                            <Content>
                                <Routes>
                                    <Route path="/release/status" element={<RELEASE_HOME_PAGE/>}/>
                                    <Route path='/'
                                           element={<Navigate to={`/release/status?branch=openshift-${gaVersionValue}`}
                                                              replace/>}/>
                                </Routes>
                            </Content>
                            :
                            <Spin/>
                    }
                    <Footer style={{textAlign: 'center'}}>
                        RedHat © 2023
                    </Footer>
                </Layout>
            </Layout>
        </div>
    );

}

export default App;