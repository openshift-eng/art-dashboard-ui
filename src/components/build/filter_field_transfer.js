import { Transfer } from 'antd';
import React from "react";



export default class Filter_field_transfer extends React.Component {

    constructor(props) {
        super(props);
        const filter_attributes = {
            "Build ID": "brew.build_ids",
            "Brew Task ID": "brew.task_id",
            "NVR": "build.0.nvr",
            "Package ID": "build.0.package_id"
        }

        this.all_attributes = []

        for (let key in filter_attributes){
            this.all_attributes.push({
                key: filter_attributes[key],
                title: key,
                disabled: false
            })
        }

        this.state = {
            targetKeys: this.all_attributes,
            selectedKeys: [],
            keys_for_filter: []

        }
    }

    swap(json){
        let ret = {};
        for(let key in json){
            if (json.hasOwnProperty(key))
                ret[json[key]] = key;
        }
        return ret;
    }

    handleChange = (nextTargetKeys, direction, moveKeys) => {
        this.setState({ targetKeys: nextTargetKeys });
        this.props.okHandler(this.state.selectedKeys);
    };

    handleSelectChange = (sourceSelectedKeys, targetSelectedKeys) => {
        this.setState({ selectedKeys: [...sourceSelectedKeys, ...targetSelectedKeys] });

        console.log('sourceSelectedKeys: ', sourceSelectedKeys);
        console.log('targetSelectedKeys: ', targetSelectedKeys);
    };

    handleScroll = (direction, e) => {
        console.log('direction:', direction);
        console.log('target:', e.target);
    };

    handleDisable = disabled => {
        this.setState({ disabled });
    };

    render() {
        const { targetKeys, selectedKeys, disabled } = this.state;
        return (
            <div>
                <Transfer
                    dataSource={this.all_attributes}
                    titles={['Source', 'Target']}
                    targetKeys={targetKeys}
                    selectedKeys={selectedKeys}
                    onChange={this.handleChange}
                    onSelectChange={this.handleSelectChange}
                    onScroll={this.handleScroll}
                    render={item => item.title}
                    disabled={disabled}
                    oneWay
                />
            </div>
        );
    }
}
