import '../../../../components/miniaturized/activity/activity.css';
import '../../../../components/miniaturized/prediction/mini-prediction.css';

import {debounce, throttle} from 'lodash';
import {format} from 'timeago.js';
import DOMPurify from 'dompurify';
import {getUnixTime} from 'date-fns';
import {useNavigate} from 'react-router-dom';
import FadeLoader from 'react-spinners/FadeLoader';
import BeatLoader from 'react-spinners/BeatLoader';
import {useDispatch, useSelector} from 'react-redux';
import React, {useRef, useState, useEffect, useMemo, useLayoutEffect, useCallback} from 'react';
import {
    ThumbUp, ThumbUpOffAlt, ThumbDown, ThumbDownOffAlt, Comment, Cached, ContentCopy, ChevronLeft, ChevronRight, 
    Engineering, ContentPasteSearch, OpenInFull, OpenInNew, Expand, UnfoldMore, ArrowDropUp, LockOpenRounded,
    Visibility,
    Add,
    AddTask,
    Check,
    KeyboardBackspace,
    ArrowDropDownSharp,
    ExploreSharp,
    ViewCarouselSharp,
    HistoryEduSharp,
    TerminalSharp,
    ExpandMore,
    Tsunami,
    Remove,
    TrendingUp,
    TrendingDown,
    DeleteSharp,
    LinkSharp,
    QueryStats,
    Luggage,
    Close,
    RepeatSharp,
    CloseSharp,
    ExpandMoreSharp
} from '@mui/icons-material';

import Post from '../../../../components/post';
import PriceHistory from '../../../../components/priceHistory';
import generalOpx from '../../../../functions/generalFunctions';
import FinulabComment from '../../../../components/comment/comment';
import RecommendationGraph from '../../../../components/recommendations';
import {CryptoChartContainer} from '../../../../components/cryptoChart/index';
import MiniaturizedNews from '../../../../components/miniaturized/news/mini-news';
import {FinulabMarkets_OutcomeChart} from '../../../../components/marketPriceTvChart';

import {selectUser} from '../../../../reduxStore/user';
import {setViewMedia} from '../../../../reduxStore/viewMedia';
import {selectWalletDesc} from '../../../../reduxStore/walletDesc';
import {selectMarketConfig} from '../../../../reduxStore/marketConfig';
import {selectRecommendations, addToRecommendations} from '../../../../reduxStore/recommendations';
import {updateStockActiveDays, selectStockActiveDays} from '../../../../reduxStore/stockActiveDays';
import {selectWatchlist, addToWatchlist, removeFromWatchlist} from '../../../../reduxStore/watchlist';
import {updateStockQuote, updateStockPrice, selectStockQuote} from '../../../../reduxStore/stockQuote';
import {updateStockNews, updateStockNewsIndex, selectStockNews} from '../../../../reduxStore/stockNews';
import {updateHomePageWatchlist, selectHomePageWatchlist} from '../../../../reduxStore/homePageWatchlist';
import {setComments, clearComments, updateComments, selectComments} from '../../../../reduxStore/comments';
import {updatePredictionPlotDataIndex, setPredictionPlotData} from '../../../../reduxStore/predictionPlotData';
import {setNewsEngagement, addToNewsEngagement, selectNewsEngagement} from '../../../../reduxStore/newsEngagement';
import {setPostEngagement, addToPostEngagement, selectPostEngagement} from '../../../../reduxStore/postEngagement';
import {setMarketHoldings, addToMarketHoldings, selectMarketHoldings} from '../../../../reduxStore/marketHoldings';
import {updateHomeFinancialScroll, selectHomeFinancialScrollState} from '../../../../reduxStore/homeFinancialScroll';
import {updateStockPageData, updateStockPagePosition, selectStockPageData} from '../../../../reduxStore/stockPageData';
import {setMarketFineDetails, setActivityData, setActivityIndex, selectMarketFineDetails} from '../../../../reduxStore/marketFineDetails';
import {setPredictionEngagement, addToPredictionEngagement, selectPredictionEngagement} from '../../../../reduxStore/predictionEngagement';
import {updateStockPredictions, updateStockPredictionsPosition, updateStockPredictionsSymbol, selectStockPredictions} from '../../../../reduxStore/stockPredictions';
import {setStockPageSelection, setStockPageSelectionSymbol, updateStockPageSelectionScrollTop, selectStockPageSelection} from '../../../../reduxStore/stockPageSelection';
import {addToCommentsEngagement, removeFromCommentsEngagement, setCommentsEngagement, clearCommentsEngagement, selectCommentsEngagement} from '../../../../reduxStore/commentsEngagement';
import {updateStockPostsSymbol, updateStockPosts, updateStockPostsPosition, updateStockPostsProcessedHeights, processStockPostsHeights, clearStockPostsHeights, selectStockPosts} from '../../../../reduxStore/stockPosts';

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

export default function SpecificMarketTV_Home(props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const today = new Date();
    const user = useSelector(selectUser);
    const comments = useSelector(selectComments);
    const newsData = useSelector(selectStockNews);
    const quoteData = useSelector(selectStockQuote);
    const u_watchlist = useSelector(selectWatchlist);
    const stockPosts = useSelector(selectStockPosts);
    const walletDesc = useSelector(selectWalletDesc);
    const pageData = useSelector(selectStockPageData);
    const marketConfig = useSelector(selectMarketConfig);
    const u_postEngagement = useSelector(selectPostEngagement);
    const u_newsEngagement = useSelector(selectNewsEngagement);
    const u_marketHoldings = useSelector(selectMarketHoldings);
    const stockActiveDays = useSelector(selectStockActiveDays);
    const stockPredictions = useSelector(selectStockPredictions);
    const u_recommendations = useSelector(selectRecommendations);
    const marketFineDetails = useSelector(selectMarketFineDetails);
    const homePageWatchlist = useSelector(selectHomePageWatchlist);
    const stockPageSelection = useSelector(selectStockPageSelection);
    const commentsEngagement = useSelector(selectCommentsEngagement);
    const u_predictionEngagement = useSelector(selectPredictionEngagement);
    const homeFinancialScroll = useSelector(selectHomeFinancialScrollState);

    const contentBodyRef = useRef();
    const [contentBodyWidth, setContentBodyWidth] = useState([0, false]);
    useLayoutEffect(() => {
        const contentBodyWidthFunction = () => {
            if(contentBodyRef.current) {
                const bodyWidth = contentBodyRef.current.getBoundingClientRect().width;
                setContentBodyWidth([bodyWidth, true]);
            }
        }

        window.addEventListener('resize', contentBodyWidthFunction);
        contentBodyWidthFunction();
        return () => window.removeEventListener('resize', contentBodyWidthFunction);
    }, []);

    const [pageError, setPageError] =  useState(false);
    const [advancedChart, setAdvancedChart] = useState(null);
    const pullSymbolData = async () => {
        const marketId = props.marketId;

        await generalOpx.axiosInstance.put(`/market/market-desc`, {"marketId": marketId}).then(
            async (response) => {
                if(response.data["status"] === "success") {
                    if(pageError) {
                        setPageError(false);
                    }

                    dispatch(
                        updateStockPageData(
                            {
                                "data": {...response.data["data"]}, "dataLoading": false
                            }
                        )
                    );

                    dispatch(
                        updateStockQuote(
                            {
                                "data": response.data["quote"], "dataLoading": false
                            }
                        )
                    );
                } else {
                    setPageError(true);
                }
            }
        ).catch(
            () => {
                setPageError(true);
            }
        );
    }

    const [quoteTypeSelection, setQuoteTypeSelection] = useState("yes");
    const [priceTypeSelection, setPriceTypeSelection] = useState("priceYes");
    const pageUpdate = () => {
        dispatch(
            updateStockPageData(
                {
                    "data": {}, "dataLoading": true
                }
            )
        );
        dispatch(
            updateStockPagePosition(0)
        );
        dispatch(
            updateStockQuote(
                {
                    "data": {}, "dataLoading": true
                }
            )
        );

        const tvWidget = (
            <FinulabMarkets_OutcomeChart market_selection={`${props.marketId}-${`${props.selection}`.toUpperCase()}`} />
        );
        setAdvancedChart(tvWidget);
        pullSymbolData();
    }

    const scrollController = useRef();
    useMemo(() => {
        if(props.marketId !== undefined) {
            if(Object.keys(pageData["page"]["data"]).length === 0) {
                pageUpdate();
                dispatch(
                    updateHomeFinancialScroll(
                        {
                            "fixed": false,
                            "scrollTop": 0,
                            "priceDisplay": false
                        }
                    )
                );
            } else {
                if(scrollController.current) {
                    if(props.f_viewPort === "small") {
                        setTimeout(() => {
                            document.documentElement.scrollTop = homeFinancialScroll.scrollTop;
                        }, 0);
                    } else {
                        setTimeout(() => {
                            if((scrollController.current?.scrollHeight - scrollController.current?.clientHeight) >= homeFinancialScroll.scrollTop) {
                                scrollController.current.scrollTop = homeFinancialScroll.scrollTop;
                            }
                        }, 0);
                    }
                }
            }
        }
    }, []);
    useEffect(() => {
        setQuoteTypeSelection(props.selection);
        props.selection === "yes" ? setPriceTypeSelection("priceYes") : setPriceTypeSelection("priceNo");

        if(props.marketId !== undefined) {
            if(Object.keys(pageData["page"]["data"]).length > 0) {
                if(pageData["page"]["data"]["symbol"] !== props.marketId) {
                    pageUpdate();

                    dispatch(
                        updateHomeFinancialScroll(
                            {
                                "fixed": false,
                                "scrollTop": 0,
                                "priceDisplay": false
                            }
                        )
                    );

                    if(props.f_viewPort === "small") {
                        setTimeout(() => {
                            document.documentElement.scrollTop = 0;
                        }, 0);
                    } else {
                        if(scrollController.current) {
                            setTimeout(() => {
                                    scrollController.current.scrollTop = 0;
                            }, 0);
                        }
                    }
                } else {
                    if(advancedChart === null) {
                        const tvWidget = (
                            <FinulabMarkets_OutcomeChart market_selection={`${props.marketId}-${`${props.selection}`.toUpperCase()}`} />
                        );
                        setAdvancedChart(tvWidget);

                        if(scrollController.current) {
                            if(props.f_viewPort === "small") {
                                setTimeout(() => {
                                    document.documentElement.scrollTop = homeFinancialScroll.scrollTop;
                                }, 0);
                            } else {
                                setTimeout(() => {
                                    if((scrollController.current?.scrollHeight - scrollController.current?.clientHeight) >= homeFinancialScroll.scrollTop) {
                                        scrollController.current.scrollTop = homeFinancialScroll.scrollTop;
                                    }
                                }, 0);
                            }
                        }
                    }
                }
            }
        }
    }, [props]);

    const descriptionRef = useRef();
    const [descriptionHidden, setDescriptionHidden] = useState(true);
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);
    const checkOverflow = (el) => {
        let curOverflow = el.style.overflow;
        if (!curOverflow || curOverflow === "visible") {el.overflow = "hidden";}

        let isOverflowing = el.clientWidth < el.scrollWidth || el.clientHeight < el.scrollHeight;
        el.style.overflow = curOverflow;

        return isOverflowing;
    }
    useEffect(() => {
        const descriptionToogle = () => {
            if(!pageData["page"]["dataLoading"] && descriptionRef.current) {
                const overflowResult = checkOverflow(descriptionRef.current);
                setDescriptionExpanded(overflowResult);
            }
        }

        if(!pageData["page"]["dataLoading"] && Object.keys(pageData["page"]["data"]).length > 0) {
            descriptionToogle();
        }
    }, [pageData]);
    const descriptionVisibilityToggle = () => {
        descriptionHidden ? setDescriptionHidden(false) : setDescriptionHidden(true);
    }

    const openSiteNewTab = (url) => {window.open(url, '_blank');};

    const [displayQuote, setDisplayQuote] = useState(false);
    const displayQuoteToggle = () => {displayQuote ? setDisplayQuote(false) : setDisplayQuote(true);}

    const assetChartnStatsRef = useRef();
    const [assetChartnStatsHeight, setAssetChartnStatsHeight] = useState(0);
    useLayoutEffect(() => {
        const assetChartnStatsHeightFunction = () => {
            if(assetChartnStatsRef.current) {
                const bodyHeight = assetChartnStatsRef.current.getBoundingClientRect().height;
                setAssetChartnStatsHeight(bodyHeight);
            }
        }

        window.addEventListener('resize', assetChartnStatsHeightFunction);
        assetChartnStatsHeightFunction();
        return () => window.removeEventListener('resize', assetChartnStatsHeightFunction);
    }, [displayQuote]);

    useEffect(() => {
        if(props.f_viewPort === "small") {
            const handleScrollHomePage = () => {
                const scrollTop = document.documentElement.scrollTop;
                const shouldShowPrice = scrollTop >= 39;

                if (
                    homeFinancialScroll.priceDisplay !== shouldShowPrice ||
                    homeFinancialScroll.scrollTop !== scrollTop
                ) {
                    dispatch(
                        updateHomeFinancialScroll({
                            ...homeFinancialScroll,
                            priceDisplay: shouldShowPrice,
                            scrollTop,
                        })
                    );
                }
            }
    
            const debouncedHandleScroll = throttle(handleScrollHomePage, 100);
            document.addEventListener('scroll', debouncedHandleScroll, {passive: true});
    
            return () => {
                document.removeEventListener('scroll', debouncedHandleScroll);
            };
        } else {
            const handleScrollHomePage = () => {
                const scrollTop = scrollController.current.scrollTop;
                const shouldShowPrice = scrollTop >= 39;

                if (
                    homeFinancialScroll.priceDisplay !== shouldShowPrice ||
                    homeFinancialScroll.scrollTop !== scrollTop
                ) {
                    dispatch(
                        updateHomeFinancialScroll({
                            ...homeFinancialScroll,
                            priceDisplay: shouldShowPrice,
                            scrollTop,
                        })
                    );
                }
            }
    
            const debouncedHandleScroll = throttle(handleScrollHomePage, 100);
    
            const scrollElement = scrollController.current;
            scrollElement.addEventListener('scroll', debouncedHandleScroll, {passive: true});
    
            return () => {
                if(scrollElement) {
                    scrollElement.removeEventListener('scroll', debouncedHandleScroll);
                }
            };
        }
    }, []);

    const marketFinerDetailsSetUp = async () => {
        const marketId = props.marketId;
        const topHolders = await generalOpx.axiosInstance.put(`/market/market-top-holders`, {"marketId": marketId});
        const activityHistory = await generalOpx.axiosInstance.put(`/market/market-activity-history`, {"type": "primary", "marketId": marketId, "selection": props.selection, "ids_ninclude": []});

        dispatch(
            setMarketFineDetails(
                {
                    "marketId": marketId,
                    "activity": activityHistory.data["status"] === "success" ? {
                        "index": 0,
                        "data": activityHistory.data["data"],
                        "dataCount": activityHistory.data["dataCount"],
                        "activeUsers": activityHistory.data["activeUsers"]
                    } : 
                    {
                        "index": 0,
                        "data": [],
                        "dataCount": 0,
                        "activeUsers": []
                    },
                    "topHolders": topHolders.data["status"] === "success" ? {...topHolders.data["data"]} : 
                    {
                        "yes": [],
                        "no": [],
                        "holders": []
                    },
                    "dataLoading": false
                }
            )
        );
    }
    useEffect(() => {
        if(marketFineDetails["dataLoading"]) {
            marketFinerDetailsSetUp();
        } else if(marketFineDetails["marketId"] !== props.marketId) {
            dispatch(
                setMarketFineDetails(
                    {
                        "marketId": "",
                        "activity":  {
                            "index": 0,
                            "data": [],
                            "dataCount": 0,
                            "activeUsers": []
                        },
                        "topHolders": {
                            "yes": [],
                            "no": [],
                            "holders": []
                        },
                        "dataLoading": true
                    }
                )
            );
            marketFinerDetailsSetUp();
        }
    }, []);

    const [activityBeingUpdated, setActivityBeingUpdated] = useState(false)
    const activityViewToggle = async (type) => {
        setActivityBeingUpdated(true);

        let currentIndex = marketFineDetails["activity"]["index"];
        if(type === "forward") {
            if(((currentIndex + 1) * 5) < marketFineDetails["activity"]["dataCount"]) {
                if(marketFineDetails["activity"]["dataCount"] === marketFineDetails["activity"]["data"].length) {
                    dispatch(
                        setActivityIndex(currentIndex + 1)
                    );
                } else {
                    const dataLen_difference = marketFineDetails["activity"]["dataCount"] - ((currentIndex + 1) * 5);
                    if(dataLen_difference < 10) {
                        let ids_ninclude = [];
                        for(let i = 0; i < marketFineDetails["activity"]["data"].length; i++) {
                            ids_ninclude.push(marketFineDetails["activity"]["data"][i]["_id"]);
                        }
                        const activityHistory = await generalOpx.axiosInstance.put(`/market/market-activity-history`, {"type": "secondary", "marketId": marketId, "selection": props.selection, "ids_ninclude": ids_ninclude});

                        const usersToExclude = marketFineDetails["activity"]["activeUsers"].map(act_usr => act_usr.username);
                        const setActiveUsersTo = [...activityHistory.data["activeUsers"]].filter(nact_usr => !usersToExclude.includes(nact_usr.username));
                        if(activityHistory.data["status"] === "success") {
                            dispatch(
                                setActivityData(
                                    {
                                        "index": currentIndex + 1,
                                        "data": [...activityHistory.data["data"]],
                                        "activeUsers": setActiveUsersTo
                                    }
                                )
                            );
                        }
                    } else {
                        dispatch(
                            setActivityIndex(currentIndex + 1)
                        );
                    }
                }
            }
        } else if(type === "back") {
            if(currentIndex > 0) {
                dispatch(
                    setActivityIndex(currentIndex - 1)
                );
            }
        }

        setActivityBeingUpdated(false);
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
                    "predType": Object.keys(pageData["page"]["data"]).includes("outcomesMap") ? "categorical" : "y-n",
                    "predictionId": pageData["page"]["data"]["predictionId"],
                    "comments": pageData["page"]["data"]["comments"]
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
                                    "_id": pageData["page"]["data"]["predictionId"],
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
        
        if(!pageData["page"]["dataLoading"]) {
            if(comments["type"] !== "prediction" || comments["_id"] !== pageData["page"]["data"]["predictionId"] || comments["dataLoading"] === true) {
                if(pageData["page"]["data"]["comments"] > 0) {
                    setUpComments();
                } else {
                    dispatch(
                        clearCommentsEngagement()
                    );
                    dispatch(
                        setComments(
                            {
                                "_id": pageData["page"]["data"]["predictionId"],
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
    }, [pageData["page"]["dataLoading"]]);

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
                        "_id": pageData["page"]["data"]["predictionId"],
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
                "predType": Object.keys(pageData["page"]["data"]).includes("outcomesMap") ? "categorical" : "y-n",
                "predictionId": pageData["page"]["data"]["predictionId"],
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

    const [viewChains, setViewChains] = useState(false);
    const viewChainsToggle = () => {
        viewChains ? setViewChains(false) : setViewChains(true);
    }

    /* purchase code */
    const [tradeOptnSelected, setTradeOptnSelected] = useState(false);
    const [ownershipBreakDown, setOwnershipBreakDown] = useState([]);
    useEffect(() => {
        if(ownershipBreakDown.length === 0) {
            if(u_marketHoldings.some(hlding_desc => hlding_desc.marketId === props.marketId)) {
                let ownershipBreakDownFunction = [];
                const ownershipBreakDownSupport = u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)
                for(let i = 0; i < ownershipBreakDownSupport.length; i++) {
                    ownershipBreakDownFunction.push(
                        {
                            "marketId": ownershipBreakDownSupport[i]["marketId"],
                            "noQuantity": ownershipBreakDownSupport[i]["noQuantityDesc"],
                            "yesQuantity": ownershipBreakDownSupport[i]["yesQuantityDesc"]
                        }
                    );
                }
                setOwnershipBreakDown(ownershipBreakDownFunction);
            }
        }
    }, [props]);

    const [commitTxLoading, setCommitTxLoading] = useState(false);
    const [quickPurchaseDesc, setQuickPurchaseDesc] = useState(
        {
            "purchaseType": props.selection, 
            "b_or_s": "buy", 
            "chain": 2, 
            "quantity": 0,
            "displayQuantity": "",
            "avg": 0, 
            "fee": 0, 
            "potentialReturn": 0,
            "total": 0
        }
    );

    const formatPurchaseQuantity = new Intl.NumberFormat(
        'en-US',
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    );
    const leastGreaterThanTarget = (arr, target) => 
        arr.reduce((min, current) => current > target && (min === null || current < min) ? current : min, null);

    const [quickPurchasePos, setQuickPurchasePos] = useState("100%");
    useEffect(() => {
        let intervalId;
        let setTimeInterval = 0;
        if(!commitTxLoading) {
            if(pageData["page"]["data"]["status"] === "live") {
                quickPurchasePos === "100%" ? setTimeInterval = 60 * 1000 : setTimeInterval = 10 * 1000;
                intervalId = setInterval(pullSymbolData, setTimeInterval);
            }
        }

        return () => {
            if(intervalId) {clearInterval(intervalId);}
        }

    }, [quickPurchasePos]);

    const quickPurchaseDescSet = (pt) => {
        if(quickPurchaseDesc["quantity"] === 0) {
            if(props.f_viewPort === "small") {
                document.documentElement.scrollTop = 0;
            } else {
                scrollController.current.scrollTo({top: 0, behavior: "instant"});
            }

            
            setTimeout(() => {
                setTradeOptnSelected(true);
                setTimeout(() => {
                    setQuickPurchasePos("0");
                    setQuickPurchaseDesc(
                        {
                            ...quickPurchaseDesc, "purchaseType": props.selection
                        }
                    );
                }, 50);
            }, 100);
        } else {
            let bq = 0, sectionOne = 0, quantity_yes = pageData["page"]["data"]["quantityYes"], quantity_no = pageData["page"]["data"]["quantityNo"];
            if(pt === "yes") {
                if(quickPurchaseDesc["b_or_s"] === "buy") {
                    quantity_yes = quantity_yes + quickPurchaseDesc["quantity"];
                } else if(quickPurchaseDesc["b_or_s"] === "sell") {
                    quantity_yes = quantity_yes - quickPurchaseDesc["quantity"];
                }
            } else if(pt === "no") {
                if(quickPurchaseDesc["b_or_s"] === "buy") {
                    quantity_no = quantity_no + quickPurchaseDesc["quantity"];
                } else if(quickPurchaseDesc["b_or_s"] === "sell") {
                    quantity_no = quantity_no - quickPurchaseDesc["quantity"];
                }
            }

            let fee_keys = [], utilizeConfig = {};
            let configKeys = Object.keys(marketConfig["data"]);
            if(marketConfig["dataLoading"] || configKeys.length === 0) {
                utilizeConfig = {...generalOpx.marketConfigSupport};
                
                let fee_supportKeys = Object.keys(generalOpx.marketConfigSupport["fee"]);
                for(let i = 0; i < fee_supportKeys.length; i++) {
                    const fee_value = Number(fee_supportKeys[i]);
                    
                    if(isNaN(fee_value)) {
                        continue;
                    } else {
                        fee_keys.push(fee_value);
                    }
                }
            } else {
                utilizeConfig = {...marketConfig["data"]};

                let fee_supportKeys = Object.keys(marketConfig["data"]["fee"]);
                for(let i = 0; i < fee_supportKeys.length; i++) {
                    const fee_value = Number(fee_supportKeys[i]);
                    
                    if(isNaN(fee_value)) {
                        continue;
                    } else {
                        fee_keys.push(fee_value);
                    }
                }
            }

            bq = utilizeConfig.alpha * (quantity_yes + quantity_no);
            sectionOne = Math.log(Math.exp(quantity_yes / bq) + Math.exp(quantity_no / bq));
            const costFunctionCalc = bq * sectionOne;

            let util_fee = 0, avg = 0, fee = 0, potentialReturn = 0, total = 0;
            if(quickPurchaseDesc["b_or_s"] === "buy") {
                const lstGt_val = leastGreaterThanTarget(fee_keys, quickPurchaseDesc["quantity"]);
                if(lstGt_val === null) {
                    util_fee = utilizeConfig["fee"][`${fee_keys.at(-1)}+`];
                } else {
                    util_fee = utilizeConfig["fee"][`${lstGt_val}`];
                }
                fee = (costFunctionCalc - pageData["page"]["data"]["costFunction"]) * (util_fee / 100);
                total = (costFunctionCalc - pageData["page"]["data"]["costFunction"]) * (1 + (util_fee / 100));


                isNaN((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / quickPurchaseDesc["quantity"]) ? 
                    avg = 0 : isFinite((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / quickPurchaseDesc["quantity"]) ? avg = (costFunctionCalc - pageData["page"]["data"]["costFunction"]) / quickPurchaseDesc["quantity"] : avg = 0;
                isNaN(1 - ((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / quickPurchaseDesc["quantity"])) ? 
                    potentialReturn = 0 : isFinite(1 - ((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / quickPurchaseDesc["quantity"])) ? potentialReturn = 1 - ((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / quickPurchaseDesc["quantity"]) : potentialReturn = 0;
            } else if(quickPurchaseDesc["b_or_s"] === "sell") {
                isNaN((pageData["page"]["data"]["costFunction"] - costFunctionCalc) / quickPurchaseDesc["quantity"]) ? 
                    avg = 0 : isFinite((pageData["page"]["data"]["costFunction"] - costFunctionCalc) / quickPurchaseDesc["quantity"]) ? avg = (pageData["page"]["data"]["costFunction"] - costFunctionCalc) / quickPurchaseDesc["quantity"] : avg = 0;
                
                fee = 0;
                potentialReturn = 0;
                total = pageData["page"]["data"]["costFunction"] - costFunctionCalc;
            }

            setTradeOptnSelected(true);
            if(props.f_viewPort === "small") {
                document.documentElement.scrollTop = 0;
            } else {
                scrollController.current.scrollTo({top: 0, behavior: "instant"});
            }

            setTimeout(() => {
                setQuickPurchasePos("0");
                setQuickPurchaseDesc(
                    {
                        ...quickPurchaseDesc,
                        "purchaseType": props.selection,
                        "avg": avg,
                        "fee": fee,
                        "potentialReturn": potentialReturn,
                        "total": total
                    }
                );
            }, 150);
        }
    }
    const exitQuickPurchase = () => {
        quickPurchasePos === "0" ? setQuickPurchasePos("100%") : setQuickPurchasePos("0");
        if(props.f_viewPort === "small") {
            document.documentElement.scrollTop = 0;
        } else {
            scrollController.current.scrollTop = 0;
        }
        setTimeout(() => {tradeOptnSelected ? setTradeOptnSelected(false) : setTradeOptnSelected(true);}, 150);
    }

    const adjustBuyorSell = (pt) => {
        if(pt !== quickPurchaseDesc["b_or_s"]) {
            let bq = 0, sectionOne = 0, quantity_yes = pageData["page"]["data"]["quantityYes"], quantity_no = pageData["page"]["data"]["quantityNo"];

            if(quickPurchaseDesc["purchaseType"] === "yes") {
                if(pt === "buy") {
                    quantity_yes = quantity_yes + quickPurchaseDesc["quantity"];
                } else if(pt === "sell") {
                    quantity_yes = quantity_yes - quickPurchaseDesc["quantity"];
                }
            } else if(quickPurchaseDesc["purchaseType"] === "no") {
                if(pt === "buy") {
                    quantity_no = quantity_no + quickPurchaseDesc["quantity"];
                } else if(pt === "sell") {
                    quantity_no = quantity_no - quickPurchaseDesc["quantity"];
                }
            }

            let fee_keys = [], utilizeConfig = {};
            let configKeys = Object.keys(marketConfig["data"]);
            if(marketConfig["dataLoading"] || configKeys.length === 0) {
                utilizeConfig = {...generalOpx.marketConfigSupport};
                
                let fee_supportKeys = Object.keys(generalOpx.marketConfigSupport["fee"]);
                for(let i = 0; i < fee_supportKeys.length; i++) {
                    const fee_value = Number(fee_supportKeys[i]);
                    
                    if(isNaN(fee_value)) {
                        continue;
                    } else {
                        fee_keys.push(fee_value);
                    }
                }
            } else {
                utilizeConfig = {...marketConfig["data"]};

                let fee_supportKeys = Object.keys(marketConfig["data"]["fee"]);
                for(let i = 0; i < fee_supportKeys.length; i++) {
                    const fee_value = Number(fee_supportKeys[i]);
                    
                    if(isNaN(fee_value)) {
                        continue;
                    } else {
                        fee_keys.push(fee_value);
                    }
                }
            }

            bq = utilizeConfig.alpha * (quantity_yes + quantity_no);
            sectionOne = Math.log(Math.exp(quantity_yes / bq) + Math.exp(quantity_no / bq));
            const costFunctionCalc = bq * sectionOne;

            let util_fee = 0, avg = 0, fee = 0, potentialReturn = 0, total = 0;
            if(pt === "buy") {
                const lstGt_val = leastGreaterThanTarget(fee_keys, quickPurchaseDesc["quantity"]);
                if(lstGt_val === null) {
                    util_fee = utilizeConfig["fee"][`${fee_keys.at(-1)}+`];
                } else {
                    util_fee = utilizeConfig["fee"][`${lstGt_val}`];
                }
                fee = (costFunctionCalc - pageData["page"]["data"]["costFunction"]) * (util_fee / 100);
                total = (costFunctionCalc - pageData["page"]["data"]["costFunction"]) * (1 + (util_fee / 100));


                isNaN((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / quickPurchaseDesc["quantity"]) ? 
                    avg = 0 : isFinite((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / quickPurchaseDesc["quantity"]) ? avg = (costFunctionCalc - pageData["page"]["data"]["costFunction"]) / quickPurchaseDesc["quantity"] : avg = 0;
                isNaN(1 - ((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / quickPurchaseDesc["quantity"])) ? 
                    potentialReturn = 0 : isFinite(1 - ((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / quickPurchaseDesc["quantity"])) ? potentialReturn = 1 - ((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / quickPurchaseDesc["quantity"]) : potentialReturn = 0;
            } else if(pt === "sell") {
                isNaN((pageData["page"]["data"]["costFunction"] - costFunctionCalc) / quickPurchaseDesc["quantity"]) ? 
                    avg = 0 : isFinite((pageData["page"]["data"]["costFunction"] - costFunctionCalc) / quickPurchaseDesc["quantity"]) ? avg = (pageData["page"]["data"]["costFunction"] - costFunctionCalc) / quickPurchaseDesc["quantity"] : avg = 0;
                
                fee = 0;
                potentialReturn = 0;
                total = pageData["page"]["data"]["costFunction"] - costFunctionCalc;
            }

            setQuickPurchaseDesc(
                {
                    ...quickPurchaseDesc, 
                    "b_or_s": pt,
                    "avg": avg,
                    "fee": fee,
                    "potentialReturn": potentialReturn,
                    "total": total
                }
            );
        }
    }

    const[quickPurchaseChainsDisplay, setQuickPurchaseChainsDisplay] = useState(false);
    const quickPurchaseChainsDisplayToggle = () => {
        quickPurchaseChainsDisplay ? setQuickPurchaseChainsDisplay(false) : setQuickPurchaseChainsDisplay(true);
    }

    const adjustPurchaseChain = (chain) => {
        setQuickPurchaseDesc(
            {
                ...quickPurchaseDesc, "chain": chain
            }
        );
        setQuickPurchaseChainsDisplay(false);
    }

    const cl_overlayRef = useRef();
    const cl_overlayContainerRef = useRef();
    useEffect(() => {
        if(cl_overlayRef.current && cl_overlayContainerRef.current && quickPurchaseChainsDisplay) {
            const handleClickOutside = (event) => {
                if(cl_overlayRef) {
                    if(!cl_overlayContainerRef.current?.contains(event?.target) && !cl_overlayRef.current?.contains(event?.target)) {
                        setQuickPurchaseChainsDisplay(false);
                    }
                }
            }

            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            }
        }
    }, [quickPurchaseChainsDisplay]);

    const adjustPurchaseQuantity = (event) => {
        const {value} = event.target;
        let value_clairified = value.replace(/[,.]/g, ''), sanitizedValue = Number(value_clairified.replace(/[^0-9]/g, ''));
        let bq = 0, sectionOne = 0, quantity_yes = pageData["page"]["data"]["quantityYes"], quantity_no = pageData["page"]["data"]["quantityNo"];

        if(quickPurchaseDesc["purchaseType"] === "yes") {
            if(quickPurchaseDesc["b_or_s"] === "buy") {
                quantity_yes = quantity_yes + sanitizedValue;
            } else if(quickPurchaseDesc["b_or_s"] === "sell") {
                quantity_yes = quantity_yes - sanitizedValue;
            }
        } else if(quickPurchaseDesc["purchaseType"] === "no") {
            if(quickPurchaseDesc["b_or_s"] === "buy") {
                quantity_no = quantity_no + sanitizedValue;
            } else if(quickPurchaseDesc["b_or_s"] === "sell") {
                quantity_no = quantity_no - sanitizedValue;
            }
        }
        
        let fee_keys = [], utilizeConfig = {};
        let configKeys = Object.keys(marketConfig["data"]);
        if(marketConfig["dataLoading"] || configKeys.length === 0) {
            utilizeConfig = {...generalOpx.marketConfigSupport};
            
            let fee_supportKeys = Object.keys(generalOpx.marketConfigSupport["fee"]);
            for(let i = 0; i < fee_supportKeys.length; i++) {
                const fee_value = Number(fee_supportKeys[i]);
                
                if(isNaN(fee_value)) {
                    continue;
                } else {
                    fee_keys.push(fee_value);
                }
            }
        } else {
            utilizeConfig = {...marketConfig["data"]};

            let fee_supportKeys = Object.keys(marketConfig["data"]["fee"]);
            for(let i = 0; i < fee_supportKeys.length; i++) {
                const fee_value = Number(fee_supportKeys[i]);
                
                if(isNaN(fee_value)) {
                    continue;
                } else {
                    fee_keys.push(fee_value);
                }
            }
        }

        bq = utilizeConfig.alpha * (quantity_yes + quantity_no);
        sectionOne = Math.log(Math.exp(quantity_yes / bq) + Math.exp(quantity_no / bq));
        const costFunctionCalc = bq * sectionOne;

        let util_fee = 0, avg = 0, fee = 0, potentialReturn = 0, total = 0;
        if(quickPurchaseDesc["b_or_s"] === "buy") {
            const lstGt_val = leastGreaterThanTarget(fee_keys, sanitizedValue);
            if(lstGt_val === null) {
                util_fee = utilizeConfig["fee"][`${fee_keys.at(-1)}+`];
            } else {
                util_fee = utilizeConfig["fee"][`${lstGt_val}`];
            }
            fee = (costFunctionCalc - pageData["page"]["data"]["costFunction"]) * (util_fee / 100);
            total = (costFunctionCalc - pageData["page"]["data"]["costFunction"]) * (1 + (util_fee / 100));


            isNaN((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / sanitizedValue) ? 
                avg = 0 : isFinite((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / sanitizedValue) ? avg = (costFunctionCalc - pageData["page"]["data"]["costFunction"]) / sanitizedValue : avg = 0;
            isNaN(1 - ((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / sanitizedValue)) ? 
                potentialReturn = 0 : isFinite(1 - ((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / sanitizedValue)) ? potentialReturn = 1 - ((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / sanitizedValue) : potentialReturn = 0;
        } else if(quickPurchaseDesc["b_or_s"] === "sell") {
            isNaN((pageData["page"]["data"]["costFunction"] - costFunctionCalc) / sanitizedValue) ? 
                avg = 0 : isFinite((pageData["page"]["data"]["costFunction"] - costFunctionCalc) / sanitizedValue) ? avg = (pageData["page"]["data"]["costFunction"] - costFunctionCalc) / sanitizedValue : avg = 0;
            
            fee = 0;
            potentialReturn = 0;
            total = pageData["page"]["data"]["costFunction"] - costFunctionCalc;

        }
        
        setQuickPurchaseDesc(
            {
                ...quickPurchaseDesc, 
                "quantity": sanitizedValue, 
                "displayQuantity": value === "" ? "" : formatPurchaseQuantity.format(sanitizedValue),
                "avg": avg,
                "fee": fee,
                "potentialReturn": potentialReturn,
                "total": total
            }
        );
    }

    const autoAdjustPurchaseQuantity = (amount) => {
        let sanitizedValue = quickPurchaseDesc["quantity"] + amount;
        let bq = 0, sectionOne = 0, quantity_yes = pageData["page"]["data"]["quantityYes"], quantity_no = pageData["page"]["data"]["quantityNo"];

        if(quickPurchaseDesc["purchaseType"] === "yes") {
            if(quickPurchaseDesc["b_or_s"] === "buy") {
                quantity_yes = quantity_yes + sanitizedValue;
            } else if(quickPurchaseDesc["b_or_s"] === "sell") {
                quantity_yes = quantity_yes - sanitizedValue;
            }
        } else if(quickPurchaseDesc["purchaseType"] === "no") {
            if(quickPurchaseDesc["b_or_s"] === "buy") {
                quantity_no = quantity_no + sanitizedValue;
            } else if(quickPurchaseDesc["b_or_s"] === "sell") {
                quantity_no = quantity_no - sanitizedValue;
            }
        }
        
        let fee_keys = [], utilizeConfig = {};
        let configKeys = Object.keys(marketConfig["data"]);
        if(marketConfig["dataLoading"] || configKeys.length === 0) {
            utilizeConfig = {...generalOpx.marketConfigSupport};
            
            let fee_supportKeys = Object.keys(generalOpx.marketConfigSupport["fee"]);
            for(let i = 0; i < fee_supportKeys.length; i++) {
                const fee_value = Number(fee_supportKeys[i]);
                
                if(isNaN(fee_value)) {
                    continue;
                } else {
                    fee_keys.push(fee_value);
                }
            }
        } else {
            utilizeConfig = {...marketConfig["data"]};

            let fee_supportKeys = Object.keys(marketConfig["data"]["fee"]);
            for(let i = 0; i < fee_supportKeys.length; i++) {
                const fee_value = Number(fee_supportKeys[i]);
                
                if(isNaN(fee_value)) {
                    continue;
                } else {
                    fee_keys.push(fee_value);
                }
            }
        }

        bq = utilizeConfig.alpha * (quantity_yes + quantity_no);
        sectionOne = Math.log(Math.exp(quantity_yes / bq) + Math.exp(quantity_no / bq));
        const costFunctionCalc = bq * sectionOne;

        let util_fee = 0, avg = 0, fee = 0, potentialReturn = 0, total = 0;
        if(quickPurchaseDesc["b_or_s"] === "buy") {
            const lstGt_val = leastGreaterThanTarget(fee_keys, sanitizedValue);
            if(lstGt_val === null) {
                util_fee = utilizeConfig["fee"][`${fee_keys.at(-1)}+`];
            } else {
                util_fee = utilizeConfig["fee"][`${lstGt_val}`];
            }
            fee = (costFunctionCalc - pageData["page"]["data"]["costFunction"]) * (util_fee / 100);
            total = (costFunctionCalc - pageData["page"]["data"]["costFunction"]) * (1 + (util_fee / 100));


            isNaN((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / sanitizedValue) ? 
                avg = 0 : isFinite((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / sanitizedValue) ? avg = (costFunctionCalc - pageData["page"]["data"]["costFunction"]) / sanitizedValue : avg = 0;
            isNaN(1 - ((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / sanitizedValue)) ? 
                potentialReturn = 0 : isFinite(1 - ((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / sanitizedValue)) ? potentialReturn = 1 - ((costFunctionCalc - pageData["page"]["data"]["costFunction"]) / sanitizedValue) : potentialReturn = 0;
        } else if(quickPurchaseDesc["b_or_s"] === "sell") {
            isNaN((pageData["page"]["data"]["costFunction"] - costFunctionCalc) / sanitizedValue) ? 
                avg = 0 : isFinite((pageData["page"]["data"]["costFunction"] - costFunctionCalc) / sanitizedValue) ? avg = (pageData["page"]["data"]["costFunction"] - costFunctionCalc) / sanitizedValue : avg = 0;
            
            fee = 0;
            potentialReturn = 0;
            total = pageData["page"]["data"]["costFunction"] - costFunctionCalc;

        }
        
        setQuickPurchaseDesc(
            {
                ...quickPurchaseDesc, 
                "quantity": sanitizedValue, 
                "displayQuantity": formatPurchaseQuantity.format(sanitizedValue),
                "avg": avg,
                "fee": fee,
                "potentialReturn": potentialReturn,
                "total": total
            }
        );
    }
    
    const [commitTxError, setCommitTxError] = useState(0);
    const [commitConfirmationStat, setCommitConfirmationStat] = useState("0px");
    const [commitTxAnimationSupport, setCommitTxAnimationSupport] = useState(
        {
            "overllContainer": "flex",
            "logoDisplay": "none",
            "receivedDisplay": "none",
            "mainOpacity": 1,
            "orderSummaryDisplay": "none"
        }
    );
    const checkConfirmationStat = () => {commitConfirmationStat === "0px" ? setCommitConfirmationStat("185px") : setCommitConfirmationStat("0px");}

    const commitTx = async () => {
        setCommitTxLoading(true);
        setCommitConfirmationStat("0px");
        
        let proceede_wTx = false;
        if(quickPurchaseDesc["b_or_s"] === "buy") {
            if(walletDesc["balance"]["data"].some(wlt_desc => wlt_desc[0] === String(quickPurchaseDesc["chain"]))) {
                const availableBalance = walletDesc["balance"]["data"].filter(wlt_desc => wlt_desc[0] === String(quickPurchaseDesc["chain"]))[0][1];

                if(quickPurchaseDesc["total"] > availableBalance) {
                    setCommitTxError(1);

                    setTimeout(() => {
                        setCommitTxError(0);
                        setCommitTxLoading(false);
                    }, 2000);
                } else {
                    proceede_wTx = true;
                }
            } else {
                setCommitTxError(1);

                setTimeout(() => {
                    setCommitTxError(0);
                    setCommitTxLoading(false);
                }, 2000);
            }
        } else if(quickPurchaseDesc["b_or_s"] === "sell") {
            if(ownershipBreakDown.some(ownrsp_desc => ownrsp_desc.marketId === props.marketId)) {
                if(
                    [...ownershipBreakDown.filter(
                            ownrsp_desc => ownrsp_desc.marketId === props.marketId
                        )[0][`${quickPurchaseDesc["purchaseType"]}Quantity`]
                    ].some(ownrsp_chain_desc => ownrsp_chain_desc[0] === String(quickPurchaseDesc["chain"]))
                ) {
                    const availableShares = [...ownershipBreakDown.filter(
                            ownrsp_desc => ownrsp_desc.marketId === props.marketId
                        )[0][`${quickPurchaseDesc["purchaseType"]}Quantity`]
                    ].filter(ownrsp_chain_desc => ownrsp_chain_desc[0] === String(quickPurchaseDesc["chain"]))[0][1];

                    if(quickPurchaseDesc["quantity"] > availableShares) {
                        setCommitTxError(2);

                        setTimeout(() => {
                            setCommitTxError(0);
                            setCommitTxLoading(false);
                        }, 2000);
                    } else {
                        let remainderQuantity = 0
                        if(quickPurchaseDesc["purchaseType"] === "yes") {
                            remainderQuantity = pageData["page"]["data"]["quantityYes"] - quickPurchaseDesc["quantity"];
                        } else if(quickPurchaseDesc["purchaseType"] === "no") {
                            remainderQuantity = pageData["page"]["data"]["quantityNo"] - quickPurchaseDesc["quantity"];
                        }

                        if(remainderQuantity < 1) {
                            setCommitTxError(3);

                            setTimeout(() => {
                                setCommitTxError(0);
                                setCommitTxLoading(false);
                            }, 2000);
                        } else {
                            proceede_wTx = true;
                        }
                    }

                } else {
                    setCommitTxError(2);

                    setTimeout(() => {
                        setCommitTxError(0);
                        setCommitTxLoading(false);
                    }, 2000);
                }
            } else {
                setCommitTxError(2);

                setTimeout(() => {
                    setCommitTxError(0);
                    setCommitTxLoading(false);
                }, 2000);
            }
        }

        if(proceede_wTx) {
            let proceed_wAnimation = false;
            await generalOpx.axiosInstance.post(`/market/tx-finalize`,
                {
                    "fee": quickPurchaseDesc["fee"],
                    "total": quickPurchaseDesc["total"],
                    "quantity": quickPurchaseDesc["quantity"],
                    "averagePrice": quickPurchaseDesc["avg"],

                    "action": quickPurchaseDesc["b_or_s"],
                    "selection": quickPurchaseDesc["purchaseType"],
                    "marketId": props.marketId,
                    "predictionId": pageData["page"]["data"]["predictionId"],

                    "chainId": `${quickPurchaseDesc["chain"]}`,
                }
            ).then(
                async (response) => {
                    if(response.data["status"] === "success") {
                        proceed_wAnimation = true;
                        await pullSymbolData();

                        let set_u_marketHoldings = [{"_id": "finulab_alreadySet"}];
                        const holdings = await generalOpx.axiosInstance.put(`/market/live-holdings`, {});
                        
                        if(holdings.data["status"] === "success") {
                            set_u_marketHoldings = [
                                ...set_u_marketHoldings,
                                ...holdings.data["data"]
                            ];

                            dispatch(
                                setMarketHoldings(set_u_marketHoldings)
                            );
                        }
                    } else {
                        setCommitTxError(4);

                        setTimeout(() => {
                            setCommitTxError(0);
                            setCommitTxLoading(false);
                        }, 2000);
                    }
                }
            ).catch(
                () => {
                    setCommitTxError(4);

                    setTimeout(() => {
                        setCommitTxError(0);
                        setCommitTxLoading(false);
                    }, 2000);
                }
            );
            
            if(proceed_wAnimation) {
                setTimeout(() => {
                    setQuickPurchasePos("-100%");
        
                    setTimeout(() => {
                        setCommitTxAnimationSupport(
                            {
                                "overllContainer": "flex",
                                "logoDisplay": "flex",
                                "receivedDisplay": "none",
                                "mainOpacity": 1,
                                "orderSummaryDisplay": "none"
                            }
                        );
        
                        setTimeout(() => {
                            setCommitTxAnimationSupport(
                                {
                                    "overllContainer": "flex",
                                    "logoDisplay": "flex",
                                    "receivedDisplay": "flex",
                                    "mainOpacity": 1,
                                    "orderSummaryDisplay": "none"
                                }
                            );
                
                            setTimeout(() => {
                                setCommitTxAnimationSupport(
                                    {
                                        "overllContainer": "flex",
                                        "logoDisplay": "flex",
                                        "receivedDisplay": "flex",
                                        "mainOpacity": 0,
                                        "orderSummaryDisplay": "none"
                                    }
                                );
                
                                setTimeout(() => {
                                    setCommitTxAnimationSupport(
                                        {
                                            "overllContainer": "flex",
                                            "logoDisplay": "flex",
                                            "receivedDisplay": "flex",
                                            "mainOpacity": 0,
                                            "orderSummaryDisplay": "flex"
                                        }
                                    );
                                    setCommitTxLoading(false);
                                }, 500);
                            }, 1500);
                        }, 500);
                    }, 500);
                }, 500);
            }
        }
    }

    const [quickTradeDisable, setQuickTradeDisable] = useState(false);
    const doneTx = () => {
        setQuickTradeDisable(true);
        setCommitTxAnimationSupport(
            {
                "overllContainer": "none",
                "logoDisplay": "flex",
                "receivedDisplay": "flex",
                "mainOpacity": 0,
                "orderSummaryDisplay": "flex"
            }
        );

        setTimeout(() => {
            setCommitTxAnimationSupport(
                {
                    "overllContainer": "flex",
                    "logoDisplay": "none",
                    "receivedDisplay": "none",
                    "mainOpacity": 1,
                    "orderSummaryDisplay": "none"
                }
            );
            setQuickPurchasePos("100%")
            setQuickPurchaseDesc(
                {
                    "index": 0, 
                    "purchaseType": "yes", 
                    "b_or_s": "buy", 
                    "chain": 2, 
                    "quantity": 0,
                    "displayQuantity": "",
                    "avg": 0, 
                    "fee": 0, 
                    "potentialReturn": 0,
                    "total": 0
                }
            );
            setQuickTradeDisable(false);
            setTimeout(() => {
                setTradeOptnSelected(false); 
                if(props.f_viewPort === "small") {
                    document.documentElement.scrollTop = 0;
                } else {
                    scrollController.current.scrollTop = 0;
                }
            }, 150);
        }, 250);
    }

    return(
        <div
                ref={scrollController}
                className={props.f_viewPort === "small" ? "small-homePageContentBodyWrapper" : "large-homePageContentBodyWrapper"}
                style={tradeOptnSelected ? {"overflow": "hidden"} : {}}
            >
            {tradeOptnSelected ?
                <div 
                        ref={contentBodyRef}
                        className={props.f_viewPort === "small" ? "small-homePageContentBody" : "large-homePageContentBody"}
                    >
                    <div className="large-homePageContentBodyMargin"/>

                    <div className="home-marketTvPurchaseOuterBody">

                        <div className="home-marketTvPurchaseBody"
                                style={{"top": `${quickPurchasePos}`, "display": `${commitTxAnimationSupport["overllContainer"]}`}}
                            >
                            <div className="miniaturized-predictionPurchaseHeader">
                                {pageData["page"]["data"]["outcome"] === "" ?
                                    <img src={pageData["page"]["data"]["predictiveImage"]} alt="" className="miniaturized-predictionPurchaseHeaderImg"/> :
                                    <img src={pageData["page"]["data"]["outcomeImage"]} alt="" className="miniaturized-predictionPurchaseHeaderImg"/>
                                }
                                <div className="miniaturized-predictionPurchaseHeaderDescContainer">
                                    <div className="miniaturized-predictionPurchaseHeaderChangeSelectionContainer">
                                        {pageData["page"]["data"]["outcome"] === "" ?
                                            null :
                                            <span className="miniaturized-predictionPurchaseHeaderChangeSelectionOutcomeDesc">{pageData["page"]["data"]["outcome"]}</span>
                                        }
                                        {quickPurchaseDesc["purchaseType"] === "yes" ?
                                            <button className="miniaturized-predictionPurchaseChangeSelectionBtn"
                                                    style={
                                                        {
                                                            "cursor": "auto",
                                                            "marginLeft": pageData["page"]["data"]["outcome"] === "" ? "0px" : "10px",
                                                            "color": "var(--primary-green-09)", 
                                                            "backgroundColor": "rgba(46, 204, 113, 0.15)"
                                                        }
                                                    }
                                                >
                                                Yes <RepeatSharp className="miniaturized-predictionPurchaseChangeSelectionBtnIcon" style={{"color": "var(--primary-green-09)"}}/>
                                            </button> :
                                            <button className="miniaturized-predictionPurchaseChangeSelectionBtn"
                                                    style={
                                                        {
                                                            "cursor": "auto",
                                                            "marginLeft": pageData["page"]["data"]["outcome"] === "" ? "0px" : "10px",
                                                            "color": "var(--primary-red-09)", 
                                                            "backgroundColor": "rgba(223, 83, 68, 0.15)"
                                                        }
                                                    }
                                                >
                                                No <RepeatSharp className="miniaturized-predictionPurchaseChangeSelectionBtnIcon" style={{"color": "var(--primary-red-09)"}}/>
                                            </button> 
                                        }
                                    </div>
                                    <div className="miniaturized-predictionPurchaseHeaderDesc">{pageData["page"]["data"]["predictiveQuestion"]}</div>
                                </div>
                                <button className="miniaturized-predictionPurchaseHeaderCloseBtn"
                                        onClick={() => exitQuickPurchase()}
                                    >
                                    <CloseSharp className="miniaturized-predictionPurchaseHeaderCloseBtnIcon"/>
                                </button>
                            </div>
                            <div className="miniaturized-predictionPurchaseOptnsContainer">
                                <div className="miniaturized-predictionPurchaseOptnsHighLevelOptnsContainer">
                                    <button className="miniaturized-predictionPurchaseOptnHighLevelBtn"
                                            onClick={() => adjustBuyorSell("buy")}
                                            style={{
                                                "zIndex": quickPurchaseDesc["b_or_s"] === "buy" ? "9" : "0",
                                                "marginLeft": "0", 
                                                "fontWeight": quickPurchaseDesc["b_or_s"] === "buy" ? "700" : "500", 
                                                "borderRight": quickPurchaseDesc["b_or_s"] === "buy" ? "none" : "solid 1px var(--primary-bg-08)",
                                                "color": quickPurchaseDesc["b_or_s"] === "buy" ? "var(--secondary-bg-03)" : "var(--primary-bg-05)",
                                                "backgroundColor": quickPurchaseDesc["b_or_s"] === "buy" ? "var(--primary-bg-01)" : "var(--secondary-bg-03)"
                                            }}
                                        >
                                        Buy
                                        {quickPurchaseDesc["b_or_s"] === "buy" ?
                                            <div className="miniaturized-predictionPurchaseOptnHighLevelBtnHighlight" style={{"backgroundColor": "var(--primary-bg-01)"}}/> :
                                            null
                                        }
                                    </button>
                                    <button className="miniaturized-predictionPurchaseOptnHighLevelBtn" 
                                            onClick={() => adjustBuyorSell("sell")}
                                            style={{
                                                "marginLeft": "-6px",
                                                "borderLeft": "none", 
                                                "fontWeight": quickPurchaseDesc["b_or_s"] === "sell" ? "700" : "500", 
                                                "borderLeft": quickPurchaseDesc["b_or_s"] === "sell" ? "none" : "solid 1px var(--primary-bg-08)",
                                                "color": quickPurchaseDesc["b_or_s"] === "sell" ? "var(--secondary-bg-03)" : "var(--primary-bg-05)",
                                                "backgroundColor": quickPurchaseDesc["b_or_s"] === "sell" ? "var(--primary-bg-01)" : "var(--secondary-bg-03)"
                                            }}
                                        >
                                        Sell
                                        {quickPurchaseDesc["b_or_s"] === "sell"?
                                            <div className="miniaturized-predictionPurchaseOptnHighLevelBtnHighlight" style={{"backgroundColor": "var(--primary-bg-01)"}}/> :
                                            null
                                        }
                                    </button>
                                    <button className="miniaturized-predictionPurchaseOptnHighLevelChainBtn"
                                            ref={cl_overlayContainerRef}
                                            onClick={() => quickPurchaseChainsDisplayToggle()}
                                        >
                                        Chain {quickPurchaseDesc["chain"]}
                                        <ExpandMoreSharp className="miniaturized-predictionPurchaseOptnHighLevelChainBtnIcon"/>
                                    </button>
                                    <div className="miniaturized-predictionPurchaseOptnChainsListContainer"
                                            ref={cl_overlayRef}
                                            style={{
                                                "display": quickPurchaseChainsDisplay ? "flex" : "none"
                                            }}
                                        >
                                        {Array(20).fill(null).map((_, index) => (
                                                <button className="miniaturized-predictionPurchaseOptnChainsListOptnBtn"
                                                        onClick={() => adjustPurchaseChain(index)}
                                                        key={`large-prediction-purch-chain-btn-${index}`}
                                                        style={{
                                                            "borderBottom": index === 19 ? "none" : "solid 1px var(--primary-bg-08)",
                                                            "color": quickPurchaseDesc["chain"] === index ? "var(--secondary-bg-03)" : "var(--primary-bg-01)",
                                                            "backgroundColor": quickPurchaseDesc["chain"] === index ? "var(--primary-bg-01)" : "var(--secondary-bg-03)"
                                                        }}
                                                    >
                                                    &nbsp;&nbsp;Chain&nbsp;&nbsp;&nbsp;&nbsp;{index}
                                                </button>
                                            ))
                                        }
                                    </div>
                                </div>
                                {commitTxError === 1 ?
                                    <div className="miniaturized-predictionPurchaseErrorNoticeDesc">Insufficient balance to complete the purchase.</div> : 
                                    <>
                                        {commitTxError === 2 ?
                                            <div className="miniaturized-predictionPurchaseErrorNoticeDesc">Insufficient shares to complete the sale.</div> : 
                                            <>
                                                {commitTxError === 3 ?
                                                    <div className="miniaturized-predictionPurchaseErrorNoticeDesc">There must be at least 1 share in the pool.</div> : 
                                                    <>
                                                        {commitTxError === 4 ?
                                                            <div className="miniaturized-predictionPurchaseErrorNoticeDesc">An error occured, please try later.</div> : null
                                                        }
                                                    </>
                                                }
                                            </>
                                        }
                                    </>
                                }
                                <div className="miniaturized-predictionPurchaseClassicContainer">
                                    <div className="miniaturized-predictionPurchaseDenominationContainer">
                                        Quantity
                                        <span className="miniaturized-predictionPurchaseDenominationDesc">
                                            {quickPurchaseDesc["b_or_s"] === "buy" ? 
                                                <>
                                                    {walletDesc["balance"]["data"].some(wlt_desc => wlt_desc[0] === String(quickPurchaseDesc["chain"])) ?
                                                        `Available: ${generalOpx.formatFiguresCrypto.format(walletDesc["balance"]["data"].filter(wlt_desc => wlt_desc[0] === String(quickPurchaseDesc["chain"]))[0][1])} FINUX`: 
                                                        `Available: 0.00 FINUX`
                                                    } 
                                                </> : 
                                                <>
                                                    {ownershipBreakDown.some(ownrsp_desc => ownrsp_desc.marketId === props.marketId) ?
                                                        <>
                                                            {[...ownershipBreakDown.filter(
                                                                    ownrsp_desc => ownrsp_desc.marketId === props.marketId
                                                                )[0][`${quickPurchaseDesc["purchaseType"]}Quantity`]].some(ownrsp_chain_desc => ownrsp_chain_desc[0] === String(quickPurchaseDesc["chain"])) ?
                                                                <>
                                                                    Available: {[...ownershipBreakDown.filter(
                                                                            ownrsp_desc => ownrsp_desc.marketId === props.marketId
                                                                        )[0][`${quickPurchaseDesc["purchaseType"]}Quantity`]].filter(ownrsp_chain_desc => ownrsp_chain_desc[0] === String(quickPurchaseDesc["chain"]))[0][1]
                                                                    } Shares
                                                                </> : 
                                                                `Available: 0.00 Shares` 
                                                            }
                                                        </> : 
                                                        `Available: 0.00 Shares` 
                                                    }
                                                </>
                                            }
                                        </span>
                                    </div>
                                    <div className="miniaturized-predictionPurchaseQuantityContainer">
                                        <div className="miniaturized-predictionPurchaseQuantityInputCont">
                                            <input type="text" 
                                                placeholder='0'
                                                disabled={commitTxLoading}
                                                value={quickPurchaseDesc["displayQuantity"]}
                                                onChange={adjustPurchaseQuantity}
                                                className="miniaturized-predictionPurchaseQuantityActInput" 
                                            />
                                        </div>
                                    </div>
                                    <div className="miniaturized-predictionPurchaseQuantityNoSliderBtnsContainer">
                                        <div
                                                style={{"display": "flex", "alignItems": "center", "marginLeft": "auto"}}
                                            >
                                            <button className="miniaturized-predictionPurchaseQuantitySliderAddBtn"
                                                    disabled={commitTxLoading}
                                                    onClick={() => autoAdjustPurchaseQuantity(50)}
                                                >
                                                + 50
                                            </button>
                                            <button className="miniaturized-predictionPurchaseQuantitySliderAddBtn"
                                                    disabled={commitTxLoading}
                                                    onClick={() => autoAdjustPurchaseQuantity(100)}
                                                >
                                                + 100
                                            </button>
                                            <button className="miniaturized-predictionPurchaseQuantitySliderAddBtn"
                                                    disabled={commitTxLoading}
                                                    onClick={() => autoAdjustPurchaseQuantity(1000)}
                                                >
                                                + 1000
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="miniaturized-predictionPurchaseExecutionContainer">
                                <div className="miniaturized-predictionPurchaseExecutionSubContainer">
                                    <div className="miniaturized-predictionPurchaseExecutionDescContainer">
                                        <span className="miniaturized-predictionPurchaseExecutionDescContainerSpanDesc" style={{"marginBottom": "4px"}}>
                                            Fee:&nbsp;&nbsp;<span style={{"fontWeight": "500", "color": "var(--primary-bg-01)"}}>{generalOpx.formatFiguresCrypto.format(quickPurchaseDesc["fee"])} FINUX</span>
                                        </span>
                                        <span className="miniaturized-predictionPurchaseExecutionDescContainerSpanDesc">
                                            Avg:&nbsp;&nbsp;<span style={{"fontWeight": "500", "color": "var(--primary-bg-01)"}}>{generalOpx.formatFiguresCrypto.format(quickPurchaseDesc["avg"])} FINUX</span>,&nbsp;&nbsp;
                                            Total:&nbsp;&nbsp;<span style={{"fontWeight": "500", "color": "var(--primary-bg-01)"}}>{generalOpx.formatFiguresCrypto.format(quickPurchaseDesc["total"])} FINUX</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="miniaturized-predictionPurchaseExecutionSubContainerV2">
                                    <div className="miniaturized-predictionPurchaseConfirmationContainer"
                                            style={{"left": `-${commitConfirmationStat}`, "width": `${commitConfirmationStat}`, "minWidth": `${commitConfirmationStat}`, "maxWidth": `${commitConfirmationStat}`}}
                                        >
                                        <button className="miniaturized-predictionPurchaseConfirmBtn"
                                                disabled={commitTxLoading}
                                                onClick={() => commitTx()}
                                            >
                                            Confirm
                                        </button>
                                        <button className="miniaturized-predictionPurchaseConfirmCancelBtn"
                                                disabled={commitTxLoading}
                                                onClick={() => checkConfirmationStat()}
                                            >
                                            Cancel
                                        </button>
                                    </div>
                                    <button className="miniaturized-predictionPurchaseExecutionBtn"
                                            disabled={commitTxLoading}
                                            onClick={() => checkConfirmationStat()}
                                        >
                                        {commitTxLoading ?
                                            <BeatLoader 
                                                color='var(--secondary-bg-03)'
                                                size={5}
                                            /> : 
                                            `Commit Tx`
                                        }
                                    </button>
                                </div>
                            </div>
                            <div className="miniaturized-predictionPurchaseSecondaryWrapper"
                                    style={quickPurchasePos === "100%" ? {"display": "none"} : {}}
                                >
                                <div className="miniaturized-predictionPurchaseSecondaryOrderSummaryWrapper"
                                        style={{"display": `${commitTxAnimationSupport["orderSummaryDisplay"]}`}}
                                    >
                                    <div className="miniaturized-predictionPurchaseSecondaryOrderSummaryHeader">
                                        Order Completed
                                    </div>
                                    <div className="miniaturized-predictionPurchaseSecondaryAmountsDescContainer">
                                        {quickPurchaseDesc["b_or_s"] === "buy" ?
                                            <>
                                                <div className="miniaturized-predictionPurchaseSecondaryOutcomeLineContainer">
                                                    <span className="miniaturized-predictionPurchaseSecondaryOutcomeLineLeft">
                                                        Invested
                                                    </span>
                                                    <span className="miniaturized-predictionPurchaseSecondaryOutcomeLineRight">
                                                        {generalOpx.formatFiguresCrypto.format(quickPurchaseDesc["total"])} FINUX
                                                    </span>
                                                </div>
                                                <div className="miniaturized-predictionPurchaseSecondaryOutcomeLineContainer">
                                                    <span className="miniaturized-predictionPurchaseSecondaryOutcomeLineLeft">
                                                        Purchased
                                                    </span>
                                                    <span className="miniaturized-predictionPurchaseSecondaryOutcomeLineRight">
                                                        {formatPurchaseQuantity.format(quickPurchaseDesc["quantity"])} Shares
                                                    </span>
                                                </div>
                                                <div className="miniaturized-predictionPurchaseSecondaryOutcomeLineContainer">
                                                    <span className="miniaturized-predictionPurchaseSecondaryOutcomeLineLeft">
                                                        Price Per Share
                                                    </span>
                                                    <span className="miniaturized-predictionPurchaseSecondaryOutcomeLineRight">
                                                        {generalOpx.formatFiguresCrypto.format(quickPurchaseDesc["avg"])} FINUX
                                                    </span>
                                                </div>
                                            </> : 
                                            <>
                                                <div className="miniaturized-predictionPurchaseSecondaryOutcomeLineContainer">
                                                    <span className="miniaturized-predictionPurchaseSecondaryOutcomeLineLeft">
                                                        Received
                                                    </span>
                                                    <span className="miniaturized-predictionPurchaseSecondaryOutcomeLineRight">
                                                        {generalOpx.formatFiguresCrypto.format(quickPurchaseDesc["total"])} FINUX
                                                    </span>
                                                </div>
                                                <div className="miniaturized-predictionPurchaseSecondaryOutcomeLineContainer">
                                                    <span className="miniaturized-predictionPurchaseSecondaryOutcomeLineLeft">
                                                        Sold
                                                    </span>
                                                    <span className="miniaturized-predictionPurchaseSecondaryOutcomeLineRight">
                                                        {formatPurchaseQuantity.format(quickPurchaseDesc["quantity"])} Shares
                                                    </span>
                                                </div>
                                                <div className="miniaturized-predictionPurchaseSecondaryOutcomeLineContainer">
                                                    <span className="miniaturized-predictionPurchaseSecondaryOutcomeLineLeft">
                                                        Price Per Share
                                                    </span>
                                                    <span className="miniaturized-predictionPurchaseSecondaryOutcomeLineRight">
                                                        {generalOpx.formatFiguresCrypto.format(quickPurchaseDesc["avg"])} FINUX
                                                    </span>
                                                </div>
                                            </>
                                        }
                                    </div>
                                    <button className="miniaturized-predictionPurchaseSecondaryOutcomeDoneBtn"
                                            disabled={quickTradeDisable}
                                            onClick={() => doneTx()}
                                        >
                                        Done
                                    </button>
                                </div>

                                <div className="miniaturized-predictionPurchaseLoadingContainer">
                                    <div className="miniaturized-predictionPurchaseLoadingSpinner" style={{"opacity": `${commitTxAnimationSupport["mainOpacity"]}`}}/>
                                    <img 
                                        style={{"display": `${commitTxAnimationSupport["logoDisplay"]}`, "opacity": `${commitTxAnimationSupport["mainOpacity"]}`}}
                                        src="/assets/Finulab_Icon_Black.png" 
                                        alt="" 
                                        className="finulab-predictionPurchaseLoadingImg" 
                                    />
                                </div>

                                <div className="miniaturized-predictionPurchasePurchaseReceived" 
                                        style={
                                            {
                                                "display": `${commitTxAnimationSupport["receivedDisplay"]}`,
                                                ...(commitTxAnimationSupport["mainOpacity"] === 0 ? {"opacity": `${commitTxAnimationSupport["mainOpacity"]}`} : {})
                                            }
                                        }
                                    >
                                    Order Received
                                </div>
                                <div className="miniaturized-predictionPurchasePurchaseOrderDesc" style={{"opacity": `${commitTxAnimationSupport["mainOpacity"]}`}}>
                                    System response, execution price, speed, liquidity, market data, and account access times are affected by many factors, including market volatility, size and type of order, market conditions, system performance and other factors.
                                </div>
                            </div>
                        </div>

                    </div>

                </div> : 
                <div
                        ref={contentBodyRef}
                        className={props.f_viewPort === "small" ? "small-homePageContentBody" : "large-homePageContentBody"}
                    >
                    <div className="large-homePageContentBodyMargin"/>
                    <div className="large-homeAssetDataContainer" ref={assetChartnStatsRef}>
                        <div className="large-stocksKeyStatsHeaderContainer">
                            {props.f_viewPort === "small" ?
                                <button className="large-stocksProfileHeaderQucikStatsWrapper" 
                                        disabled={quoteData["quote"]["dataLoading"]}
                                        onClick={() => displayQuoteToggle()}
                                        style={{
                                            "margin": "0", 
                                            "height": "58px", "minHeight": "58px", "maxHeight": "58px",
                                            "width": "fit-content", "minWidth": "fit-content", "maxWidth": "fit-content"
                                        }}
                                    >
                                    <div className="large-stocksProfileHeaderQuickStatsExpandBtn"
                                            style={{"height": "56px", "minHeight": "56px", "maxHeight": "56px"}}
                                        >
                                        <ArrowDropDownSharp 
                                            style={displayQuote ? {"rotate": "180deg"} : {"rotate": "0deg"}}
                                            className="large-stocksProfileHeaderQuickStatsExpandBtnIcon" 
                                        />
                                    </div>
                                </button> : null
                            }
                            <div className="large-stocksProfileImgandPriceTodayContainer">
                                <div className="large-stocksProfileImgandPriceTodayInnerContainer">
                                    <div className="large-stocksPriceTodayContainer">
                                        <div className="large-stocksTodayPriceChangeContainer">
                                            {quoteData["quote"]["dataLoading"] || quoteData["quote"]["data"][quoteTypeSelection] === undefined ?
                                                <span className="large-stocksTodayPriceDescLoading"/> : 
                                                <span className="large-stocksTodayPriceDesc">{generalOpx.formatFigures.format(pageData["page"]["data"][priceTypeSelection])} FINUX</span>
                                            }
                                            {quoteData["quote"]["dataLoading"] || !(quoteTypeSelection === "yes" || quoteTypeSelection === "no")
                                                || quoteData["quote"]["data"][quoteTypeSelection] === undefined ?
                                                null : 
                                                <span className="large-stocksTodayPriceChangeDesc">
                                                    <ArrowDropUp className="large-stocksTodayPriceChangeDescIcon"
                                                        style={quoteData["quote"]["data"][quoteTypeSelection]["close"] - quoteData["quote"]["data"][quoteTypeSelection]["open"] >= 0 ? 
                                                            {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)", "rotate": "180deg"}
                                                        }
                                                    />
                                                    <span 
                                                            style={quoteData["quote"]["data"][quoteTypeSelection]["close"] - quoteData["quote"]["data"][quoteTypeSelection]["open"] >= 0 ?
                                                                {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                            }
                                                        >
                                                        &nbsp;{`${generalOpx.formatLargeFigures(Math.abs(quoteData["quote"]["data"][quoteTypeSelection]["close"] - quoteData["quote"]["data"][quoteTypeSelection]["open"]), 2)}`}&nbsp;&nbsp;{`(${generalOpx.formatFigures.format(Math.abs((quoteData["quote"]["data"][quoteTypeSelection]["close"] - quoteData["quote"]["data"][quoteTypeSelection]["open"]) / quoteData["quote"]["data"][quoteTypeSelection]["open"]))}%)`}
                                                    </span>
                                                </span>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="large-stocksProfilePriceChangeDetailContainer">
                                    {quoteData["quote"]["dataLoading"] || quoteData["quote"]["data"][quoteTypeSelection] === undefined ?
                                        <div className="large-stocksProfilePriceChangeDetailContainerLoding"/> : 
                                        <>
                                            <span className="large-stocksProfilePriceChangeDetailsDesc">Low: ${generalOpx.formatFigures.format(quoteData["quote"]["data"][quoteTypeSelection]["low"])}</span>
                                            {quoteData["quote"]["data"][quoteTypeSelection]["high"] === quoteData["quote"]["data"][quoteTypeSelection]["low"] ?
                                                <div className="large-stocksProfilePriceChangeBarSectsContainer">
                                                    <div className="large-stocksProfilePriceChangeBarSectOneFullyFilled"/>
                                                    <ArrowDropUp 
                                                        className="large-stocksProfilePriceChangeBarSectPointer"
                                                        style={{"left": `88px`}}
                                                    />
                                                </div> : 
                                                <>
                                                    {(quoteData["quote"]["data"][quoteTypeSelection]["close"] - quoteData["quote"]["data"][quoteTypeSelection]["low"]) / (quoteData["quote"]["data"][quoteTypeSelection]["high"] - quoteData["quote"]["data"][quoteTypeSelection]["low"]) <= 0.05 ?
                                                        <div className="large-stocksProfilePriceChangeBarSectsContainer">
                                                            <div className="large-stocksProfilePriceChangeBarSectTwoFullyFilled"/>
                                                            <ArrowDropUp 
                                                                className="large-stocksProfilePriceChangeBarSectPointer"
                                                                style={{"left": `calc((${(quoteData["quote"]["data"][quoteTypeSelection]["close"] - quoteData["quote"]["data"][quoteTypeSelection]["low"]) / (quoteData["quote"]["data"][quoteTypeSelection]["high"] - quoteData["quote"]["data"][quoteTypeSelection]["low"])} * 100px) - 12px)`}}
                                                            />
                                                        </div> : 
                                                        <>
                                                            {(quoteData["quote"]["data"][quoteTypeSelection]["close"] - quoteData["quote"]["data"][quoteTypeSelection]["low"]) / (quoteData["quote"]["data"][quoteTypeSelection]["high"] - quoteData["quote"]["data"][quoteTypeSelection]["low"]) >= 0.95 ?
                                                                <div className="large-stocksProfilePriceChangeBarSectsContainer">
                                                                    <div className="large-stocksProfilePriceChangeBarSectOneFullyFilled"/>
                                                                    <ArrowDropUp 
                                                                        className="large-stocksProfilePriceChangeBarSectPointer"
                                                                        style={{"left": `calc((${(quoteData["quote"]["data"][quoteTypeSelection]["close"] - quoteData["quote"]["data"][quoteTypeSelection]["low"]) / (quoteData["quote"]["data"][quoteTypeSelection]["high"] - quoteData["quote"]["data"][quoteTypeSelection]["low"])} * 100px) - 12px)`}}
                                                                    />
                                                                </div> : 
                                                                <div className="large-stocksProfilePriceChangeBarSectsContainer">
                                                                    <div className="large-stocksProfilePriceChangeBarSectOne"
                                                                        style={{
                                                                            "width": `calc(${(quoteData["quote"]["data"][quoteTypeSelection]["close"] - quoteData["quote"]["data"][quoteTypeSelection]["low"]) / (quoteData["quote"]["data"][quoteTypeSelection]["high"] - quoteData["quote"]["data"][quoteTypeSelection]["low"])} * 100px)`,
                                                                            "minWidth": `calc(${(quoteData["quote"]["data"][quoteTypeSelection]["close"] - quoteData["quote"]["data"][quoteTypeSelection]["low"]) / (quoteData["quote"]["data"][quoteTypeSelection]["high"] - quoteData["quote"]["data"][quoteTypeSelection]["low"])} * 100px)`,
                                                                            "maxWidth": `calc(${(quoteData["quote"]["data"][quoteTypeSelection]["close"] - quoteData["quote"]["data"][quoteTypeSelection]["low"]) / (quoteData["quote"]["data"][quoteTypeSelection]["high"] - quoteData["quote"]["data"][quoteTypeSelection]["low"])} * 100px)`
                                                                        }}
                                                                    />
                                                                    <div className="large-stocksProfilePriceChangeBarSectTwo"
                                                                        style={{
                                                                            "width": `calc((1 - ${(quoteData["quote"]["data"][quoteTypeSelection]["close"] - quoteData["quote"]["data"][quoteTypeSelection]["low"]) / (quoteData["quote"]["data"][quoteTypeSelection]["high"] - quoteData["quote"]["data"][quoteTypeSelection]["low"])}) * 100px)`,
                                                                            "minWidth": `calc((1 - ${(quoteData["quote"]["data"][quoteTypeSelection]["close"] - quoteData["quote"]["data"][quoteTypeSelection]["low"]) / (quoteData["quote"]["data"][quoteTypeSelection]["high"] - quoteData["quote"]["data"][quoteTypeSelection]["low"])}) * 100px)`,
                                                                            "maxWidth": `calc((1 - ${(quoteData["quote"]["data"][quoteTypeSelection]["close"] - quoteData["quote"]["data"][quoteTypeSelection]["low"]) / (quoteData["quote"]["data"][quoteTypeSelection]["high"] - quoteData["quote"]["data"][quoteTypeSelection]["low"])}) * 100px)`
                                                                        }}
                                                                    />
                                                                    <ArrowDropUp 
                                                                        className="large-stocksProfilePriceChangeBarSectPointer"
                                                                        style={{"left": `calc((${(quoteData["quote"]["data"][quoteTypeSelection]["close"] - quoteData["quote"]["data"][quoteTypeSelection]["low"]) / (quoteData["quote"]["data"][quoteTypeSelection]["high"] - quoteData["quote"]["data"][quoteTypeSelection]["low"])} * 100px) - 12px)`}}
                                                                    />
                                                                </div>
                                                            }
                                                        </>
                                                    }
                                                </>
                                            }
                                            <span className="large-stocksProfilePriceChangeDetailsDesc">High: ${generalOpx.formatFigures.format(quoteData["quote"]["data"][quoteTypeSelection]["high"])}</span>
                                        </>
                                    }
                                </div>
                            </div>
                            {props.f_viewPort === "small" ?
                                null : 
                                <button className="large-stocksProfileHeaderQucikStatsWrapper" 
                                        disabled={quoteData["quote"]["dataLoading"]}
                                        onClick={() => displayQuoteToggle()}
                                    >
                                    <div className="large-stocksProfileHeaderQuickStats">
                                        <div className="large-stocksProfileheaderQuickStateLine" style={{"marginBottom": "5px"}}>
                                            <span>Yes-Chance:</span>
                                            {quoteData["quote"]["dataLoading"] ?
                                                <span className="large-stocksProfileHeaderQuickStatLoading"/> : 
                                                `${generalOpx.formatPercentage.format(pageData["page"]["data"]["probabilityYes"] * 100)}%`
                                            }
                                        </div>
                                        <div className="large-stocksProfileheaderQuickStateLine">
                                            <span>No-Chance:</span>
                                            {quoteData["quote"]["dataLoading"] ?
                                                <span className="large-stocksProfileHeaderQuickStatLoading"/> : 
                                                `${generalOpx.formatPercentage.format(pageData["page"]["data"]["probabilityNo"] * 100)}%`
                                            }
                                        </div>
                                    </div>
                                    <div className="large-stocksProfileHeaderQuickStatsExpandBtn">
                                        <ArrowDropDownSharp 
                                            style={displayQuote ? {"rotate": "180deg"} : {"rotate": "0deg"}}
                                            className="large-stocksProfileHeaderQuickStatsExpandBtnIcon" 
                                        />
                                    </div>
                                </button>
                            }
                        </div>
                        <div className="large-stocksNewsTVNotice">
                            {`The charting technology is provided by`}&nbsp;
                            <button className="large-stocksNewsTVNoticeBtn" onClick={() => openSiteNewTab("https://www.tradingview.com")}>
                                TradingView
                            </button>
                            {`. Learn how to use the`}&nbsp;
                            <button className="large-stocksNewsTVNoticeBtn" onClick={() => openSiteNewTab("https://www.tradingview.com/screener/")}>
                                TradingView&nbsp;
                            </button>
                            <button className="large-stocksNewsTVNoticeBtn" onClick={() => openSiteNewTab("https://www.tradingview.com/screener/")}>
                                Stock&nbsp;
                            </button>
                            <button className="large-stocksNewsTVNoticeBtn" onClick={() => openSiteNewTab("https://www.tradingview.com/screener/")}>
                                Screener
                            </button>
                            {`.`}
                        </div>
                        <div 
                            className="homeAsset-ChartContainer_divider"
                            style={{"marginTop": "16px"}}
                        />
                        {displayQuote ?
                            <>
                                <div className="large-stocksHeaderQuote">
                                    <div className="large-stocksHeaderQuoteSection">
                                        <div className="large-stocksHeaderQuoteSectionLine">
                                            <span className="large-stocksHeaderQuoteSectionLineDesc">
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock">
                                                    Open
                                                </p>
                                            </span>
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                            <span className="large-stocksHeaderQuoteSectionLineFigure">
                                                {quoteData["quote"]["dataLoading"] || quoteData["quote"]["data"][quoteTypeSelection] === undefined ?
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> : 
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                            style={{"textAlign": "right"}}
                                                        >
                                                        {generalOpx.formatFigures.format(quoteData["quote"]["data"][quoteTypeSelection]["open"])}
                                                    </p>
                                                }
                                            </span>
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        </div>
                                        <div className="large-stocksHeaderQuoteSectionLine">
                                            <span className="large-stocksHeaderQuoteSectionLineDesc">
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock">
                                                    Low
                                                </p>
                                            </span>
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                            <span className="large-stocksHeaderQuoteSectionLineFigure">
                                                {quoteData["quote"]["dataLoading"] || quoteData["quote"]["data"][quoteTypeSelection] === undefined ?
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                            style={{"textAlign": "right"}}
                                                        >
                                                        {generalOpx.formatFigures.format(quoteData["quote"]["data"][quoteTypeSelection]["low"])}
                                                    </p>
                                                }
                                            </span>
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        </div>
                                        <div className="large-stocksHeaderQuoteSectionLine">
                                            <span className="large-stocksHeaderQuoteSectionLineDesc">
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock">
                                                    High
                                                </p>
                                            </span>
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                            <span className="large-stocksHeaderQuoteSectionLineFigure">
                                                {quoteData["quote"]["dataLoading"] || quoteData["quote"]["data"][quoteTypeSelection] === undefined ?
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                            style={{"textAlign": "right"}}
                                                        >
                                                        {generalOpx.formatFigures.format(quoteData["quote"]["data"][quoteTypeSelection]["high"])}
                                                    </p>
                                                }
                                            </span>
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        </div>
                                    </div>

                                    <div className="large-stocksHeaderQuoteSectionDivider"/>

                                    <div className="large-stocksHeaderQuoteSection">
                                        <div className="large-stocksHeaderQuoteSectionLine">
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                            <span className="large-stocksHeaderQuoteSectionLineDesc">
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock">
                                                    Volume
                                                </p>
                                            </span>
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                            <span className="large-stocksHeaderQuoteSectionLineFigure">
                                                {quoteData["quote"]["dataLoading"] || quoteData["quote"]["data"][quoteTypeSelection] === undefined?
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                            style={{"textAlign": "right"}}
                                                        >
                                                        {generalOpx.formatLargeFigures(pageData["page"]["data"]["quantityYes"] + pageData["page"]["data"]["quantityNo"], 2)}
                                                    </p>
                                                }
                                            </span>
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        </div>
                                        <div className="large-stocksHeaderQuoteSectionLine">
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                            <span className="large-stocksHeaderQuoteSectionLineDesc">
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock">
                                                    No Quant.
                                                </p>
                                            </span>
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                            <span className="large-stocksHeaderQuoteSectionLineFigure">
                                                {quoteData["quote"]["dataLoading"] || quoteData["quote"]["data"][quoteTypeSelection] === undefined ?
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                            style={{"textAlign": "right"}}
                                                        >
                                                        {generalOpx.formatLargeFigures(pageData["page"]["data"]["quantityNo"], 2)}
                                                    </p>
                                                }
                                            </span>
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        </div>
                                        <div className="large-stocksHeaderQuoteSectionLine">
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                            <span className="large-stocksHeaderQuoteSectionLineDesc">
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock">
                                                    Yes Quant.
                                                </p>
                                            </span>
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                            <span className="large-stocksHeaderQuoteSectionLineFigure">
                                                {quoteData["quote"]["dataLoading"] || quoteData["quote"]["data"][quoteTypeSelection] === undefined ?
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                            style={{"textAlign": "right"}}
                                                        >
                                                        {generalOpx.formatLargeFigures(pageData["page"]["data"]["quantityYes"], 2)}
                                                    </p>
                                                }
                                            </span>
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        </div>
                                    </div>

                                    <div className="large-stocksHeaderQuoteSectionDivider"/>

                                    <div className="large-stocksHeaderQuoteSection">
                                        <div className="large-stocksHeaderQuoteSectionLine">
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                            <span className="large-stocksHeaderQuoteSectionLineDesc">
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock">
                                                    Liquidity
                                                </p>
                                            </span>
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                            <span className="large-stocksHeaderQuoteSectionLineFigure">
                                                {quoteData["quote"]["dataLoading"] || quoteData["quote"]["data"][quoteTypeSelection] === undefined ?
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                            style={{"textAlign": "right"}}
                                                        >
                                                        {generalOpx.formatLargeFigures(pageData["page"]["data"]["costFunction"], 2)}
                                                    </p>
                                                }
                                            </span>
                                        </div>
                                        <div className="large-stocksHeaderQuoteSectionLine">
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                            <span className="large-stocksHeaderQuoteSectionLineDesc">
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock">
                                                    No Holders
                                                </p>
                                            </span>
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                            <span className="large-stocksHeaderQuoteSectionLineFigure">
                                                {quoteData["quote"]["dataLoading"] || quoteData["quote"]["data"][quoteTypeSelection] === undefined ?
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                            style={{"textAlign": "right"}}
                                                        >
                                                        {generalOpx.formatLargeFigures(pageData["page"]["data"]["participantsNo"], 2)}
                                                    </p>
                                                }
                                            </span>
                                        </div>
                                        <div className="large-stocksHeaderQuoteSectionLine">
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                            <span className="large-stocksHeaderQuoteSectionLineDesc">
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock">
                                                    Yes Holders
                                                </p>
                                            </span>
                                            <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                            <span className="large-stocksHeaderQuoteSectionLineFigure">
                                                {quoteData["quote"]["dataLoading"] || quoteData["quote"]["data"][quoteTypeSelection] === undefined ?
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                    <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                            style={{"textAlign": "right"}}
                                                        >
                                                        {generalOpx.formatLargeFigures(pageData["page"]["data"]["participantsYes"], 2)}
                                                    </p>
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div 
                                    className="homeAsset-ChartContainer_divider"
                                    style={{"marginTop": "12px"}}
                                />
                            </> : null
                        }
                        <div className="homeAsset-ChartContainer">
                            {pageData["page"]["dataLoading"] || advancedChart === null ?
                                null: 
                                advancedChart
                            }
                        </div>
                        <div 
                            className="homeAsset-ChartContainer_divider"
                        />
                    </div>
                    <div className="home-preYourPositionPredictiveQuestionContainer">
                        <div className="home-preYourPositionPredictiveQuestionOutcomeDesc">
                            Outcome:&nbsp;
                            {pageData["page"]["dataLoading"] ?
                                <div className="home-preYourPositionPredictiveQuestionOutcomeDescLoading"/> :
                                <>
                                    {pageData["page"]["data"]["outcome"] === "" ? null : `${pageData["page"]["data"]["outcome"]}, `}{props.selection === "yes" ? "Yes" : "No"}
                                </>
                            }
                            
                        </div>
                        {pageData["page"]["dataLoading"] ?
                            <div className="home-preYourPositionPredictiveQuestionDescLoading"/>:
                            <div className="home-preYourPositionPredictiveQuestionDesc">{pageData["page"]["data"]["predictiveQuestion"]}</div>
                        }
                    </div>
                    {u_marketHoldings.some(hlding_desc => hlding_desc.marketId === props.marketId) 
                        && u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0][`${props.selection}Quantity`] > 0
                        && !quoteData["quote"]["dataLoading"] && quoteData["quote"]["data"][quoteTypeSelection] !== undefined ?
                        <div className="home-yourPositionContainer" style={{"borderBottom": "none"}}>
                            <div className="home-yourPositionHeader">
                                Your Position
                            </div>
                            <div className="home-yourPositionBody">
                                <div className="home-yourPos_activitySummaryContainer">
                                    <div className="miniaturized-activitySummarySummarySection">
                                        <div className="miniaturized-activitySummarySectionHeader" style={{"fontSize": "0.95rem"}}>Shares</div>
                                        <div className="miniaturized-activitySummarySectionDesc" style={{"fontSize": "0.95rem"}}>
                                            {props.selection === "yes" ?
                                                <>
                                                    {generalOpx.formatFigures.format(u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesQuantity"])}
                                                </> : 
                                                <>
                                                    {generalOpx.formatFigures.format(u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noQuantity"])}
                                                </>
                                            }
                                            <button className="yourPosition-viewChainsBtn"
                                                    onClick={() => viewChainsToggle()}
                                                >
                                                <LinkSharp className="yourPosition-viewChainsBtnIcon"/> {viewChains ? `Hide` : `View`} Chains
                                            </button>
                                        </div>
                                    </div>
                                    <div className="home-yourPositionChainByChainBreakdown"
                                            style={viewChains ? 
                                                {"maxHeight": "1000px"} : {}
                                            }
                                        >
                                        {props.selection === "yes" ?
                                            <>
                                                {u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesQuantityDesc"].map((q_desc, index) => (
                                                        <div className="home-yourPositionChainByChainLine">
                                                            <span style={{"width": "30%"}}>Chain&nbsp;&nbsp;{q_desc[0]}</span>
                                                            <span>
                                                                Shares&nbsp;&nbsp;
                                                                <span style={{"color": "var(--primary-bg-01)"}}>
                                                                    {generalOpx.formatFigures.format(q_desc[1])}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    ))
                                                }
                                            </> : 
                                            <>
                                                {u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noQuantityDesc"].map((q_desc, index) => (
                                                        <div className="home-yourPositionChainByChainLine">
                                                            <span style={{"width": "30%"}}>Chain&nbsp;&nbsp;{q_desc[0]}</span>
                                                            <span>
                                                                Shares&nbsp;&nbsp;
                                                                <span style={{"color": "var(--primary-bg-01)"}}>
                                                                    {generalOpx.formatFigures.format(q_desc[1])}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    ))
                                                }
                                            </>
                                        }
                                    </div>
                                    <div className="home-yourPositionEquityDesc" style={{"marginTop": "12px"}}>
                                        <div className="miniaturized-activitySummarySummarySection"
                                                style={{"width": "50%", "minWidth": "50%", "maxWidth": "50%"}}
                                            >
                                            <div className="miniaturized-activitySummarySectionHeader" style={{"fontSize": "0.95rem"}}>Avg. Cost</div>
                                            <div className="miniaturized-activitySummarySectionDesc" style={{"fontSize": "0.95rem"}}>
                                                {props.selection === "yes" ?
                                                    <>
                                                        {generalOpx.formatFigures.format(u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesAveragePrice"])} FINUX
                                                    </> : 
                                                    <>
                                                        {generalOpx.formatFigures.format(u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noAveragePrice"])} FINUX
                                                    </>
                                                }
                                            </div>
                                        </div>
                                        <div className="miniaturized-activitySummarySummarySection"
                                                style={{"width": "50%", "minWidth": "50%", "maxWidth": "50%"}}
                                            >
                                            <div className="miniaturized-activitySummarySectionHeader" style={{"fontSize": "0.95rem"}}>Equity</div>
                                            <div className="miniaturized-activitySummarySectionDesc" style={{"fontSize": "0.95rem"}}>
                                                {props.selection === "yes" ?
                                                    <>
                                                        {generalOpx.formatFiguresCrypto.format(
                                                            u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesQuantity"] * quoteData["quote"]["data"]["yes"]["close"]
                                                        )} FINUX
                                                    </> : 
                                                    <>
                                                        {generalOpx.formatFiguresCrypto.format(
                                                            u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noQuantity"] * quoteData["quote"]["data"]["no"]["close"]
                                                        )} FINUX
                                                    </>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="home-yourPositionGainSummary">
                                    Today
                                    <div className="home-yourPositionGainFigures">
                                        {(getUnixTime(today) - 86400) <= u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["boughtTimestamp"] ?
                                            <>
                                                {props.selection === "yes" ?
                                                    <>
                                                        {(quoteData["quote"]["data"]["yes"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesAveragePrice"]) >= 0 ?
                                                            `+` : `-`
                                                        }&nbsp;
                                                        {
                                                            generalOpx.formatFiguresCrypto.format(
                                                                Math.abs(
                                                                    u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesQuantity"] *
                                                                    (quoteData["quote"]["data"]["yes"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesAveragePrice"])
                                                                )
                                                            )
                                                        }
                                                    </> :
                                                    <>
                                                        {(quoteData["quote"]["data"]["no"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noAveragePrice"]) >= 0 ?
                                                            `+` : `-`
                                                        }&nbsp;
                                                        {
                                                            generalOpx.formatFiguresCrypto.format(
                                                                Math.abs(
                                                                    u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noQuantity"] *
                                                                    (quoteData["quote"]["data"]["no"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noAveragePrice"])
                                                                )
                                                            )
                                                        }
                                                    </>
                                                }
                                            </> : 
                                            <>
                                                {props.selection === "yes" ?
                                                    <>
                                                        {(quoteData["quote"]["data"]["yes"]["close"] - quoteData["quote"]["data"]["yes"]["open"]) >= 0 ?
                                                            `+` : `-`
                                                        }&nbsp;
                                                        {
                                                            generalOpx.formatFiguresCrypto.format(
                                                                Math.abs(
                                                                    u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesQuantity"] *
                                                                    (quoteData["quote"]["data"]["yes"]["close"] - quoteData["quote"]["data"]["yes"]["open"])
                                                                )
                                                            )
                                                        }
                                                    </> :
                                                    <>
                                                        {(quoteData["quote"]["data"]["no"]["close"] - quoteData["quote"]["data"]["no"]["open"]) >= 0 ?
                                                            `+` : `-`
                                                        }&nbsp;
                                                        {
                                                            generalOpx.formatFiguresCrypto.format(
                                                                Math.abs(
                                                                    u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noQuantity"] *
                                                                    (quoteData["quote"]["data"]["no"]["close"] - quoteData["quote"]["data"]["no"]["open"])
                                                                )
                                                            )
                                                        }
                                                    </>
                                                }
                                            </>
                                        }&nbsp;&nbsp;&nbsp;
                                        <span style={{"fontWeight": "normal", "color": "var(--primary-bg-05)"}}>
                                            {`(`}
                                            {(getUnixTime(today) - 86400) <= u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["boughtTimestamp"] ?
                                                <>
                                                    {props.selection === "yes" ?
                                                        <>
                                                            {(quoteData["quote"]["data"]["yes"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesAveragePrice"]) >= 0 ?
                                                                `+` : `-`
                                                            }
                                                            {
                                                                generalOpx.formatFiguresCrypto.format(
                                                                    Math.abs(
                                                                        (quoteData["quote"]["data"]["yes"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesAveragePrice"]) 
                                                                        / 
                                                                        u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesAveragePrice"]
                                                                    )
                                                                )
                                                            }
                                                        </> :
                                                        <>
                                                            {(quoteData["quote"]["data"]["no"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noAveragePrice"]) >= 0 ?
                                                                `+` : `-`
                                                            }
                                                            {
                                                                generalOpx.formatFiguresCrypto.format(
                                                                    Math.abs(
                                                                        (quoteData["quote"]["data"]["no"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noAveragePrice"])
                                                                        /
                                                                        u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noAveragePrice"]
                                                                    )
                                                                )
                                                            }
                                                        </>
                                                    }
                                                </> : 
                                                <>
                                                    {props.selection === "yes" ?
                                                        <>
                                                            {(quoteData["quote"]["data"]["yes"]["close"] - quoteData["quote"]["data"]["yes"]["open"]) >= 0 ?
                                                                `+` : `-`
                                                            }
                                                            {
                                                                generalOpx.formatFiguresCrypto.format(
                                                                    Math.abs(
                                                                        (quoteData["quote"]["data"]["yes"]["close"] - quoteData["quote"]["data"]["yes"]["open"]) 
                                                                        /
                                                                        quoteData["quote"]["data"]["yes"]["open"]
                                                                    )
                                                                )
                                                            }
                                                        </> :
                                                        <>
                                                            {(quoteData["quote"]["data"]["no"]["close"] - quoteData["quote"]["data"]["no"]["open"]) >= 0 ?
                                                                `+` : `-`
                                                            }
                                                            {
                                                                generalOpx.formatFiguresCrypto.format(
                                                                    Math.abs(
                                                                        (quoteData["quote"]["data"]["no"]["close"] - quoteData["quote"]["data"]["no"]["open"])
                                                                        /
                                                                        quoteData["quote"]["data"]["no"]["open"]
                                                                    )
                                                                )
                                                            }
                                                        </>
                                                    }
                                                </>
                                            }
                                            {`%)`}
                                        </span>
                                    </div>
                                </div>
                                <div className="home-yourPositionGainSummary" style={{"marginTop": "12px"}}>
                                    Total Return
                                    <div className="home-yourPositionGainFigures">
                                        {props.selection === "yes" ?
                                            <>
                                                {(u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesQuantity"] *
                                                    (quoteData["quote"]["data"]["yes"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesAveragePrice"]))
                                                    + u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["earnings"] >= 0 ?
                                                    `+` : `-`
                                                }&nbsp;
                                                {
                                                    generalOpx.formatFiguresCrypto.format(
                                                        Math.abs(
                                                            (u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesQuantity"] *
                                                            (quoteData["quote"]["data"]["yes"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesAveragePrice"]))
                                                            + u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["earnings"]
                                                        )
                                                    )
                                                }
                                            </> :
                                            <>
                                                {(u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noQuantity"] *
                                                    (quoteData["quote"]["data"]["no"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noAveragePrice"]))
                                                    + u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["earnings"] >= 0 ?
                                                    `+` : `-`
                                                }&nbsp;
                                                {
                                                    generalOpx.formatFiguresCrypto.format(
                                                        Math.abs(
                                                            (u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noQuantity"] *
                                                            (quoteData["quote"]["data"]["no"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noAveragePrice"]))
                                                            + u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["earnings"]
                                                        ) 
                                                    )
                                                }
                                            </>
                                        }&nbsp;&nbsp;&nbsp;
                                        <span style={{"fontWeight": "normal", "color": "var(--primary-bg-05)"}}>
                                            {`(`}
                                            {props.selection === "yes" ?
                                                <>
                                                    {(quoteData["quote"]["data"]["yes"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesAveragePrice"]) >= 0 ?
                                                        `+` : `-`
                                                    }
                                                    {
                                                        generalOpx.formatFiguresCrypto.format(
                                                            Math.abs(
                                                                (quoteData["quote"]["data"]["yes"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesAveragePrice"]) 
                                                                / 
                                                                u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["yesAveragePrice"]
                                                            )
                                                        )
                                                    }
                                                </> :
                                                <>
                                                    {(quoteData["quote"]["data"]["no"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noAveragePrice"]) >= 0 ?
                                                        `+` : `-`
                                                    }
                                                    {
                                                        generalOpx.formatFiguresCrypto.format(
                                                            Math.abs(
                                                                (quoteData["quote"]["data"]["no"]["close"] - u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noAveragePrice"])
                                                                /
                                                                u_marketHoldings.filter(hlding_desc => hlding_desc.marketId === props.marketId)[0]["noAveragePrice"]
                                                            )
                                                        )
                                                    }
                                                </>
                                            }
                                            {`%)`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div> : null  
                    }
                    <div className="large-stocksPageMoreDataAboutContainer" style={{"position": "relative", "paddingTop": "0px"}}>
                        <div className="large-stocksPageMoreDataAboutTitle">
                            Rules
                            {descriptionExpanded ?
                                <button className="large-stocksPageMoreDataAboutTitleExpander"
                                        onClick={() => descriptionVisibilityToggle()}
                                    >
                                    <Expand className="large-stocksPageMoreDataAboutTitleExpanderIcon"/>
                                </button> : null
                            }
                        </div>
                        
                        {descriptionHidden ?
                            <div className="large-stocksPageMoreDataAboutBody">
                                <div className="large-stocksPageMoreDataAboutBodyDesc" ref={descriptionRef}>
                                    {pageData["page"]["data"]["rules"]}
                                </div>
                            </div> : 
                            <div className="large-stocksPageMoreDataAboutBodyExpanded">
                                {pageData["page"]["data"]["rules"]}
                            </div>
                        }
                    </div>
                    <div className="home-yourPositionContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                        <div className="home-yourPositionHeader">
                            Top Holders
                        </div>
                        <div className="home-yourPositionBody" style={{"flexDirection": "row"}}>
                            <div className="home-topHoldersSection">
                                <div className="home-topHoldersHeader">Yes Holders</div>
                                {marketFineDetails["dataLoading"] ?
                                    <div className="home-topHoldersLineContainer">
                                        <div className="home-topHoldersLineImgContainer">
                                            <div className="home-topHoldersLineImgLoading"/>
                                            <div className="home-topHoldersLineRankIndex">
                                                1
                                            </div>
                                        </div>
                                        <div className="home-topHoldersLineDescContainer">
                                            <div className="home-topHoldersLineSharesDescLoading"/>
                                            <div className="home-topHoldersLineUsernameDescLoading"/>
                                        </div>
                                    </div> : 
                                    <>
                                        {marketFineDetails["topHolders"]["yes"].length === 0 ?
                                            <div className="home-marketTvNoTradingActivityContainer"
                                                    style={{
                                                        "width": "80%", "minWidth": "80%", "maxWidth": "80%"
                                                    }}
                                                >
                                                <div className="prediction-noTradingStatusInfoGraphicContainer">
                                                    <Check className="prediction-noTradingStatusInfoGraphicIcon"/>
                                                </div>
                                                <div className="prediction-noTradingStatusInfoTopLine">Ø Yes Bags</div>
                                            </div> :
                                            <>
                                                {marketFineDetails["topHolders"]["yes"].filter(pre_desc => pre_desc["yesQuantity"] > 0).map((desc, index) => (
                                                        <div className="home-topHoldersLineContainer" key={`top-yes-holdings-${index}`}
                                                                style={index === marketFineDetails["topHolders"]["yes"].length - 1 ? {"paddingBottom": "0px"} : {}}
                                                            >
                                                            <div className="home-topHoldersLineImgContainer">
                                                                {marketFineDetails["topHolders"]["holders"].some(mFD_desc => mFD_desc["username"] === desc["username"]) ?
                                                                    <>
                                                                        {marketFineDetails["topHolders"]["holders"].filter(mFD_desc => mFD_desc["username"] === desc["username"])[0]["profilePicture"] === "" ?
                                                                            <div className="prediction-profileImgEmpty"
                                                                                    style={generalOpx.profilePictureGradients[index % 5]}
                                                                                >
                                                                                <img src="/assets/Favicon.png" alt="" 
                                                                                    className="large-homePageHeaderProfileImgNonUser"
                                                                                    style={{"top": "calc(50% - 8px)", "left": "calc(50% - 8px)"}}
                                                                                />
                                                                            </div> : 
                                                                            <img src={marketFineDetails["topHolders"]["holders"].filter(mFD_desc => mFD_desc["username"] === desc["username"])[0]["profilePicture"]} alt="" className="home-topHoldersLineImg" />
                                                                        }
                                                                    </> :
                                                                    <div className="prediction-profileImgEmpty"
                                                                            style={generalOpx.profilePictureGradients[index % 5]}
                                                                        >
                                                                        <img src="/assets/Favicon.png" alt="" 
                                                                            className="large-homePageHeaderProfileImgNonUser"
                                                                            style={{"top": "calc(50% - 8px)", "left": "calc(50% - 8px)"}}
                                                                        />
                                                                    </div>
                                                                }
                                                                <div className="home-topHoldersLineRankIndex">
                                                                    {index + 1}
                                                                </div>
                                                            </div>
                                                            <div className="home-topHoldersLineDescContainer">
                                                                <div className="home-topHoldersLineSharesDesc">
                                                                    {generalOpx.formatLargeFigures(desc["yesQuantity"], 2)}
                                                                </div>
                                                                <div className="home-topHoldersLineUsernameDesc">{desc["username"]}</div>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </>
                                        }
                                    </>
                                }
                            </div>
                            <div className="home-topHoldersSection" style={{"marginLeft": "32px"}}>
                                <div className="home-topHoldersHeader">No Holders</div>
                                {marketFineDetails["dataLoading"] ?
                                    <div className="home-topHoldersLineContainer">
                                        <div className="home-topHoldersLineImgContainer">
                                            <div className="home-topHoldersLineImgLoading"/>
                                            <div className="home-topHoldersLineRankIndex">
                                                1
                                            </div>
                                        </div>
                                        <div className="home-topHoldersLineDescContainer">
                                            <div className="home-topHoldersLineSharesDescLoading"/>
                                            <div className="home-topHoldersLineUsernameDescLoading"/>
                                        </div>
                                    </div> : 
                                    <>
                                        {marketFineDetails["topHolders"]["no"].length === 0 ?
                                            <div className="home-marketTvNoTradingActivityContainer"
                                                    style={{
                                                        "width": "80%", "minWidth": "80%", "maxWidth": "80%"
                                                    }}
                                                >
                                                <div className="prediction-noTradingStatusInfoGraphicContainer">
                                                    <Close className="prediction-noTradingStatusInfoGraphicIcon"/>
                                                </div>
                                                <div className="prediction-noTradingStatusInfoTopLine">Ø No Bags</div>
                                            </div> : 
                                            <>
                                                {marketFineDetails["topHolders"]["no"].filter(pre_desc => pre_desc["noQuantity"] > 0).map((desc, index) => (
                                                        <div className="home-topHoldersLineContainer" key={`top-no-holdings-${index}`}
                                                                style={index === marketFineDetails["topHolders"]["no"].length - 1 ? {"paddingBottom": "0px"} : {}}
                                                            >
                                                            <div className="home-topHoldersLineImgContainer">
                                                                {marketFineDetails["topHolders"]["holders"].some(mFD_desc => mFD_desc["username"] === desc["username"]) ?
                                                                    <>
                                                                        {marketFineDetails["topHolders"]["holders"].filter(mFD_desc => mFD_desc["username"] === desc["username"])[0]["profilePicture"] === "" ?
                                                                            <div className="prediction-profileImgEmpty"
                                                                                    style={generalOpx.profilePictureGradients[index % 5]}
                                                                                >
                                                                                <img src="/assets/Favicon.png" alt="" 
                                                                                    className="large-homePageHeaderProfileImgNonUser"
                                                                                    style={{"top": "calc(50% - 8px)", "left": "calc(50% - 8px)"}}
                                                                                />
                                                                            </div> : 
                                                                            <img src={marketFineDetails["topHolders"]["holders"].filter(mFD_desc => mFD_desc["username"] === desc["username"])[0]["profilePicture"]} alt="" className="home-topHoldersLineImg" />
                                                                        }
                                                                    </> :
                                                                    <div className="prediction-profileImgEmpty"
                                                                            style={generalOpx.profilePictureGradients[index % 5]}
                                                                        >
                                                                        <img src="/assets/Favicon.png" alt="" 
                                                                            className="large-homePageHeaderProfileImgNonUser"
                                                                            style={{"top": "calc(50% - 8px)", "left": "calc(50% - 8px)"}}
                                                                        />
                                                                    </div>
                                                                }
                                                                <div className="home-topHoldersLineRankIndex">
                                                                    {index + 1}
                                                                </div>
                                                            </div>
                                                            <div className="home-topHoldersLineDescContainer">
                                                                <div className="home-topHoldersLineSharesDesc" style={{"color": "var(--primary-red-09)"}}>
                                                                    {generalOpx.formatLargeFigures(desc["noQuantity"], 2)}
                                                                </div>
                                                                <div className="home-topHoldersLineUsernameDesc">{desc["username"]}</div>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </>
                                        }
                                    </>
                                }
                            </div>
                        </div>
                    </div>
                    <div className="home-yourPositionContainer">
                        <div className="home-yourPositionHeader">
                            Activity
                            <div className="large-stocksNewsViewToggleInnerContainer"
                                    style={{"position": "absolute", "top": "-2.5px", "right": "0", "margin": "0"}}
                                >
                                {marketFineDetails["dataLoading"] ?
                                    null :
                                    <>
                                        <button className="large-stocksNewsViewToggleOutline" 
                                                disabled={activityBeingUpdated}
                                                onClick={() => activityViewToggle("back")}
                                                style={marketFineDetails["activity"]["index"] === 0 ? {"display": "none"} : {"display": "flex"}}
                                            >
                                            <ChevronLeft className="large-stocksNewsViewToggleOutlineIcon"/>
                                        </button>
                                        <div className="large-stocksNewsViewToggleOutlineDivider" 
                                            style={
                                                {
                                                    "marginLeft": "10px", 
                                                    "marginRight": "10px",
                                                    "display": marketFineDetails["activity"]["index"] === 0 && ((marketFineDetails["activity"]["index"] + 1) * 5) >= marketFineDetails["activity"]["dataCount"] ? "none" : "flex"
                                                }
                                            }
                                        />
                                        <button className="large-stocksNewsViewToggleOutline" 
                                                disabled={activityBeingUpdated}
                                                onClick={() => activityViewToggle("forward")}
                                                style={((marketFineDetails["activity"]["index"] + 1) * 5) >= marketFineDetails["activity"]["dataCount"] ? 
                                                    {"display": "none"} : {"display": "flex"}
                                                }
                                            >
                                            <ChevronRight className="large-stocksNewsViewToggleOutlineIcon"/>
                                        </button>
                                    </>
                                }
                            </div>
                        </div>
                        <div className="home-yourPositionBody">
                            <div className="home-activityHeader">
                                <div className="home-activityTrader">
                                    <span className="home-activityHeaderDesc">Trader</span>
                                </div>
                                <div className="home-activityAction">
                                    <span className="home-activityHeaderDesc">Action</span>
                                </div>
                                <div className="home-activityPrice">
                                    <span className="home-activityHeaderDesc">Shares</span>
                                </div>
                                <div className="home-activityPrice">
                                    <span className="home-activityHeaderDesc">Price</span>
                                </div>
                                <div className="home-activityPrice">
                                    <span className="home-activityHeaderDesc">Time</span>
                                </div>
                            </div>
                            {marketFineDetails["dataLoading"] ?
                                <>
                                    {Array(5).fill(null).map((a, b) => (
                                            <div className="home-activityBody" key={`activity-history-loading-${b}`}>
                                                <div className="home-activityTrader">
                                                    <div className="home-topHoldersLineImgLoading"/>
                                                    <div className="home-activityTraderUserDescContainer">
                                                        <span className="home-activityDescLoading"/>
                                                    </div>
                                                </div>
                                                <div className="home-activityAction">
                                                    <span className="home-activityDescLoading"/>
                                                </div>
                                                <div className="home-activityPrice">
                                                    <span className="home-activityDescLoading"/>
                                                </div>
                                                <div className="home-activityPrice">
                                                    <span className="home-activityDescLoading"/>
                                                </div>
                                                <div className="home-activityPrice">
                                                    <span className="home-activityDescLoading"/>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </> : 
                                <>
                                    {marketFineDetails["activity"]["data"].length === 0 ? 
                                        <div className="home-marketTvNoTradingActivityContainer">
                                            <div className="prediction-noTradingStatusInfoGraphicContainer">
                                                <QueryStats className="prediction-noTradingStatusInfoGraphicIcon"/>
                                            </div>
                                            <div className="prediction-noTradingStatusInfoTopLine">No activity so far</div>
                                            <div className="prediction-noTradingStatusInfoSecondLine">No purchases or sales have been finalized.</div>
                                        </div> : 
                                        <>
                                            {marketFineDetails["activity"]["data"].slice((marketFineDetails["activity"]["index"] * 5), ((marketFineDetails["activity"]["index"] + 1) * 5)).map((act_desc, index) => (
                                                    <div className="home-activityBody" key={`activity-history-${act_desc["_id"]}`}>
                                                        <div className="home-activityTrader">
                                                            {marketFineDetails["activity"]["activeUsers"].some(mFD_desc => mFD_desc["username"] === act_desc["username"]) ?
                                                                <>
                                                                    {marketFineDetails["activity"]["activeUsers"].filter(mFD_desc => mFD_desc["username"] === act_desc["username"])[0]["profilePicture"] === "" ?
                                                                        <div className="prediction-profileImgEmpty"
                                                                                style={generalOpx.profilePictureGradients[index % 5]}
                                                                            >
                                                                            <img src="/assets/Favicon.png" alt="" 
                                                                                className="large-homePageHeaderProfileImgNonUser"
                                                                                style={{"top": "calc(50% - 8px)", "left": "calc(50% - 8px)"}}
                                                                            />
                                                                        </div> : 
                                                                        <img src={marketFineDetails["activity"]["activeUsers"].filter(mFD_desc => mFD_desc["username"] === act_desc["username"])[0]["profilePicture"]} alt="" className="home-topHoldersLineImg" />
                                                                    }
                                                                </> :
                                                                <div className="prediction-profileImgEmpty"
                                                                        style={generalOpx.profilePictureGradients[index % 5]}
                                                                    >
                                                                    <img src="/assets/Favicon.png" alt="" 
                                                                        className="large-homePageHeaderProfileImgNonUser"
                                                                        style={{"top": "calc(50% - 8px)", "left": "calc(50% - 8px)"}}
                                                                    />
                                                                </div>
                                                            }
                                                            <div className="home-activityTraderUserDescContainer">
                                                                <span className="home-activityDesc">{act_desc["username"]}</span>
                                                            </div>
                                                        </div>
                                                        <div className="home-activityAction">
                                                            <span className="home-activityDesc"
                                                                    style={act_desc["action"] === "buy" ? {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}}
                                                                >
                                                                {act_desc["action"]}
                                                            </span>
                                                        </div>
                                                        <div className="home-activityPrice">
                                                            <span className="home-activityDesc">{generalOpx.formatLargeFigures(act_desc["quantity"], 2)}</span>
                                                        </div>
                                                        <div className="home-activityPrice">
                                                            <span className="home-activityDesc">{generalOpx.formatFigures.format(act_desc["averagePrice"])} FINUX</span>
                                                        </div>
                                                        <div className="home-activityPrice">
                                                            <span className="home-activityDesc">{format(act_desc["openedTimestamp"] * 1000)}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </>
                                    }
                                </>
                            }
                        </div>
                    </div>


                    <div className="home-predictionDisscussionContainer" style={{"paddingBottom": "50px"}}>

                        <div className="home-predictionMakeCommentBody">
                            {pageData["page"]["dataLoading"] ?
                                null : 
                                <div className="post-makeCommentInputBox">
                                    <FinulabComment type={"main"} commFor={"prediction"} location={"home"} 
                                        desc={{"predictionId": pageData["page"]["data"]["predictionId"], "predType": Object.keys(pageData["page"]["data"]).includes("outcomesMap") ? "categorical" : "y-n", "groupId": pageData["page"]["data"]["groupId"]}}
                                    />
                                </div>
                            }
                            {!pageData["page"]["dataLoading"] && !comments["dataLoading"] && comments["type"] === "prediction" && comments["_id"] === pageData["page"]["data"]["predictionId"] ?
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
                                                                            location={"home"}
                                                                            desc={
                                                                                {
                                                                                    "predictionId": pageData["page"]["data"]["predictionId"], 
                                                                                    "predType": Object.keys(pageData["page"]["data"]).includes("outcomesMap") ? "categorical" : "y-n",
                                                                                    "groupId": pageData["page"]["data"]["groupId"], 
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
                                                                                        "predictionId": pageData["page"]["data"]["predictionId"], 
                                                                                        "predType": Object.keys(pageData["page"]["data"]).includes("outcomesMap") ? "categorical" : "y-n",
                                                                                        "groupId": pageData["page"]["data"]["groupId"],
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
                                                                                        "predictionId": pageData["page"]["data"]["predictionId"], 
                                                                                        "predType": Object.keys(pageData["page"]["data"]).includes("outcomesMap") ? "categorical" : "y-n",
                                                                                        "groupId": pageData["page"]["data"]["groupId"],
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
                                                                                        "predictionId": pageData["page"]["data"]["predictionId"], 
                                                                                        "predType": Object.keys(pageData["page"]["data"]).includes("outcomesMap") ? "categorical" : "y-n",
                                                                                        "groupId": pageData["page"]["data"]["groupId"],
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
                    {contentBodyWidth[1] === true ?
                        <div className="large-homePageContentCreateWrapper" 
                                style={
                                    {
                                        ...{"width": `${contentBodyWidth[0]}px`, "minWidth": `${contentBodyWidth[0]}px`, "maxWidth": `${contentBodyWidth[0]}px`},
                                        ...{
                                            "bottom": props.v_display ? "60px": "0px"
                                        }
                                    }
                                }
                            >
                            {/*appState["profile"]["visible"] ? 
                                {
                                    ...{"width": `${contentBodyWidth[0] - 20}px`, "minWidth": `${contentBodyWidth[0] - 20}px`, "maxWidth": `${contentBodyWidth[0] - 20}px`},
                                    
                                }
                                {"marginLeft": `${contentBodyWidth[0] - 110}px`, "backgroundColor": "rgba(0, 110, 230, 0.85)"} :
                                {"marginLeft": `${contentBodyWidth[0] - 110}px`, "backgroundColor": "rgba(0, 110, 230, 0.05)"}
                                ...{"borderTop": "solid 1px var(--primary-bg-08)"}
                            */}
                            <div className="home-ovrlUnderlineOptnsMarketLiquidityDesc">
                                <div className="home-ovrlUnderlineOptnsMarketLiqudityTopDesc">Liquidity</div>
                                {quoteData["quote"]["dataLoading"] || quoteData["quote"]["data"][quoteTypeSelection] === undefined ?
                                    <div className="home-ovrlUnderlineOptnsMarketLiquidityBottomDesc"/> :
                                    <div className="home-ovrlUnderlineOptnsMarketLiquidityBottomDesc">
                                        {generalOpx.formatLargeFigures(pageData["page"]["data"]["costFunction"], 2)} FINUX
                                    </div>
                                }
                            </div>
                            <div className="home-ovrlUnderlineMarketTradeContainer">
                                {pageData["page"]["data"]["status"] === "live" ?
                                    <button className="home-ovrlUnderlineMarketTradeBtn"
                                            onClick={() => quickPurchaseDescSet(props.selection)}
                                        >
                                        Trade
                                    </button> : 
                                    <>
                                        <div className="home-marketTvStatusNotice">
                                            {pageData["page"]["data"]["status"] === "in-review" ?
                                                <span>Status: <span style={{"fontWeight": "500", "color": "var(--primary-bg-01)"}}>In Review</span></span> : 
                                                <>
                                                    {pageData["page"]["data"]["status"] === "denied" ?
                                                        <span>Status: <span style={{"fontWeight": "500", "color": "var(--primary-bg-01)"}}>Market Unavailable</span></span> :
                                                        <>
                                                            {pageData["page"]["data"]["status"] === "ended" ?
                                                                <span>Status: <span style={{"fontWeight": "500", "color": "var(--primary-bg-01)"}}>Market Closed</span></span> : 
                                                                <>
                                                                    {pageData["page"]["data"]["status"] === "resolved" 
                                                                        && pageData["page"]["data"]["resolved"] ?
                                                                        <span>Resolution: <span style={{"fontWeight": "500", "color": "var(--primary-bg-01)"}}>{pageData["page"]["data"]["resolutionOutcome"] === "yes" ? "Yes" : "No"}</span></span> : null
                                                                    }
                                                                </>
                                                            }
                                                        </>
                                                    }
                                                </>
                                            }
                                        </div>
                                    </>
                                }
                            </div>
                        </div> : null
                    }
                </div>
            }
        </div>
    )
}