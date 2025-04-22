import './prediction.css';
import '../post/index.css';

import DOMPurify from 'dompurify';
import {format} from 'timeago.js';
import {useNavigate} from 'react-router-dom';
import {useState, useEffect, useMemo} from 'react';
import FadeLoader from 'react-spinners/FadeLoader';
import BeatLoader from 'react-spinners/BeatLoader';
import {useDispatch, useSelector} from 'react-redux';
import {add, fromUnixTime, getDate, getMonth, getUnixTime, getYear} from 'date-fns';
import {
    Schedule, Group, BarChart, Water, Troubleshoot, ThumbUpOffAlt, 
    QueryStats, ThumbDownOffAlt, Cached, Comment, ContentCopy, ShoppingBasket, 
    Tsunami, Verified, Refresh, TaskAlt, ThumbUp, ThumbDown, TrendingDown, TrendingUp, Add, Remove, DeleteSharp, ExpandMore,
    CheckCircleOutline,
    HighlightOff,
    Check,
    Cancel,
    Close,
    HighlightOffOutlined
} from '@mui/icons-material';

import FinulabComment from '../comment/comment';
import generalOpx from '../../functions/generalFunctions';
import ProbabilityHistoryChart from '../probabilityHistory/probabilityHistory';
import MiniaturizedPrediction from '../miniaturized/prediction/mini-prediction';

import {setViewMedia} from '../../reduxStore/viewMedia';
import {setMarkets, setEngaged, selectProfileData} from '../../reduxStore/profileData';
import {setDisplayData, setSelected, selectMarketData} from '../../reduxStore/marketData';
import {updateStockPredictions, selectStockPredictions} from '../../reduxStore/stockPredictions';
import {setStockPageSelection, selectStockPageSelection} from '../../reduxStore/stockPageSelection';
import {setComments, clearComments, updateComments, selectComments} from '../../reduxStore/comments';
import {addToPredictionEngagement, removeFromPredictionEngagement, selectPredictionEngagement} from '../../reduxStore/predictionEngagement';
import {updateStockDashboardMarkets, setStockDashboardMarketsSelected, selectStockDashboardMarkets} from '../../reduxStore/stockDashboardMarkets';
import {addToCommentsEngagement, removeFromCommentsEngagement, setCommentsEngagement, clearCommentsEngagement, selectCommentsEngagement} from '../../reduxStore/commentsEngagement';

const override = {
    display: "flex",
    marginTop: "25px",
    marginLeft: "14.45px"
};
const overrideV2 = {
    display: "flex",
    marginTop: "13px",
    marginLeft: "14.45px"
};

const authorizedReviewers = process.env.REACT_AUTHORIZEDREVIEWERS;

export default function Prediction(props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const u_engagement = useSelector(selectPredictionEngagement);

    const marketData = useSelector(selectMarketData);
    const profilePageData = useSelector(selectProfileData);

    const comments = useSelector(selectComments);
    const stockSelection = useSelector(selectStockPageSelection);
    const stockPredictions = useSelector(selectStockPredictions);
    const commentsEngagement = useSelector(selectCommentsEngagement);
    const dashboardPredictions = useSelector(selectStockDashboardMarkets);

    const [marketDesc, setMarketDesc] = useState([]);
    const [ownershipDesc, setOwnershipDesc] = useState([]);
    const [repostCount, setRepostCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);
    const [engagementRatio, setEngagementRatio] = useState([0, 0]);

    const [cert_decision, setCert_decision] = useState([]);
    const [cert_decisionLoading, setCert_decisionLoading] = useState([]);
    const [cert_decisionOutcomeCode, setCert_decisionOutcomeCode] = useState([]);

    useEffect(() => {
        if(props.marketDesc !== undefined && props.marketDesc !== null) {
            if(marketDesc.length === 0) {
                setMarketDesc([...props.marketDesc].sort((a, b) => b.probabilityYes - a.probabilityYes));
            }

            if(cert_decision.length === 0) {
                setCert_decision(Array(props.marketDesc.length).fill(""));
                setCert_decisionLoading(Array(props.marketDesc.length).fill(false));
                setCert_decisionOutcomeCode(Array(props.marketDesc.length).fill(0));
            }
        }

        if(props.ownership !== undefined && props.ownership !== null) {
            setOwnershipDesc([...props.ownership])
        }
    }, []);
    useEffect(() => {
        if(!(props.predictionDesc === undefined || props.predictionDesc === null)) {
            setRepostCount(props.predictionDesc.reposts);
            setCommentCount(props.predictionDesc.comments);
            setEngagementRatio([props.predictionDesc.likes, props.predictionDesc.dislikes]);
        }
    }, [props]);

    const [selectedGradient, setSelectedGradient] = useState(Math.floor(Math.random() * 5));
    const months = ["Jan", "Feb", "Mar","Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const engagePrediction = async (type) => {
        let engagementRatioFunction = [...engagementRatio];
        if(u_engagement.some(eng => eng.predictionId === props.predictionDesc._id)) {
            const prevEngagement = u_engagement.filter(eng => eng.predictionId === props.predictionDesc._id)[0]["type"];
            if(prevEngagement === type) {
                dispatch(
                    removeFromPredictionEngagement(props.predictionDesc._id)
                );

                if(type === "like") {
                    engagementRatioFunction[0] = engagementRatioFunction[0] - 1;
                } else if(type === "dislike") {
                    engagementRatioFunction[1] = engagementRatioFunction[1] - 1;
                }
            } else {
                dispatch(
                    removeFromPredictionEngagement(props.predictionDesc._id)
                );
                dispatch(
                    addToPredictionEngagement([{"predictionId": props.predictionDesc._id, "type": type}])
                );

                if(type === "like") {
                    engagementRatioFunction[0] = engagementRatioFunction[0] + 1;
                    engagementRatioFunction[1] = engagementRatioFunction[1] - 1;
                } else if(type === "dislike") {
                    engagementRatioFunction[1] = engagementRatioFunction[1] + 1;
                    engagementRatioFunction[0] = engagementRatioFunction[0] - 1;
                }
            }
        } else {
            dispatch(
                addToPredictionEngagement([{"predictionId": props.predictionDesc._id, "type": type}])
            );

            if(type === "like") {
                engagementRatioFunction[0] = engagementRatioFunction[0] + 1;
            } else if(type === "dislike") {
                engagementRatioFunction[1] = engagementRatioFunction[1] + 1;
            }
        }

        /* markets - current view page */
        let marketsDisplayPredictions = [...marketData["displayData"]["predictions"]];
        if(marketsDisplayPredictions.length > 0) {
            if(marketsDisplayPredictions.some(pred => pred._id === props.predictionDesc._id)) {
                let predictionCopy = {...marketsDisplayPredictions.filter(pred => pred._id === props.predictionDesc._id)[0]};
                predictionCopy["likes"] = engagementRatioFunction[0];
                predictionCopy["dislikes"] = engagementRatioFunction[1];

                const copyIndex = marketsDisplayPredictions.findIndex(pred => pred._id === props.predictionDesc._id);
                marketsDisplayPredictions[copyIndex] = predictionCopy;
                dispatch(
                    setDisplayData(
                        {
                            "category": marketData["displayData"]["category"],
                            "predictions": marketsDisplayPredictions,
                            "data": marketData["displayData"]["data"],
                            "liveCount": marketData["displayData"]["liveCount"],
                            "dataLoading": marketData["displayData"]["dataLoading"]
                        }
                    )
                );
            }
        }

        /* markets - prediction page */
        if(marketData["selected"]["type"] === "Prediction") {
            if(marketData["selected"]["selectedDesc"]["prediction"]["_id"] === props.predictionDesc._id) {
                let selectionCopy = {...marketData["selected"]["selectedDesc"]["prediction"]};
                selectionCopy["likes"] = engagementRatioFunction[0];
                selectionCopy["dislikes"] = engagementRatioFunction[1];

                dispatch(
                    setSelected(
                        {
                            "type": "Prediction",
                            "selectedDesc": {
                                "prediction": selectionCopy,
                                "markets": marketData["selected"]["selectedDesc"]["markets"]
                            }
                        }
                    )
                );
            }
        }

        /* profile markets page */
        let profilePageMarkets = [...profilePageData["markets"]["data"]];
        if(profilePageMarkets.length > 0) {
            if(profilePageMarkets.some(pred => pred._id === props.predictionDesc._id)) {
                let predictionCopy = {...profilePageMarkets.filter(pred => pred._id === props.predictionDesc._id)[0]};
                predictionCopy["likes"] = engagementRatioFunction[0];
                predictionCopy["dislikes"] = engagementRatioFunction[1];

                const copyIndex = profilePageMarkets.findIndex(pred => pred._id === props.predictionDesc._id);
                profilePageMarkets[copyIndex] = predictionCopy;
                dispatch(
                    setMarkets(
                        {
                            "username": profilePageData["markets"]["username"],
                            "data": profilePageMarkets,
                            "markets": profilePageData["markets"]["markets"],
                            "dataCount": profilePageData["markets"]["dataCount"],
                            "dataLoading": profilePageData["markets"]["dataLoading"]
                        }
                    )
                );
            }
        }

        /* profile engaged markets page */
        if(profilePageData["engaged"]["type"] === "markets") {
            let profilePageEngagedPosts = [...profilePageData["engaged"]["data"]];
            if(profilePageEngagedPosts.length > 0) {
                if(profilePageEngagedPosts.some(pred => pred._id === props.predictionDesc._id)) {
                    let predictionCopy = {...profilePageEngagedPosts.filter(pred => pred._id === props.predictionDesc._id)[0]};
                    predictionCopy["likes"] = engagementRatioFunction[0];
                    predictionCopy["dislikes"] = engagementRatioFunction[1];

                    const copyIndex = profilePageEngagedPosts.findIndex(pred => pred._id === props.predictionDesc._id);
                    profilePageEngagedPosts[copyIndex] = predictionCopy;
                    dispatch(
                        setEngaged(
                            {
                                "username": profilePageData["engaged"]["username"],
                                "type": "markets",
                                "data": profilePageEngagedPosts,
                                "support": profilePageData["engaged"]["support"],
                                "dataCount": profilePageData["engaged"]["dataCount"],
                                "dataLoading": profilePageData["engaged"]["dataLoading"]
                            }
                        )
                    );
                }
            }
        }
        
        await generalOpx.axiosInstance.post(`/market/prediction-engage`, {"type": type, "predictionId": props.predictionDesc._id});
    }

    useMemo(() => {
        const setUpComments = async () => {
            dispatch(
                clearComments()
            );
            dispatch(
                clearCommentsEngagement()
            );

            await generalOpx.axiosInstance.put(`/market/comments`, 
                {
                    "predType": Object.keys(props.predictionDesc).includes("outcomesMap") ? "categorical" : "y-n",
                    "predictionId": props.predictionDesc._id,
                    "comments": props.predictionDesc.comments
                }
            ).then(
                async (response) => {
                    if(response.data["status"] === "success") {
                        let comments_data = [];
                        for(let i = 0; i < response.data["data"].length; i++) {
                            let primaryComments = [...response.data["support"].filter(doc => doc.commentId === response.data["data"][i]["_id"] && doc.index === 1)];

                            if(primaryComments.length > 0) {
                                comments_data.push(
                                    {"type": "comment", "l0": true, "l1": false, "l2": false, "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": response.data["data"][i]}
                                );

                                for(let j = 0; j < primaryComments.length; j++) {
                                    let secondaryComments = [...response.data["support"].filter(doc => doc.commentId === primaryComments[j]["_id"] && doc.index === 2)];

                                    if(secondaryComments.length > 0) {
                                        comments_data.push(
                                            {
                                                "type": "comment", 
                                                "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": true, "l2": false, "l3": false, 
                                                "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": primaryComments[j]
                                            }
                                        );
                                        
                                        for(let k = 0; k < secondaryComments.length; k++) {
                                            let tertiaryComments = [...response.data["support"].filter(doc => doc.commentId === secondaryComments[k]["_id"] && doc.index === 3)];

                                            if(tertiaryComments.length > 0) {
                                                comments_data.push(
                                                    {
                                                        "type": "comment", 
                                                        "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": primaryComments[j]["comments"] <= secondaryComments.length ? !(k === secondaryComments.length - 1) : true, "l2": true, "l3": false, 
                                                        "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": secondaryComments[k]
                                                    }
                                                );
                                                
                                                tertiaryComments = tertiaryComments.sort((a, b) => a.timeStamp - b.timeStamp);
                                                for(let t = 0; t < tertiaryComments.length; t++) {
                                                    comments_data.push(
                                                        {
                                                            "type": "comment", 
                                                            "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": primaryComments[j]["comments"] <= secondaryComments.length ? !(k === secondaryComments.length - 1) : true, "l2": !(t === tertiaryComments.length - 1), "l3": false, 
                                                            "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": tertiaryComments[t]
                                                        }
                                                    );
                                                }
                                            } else {
                                                if(secondaryComments[k]["comments"] > 0) {
                                                    comments_data.push(
                                                        {
                                                            "type": "comment", 
                                                            "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": primaryComments[j]["comments"] <= secondaryComments.length ? !(k === secondaryComments.length - 1) : true, "l2": true, "l3": false, 
                                                            "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": secondaryComments[k]
                                                        }
                                                    );
                                                    comments_data.push(
                                                        {
                                                            "type": "expand", 
                                                            "index": 3, 
                                                            "display": true, 
                                                            "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": primaryComments[j]["comments"] <= secondaryComments.length ? !(k === secondaryComments.length - 1) : true, "l2": false, "l3": false,
                                                            "commentId": secondaryComments[k]["_id"], 
                                                            "mainCommentId": response.data["data"][i]["_id"],
                                                            "value": secondaryComments[k]["comments"]
                                                        }
                                                    );
                                                } else {
                                                    comments_data.push(
                                                        {
                                                            "type": "comment", 
                                                            "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": primaryComments[j]["comments"] <= secondaryComments.length ? !(k === secondaryComments.length - 1) : true, "l2": false, "l3": false, 
                                                            "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": secondaryComments[k]
                                                        }
                                                    );
                                                }
                                            }
                                        }
                                    } else {
                                        if(primaryComments[j]["comments"] > 0) {
                                            comments_data.push(
                                                {
                                                    "type": "comment", 
                                                    "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": true, "l2": false, "l3": false, 
                                                    "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": primaryComments[j]
                                                }
                                            );
                                            comments_data.push(
                                                {
                                                    "type": "expand", 
                                                    "index": 2, 
                                                    "display": true, 
                                                    "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": false, "l2": false, "l3": false, 
                                                    "commentId": primaryComments[j]["_id"], 
                                                    "mainCommentId": response.data["data"][i]["_id"],
                                                    "value": primaryComments[j]["comments"]
                                                }
                                            );
                                        } else {
                                            comments_data.push(
                                                {
                                                    "type": "comment", 
                                                    "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": false, "l2": false, "l3": false,  
                                                    "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": primaryComments[j]
                                                }
                                            );
                                        }
                                    }
                                }

                                if(response.data["data"][i]["comments"] > primaryComments.length) {
                                    comments_data.push(
                                        {
                                            "type": "expand", 
                                            "index": 1, 
                                            "display": true, 
                                            "l0": false, "l1": false, "l2": false, "l3": false,
                                            "commentId": "", 
                                            "mainCommentId": response.data["data"][i]["_id"],
                                            "value": response.data["data"][i]["comments"] - primaryComments.length
                                        }
                                    );
                                }
                            } else {
                                if(response.data["data"][i]["comments"] > 0) {
                                    comments_data.push(
                                        {"type": "comment", "l0": true, "l1": false, "l2": false, "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": response.data["data"][i]}
                                    );
                                    comments_data.push(
                                        {
                                            "type": "expand", 
                                            "index": 1, 
                                            "display": true, 
                                            "l0": false, "l1": false, "l2": false, "l3": false,
                                            "commentId": "", 
                                            "mainCommentId": response.data["data"][i]["_id"],
                                            "value": response.data["data"][i]["comments"]
                                        }
                                    );
                                } else {
                                    comments_data.push({"type": "comment", "l0": false, "l1": false, "l2": false, "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": response.data["data"][i]});
                                }
                            }
                        }

                        let engagementCommentIds = [
                            ...[...response.data["data"].map(desc => `m_${desc._id}`)],
                            ...[...response.data["support"].map(desc => `s_${desc._id}`)]
                        ]
                        const commentEngagements_req = await generalOpx.axiosInstance.put(`/market/comments-engagements`, {commentIds: engagementCommentIds});
                        if(commentEngagements_req.data["status"] === "success") {
                            if(commentEngagements_req.data["data"].length > 0) {
                                dispatch(
                                    setCommentsEngagement(commentEngagements_req.data["data"])
                                );
                            }
                        }
                        let commentExpandLoadingFunction = comments_data.map(
                            (item, index) => {
                                if(item.type === "expand") {
                                    return {[index]: false};
                                }
                            }
                        ).filter(item => item !== undefined);

                        dispatch(
                            setComments(
                                {
                                    "_id": props.predictionDesc._id,
                                    "type": "prediction",
                                    "data": comments_data,
                                    "viewCount": response.data["data"].length,
                                    "dataCount": response.data["dataCount"],
                                    "dataLoading": false,
                                    "commentExpandLoading": commentExpandLoadingFunction
                                }
                            )
                        );
                    }
                }
            );
        }
        
        if(!(props.predictionDesc === undefined || props.predictionDesc === null)) {
            if(comments["type"] !== "prediction" || comments["_id"] !== props.predictionDesc._id || comments["dataLoading"] === true) {
                if(props.predictionDesc.comments > 0) {
                    setUpComments();
                } else {
                    dispatch(
                        clearCommentsEngagement()
                    );
                    dispatch(
                        setComments(
                            {
                                "_id": props.predictionDesc._id,
                                "type": "prediction",
                                "data": [],
                                "viewCount": 0,
                                "dataCount": 0,
                                "dataLoading": false,
                                "commentExpandLoading": []
                            }
                        )
                    );
                }
            }
        }
    }, []);

    const commentBlockDisplayToggle = (index, type) => {
        const innerIndex = comments["data"][index]["value"]["index"];
        if(innerIndex === 0 || innerIndex === 1 || innerIndex === 2) {
            let i = index;
            let spliceInArr = [];
            do {
                if(comments["data"][i + 1]["type"] === "comment") {
                    if(comments["data"][i + 1]["value"]["index"] > innerIndex) {
                        if(type === "hide") {
                            spliceInArr.push(
                                {
                                    ...comments["data"][i + 1],
                                    "display": false
                                }
                            );
                        } else if(type === "view") {
                            spliceInArr.push(
                                {
                                    ...comments["data"][i + 1],
                                    "display": true
                                }
                            );
                        }
                    }
                } else if(comments["data"][i + 1]["type"] === "expand") {
                    if(type === "hide") {
                        spliceInArr.push(
                            {
                                ...comments["data"][i + 1],
                                "display": false
                            }
                        );
                    } else if(type === "view") {
                        spliceInArr.push(
                            {
                                ...comments["data"][i + 1],
                                "display": true
                            }
                        );
                    }
                }
                i++;
            } while(i < (comments["data"].length - 1) && (comments["data"][i]["value"]["index"] > innerIndex || comments["data"][i]["type"] === "expand"));

            let comments_data = [
                ...comments["data"].slice(0, index + 1), 
                ...spliceInArr,
                ...comments["data"].slice(index + 1 + spliceInArr.length, comments["data"].length)
            ];

            dispatch(
                setComments(
                    {
                        "_id": props.predictionDesc._id,
                        "type": "prediction",
                        "data": comments_data,
                        "viewCount": comments["viewCount"],
                        "dataCount": comments["dataCount"],
                        "dataLoading": false,
                        "commentExpandLoading": comments["commentExpandLoading"]
                    }
                )
            );
        }
    }

    const [viewMoreCommentsLoading, setViewMoreCommentsLoading] = useState(false);
    const viewMoreComments = async () => {
        setViewMoreCommentsLoading(true);

        let ni_commentIds = [];
        for(let i = 0; i < comments["data"].length; i++) {
            if(comments["data"][i]["type"] === "comment") {
                if(comments["data"][i]["value"]["index"] === 0) {
                    ni_commentIds.push(comments["data"][i]["value"]["_id"]);
                }
            }
        }

        await generalOpx.axiosInstance.put(`/market/comments-expand`, 
            {
                "predType": Object.keys(props.predictionDesc).includes("outcomesMap") ? "categorical" : "y-n",
                "predictionId": props.predictionDesc._id,
                "ni_commentIds": ni_commentIds
            }
        ).then(
            async (response) => {
                if(response.data["status"] === "success") {
                    let comments_data = [];
                    for(let i = 0; i < response.data["data"].length; i++) {
                        let primaryComments = [...response.data["support"].filter(doc => doc.commentId === response.data["data"][i]["_id"] && doc.index === 1)];

                        if(primaryComments.length > 0) {
                            comments_data.push(
                                {"type": "comment", "l0": true, "l1": false, "l2": false, "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": response.data["data"][i]}
                            );

                            for(let j = 0; j < primaryComments.length; j++) {
                                let secondaryComments = [...response.data["support"].filter(doc => doc.commentId === primaryComments[j]["_id"] && doc.index === 2)];

                                if(secondaryComments.length > 0) {
                                    comments_data.push(
                                        {
                                            "type": "comment", 
                                            "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": true, "l2": false, "l3": false, 
                                            "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": primaryComments[j]
                                        }
                                    );
                                    
                                    for(let k = 0; k < secondaryComments.length; k++) {
                                        let tertiaryComments = [...response.data["support"].filter(doc => doc.commentId === secondaryComments[k]["_id"] && doc.index === 3)];

                                        if(tertiaryComments.length > 0) {
                                            comments_data.push(
                                                {
                                                    "type": "comment", 
                                                    "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": primaryComments[j]["comments"] <= secondaryComments.length ? !(k === secondaryComments.length - 1) : true, "l2": true, "l3": false, 
                                                    "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": secondaryComments[k]
                                                }
                                            );
                                            
                                            tertiaryComments = tertiaryComments.sort((a, b) => a.timeStamp - b.timeStamp);
                                            for(let t = 0; t < tertiaryComments.length; t++) {
                                                comments_data.push(
                                                    {
                                                        "type": "comment", 
                                                        "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": primaryComments[j]["comments"] <= secondaryComments.length ? !(k === secondaryComments.length - 1) : true, "l2": !(t === tertiaryComments.length - 1), "l3": false, 
                                                        "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": tertiaryComments[t]
                                                    }
                                                );
                                            }
                                        } else {
                                            if(secondaryComments[k]["comments"] > 0) {
                                                comments_data.push(
                                                    {
                                                        "type": "comment", 
                                                        "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": primaryComments[j]["comments"] <= secondaryComments.length ? !(k === secondaryComments.length - 1) : true, "l2": true, "l3": false, 
                                                        "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": secondaryComments[k]
                                                    }
                                                );
                                                comments_data.push(
                                                    {
                                                        "type": "expand", 
                                                        "index": 3, 
                                                        "display": true, 
                                                        "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": primaryComments[j]["comments"] <= secondaryComments.length ? !(k === secondaryComments.length - 1) : true, "l2": false, "l3": false,
                                                        "commentId": secondaryComments[k]["_id"], 
                                                        "mainCommentId": response.data["data"][i]["_id"],
                                                        "value": secondaryComments[k]["comments"]
                                                    }
                                                );
                                            } else {
                                                comments_data.push(
                                                    {
                                                        "type": "comment", 
                                                        "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": primaryComments[j]["comments"] <= secondaryComments.length ? !(k === secondaryComments.length - 1) : true, "l2": false, "l3": false, 
                                                        "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": secondaryComments[k]
                                                    }
                                                );
                                            }
                                        }
                                    }
                                } else {
                                    if(primaryComments[j]["comments"] > 0) {
                                        comments_data.push(
                                            {
                                                "type": "comment", 
                                                "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": true, "l2": false, "l3": false, 
                                                "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": primaryComments[j]
                                            }
                                        );
                                        comments_data.push(
                                            {
                                                "type": "expand", 
                                                "index": 2, 
                                                "display": true, 
                                                "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": false, "l2": false, "l3": false, 
                                                "commentId": primaryComments[j]["_id"], 
                                                "mainCommentId": response.data["data"][i]["_id"],
                                                "value": primaryComments[j]["comments"]
                                            }
                                        );
                                    } else {
                                        comments_data.push(
                                            {
                                                "type": "comment", 
                                                "l0": response.data["data"][i]["comments"] <= primaryComments.length ? !(j === primaryComments.length - 1) : true, "l1": false, "l2": false, "l3": false,  
                                                "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": primaryComments[j]
                                            }
                                        );
                                    }
                                }
                            }

                            if(response.data["data"][i]["comments"] > primaryComments.length) {
                                comments_data.push(
                                    {
                                        "type": "expand", 
                                        "index": 1, 
                                        "display": true, 
                                        "l0": false, "l1": false, "l2": false, "l3": false,
                                        "commentId": "", 
                                        "mainCommentId": response.data["data"][i]["_id"],
                                        "value": response.data["data"][i]["comments"] - primaryComments.length
                                    }
                                );
                            }
                        } else {
                            if(response.data["data"][i]["comments"] > 0) {
                                comments_data.push({"type": "comment", "l0": true, "l1": false, "l2": false, "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": response.data["data"][i]});
                                comments_data.push(
                                    {
                                        "type": "expand", 
                                        "index": 1, 
                                        "display": true, 
                                        "l0": false, "l1": false, "l2": false, "l3": false,
                                        "commentId": "", 
                                        "mainCommentId": response.data["data"][i]["_id"],
                                        "value": response.data["data"][i]["comments"]
                                    }
                                );
                            } else {
                                comments_data.push({"type": "comment", "l0": false, "l1": false, "l2": false, "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": response.data["data"][i]});
                            }
                        }
                    }

                    let engagementCommentIds = [
                        ...[...response.data["data"].map(desc => `m_${desc._id}`)],
                        ...[...response.data["support"].map(desc => `s_${desc._id}`)]
                    ]
                    const commentEngagements_req = await generalOpx.axiosInstance.put(`/market/comments-engagements`, {commentIds: engagementCommentIds});
                    if(commentEngagements_req.data["status"] === "success") {
                        if(commentEngagements_req.data["data"].length > 0) {
                            dispatch(
                                addToCommentsEngagement(commentEngagements_req.data["data"])
                            );
                        }
                    }
                    let commentExpandLoadingFunction = [...comments["data"], ...comments_data].map(
                        (item, index) => {
                            if(item.type === "expand") {
                                return {[index]: false};
                            }
                        }
                    ).filter(item => item !== undefined);

                    dispatch(
                        updateComments(
                            {
                                "data": [...comments["data"], ...comments_data],
                                "viewCount": comments["viewCount"] + response.data["data"].length,
                                "commentExpandLoading": commentExpandLoadingFunction
                            }
                        )
                    );
                }
            }
        );

        setViewMoreCommentsLoading(false);
    }

    const specificCommentExpand = async (index) => {
        let prevCommentExpandLoadingFunction = [...comments["commentExpandLoading"]];
        const prevCommentExpandLoadingFunctionIndex = prevCommentExpandLoadingFunction.findIndex(desc_obj => Object.keys(desc_obj)[0] === `${index}`);
        prevCommentExpandLoadingFunction[prevCommentExpandLoadingFunctionIndex] = {[index]: true};
        dispatch(
            updateComments(
                {
                    "data": comments["data"],
                    "viewCount": comments["viewCount"],
                    "commentExpandLoading": prevCommentExpandLoadingFunction
                }
            )
        );

        if(comments["data"][index]["type"] === "expand" && index !== 0) {
            let commentIdsToExclude = [];
            const commentIndex = comments["data"][index]["index"] - 1;
            commentIndex === 0 ? commentIdsToExclude = [...comments["data"].filter(desc => desc.value.mainCommentId === comments["data"][index]["mainCommentId"]).map(innerDesc => innerDesc.value._id)] : commentIdsToExclude = [];

            await generalOpx.axiosInstance.put(`/market/comments-specific-expand`, 
                {
                    commentId: comments["data"][index]["commentId"],
                    mainCommentId: comments["data"][index]["mainCommentId"],
                    commentIndex: commentIndex,
                    commentIdsToExlude: commentIdsToExclude
                }
            ).then(
                async (response) => {
                    if(response.data["status"] === "success") {
                        let comments_data = [];
                        if(commentIndex === 0) {
                            let primaryComments = [...response.data["data"].filter(doc => doc.index === 1)];
                            for(let j = 0; j < primaryComments.length; j++) {
                                let secondaryComments = [...response.data["data"].filter(doc => doc.commentId === primaryComments[j]["_id"] && doc.index === 2)];

                                if(secondaryComments.length > 0) {
                                    comments_data.push(
                                        {"type": "comment", "l0": !(j === primaryComments.length - 1), "l1": true, "l2": false, "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": primaryComments[j]}
                                    );
                                    
                                    for(let k = 0; k < secondaryComments.length; k++) {
                                        let tertiaryComments = [...response.data["data"].filter(doc => doc.commentId === secondaryComments[k]["_id"] && doc.index === 3)];

                                        if(tertiaryComments.length > 0) {
                                            comments_data.push(
                                                {"type": "comment", "l0": !(j === primaryComments.length - 1), "l1": !(k === secondaryComments.length - 1), "l2": true, "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": secondaryComments[k]}
                                            );
                                            
                                            tertiaryComments = tertiaryComments.sort((a, b) => a.timeStamp - b.timeStamp);
                                            for(let t = 0; t < tertiaryComments.length; t++) {
                                                comments_data.push(
                                                    {"type": "comment", "l0": !(j === primaryComments.length - 1), "l1": !(k === secondaryComments.length - 1), "l2": !(t === tertiaryComments.length - 1), "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": tertiaryComments[t]}
                                                );
                                            }
                                        } else {
                                            if(secondaryComments[k]["comments"] > 0) {
                                                comments_data.push(
                                                    {"type": "comment", "l0": !(j === primaryComments.length - 1), "l1": !(k === secondaryComments.length - 1), "l2": true, "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": secondaryComments[k]}
                                                );
                                                comments_data.push(
                                                    {
                                                        "type": "expand", 
                                                        "index": 3, 
                                                        "display": true, 
                                                        "l0": !(j === primaryComments.length - 1), "l1": !(k === secondaryComments.length - 1), "l2": false, "l3": false,
                                                        "commentId": secondaryComments[k]["_id"], 
                                                        "value": secondaryComments[k]["comments"]
                                                    }
                                                );
                                            } else {
                                                comments_data.push(
                                                    {"type": "comment", "l0": !(j === primaryComments.length - 1), "l1": !(k === secondaryComments.length - 1), "l2": false, "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": secondaryComments[k]}
                                                );
                                            }
                                        }
                                    }
                                } else {
                                    if(primaryComments[j]["comments"] > 0) {
                                        comments_data.push(
                                            {"type": "comment", "l0": !(j === primaryComments.length - 1), "l1": true, "l2": false, "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": primaryComments[j]}
                                        );
                                        comments_data.push(
                                            {
                                                "type": "expand", 
                                                "index": 2, 
                                                "display": true, 
                                                "l0": !(j === primaryComments.length - 1), "l1": false, "l2": false, "l3": false,
                                                "commentId": primaryComments[j]["_id"], 
                                                "value": primaryComments[j]["comments"]
                                            }
                                        );
                                    } else {
                                        comments_data.push(
                                            {"type": "comment", "l0": !(j === primaryComments.length - 1), "l1": false, "l2": false, "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": primaryComments[j]}
                                        );
                                    }
                                }
                            }
                        } else if(commentIndex === 1) {
                            let bool_l0 = comments["data"][index - 1]["l0"];
                            let secondaryComments = [...response.data["data"].filter(doc => doc.index === 2)];
                            for(let k = 0; k < secondaryComments.length; k++) {
                                let tertiaryComments = [...response.data["data"].filter(doc => doc.commentId === secondaryComments[k]["_id"] && doc.index === 3)];

                                if(tertiaryComments.length > 0) {
                                    comments_data.push(
                                        {"type": "comment", "l0": bool_l0, "l1": !(k === secondaryComments.length - 1), "l2": true, "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": secondaryComments[k]}
                                    );
                                    
                                    tertiaryComments = tertiaryComments.sort((a, b) => a.timeStamp - b.timeStamp);
                                    for(let t = 0; t < tertiaryComments.length; t++) {
                                        comments_data.push(
                                            {"type": "comment", "l0": bool_l0, "l1": !(k === secondaryComments.length - 1), "l2": !(t === tertiaryComments.length - 1), "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": tertiaryComments[t]}
                                        );
                                    }
                                } else {
                                    if(secondaryComments[k]["comments"] > 0) {
                                        comments_data.push(
                                            {"type": "comment", "l0": bool_l0, "l1": !(k === secondaryComments.length - 1), "l2": true, "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": secondaryComments[k]}
                                        );
                                        comments_data.push(
                                            {
                                                "type": "expand", 
                                                "index": 3, 
                                                "display": true, 
                                                "l0": bool_l0, "l1": !(k === secondaryComments.length - 1), "l2": false, "l3": false,
                                                "commentId": secondaryComments[k]["_id"], 
                                                "value": secondaryComments[k]["comments"]
                                            }
                                        );
                                    } else {
                                        comments_data.push(
                                            {"type": "comment", "l0": bool_l0, "l1": !(k === secondaryComments.length - 1), "l2": false, "l3": false, "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false, "value": secondaryComments[k]}
                                        );
                                    }
                                }
                            }
                        }

                        let comments_setDataTo = [];
                        if(index === comments["data"].length - 1) {
                            comments_setDataTo = [
                                ...comments["data"].slice(0, index), 
                                ...comments_data
                            ];
                        } else {
                            comments_setDataTo = [
                                ...comments["data"].slice(0, index), 
                                ...comments_data,
                                ...comments["data"].slice(index + 1, comments["data"].length), 
                            ];
                        }

                        let engagementCommentIds = [
                            ...[...response.data["data"].map(desc => `s_${desc._id}`)]
                        ]
                        const commentEngagements_req = await generalOpx.axiosInstance.put(`/market/comments-engagements`, {commentIds: engagementCommentIds});
                        if(commentEngagements_req.data["status"] === "success") {
                            if(commentEngagements_req.data["data"].length > 0) {
                                dispatch(
                                    addToCommentsEngagement(commentEngagements_req.data["data"])
                                );
                            }
                        }

                        let commentExpandLoadingFunction = comments_setDataTo.map(
                            (item, index) => {
                                if(item.type === "expand") {
                                    return {[index]: false};
                                }
                            }
                        ).filter(item => item !== undefined);

                        dispatch(
                            updateComments(
                                {
                                    "data": comments_setDataTo,
                                    "viewCount": comments["viewCount"],
                                    "commentExpandLoading": commentExpandLoadingFunction
                                }
                            )
                        );
                    }
                }
            );
        }
    }

    const engageComment = async (index, commentId, type) => {
        let commentsFunction = [...comments["data"]];
        if(commentsEngagement.some(eng => eng.commentId === commentId)) {
            const prevEngagement = commentsEngagement.filter(eng => eng.commentId === commentId)[0]["type"];
            if(prevEngagement === type) {
                dispatch(
                    removeFromCommentsEngagement(commentId)
                );

                if(type === "like") {
                    commentsFunction[index] = {
                        ...comments["data"][index],
                        "value": {
                            ...comments["data"][index]["value"],
                            "likes": comments["data"][index]["value"]["likes"] - 1
                        }
                    }
                } else if(type === "dislike") {
                    commentsFunction[index] = {
                        ...comments["data"][index],
                        "value": {
                            ...comments["data"][index]["value"],
                            "dislikes": comments["data"][index]["value"]["dislikes"] - 1
                        }
                    }
                }
            } else {
                dispatch(
                    removeFromCommentsEngagement(commentId)
                );
                dispatch(
                    addToCommentsEngagement([{"commentId": commentId, "type": type}])
                );

                if(type === "like") {
                    commentsFunction[index] = {
                        ...comments["data"][index],
                        "value": {
                            ...comments["data"][index]["value"],
                            "likes": comments["data"][index]["value"]["likes"] + 1,
                            "dislikes": comments["data"][index]["value"]["dislikes"] - 1
                        }
                    }
                } else if(type === "dislike") {
                    commentsFunction[index] = {
                        ...comments["data"][index],
                        "value": {
                            ...comments["data"][index]["value"],
                            "likes": comments["data"][index]["value"]["likes"] - 1,
                            "dislikes": comments["data"][index]["value"]["dislikes"] + 1
                        }
                    }
                }
            }
        } else {
            dispatch(
                addToCommentsEngagement([{"commentId": commentId, "type": type}])
            );

            if(type === "like") {
                commentsFunction[index] = {
                    ...comments["data"][index],
                    "value": {
                        ...comments["data"][index]["value"],
                        "likes": comments["data"][index]["value"]["likes"] + 1
                    }
                }
            } else if(type === "dislike") {
                commentsFunction[index] = {
                    ...comments["data"][index],
                    "value": {
                        ...comments["data"][index]["value"],
                        "dislikes": comments["data"][index]["value"]["dislikes"] + 1
                    }
                }
            }
        }
        
        dispatch(
            updateComments(
                {
                    "data": commentsFunction,
                    "viewCount": comments["viewCount"],
                    "commentExpandLoading": comments["commentExpandLoading"]
                }
            )
        );

        await generalOpx.axiosInstance.post(`/market/comments-engage`, {"type": type, "commentId": commentId});
    }

    const commentDisplayToggle = (index) => {
        let commentsFunction = [...comments["data"]];
        comments["data"][index]["commentDisplay"] ? commentsFunction[index] = {
            ...comments["data"][index],
            "commentDisplay": false
        } :  commentsFunction[index] = {
            ...comments["data"][index],
            "commentDisplay": true
        };

        dispatch(
            updateComments(
                {
                    "data": commentsFunction,
                    "viewCount": comments["viewCount"],
                    "commentExpandLoading": comments["commentExpandLoading"]
                }
            )
        );
    }

    const commentDeleteToggle = (index) => {
        let commentsFunction = [...comments["data"]];
        comments["data"][index]["deleteDisplay"] ? commentsFunction[index] = {
            ...comments["data"][index],
            "deleteDisplay": false
        } :  commentsFunction[index] = {
            ...comments["data"][index],
            "deleteDisplay": true
        };

        dispatch(
            updateComments(
                {
                    "data": commentsFunction,
                    "viewCount": comments["viewCount"],
                    "commentExpandLoading": comments["commentExpandLoading"]
                }
            )
        );
    }

    const commentDelete = async (index) => {
        let commentsFunction = [...comments["data"]];
        commentsFunction[index] = {
            ...comments["data"][index],
            "deleteStatus": 1
        }
        dispatch(
            updateComments(
                {
                    "data": commentsFunction,
                    "viewCount": comments["viewCount"],
                    "commentExpandLoading": comments["commentExpandLoading"]
                }
            )
        );

        await generalOpx.axiosInstance.post(`/market/delete-comment`,
            {
                "index": comments["data"][index]["value"]["index"],
                "commentId": comments["data"][index]["value"]["_id"]
            }
        ).then(
            (response) => {
                if(response.data["status"] === "success") {
                    let secondCommentsFunction = [...comments["data"]];
                    secondCommentsFunction[index] = {
                        ...comments["data"][index],
                        "deleteDisplay": false,
                        "deleteStatus": 0,
                        "value": {
                            ...comments["data"][index]["value"],
                            "username": "[deleted]",
                            "profileImage": "",
                            "comment": "[removed]",
                            "photos": [],
                            "videos": [],
                            "status": "inactive"
                        }
                    }

                    dispatch(
                        updateComments(
                            {
                                "data": secondCommentsFunction,
                                "viewCount": comments["viewCount"],
                                "commentExpandLoading": comments["commentExpandLoading"]
                            }
                        )
                    );
                } else {
                    let secondCommentsFunction = [...comments["data"]],
                    thirdCommentsFunction = [...comments["data"]];
                    secondCommentsFunction[index] = {
                        ...comments["data"][index],
                        "deleteStatus": 2
                    }
                    thirdCommentsFunction[index] = {
                        ...comments["data"][index],
                        "deleteStatus": 0
                    }

                    dispatch(
                        updateComments(
                            {
                                "data": secondCommentsFunction,
                                "viewCount": comments["viewCount"],
                                "commentExpandLoading": comments["commentExpandLoading"]
                            }
                        )
                    );

                    setTimeout(() => 
                        {
                            dispatch(
                                updateComments(
                                    {
                                        "data": thirdCommentsFunction,
                                        "viewCount": comments["viewCount"],
                                        "commentExpandLoading": comments["commentExpandLoading"]
                                    }
                                )
                            );
                        }, 2000
                    );
                }
            }
        ).catch(
            () => {
                let secondCommentsFunction = [...comments["data"]],
                    thirdCommentsFunction = [...comments["data"]];
                secondCommentsFunction[index] = {
                    ...comments["data"][index],
                    "deleteStatus": 2
                }
                thirdCommentsFunction[index] = {
                    ...comments["data"][index],
                    "deleteStatus": 0
                }

                dispatch(
                    updateComments(
                        {
                            "data": secondCommentsFunction,
                            "viewCount": comments["viewCount"],
                            "commentExpandLoading": comments["commentExpandLoading"]
                        }
                    )
                );

                setTimeout(() => 
                    {
                        dispatch(
                            updateComments(
                                {
                                    "data": thirdCommentsFunction,
                                    "viewCount": comments["viewCount"],
                                    "commentExpandLoading": comments["commentExpandLoading"]
                                }
                            )
                        );
                    }, 2000
                );
            }
        )
    }

    const setupViewCommentMedia = (index, commentMedia) => {
        dispatch(
            setViewMedia(
                {
                    "index": index,
                    "media": commentMedia
                }
            )
        );
    }

    const [auth_decision, setAuth_decision] = useState("");
    const [auth_reviewLoading, setAuth_reviewLoading] = useState(false);
    const [auth_reviewStatusCode, setAuth_reviewStatusCode] = useState(0);
    const sendReviewDecision = async (decision) => {
        setAuth_decision(decision);

        if(!(props.predictionDesc === null || props.predictionDesc === undefined)) {
            if(authorizedReviewers.includes(props.user)) {
                setAuth_reviewLoading(true);

                await generalOpx.axiosInstance.post(`/market/prediction-decision`,
                    {
                        "decision": decision,
                        "predictionId": props.predictionDesc._id
                    }
                ).then(
                    (response) => {
                        if(response.data["status"] === "success") {
                            setAuth_reviewStatusCode(1);
                            setAuth_reviewLoading(false);

                            setTimeout(() => {
                                if(marketData["displayData"]["predictions"].some(pred_desc => pred_desc._id === props.predictionDesc._id)) {
                                    let displayPredictionsCopy = [
                                        ...marketData["displayData"]["predictions"].filter(pred_desc => pred_desc._id !== props.predictionDesc._id)
                                    ];
                                    let displayPredsMarketsCopy = [
                                        ...marketData["displayData"]["data"].filter(mrkt_desc => mrkt_desc.predictionId !== props.predictionDesc._id)
                                    ];
                
                                    dispatch(
                                        setDisplayData(
                                            {
                                                "category": marketData["displayData"]["category"],
                                                "predictions": displayPredictionsCopy,
                                                "data": displayPredsMarketsCopy,
                                                "liveCount": marketData["displayData"]["liveCount"],
                                                "dataLoading": marketData["displayData"]["dataLoading"]
                                            }
                                        )
                                    );
                                }
                            }, 2000);
                        } else {
                            setAuth_reviewStatusCode(2);
                            setAuth_reviewLoading(false);
                            
                            setTimeout(() => {
                                setAuth_reviewStatusCode(0);
                                setAuth_decision("");
                            }, 2000);
                        }
                    }
                ).catch(
                    () => {
                        setAuth_reviewStatusCode(2);
                        setAuth_reviewLoading(false);
                        
                        setTimeout(() => {
                            setAuth_reviewStatusCode(0);
                            setAuth_decision("");
                        }, 2000);  
                    }
                );
            }
        }
    }

    /*
    const [cert_decision, setCert_decision] = useState([]);
    const [cert_decisionLoading, setCert_decisionLoading] = useState([]);
    const [cert_decisionOutcomeCode, setCert_decisionOutcomeCode] = useState([]);
    */
    const certifyMarketOutcome = async (marketId, selectedIndex, resolutionOutcome) => {
        if(authorizedReviewers.includes(props.user)) {
            let cert_decisionfCopy = [...cert_decision];
            cert_decisionfCopy[selectedIndex] = resolutionOutcome;

            let cert_decisionLoadingfCopy = [...cert_decisionLoading];
            cert_decisionLoadingfCopy[selectedIndex] = true;

            setCert_decision(cert_decisionfCopy);
            setCert_decisionLoading(cert_decisionLoadingfCopy);
            
            await generalOpx.axiosInstance.post(`/market/prediction-resolve`,
                {
                    "marketId": marketId,
                    "resolutionOutcome": resolutionOutcome
                }
            ).then(
                (response) => {
                    if(response.data["status"] === "success") {
                        let cert_decisionOutcomeCodefCopy = [...cert_decisionOutcomeCode];
                        cert_decisionOutcomeCodefCopy[selectedIndex] = 1;
                        setCert_decisionOutcomeCode(cert_decisionOutcomeCodefCopy);

                        let cert_decisionLoading_sCopy = [...cert_decisionLoading];
                        cert_decisionLoading_sCopy[selectedIndex] = false;
                        setCert_decisionLoading(cert_decisionLoading_sCopy);
                    } else {
                        let cert_decisionOutcomeCodefCopy = [...cert_decisionOutcomeCode];
                        cert_decisionOutcomeCodefCopy[selectedIndex] = 2;
                        setCert_decisionOutcomeCode(cert_decisionOutcomeCodefCopy);

                        setTimeout(() => {
                            let cert_decisionOutcomeCode_sCopy = [...cert_decisionOutcomeCode];
                            cert_decisionOutcomeCode_sCopy[selectedIndex] = 2;
                            setCert_decisionOutcomeCode(cert_decisionOutcomeCode_sCopy);

                            let cert_decision_sCopy = [...cert_decision];
                            cert_decision_sCopy[selectedIndex] = "";

                            let cert_decisionLoading_sCopy = [...cert_decisionLoading];
                            cert_decisionLoading_sCopy[selectedIndex] = false;

                            setCert_decision(cert_decision_sCopy);
                            setCert_decisionLoading(cert_decisionLoading_sCopy);
                        }, 2000);
                    }
                }
            ).catch(
                () => {
                    let cert_decisionOutcomeCodefCopy = [...cert_decisionOutcomeCode];
                    cert_decisionOutcomeCodefCopy[selectedIndex] = 2;
                    setCert_decisionOutcomeCode(cert_decisionOutcomeCodefCopy);

                    setTimeout(() => {
                        let cert_decisionOutcomeCode_sCopy = [...cert_decisionOutcomeCode];
                        cert_decisionOutcomeCode_sCopy[selectedIndex] = 2;
                        setCert_decisionOutcomeCode(cert_decisionOutcomeCode_sCopy);

                        let cert_decision_sCopy = [...cert_decision];
                        cert_decision_sCopy[selectedIndex] = "";

                        let cert_decisionLoading_sCopy = [...cert_decisionLoading];
                        cert_decisionLoading_sCopy[selectedIndex] = false;

                        setCert_decision(cert_decision_sCopy);
                        setCert_decisionLoading(cert_decisionLoading_sCopy);
                    }, 2000);
                }
            );
        }
    }

    return(
        <div className="prediction-wrapper">
            <div className="prediction-header">
                {props.loading || props.predictionDesc === undefined || props.predictionDesc === null || marketDesc.length === 0 ?
                    <div className="prediction-categoryContainerLoading"/> : 
                    <button className="prediction-categoryContainer">
                        <div className="prediction-categoryImgContainer">
                            <img src={props.predictionDesc["categoryImage"]} alt="" className="prediction-categoryImg" />
                        </div>
                        <span className="prediction-categoryDesc">{props.predictionDesc["category"]}</span>
                    </button>
                }
                <div className="prediction-endsDescContainer">
                    <Schedule className="prediction-endsDescIcon"/>
                    {props.loading || props.predictionDesc === undefined || props.predictionDesc === null || marketDesc.length === 0 ?
                        <div className="prediction-endsDescLoading"/> :
                        <>
                            Ends: <span className="prediction-endsDesc">
                                {`${months[getMonth(fromUnixTime(props.predictionDesc.endDate))]} ${getDate(fromUnixTime(props.predictionDesc.endDate))}, ${getYear(fromUnixTime(props.predictionDesc.endDate))}`}
                            </span>
                        </>
                    }
                </div>
            </div>
            <div className="prediction-TitleHeader" style={{"marginBottom": "12px"}}>
                <img src={props.predictionDesc["predictiveImage"]} alt="" className="prediction-bodyImgMain" />
                <div className="prediction-TitleHeaderDescContainer">
                    <button className="prediction-TitleHeaderAskedByNewDescCont"
                            onClick={() => navigate(`/profile/${props.predictionDesc["username"]}`)}
                        >
                        {props.loading || props.predictionDesc === undefined || props.predictionDesc === null || marketDesc.length === 0 ?
                            <>
                                <div className="prediction-TitileHeaderAskedByProfilePicLoading"/>
                                <div className="prediction-TitleHeaderAskedByProfileDescLoading"/>
                            </> : 
                            <>
                                {props.predictionDesc["profileImage"] === "" ?
                                    null : <img src={props.predictionDesc["profileImage"]} alt="" className="prediction-TitileHeaderAskedByProfilePic" />
                                }
                                <div className="prediction-TitleHeaderAskedByProfileDesc"
                                        style={props.predictionDesc["profileImage"] === "" ?
                                            {"marginLeft": "0px"} : {}
                                        }
                                    >
                                    Asked By: {props.predictionDesc["username"]} {marketDesc[0]["creatorAccountType"] === "verified" ? <Verified className="prediction-VerifiedIcon"/> : null}
                                </div>
                            </>
                        }
                    </button>
                    {props.loading || props.predictionDesc === undefined || props.predictionDesc === null || marketDesc.length === 0 ?
                        <div className="prediction-titleDescLoading"/> :
                        <div className="prediction-titleDesc">{props.predictionDesc["predictiveQuestion"]}</div>
                    }
                </div>
            </div>
            <div className="prediction-bodySimpleChartContainer" style={{"marginTop": "12px"}}>
                <ProbabilityHistoryChart 
                    marketDesc={marketDesc}
                    status={props.predictionDesc["status"]}
                    predictionId={props.predictionDesc["_id"]}
                    outcomeType={props.predictionDesc["outcomeType"]}
                    activityGeneralDesc={
                        {
                            "volume": props.predictionDesc["volume"],
                            "liquidity": props.predictionDesc["liquidity"],
                            "participants": props.predictionDesc["participants"]
                        }
                    }
                />
            </div>
            <div className="prediction-bodyOutcomeContainer">
                <div className="prediction-titleUnderlineChartHeader">Outcomes</div>
                <div className="prediction-bodyOutcomeRefreshContainer">
                    %-Chance
                    <button className="prediction-bodyOutcomeRefreshBtn">
                        <Refresh className="prediction-bodyOutcomeRefreshContainerIcon"/>
                    </button>
                </div>
            </div>
            {props.loading || props.predictionDesc === undefined || props.predictionDesc === null || marketDesc.length === 0 ?
                null :
                <>
                    {props.predictionDesc["outcomeType"] === "yes-or-no" ?
                        <div className="prediction-outcomeContainer"
                                style={props.predictionDesc["status"] === "in-review" && authorizedReviewers.includes(props.user) ?
                                    {
                                        "height": "fit-content", "minHeight": "fit-content", "maxHeight": "fit-content", "borderBottom": "none"
                                    } : 
                                    {"borderBottom": "none"}
                                }
                            >
                            <button className="prediction-outcomeTopContainer"
                                    style={props.predictionDesc["status"] === "in-review" || props.predictionDesc["status"] === "denied" ?
                                        {"cursor": "auto"} : {}
                                    }
                                    onClick={props.predictionDesc["status"] === "in-review" || props.predictionDesc["status"] === "denied" ?
                                        () => {} : () => navigate(`/market/outcome/${marketDesc[0]["_id"]}/yes`)
                                    }
                                >
                                <img src={props.predictionDesc["predictiveImage"]} alt="" className="prediction-outcomeImg" />
                                <div className="prediction-outcomeTopDescContainer">
                                    <div className="prediction-outcomeName">Yes</div>
                                    <div className="prediction-outcomeCostFunction"> 
                                        <Water className="prediction-outcomeCostFunctionIcon"/>&nbsp;
                                        {generalOpx.formatLargeFigures(marketDesc[0]["costFunction"], 2)} FINUX
                                        {ownershipDesc.filter(doc => doc.marketId === marketDesc[0]["_id"]).length > 0 ?
                                            `, You Own: ${generalOpx.formatLargeFigures(ownershipDesc.filter(doc => doc.marketId === marketDesc[0]["_id"])[0]["yesQuantity"] + ownershipDesc.filter(doc => doc.marketId === marketDesc[0]["_id"])[0]["noQuantity"], 2)} Shares` : null
                                        }
                                    </div>
                                </div>
                                <div className="prediction-outcomeTopChancePerc">{generalOpx.formatPercentage.format(marketDesc[0]["probabilityYes"] * 100)}%</div>
                            </button>
                            {props.predictionDesc["status"] === "live" || props.predictionDesc["status"] === "ended" ? 
                                <div className="prediction-outcomeUnderlineContainer">
                                    {props.predictionDesc["status"] === "ended" && authorizedReviewers.includes(props.user) ? 
                                        <>
                                            {cert_decisionOutcomeCode[0] === 1 ? 
                                                <div className="miniaturizedPrediction-decisionOptnSelectedDesc">
                                                    <CheckCircleOutline className="miniaturizedPrediction-decisionOptnSelectedDescIconGreen"/>
                                                    {cert_decision[0] === "yes" ? `Certified yes, resolution underway!` : cert_decision[0] === "no" ? `Certified no, resolution underway!` : "Resolution underway!"}
                                                </div> : 
                                                <>
                                                    {cert_decisionOutcomeCode[0] === 2 ? 
                                                        <div className="miniaturizedPrediction-decisionOptnSelectedDesc">
                                                            <HighlightOffOutlined className="miniaturizedPrediction-decisionOptnSelectedDescIconRed"/>
                                                            Error, please try later.
                                                        </div> : 
                                                        <>
                                                            <button className="miniaturizedPrediction-purchaseYesBtn"
                                                                    onClick={() => certifyMarketOutcome(marketDesc[0]["_id"], 0, "yes")}
                                                                >
                                                                <span style={{"whiteSpace": "nowrap", "padding": "0px", "marginLeft": "5px"}}>
                                                                    {cert_decision[0] === "yes"
                                                                        && cert_decisionLoading[0] ? 
                                                                        <BeatLoader
                                                                            color='var(--primary-green-09)'
                                                                            size={5}
                                                                        /> : `Certify Yes`
                                                                    }
                                                                </span>
                                                                <span
                                                                        style={{"display": "flex", "alignItems": "center", "padding": "0px", "marginLeft": "auto", "marginRight": "2px", "height": "100%", "minHeight": "100%", "maxHeight": "100%"}}
                                                                    >
                                                                    {generalOpx.formatFiguresCrypto.format(marketDesc[0]["priceYes"])}
                                                                    <img src="/assets/Finux_Token_Icon.png" alt="" className="predictionPurchaseBtnImg" />
                                                                </span>
                                                            </button>
                                                            <button className="miniaturizedPrediction-purchaseNoBtn"
                                                                    onClick={() => certifyMarketOutcome(marketDesc[0]["_id"], 0, "no")}
                                                                >
                                                                <span style={{"whiteSpace": "nowrap", "padding": "0px", "marginLeft": "5px"}}>
                                                                    {cert_decision[0] === "no"
                                                                        && cert_decisionLoading[0] ? 
                                                                        <BeatLoader
                                                                            color='var(--primary-red-09)'
                                                                            size={5}
                                                                        /> : `Certify No`
                                                                    }
                                                                </span>
                                                                <span 
                                                                        style={{"display": "flex", "alignItems": "center", "padding": "0px", "marginLeft": "auto", "marginRight": "2px", "height": "100%", "minHeight": "100%", "maxHeight": "100%"}}
                                                                    >
                                                                    {generalOpx.formatFiguresCrypto.format(marketDesc[0]["priceNo"])}
                                                                    <img src="/assets/Finux_Token_Icon.png" alt="" className="predictionPurchaseBtnImg" />
                                                                </span>
                                                            </button>
                                                        </>
                                                    }
                                                </>
                                            }
                                        </> : 
                                        <>
                                            <button className="miniaturizedPrediction-purchaseYesBtn"
                                                    onClick={() => navigate(`/market/outcome/${marketDesc[0]["_id"]}/yes`)}
                                                >
                                                <span style={{"whiteSpace": "nowrap", "padding": "0px", "marginLeft": "5px"}}>View Yes</span>
                                                <span
                                                        style={{"display": "flex", "alignItems": "center", "padding": "0px", "marginLeft": "auto", "marginRight": "2px", "height": "100%", "minHeight": "100%", "maxHeight": "100%"}}
                                                    >
                                                    {generalOpx.formatFiguresCrypto.format(marketDesc[0]["priceYes"])}
                                                    <img src="/assets/Finux_Token_Icon.png" alt="" className="predictionPurchaseBtnImg" />
                                                </span>
                                            </button>
                                            <button className="miniaturizedPrediction-purchaseNoBtn"
                                                    onClick={() => navigate(`/market/outcome/${marketDesc[0]["_id"]}/no`)}
                                                >
                                                <span style={{"whiteSpace": "nowrap", "padding": "0px", "marginLeft": "5px"}}>View No</span>
                                                <span 
                                                        style={{"display": "flex", "alignItems": "center", "padding": "0px", "marginLeft": "auto", "marginRight": "2px", "height": "100%", "minHeight": "100%", "maxHeight": "100%"}}
                                                    >
                                                    {generalOpx.formatFiguresCrypto.format(marketDesc[0]["priceNo"])}
                                                    <img src="/assets/Finux_Token_Icon.png" alt="" className="predictionPurchaseBtnImg" />
                                                </span>
                                            </button>
                                        </>
                                    }
                                </div> : 
                                <>
                                    {props.predictionDesc["status"] === "in-review" || props.predictionDesc["status"] === "denied" ?
                                        <div className="prediction-outcomeUnderlineContainerNoTradingInfoContainer">
                                            {props.predictionDesc["status"] === "in-review" ?
                                                <span className="prediction-outcomeUnderlineCOntainerNoTradingInfoDesc">Market is under review, trading will commense once approved.</span> :
                                                <span className="prediction-outcomeUnderlineCOntainerNoTradingInfoDesc">Market is not available for trading.</span>
                                            }
                                        </div> : 
                                        <>
                                            {props.predictionDesc["status"] === "resolved" && marketDesc[0]["resolved"] ?
                                                <div className="prediction-outcomeUnderlineContainerNoTradingInfoContainer">
                                                    {marketDesc[0]["resolutionOutcome"] === "yes" ?
                                                        <CheckCircleOutline className="prediction-outcomeUnderlineContainerNoTradingInfoYesIcon"/> : 
                                                        <>
                                                            {marketDesc[0]["resolutionOutcome"] === "no" ?
                                                                <HighlightOff className="prediction-outcomeUnderlineContainerNoTradingInfoNoIcon"/> : null
                                                            }
                                                        </>
                                                    }
                                                    {marketDesc[0]["resolutionOutcome"] === "yes" ?
                                                        <span className="prediction-outcomeUnderlineCOntainerNoTradingInfoDesc">Resolution: <span style={{"fontWeight": "500", "color": "var(--primary-bg-01)"}}>Yes</span>.</span> : 
                                                        <>
                                                            {marketDesc[0]["resolutionOutcome"] === "no" ?
                                                                <span className="prediction-outcomeUnderlineCOntainerNoTradingInfoDesc">Resolution: <span style={{"fontWeight": "500", "color": "var(--primary-bg-01)"}}>No</span>.</span> : null
                                                            }
                                                        </>
                                                    }
                                                </div> : null
                                            }
                                        </>
                                    }
                                </>
                            }
                            {props.predictionDesc["status"] === "in-review" && authorizedReviewers.includes(props.user) ?
                                <>
                                    <div className="prediction-outcomeRulesDescriptionContainForReviewHeader">Rules</div>
                                    <div className="prediction-outcomeRulesDescriptionContainForReview">
                                        {marketDesc[0]["rules"]}
                                    </div>
                                </> : null
                            }
                        </div> : 
                        <>
                            {marketDesc.map((desc, index) => (
                                    <div className="prediction-outcomeContainer" key={`maximized-pred-outcome-${index}`}
                                            style={props.predictionDesc["status"] === "in-review" && authorizedReviewers.includes(props.user) ?
                                                {
                                                    "height": "fit-content", "minHeight": "fit-content", "maxHeight": "fit-content",
                                                    "borderBottom": marketDesc.length - 1 === index ? "none" : "solid 1px var(--primary-bg-08)"
                                                } : 
                                                {"borderBottom": marketDesc.length - 1 === index ? "none" : "solid 1px var(--primary-bg-08)"}
                                            }
                                        >
                                        <button className="prediction-outcomeTopContainer"
                                                style={props.predictionDesc["status"] === "in-review" || props.predictionDesc["status"] === "denied" ?
                                                    {"cursor": "auto"} : {}
                                                }
                                                onClick={props.predictionDesc["status"] === "in-review" || props.predictionDesc["status"] === "denied" ?
                                                    () => {} : () => navigate(`/market/outcome/${desc._id}/yes`)
                                                }
                                            >
                                            <img src={desc["outcomeImage"]} alt="" className="prediction-outcomeImg" />
                                            <div className="prediction-outcomeTopDescContainer">
                                                <div className="prediction-outcomeName">{desc["outcome"]}</div>
                                                <div className="prediction-outcomeCostFunction"> 
                                                    <Water className="prediction-outcomeCostFunctionIcon"/>&nbsp;
                                                    {generalOpx.formatLargeFigures(desc["costFunction"], 2)} FINUX
                                                    {ownershipDesc.filter(doc => doc.marketId === desc._id).length > 0 ?
                                                        `, You Own: ${generalOpx.formatLargeFigures(ownershipDesc.filter(doc => doc.marketId === desc._id)[0]["yesQuantity"] + ownershipDesc.filter(doc => doc.marketId === desc._id)[0]["noQuantity"], 2)} Shares` : null
                                                    }
                                                </div>
                                            </div>
                                            <div className="prediction-outcomeTopChancePerc">{generalOpx.formatPercentage.format(desc["probabilityYes"] * 100)}%</div>
                                        </button>
                                        {props.predictionDesc["status"] === "live" ||  props.predictionDesc["status"] === "ended" ? 
                                            <div className="prediction-outcomeUnderlineContainer">
                                                {props.predictionDesc["status"] === "ended" && authorizedReviewers.includes(props.user) ?
                                                    <>
                                                        {cert_decisionOutcomeCode[index] === 1 ? 
                                                            <div className="miniaturizedPrediction-decisionOptnSelectedDesc">
                                                                <CheckCircleOutline className="miniaturizedPrediction-decisionOptnSelectedDescIconGreen"/>
                                                                {cert_decision[index] === "yes" ? `Certified yes, resolution underway!` : cert_decision[index] === "no" ? `Certified no, resolution underway!` : "Resolution underway!"}
                                                            </div> : 
                                                            <>
                                                                {cert_decisionOutcomeCode[index] === 2 ? 
                                                                    <div className="miniaturizedPrediction-decisionOptnSelectedDesc">
                                                                        <HighlightOffOutlined className="miniaturizedPrediction-decisionOptnSelectedDescIconRed"/>
                                                                        Error, please try later.
                                                                    </div> : 
                                                                    <>
                                                                        <button className="miniaturizedPrediction-purchaseYesBtn"
                                                                                onClick={() => certifyMarketOutcome(desc._id, index, "yes")}
                                                                            >
                                                                            <span style={{"whiteSpace": "nowrap", "padding": "0px", "marginLeft": "5px"}}>
                                                                                {cert_decision[index] === "yes"
                                                                                    && cert_decisionLoading[index] ? 
                                                                                    <BeatLoader
                                                                                        color='var(--primary-green-09)'
                                                                                        size={5}
                                                                                    /> : `Certify Yes`
                                                                                }
                                                                            </span>
                                                                            <span
                                                                                    style={{"display": "flex", "alignItems": "center", "padding": "0px", "marginLeft": "auto", "marginRight": "2px", "height": "100%", "minHeight": "100%", "maxHeight": "100%"}}
                                                                                >
                                                                                {generalOpx.formatFiguresCrypto.format(desc["priceYes"])}
                                                                                <img src="/assets/Finux_Token_Icon.png" alt="" className="predictionPurchaseBtnImg" />
                                                                            </span>
                                                                        </button>
                                                                        <button className="miniaturizedPrediction-purchaseNoBtn"
                                                                                onClick={() => certifyMarketOutcome(desc._id, index, "no")}
                                                                            >
                                                                            <span style={{"whiteSpace": "nowrap", "padding": "0px", "marginLeft": "5px"}}>
                                                                                {cert_decision[index] === "no"
                                                                                    && cert_decisionLoading[index] ? 
                                                                                    <BeatLoader
                                                                                        color='var(--primary-red-09)'
                                                                                        size={5}
                                                                                    /> : `Certify No`
                                                                                }
                                                                            </span>
                                                                            <span 
                                                                                    style={{"display": "flex", "alignItems": "center", "padding": "0px", "marginLeft": "auto", "marginRight": "2px", "height": "100%", "minHeight": "100%", "maxHeight": "100%"}}
                                                                                >
                                                                                {generalOpx.formatFiguresCrypto.format(desc["priceNo"])}
                                                                                <img src="/assets/Finux_Token_Icon.png" alt="" className="predictionPurchaseBtnImg" />
                                                                            </span>
                                                                        </button>
                                                                    </>
                                                                }
                                                            </>
                                                        }
                                                    </> : 
                                                    <>
                                                        <button className="miniaturizedPrediction-purchaseYesBtn"
                                                                onClick={() => navigate(`/market/outcome/${desc._id}/yes`)}
                                                            >
                                                            <span style={{"whiteSpace": "nowrap", "padding": "0px", "marginLeft": "5px"}}>View Yes</span>
                                                            <span
                                                                    style={{"display": "flex", "alignItems": "center", "padding": "0px", "marginLeft": "auto", "marginRight": "2px", "height": "100%", "minHeight": "100%", "maxHeight": "100%"}}
                                                                >
                                                                {generalOpx.formatFiguresCrypto.format(desc["priceYes"])}
                                                                <img src="/assets/Finux_Token_Icon.png" alt="" className="predictionPurchaseBtnImg" />
                                                            </span>
                                                        </button>
                                                        <button className="miniaturizedPrediction-purchaseNoBtn"
                                                                onClick={() => navigate(`/market/outcome/${desc._id}/no`)}
                                                            >
                                                            <span style={{"whiteSpace": "nowrap", "padding": "0px", "marginLeft": "5px"}}>View No</span>
                                                            <span 
                                                                    style={{"display": "flex", "alignItems": "center", "padding": "0px", "marginLeft": "auto", "marginRight": "2px", "height": "100%", "minHeight": "100%", "maxHeight": "100%"}}
                                                                >
                                                                {generalOpx.formatFiguresCrypto.format(desc["priceNo"])}
                                                                <img src="/assets/Finux_Token_Icon.png" alt="" className="predictionPurchaseBtnImg" />
                                                            </span>
                                                        </button>
                                                    </>
                                                }
                                            </div> : 
                                            <>
                                                {props.predictionDesc["status"] === "in-review" || props.predictionDesc["status"] === "denied" ?
                                                    <div className="prediction-outcomeUnderlineContainerNoTradingInfoContainer">
                                                        {props.predictionDesc["status"] === "in-review" ?
                                                            <span className="prediction-outcomeUnderlineCOntainerNoTradingInfoDesc">Market is under review, trading will commense once approved.</span> :
                                                            <span className="prediction-outcomeUnderlineCOntainerNoTradingInfoDesc">Market is not available for trading.</span>
                                                        }
                                                    </div> : 
                                                    <>
                                                        {props.predictionDesc["status"] === "resolved" && desc["resolved"] ?
                                                            <div className="prediction-outcomeUnderlineContainerNoTradingInfoContainer">
                                                                {desc["resolutionOutcome"] === "yes" ?
                                                                    <Check className="prediction-outcomeUnderlineContainerNoTradingInfoYesIcon"/> : 
                                                                    <>
                                                                        {desc["resolutionOutcome"] === "no" ?
                                                                            <Close className="prediction-outcomeUnderlineContainerNoTradingInfoNoIcon"/> : null
                                                                        }
                                                                    </>
                                                                }
                                                                {desc["resolutionOutcome"] === "yes" ?
                                                                    <span className="prediction-outcomeUnderlineCOntainerNoTradingInfoDesc" style={{"marginLeft": "5px", "textAlign": "right"}}>Resolution: <span style={{"fontWeight": "500", "color": "var(--primary-bg-01)"}}>Yes</span></span> : 
                                                                    <>
                                                                        {desc["resolutionOutcome"] === "no" ?
                                                                            <span className="prediction-outcomeUnderlineCOntainerNoTradingInfoDesc" style={{"marginLeft": "5px", "textAlign": "right"}}>Resolution: <span style={{"fontWeight": "500", "color": "var(--primary-bg-01)"}}>No</span></span> : null
                                                                        }
                                                                    </>
                                                                }
                                                            </div> : null
                                                        }
                                                    </>
                                                }
                                            </>
                                        }
                                        {props.predictionDesc["status"] === "in-review" && authorizedReviewers.includes(props.user) ?
                                            <>
                                                <div className="prediction-outcomeRulesDescriptionContainForReviewHeader">Rules</div>
                                                <div className="prediction-outcomeRulesDescriptionContainForReview">
                                                    {desc["rules"]}
                                                </div>
                                            </> : null
                                        }
                                    </div>
                                ))
                            }
                        </>
                    }
                </>
            }
            {props.predictionDesc["status"] === "in-review" && authorizedReviewers.includes(props.user) ?
                <div className="miniaturizedPrediction-makeDecisionOpntsContainer">
                    {auth_reviewStatusCode === 1 ?
                        <div className="miniaturizedPrediction-decisionOptnSelectedDesc">
                            <CheckCircleOutline className="miniaturizedPrediction-decisionOptnSelectedDescIconGreen"/>
                            {auth_decision === "approved" ? `Approved, Markets Going Live Soon!` : auth_decision === "denied" ? `Denied, Markets Getting Close Soon` : "All Done!"}
                        </div> : 
                        <>
                            {auth_reviewStatusCode === 2 ? 
                                <div className="miniaturizedPrediction-decisionOptnSelectedDesc">
                                    <HighlightOffOutlined className="miniaturizedPrediction-decisionOptnSelectedDescIconRed"/>
                                    Error, please try later.
                                </div> : 
                                <>
                                    <button className="miniaturizedPrediction-purchaseYesBtn"
                                            disabled={auth_reviewLoading}
                                            onClick={() => sendReviewDecision("approved")}
                                            style={{"fontSize": "1rem", "color": "black", "backgroundColor": "var(--primary-green-09)"}}
                                        >
                                        <span style={{"whiteSpace": "nowrap", "padding": "0px", "margin": "auto"}}>
                                            {auth_decision === "approved" 
                                               && auth_reviewLoading ?
                                                <BeatLoader
                                                    color='var(--secondary-bg-03)'
                                                    size={5}
                                                /> : `Approve Trading`
                                            }
                                        </span>
                                    </button>
                                    <button className="miniaturizedPrediction-purchaseNoBtn"
                                            disabled={auth_reviewLoading}
                                            onClick={() => sendReviewDecision("denied")}
                                            style={{"fontSize": "1rem", "color": "black", "backgroundColor": "var(--primary-red-09)"}}
                                        >
                                        <span style={{"whiteSpace": "nowrap", "padding": "0px", "margin": "auto"}}>
                                            {auth_decision === "denied" 
                                                && auth_reviewLoading ?
                                                <BeatLoader
                                                    color='var(--secondary-bg-03)'
                                                    size={5}
                                                /> : `Deny Trading`
                                            }
                                        </span>
                                    </button>
                                </>
                            }
                        </>
                    }
                </div> : null
            }
            <div className="post-engagementContainer" style={{"marginTop": "15px"}}>
                <div className="post-likeDislikeContainer">
                    <button className="post-likeDislikeBtn"
                            onClick={
                                (props.user === undefined || props.user === null || props.user === "visitor") ?
                                () => navigate("/login") : () => engagePrediction("like")
                            }
                        >
                        {props.loading ?
                            <TrendingUp className="post-likeDislikeIcon"
                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                            /> :
                            <>
                                {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                    <TrendingUp className="post-likeDislikeIcon"
                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                    /> :
                                    <>
                                        {u_engagement.some(eng => eng.predictionId === props.predictionDesc._id) ?
                                            <>
                                                {u_engagement.filter(eng => eng.predictionId === props.predictionDesc._id)[0]["type"] === "like" ?
                                                    <TrendingUp className="post-likedIcon" 
                                                        style={{"stroke": "var(--primary-green-09)", "strokeWidth": "1px"}}
                                                    /> :
                                                    <TrendingUp className="post-likeDislikeIcon"
                                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                    />
                                                }
                                            </> : 
                                            <TrendingUp className="post-likeDislikeIcon"
                                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                            />
                                        }
                                    </>
                                }
                            </>
                        }
                    </button>
                    {props.loading || engagementRatio[0] + engagementRatio[1] === 0 ?
                        null : 
                        <span className="comment-likeDislikeCounter">
                            {engagementRatio[0] - engagementRatio[1] > 0 ? "+ " : "-"}
                            {generalOpx.formatLargeFigures(Math.abs(engagementRatio[0] - engagementRatio[1]), 2)}
                        </span>
                    }
                    <button className="post-likeDislikeBtn"
                            onClick={
                                (props.user === undefined || props.user === null || props.user === "visitor") ?
                                () => navigate("/login") : () => engagePrediction("dislike")
                            }
                        >
                        {props.loading ?
                            <TrendingDown className="post-likeDislikeIcon"
                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px", "transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)"}}
                            /> :
                            <>
                                {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                    <TrendingDown className="post-likeDislikeIcon"
                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px", "transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)"}}
                                    /> :
                                    <>
                                        {u_engagement.some(eng => eng.predictionId === props.predictionDesc._id) ?
                                            <>
                                                {u_engagement.filter(eng => eng.predictionId === props.predictionDesc._id)[0]["type"] === "dislike" ?
                                                    <TrendingDown className="post-dislikedIcon" 
                                                        style={{"stroke": "var(--primary-red-09)", "strokeWidth": "1px", "transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)"}}
                                                    /> :
                                                    <TrendingDown className="post-likeDislikeIcon"
                                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px", "transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)"}}
                                                    />
                                                }
                                            </> : 
                                            <TrendingDown className="post-likeDislikeIcon"
                                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px", "transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)"}}
                                            />
                                        }
                                    </>
                                }
                            </>
                        }
                    </button>
                </div>
                <div className="post-additionalEngagementOptionsContainer">
                    <div className="post-additionalEngagementOptionsDesc">
                        <Cached className="post-additionalEngagementOptionsDescIcon"/>
                        {props.loading || repostCount === 0 ?
                            null : 
                            <span className="post-additionalEngagementOptionsDescText">{generalOpx.formatLargeFigures(repostCount, 2)}</span>
                        }
                    </div>
                    <div className="post-additionalEngagementOptionsDesc">
                        <Comment className="post-additionalEngagementOptionsDescIcon"/>
                        {props.loading || commentCount === 0 ?
                            null : 
                            <span className="post-additionalEngagementOptionsDescText">{generalOpx.formatLargeFigures(commentCount, 2)}</span>
                        }
                    </div>
                    <div className="post-additionalEngagementOptionsDesc">
                        <ContentCopy className="post-additionalEngagementOptionsDescIcon"/>
                    </div>
                </div>
            </div>

            <div className="post-makeCommentBody">
                <div className="post-makeCommentInputBox">
                    <FinulabComment type={"main"} commFor={"prediction"} location={props.pred_location} 
                        desc={{"predictionId": props.predictionDesc._id, "predType": Object.keys(props.predictionDesc).includes("outcomesMap") ? "categorical" : "y-n", "groupId": props.predictionDesc.groupId}}
                    />
                </div>
                {!comments["dataLoading"] && comments["type"] === "prediction" && comments["_id"] === props.predictionDesc._id ?
                    <div className="post-commentsWrapper">
                        {comments["data"].length === 0  || comments["dataCount"] === 0 ?
                            <div className="post-noCommentContainer">
                                <div className="post-noCommentFinulabLogoContainer">
                                    <img src="/assets/Finulab_Icon.png" alt="" className="post-noCommentFinulabLogoImg" />
                                </div>
                                <div className="post-noCommentFinulabAddToConversationContainer">
                                    <div className="post-noCommentHeader">Be the first to comment</div>
    
                                    <div className="post-noCommentBody" style={{"marginTop": "12.5px"}}>Nobody has responded to this prediction yet.</div>
                                    <div className="post-noCommentBody">Add your thoughts and get the conversation going.</div>
                                </div>
                            </div> :
                            <>
                                {comments["data"].map((desc, index) => {
                                        if(desc.type === "comment" && desc.value.index === 0) {
                                            let commentMedia = [
                                                ...desc.value.photos,
                                                ...desc.value.videos
                                            ];

                                            return <div className="post-commentContainer" key={`comment-data-${index}`} style={index === 0 ? {} : {"marginTop": "25px"}}>
                                                <div className="post-commentHeader">
                                                    {`${desc.value.username}`.toLowerCase() === "[deleted]" ?
                                                        <div className="post-headerProfileImageCommentDeleted">
                                                            {`[ - ]`}
                                                        </div> : 
                                                        <>
                                                            {desc.value.profileImage === "" ? 
                                                                <div className="post-headerProfileImageNone"
                                                                        style={generalOpx.profilePictureGradients[index % 5]}
                                                                    >
                                                                    <img src="/assets/Favicon.png" alt="" className="large-homePageHeaderProfileImgNonUser" />
                                                                    <Tsunami className="post-headerProfileImageNoneIcon"/>
                                                                </div> : 
                                                                <img src={desc.value.profileImage} alt="" className="post-headerProfileImage" />
                                                            }
                                                        </>
                                                    }
                                                    <div className="post-headerName">
                                                        {desc.value.username}
                                                        <span className="post-headerTimeAgo">&nbsp;&nbsp;•&nbsp;&nbsp;{format(desc.value.timeStamp * 1000)}</span>
                                                    </div>
                                                </div>
                                                <div className="post-commentBody">
                                                    <div className="post-commentBodyLineUpContainer">
                                                        {desc["l0"] ?
                                                            <>
                                                                <div className="post-commentBodyLineUp"/>
                                                                {comments["data"][index + 1] === undefined ||  comments["data"][index + 1] === null ? 
                                                                    null : 
                                                                    <>
                                                                        {comments["data"][index + 1]["type"] === "expand" 
                                                                            || (comments["data"][index + 1]["type"] === "comment" && comments["data"][index + 1]["value"]["index"] === 0) ?
                                                                            null :
                                                                            <button className="post-commentBodyLineUpBtn"
                                                                                    onClick={comments["data"][index + 1]["display"] ?
                                                                                        () => commentBlockDisplayToggle(index, "hide") : () => commentBlockDisplayToggle(index, "view")
                                                                                    }
                                                                                > 
                                                                                {comments["data"][index + 1]["display"] ?
                                                                                    <Remove className="post-commentBodyLineUpBtnIcon"/>:
                                                                                    <Add className="post-commentBodyLineUpBtnIcon"/>
                                                                                }
                                                                            </button>
                                                                        }
                                                                    </>
                                                                }
                                                            </> : null
                                                        }
                                                    </div>
                                                    <div className="post-commentBodyCommentContainer">
                                                        <div className="post-commentBodyComment">
                                                            <div 
                                                                dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(desc.value.comment)}}
                                                                className="post-bodyTextDescUpgraded"
                                                            />
                                                        </div>

                                                        {commentMedia.length === 0 ?
                                                            null : 
                                                            <div className="post-commentBodyMediaContainer">
                                                                {commentMedia.length === 1 ?
                                                                    <>
                                                                        {commentMedia[0][1] === "photo" ?
                                                                            <button className="comment-mediaOneImgBtn"
                                                                                    onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                >
                                                                                <img src={commentMedia[0][0]} alt="" className="comment-mediaOneImg" />
                                                                            </button> : 
                                                                            <div className="comment-mediaVideoOneContainer">
                                                                                <video className="comment-video" controls>
                                                                                    <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                </video>
                                                                            </div>
                                                                        }
                                                                    </> : 
                                                                    <>
                                                                        {commentMedia.length === 2 ?
                                                                            <>
                                                                                {commentMedia[0][1] === "photo" ?
                                                                                    <button className="comment-mediaOneofTwoBtn"
                                                                                            onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                        >
                                                                                        <img src={commentMedia[0][0]} alt="" className="comment-mediaOneofTwoImg" />
                                                                                    </button> : 
                                                                                    <div className="comment-mediaVideoOneofTwoContainer">
                                                                                        <video className="comment-mediaOneofTwoImg" controls>
                                                                                            <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                        </video>
                                                                                        <button className="post-mediaOneofTwoVideoBtn" onClick={() => setupViewCommentMedia(0, commentMedia)}></button>
                                                                                    </div>
                                                                                }
                                                                                {commentMedia[1][1] === "photo" ?
                                                                                    <button className="comment-mediaTwoofTwoBtn"
                                                                                            onClick={() => setupViewCommentMedia(1, commentMedia)}
                                                                                        >
                                                                                        <img src={commentMedia[1][0]} alt="" className="comment-mediaTwoofTwoImg" />
                                                                                    </button> : 
                                                                                    <div className="comment-mediaVideoTwoofTwoContainer">
                                                                                        <video className="comment-mediaTwoofTwoImg" controls>
                                                                                            <source src={`${commentMedia[1][0]}#t=0.5`} type="video/mp4"/>
                                                                                        </video>
                                                                                        <button className="post-mediaTwoofTwoVideoBtn" onClick={() => setupViewCommentMedia(1, commentMedia)}></button>
                                                                                    </div>
                                                                                }
                                                                            </> : 
                                                                            <>
                                                                                {commentMedia.length === 3 ?
                                                                                    <>
                                                                                        {commentMedia[0][1] === "photo" ?
                                                                                            <button className="comment-mediaOneofThreeBtn"
                                                                                                    onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                                >
                                                                                                <img src={commentMedia[0][0]} alt="" className="comment-mediaOneofTwoImg" />
                                                                                            </button> : 
                                                                                            <div className="comment-mediaVideoOneofThreeContainer">
                                                                                                <video className="comment-mediaOneofTwoImg" controls>
                                                                                                    <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                                </video>
                                                                                                <button className="post-mediaOneofTwoVideoBtn" onClick={() => setupViewCommentMedia(0, commentMedia)}></button>
                                                                                            </div>
                                                                                        }
                                                                                        <div className="comment-mediaThreeInnerContainer">
                                                                                            {commentMedia[1][1] === "photo" ?
                                                                                                <button className="comment-mediaTwoofThreeBtn"
                                                                                                        onClick={() => setupViewCommentMedia(1, commentMedia)}
                                                                                                    >
                                                                                                    <img src={commentMedia[1][0]} alt="" className="comment-mediaTwoofThreeImg" />
                                                                                                </button> : 
                                                                                                <div className="comment-mediaVideoTwoofThreeContainer">
                                                                                                    <video className="comment-mediaTwoofThreeImg" muted controls playsInline>
                                                                                                        <source src={`${commentMedia[1][0]}#t=0.5`} type="video/mp4"/>
                                                                                                    </video>
                                                                                                    <button className="post-mediaVideoTwoofThreeBtn" onClick={() => setupViewCommentMedia(1, commentMedia)}></button>
                                                                                                </div>
                                                                                            }
                                                                                            {commentMedia[2][1] === "photo" ?
                                                                                                <button className="comment-mediaThreeofThreeBtn"
                                                                                                        onClick={() => setupViewCommentMedia(2, commentMedia)}
                                                                                                    >
                                                                                                    <img src={commentMedia[2][0]} alt="" className="comment-mediaThreeofThreeImg" />
                                                                                                </button> : 
                                                                                                <div className="comment-mediaVideoThreeofThreeContainer">
                                                                                                    <video className="comment-mediaThreeofThreeImg" muted controls playsInline>
                                                                                                        <source src={`${commentMedia[2][0]}#t=0.5`} type="video/mp4"/>
                                                                                                    </video>
                                                                                                    <button className="post-mediaVideoThreeofThreeBtn" onClick={() => setupViewCommentMedia(2, commentMedia)}></button>
                                                                                                </div>
                                                                                            }
                                                                                        </div>
                                                                                    </> : 
                                                                                    <>
                                                                                        <div className="comment-mediaThreeInnerContainer">
                                                                                            {commentMedia[0][1] === "photo" ?
                                                                                                <button className="comment-mediaOneofFourBtn"
                                                                                                        onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                                    >
                                                                                                    <img src={commentMedia[0][0]} alt="" className="comment-mediaOneofFourImg" />
                                                                                                </button> : 
                                                                                                <div className="comment-mediaVideoOneofFourContainer">
                                                                                                    <video className="comment-mediaOneofFourImg" controls>
                                                                                                        <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                                    </video>
                                                                                                    <button className="post-mediaVideoOneofFourBtn" onClick={() => setupViewCommentMedia(0, commentMedia)}></button>
                                                                                                </div>
                                                                                            }
                                                                                            {commentMedia[1][1] === "photo" ?
                                                                                                <button className="comment-mediaTwoofFourBtn"
                                                                                                        onClick={() => setupViewCommentMedia(1, commentMedia)}
                                                                                                    >
                                                                                                    <img src={commentMedia[1][0]} alt="" className="comment-mediaTwoofFourImg" />
                                                                                                </button> : 
                                                                                                <div className="comment-mediaVideoTwoofFourContainer">
                                                                                                    <video className="comment-mediaTwoofFourImg" muted controls playsInline>
                                                                                                        <source src={`${commentMedia[1][0]}#t=0.5`} type="video/mp4"/>
                                                                                                    </video>
                                                                                                    <button className="post-mediaVideoTwoofFourBtn" onClick={() => setupViewCommentMedia(1, commentMedia)}></button>
                                                                                                </div>
                                                                                            }
                                                                                        </div>
                                                                                        <div className="comment-mediaThreeInnerContainer">
                                                                                            {commentMedia[2][1] === "photo" ?
                                                                                                <button className="comment-mediaTwoofThreeBtn"
                                                                                                        onClick={() => setupViewCommentMedia(2, commentMedia)}
                                                                                                    >
                                                                                                    <img src={commentMedia[2][0]} alt="" className="comment-mediaTwoofThreeImg" />
                                                                                                </button> : 
                                                                                                <div className="comment-mediaVideoTwoofThreeContainer">
                                                                                                    <video className="comment-mediaTwoofThreeImg" muted controls playsInline>
                                                                                                        <source src={`${commentMedia[2][0]}#t=0.5`} type="video/mp4"/>
                                                                                                    </video>
                                                                                                    <button className="post-mediaVideoTwoofThreeBtn" onClick={() => setupViewCommentMedia(2, commentMedia)}></button>
                                                                                                </div>
                                                                                            }
                                                                                            {commentMedia[3][1] === "photo" ?
                                                                                                <button className="comment-mediaThreeofThreeBtn"
                                                                                                        onClick={() => setupViewCommentMedia(3, commentMedia)}
                                                                                                    >
                                                                                                    <img src={commentMedia[3][0]} alt="" className="comment-mediaThreeofThreeImg" />
                                                                                                </button> : 
                                                                                                <div className="comment-mediaVideoThreeofThreeContainer">
                                                                                                    <video className="comment-mediaThreeofThreeImg" muted controls playsInline>
                                                                                                        <source src={`${commentMedia[3][0]}#t=0.5`} type="video/mp4"/>
                                                                                                    </video>
                                                                                                    <button className="post-mediaVideoThreeofThreeBtn" onClick={() => setupViewCommentMedia(3, commentMedia)}></button>
                                                                                                </div>
                                                                                            }
                                                                                        </div>
                                                                                    </>
                                                                                }
                                                                            </>
                                                                        }
                                                                    </>
                                                                }
                                                            </div>
                                                        }
                    
                                                        <div className="post-engagementContainer">
                                                            <div className="post-likeDislikeContainer">
                                                                <button className="post-likeDislikeBtn"
                                                                        onClick={
                                                                            (props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                            () => navigate("/login") : () => engageComment(index, `m_${desc.value._id}`, "like")
                                                                        }
                                                                    >
                                                                    {props.loading ?
                                                                        <TrendingUp className="post-likeDislikeIcon"
                                                                            style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                        /> :
                                                                        <>
                                                                            {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                                <TrendingUp className="post-likeDislikeIcon"
                                                                                    style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}    
                                                                                /> :
                                                                                <>
                                                                                    {commentsEngagement.some(eng => eng.commentId === `m_${desc.value._id}`) ?
                                                                                        <>
                                                                                            {commentsEngagement.filter(eng => eng.commentId === `m_${desc.value._id}`)[0]["type"] === "like" ?
                                                                                                <TrendingUp className="post-likedIcon" 
                                                                                                    style={{"stroke": "var(--primary-green-09)", "strokeWidth": "1px"}}    
                                                                                                /> :
                                                                                                <TrendingUp className="post-likeDislikeIcon"
                                                                                                    style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                                />
                                                                                            }
                                                                                        </> : 
                                                                                        <TrendingUp className="post-likeDislikeIcon"
                                                                                            style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                        />
                                                                                    }
                                                                                </>
                                                                            }
                                                                        </>
                                                                    }
                                                                </button>
                                                                {desc.value.likes - desc.value.dislikes === 0 ?
                                                                    null : 
                                                                    <span className="comment-likeDislikeCounter">
                                                                        {desc.value.likes - desc.value.dislikes > 0 ? "+ " : "-"}
                                                                        {generalOpx.formatLargeFigures(Math.abs(desc.value.likes - desc.value.dislikes), 2)}
                                                                    </span>
                                                                }
                                                                <button className="post-likeDislikeBtn"
                                                                        onClick={
                                                                            (props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                            () => navigate("/login") : () => engageComment(index, `m_${desc.value._id}`, "dislike")
                                                                        }
                                                                    >
                                                                    {props.loading ?
                                                                        <TrendingDown className="post-likeDislikeIcon" 
                                                                            style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                        /> :
                                                                        <>
                                                                            {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                            <TrendingDown className="post-likeDislikeIcon"
                                                                                style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                            /> :
                                                                                <>
                                                                                    {commentsEngagement.some(eng => eng.commentId === `m_${desc.value._id}`) ?
                                                                                        <>
                                                                                            {commentsEngagement.filter(eng => eng.commentId === `m_${desc.value._id}`)[0]["type"] === "dislike" ?
                                                                                                <TrendingDown className="post-dislikedIcon" 
                                                                                                    style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-red-09)", "strokeWidth": "1px"}}
                                                                                                /> :
                                                                                                <TrendingDown className="post-likeDislikeIcon"
                                                                                                    style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                                />
                                                                                            }
                                                                                        </> : 
                                                                                        <TrendingDown className="post-likeDislikeIcon" 
                                                                                            style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                        />
                                                                                    }
                                                                                </>
                                                                            }
                                                                        </>
                                                                    }
                                                                </button>
                                                            </div>
                                                            <div className="post-additionalEngagementOptionsContainer">
                                                                <button className="post-additionalEngagementOptionsDesc" onClick={() => commentDisplayToggle(index)}>
                                                                    <Comment className="post-additionalEngagementOptionsDescIcon"/>
                                                                </button>
                                                                {props.user === desc.value.username ?
                                                                    <button className="post-additionalEngagementOptionsDesc" 
                                                                            style={{"marginLeft": "20px"}}
                                                                            onClick={() => commentDeleteToggle(index)}
                                                                        >
                                                                        <DeleteSharp className="post-additionalEngagementOptionsDescIcon"/>
                                                                    </button> : null
                                                                }
                                                            </div>
                                                        </div>

                                                        <div className="post-commentAddYourCommentContainer"
                                                                style={desc.commentDisplay ? {"display": "flex"} : {"display": "none"}}
                                                            >
                                                            <FinulabComment type={"secondary"} commFor={"prediction"}
                                                                location={props.pred_location}
                                                                desc={
                                                                    {
                                                                        "predictionId": props.predictionDesc._id, 
                                                                        "predType": Object.keys(props.predictionDesc).includes("outcomesMap") ? "categorical" : "y-n",
                                                                        "groupId": props.predictionDesc.groupId, 
                                                                        "index": index, 
                                                                        "mainCommentId": desc.value.index === 0 ? desc.value._id : desc.value.mainCommentId, 
                                                                        "commentId": desc.value.index === 3 ? desc.value.commentId : desc.value._id,
                                                                        "commentIndex": desc.value.index === 3 ? 3 : desc.value.index + 1
                                                                    }
                                                                }
                                                            />
                                                        </div>
                                                        {desc.deleteDisplay ?
                                                            <div className="post-makeCommentNoticeContainer">
                                                                <div className="post-makeCommentNoticeHeader">Are you sure you want to delete comment?</div>
                                                                <div className="post-makeCommentNoticeBodyOptnsContainer">
                                                                    {desc.deleteStatus === 2 ?
                                                                        <div className="post-makeCommentAnErrorOccuredNotice">An error occured, please try again later.</div> :
                                                                        <>
                                                                            <button className="post-commentDeleteCommentBtn" onClick={() => commentDelete(index)}>
                                                                                {desc.deleteStatus === 1 ?
                                                                                    <BeatLoader 
                                                                                        color='#f6be76'
                                                                                        loading={true}
                                                                                        size={5}
                                                                                    /> : `Delete`
                                                                                }
                                                                            </button>
                                                                            <button className="post-commentDeleteCommentBtn"
                                                                                    onClick={() => commentDeleteToggle(index)}
                                                                                    style={{"color": "var(--primary-bg-05)", "border": "solid 1px var(--primary-bg-05)"}}
                                                                                >
                                                                                Cancel
                                                                            </button>
                                                                        </>
                                                                    }
                                                                </div>
                                                            </div> : null
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        } else if(desc.type === "comment" && desc.value.index === 1) {
                                            let commentMedia = [
                                                ...desc.value.photos,
                                                ...desc.value.videos
                                            ];

                                            return <div className="post-commentSecondary" key={`comment-data-${index}`} style={desc.display ? {} : {"display": "none"}}>
                                                <div className="post-commentBodyLineUpContainer">
                                                    {desc["l0"] ?
                                                        <div className="post-commentBodyLineUp"/> : null
                                                    }
                                                </div>
                                                <div className="post-commentSecondaryContainer">
                                                    <div className="post-commentHeader">
                                                        <div className="post-commentSecondaryLineMoreRepliesConnector"></div>
                                                        {`${desc.value.username}`.toLowerCase() === "[deleted]" ?
                                                            <div className="post-headerProfileImageCommentDeleted">
                                                                {`[ - ]`}
                                                            </div> :
                                                            <>
                                                                {desc.value.profileImage === "" ? 
                                                                    <div className="post-headerProfileImageNone"
                                                                            style={generalOpx.profilePictureGradients[index % 5]}
                                                                        >
                                                                        <img src="/assets/Favicon.png" alt="" className="large-homePageHeaderProfileImgNonUser" />
                                                                        <Tsunami className="post-headerProfileImageNoneIcon"/>
                                                                    </div> : 
                                                                    <img src={desc.value.profileImage} alt="" className="post-headerProfileImage" />
                                                                }
                                                            </>
                                                        }
                                                        <div className="post-headerName">
                                                            {desc.value.username}
                                                            <span className="post-headerTimeAgo">&nbsp;&nbsp;•&nbsp;&nbsp;{format(desc.value.timeStamp * 1000)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="post-commentBody">
                                                        <div className="post-commentBodyLineUpContainer">
                                                            {desc["l1"] ?
                                                                <>
                                                                    <div className="post-commentBodyLineUp"/>
                                                                    {comments["data"][index + 1] === undefined ||  comments["data"][index + 1] === null ? 
                                                                        null : 
                                                                        <>
                                                                            {comments["data"][index + 1]["type"] === "expand" 
                                                                                || (comments["data"][index + 1]["type"] === "comment" && comments["data"][index + 1]["value"]["index"] <= 1) ?
                                                                                null :
                                                                                <button className="post-commentBodyLineUpBtn"
                                                                                        onClick={comments["data"][index + 1]["display"] ?
                                                                                            () => commentBlockDisplayToggle(index, "hide") : () => commentBlockDisplayToggle(index, "view")
                                                                                        }
                                                                                    > 
                                                                                    {comments["data"][index + 1]["display"] ?
                                                                                        <Remove className="post-commentBodyLineUpBtnIcon"/>:
                                                                                        <Add className="post-commentBodyLineUpBtnIcon"/>
                                                                                    }
                                                                                </button>
                                                                            }
                                                                        </>
                                                                    }
                                                                </> : null
                                                            }
                                                        </div>
                                                        <div className="post-commentBodyCommentContainer">
                                                            <div className="post-commentBodyComment">
                                                                <div 
                                                                    dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(desc.value.comment)}}
                                                                    className="post-bodyTextDescUpgraded"
                                                                />
                                                            </div>

                                                            {commentMedia.length === 0 ?
                                                                null : 
                                                                <div className="post-commentBodyMediaContainer">
                                                                    {commentMedia.length === 1 ?
                                                                        <>
                                                                            {commentMedia[0][1] === "photo" ?
                                                                                <button className="comment-mediaOneImgBtn"
                                                                                        onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                    >
                                                                                    <img src={commentMedia[0][0]} alt="" className="comment-mediaOneImg" />
                                                                                </button> : 
                                                                                <div className="comment-mediaVideoOneContainer">
                                                                                    <video className="comment-video" controls>
                                                                                        <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                    </video>
                                                                                </div>
                                                                            }
                                                                        </> : 
                                                                        <>
                                                                            {commentMedia.length === 2 ?
                                                                                <>
                                                                                    {commentMedia[0][1] === "photo" ?
                                                                                        <button className="comment-mediaOneofTwoBtn"
                                                                                                onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                            >
                                                                                            <img src={commentMedia[0][0]} alt="" className="comment-mediaOneofTwoImg" />
                                                                                        </button> : 
                                                                                        <div className="comment-mediaVideoOneofTwoContainer">
                                                                                            <video className="comment-mediaOneofTwoImg" controls>
                                                                                                <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                            </video>
                                                                                            <button className="post-mediaOneofTwoVideoBtn" onClick={() => setupViewCommentMedia(0, commentMedia)}></button>
                                                                                        </div>
                                                                                    }
                                                                                    {commentMedia[1][1] === "photo" ?
                                                                                        <button className="comment-mediaTwoofTwoBtn"
                                                                                                onClick={() => setupViewCommentMedia(1, commentMedia)}
                                                                                            >
                                                                                            <img src={commentMedia[1][0]} alt="" className="comment-mediaTwoofTwoImg" />
                                                                                        </button> : 
                                                                                        <div className="comment-mediaVideoTwoofTwoContainer">
                                                                                            <video className="comment-mediaTwoofTwoImg" controls>
                                                                                                <source src={`${commentMedia[1][0]}#t=0.5`} type="video/mp4"/>
                                                                                            </video>
                                                                                            <button className="post-mediaTwoofTwoVideoBtn" onClick={() => setupViewCommentMedia(1, commentMedia)}></button>
                                                                                        </div>
                                                                                    }
                                                                                </> : 
                                                                                <>
                                                                                    {commentMedia.length === 3 ?
                                                                                        <>
                                                                                            {commentMedia[0][1] === "photo" ?
                                                                                                <button className="comment-mediaOneofThreeBtn"
                                                                                                        onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                                    >
                                                                                                    <img src={commentMedia[0][0]} alt="" className="comment-mediaOneofTwoImg" />
                                                                                                </button> : 
                                                                                                <div className="comment-mediaVideoOneofThreeContainer">
                                                                                                    <video className="comment-mediaOneofTwoImg" controls>
                                                                                                        <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                                    </video>
                                                                                                    <button className="post-mediaOneofTwoVideoBtn" onClick={() => setupViewCommentMedia(0, commentMedia)}></button>
                                                                                                </div>
                                                                                            }
                                                                                            <div className="comment-mediaThreeInnerContainer">
                                                                                                {commentMedia[1][1] === "photo" ?
                                                                                                    <button className="comment-mediaTwoofThreeBtn"
                                                                                                            onClick={() => setupViewCommentMedia(1, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[1][0]} alt="" className="comment-mediaTwoofThreeImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoTwoofThreeContainer">
                                                                                                        <video className="comment-mediaTwoofThreeImg" muted controls playsInline>
                                                                                                            <source src={`${commentMedia[1][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoTwoofThreeBtn" onClick={() => setupViewCommentMedia(1, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                                {commentMedia[2][1] === "photo" ?
                                                                                                    <button className="comment-mediaThreeofThreeBtn"
                                                                                                            onClick={() => setupViewCommentMedia(2, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[2][0]} alt="" className="comment-mediaThreeofThreeImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoThreeofThreeContainer">
                                                                                                        <video className="comment-mediaThreeofThreeImg" muted controls playsInline>
                                                                                                            <source src={`${commentMedia[2][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoThreeofThreeBtn" onClick={() => setupViewCommentMedia(2, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                            </div>
                                                                                        </> : 
                                                                                        <>
                                                                                            <div className="comment-mediaThreeInnerContainer">
                                                                                                {commentMedia[0][1] === "photo" ?
                                                                                                    <button className="comment-mediaOneofFourBtn"
                                                                                                            onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[0][0]} alt="" className="comment-mediaOneofFourImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoOneofFourContainer">
                                                                                                        <video className="comment-mediaOneofFourImg" controls>
                                                                                                            <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoOneofFourBtn" onClick={() => setupViewCommentMedia(0, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                                {commentMedia[1][1] === "photo" ?
                                                                                                    <button className="comment-mediaTwoofFourBtn"
                                                                                                            onClick={() => setupViewCommentMedia(1, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[1][0]} alt="" className="comment-mediaTwoofFourImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoTwoofFourContainer">
                                                                                                        <video className="comment-mediaTwoofFourImg" muted controls playsInline>
                                                                                                            <source src={`${commentMedia[1][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoTwoofFourBtn" onClick={() => setupViewCommentMedia(1, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                            </div>
                                                                                            <div className="comment-mediaThreeInnerContainer">
                                                                                                {commentMedia[2][1] === "photo" ?
                                                                                                    <button className="comment-mediaTwoofThreeBtn"
                                                                                                            onClick={() => setupViewCommentMedia(2, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[2][0]} alt="" className="comment-mediaTwoofThreeImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoTwoofThreeContainer">
                                                                                                        <video className="comment-mediaTwoofThreeImg" muted controls playsInline>
                                                                                                            <source src={`${commentMedia[2][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoTwoofThreeBtn" onClick={() => setupViewCommentMedia(2, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                                {commentMedia[3][1] === "photo" ?
                                                                                                    <button className="comment-mediaThreeofThreeBtn"
                                                                                                            onClick={() => setupViewCommentMedia(3, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[3][0]} alt="" className="comment-mediaThreeofThreeImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoThreeofThreeContainer">
                                                                                                        <video className="comment-mediaThreeofThreeImg" muted controls playsInline>
                                                                                                            <source src={`${commentMedia[3][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoThreeofThreeBtn" onClick={() => setupViewCommentMedia(3, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                            </div>
                                                                                        </>
                                                                                    }
                                                                                </>
                                                                            }
                                                                        </>
                                                                    }
                                                                </div>
                                                            }
                    
                                                            <div className="post-engagementContainer">
                                                                <div className="post-likeDislikeContainer">
                                                                    <button className="post-likeDislikeBtn"
                                                                            onClick={
                                                                                (props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                                () => navigate("/login") : () => engageComment(index, `s_${desc.value._id}`, "like")
                                                                            }
                                                                        >
                                                                        {props.loading ?
                                                                            <TrendingUp className="post-likeDislikeIcon"
                                                                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                            /> :
                                                                            <>
                                                                                {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                                    <TrendingUp className="post-likeDislikeIcon"
                                                                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}    
                                                                                    /> :
                                                                                    <>
                                                                                        {commentsEngagement.some(eng => eng.commentId === `s_${desc.value._id}`) ?
                                                                                            <>
                                                                                                {commentsEngagement.filter(eng => eng.commentId === `s_${desc.value._id}`)[0]["type"] === "like" ?
                                                                                                    <TrendingUp className="post-likedIcon" 
                                                                                                        style={{"stroke": "var(--primary-green-09)", "strokeWidth": "1px"}}    
                                                                                                    /> :
                                                                                                    <TrendingUp className="post-likeDislikeIcon"
                                                                                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                                    />
                                                                                                }
                                                                                            </> : 
                                                                                            <TrendingUp className="post-likeDislikeIcon"
                                                                                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                            />
                                                                                        }
                                                                                    </>
                                                                                }
                                                                            </>
                                                                        }
                                                                    </button>
                                                                    {desc.value.likes - desc.value.dislikes === 0 ?
                                                                        null : 
                                                                        <span className="comment-likeDislikeCounter">
                                                                            {desc.value.likes - desc.value.dislikes > 0 ? "+ " : "-"}
                                                                            {generalOpx.formatLargeFigures(Math.abs(desc.value.likes - desc.value.dislikes), 2)}
                                                                        </span>
                                                                    }
                                                                    <button className="post-likeDislikeBtn"
                                                                            onClick={
                                                                                (props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                                () => navigate("/login") : () => engageComment(index, `s_${desc.value._id}`, "dislike")
                                                                            }
                                                                        >
                                                                        {props.loading ?
                                                                            <TrendingDown className="post-likeDislikeIcon" 
                                                                                style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                            /> :
                                                                            <>
                                                                                {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                                <TrendingDown className="post-likeDislikeIcon"
                                                                                    style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                /> :
                                                                                    <>
                                                                                        {commentsEngagement.some(eng => eng.commentId === `s_${desc.value._id}`) ?
                                                                                            <>
                                                                                                {commentsEngagement.filter(eng => eng.commentId === `s_${desc.value._id}`)[0]["type"] === "dislike" ?
                                                                                                    <TrendingDown className="post-dislikedIcon" 
                                                                                                        style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-red-09)", "strokeWidth": "1px"}}
                                                                                                    /> :
                                                                                                    <TrendingDown className="post-likeDislikeIcon"
                                                                                                        style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                                    />
                                                                                                }
                                                                                            </> : 
                                                                                            <TrendingDown className="post-likeDislikeIcon" 
                                                                                                style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                            />
                                                                                        }
                                                                                    </>
                                                                                }
                                                                            </>
                                                                        }
                                                                    </button>
                                                                </div>
                                                                <div className="post-additionalEngagementOptionsContainer">
                                                                    <button className="post-additionalEngagementOptionsDesc" onClick={() => commentDisplayToggle(index)}>
                                                                        <Comment className="post-additionalEngagementOptionsDescIcon"/>
                                                                    </button>
                                                                    {props.user === desc.value.username ?
                                                                        <button className="post-additionalEngagementOptionsDesc" 
                                                                                style={{"marginLeft": "20px"}}
                                                                                onClick={() => commentDeleteToggle(index)}
                                                                            >
                                                                            <DeleteSharp className="post-additionalEngagementOptionsDescIcon"/>
                                                                        </button> : null
                                                                    }
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="post-commentAddYourCommentContainer"
                                                                    style={desc.commentDisplay ? {"display": "flex"} : {"display": "none"}}
                                                                >
                                                                <FinulabComment type={"secondary"} commFor={"prediction"}
                                                                    location={props.pred_location}
                                                                    desc={
                                                                        {
                                                                            "predictionId": props.predictionDesc._id, 
                                                                            "predType": Object.keys(props.predictionDesc).includes("outcomesMap") ? "categorical" : "y-n",
                                                                            "groupId": props.predictionDesc.groupId, 
                                                                            "index": index, 
                                                                            "mainCommentId": desc.value.index === 0 ? desc.value._id : desc.value.mainCommentId, 
                                                                            "commentId": desc.value.index === 3 ? desc.value.commentId : desc.value._id,
                                                                            "commentIndex": desc.value.index === 3 ? 3 : desc.value.index + 1
                                                                        }
                                                                    }
                                                                />
                                                            </div>

                                                            {desc.deleteDisplay ?
                                                                <div className="post-makeCommentNoticeContainer">
                                                                    <div className="post-makeCommentNoticeHeader">Are you sure you want to delete comment?</div>
                                                                    <div className="post-makeCommentNoticeBodyOptnsContainer">
                                                                        {desc.deleteStatus === 2 ?
                                                                            <div className="post-makeCommentAnErrorOccuredNotice">An error occured, please try again later.</div> :
                                                                            <>
                                                                                <button className="post-commentDeleteCommentBtn" onClick={() => commentDelete(index)}>
                                                                                    {desc.deleteStatus === 1 ?
                                                                                        <BeatLoader 
                                                                                            color='#f6be76'
                                                                                            loading={true}
                                                                                            size={5}
                                                                                        /> : `Delete`
                                                                                    }
                                                                                </button>
                                                                                <button className="post-commentDeleteCommentBtn"
                                                                                        onClick={() => commentDeleteToggle(index)}
                                                                                        style={{"color": "var(--primary-bg-05)", "border": "solid 1px var(--primary-bg-05)"}}
                                                                                    >
                                                                                    Cancel
                                                                                </button>
                                                                            </>
                                                                        }
                                                                    </div>
                                                                </div> : null
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        } else if(desc.type === "comment" && desc.value.index === 2) {
                                            let commentMedia = [
                                                ...desc.value.photos,
                                                ...desc.value.videos
                                            ];

                                            return <div className="post-commentSecondary" key={`comment-data-${index}`} style={desc.display ? {} : {"display": "none"}}>
                                                <div className="post-commentBodyLineUpContainer">
                                                    {desc["l0"] ?
                                                        <div className="post-commentBodyLineUp"/> : null
                                                    }
                                                </div>
                                                <div className="post-commentBodyLineUpContainer">
                                                    {desc["l1"] ?
                                                        <div className="post-commentBodyLineUp"/> : null
                                                    }
                                                </div>
                                                <div className="post-commentTertiaryContainer">
                                                    <div className="post-commentHeader">
                                                        <div className="post-commentSecondaryLineConnector"></div>
                                                        {`${desc.value.username}`.toLowerCase() === "[deleted]" ?
                                                            <div className="post-headerProfileImageCommentDeleted">
                                                                {`[ - ]`}
                                                            </div> :
                                                            <>
                                                                {desc.value.profileImage === "" ? 
                                                                    <div className="post-headerProfileImageNone"
                                                                            style={generalOpx.profilePictureGradients[index % 5]}
                                                                        >
                                                                        <img src="/assets/Favicon.png" alt="" className="large-homePageHeaderProfileImgNonUser" />
                                                                        <Tsunami className="post-headerProfileImageNoneIcon"/>
                                                                    </div> : 
                                                                    <img src={desc.value.profileImage} alt="" className="post-headerProfileImage" />
                                                                }
                                                            </>
                                                        }
                                                        <div className="post-headerName">
                                                            {desc.value.username}
                                                            <span className="post-headerTimeAgo">&nbsp;&nbsp;•&nbsp;&nbsp;{format(desc.value.timeStamp * 1000)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="post-commentBody">
                                                        <div className="post-commentBodyLineUpContainer">
                                                            {desc["l2"] ?
                                                                <>
                                                                    <div className="post-commentBodyLineUp"/> 
                                                                    {comments["data"][index + 1] === undefined ||  comments["data"][index + 1] === null ? 
                                                                        null : 
                                                                        <>
                                                                            {comments["data"][index + 1]["type"] === "expand" 
                                                                                || (comments["data"][index + 1]["type"] === "comment" && comments["data"][index + 1]["value"]["index"] <= 2) ?
                                                                                null :
                                                                                <button className="post-commentBodyLineUpBtn"
                                                                                        onClick={comments["data"][index + 1]["display"] ?
                                                                                            () => commentBlockDisplayToggle(index, "hide") : () => commentBlockDisplayToggle(index, "view")
                                                                                        }
                                                                                    > 
                                                                                    {comments["data"][index + 1]["display"] ?
                                                                                        <Remove className="post-commentBodyLineUpBtnIcon"/>:
                                                                                        <Add className="post-commentBodyLineUpBtnIcon"/>
                                                                                    }
                                                                                </button>
                                                                            }
                                                                        </>
                                                                    }
                                                                </> : null
                                                            }
                                                        </div>
                                                        <div className="post-commentBodyCommentContainer">
                                                            <div className="post-commentBodyComment">
                                                                <div 
                                                                    dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(desc.value.comment)}}
                                                                    className="post-bodyTextDescUpgraded"
                                                                />
                                                            </div>
                                                            
                                                            {commentMedia.length === 0 ?
                                                                null : 
                                                                <div className="post-commentBodyMediaContainer">
                                                                    {commentMedia.length === 1 ?
                                                                        <>
                                                                            {commentMedia[0][1] === "photo" ?
                                                                                <button className="comment-mediaOneImgBtn"
                                                                                        onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                    >
                                                                                    <img src={commentMedia[0][0]} alt="" className="comment-mediaOneImg" />
                                                                                </button> : 
                                                                                <div className="comment-mediaVideoOneContainer">
                                                                                    <video className="comment-video" controls>
                                                                                        <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                    </video>
                                                                                </div>
                                                                            }
                                                                        </> : 
                                                                        <>
                                                                            {commentMedia.length === 2 ?
                                                                                <>
                                                                                    {commentMedia[0][1] === "photo" ?
                                                                                        <button className="comment-mediaOneofTwoBtn"
                                                                                                onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                            >
                                                                                            <img src={commentMedia[0][0]} alt="" className="comment-mediaOneofTwoImg" />
                                                                                        </button> : 
                                                                                        <div className="comment-mediaVideoOneofTwoContainer">
                                                                                            <video className="comment-mediaOneofTwoImg" controls>
                                                                                                <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                            </video>
                                                                                            <button className="post-mediaOneofTwoVideoBtn" onClick={() => setupViewCommentMedia(0, commentMedia)}></button>
                                                                                        </div>
                                                                                    }
                                                                                    {commentMedia[1][1] === "photo" ?
                                                                                        <button className="comment-mediaTwoofTwoBtn"
                                                                                                onClick={() => setupViewCommentMedia(1, commentMedia)}
                                                                                            >
                                                                                            <img src={commentMedia[1][0]} alt="" className="comment-mediaTwoofTwoImg" />
                                                                                        </button> : 
                                                                                        <div className="comment-mediaVideoTwoofTwoContainer">
                                                                                            <video className="comment-mediaTwoofTwoImg" controls>
                                                                                                <source src={`${commentMedia[1][0]}#t=0.5`} type="video/mp4"/>
                                                                                            </video>
                                                                                            <button className="post-mediaTwoofTwoVideoBtn" onClick={() => setupViewCommentMedia(1, commentMedia)}></button>
                                                                                        </div>
                                                                                    }
                                                                                </> : 
                                                                                <>
                                                                                    {commentMedia.length === 3 ?
                                                                                        <>
                                                                                            {commentMedia[0][1] === "photo" ?
                                                                                                <button className="comment-mediaOneofThreeBtn"
                                                                                                        onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                                    >
                                                                                                    <img src={commentMedia[0][0]} alt="" className="comment-mediaOneofTwoImg" />
                                                                                                </button> : 
                                                                                                <div className="comment-mediaVideoOneofThreeContainer">
                                                                                                    <video className="comment-mediaOneofTwoImg" controls>
                                                                                                        <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                                    </video>
                                                                                                    <button className="post-mediaOneofTwoVideoBtn" onClick={() => setupViewCommentMedia(0, commentMedia)}></button>
                                                                                                </div>
                                                                                            }
                                                                                            <div className="comment-mediaThreeInnerContainer">
                                                                                                {commentMedia[1][1] === "photo" ?
                                                                                                    <button className="comment-mediaTwoofThreeBtn"
                                                                                                            onClick={() => setupViewCommentMedia(1, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[1][0]} alt="" className="comment-mediaTwoofThreeImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoTwoofThreeContainer">
                                                                                                        <video className="comment-mediaTwoofThreeImg" muted controls playsInline>
                                                                                                            <source src={`${commentMedia[1][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoTwoofThreeBtn" onClick={() => setupViewCommentMedia(1, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                                {commentMedia[2][1] === "photo" ?
                                                                                                    <button className="comment-mediaThreeofThreeBtn"
                                                                                                            onClick={() => setupViewCommentMedia(2, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[2][0]} alt="" className="comment-mediaThreeofThreeImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoThreeofThreeContainer">
                                                                                                        <video className="comment-mediaThreeofThreeImg" muted controls playsInline>
                                                                                                            <source src={`${commentMedia[2][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoThreeofThreeBtn" onClick={() => setupViewCommentMedia(2, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                            </div>
                                                                                        </> : 
                                                                                        <>
                                                                                            <div className="comment-mediaThreeInnerContainer">
                                                                                                {commentMedia[0][1] === "photo" ?
                                                                                                    <button className="comment-mediaOneofFourBtn"
                                                                                                            onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[0][0]} alt="" className="comment-mediaOneofFourImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoOneofFourContainer">
                                                                                                        <video className="comment-mediaOneofFourImg" controls>
                                                                                                            <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoOneofFourBtn" onClick={() => setupViewCommentMedia(0, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                                {commentMedia[1][1] === "photo" ?
                                                                                                    <button className="comment-mediaTwoofFourBtn"
                                                                                                            onClick={() => setupViewCommentMedia(1, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[1][0]} alt="" className="comment-mediaTwoofFourImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoTwoofFourContainer">
                                                                                                        <video className="comment-mediaTwoofFourImg" muted controls playsInline>
                                                                                                            <source src={`${commentMedia[1][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoTwoofFourBtn" onClick={() => setupViewCommentMedia(1, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                            </div>
                                                                                            <div className="comment-mediaThreeInnerContainer">
                                                                                                {commentMedia[2][1] === "photo" ?
                                                                                                    <button className="comment-mediaTwoofThreeBtn"
                                                                                                            onClick={() => setupViewCommentMedia(2, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[2][0]} alt="" className="comment-mediaTwoofThreeImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoTwoofThreeContainer">
                                                                                                        <video className="comment-mediaTwoofThreeImg" muted controls playsInline>
                                                                                                            <source src={`${commentMedia[2][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoTwoofThreeBtn" onClick={() => setupViewCommentMedia(2, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                                {commentMedia[3][1] === "photo" ?
                                                                                                    <button className="comment-mediaThreeofThreeBtn"
                                                                                                            onClick={() => setupViewCommentMedia(3, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[3][0]} alt="" className="comment-mediaThreeofThreeImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoThreeofThreeContainer">
                                                                                                        <video className="comment-mediaThreeofThreeImg" muted controls playsInline>
                                                                                                            <source src={`${commentMedia[3][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoThreeofThreeBtn" onClick={() => setupViewCommentMedia(3, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                            </div>
                                                                                        </>
                                                                                    }
                                                                                </>
                                                                            }
                                                                        </>
                                                                    }
                                                                </div>
                                                            }

                                                            <div className="post-engagementContainer">
                                                                <div className="post-likeDislikeContainer">
                                                                    <button className="post-likeDislikeBtn"
                                                                            onClick={
                                                                                (props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                                () => navigate("/login") : () => engageComment(index, `s_${desc.value._id}`, "like")
                                                                            }
                                                                        >
                                                                        {props.loading ?
                                                                            <TrendingUp className="post-likeDislikeIcon"
                                                                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                            /> :
                                                                            <>
                                                                                {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                                    <TrendingUp className="post-likeDislikeIcon"
                                                                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}    
                                                                                    /> :
                                                                                    <>
                                                                                        {commentsEngagement.some(eng => eng.commentId === `s_${desc.value._id}`) ?
                                                                                            <>
                                                                                                {commentsEngagement.filter(eng => eng.commentId === `s_${desc.value._id}`)[0]["type"] === "like" ?
                                                                                                    <TrendingUp className="post-likedIcon" 
                                                                                                        style={{"stroke": "var(--primary-green-09)", "strokeWidth": "1px"}}    
                                                                                                    /> :
                                                                                                    <TrendingUp className="post-likeDislikeIcon"
                                                                                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                                    />
                                                                                                }
                                                                                            </> : 
                                                                                            <TrendingUp className="post-likeDislikeIcon"
                                                                                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                            />
                                                                                        }
                                                                                    </>
                                                                                }
                                                                            </>
                                                                        }
                                                                    </button>
                                                                    {desc.value.likes - desc.value.dislikes === 0 ?
                                                                        null : 
                                                                        <span className="comment-likeDislikeCounter">
                                                                            {desc.value.likes - desc.value.dislikes > 0 ? "+ " : "-"}
                                                                            {generalOpx.formatLargeFigures(Math.abs(desc.value.likes - desc.value.dislikes), 2)}
                                                                        </span>
                                                                    }
                                                                    <button className="post-likeDislikeBtn"
                                                                            onClick={
                                                                                (props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                                () => navigate("/login") : () => engageComment(index, `s_${desc.value._id}`, "dislike")
                                                                            }
                                                                        >
                                                                        {props.loading ?
                                                                            <TrendingDown className="post-likeDislikeIcon" 
                                                                                style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                            /> :
                                                                            <>
                                                                                {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                                <TrendingDown className="post-likeDislikeIcon"
                                                                                    style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                /> :
                                                                                    <>
                                                                                        {commentsEngagement.some(eng => eng.commentId === `s_${desc.value._id}`) ?
                                                                                            <>
                                                                                                {commentsEngagement.filter(eng => eng.commentId === `s_${desc.value._id}`)[0]["type"] === "dislike" ?
                                                                                                    <TrendingDown className="post-dislikedIcon" 
                                                                                                        style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-red-09)", "strokeWidth": "1px"}}
                                                                                                    /> :
                                                                                                    <TrendingDown className="post-likeDislikeIcon"
                                                                                                        style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                                    />
                                                                                                }
                                                                                            </> : 
                                                                                            <TrendingDown className="post-likeDislikeIcon" 
                                                                                                style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                            />
                                                                                        }
                                                                                    </>
                                                                                }
                                                                            </>
                                                                        }
                                                                    </button>
                                                                </div>
                                                                <div className="post-additionalEngagementOptionsContainer">
                                                                    <button className="post-additionalEngagementOptionsDesc" onClick={() => commentDisplayToggle(index)}>
                                                                        <Comment className="post-additionalEngagementOptionsDescIcon"/>
                                                                    </button>
                                                                    {props.user === desc.value.username ?
                                                                        <button className="post-additionalEngagementOptionsDesc" 
                                                                                style={{"marginLeft": "20px"}}
                                                                                onClick={() => commentDeleteToggle(index)}
                                                                            >
                                                                            <DeleteSharp className="post-additionalEngagementOptionsDescIcon"/>
                                                                        </button> : null
                                                                    }
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="post-commentAddYourCommentContainer"
                                                                    style={desc.commentDisplay ? {"display": "flex"} : {"display": "none"}}
                                                                >
                                                                <FinulabComment type={"secondary"} commFor={"prediction"}
                                                                    location={props.pred_location}
                                                                    desc={
                                                                        {
                                                                            "predictionId": props.predictionDesc._id, 
                                                                            "predType": Object.keys(props.predictionDesc).includes("outcomesMap") ? "categorical" : "y-n",
                                                                            "groupId": props.predictionDesc.groupId, 
                                                                            "index": index, 
                                                                            "mainCommentId": desc.value.index === 0 ? desc.value._id : desc.value.mainCommentId, 
                                                                            "commentId": desc.value.index === 3 ? desc.value.commentId : desc.value._id,
                                                                            "commentIndex": desc.value.index === 3 ? 3 : desc.value.index + 1
                                                                        }
                                                                    }
                                                                />
                                                            </div>

                                                            {desc.deleteDisplay ?
                                                                <div className="post-makeCommentNoticeContainer">
                                                                    <div className="post-makeCommentNoticeHeader">Are you sure you want to delete comment?</div>
                                                                    <div className="post-makeCommentNoticeBodyOptnsContainer">
                                                                        {desc.deleteStatus === 2 ?
                                                                            <div className="post-makeCommentAnErrorOccuredNotice">An error occured, please try again later.</div> :
                                                                            <>
                                                                                <button className="post-commentDeleteCommentBtn" onClick={() => commentDelete(index)}>
                                                                                    {desc.deleteStatus === 1 ?
                                                                                        <BeatLoader 
                                                                                            color='#f6be76'
                                                                                            loading={true}
                                                                                            size={5}
                                                                                        /> : `Delete`
                                                                                    }
                                                                                </button>
                                                                                <button className="post-commentDeleteCommentBtn"
                                                                                        onClick={() => commentDeleteToggle(index)}
                                                                                        style={{"color": "var(--primary-bg-05)", "border": "solid 1px var(--primary-bg-05)"}}
                                                                                    >
                                                                                    Cancel
                                                                                </button>
                                                                            </>
                                                                        }
                                                                    </div>
                                                                </div> : null
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        } else if(desc.type === "comment" && desc.value.index === 3) {
                                            let commentMedia = [
                                                ...desc.value.photos,
                                                ...desc.value.videos
                                            ];

                                            return <div className="post-commentSecondary" key={`comment-data-${index}`} style={desc.display ? {} : {"display": "none"}}>
                                                <div className="post-commentBodyLineUpContainer">
                                                    {desc["l0"] ?
                                                        <div className="post-commentBodyLineUp"/> : null
                                                    }
                                                </div>
                                                <div className="post-commentBodyLineUpContainer">
                                                    {desc["l1"] ?
                                                        <div className="post-commentBodyLineUp"/> : null
                                                    }
                                                </div>
                                                <div className="post-commentBodyLineUpContainer">
                                                    {desc["l2"] ?
                                                        <div className="post-commentBodyLineUp"/> : null
                                                    }
                                                </div>
                                                <div className="post-commentQuaternaryContainer">
                                                    <div className="post-commentHeader">
                                                        <div className="post-commentSecondaryLineConnector"></div>
                                                        {`${desc.value.username}`.toLowerCase() === "[deleted]" ?
                                                            <div className="post-headerProfileImageCommentDeleted">
                                                                {`[ - ]`}
                                                            </div> :
                                                            <>
                                                                {desc.value.profileImage === "" ? 
                                                                    <div className="post-headerProfileImageNone"
                                                                            style={generalOpx.profilePictureGradients[index % 5]}
                                                                        >
                                                                        <img src="/assets/Favicon.png" alt="" className="large-homePageHeaderProfileImgNonUser" />
                                                                        <Tsunami className="post-headerProfileImageNoneIcon"/>
                                                                    </div> : 
                                                                    <img src={desc.value.profileImage} alt="" className="post-headerProfileImage" />
                                                                }
                                                            </>
                                                        }
                                                        <div className="post-headerName">
                                                            {desc.value.username}
                                                            <span className="post-headerTimeAgo">&nbsp;&nbsp;•&nbsp;&nbsp;{format(desc.value.timeStamp * 1000)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="post-commentBody">
                                                        <div className="post-commentBodyLineUpContainer"></div>
                                                        <div className="post-commentBodyCommentContainer">
                                                            <div className="post-commentBodyComment">
                                                                <div 
                                                                    dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(desc.value.comment)}}
                                                                    className="post-bodyTextDescUpgraded"
                                                                />
                                                            </div>

                                                            {commentMedia.length === 0 ?
                                                                null : 
                                                                <div className="post-commentBodyMediaContainer">
                                                                    {commentMedia.length === 1 ?
                                                                        <>
                                                                            {commentMedia[0][1] === "photo" ?
                                                                                <button className="comment-mediaOneImgBtn"
                                                                                        onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                    >
                                                                                    <img src={commentMedia[0][0]} alt="" className="comment-mediaOneImg" />
                                                                                </button> : 
                                                                                <div className="comment-mediaVideoOneContainer">
                                                                                    <video className="comment-video" controls>
                                                                                        <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                    </video>
                                                                                </div>
                                                                            }
                                                                        </> : 
                                                                        <>
                                                                            {commentMedia.length === 2 ?
                                                                                <>
                                                                                    {commentMedia[0][1] === "photo" ?
                                                                                        <button className="comment-mediaOneofTwoBtn"
                                                                                                onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                            >
                                                                                            <img src={commentMedia[0][0]} alt="" className="comment-mediaOneofTwoImg" />
                                                                                        </button> : 
                                                                                        <div className="comment-mediaVideoOneofTwoContainer">
                                                                                            <video className="comment-mediaOneofTwoImg" controls>
                                                                                                <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                            </video>
                                                                                            <button className="post-mediaOneofTwoVideoBtn" onClick={() => setupViewCommentMedia(0, commentMedia)}></button>
                                                                                        </div>
                                                                                    }
                                                                                    {commentMedia[1][1] === "photo" ?
                                                                                        <button className="comment-mediaTwoofTwoBtn"
                                                                                                onClick={() => setupViewCommentMedia(1, commentMedia)}
                                                                                            >
                                                                                            <img src={commentMedia[1][0]} alt="" className="comment-mediaTwoofTwoImg" />
                                                                                        </button> : 
                                                                                        <div className="comment-mediaVideoTwoofTwoContainer">
                                                                                            <video className="comment-mediaTwoofTwoImg" controls>
                                                                                                <source src={`${commentMedia[1][0]}#t=0.5`} type="video/mp4"/>
                                                                                            </video>
                                                                                            <button className="post-mediaTwoofTwoVideoBtn" onClick={() => setupViewCommentMedia(1, commentMedia)}></button>
                                                                                        </div>
                                                                                    }
                                                                                </> : 
                                                                                <>
                                                                                    {commentMedia.length === 3 ?
                                                                                        <>
                                                                                            {commentMedia[0][1] === "photo" ?
                                                                                                <button className="comment-mediaOneofThreeBtn"
                                                                                                        onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                                    >
                                                                                                    <img src={commentMedia[0][0]} alt="" className="comment-mediaOneofTwoImg" />
                                                                                                </button> : 
                                                                                                <div className="comment-mediaVideoOneofThreeContainer">
                                                                                                    <video className="comment-mediaOneofTwoImg" controls>
                                                                                                        <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                                    </video>
                                                                                                    <button className="post-mediaOneofTwoVideoBtn" onClick={() => setupViewCommentMedia(0, commentMedia)}></button>
                                                                                                </div>
                                                                                            }
                                                                                            <div className="comment-mediaThreeInnerContainer">
                                                                                                {commentMedia[1][1] === "photo" ?
                                                                                                    <button className="comment-mediaTwoofThreeBtn"
                                                                                                            onClick={() => setupViewCommentMedia(1, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[1][0]} alt="" className="comment-mediaTwoofThreeImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoTwoofThreeContainer">
                                                                                                        <video className="comment-mediaTwoofThreeImg" muted controls playsInline>
                                                                                                            <source src={`${commentMedia[1][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoTwoofThreeBtn" onClick={() => setupViewCommentMedia(1, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                                {commentMedia[2][1] === "photo" ?
                                                                                                    <button className="comment-mediaThreeofThreeBtn"
                                                                                                            onClick={() => setupViewCommentMedia(2, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[2][0]} alt="" className="comment-mediaThreeofThreeImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoThreeofThreeContainer">
                                                                                                        <video className="comment-mediaThreeofThreeImg" muted controls playsInline>
                                                                                                            <source src={`${commentMedia[2][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoThreeofThreeBtn" onClick={() => setupViewCommentMedia(2, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                            </div>
                                                                                        </> : 
                                                                                        <>
                                                                                            <div className="comment-mediaThreeInnerContainer">
                                                                                                {commentMedia[0][1] === "photo" ?
                                                                                                    <button className="comment-mediaOneofFourBtn"
                                                                                                            onClick={() => setupViewCommentMedia(0, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[0][0]} alt="" className="comment-mediaOneofFourImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoOneofFourContainer">
                                                                                                        <video className="comment-mediaOneofFourImg" controls>
                                                                                                            <source src={`${commentMedia[0][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoOneofFourBtn" onClick={() => setupViewCommentMedia(0, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                                {commentMedia[1][1] === "photo" ?
                                                                                                    <button className="comment-mediaTwoofFourBtn"
                                                                                                            onClick={() => setupViewCommentMedia(1, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[1][0]} alt="" className="comment-mediaTwoofFourImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoTwoofFourContainer">
                                                                                                        <video className="comment-mediaTwoofFourImg" muted controls playsInline>
                                                                                                            <source src={`${commentMedia[1][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoTwoofFourBtn" onClick={() => setupViewCommentMedia(1, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                            </div>
                                                                                            <div className="comment-mediaThreeInnerContainer">
                                                                                                {commentMedia[2][1] === "photo" ?
                                                                                                    <button className="comment-mediaTwoofThreeBtn"
                                                                                                            onClick={() => setupViewCommentMedia(2, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[2][0]} alt="" className="comment-mediaTwoofThreeImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoTwoofThreeContainer">
                                                                                                        <video className="comment-mediaTwoofThreeImg" muted controls playsInline>
                                                                                                            <source src={`${commentMedia[2][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoTwoofThreeBtn" onClick={() => setupViewCommentMedia(2, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                                {commentMedia[3][1] === "photo" ?
                                                                                                    <button className="comment-mediaThreeofThreeBtn"
                                                                                                            onClick={() => setupViewCommentMedia(3, commentMedia)}
                                                                                                        >
                                                                                                        <img src={commentMedia[3][0]} alt="" className="comment-mediaThreeofThreeImg" />
                                                                                                    </button> : 
                                                                                                    <div className="comment-mediaVideoThreeofThreeContainer">
                                                                                                        <video className="comment-mediaThreeofThreeImg" muted controls playsInline>
                                                                                                            <source src={`${commentMedia[3][0]}#t=0.5`} type="video/mp4"/>
                                                                                                        </video>
                                                                                                        <button className="post-mediaVideoThreeofThreeBtn" onClick={() => setupViewCommentMedia(3, commentMedia)}></button>
                                                                                                    </div>
                                                                                                }
                                                                                            </div>
                                                                                        </>
                                                                                    }
                                                                                </>
                                                                            }
                                                                        </>
                                                                    }
                                                                </div>
                                                            }
                    
                                                            <div className="post-engagementContainer">
                                                                <div className="post-likeDislikeContainer">
                                                                    <button className="post-likeDislikeBtn"
                                                                            onClick={
                                                                                (props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                                () => navigate("/login") : () => engageComment(index, `s_${desc.value._id}`, "like")
                                                                            }
                                                                        >
                                                                        {props.loading ?
                                                                            <TrendingUp className="post-likeDislikeIcon"
                                                                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                            /> :
                                                                            <>
                                                                                {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                                    <TrendingUp className="post-likeDislikeIcon"
                                                                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}    
                                                                                    /> :
                                                                                    <>
                                                                                        {commentsEngagement.some(eng => eng.commentId === `s_${desc.value._id}`) ?
                                                                                            <>
                                                                                                {commentsEngagement.filter(eng => eng.commentId === `s_${desc.value._id}`)[0]["type"] === "like" ?
                                                                                                    <TrendingUp className="post-likedIcon" 
                                                                                                        style={{"stroke": "var(--primary-green-09)", "strokeWidth": "1px"}}    
                                                                                                    /> :
                                                                                                    <TrendingUp className="post-likeDislikeIcon"
                                                                                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                                    />
                                                                                                }
                                                                                            </> : 
                                                                                            <TrendingUp className="post-likeDislikeIcon"
                                                                                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                            />
                                                                                        }
                                                                                    </>
                                                                                }
                                                                            </>
                                                                        }
                                                                    </button>
                                                                    {desc.value.likes - desc.value.dislikes === 0 ?
                                                                        null : 
                                                                        <span className="comment-likeDislikeCounter">
                                                                            {desc.value.likes - desc.value.dislikes > 0 ? "+ " : "-"}
                                                                            {generalOpx.formatLargeFigures(Math.abs(desc.value.likes - desc.value.dislikes), 2)}
                                                                        </span>
                                                                    }
                                                                    <button className="post-likeDislikeBtn"
                                                                            onClick={
                                                                                (props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                                () => navigate("/login") : () => engageComment(index, `s_${desc.value._id}`, "dislike")
                                                                            }
                                                                        >
                                                                        {props.loading ?
                                                                            <TrendingDown className="post-likeDislikeIcon" 
                                                                                style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                            /> :
                                                                            <>
                                                                                {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                                                                <TrendingDown className="post-likeDislikeIcon"
                                                                                    style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                /> :
                                                                                    <>
                                                                                        {commentsEngagement.some(eng => eng.commentId === `s_${desc.value._id}`) ?
                                                                                            <>
                                                                                                {commentsEngagement.filter(eng => eng.commentId === `s_${desc.value._id}`)[0]["type"] === "dislike" ?
                                                                                                    <TrendingDown className="post-dislikedIcon" 
                                                                                                        style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-red-09)", "strokeWidth": "1px"}}
                                                                                                    /> :
                                                                                                    <TrendingDown className="post-likeDislikeIcon"
                                                                                                        style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                                    />
                                                                                                }
                                                                                            </> : 
                                                                                            <TrendingDown className="post-likeDislikeIcon" 
                                                                                                style={{"transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                                                            />
                                                                                        }
                                                                                    </>
                                                                                }
                                                                            </>
                                                                        }
                                                                    </button>
                                                                </div>
                                                                <div className="post-additionalEngagementOptionsContainer">
                                                                    <button className="post-additionalEngagementOptionsDesc" onClick={() => commentDisplayToggle(index)}>
                                                                        <Comment className="post-additionalEngagementOptionsDescIcon"/>
                                                                    </button>
                                                                    {props.user === desc.value.username ?
                                                                        <button className="post-additionalEngagementOptionsDesc" 
                                                                                style={{"marginLeft": "20px"}}
                                                                                onClick={() => commentDeleteToggle(index)}
                                                                            >
                                                                            <DeleteSharp className="post-additionalEngagementOptionsDescIcon"/>
                                                                        </button> : null
                                                                    }
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="post-commentAddYourCommentContainer"
                                                                    style={desc.commentDisplay ? {"display": "flex"} : {"display": "none"}}
                                                                >
                                                                <FinulabComment type={"secondary"} commFor={"prediction"}
                                                                    location={props.pred_location}
                                                                    desc={
                                                                        {
                                                                            "predictionId": props.predictionDesc._id, 
                                                                            "predType": Object.keys(props.predictionDesc).includes("outcomesMap") ? "categorical" : "y-n",
                                                                            "groupId": props.predictionDesc.groupId, 
                                                                            "index": index, 
                                                                            "mainCommentId": desc.value.index === 0 ? desc.value._id : desc.value.mainCommentId, 
                                                                            "commentId": desc.value.index === 3 ? desc.value.commentId : desc.value._id,
                                                                            "commentIndex": desc.value.index === 3 ? 3 : desc.value.index + 1
                                                                        }
                                                                    }
                                                                />
                                                            </div>

                                                            {desc.deleteDisplay ?
                                                                <div className="post-makeCommentNoticeContainer">
                                                                    <div className="post-makeCommentNoticeHeader">Are you sure you want to delete comment?</div>
                                                                    <div className="post-makeCommentNoticeBodyOptnsContainer">
                                                                        {desc.deleteStatus === 2 ?
                                                                            <div className="post-makeCommentAnErrorOccuredNotice">An error occured, please try again later.</div> :
                                                                            <>
                                                                                <button className="post-commentDeleteCommentBtn" onClick={() => commentDelete(index)}>
                                                                                    {desc.deleteStatus === 1 ?
                                                                                        <BeatLoader 
                                                                                            color='#f6be76'
                                                                                            loading={true}
                                                                                            size={5}
                                                                                        /> : `Delete`
                                                                                    }
                                                                                </button>
                                                                                <button className="post-commentDeleteCommentBtn"
                                                                                        onClick={() => commentDeleteToggle(index)}
                                                                                        style={{"color": "var(--primary-bg-05)", "border": "solid 1px var(--primary-bg-05)"}}
                                                                                    >
                                                                                    Cancel
                                                                                </button>
                                                                            </>
                                                                        }
                                                                    </div>
                                                                </div> : null
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        } else if(desc.type === "expand" && desc.index === 1) {
                                            const faderDisplayObj = comments["commentExpandLoading"].find(desc_obj => Object.keys(desc_obj)[0] === `${index}`);
                                            return <div className="post-commentSecondary" key={`comment-expand-${index}`} style={desc.display ? {} : {"display": "none"}}>
                                                <div className="post-commentBodyLineUpContainer">
                                                    <div className="post-commentBodyLineUpMoreReplies"/>
                                                </div>
                                                <div className="post-commentSecondaryContainer">
                                                    <div className="post-commentHeader" style={{"marginTop": "10px"}}>
                                                        <div className="post-commentSecondaryLineMoreRepliesConnector"></div>
                                                        <button className="post-commentBodyLineUpConnectorBtn"
                                                                onClick={() => specificCommentExpand(index)}
                                                                disabled={faderDisplayObj === undefined || faderDisplayObj === null ? false : faderDisplayObj[`${index}`] ? true : false}
                                                            > 
                                                            <div className="post-commentBodyLineUpConnectorBtnIconContainer">
                                                                {faderDisplayObj === undefined || faderDisplayObj === null ?
                                                                    <Add className="post-commentBodyLineUpBtnIcon"/> : 
                                                                    <>
                                                                        {faderDisplayObj[`${index}`] ?
                                                                            <FadeLoader
                                                                                color={"#9E9E9E"}
                                                                                loading={true}
                                                                                height={5}
                                                                                margin={-12}
                                                                                cssOverride={override}
                                                                                width={2}
                                                                                radius={"4px"}
                                                                            /> : 
                                                                            <Add className="post-commentBodyLineUpBtnIcon"/>
                                                                        }
                                                                    </>
                                                                }
                                                            </div>
                                                            {generalOpx.formatLargeFigures(desc.value, 2)}+ more replies
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        } else if(desc.type === "expand" && desc.index === 2) {
                                            const faderDisplayObj = comments["commentExpandLoading"].find(desc_obj => Object.keys(desc_obj)[0] === `${index}`);
                                            return <div className="post-commentSecondary" key={`comment-expand-${index}`} style={desc.display ? {} : {"display": "none"}}>
                                                <div className="post-commentBodyLineUpContainer">
                                                    {desc["l0"] ?
                                                        <div className="post-commentBodyLineUp"/> : null
                                                    }
                                                </div>
                                                <div className="post-commentBodyLineUpContainer">
                                                    <div className="post-commentBodyLineUpMoreReplies"/>
                                                </div>
                                                <div className="post-commentTertiaryContainer">
                                                    <div className="post-commentHeader" style={{"marginTop": "10px"}}>
                                                        <div className="post-commentSecondaryLineMoreRepliesConnector"></div>
                                                        <button className="post-commentBodyLineUpConnectorBtn"
                                                                onClick={() => specificCommentExpand(index)}
                                                                disabled={faderDisplayObj === undefined || faderDisplayObj === null ? false : faderDisplayObj[`${index}`] ? true : false}
                                                            > 
                                                            <div className="post-commentBodyLineUpConnectorBtnIconContainer">
                                                                {faderDisplayObj === undefined || faderDisplayObj === null ?
                                                                    <Add className="post-commentBodyLineUpBtnIcon"/> : 
                                                                    <>
                                                                        {faderDisplayObj[`${index}`] ?
                                                                            <FadeLoader
                                                                                color={"#9E9E9E"}
                                                                                loading={true}
                                                                                height={5}
                                                                                margin={-12}
                                                                                cssOverride={override}
                                                                                width={2}
                                                                                radius={"4px"}
                                                                            /> : 
                                                                            <Add className="post-commentBodyLineUpBtnIcon"/>
                                                                        }
                                                                    </>
                                                                }
                                                            </div>
                                                            {generalOpx.formatLargeFigures(desc.value, 2)}+ more replies
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        } else if(desc.type === "expand" && desc.index === 3) {
                                            const faderDisplayObj = comments["commentExpandLoading"].find(desc_obj => Object.keys(desc_obj)[0] === `${index}`);
                                            return <div className="post-commentSecondary" key={`comment-expand-${index}`} style={desc.display ? {} : {"display": "none"}}>
                                                <div className="post-commentBodyLineUpContainer">
                                                    {desc["l0"] ?
                                                        <div className="post-commentBodyLineUp"/> : null
                                                    }
                                                </div>
                                                <div className="post-commentBodyLineUpContainer">
                                                    {desc["l1"] ?
                                                        <div className="post-commentBodyLineUp"/> : null
                                                    }
                                                </div>
                                                <div className="post-commentBodyLineUpContainer">
                                                    <div className="post-commentBodyLineUpMoreReplies"/>
                                                </div>
                                                <div className="post-commentQuaternaryContainer">
                                                    <div className="post-commentHeader" style={{"marginTop": "10px"}}>
                                                        <div className="post-commentSecondaryLineMoreRepliesConnector"></div>
                                                        <button className="post-commentBodyLineUpConnectorBtn"
                                                                onClick={() => specificCommentExpand(index)}
                                                                disabled={faderDisplayObj === undefined || faderDisplayObj === null ? false : faderDisplayObj[`${index}`] ? true : false}
                                                            > 
                                                            <div className="post-commentBodyLineUpConnectorBtnIconContainer">
                                                                {faderDisplayObj === undefined || faderDisplayObj === null ?
                                                                    <Add className="post-commentBodyLineUpBtnIcon"/> : 
                                                                    <>
                                                                        {faderDisplayObj[`${index}`] ?
                                                                            <FadeLoader
                                                                                color={"#9E9E9E"}
                                                                                loading={true}
                                                                                height={5}
                                                                                margin={-12}
                                                                                cssOverride={override}
                                                                                width={2}
                                                                                radius={"4px"}
                                                                            /> : 
                                                                            <Add className="post-commentBodyLineUpBtnIcon"/>
                                                                        }
                                                                    </>
                                                                }
                                                            </div>
                                                            {generalOpx.formatLargeFigures(desc.value, 2)}+ more replies
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                    })
                                }
                                {comments["dataCount"] > comments["viewCount"] && comments["viewCount"] !== 0 ?
                                    <button className="post-commentViewMoreCommentsBtn"
                                            onClick={() => viewMoreComments()}
                                            disabled={viewMoreCommentsLoading}
                                        >
                                        <div className="post-commentViewMoreCommentsBtnBox">
                                            {viewMoreCommentsLoading ?
                                                <FadeLoader
                                                    color={"#9E9E9E"}
                                                    loading={true}
                                                    height={5}
                                                    margin={-12}
                                                    cssOverride={overrideV2}
                                                    width={2}
                                                    radius={"4px"}
                                                /> :
                                                <ExpandMore className="post-commentViewMoreCommentsBtnIcon"/>
                                            }
                                        </div>
                                        View More Comments
                                    </button> : null
                                }
                            </>
                        }
                    </div> : null
                }
            </div>
        </div>
    )
}