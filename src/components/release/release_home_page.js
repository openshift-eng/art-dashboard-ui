import React, {useEffect, useState} from "react";
import {message} from "antd";
import RELEASE_BRANCH_DETAIL from "./release_branch_detail";
import OPENSHIFT_VERSION_SELECT from "./openshift_version_select";
import {useSearchParams} from "react-router-dom";

function ReleaseHomePage() {
    const [currentBranch, setCurrentBranch] = useState(undefined);
    const [queryParameters] = useSearchParams()

    message.config({
        maxCount: 2
    })

    const displayLoading = () => {
        message.loading({
            content: "Loading Data",
            duration: 0,
            style: {position: "fixed", left: "50%", top: "20%"}
        }).then(r => {/* do nothing */
        });
    }

    const destroyLoading = () => {

        message.destroy()
        message.success({
            content: "Loaded",
            duration: 2,
            style: {position: "fixed", left: "50%", top: "20%", color: "#316DC1"}
        }).then(r => {/* do nothing */
        })

    }

    useEffect(() => {
        if (queryParameters.get("branch")) {
            setCurrentBranch(queryParameters.get("branch"));
        }

    }, [queryParameters])

    useEffect(() => {
        displayLoading();
    }, [])


    return (
        <div>
            <OPENSHIFT_VERSION_SELECT/>
            <RELEASE_BRANCH_DETAIL branch={currentBranch}
                                   destroyLoadingCallback={destroyLoading}/>
        </div>
    );
}

export default ReleaseHomePage;
