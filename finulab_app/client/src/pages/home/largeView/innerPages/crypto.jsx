import {debounce, throttle} from 'lodash';
import {getUnixTime} from 'date-fns';
import {useNavigate} from 'react-router-dom';
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
    ExpandMore
} from '@mui/icons-material';

import Post from '../../../../components/post';
import generalOpx from '../../../../functions/generalFunctions';
import PriceHistory from '../../../../components/priceHistory';
import MiniaturizedNews from '../../../../components/miniaturized/news/mini-news';
import RecommendationGraph from '../../../../components/recommendations';
import { CryptoChartContainer } from '../../../../components/cryptoChart/index';

import {selectUser} from '../../../../reduxStore/user';
import {selectModeratorStatus} from '../../../../reduxStore/moderatorStatus';
import {selectRecommendations, addToRecommendations} from '../../../../reduxStore/recommendations';
import {updateStockActiveDays, selectStockActiveDays} from '../../../../reduxStore/stockActiveDays';
import {selectWatchlist, addToWatchlist, removeFromWatchlist} from '../../../../reduxStore/watchlist';
import {updateStockQuote, updateStockPrice, selectStockQuote} from '../../../../reduxStore/stockQuote';
import {updateStockNews, updateStockNewsIndex, selectStockNews} from '../../../../reduxStore/stockNews';
import {updateHomePageWatchlist, selectHomePageWatchlist} from '../../../../reduxStore/homePageWatchlist';
import {updatePredictionPlotDataIndex, setPredictionPlotData} from '../../../../reduxStore/predictionPlotData';
import {setNewsEngagement, addToNewsEngagement, selectNewsEngagement} from '../../../../reduxStore/newsEngagement';
import {setPostEngagement, addToPostEngagement, selectPostEngagement} from '../../../../reduxStore/postEngagement';
import {setMarketHoldings, addToMarketHoldings, selectMarketHoldings} from '../../../../reduxStore/marketHoldings';
import {updateHomeFinancialScroll, selectHomeFinancialScrollState} from '../../../../reduxStore/homeFinancialScroll';
import {updateStockPageData, updateStockPagePosition, selectStockPageData} from '../../../../reduxStore/stockPageData';
import {setPredictionEngagement, addToPredictionEngagement, selectPredictionEngagement} from '../../../../reduxStore/predictionEngagement';
import {updateStockPredictions, updateStockPredictionsPosition, updateStockPredictionsSymbol, selectStockPredictions} from '../../../../reduxStore/stockPredictions';
import {setStockPageSelection, setStockPageSelectionSymbol, updateStockPageSelectionScrollTop, selectStockPageSelection} from '../../../../reduxStore/stockPageSelection';
import {updateStockPostsSymbol, updateStockPosts, updateStockPostsPosition, updateStockPostsProcessedHeights, processStockPostsHeights, clearStockPostsHeights, selectStockPosts} from '../../../../reduxStore/stockPosts';


export default function Crypto_Home(props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const user = useSelector(selectUser);
    const newsData = useSelector(selectStockNews);
    const quoteData = useSelector(selectStockQuote);
    const u_watchlist = useSelector(selectWatchlist);
    const stockPosts = useSelector(selectStockPosts);
    const pageData = useSelector(selectStockPageData);
    const u_postEngagement = useSelector(selectPostEngagement);
    const u_newsEngagement = useSelector(selectNewsEngagement);
    const u_marketHoldings = useSelector(selectMarketHoldings);
    const stockActiveDays = useSelector(selectStockActiveDays);
    const stockPredictions = useSelector(selectStockPredictions);
    const u_recommendations = useSelector(selectRecommendations);
    const u_moderatorStatus = useSelector(selectModeratorStatus);
    const homePageWatchlist = useSelector(selectHomePageWatchlist);
    const stockPageSelection = useSelector(selectStockPageSelection);
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
        const symbol = props.ticker;

        if(![...u_recommendations].some(rec => rec.symbol === symbol)) {
            const recommendation = await generalOpx.axiosInstance.put(`/stock-market-data/provided-recommendation`, {"symbol": symbol});
            if(recommendation.data["status"] === "success") {
                if(recommendation.data["recommendation"] !== "") {
                    dispatch(
                        addToRecommendations({"symbol": symbol, "recommendation": recommendation.data["recommendation"]})
                    );
                }
            }
        }

        await generalOpx.axiosInstance.put(`/crypto-market-data/description/${symbol}`).then(
            (response) => {
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

    const pullQuote = async () => {
        const symbol = props.ticker;

        await generalOpx.axiosInstance.put(`/crypto-market-data/quote`,
            {
                "symbol": symbol.slice(3, symbol.length)
            }
        ).then(
            (response) => {
                if(response.data["status"] === "success") {
                    dispatch(
                        updateStockQuote(
                            {
                                "data": response.data["data"], "dataLoading": false
                            }
                        )
                    );
                }
            }
        );
    }

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
            <CryptoChartContainer ticker={props.ticker} />
        );
        setAdvancedChart(tvWidget);
        pullSymbolData();
    }

    const scrollController = useRef();
    useMemo(() => {
        if(props.ticker !== undefined) {
            if(Object.keys(pageData["page"]["data"]).length === 0 && props.ticker.slice(0, 2) === "C:") {
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
        if(props.ticker !== undefined) {
            if(Object.keys(pageData["page"]["data"]).length > 0) {
                if(pageData["page"]["data"]["symbol"] !== props.ticker) {
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
                            <CryptoChartContainer ticker={props.ticker}/>
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

    useMemo(() => {
        if(Object.keys(quoteData["quote"]["data"]).length === 0) {
            pullQuote();
        }
    }, []);
    useEffect(() => {
        if(props.ticker !== undefined) {
            if(Object.keys(quoteData["quote"]["data"]).length > 0) {
                if(Object.keys(pageData["page"]["data"]).length > 0) {
                    if(pageData["page"]["data"]["symbol"] !== props.ticker) {
                        pullQuote();
                    }
                }
            }
        }
    }, [props]);

    const [stockNewsBeingUpdated, setStockNewsBeingUpdated] = useState(false);
    const pullNews = async (type, ninclude) => {
        let symbol = "";
        if(newsData["news"]["data"].length === 0 || ninclude.length === 0) {
            symbol = props.ticker;
        } else {
            newsData["news"]["data"][newsData["news"]["data"].length - 1][0]["symbol"] === "finulab-general" ? symbol = newsData["news"]["data"][0][0]["symbol"] : symbol = props.ticker;
        }

        await generalOpx.axiosInstance.put(`/content/news/assets/${symbol}`,
            {
                "ninclude": ninclude
            }
        ).then(
            async (response) => {
                if(response.data["status"] === "success") {
                    if(response.data["data"].length === 0) {
                        const moreNewsData = await generalOpx.axiosInstance.put(`/content/news/assets/finulab-general`, {"ninclude": ninclude});

                        if(moreNewsData.data["status"] === "success") {
                            let currentData = [];
                            type === "primary" ? currentData = [...moreNewsData.data["data"]] : currentData = [...newsData["news"]["data"]].concat(moreNewsData.data["data"]);

                            if(user && moreNewsData.data["data"].length > 0) {
                                if(u_newsEngagement.length === 0) {
                                    const newsIds = [...moreNewsData.data["data"]].flatMap(insideArr => insideArr.map(obj => `S:-${obj._id}`));
                                    const newsEngagements = await generalOpx.axiosInstance.put(`/content/news/news-engagements`, {"newsIds": newsIds});
    
                                    if(newsEngagements.data["status"] === "success" && newsEngagements.data["data"].length > 0) {
                                        dispatch(
                                            setNewsEngagement(newsEngagements.data["data"])
                                        );
                                    }
                                } else {
                                    const newsIdsToEliminate = [...u_newsEngagement.map(n_data => n_data.newsId)];
                                    const newsIdsInterlude = [...moreNewsData.data["data"]].flatMap(insideArr => insideArr.map(obj => `S:-${obj._id}`));
                                    const newsIds = [...newsIdsInterlude.filter(n_id => !newsIdsToEliminate.includes(n_id))];
    
                                    if(newsIds.length > 0) {
                                        const newsEngagements = await generalOpx.axiosInstance.put(`/content/news/news-engagements`, {"newsIds": newsIds});
                                        if(newsEngagements.data["status"] === "success" && newsEngagements.data["data"].length > 0) {
                                            dispatch(
                                                addToNewsEngagement(newsEngagements.data["data"])
                                            );
                                        }
                                    }
                                }
                            }

                            dispatch(
                                updateStockNews(
                                    {
                                        "data": currentData, "dataLoading": false
                                    }
                                )
                            );
                        }
                    } else {
                        let currentData = [];
                        type === "primary" ? currentData = [...response.data["data"]] : currentData = [...newsData["news"]["data"]].concat(response.data["data"]);
                        
                        if(user && response.data["data"].length > 0) {
                            if(u_newsEngagement.length === 0) {
                                const newsIds = [...response.data["data"]].flatMap(insideArr => insideArr.map(obj => `S:-${obj._id}`));
                                const newsEngagements = await generalOpx.axiosInstance.put(`/content/news/news-engagements`, {"newsIds": newsIds});

                                if(newsEngagements.data["status"] === "success" && newsEngagements.data["data"].length > 0) {
                                    dispatch(
                                        setNewsEngagement(newsEngagements.data["data"])
                                    );
                                }
                            } else {
                                const newsIdsToEliminate = [...u_newsEngagement.map(n_data => n_data.newsId)];
                                const newsIdsInterlude = [...response.data["data"]].flatMap(insideArr => insideArr.map(obj => `S:-${obj._id}`));
                                const newsIds = [...newsIdsInterlude.filter(n_id => !newsIdsToEliminate.includes(n_id))];

                                if(newsIds.length > 0) {
                                    const newsEngagements = await generalOpx.axiosInstance.put(`/content/news/news-engagements`, {"newsIds": newsIds});
                                    if(newsEngagements.data["status"] === "success" && newsEngagements.data["data"].length > 0) {
                                        dispatch(
                                            addToNewsEngagement(newsEngagements.data["data"])
                                        );
                                    }
                                }
                            }
                        }

                        dispatch(
                            updateStockNews(
                                {
                                    "data": currentData, "dataLoading": false
                                }
                            )
                        );
                    }
                }
            }
        );
    }
    const updateStockNewsView = async (type) => {
        const currentIndex = newsData["index"];

        if(type === "forward") {
            dispatch(
                updateStockNewsIndex(currentIndex + 1)
            );

            if(currentIndex % 2 === 0) {
                let ninclude = [];
                for(let i = 0; i < newsData["news"]["data"].length; i++) {
                    for(let j = 0; j < newsData["news"]["data"][i].length; j++) {
                        ninclude.push(newsData["news"]["data"][i][j]["_id"]);
                    }
                }

                setStockNewsBeingUpdated(true);
                pullNews("secondary", ninclude);
                setStockNewsBeingUpdated(false);
            }
        } else if(type === "back") {
            if(currentIndex !== 0) {
                dispatch(
                    updateStockNewsIndex(currentIndex - 1)
                );
            }
        }
    }

    useMemo(() => {
        if(newsData["news"]["data"].length === 0) {
            pullNews("primary", []);
        }
    }, []);
    useEffect(() => {
        if(props.ticker !== undefined) {
            if(newsData["news"]["data"].length > 0) {
                if(Object.keys(pageData["page"]["data"]).length > 0) {
                    if(pageData["page"]["data"]["symbol"] !== props.ticker) {
                        dispatch(
                            updateStockNews(
                                {
                                    "data": [], "dataLoading": true
                                }
                            )
                        );
                        dispatch(
                            updateStockNewsIndex(0)
                        );
    
                        pullNews("primary", []);
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
    
            const debouncedHandleScroll = throttle(handleScrollHomePage, 50);
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
    
            const debouncedHandleScroll = throttle(handleScrollHomePage, 50);
    
            const scrollElement = scrollController.current;
            scrollElement.addEventListener('scroll', debouncedHandleScroll, {passive: true});
    
            return () => {
                if(scrollElement) {
                    scrollElement.removeEventListener('scroll', debouncedHandleScroll);
                }
            };
        }
    }, []);

    const [homePagePostsBeingUpdated, setHomePagePostsBeingUpdated] = useState(false);
    const pullPosts = async (type, p_ninclude) => {
        if(type === "primary" || stockPosts["posts"]["data"].length < stockPosts["posts"]["dataCount"]) {
            await generalOpx.axiosInstance.put(`/content/posts/asset-posts`, 
                {
                    "type": type,
                    "limit": 4,
                    "idsToExclude": p_ninclude,
                    "asset": `${props.ticker}`
                }
            ).then(
                async (response) => {
                    if(response.data["status"] === "success") {
                        let currentData = {...stockPosts["posts"]};

                        if(type === "primary") {
                            let processedHeightsFunction = {
                                "postHeights": Array(response.data["data"].length).fill(0),
                                "processedRefs": {}
                            }
                            
                            
                            dispatch(
                                updateStockPostsProcessedHeights(processedHeightsFunction)
                            );

                            currentData = {
                                "data": response.data["data"],
                                "dataCount": response.data["dataCount"],
                                "dataLoading": false
                            }

                            if(user && response.data["data"].length > 0) {
                                if(u_postEngagement.length === 0) {
                                    const postIds = [...response.data["data"].map(p_data => p_data._id)];
                                    const postEngagements = await generalOpx.axiosInstance.put(`/content/posts/post-engagements`, {"postIds": postIds});

                                    if(postEngagements.data["status"] === "success" && postEngagements.data["data"].length > 0) {
                                        dispatch(
                                            setPostEngagement(postEngagements.data["data"])
                                        );
                                    }
                                } else {
                                    const postIdsToEliminate = [...u_postEngagement.map(p_data => p_data.postId)];
                                    const postIds = [...response.data["data"].filter(({_id}) => !postIdsToEliminate.includes(_id)).map(({_id}) => _id)];

                                    if(postIds.length > 0) {
                                        const postEngagements = await generalOpx.axiosInstance.put(`/content/posts/post-engagements`, {"postIds": postIds});
                                        if(postEngagements.data["status"] === "success" && postEngagements.data["data"].length > 0) {
                                            dispatch(
                                                addToPostEngagement(postEngagements.data["data"])
                                            );
                                        }
                                    }
                                }
                            }
                        } else {
                            let processedHeightsFunction = {
                                "postHeights": [...stockPosts["processedHeights"]["postHeights"]].concat(Array(response.data["data"].length).fill(0)),
                                "processedRefs": {...stockPosts["processedHeights"]["processedRefs"]}
                            }

                            dispatch(
                                updateStockPostsProcessedHeights(processedHeightsFunction)
                            );

                            currentData["data"] = [...currentData["data"]].concat(response.data["data"]);

                            if(user && response.data["data"].length > 0) {
                                const postIdsToEliminate = [...u_postEngagement.map(p_data => p_data.postId)];
                                const postIds = [...response.data["data"].filter(({_id}) => !postIdsToEliminate.includes(_id)).map(({_id}) => _id)];

                                if(postIds.length > 0) {
                                    const postEngagements = await generalOpx.axiosInstance.put(`/content/posts/post-engagements`, {"postIds": postIds});
                                    if(postEngagements.data["status"] === "success" && postEngagements.data["data"].length > 0) {
                                        dispatch(
                                            addToPostEngagement(postEngagements.data["data"])
                                        );
                                    }
                                }
                            }
                        }

                        dispatch(
                            updateStockPosts(currentData)
                        );
                        setHomePagePostsBeingUpdated(false);
                    }
                }
            )
        }
    }

    const postsObserverRef = useRef();
    const lastPostElementRef = useCallback(node => 
        {
            if(stockPosts["posts"]["dataLoading"]) return;
            if(homePagePostsBeingUpdated) return;
            if(postsObserverRef.current) postsObserverRef.current.disconnect();
            postsObserverRef.current = new IntersectionObserver(entries => 
                {
                    if(entries[0].isIntersecting && stockPosts["posts"]["data"].length < stockPosts["posts"]["dataCount"]) {
                        setHomePagePostsBeingUpdated(true);

                        let p_ninclude = [];
                        for(let i = 0; i < stockPosts["posts"]["data"].length; i++) {
                            p_ninclude.push(stockPosts["posts"]["data"][i]["_id"]);
                        }
                        pullPosts("secondary", p_ninclude);
                    }
                }
            );
            if(node) postsObserverRef.current.observe(node);
        }, [stockPosts, homePagePostsBeingUpdated]
    );

    useEffect(() => {
        if(stockPosts["posts"]["data"].length === 0) {
            dispatch(
                clearStockPostsHeights()
            );

            dispatch(
                updateStockPostsSymbol(`${props.ticker}`)
            );
            dispatch(
                updateStockPostsPosition({"visible": true, "scrollTop": 0})
            );

            pullPosts("primary", []);
        } else {
            if(stockPosts["symbol"] !== props.ticker) {
                dispatch(
                    clearStockPostsHeights()
                );

                dispatch(
                    updateStockPostsSymbol(`${props.ticker}`)
                );
                dispatch(
                    updateStockPostsPosition({"visible": true, "scrollTop": 0})
                );
                dispatch(
                    updateStockPosts(
                        {
                            "data": [],
                            "dataCount": 0,
                            "dataLoading": true
                        }
                    )
                );

                pullPosts("primary", []);
            }
        }
    }, [props.ticker]);

    const handlePostMount = useCallback((node, index, picArr, vidArr) => {
        if(node && !stockPosts["processedHeights"]["processedRefs"][index]) {
            if(!(node === undefined || node === null)) {
                if(stockPosts["processedHeights"]["processedRefs"][index] === undefined || stockPosts["processedHeights"]["processedRefs"][index] === null) {
                    let timeOutTime = 0;
                    picArr.length + vidArr.length === 0 ? timeOutTime = 400 : vidArr.length > 0 ? timeOutTime = 2000 : timeOutTime = 1000;

                    setTimeout(() => {
                        const { height } = node.getBoundingClientRect();
                        
                        if(!(height === undefined || height === null || height === 0) && (height > 0)) {
                            dispatch(
                                processStockPostsHeights({"index": index, "height": height})
                            );
                        }
                    }, timeOutTime);
                }
            }
        }
    }, [stockPosts["symbol"]]);

    const analyzePostCharCount = (text, timeStamp, type) => {
        let charPerLine = 0;
        if(type === "title") {
            charPerLine = (53 / 507.625) * contentBodyWidth[0];
        } else if(type === "post") {
            charPerLine = (65 / 507.525) * contentBodyWidth[0];
        }

        if(timeStamp <= 1743517206) {
            const text_Breakdown = {
                "tabs": (text.match(/\t/g) || []).length,
                "lineBreaks": (text.match(/(\r\n|\n|\r)/g) || []).length,
                "formFeeds": (text.match(/\f/g) || []).length,
                "verticalTabs": (text.match(/\v/g) || []).length,
                "lineSeparators": (text.match(/\u2028/g) || []).length,
                "paragraphSeparators": (text.match(/\u2029/g) || []).length,
                "totalLength": text.length
            };
            
            const lines = Math.ceil(
                ((text_Breakdown.totalLength - (
                    text_Breakdown.lineBreaks + text_Breakdown.formFeeds + text_Breakdown.verticalTabs + text_Breakdown.lineSeparators + text_Breakdown.paragraphSeparators
                )) / charPerLine) + (text_Breakdown.lineBreaks + text_Breakdown.formFeeds + text_Breakdown.verticalTabs + text_Breakdown.lineSeparators + text_Breakdown.paragraphSeparators)
            );
            
            return lines;
        } else {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');

            const innerText = doc.body.textContent.trim();

            const pTags = doc.getElementsByTagName('p').length;
            const brTags = doc.getElementsByTagName('br').length;
            const divTags = doc.getElementsByTagName('div').length;

            const text_Breakdown = {
                "tabs": (innerText.match(/\t/g) || []).length,
                "lineBreaks": (innerText.match(/(\r\n|\n|\r)/g) || []).length,
                "formFeeds": (innerText.match(/\f/g) || []).length,
                "verticalTabs": (innerText.match(/\v/g) || []).length,
                "lineSeparators": (innerText.match(/\u2028/g) || []).length,
                "paragraphSeparators": (innerText.match(/\u2029/g) || []).length,
                "totalLength": innerText.length
            };

            const lines = Math.ceil(
                ((text_Breakdown.totalLength - (
                    text_Breakdown.lineBreaks + text_Breakdown.formFeeds + text_Breakdown.verticalTabs + text_Breakdown.lineSeparators + text_Breakdown.paragraphSeparators
                )) / charPerLine) + (pTags + brTags + divTags - 1) +
                (text_Breakdown.lineBreaks + text_Breakdown.formFeeds + text_Breakdown.verticalTabs + text_Breakdown.lineSeparators + text_Breakdown.paragraphSeparators)
            );

            return lines;
        }
    }

    return(
        <div
                ref={scrollController}
                className={props.f_viewPort === "small" ? "small-homePageContentBodyWrapper" : "large-homePageContentBodyWrapper"}
            >
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
                                        {quoteData["quote"]["dataLoading"] ?
                                            <span className="large-stocksTodayPriceDescLoading"/> : 
                                            <span className="large-stocksTodayPriceDesc">${generalOpx.formatFigures.format(quoteData["quote"]["data"]["close"])}</span>
                                        }
                                        {quoteData["quote"]["dataLoading"] ?
                                            null : 
                                            <span className="large-stocksTodayPriceChangeDesc">
                                                <ArrowDropUp className="large-stocksTodayPriceChangeDescIcon"
                                                    style={quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["open"] >= 0 ? 
                                                        {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)", "rotate": "180deg"}
                                                    }
                                                />
                                                <span 
                                                        style={quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["open"] >= 0 ?
                                                            {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                        }
                                                    >
                                                    &nbsp;{`${generalOpx.formatLargeFigures(Math.abs(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["open"]), 2)}`}&nbsp;&nbsp;{`(${generalOpx.formatFigures.format(Math.abs((quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["open"]) / quoteData["quote"]["data"]["open"]))}%)`}
                                                </span>
                                            </span>
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className="large-stocksProfilePriceChangeDetailContainer">
                                {quoteData["quote"]["dataLoading"] ?
                                    <div className="large-stocksProfilePriceChangeDetailContainerLoding"/> : 
                                    <>
                                        <span className="large-stocksProfilePriceChangeDetailsDesc">Low: ${generalOpx.formatFigures.format(quoteData["quote"]["data"]["low"])}</span>
                                        {quoteData["quote"]["data"]["high"] === quoteData["quote"]["data"]["low"] ?
                                            <div className="large-stocksProfilePriceChangeBarSectsContainer">
                                                <div className="large-stocksProfilePriceChangeBarSectOneFullyFilled"/>
                                                <ArrowDropUp 
                                                    className="large-stocksProfilePriceChangeBarSectPointer"
                                                    style={{"left": `88px`}}
                                                />
                                            </div> : 
                                            <>
                                                {(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"]) <= 0.05 ?
                                                    <div className="large-stocksProfilePriceChangeBarSectsContainer">
                                                        <div className="large-stocksProfilePriceChangeBarSectTwoFullyFilled"/>
                                                        <ArrowDropUp 
                                                            className="large-stocksProfilePriceChangeBarSectPointer"
                                                            style={{"left": `calc((${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])} * 100px) - 12px)`}}
                                                        />
                                                    </div> : 
                                                    <>
                                                        {(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"]) >= 0.95 ?
                                                            <div className="large-stocksProfilePriceChangeBarSectsContainer">
                                                                <div className="large-stocksProfilePriceChangeBarSectOneFullyFilled"/>
                                                                <ArrowDropUp 
                                                                    className="large-stocksProfilePriceChangeBarSectPointer"
                                                                    style={{"left": `calc((${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])} * 100px) - 12px)`}}
                                                                />
                                                            </div> : 
                                                            <div className="large-stocksProfilePriceChangeBarSectsContainer">
                                                                <div className="large-stocksProfilePriceChangeBarSectOne"
                                                                    style={{
                                                                        "width": `calc(${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])} * 100px)`,
                                                                        "minWidth": `calc(${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])} * 100px)`,
                                                                        "maxWidth": `calc(${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])} * 100px)`
                                                                    }}
                                                                />
                                                                <div className="large-stocksProfilePriceChangeBarSectTwo"
                                                                    style={{
                                                                        "width": `calc((1 - ${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])}) * 100px)`,
                                                                        "minWidth": `calc((1 - ${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])}) * 100px)`,
                                                                        "maxWidth": `calc((1 - ${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])}) * 100px)`
                                                                    }}
                                                                />
                                                                <ArrowDropUp 
                                                                    className="large-stocksProfilePriceChangeBarSectPointer"
                                                                    style={{"left": `calc((${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])} * 100px) - 12px)`}}
                                                                />
                                                            </div>
                                                        }
                                                    </>
                                                }
                                            </>
                                        }
                                        <span className="large-stocksProfilePriceChangeDetailsDesc">High: ${generalOpx.formatFigures.format(quoteData["quote"]["data"]["high"])}</span>
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
                                        <span>All-Low:</span>
                                        {quoteData["quote"]["dataLoading"] ?
                                            <span className="large-stocksProfileHeaderQuickStatLoading"/> : 
                                            `$${generalOpx.formatFigures.format(pageData["page"]["data"]["atl"])}`
                                        }
                                    </div>
                                    <div className="large-stocksProfileheaderQuickStateLine">
                                        <span>All-High:</span>
                                        {quoteData["quote"]["dataLoading"] ?
                                            <span className="large-stocksProfileHeaderQuickStatLoading"/> : 
                                            `$${generalOpx.formatFigures.format(pageData["page"]["data"]["ath"])}`
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
                                            {quoteData["quote"]["dataLoading"] ?
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> : 
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                        style={{"textAlign": "right"}}
                                                    >
                                                    ${generalOpx.formatFigures.format(quoteData["quote"]["data"]["open"])}
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
                                            {quoteData["quote"]["dataLoading"] ?
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                        style={{"textAlign": "right"}}
                                                    >
                                                    ${generalOpx.formatFigures.format(quoteData["quote"]["data"]["low"])}
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
                                            {quoteData["quote"]["dataLoading"] ?
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                        style={{"textAlign": "right"}}
                                                    >
                                                    ${generalOpx.formatFigures.format(quoteData["quote"]["data"]["high"])}
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
                                                Tot. Supply
                                            </p>
                                        </span>
                                        <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        <span className="large-stocksHeaderQuoteSectionLineFigure">
                                            {quoteData["quote"]["dataLoading"] ?
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                        style={{"textAlign": "right"}}
                                                    >
                                                    {pageData["page"]["data"]["totalSupply"] === 0 ? `-` : `${generalOpx.formatLargeFigures(pageData["page"]["data"]["totalSupply"], 2)}`}
                                                </p>
                                            }
                                        </span>
                                        <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                    </div>
                                    <div className="large-stocksHeaderQuoteSectionLine">
                                        <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        <span className="large-stocksHeaderQuoteSectionLineDesc">
                                            <p className="large-stocksHeaderQuoteSectionLineDescBlock">
                                                All-Low
                                            </p>
                                        </span>
                                        <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        <span className="large-stocksHeaderQuoteSectionLineFigure">
                                            {quoteData["quote"]["dataLoading"] ?
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                        style={{"textAlign": "right"}}
                                                    >
                                                    ${generalOpx.formatFigures.format(pageData["page"]["data"]["atl"])}
                                                </p>
                                            }
                                        </span>
                                        <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                    </div>
                                    <div className="large-stocksHeaderQuoteSectionLine">
                                        <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        <span className="large-stocksHeaderQuoteSectionLineDesc">
                                            <p className="large-stocksHeaderQuoteSectionLineDescBlock">
                                                All-High
                                            </p>
                                        </span>
                                        <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        <span className="large-stocksHeaderQuoteSectionLineFigure">
                                            {quoteData["quote"]["dataLoading"] ?
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                        style={{"textAlign": "right"}}
                                                    >
                                                    ${generalOpx.formatFigures.format(pageData["page"]["data"]["ath"])}
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
                                                Circ. Supply
                                            </p>
                                        </span>
                                        <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        <span className="large-stocksHeaderQuoteSectionLineFigure">
                                            {quoteData["quote"]["dataLoading"] ?
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                        style={{"textAlign": "right"}}
                                                    >
                                                    {generalOpx.formatLargeFigures(pageData["page"]["data"]["circulatingSupply"], 2)}
                                                </p>
                                            }
                                        </span>
                                    </div>
                                    <div className="large-stocksHeaderQuoteSectionLine">
                                        <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        <span className="large-stocksHeaderQuoteSectionLineDesc">
                                            <p className="large-stocksHeaderQuoteSectionLineDescBlock">
                                                Volume
                                            </p>
                                        </span>
                                        <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        <span className="large-stocksHeaderQuoteSectionLineFigure">
                                            {quoteData["quote"]["dataLoading"] ?
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                        style={{"textAlign": "right"}}
                                                    >
                                                    {generalOpx.formatLargeFigures(quoteData["quote"]["data"]["volume"], 2)}
                                                </p>
                                            }
                                        </span>
                                    </div>
                                    <div className="large-stocksHeaderQuoteSectionLine">
                                        <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        <span className="large-stocksHeaderQuoteSectionLineDesc">
                                            <p className="large-stocksHeaderQuoteSectionLineDescBlock">
                                                Avg. Volume
                                            </p>
                                        </span>
                                        <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                        <span className="large-stocksHeaderQuoteSectionLineFigure">
                                            {quoteData["quote"]["dataLoading"] ?
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                                <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                        style={{"textAlign": "right"}}
                                                    >
                                                    {generalOpx.formatLargeFigures(pageData["page"]["data"]["avgVol"], 2)}
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
                <div className="large-stocksPageMoreDataAboutContainer" style={{"position": "relative"}}>
                    <div className="large-stocksPageMoreDataAboutTitle">
                        About
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
                                {pageData["page"]["data"]["description"]}
                            </div>
                        </div> : 
                        <div className="large-stocksPageMoreDataAboutBodyExpanded">
                            {pageData["page"]["data"]["description"]}
                        </div>
                    }
                    <div className="large-stocksPageMoreCryptoPointersLinksContainer">
                        <div className="large-stocksPageMoreCryptoPointersSectionOne">
                            <button className="large-stocksPageMoreCryptoPointerBtn">
                                <ExploreSharp className="large-stocksPageMoreCryptoPointerBtnIcon" />
                                Website
                            </button>
                        </div>
                        <div className="large-stocksPageMoreCryptoPointersSectionTwo">
                            <button className="large-stocksPageMoreCryptoPointerBtn">
                                <ViewCarouselSharp className="large-stocksPageMoreCryptoPointerBtnIcon" />
                                Block Explorer
                            </button>
                        </div>
                        <div className="large-stocksPageMoreCryptoPointersSectionOne">
                            <button className="large-stocksPageMoreCryptoPointerBtn">
                                <HistoryEduSharp className="large-stocksPageMoreCryptoPointerBtnIcon" />
                                White Paper
                            </button>
                        </div>
                        <div className="large-stocksPageMoreCryptoPointersSectionTwo">
                            <button className="large-stocksPageMoreCryptoPointerBtn">
                                <TerminalSharp className="large-stocksPageMoreCryptoPointerBtnIcon" />
                                Source Code
                            </button>
                        </div>
                    </div>
                </div>
                <RecommendationGraph
                    distinction={user ? "user" : "visitor"}
                    asset={pageData["page"]["data"]["symbol"]} 
                    a_recommendations={pageData["page"]["data"]["recommendations"]} 
                />
                <div className="assetMainPageNewsContainer">
                    <div className="large-stocksNewsHeaderContainer"
                            style={{"height": "25px", "minHeight": "25px", "maxHeight": "25px"}}
                        >
                        <div className="large-stocksNewsHeader" style={{"position": "relative"}}>
                            Market News&nbsp;&nbsp;•&nbsp;&nbsp;{pageData["page"]["data"]["name"]}
                            <div className="large-stocksNewsViewToggleInnerContainer"
                                    style={{"position": "absolute", "top": "-2.5px", "right": "0", "margin": "0"}}
                                >
                                <button className="large-stocksNewsViewToggleOutline" 
                                        onClick={() => updateStockNewsView("back")}
                                        style={newsData["index"] === 0 ? {"display": "none"} : {"display": "flex"}}
                                    >
                                    <ChevronLeft className="large-stocksNewsViewToggleOutlineIcon"/>
                                </button>
                                <div className="large-stocksNewsViewToggleOutlineDivider" style={{"marginLeft": "10px", "marginRight": "10px"}}/>
                                <button className="large-stocksNewsViewToggleOutline" 
                                        onClick={() => updateStockNewsView("forward")}
                                        disabled={stockNewsBeingUpdated || (newsData["news"]["data"].length <= newsData["index"])}
                                        style={{"display": "flex"}}
                                    >
                                    <ChevronRight className="large-stocksNewsViewToggleOutlineIcon"/>
                                </button>
                            </div>
                        </div>
                    </div>
                    {newsData["news"]["dataLoading"] || newsData["news"]["data"].length === 0 || (newsData["news"]["data"].length <= newsData["index"]) ?
                        <>
                            <div className="assets-dashboardNewsContainer">
                                <div className="asset-dashboardNewsElementFirst">
                                    <MiniaturizedNews loading={true}/>
                                </div>
                                <div className="asset-dashboardNewsElementSecond">
                                    <MiniaturizedNews loading={true}/>
                                </div>
                            </div>
                            <div className="assets-dashboardNewsDivider">
                                <div className="assets-dashboardNewsDividerOne"/>
                                <div className="assets-dashboardNewsDividerTwo"/>
                            </div>
                            <div className="assets-dashboardNewsContainerSecond">
                                <div className="asset-dashboardNewsElementFirst">
                                    <MiniaturizedNews loading={true}/>
                                </div>
                                <div className="asset-dashboardNewsElementSecond">
                                    <MiniaturizedNews loading={true}/>
                                </div>
                            </div>
                        </> : 
                        <>
                            <div className="assets-dashboardNewsContainer">
                                <div className="asset-dashboardNewsElementFirst">
                                    <MiniaturizedNews  
                                        loading={false}
                                        type={"stockPage"}
                                        pred_ticker={props.ticker}
                                        user={user ? user.user : "visitor"}
                                        desc={newsData["news"]["data"][newsData["index"]][0]}
                                    />
                                </div>
                                <div className="asset-dashboardNewsElementSecond">
                                    <MiniaturizedNews  
                                        loading={false}
                                        type={"stockPage"}
                                        pred_ticker={props.ticker}
                                        user={user ? user.user : "visitor"}
                                        desc={newsData["news"]["data"][newsData["index"]][1]}
                                    />
                                </div>
                            </div>
                            <div className="assets-dashboardNewsDivider">
                                <div className="assets-dashboardNewsDividerOne"/>
                                <div className="assets-dashboardNewsDividerTwo"/>
                            </div>
                            <div className="assets-dashboardNewsContainerSecond">
                                <div className="asset-dashboardNewsElementFirst">
                                    <MiniaturizedNews  
                                        loading={false}
                                        type={"stockPage"}
                                        pred_ticker={props.ticker}
                                        user={user ? user.user : "visitor"}
                                        desc={newsData["news"]["data"][newsData["index"]][2]}
                                    />
                                </div>
                                <div className="asset-dashboardNewsElementSecond">
                                    <MiniaturizedNews  
                                        loading={false}
                                        type={"stockPage"}
                                        pred_ticker={props.ticker}
                                        user={user ? user.user : "visitor"}
                                        desc={newsData["news"]["data"][newsData["index"]][3]}
                                    />
                                </div>
                            </div>
                        </>
                    }
                </div>
                <PriceHistory asset={pageData["page"]["data"]["symbol"]} />
                {stockPosts["posts"]["dataLoading"] ?
                    <>
                        <div className="large-homePagePostContainer">
                            <Post loading={true}/>
                        </div>
                        <div className="large-homePagePostContainer">
                            <Post loading={true}/>
                        </div>
                        <div className="large-homePagePostContainer">
                            <Post loading={true}/>
                        </div>
                        <div className="large-homePagePostContainer">
                            <Post loading={true}/>
                        </div>
                        <div className="large-homePagePostContainer">
                            <Post loading={true}/>
                        </div>
                    </> : 
                    <>
                        {stockPosts["posts"]["data"].length > 0 ?
                            <>
                                {stockPosts["posts"]["data"].map((post_desc, index) => (
                                        <div className="large-homePagePostContainer" key={`stock-post-${post_desc._id}`}
                                                ref={index === (stockPosts["posts"]["data"].length - 2) ? lastPostElementRef : null}
                                                style={index === (stockPosts["posts"]["data"].length - 1) ? 
                                                    {} : {"borderBottom": "solid 1px var(--primary-bg-08)"}
                                                }
                                            >
                                            <div className="large-stocksPostInnerContainer"
                                                    key={`stock-inner-cont-post-${post_desc["_id"]}`}
                                                    style={
                                                        {
                                                            "height": `calc(20px + 40px + ${
                                                                !user ? 0 : (post_desc.username === user.user || u_moderatorStatus.some(modStat => modStat.community === post_desc.groupId)) && post_desc.userRewards > 0 ? 28 : 0
                                                            }px + ${
                                                                post_desc.title === "" ? 0 : (10 + (analyzePostCharCount(post_desc.title, post_desc.timeStamp, "title") * 20))
                                                            }px + ${
                                                                post_desc.post === "" ? 0 : analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") >= 3 ? 
                                                                79 + 5 + 18 : (16 + (analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") * 21.58))
                                                            }px + ${
                                                                post_desc.photos.length + post_desc.videos.length > 0 ? 16 + 275 : 0
                                                            }px + 16px + 28px + ${post_desc.title !== "" && post_desc.post === "" ? 10 : 0}px)`,

                                                            "minHeight": `calc(20px + 40px + ${
                                                                !user ? 0 : (post_desc.username === user.user || u_moderatorStatus.some(modStat => modStat.community === post_desc.groupId)) && post_desc.userRewards > 0 ? 28 : 0
                                                            }px + ${
                                                                post_desc.title === "" ? 0 : (10 + (analyzePostCharCount(post_desc.title, post_desc.timeStamp, "title") * 20))
                                                            }px + ${
                                                                post_desc.post === "" ? 0 : analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") >= 3 ? 
                                                                79 + 5 + 18 : (16 + (analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") * 21.58))
                                                            }px + ${
                                                                post_desc.photos.length + post_desc.videos.length > 0 ? 16 + 275 : 0
                                                            }px + 16px + 28px + ${post_desc.title !== "" && post_desc.post === "" ? 10 : 0}px)`,

                                                            "maxHeight": `calc(20px + 40px + ${
                                                                !user ? 0 :(post_desc.username === user.user || u_moderatorStatus.some(modStat => modStat.community === post_desc.groupId)) && post_desc.userRewards > 0 ? 28 : 0
                                                            }px + ${
                                                                post_desc.title === "" ? 0 : (10 + (analyzePostCharCount(post_desc.title, post_desc.timeStamp, "title") * 20))
                                                            }px + ${
                                                                post_desc.post === "" ? 0 : analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") >= 3 ? 
                                                                79 + 5 + 18 : (16 + (analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") * 21.58))
                                                            }px + ${
                                                                post_desc.photos.length + post_desc.videos.length > 0 ? 16 + 275 : 0
                                                            }px + 16px + 28px + ${post_desc.title !== "" && post_desc.post === "" ? 10 : 0}px)`,
                                                        }
                                                    }
                                                >
                                            <Post 
                                                user={user ? user.user : "visitor"}
                                                type={"home"}
                                                view={"mini"}
                                                details={post_desc}
                                                loading={false}
                                            />
                                            </div>
                                        </div>
                                    ))
                                }
                            </> : 
                            <div className="home-assetsNoPostsNoticeContainer">
                                <img src="/assets/Finulab_Icon.png" alt="" className="large-marketPageNoDateNoticeImg" />
                                <div className="large-marketPageNoDataONotice">
                                    No Posts yet for {pageData["page"]["data"]["name"]},&nbsp;
                                    <button className="large-marketPageNoDataONoticeBtn" onClick={() => navigate("/create-post")}>
                                        create one
                                    </button>.
                                </div>
                            </div>
                        }
                        
                    </>
                }
            </div>
        </div>
    )
}