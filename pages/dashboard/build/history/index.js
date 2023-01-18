import React, {useEffect, useState} from "react";
import {get_builds} from "../../../../components/api_calls/build_calls";
import BUILD_HISTORY_TABLE from "../../../../components/build/build_history_table"
import {ReloadOutlined, RocketOutlined} from "@ant-design/icons";
import Head from "next/head";
import {Layout, Menu} from "antd";


export default function BUILD_HISTORY_HOME() {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);

    const [totalCount, setTotalCount] = useState(undefined);

    const {Footer, Sider} = Layout;

    const onChange = (pageNo) => {
        setPage(pageNo);
    }

    const getData = () => {

        get_builds(page).then((data) => {
            setData(data["results"]);
            setTotalCount(data["count"]);

        });

    }

    useEffect(() => {
        getData()
    }, [page])

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
                            <h1 style={{color: "#316DC1", margin: "20px", fontSize: "4.2rem", fontWeight: "normal"}}>OpenShift Release
                                Portal</h1>
                        </div>
                    </div>
                    <BUILD_HISTORY_TABLE data={data} totalCount={totalCount} onChange={onChange}/>
                    <Footer style={{textAlign: 'center'}}>
                        RedHat © 2023
                    </Footer>
                </Layout>
            </Layout>
        </div>


    );

}
