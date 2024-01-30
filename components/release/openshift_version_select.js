import React, {useEffect, useState} from "react";
import {Select} from "antd";
import {getReleaseBranchesFromOcpBuildData} from "../api_calls/release_calls";

const {Option} = Select;

function OpenshiftVersionSelect({ onVersionChange, initialVersion, redirectOnSelect=false }) {
    const [data, setData] = useState([]);

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
        if (redirectOnSelect) {
            if (value !== initialVersion) {
                // Redirect to the version-specific page
                window.location.replace(`/dashboard/release/${value}`);
            } else {
                // If the selected version is the same as the initial version, invoke the onVersionChange function
                onVersionChange(value);
            }
        } else {
            // Invoke the passed function
            onVersionChange(value);
        }
    }

    const generateSelectOptionFromStateDate = (stateData) => {
        return stateData.map((openshiftVersion) => {
            return (
                <Option value={openshiftVersion} key={openshiftVersion}>{openshiftVersion}</Option>  // Add key prop
            )
        })
    }

    useEffect(() => {
        setDataFunc();
    }, [])

    // Simplify the render function by removing the if-else
    return (
        <div align={"right"} style={{padding: "30px"}}>
            <Select defaultValue={initialVersion} placeholder={<div style={{color: "black"}}>Openshift Version</div>} onChange={onChangeFunc}>
                {generateSelectOptionFromStateDate(data)}
            </Select>
        </div>
    );
}

export default OpenshiftVersionSelect;