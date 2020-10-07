import React, {Component} from 'react';
import 'antd/dist/antd.css';
import { Layout, Menu, notification } from 'antd';
import {BrowserRouter as Router, Link, Route, Switch, Redirect} from "react-router-dom";
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    HistoryOutlined,
    SmileOutlined,
    SettingOutlined,
    ToolOutlined,
    FireFilled
} from '@ant-design/icons';
import Release_home_page from "./components/release/release_home_page";
import Build_record_table from "./components/build_health/build_record_table";
import Daily_overview_table from "./components/build_health/daily_overview_table";
import Daily_overview_expand_home from "./components/build_health/daily_overview_expand_home";
import Whatsnew_carousel from "./components/whatsnew/whatsnew_carousel";
import Advisory_Overview_Home from "./components/release/advisory_overview/home";
import Build_history_home from "./components/build/build_history_home";
import Cookies from "js-cookie";
import Incident_home from "./components/incident/incident_home";

require('dotenv').config();

const {SubMenu} = Menu;

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

    openNotification = () => {
        notification.open({
            message: 'New Updates!',
            description:
                'There are new updates on the dashboard. Checkout updates in the help section under feature history.',
            icon: <SmileOutlined style={{color: "#108ee9"}}/>
        });
    };


    render() {

        const { Header, Footer, Sider, Content } = Layout;

        const release_number_whats_new_cookie = Cookies.get("release_number_whats_new_cookie");
        const release_number_env = process.env.REACT_APP_RELEASE_NUMBER_WHATS_NEW;

        if(release_number_whats_new_cookie === undefined || release_number_whats_new_cookie !== release_number_env){
            this.openNotification();
            Cookies.set("release_number_whats_new_cookie", release_number_env);
        }



        return (

            <Router>
                <div>
                    <Layout>
                        <Sider collapsed={this.state.collapsed_sider}>
                            <div>
                                <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>

                                    <Menu.Item key="release_status_menu_item" icon={<HistoryOutlined />}>
                                        <Link to="/release/status/?type=all">
                                            Release
                                        </Link>
                                    </Menu.Item>

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

                                    <Menu.Item key={"incidents"} icon={<FireFilled/>}>
                                        <Link to={"/incidents"}>
                                            Incidents
                                        </Link>
                                    </Menu.Item>

                                    <Menu.Item key={"whats_news"} icon={<ToolOutlined/>}>
                                        <Link to={"/help"}>
                                            Help
                                        </Link>
                                    </Menu.Item>

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
                                        <h1 style={{color: "#316DC1", margin: "20px"}}>OpenShift Release Portal</h1>
                                    </div>
                            </Header>
                            <Content>
                                <Switch>
                                    <Route component={Daily_overview_table} path="/health/daily/overview" exact/>
                                    <Route path="/build/history" exact component={Build_history_home} name="build_history"/>
                                    <Route path="/release/status/:branch" exact component={Release_home_page} name="release_status"/>
                                    <Route component={Daily_overview_expand_home} path="/health/daily/detail/:date" exact/>
                                    <Route path="/health/daily/build/:date" exact render={(props) => <Build_record_table {...props}/>} name="daily_build_by_date"/>
                                    <Route path="/help" exact component={Whatsnew_carousel}/>
                                    <Route path="/release/advisory/overview/:advisoryid" exact component={Advisory_Overview_Home} name="advisory_overview_home"/>
                                    <Route path="/incidents" exact component={Incident_home}/>
                                    <Redirect exact from="" to={"/release/status/"+process.env.REACT_APP_OPENSHIFT_VERSION_RELEASE_HOME_PAGE}/>

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
