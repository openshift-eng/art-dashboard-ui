import React, {Component} from "react";
import Cookies from "js-cookie"
import {
    BrowserRouter as Router,
    Route,
} from "react-router-dom";

import BuildsTable from "../build/build_table";
import 'antd/dist/antd.css';

const Bar = () => <div><h1>This is component Bar.</h1></div>;

export default class NavbarHeader extends Component{

    state = {
        'selected_tab': 'build'
    }

    componentDidMount() {

        if (Cookies.get("navbar-home-header")){
            this.setState({'selected_tab': Cookies.get("navbar-home-header")});
        }else{
            this.setState({'selected_tab': 'build'})
        }

    }

    set_selected_tab(prevState ,name){
        console.log(this.state);
        let selected_tab = Object.assign({}, prevState.selected_tab);
        selected_tab = name;
        return { selected_tab };
    }

    render(){

        return (

            <div>

                <nav>
                    {/*<div className="nav-wrapper">*/}
                    <div>
                        {/*<a href="#!" className="brand-logo center">ART Dashboard</a>*/}
                        <ul className="left hide-on-med-and-down">
                            <li onClick={()=>{this.setState(prevState => this.set_selected_tab(prevState, "build"))}}><a href="/foo">Build</a></li>
                            <li onClick={()=>{this.setState(prevState => this.set_selected_tab(prevState, "bugzilla"))}}><a href="/bar">Bugzilla</a></li>
                        </ul>
                    </div>
                </nav>
                <>
                    <Route path="/foo" component={BuildsTable}/>
                    <Route path="/bar" component={Bar}/>
                </>

            </div>
        );
    }
}