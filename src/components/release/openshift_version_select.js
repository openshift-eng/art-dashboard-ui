import React, {useEffect, useState} from "react";
import {Select} from "antd";
import {getReleaseBranchesFromOcpBuildData} from "../../api_calls/release_calls";

const {Option} = Select;

function OpenshiftVersionSelect() {
    const [data, setData] = useState([]);
    const [onSelectVersion, setOnSelectVersion] = useState(undefined);

    const setDataFunc = () => {
        getReleaseBranchesFromOcpBuildData().then(loopData => {

            let selectData = [];
            loopData.forEach((openshiftVersionDetail) => {
                selectData.push(openshiftVersionDetail["name"]);
            });

            setData(selectData);
        })
    }

    const onChangeFunc = (value) => {
        setOnSelectVersion(value);
    }

    const generateSelectOptionFromStateDate = (stateData) => {
        return stateData.map((openshiftVersion) => {

            return (
                <Option value={openshiftVersion}>{openshiftVersion}</Option>
            )
        })
    }

    useEffect(() => {
        setDataFunc();
    }, [])

    if (onSelectVersion === undefined) {
        return (
            <div className={"right"} style={{padding: "30px"}}>
                <Select placeholder={"OpenShift Version"} onChange={onChangeFunc}>
                    {generateSelectOptionFromStateDate(data)}
                </Select>
            </div>

        );
    } else {
        window.location.replace(`/release/status?branch=${onSelectVersion}`);
    }
}

export default OpenshiftVersionSelect;
