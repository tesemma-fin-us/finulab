import './mini-news.css';
import '../../../pages/stocks/largeView/innerPages/stocks.css';

import {format} from 'timeago.js';
import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {ThumbUpOffAlt, ThumbDownOffAlt, Comment, Cached, ContentCopy, ThumbDown, ThumbUp, TrendingUp, TrendingDown} from '@mui/icons-material';

import generalOpx from '../../../functions/generalFunctions';

import {updateStockNews, selectStockNews} from '../../../reduxStore/stockNews';
import {updateSelection, selectHomePageData} from '../../../reduxStore/homePageData';
import {setStockPageSelection, selectStockPageSelection} from '../../../reduxStore/stockPageSelection';
import {updateStockDashboardNews, selectStockDashboardNews} from '../../../reduxStore/stockDashboardNews';
import {addToNewsEngagement, removeFromNewsEngagement, selectNewsEngagement} from '../../../reduxStore/newsEngagement';
import {setStockDashboardMarketsSelected, selectStockDashboardMarkets} from '../../../reduxStore/stockDashboardMarkets';

const chunkArray = (arr, size) => {
    let chunkedArray = [];
    for(let i = 0; i < arr.length; i += size) {
        chunkedArray.push(arr.slice(i, i + size));
    }

    return chunkedArray
}

export default function MiniaturizedNews(props) {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const u_engagement = useSelector(selectNewsEngagement);
    
    const stockNews = useSelector(selectStockNews);
    const homePageData = useSelector(selectHomePageData);
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

    const setSideDisplaySelection = () => {
        if(!(props.pred_ticker === undefined || props.pred_ticker === null)) {
            navigate(`/news/${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`);
        }
    }

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

        /* home news page */
        if(homePageData["selected"]["type"] === "News") {
            if(`${props.pred_ticker.slice(0, 1)}:-${homePageData["selected"]["selectedDesc"]["desc"]["_id"]}` === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`) {
                let selectionCopy = {...homePageData["selected"]["selectedDesc"]["desc"]};
                selectionCopy["likes"] = engagementRatioFunction[0];
                selectionCopy["dislikes"] = engagementRatioFunction[1];

                dispatch(
                    updateSelection(
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

        /* stock & crypto Dashboard */
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

    return(
        <div className="miniaturizedNews-Wrapper">
            <div className="large-stocksNewsInnerSegment">
                {props.loading ?
                    <div className="large-stocksNewsSegmentImgLoading"/> :
                    <button className="large-stocksNewsSegmentImgBtn" onClick={() => setSideDisplaySelection()}>
                        <img src={props.desc["imageUrl"]} 
                            alt="" 
                            onError={(e) => 
                                {
                                    e.target.src="/assets/Finulab_HighRes.jpg";
                                    e.target.className="miniaturizedNews-ErrorImg"
                                }
                            }
                            className="large-stocksNewsSegmentImg"
                        />
                    </button>
                }
                <button className="large-stocksNewsInnerSegmentBody" onClick={() => setSideDisplaySelection()}>
                    {props.loading ?
                        <div className="large-stocksNewsInnerSegementPreTitleLoading"/> : 
                        <div className="large-stocksNewsInnerSegementPreTitle">{format(props.desc["timeStamp"] * 1000)}</div>
                    }
                    {props.loading ?
                        <div className="large-stocksNewsInnerSegmentBodyTitleLoading"/> :
                        <div className="large-stocksNewsInnerSegmentBodyNewTitle">
                            <div className="large-stocksNewsInnerSegmentBodyNewTitleText">{props.desc["title"]}</div>
                        </div>
                    }
                    {/*props.loading ?
                        <div className="large-stocksNewsInnerSegmentBodyDescContainerLoading">
                            <div className="large-stocksNewsInnerSegmentBodyDescLoading" style={{"marginBottom": "3px"}}/>
                            <div className="large-stocksNewsInnerSegmentBodyDescLoading"/>
                        </div> : 
                        <div className="large-stocksNewsInnerSegmentBodyDescContainer">
                            <div className="large-stocksNewsInnerSegmentBodyDesc">
                                {props.desc["summary"]}
                            </div>
                        </div>
                    */}
                </button>
            </div>
            <div className="large-stocksNewsEngagementContainer">
                <div className="post-likeDislikeContainer">
                    <button className="miniaturizedPrediction-IconBtn"
                            onClick={
                                (props.user === undefined || props.user === null || props.user === "visitor") ?
                                () => navigate("/login") : () => engageNews("like")
                            }
                        >
                        {props.loading || (props.pred_ticker === undefined || props.pred_ticker === null) ?
                            <TrendingUp className="large-stocksNewsEngagementIcon"
                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                            /> :
                            <>
                                {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                    <TrendingUp className="large-stocksNewsEngagementIcon"
                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}    
                                    /> :
                                    <>
                                        {u_engagement.some(eng => eng.newsId === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`) ?
                                            <>
                                                {u_engagement.filter(eng => eng.newsId === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`)[0]["type"] === "like" ?
                                                    <TrendingUp className="large-stocksFullyLikedIcon" 
                                                        style={{"stroke": "var(--primary-green-09)", "strokeWidth": "1px"}}    
                                                    /> :
                                                    <TrendingUp className="large-stocksNewsEngagementIcon"
                                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                    />
                                                }
                                            </> : 
                                            <TrendingUp className="large-stocksNewsEngagementIcon"
                                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                            />
                                        }
                                    </>
                                }
                            </>
                        }
                    </button>
                    <div className="miniaturized-newsLikeDislikeRatioDesc">
                        {props.loading || engagementRatio[0] + engagementRatio[1] === 0 ?
                            null : 
                            `${engagementRatio[0] + engagementRatio[1] === 0 ?
                                `` : engagementRatio[0] + engagementRatio[1] > 0 ?
                                `+` : `-`
                            } ${generalOpx.formatLargeFigures(Math.abs(engagementRatio[0] + engagementRatio[1]))}`
                        }
                    </div>
                    <button className="miniaturizedPrediction-IconBtn"
                            onClick={
                                (props.user === undefined || props.user === null || props.user === "visitor") ?
                                () => navigate("/login") : () => engageNews("dislike")
                            }
                            style={{"marginRight": "10px"}}
                        >
                        {props.loading || (props.pred_ticker === undefined || props.pred_ticker === null) ?
                            <TrendingDown className="large-stocksNewsEngagementIcon" 
                                style={{"transform": "scale(-0.7, 0.7)", "WebkitTransform": "scale(-0.7, 0.7)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                            /> :
                            <>
                                {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                    <TrendingDown className="large-stocksNewsEngagementIcon" 
                                        style={{"transform": "scale(-0.7, 0.7)", "WebkitTransform": "scale(-0.7, 0.7)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                    /> :
                                    <>
                                        {u_engagement.some(eng => eng.newsId === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`) ?
                                            <>
                                                {u_engagement.filter(eng => eng.newsId === `${props.pred_ticker.slice(0, 1)}:-${props.desc._id}`)[0]["type"] === "dislike" ?
                                                    <TrendingDown className="large-stocksFullyDislikedIcon" 
                                                        style={{"transform": "scale(-0.7, 0.7)", "WebkitTransform": "scale(-0.7, 0.7)", "stroke": "var(--primary-red-09)", "strokeWidth": "1px"}}
                                                    /> :
                                                    <TrendingDown className="large-stocksNewsEngagementIcon" 
                                                        style={{"transform": "scale(-0.7, 0.7)", "WebkitTransform": "scale(-0.7, 0.7)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                                    />
                                                }
                                            </> : 
                                            <TrendingDown className="large-stocksNewsEngagementIcon" 
                                                style={{"transform": "scale(-0.7, 0.7)", "WebkitTransform": "scale(-0.7, 0.7)", "stroke": "var(--primary-bg-05)", "strokeWidth": "1px"}}
                                            />
                                        }
                                    </>
                                }
                            </>
                        }
                    </button>
                    {/*props.loading || engagementRatio[0] + engagementRatio[1] === 0 ?
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
                    */}
                </div>
                <div className="large-stocksNewsEngagementContainerFurtherOptn">
                    {/*
                    <div style={{"display": "flex", "alignItems": "center"}}>
                        <Cached className="large-stocksNewsEngagementIcon"/>
                        {props.loading || repostCount === 0?
                            null : 
                            <span className="post-additionalEngagementOptionsDescText">{generalOpx.formatLargeFigures(repostCount, 2)}</span>
                        }
                    </div>
                    */}
                    <div style={{"display": "flex", "alignItems": "center"}}>
                        <Comment className="large-stocksNewsEngagementIcon"/>
                        {props.loading || commentCount === 0?
                            null : 
                            <span className="post-additionalEngagementOptionsDescText">{generalOpx.formatLargeFigures(commentCount, 2)}</span>
                        }
                    </div>
                    <div style={{"display": "flex", "alignItems": "center", "marginRight": "0px"}}>
                        <ContentCopy className="large-stocksNewsEngagementIcon"/>
                    </div>
                </div>
            </div>
        </div>
    )
}