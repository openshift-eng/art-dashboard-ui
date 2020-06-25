import React, {Component} from "react";
import {Tabs} from "antd";
import 'antd/dist/antd.css';
import Daily_overview_table from "./daily_overview_table";
const {TabPane} = Tabs;



export default class Build_health_tabs extends Component{

    constructor(props) {
        super(props);
        this.callback = this.callback.bind(this);
    }

    callback(key){

    }


    render() {
        return (
            <div
                style={{padding: "30px"}}>
                <Tabs defaultActiveKey="1" onChange={this.callback} type="card">
                    <TabPane tab="Daily Build Health Reports" key="1">
                        <Daily_overview_table/>
                    </TabPane>
                </Tabs>
            </div>
        )
    }

}