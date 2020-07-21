import React, {Component} from 'react';
import 'antd/dist/antd.css';
import { Layout, Menu } from 'antd';
import {BrowserRouter as Router, Link, Route, Switch, Redirect, withRouter} from "react-router-dom";
import BuildsTable from "./components/build/build_table";
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    HistoryOutlined,
    SmileOutlined,
    SettingOutlined,
    ForkOutlined, QuestionOutlined
} from '@ant-design/icons';
import Release_status_table from "./components/release/status/release_status_table";
import Release_home_page from "./components/release/release_home_page";
import Build_record_table from "./components/build_health/build_record_table";
import Daily_overview_table from "./components/build_health/daily_overview_table";
import Daily_overview_expand_home from "./components/build_health/daily_overview_expand_home";
import Whatsnew_carousel from "./components/whatsnew/whatsnew_carousel";
import Advisory_Overview_Home from "./components/release/advisory_overview/home";
import Build_history_home from "./components/build/build_history_home";
require('dotenv').config();

const {SubMenu} = Menu;

const Bar = () => <div><h1>This is component BugZilla.</h1></div>;

export default class App extends Component{

    state = {
        'selected_tab': 'build',
        'collapsed_sider': false
    }

    constructor(props) {
        super(props);
        this.toggle_side = this.toggle_side.bind(this);
    }

    toggle_side(){
        this.setState({collapsed_sider: !this.state.collapsed_sider});
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

            <Router>
                <div>
                    <Layout>
                        <Sider collapsed={this.state.collapsed_sider}>
                            <div>
                                <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>


                                    <SubMenu
                                        key="sub1"
                                        title={
                                            <span>
                                            <SettingOutlined />
                                            <span>Build</span>
                                            </span>
                                        }
                                    >

                                        <Menu.Item key="build_menu_item" icon={<HistoryOutlined />}>
                                            <Link to="/build/history">
                                                History
                                            </Link>
                                        </Menu.Item>


                                        <Menu.Item key="build_health_item" icon={<SmileOutlined/>} >
                                            <Link to="/health/daily/overview">
                                            Health
                                            </Link>
                                        </Menu.Item>


                                    </SubMenu>

                                    <SubMenu
                                        key="sub2"
                                        title={
                                            <span>
                                            <ForkOutlined />
                                            <span>Release</span>
                                            </span>
                                        }
                                    >

                                        <Menu.Item key="release_status_menu_item" icon={<HistoryOutlined />}>
                                            <Link to="/release/status/?type=all">
                                                Release Status
                                            </Link>
                                        </Menu.Item>

                                    </SubMenu>

                                    <Menu.Item key={"whats_news"} icon={<QuestionOutlined/>}>
                                        <Link to={"/whatsnew"}>
                                            What's New!
                                        </Link>
                                    </Menu.Item>

                                    {/*<Menu.Item key="bugzilla_menu_item" icon={<VideoCameraOutlined />} onClick={()=>this.handle_menu_item_click("bugzilla")}>*/}
                                    {/*    Bugzilla*/}
                                    {/*</Menu.Item>*/}
                                </Menu>
                            </div>
                        </Sider>
                        <Layout>
                            <Header style={{background: "white", height: "120px", float: "left"}}>
                                    <div className="left">
                                        {React.createElement(this.state.collapsed_sider ? MenuUnfoldOutlined : MenuFoldOutlined, {
                                            className: 'trigger',
                                            onClick: this.toggle_side,
                                        })}
                                    </div>
                                    <div className="center">
                                        <h1 style={{color: "#316DC1", margin: "20px"}}>OpenShift Release Dashboard</h1>
                                    </div>
                            </Header>
                            <Content>
                                <Switch>
                                    <Route component={Daily_overview_table} path="/health/daily/overview" exact/>
                                    <Route path="/build/history" exact component={Build_history_home} name="build_history"/>
                                    <Route path="/release/status" exact component={Release_home_page} name="release_status"/>
                                    <Route component={Daily_overview_expand_home} path="/health/daily/detail/:date" exact/>
                                    <Route path="/health/daily/build/:date" exact render={(props) => <Build_record_table {...props}/>} name="daily_build_by_date"/>
                                    <Route path="/whatsnew" exact component={Whatsnew_carousel}/>
                                    <Route path="/release/advisory/overview/:advisoryid" exact component={Advisory_Overview_Home} name="advisory_overview_home"/>
                                    <Redirect exact from="" to="/build/history"/>
                                </Switch>
                            </Content>

                            <Footer style={{ textAlign: 'center' }}>
                                RedHat ©2020
                            </Footer>

                        </Layout>
                    </Layout>
                </div>
            </Router>
        );

    }

}
