import './news.css';
import '../post/index.css';
import '../prediction/prediction.css';
import '../miniaturized/news/mini-news.css';

import DOMPurify from 'dompurify';
import {format} from 'timeago.js';
import {useState, useEffect, useMemo} from 'react';
import FadeLoader from 'react-spinners/FadeLoader';
import BeatLoader from 'react-spinners/BeatLoader';
import {useDispatch, useSelector} from 'react-redux';
import {ThumbUpOffAlt, ThumbDownOffAlt, Cached, Comment, ContentCopy, ThumbDown, ThumbUp, Tsunami, Remove, Add, TrendingUp, TrendingDown, DeleteSharp, ExpandMore} from '@mui/icons-material';

import FinulabComment from '../comment/comment';
import generalOpx from '../../functions/generalFunctions';

import {setViewMedia} from '../../reduxStore/viewMedia';
import {updateStockNews, selectStockNews} from '../../reduxStore/stockNews';
import {setStockPageSelection, selectStockPageSelection} from '../../reduxStore/stockPageSelection';
import {setComments, clearComments, updateComments, selectComments} from '../../reduxStore/comments';
import {updateStockDashboardNews, selectStockDashboardNews} from '../../reduxStore/stockDashboardNews';
import {addToNewsEngagement, removeFromNewsEngagement, selectNewsEngagement} from '../../reduxStore/newsEngagement';
import {setStockDashboardMarketsSelected, selectStockDashboardMarkets} from '../../reduxStore/stockDashboardMarkets';
import {addToCommentsEngagement, removeFromCommentsEngagement, setCommentsEngagement, clearCommentsEngagement, selectCommentsEngagement} from '../../reduxStore/commentsEngagement';

const chunkArray = (arr, size) => {
    let chunkedArray = [];
    for(let i = 0; i < arr.length; i += size) {
        chunkedArray.push(arr.slice(i, i + size));
    }

    return chunkedArray
}

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

export default function News(props) {
    const dispatch = useDispatch();

    const u_engagement = useSelector(selectNewsEngagement);
    const commentsEngagement = useSelector(selectCommentsEngagement);

    const comments = useSelector(selectComments);
    const stockNews = useSelector(selectStockNews);
    const dashboardNews = useSelector(selectStockDashboardNews);
    const stockSelection = useSelector(selectStockPageSelection);
    const dashboardSelection = useSelector(selectStockDashboardMarkets);

    const [repostCount, setRepostCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);
    const [engagementRatio, setEngagementRatio] = useState([0, 0]);
    useEffect(() => {
        if(!props.loading) {
            if(!(props.desc === undefined || props.desc === null)) {
                setRepostCount(props.desc.shares);
                setCommentCount(props.desc.comments);
                setEngagementRatio([props.desc.likes, props.desc.dislikes]);
            }
        }
    }, [props]);

    const engageNews = async (type) => {
        let engagementRatioFunction = [...engagementRatio];
        if(u_engagement.some(eng => eng.newsId === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`)) {
            const prevEngagement = u_engagement.filter(eng => eng.newsId === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`)[0]["type"];
            if(prevEngagement === type) {
                dispatch(
                    removeFromNewsEngagement(`${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`)
                );

                if(type === "like") {
                    engagementRatioFunction[0] = engagementRatioFunction[0] - 1;
                } else if(type === "dislike") {
                    engagementRatioFunction[1] = engagementRatioFunction[1] - 1;
                }
            } else {
                dispatch(
                    removeFromNewsEngagement(`${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`)
                );
                dispatch(
                    addToNewsEngagement([{"newsId": `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`, "type": type}])
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
                addToNewsEngagement([{"newsId": `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`, "type": type}])
            );

            if(type === "like") {
                engagementRatioFunction[0] = engagementRatioFunction[0] + 1;
            } else if(type === "dislike") {
                engagementRatioFunction[1] = engagementRatioFunction[1] + 1;
            }
        }

        if(props.type === "stock_dashboardPage" || props.type === "stockPage") {
            let newsStockPage = [...stockNews["news"]["data"].flatMap(arr => arr.map(obj => obj))], 
                newsDashboard = [...dashboardNews["news"]["data"].flatMap(arr => arr.map(obj => obj))];

            if(newsStockPage.length > 0) {
                if(newsStockPage.some(nws => `${props.pred_ticker.slice(0, 1)}:-${nws._id}` === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`)) {
                    let newsCopy = {...newsStockPage.filter(nws => `${props.pred_ticker.slice(0, 1)}:-${nws._id}` === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`)[0]};
                    newsCopy["likes"] = engagementRatioFunction[0];
                    newsCopy["dislikes"] = engagementRatioFunction[1];

                    const copyIndex = newsStockPage.findIndex(nws => `${props.pred_ticker.slice(0, 1)}:-${nws._id}` === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`);
                    newsStockPage[copyIndex] = newsCopy;

                    dispatch(
                        updateStockNews(
                            {
                                "data": chunkArray(newsStockPage, 4), "dataLoading": stockNews["news"]["dataLoading"]
                            }
                        )
                    );
                }
            }

            if(newsDashboard.length > 0) {
                if(newsDashboard.some(nws => `${props.pred_ticker.slice(0, 1)}:-${nws._id}` === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`)) {
                    let newsCopy = {...newsDashboard.filter(nws => `${props.pred_ticker.slice(0, 1)}:-${nws._id}` === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`)[0]};
                    newsCopy["likes"] = engagementRatioFunction[0];
                    newsCopy["dislikes"] = engagementRatioFunction[1];

                    const copyIndex = newsDashboard.findIndex(nws => `${props.pred_ticker.slice(0, 1)}:-${nws._id}` === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`);
                    newsDashboard[copyIndex] = newsCopy;

                    dispatch(
                        updateStockDashboardNews(
                            {
                                "data": chunkArray(newsDashboard, 4), "dataLoading": dashboardNews["news"]["dataLoading"]
                            }
                        )
                    );
                }
            }

            if(stockSelection["selection"]["type"] === "News") {
                if(`${props.pred_ticker.slice(0, 1)}:-${stockSelection["selection"]["selectedDesc"]["desc"]["_id"]}` === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`) {
                    let selectionCopy = {...stockSelection["selection"]["selectedDesc"]["desc"]};
                    selectionCopy["likes"] = engagementRatioFunction[0];
                    selectionCopy["dislikes"] = engagementRatioFunction[1];

                    dispatch(
                        setStockPageSelection(
                            {
                                "type": "News",
                                "selectedDesc": {
                                    "desc": selectionCopy
                                }
                            }
                        )
                    );
                }
            }

            if(dashboardSelection["selected"]["type"] === "News") {
                if(`${props.pred_ticker.slice(0, 1)}:-${dashboardSelection["selected"]["selectedDesc"]["desc"]["_id"]}` === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`) {
                    let selectionCopy = {...dashboardSelection["selected"]["selectedDesc"]["desc"]};
                    selectionCopy["likes"] = engagementRatioFunction[0];
                    selectionCopy["dislikes"] = engagementRatioFunction[1];

                    dispatch(
                        setStockDashboardMarketsSelected(
                            {
                                "type": "News",
                                "scrollTop": dashboardSelection["selected"]["scrollTop"],
                                "selectedDesc": {
                                    "desc": selectionCopy
                                }
                            }
                        )
                    );
                }
            }
        }

        await generalOpx.axiosInstance.post(`/content/news/news-engage`, {"type": type, "newsId": `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`});
    }

    useMemo(() => {
        const setUpComments = async () => {
            dispatch(
                clearComments()
            );
            dispatch(
                clearCommentsEngagement()
            );

            await generalOpx.axiosInstance.put(`/content/news/comments`, 
                {
                    "newsId": `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`,
                    "comments": props.desc.comments
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
                        ];
                        const commentEngagements_req = await generalOpx.axiosInstance.put(`/content/news/comments-engagements`, {commentIds: engagementCommentIds});
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
                                    "_id": `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`,
                                    "type": "news",
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

        if(!(props.desc === undefined || props.desc === null)) {
            if(comments["type"] !== "news" || comments["_id"] !== `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}` || comments["dataLoading"] === true) {
                if(props.desc.comments > 0) {
                    setUpComments();
                } else {
                    dispatch(
                        clearCommentsEngagement()
                    );
                    dispatch(
                        setComments(
                            {
                                "_id": `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`,
                                "type": "news",
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
                        "_id": `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`,
                        "type": "news",
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

        await generalOpx.axiosInstance.put(`/content/news/comments-expand`, 
            {
                "newsId": `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`,
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
                    const commentEngagements_req = await generalOpx.axiosInstance.put(`/content/news/comments-engagements`, {commentIds: engagementCommentIds});
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

            await generalOpx.axiosInstance.put(`/content/news/comments-specific-expand`, 
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
                        ];
                        const commentEngagements_req = await generalOpx.axiosInstance.put(`/content/news/comments-engagements`, {commentIds: engagementCommentIds});
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

        await generalOpx.axiosInstance.post(`/content/news/comments-engage`, {"type": type, "commentId": commentId});
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

        await generalOpx.axiosInstance.post(`/content/news/delete-comment`,
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

    return(
        <div className="news-wrapper" style={{"borderBottom": "0px"}}>
            {props.loading ?
                <div className="large-stocksNewsInnerSegementPreTitleLoading"/> : 
                <div className="large-stocksNewsInnerSegementPreTitle">{props.desc["source"]}&nbsp;&nbsp;•&nbsp;&nbsp;{format(props.desc["timeStamp"] * 1000)}</div>
            }
            {props.loading ?
                <div className="prediction-titleDescLoading"/> :
                <div className="post-titleContainer" style={{"marginTop": "0px"}}>{props.desc["title"]}</div>
            }
            <div className="news-imgDescriptionContainer">
                <img src={props.desc["imageUrl"]} 
                    alt="" 
                    onError={(e) => 
                        {
                            e.target.src="/assets/Finulab_HighRes.jpg";
                            e.target.className="miniaturizedNews-ErrorImg"
                        }
                    }
                    className="news-img"
                />
                {props.loading ?
                    <div className="news-descriptionContainerLoading">
                        <div className="news-descriptionLoading" style={{"marginBottom": "3px"}}/>
                        <div className="news-descriptionLoading" style={{"marginBottom": "3px"}}/>
                        <div className="news-descriptionSlicedLoading"/>
                    </div> : 
                    <div className="news-descriptionContainer">
                        <div className="news-description">
                            {props.desc["summary"]}
                        </div>
                    </div>
                }
            </div>
            <div className="post-engagementContainer" style={{"marginTop": "15px"}}>
                <div className="post-likeDislikeContainer">
                    <button className="post-likeDislikeBtn"
                            onClick={
                                (props.user === undefined || props.user === null || props.user === "visitor") ?
                                () => navigate("/login") : () => engageNews("like")
                            }
                        >
                        {props.loading ?
                            <ThumbUpOffAlt className="post-likeDislikeIcon"/> :
                            <>
                                {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                    <ThumbUpOffAlt className="post-likeDislikeIcon"/> :
                                    <>
                                        {u_engagement.some(eng => eng.newsId === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`) ?
                                            <>
                                                {u_engagement.filter(eng => eng.newsId === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`)[0]["type"] === "like" ?
                                                    <ThumbUp className="post-likedIcon" /> :
                                                    <ThumbUpOffAlt className="post-likeDislikeIcon"/>
                                                }
                                            </> : <ThumbUpOffAlt className="post-likeDislikeIcon"/>
                                        }
                                    </>
                                }
                            </>
                        }
                    </button>
                    <button className="post-likeDislikeBtn"
                            onClick={
                                (props.user === undefined || props.user === null || props.user === "visitor") ?
                                () => navigate("/login") : () => engageNews("dislike")
                            }
                        >
                        {props.loading ?
                            <ThumbDownOffAlt className="post-likeDislikeIcon"/> :
                            <>
                                {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                   <ThumbDownOffAlt className="post-likeDislikeIcon"/> :
                                    <>
                                        {u_engagement.some(eng => eng.newsId === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`) ?
                                            <>
                                                {u_engagement.filter(eng => eng.newsId === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`)[0]["type"] === "dislike" ?
                                                    <ThumbDown className="post-dislikedIcon" /> :
                                                    <ThumbDownOffAlt className="post-likeDislikeIcon"/>
                                                }
                                            </> : <ThumbDownOffAlt className="post-likeDislikeIcon"/>
                                        }
                                    </>
                                }
                            </>
                        }
                    </button>
                    {props.loading || engagementRatio[0] + engagementRatio[1] === 0 ?
                        null : 
                        <div className="post-likeDislikeDescContainer">
                            <div className="post-likeDislikeDescSection">
                                <span className="post-likeDislikeDescHeaderText">
                                    {engagementRatio[0] === 0 ?
                                        `-` :
                                        `${generalOpx.formatLargeFigures(engagementRatio[0], 2)}`
                                    }
                                </span>
                                <span className="post-likeDislikeDescHeaderText" style={{"marginLeft": "auto"}}>
                                    {engagementRatio[1] === 0 ?
                                        `-` : 
                                        `${generalOpx.formatLargeFigures(engagementRatio[1], 2)}`
                                    }
                                </span>
                            </div>
                            <div className="post-likeDislikeDescSection">
                                {engagementRatio[0] / (engagementRatio[0] + engagementRatio[1]) >= 0.95 ?
                                    <div className="post-likeRatioFull"
                                        style={{
                                            "width": "100%",
                                            "minWidth": "100%",
                                            "maxWidth": "100%"
                                        }}
                                    /> :
                                    <>
                                        {engagementRatio[0] / (engagementRatio[0] + engagementRatio[1]) <= 0.05 ?
                                            <div className="post-dislikeRatioFull"
                                                style={{
                                                    "width": "100%",
                                                    "minWidth": "100%",
                                                    "maxWidth": "100%"
                                                }}
                                            /> : 
                                            <>
                                                <div className="post-likeRatio"
                                                    style={{
                                                        "width": `${(engagementRatio[0] / (engagementRatio[0] + engagementRatio[1])) * 100}%`,
                                                        "minWidth": `${(engagementRatio[0] / (engagementRatio[0] + engagementRatio[1])) * 100}%`,
                                                        "maxWidth": `${(engagementRatio[0] / (engagementRatio[0] + engagementRatio[1])) * 100}%`
                                                    }}
                                                />
                                                <div className="post-dislikeRatio"
                                                    style={{
                                                        "width": `${(engagementRatio[1] / (engagementRatio[0] + engagementRatio[1])) * 100}%`,
                                                        "minWidth": `${(engagementRatio[1] / (engagementRatio[0] + engagementRatio[1])) * 100}%`,
                                                        "maxWidth": `${(engagementRatio[1] / (engagementRatio[0] + engagementRatio[1])) * 100}%`
                                                    }}
                                                />
                                            </>
                                        }
                                    </>
                                }
                            </div>
                        </div>
                    }
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
                    <FinulabComment type={"main"} commFor={"news"} location={props.type} desc={{"newsId": `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`}}/>
                </div>
                
                {!comments["dataLoading"] && comments["type"] === "news" && comments["_id"] === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}` ?
                    <div className="post-commentsWrapper">
                        {comments["data"].length === 0  || comments["dataCount"] === 0 ?
                            <div className="post-noCommentContainer">
                                <div className="post-noCommentFinulabLogoContainer">
                                    <img src="/assets/Finulab_Icon.png" alt="" className="post-noCommentFinulabLogoImg" />
                                </div>
                                <div className="post-noCommentFinulabAddToConversationContainer">
                                    <div className="post-noCommentHeader">Be the first to comment</div>
    
                                    <div className="post-noCommentBody" style={{"marginTop": "12.5px"}}>Nobody has responded to this post yet.</div>
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
                                                            <FinulabComment type={"secondary"} commFor={"news"}
                                                                location={props.type}
                                                                desc={
                                                                    {
                                                                        "newsId": `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`,
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
                                                                <FinulabComment type={"secondary"} commFor={"news"}
                                                                    location={props.type}
                                                                    desc={
                                                                        {
                                                                            "newsId": `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`,
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
                                                                <FinulabComment type={"secondary"} commFor={"news"}
                                                                    location={props.type}
                                                                    desc={
                                                                        {
                                                                            "newsId": `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`,
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
                                                                <FinulabComment type={"secondary"} commFor={"news"}
                                                                    location={props.type}
                                                                    desc={
                                                                        {
                                                                            "newsId": `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`,
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
                                {(comments["dataCount"] > comments["viewCount"]) && comments["viewCount"] !== 0 ?
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