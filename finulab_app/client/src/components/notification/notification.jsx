import '../post/index.css';

import DOMPurify from 'dompurify';
import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {PaymentsSharp, FollowTheSignsSharp, TrendingUp, Tsunami} from '@mui/icons-material';


import generalOpx from '../../functions/generalFunctions';
import { format } from 'timeago.js';

export default function FinulabNotification(props) {
    const navigate = useNavigate();

    const [goTo, setGoTo] = useState("");
    const [goToType, setGoToType] = useState(0);
    useEffect(() => {
        if(!(props.notificationDesc === null || props.notificationDesc === undefined)) {
            let goToFunction = `${props.notificationDesc["link"]}`;

            if(goToFunction.slice(0, 1) === "/") {
                let goToFunctionSplit = goToFunction.split("/");

                if(goToFunctionSplit.includes("market")) {
                    let index_val = goToFunctionSplit.indexOf("market");

                    let updatedGoToFunction = `/market/prediction/${goToFunctionSplit[index_val + 1]}`;
                    if(goToFunctionSplit[index_val + 1] === "prediction") {
                        updatedGoToFunction = `/market/prediction/${goToFunctionSplit[index_val + 2]}`;
                    }
                    
                    setGoToType(2);
                    setGoTo(updatedGoToFunction);
                } else if(goToFunctionSplit.includes("post")) {
                    let index_val = goToFunctionSplit.indexOf("post");

                    let updatedGoToFunction = `/post/${goToFunctionSplit[index_val + 1]}`;
                    setGoToType(2);
                    setGoTo(updatedGoToFunction);
                } else if(goToFunctionSplit.includes("news")) {
                    let index_val = goToFunctionSplit.indexOf("news");

                    let updatedGoToFunction = `/news/${goToFunctionSplit[index_val + 1]}`;
                    setGoToType(2);
                    setGoTo(updatedGoToFunction);
                } else {
                    setGoToType(2);
                    setGoTo(goToFunction);
                }
            } else if(goToFunction.slice(0, 5) === "https") {
                setGoToType(1);
                setGoTo(goToFunction);
            }
        }
    }, [props]);

    const openSiteNewTab = (url) => {window.open(url, '_blank');};

    return(
        <>
            {props.loading ?
                <div className="profile-NotificationWrapper">
                    <div className="profile-NotificationLeftContainer"/>
                    <div className="profile-NotificationRightContainer">
                        <div className="profile-NotificationRightImgLoading"/>
                        <div className="profile-NotificationShortMsgContainerLoading"/>
                    </div>
                </div> :
                <>
                    {props.notificationDesc === null || props.notificationDesc === undefined ?
                        null : 
                        <div className="profile-NotificationWrapper" 
                                style={props.notificationDesc["read"] ? {} : {"backgroundColor": "rgba(46, 109, 224, 0.15)"}}
                            >
                            <div className="profile-NotificationLeftContainer">
                                {props.notificationDesc["type"] === "payment" ?
                                    <PaymentsSharp className="profile-NotificationLeftGreenIcon"/> : 
                                    <>
                                        {props.notificationDesc["type"] === "engagement" ?
                                            <TrendingUp className="profile-NotificationLeftLikeIcon"/> : <FollowTheSignsSharp className="profile-NotificationLeftFollowIcon"/>
                                        }
                                    </>
                                }
                            </div>
                            <div className="profile-NotificationRightContainer">
                                <div style={{"display": "flex", "alignItems": "flex-end", "width": "100%", "minWidth": "100%", "maxWidth": "100%"}}>
                                    {props.notificationDesc["byProfileImage"] === "" ?
                                        <button className='profile-NotificationRightImgBtn'
                                                onClick={props.notificationDesc["by"] === "finulab" ? () => {} : () => navigate(`/profile/${props.notificationDesc["by"]}`)}
                                            >
                                            {props.notificationDesc["by"] === "finulab" ?
                                                <img src="/assets/Favicon.png" alt="" className="profile-NotificationRightImg" /> :
                                                <div className="post-headerProfileImageNone"
                                                        style={generalOpx.profilePictureGradients[props.desc_index % 5]}
                                                    >
                                                    <img src="/assets/Favicon.png" alt="" className="large-homePageHeaderProfileImgNonUser" />
                                                    <Tsunami className="post-headerProfileImageNoneIcon"/>
                                                </div>
                                            }
                                        </button> : 
                                        <button className='profile-NotificationRightImgBtn'
                                                onClick={props.notificationDesc["by"] === "finulab" ? () => {} : () => navigate(`/profile/${props.notificationDesc["by"]}`)}
                                            >       
                                            <img src={props.notificationDesc["byProfileImage"]} alt="" className="profile-NotificationRightImg" />
                                        </button>
                                    }
                                    <div className="profile-NotificationRightContainerTimeDesc">
                                        {`${format(props.notificationDesc["timeStamp"] * 1000)}`}
                                    </div>
                                </div>
                                <button className="profile-NotificationNavigateToBtn"
                                        onClick={goToType === 1 ? () => openSiteNewTab(goTo) : goToType === 2 ? () => navigate(goTo) : () => {}}
                                    >
                                    <div className="profile-NotificationShortMsgContainer">
                                        {props.notificationDesc["message"]}
                                    </div>
                                </button>
                                {props.notificationDesc["secondaryMessage"] === "" ?
                                    null : 
                                    <button className="profile-NotificationNavigateToBtn"
                                            onClick={goToType === 1 ? () => openSiteNewTab(goTo) : goToType === 2 ? () => navigate(goTo) : () => {}}
                                        >
                                        <div className="profile-NotificationLongMsgContainer">
                                            <div className="profile-NotificationLongMsgDesc">
                                                <div 
                                                    dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(props.notificationDesc["secondaryMessage"])}}
                                                    className="profile-NotificationLongMsgSetter"
                                                />
                                            </div>
                                        </div>
                                    </button>
                                }
                            </div>
                        </div>
                    }
                </>
            }
        </>
    )
}