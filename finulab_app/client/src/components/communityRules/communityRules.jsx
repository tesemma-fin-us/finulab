import {useEffect, useState} from "react";
import BeatLoader from "react-spinners/BeatLoader";
import {useSelector, useDispatch} from 'react-redux';
import {BorderColorSharp} from "@mui/icons-material";

import generalOpx from "../../functions/generalFunctions";

import {setProfileDesc, selectProfileData} from '../../reduxStore/profileData';

export default function CommunityRules(props) {
    const dispatch = useDispatch();

    const profileData = useSelector(selectProfileData);

    const [editState, setEditState] = useState(false);
    const [editOptnsWidth, setEditOptnsWidth] = useState("25px");
    const editStateToggle = () => {
        editState ? setEditState(false) : setEditState(true);
        editState ? setEditOptnsWidth("25px") : setEditOptnsWidth("249px");
    }

    const [ruleDesc, setRuleDesc] = useState({"header": "", "description": ""});
    useEffect(() => {
        if(!(props.rule_desc === null || props.rule_desc === undefined)) {
            setRuleDesc(
                {
                    "header": props.rule_desc["header"],
                    "description": props.rule_desc["description"]
                }
            );
        }
    }, [props]);

    const ruleDescChangeHandler = (e) => {
        const {name, value} = e.target;
        setRuleDesc(
            {
                ...ruleDesc, [name]: value
            }
        );
    }

    const [deleteRuleLoading, setDeleteRuleLoading] = useState(false);
    const [saveNewRuleLoading, setSaveNewRuleLoading] = useState(false);
    const [saveNewRuleErrorStat, setSaveNewRuleErrorStat] = useState(0);
    
    const delete_Rule = async (r_i) => {
        setDeleteRuleLoading(true);

        let community_rulesCopy = [...profileData["profileDesc"]["data"]["rules"]];
        community_rulesCopy.splice(r_i, 1)

        await generalOpx.axiosInstance.post(`/users/community-update-rules`, 
            {
                "communityRules": community_rulesCopy,
                "communityName": props.communityName
            }
        ).then(
            (response) => {
                if(response.data["status"] === "success") {
                    let profileDataCopy = {...profileData["profileDesc"]["data"]};
                    profileDataCopy["rules"] = community_rulesCopy;

                    dispatch(
                        setProfileDesc(
                            {
                                "data": profileDataCopy,
                                "dataLoading": false
                            }
                        )
                    );

                    setDeleteRuleLoading(false);
                    
                    setEditState(false);
                    setEditOptnsWidth("25px");
                } else {
                    setSaveNewRuleErrorStat(1);

                    setTimeout(() => {
                        setSaveNewRuleErrorStat(0);
                        setDeleteRuleLoading(false);
                    }, 2000);
                }
            }
        ).catch(
            () => {
                setSaveNewRuleErrorStat(1);

                setTimeout(() => {
                    setSaveNewRuleErrorStat(0);
                    setDeleteRuleLoading(false);
                }, 2000);
            }
        );
    }

    const save_Rule = async (r_i) => {
        setSaveNewRuleLoading(true);

        let community_rulesCopy = [...profileData["profileDesc"]["data"]["rules"]];
        community_rulesCopy[r_i] = {...ruleDesc}

        await generalOpx.axiosInstance.post(`/users/community-update-rules`, 
            {
                "communityRules": community_rulesCopy,
                "communityName": props.communityName
            }
        ).then(
            (response) => {
                if(response.data["status"] === "success") {
                    let profileDataCopy = {...profileData["profileDesc"]["data"]};
                    profileDataCopy["rules"] = community_rulesCopy;

                    dispatch(
                        setProfileDesc(
                            {
                                "data": profileDataCopy,
                                "dataLoading": false
                            }
                        )
                    );

                    setSaveNewRuleLoading(false);
                    
                    setEditState(false);
                    setEditOptnsWidth("25px");
                } else {
                    setSaveNewRuleErrorStat(1);

                    setTimeout(() => {
                        setSaveNewRuleErrorStat(0);
                        setSaveNewRuleLoading(false);
                    }, 2000);
                }
            }
        ).catch(
            () => {
                setSaveNewRuleErrorStat(1);

                setTimeout(() => {
                    setSaveNewRuleErrorStat(0);
                    setSaveNewRuleLoading(false);
                }, 2000);
            }
        );
    }

    return(
        <>
            {props.loading ? 
                <div className="community-rulesWrapper">
                    <div className="community-rulesHeaderLoading"/>
                    <div className="community-rulesBodyLoading">
                        <div className="community-rulesBodyDescLoading"/>
                        <div className="community-rulesBodyDescLoading" style={{"marginTop": "3px"}}/>
                        <div className="community-rulesBodyDescLoading" style={{"marginTop": "3px"}}/>
                    </div>
                </div> : 
                <>
                    {props.rule_index === null || props.rule_index === undefined || props.rule_desc === null || props.rule_desc === undefined ? 
                        null : 
                        <div className="community-rulesWrapper">
                            <div className="community-rulesHeader">
                                <div className="community-rulesHeaderNo">{props.rule_index + 1}.</div>
                                {editState ?
                                    <input type="text" 
                                        name={"header"}
                                        onChange={ruleDescChangeHandler}
                                        value={ruleDesc["header"]}
                                        placeholder="Rule Header"
                                        className="community-ruleHeaderDescriptionInput" 
                                    /> : 
                                    <div className="community-ruleHeaderDescription">
                                        <span className="community-ruleHeaderDescriptionannyingDesc">{props.rule_desc["header"]}</span>
                                    </div> 
                                }
                            </div>
                            
                            {editState ?
                                <textarea
                                    name={"description"}
                                    onChange={ruleDescChangeHandler}
                                    value={ruleDesc["description"]}
                                    placeholder="Rule Description"
                                    className="community-rulesBodyDescTxtArea"
                                ></textarea> :
                                <div className="community-rulesBody">
                                    <div className="community-rulesBodyDesc">
                                        {props.rule_desc["description"]}
                                    </div>
                                </div>
                            }

                            {props.mod_stat ?
                                <div className="community-rulesEditOptnsandOutcomeContainer">
                                    {saveNewRuleErrorStat === 1 ?
                                        <span className="community-rulesEditOptnsErrorNotice">
                                            An error occured, please try again later.
                                        </span> : null
                                    }
                                    <div className="community-rulesEditOptnsContainer"
                                            style={{
                                                "width": `${editOptnsWidth}`, "minWidth": `${editOptnsWidth}`, "maxWidth": `${editOptnsWidth}`
                                            }}
                                        >
                                        <button className="community-rulesEditOptnsExpandBtn" onClick={() => editStateToggle()}>
                                            <BorderColorSharp className="community-rulesEditOptnsExpandBtnIcon"/>
                                        </button>
                                        <span style={{"fontWeight": "500", "fontSize": "1rem", "color": "var(--primary-bg-05)"}}>&nbsp;|&nbsp;&nbsp;</span>
                                        <button className="community-ruleEditedSaveBtn"
                                                onClick={() => save_Rule(props.rule_index)}
                                                disabled={
                                                    ruleDesc["header"].length === 0 || ruleDesc["description"].length === 0 || saveNewRuleLoading || deleteRuleLoading
                                                }
                                                style={
                                                    {
                                                        "backgroundColor": ruleDesc["header"].length === 0
                                                            || ruleDesc["description"].length === 0 ? "var(--primary-bg-05)" : "var(--primary-green-09)"
                                                    }
                                                }
                                            >
                                            {saveNewRuleLoading ?
                                                <BeatLoader 
                                                    color='var(--secondary-bg-03)'
                                                    size={5}
                                                /> : `Save`
                                            }
                                        </button>
                                        <button className="community-ruleEditedDeleteBtn"
                                                onClick={() => delete_Rule(props.rule_index)}
                                                disabled={
                                                    saveNewRuleLoading || deleteRuleLoading
                                                }
                                            >
                                            {deleteRuleLoading ?
                                                <BeatLoader 
                                                    color='var(--secondary-bg-03)'
                                                    size={5}
                                                /> : `Delete`
                                            }
                                        </button>
                                        <button className="community-ruleEditedCancelBtn" onClick={() => editStateToggle()}>
                                            Cancel
                                        </button>
                                    </div> 
                                </div> : null
                            }
                        </div>
                    }
                </>
            }
        </>
    )
}