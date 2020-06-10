import React, {Component} from 'react';
import 'antd/dist/antd.css';
import { Layout, Menu } from 'antd';
import {BrowserRouter as Router, Route} from "react-router-dom";
import BuildsTable from "./components/build/build_table";
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    UserOutlined,
    VideoCameraOutlined,
    UploadOutlined,
    SettingOutlined
} from '@ant-design/icons';
require('dotenv').config();

const Bar = () => <div><h1>This is component BugZilla.</h1></div>;

export default class App extends Component{

    state = {
        'selected_tab': 'build',
        'collapsed_sider': false
    }

    constructor(props) {
        super(props);
        this.handle_menu_item_click = this.handle_menu_item_click.bind(this);
        this.toggle_side = this.toggle_side.bind(this);
    }

    toggle_side(){
        this.setState({collapsed_sider: !this.state.collapsed_sider});
    }

    handle_menu_item_click(clicked_menu){
        this.setState({selected_tab: clicked_menu});
    }

    render() {

        const { Header, Footer, Sider, Content } = Layout;

        let selected_menu = this.state.selected_tab;
        let content;
        if(selected_menu === "build"){
            content = <BuildsTable></BuildsTable>
        }else if(selected_menu === "bugzilla"){
            content = <Bar></Bar>
        }

        return (

            <div>
                <Layout>
                    <Sider collapsible collapsed={this.state.collapsed_sider}>
                        <div>
                            <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
                                <Menu.Item key="build_menu_item" icon={<SettingOutlined />} onClick={()=>this.handle_menu_item_click("build")}>
                                    Build
                                </Menu.Item>
                                <Menu.Item key="bugzilla_menu_item" icon={<VideoCameraOutlined />} onClick={()=>this.handle_menu_item_click("bugzilla")}>
                                    Bugzilla
                                </Menu.Item>
                            </Menu>
                        </div>
                    </Sider>
                    <Layout>
                        <Header style={{background: "white", height: "100px"}}>
                            <Layout>
                                {React.createElement(this.state.collapsed_sider ? MenuUnfoldOutlined : MenuFoldOutlined, {
                                    className: 'trigger',
                                    onClick: this.toggle_side,
                                })}
                                <div className="center">
                                    <h1 style={{color: "#316DC1"}}>ART Dashboard</h1>
                                </div>
                            </Layout>
                        </Header>
                        <Content>
                            {content}
                        </Content>

                        <Footer style={{ textAlign: 'center' }}>
                            RedHat ©2020
                        </Footer>

                    </Layout>
                </Layout>
            </div>
        );

    }

}
