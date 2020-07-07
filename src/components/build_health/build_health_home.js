import React, {Component} from "react";
import 'antd/dist/antd.css';
import Daily_overview_table from "./daily_overview_table";
import {BrowserRouter as Router, Link, Route, Switch, Redirect, withRouter} from "react-router-dom";
import BuildsTable from "../build/build_table";
import Daily_overview_expand_home from "./daily_overview_expand_home";
import Build_record_table from "./build_record_table";



export default class Build_health_home extends Component{

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Router>
                <div
                    style={{padding: "30px"}}>

                        <Switch>
                            <Route component={Daily_overview_table} path="/health/daily/overview" exact/>
                            <Route component={Daily_overview_expand_home} path="/health/daily/detail/:date" exact/>
                            <Route path="/health/daily/build/:date" exact component={Build_record_table} name="daily_build_by_date"/>
                            <Redirect to="/health/daily/overview"/>
                        </Switch>

                </div>
            </Router>

        )
    }

}