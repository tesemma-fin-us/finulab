import './stocks.css';

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
    KeyboardBackspace
} from '@mui/icons-material';

import Post from '../../../../components/post';
import News from '../../../../components/news/news';
import PriceHistory from '../../../../components/priceHistory';
import generalOpx from '../../../../functions/generalFunctions';
import Prediction from '../../../../components/prediction/prediction';
import {StockChartContainer} from '../../../../components/stockChart';
import RecommendationGraph from '../../../../components/recommendations';
import MiniaturizedNews from '../../../../components/miniaturized/news/mini-news';
import MiniaturizedPrediction from '../../../../components/miniaturized/prediction/mini-prediction';

import {selectUser} from '../../../../reduxStore/user';
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
import {updateStockPageData, updateStockPagePosition, selectStockPageData} from '../../../../reduxStore/stockPageData';
import {setPredictionEngagement, addToPredictionEngagement, selectPredictionEngagement} from '../../../../reduxStore/predictionEngagement';
import {updateStockPredictions, updateStockPredictionsPosition, updateStockPredictionsSymbol, selectStockPredictions} from '../../../../reduxStore/stockPredictions';
import {updateStockPostsSymbol, updateStockPosts, updateStockPostsPosition, updateStockPostsProcessedHeights, processStockPostsHeights, clearStockPostsHeights, selectStockPosts} from '../../../../reduxStore/stockPosts';
import {setStockPageSelection, setStockPageSelectionSymbol, updateStockPageSelectionScrollTop, selectStockPageSelection} from '../../../../reduxStore/stockPageSelection';


export default function LargeStocksPage(props) {
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
    const homePageWatchlist = useSelector(selectHomePageWatchlist);
    const stockPageSelection = useSelector(selectStockPageSelection);
    const u_predictionEngagement = useSelector(selectPredictionEngagement);

    const contentRef = useRef();
    const [visibleContentCount, setVisibleContentCount] = useState(0);
    useLayoutEffect(() => {
        const visibleContentCountResizeUpdater = () => {
            if(contentRef.current) {
                const visibleContentCountFunction = Math.floor((contentRef.current.clientHeight - 51) / 216);
                setVisibleContentCount(visibleContentCountFunction);
            }
        }

        window.addEventListener('resize', visibleContentCountResizeUpdater);
        visibleContentCountResizeUpdater();
        return () => window.removeEventListener('resize', visibleContentCountResizeUpdater);
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

        await generalOpx.axiosInstance.put(`/stock-market-data/description/${symbol}`).then(
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
        const today = new Date();
        const todayUnix = getUnixTime(today);
        
        let holidaysData;
        const symbol = props.ticker;
        if(stockActiveDays["timeStamp"] === 0) {
            holidaysData = await generalOpx.activeMarketDays();
            dispatch(
                updateStockActiveDays(
                    {
                        "data": holidaysData,
                        "timeStamp": todayUnix
                    }
                )
            );
        } else {
            if(todayUnix - stockActiveDays["timeStamp"] >= 600) {
                holidaysData = await generalOpx.activeMarketDays();
                dispatch(
                    updateStockActiveDays(
                        {
                            "data": holidaysData,
                            "timeStamp": todayUnix
                        }
                    )
                );
            } else {
                holidaysData = stockActiveDays["data"];
            }
        }

        await generalOpx.axiosInstance.put(`/stockDataFeed/quote`,
            {
                "symbol": symbol.slice(3, symbol.length), 
                "selectedDate": holidaysData["startDate"],
                "previousDate": holidaysData['previousDate'],
                "selectedToDate": holidaysData["endDate"]
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

    const pullSpecificNews = async () => {
        if(newsData["news"]["data"].flatMap(arr => arr).some(doc => doc._id === props.newsId)) {
            dispatch(
                setStockPageSelectionSymbol(`${props.ticker}`)
            );
            dispatch(
                setStockPageSelection(
                    {
                        "type": "News",
                        "selectedDesc": {
                            "desc": newsData["news"]["data"].flatMap(arr => arr).filter(doc => doc._id === props.newsId)[0]
                        }
                    }
                )
            );
            dispatch(
                updateStockPageSelectionScrollTop(0)
            );
        } else {
            await generalOpx.axiosInstance.put(`/content/news/specific-news`, 
                {
                    "type": "stock", 
                    "newsId": props.newsId
                }
            ).then(
                async (response) => {
                    if(response.data["status"] === "success") {
                        if(user && response.data["data"].length > 0) {
                            if(u_newsEngagement.length === 0) {
                                const newsIds = [`S:-${props.newsId}`];
                                const newsEngagements = await generalOpx.axiosInstance.put(`/content/news/news-engagements`, {"newsIds": newsIds});

                                if(newsEngagements.data["status"] === "success" && newsEngagements.data["data"].length > 0) {
                                    dispatch(
                                        setNewsEngagement(newsEngagements.data["data"])
                                    );
                                }
                            } else {
                                const newsIdsToEliminate = [...u_newsEngagement.map(n_data => n_data.newsId)];
                                const newsIdsInterlude = [`S:-${props.newsId}`];
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
                            setStockPageSelectionSymbol(`${props.ticker}`)
                        );
                        dispatch(
                            setStockPageSelection(
                                {
                                    "type": "News",
                                    "selectedDesc": {
                                        "desc": response.data["data"]
                                    }
                                }
                            )
                        );
                        dispatch(
                            updateStockPageSelectionScrollTop(0)
                        );
                    }
                }
            );
        }
    }

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

    const handlePageScroll = (e) => {
        if(props.displayView === "") {
            dispatch(
                updateStockPagePosition(e.target.scrollTop)
            );
        } else if(props.displayView === "markets") {
            let pageInfoPredictions = {...stockPredictions["position"]};
            pageInfoPredictions["visible"] = false;
            pageInfoPredictions["scrollTop"] = e.target.scrollTop;

            dispatch(
                updateStockPredictionsPosition(pageInfoPredictions)
            );
        } else if(props.displayView === "posts") {
            let pageInfoPosts = {...stockPosts["position"]};
            pageInfoPosts["visible"] = false;
            pageInfoPosts["scrollTop"] = e.target.scrollTop;
            
            dispatch(
                updateStockPostsPosition(pageInfoPosts)
            );
        }
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
            <StockChartContainer ticker={props.ticker} />
        );
        setAdvancedChart(tvWidget);
        pullSymbolData();
    }

    useMemo(() => {
        if(Object.keys(pageData["page"]["data"]).length === 0) {
            pageUpdate();
        } 
    }, []);
    useEffect(() => {
        if(props.ticker !== undefined) {
            if(Object.keys(pageData["page"]["data"]).length > 0) {
                if(pageData["page"]["data"]["symbol"] !== props.ticker) {
                    pageUpdate();
                } else {
                    if(advancedChart === null) {
                        const tvWidget = (
                            <StockChartContainer ticker={props.ticker}/>
                        );
                        setAdvancedChart(tvWidget);
                    }

                    if(props.displayView === "") {
                        if(contentRef.current) {
                            setTimeout(() => {
                                if((contentRef.current?.scrollHeight - contentRef.current?.clientHeight) >= pageData["scrollTop"]) {
                                    contentRef.current.scrollTop = pageData["scrollTop"];
                                }
                            }, 0);
                        }
                    }
                }
            }
        }
    }, [props, contentRef.current]);

    useMemo(() => {
        if(Object.keys(quoteData["quote"]["data"]).length === 0) {
            pullQuote();
        }
    }, [])
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

            if(!(props.newsId === undefined || props.newsId === null || props.newsId === "")) {
                if(stockPageSelection["selection"]["type"] !== "News") {
                    if(contentRef.current) {
                        setTimeout(() => {
                            contentRef.current.scrollTop = 0;
                        }, 0);
                    }

                    pullSpecificNews();
                } else if(stockPageSelection["selection"]["selectedDesc"]["desc"]["_id"] !== props.newsId) {
                    if(contentRef.current) {
                        setTimeout(() => {
                            contentRef.current.scrollTop = 0;
                        }, 0);
                    }
    
                    pullSpecificNews();
                } else {
                    if(contentRef.current) {
                        setTimeout(() => {
                            if((contentRef.current?.scrollHeight - contentRef.current?.clientHeight) >= stockPageSelection["scrollTop"]) {
                                contentRef.current.scrollTop = 0; //stockPageSelection["scrollTop"];
                            }
                        }, 0);
                    }
                }
            }
        }
    }, [props]);

    const pullSpecificPrediction = async () => {
        if(stockPredictions["markets"]["predictions"].some(doc => doc._id === props.predictionId)) {
            dispatch(
                setStockPageSelectionSymbol(`${props.ticker}`)
            );
            dispatch(
                setStockPageSelection(
                    {
                        "type": "Prediction",
                        "selectedDesc": {
                            "prediction": stockPredictions["markets"]["predictions"].filter(doc => doc._id === props.predictionId)[0],
                            "markets": stockPredictions["markets"]["data"].filter(doc => doc.predictionId == props.predictionId)
                        }
                    }
                )
            );
            dispatch(
                updateStockPageSelectionScrollTop(0)
            );
        } else {
            await generalOpx.axiosInstance.put(`/market/prediction`, {"predictionId": props.predictionId}).then(
                async (response) => {
                    if(response.data["status"] === "success") {
                        if(user && Object.keys(response.data["data"]).length > 0) {
                            /*
                            if(u_marketHoldings.length === 0) {
                                const predictionIds = [props.predictionId];
                                const holdings = await generalOpx.axiosInstance.put(`/market/specific-holdings`, {"predictionIds": predictionIds});
                                
                                if(holdings.data["status"] === "success" && holdings.data["data"].length > 0) {
                                    dispatch(
                                        setMarketHoldings(holdings.data["data"])
                                    );
                                }
                            } else {
                                const predictionIdsToEliminate = [...u_marketHoldings.map(h_data => h_data.predictionId)];
                                const predictionIds = [...[props.predictionId].filter(({_id}) => !predictionIdsToEliminate.includes(_id)).map(({_id}) => _id)];
                                
                                if(predictionIds.length > 0) {
                                    const holdings = await generalOpx.axiosInstance.put(`/market/specific-holdings`, {"predictionIds": predictionIds});

                                    if(holdings.data["status"] === "success" && holdings.data["data"].length > 0) {
                                        dispatch(
                                            addToMarketHoldings(holdings.data["data"])
                                        );
                                    }
                                }
                            }
                            */

                            if(u_predictionEngagement.length === 0) {
                                const predictionIds = [props.predictionId];
                                const predictionEngagements = await generalOpx.axiosInstance.put(`/market/prediction-engagements`, {"predictionIds": predictionIds});

                                if(predictionEngagements.data["status"] === "success" && predictionEngagements.data["data"].length > 0) {
                                    dispatch(
                                        setPredictionEngagement(predictionEngagements.data["data"])
                                    );
                                }
                            } else {
                                const predictionIdsToEliminate = [...u_predictionEngagement.map(h_data => h_data.predictionId)];
                                const predictionIds = [...[props.predictionId].filter(({_id}) => !predictionIdsToEliminate.includes(_id)).map(({_id}) => _id)];

                                if(predictionIds.length > 0) {
                                    const predictionEngagements = await generalOpx.axiosInstance.put(`/market/prediction-engagements`, {"predictionIds": predictionIds});

                                    if(predictionEngagements.data["status"] === "success" && predictionEngagements.data["data"].length > 0) {
                                        dispatch(
                                            addToPredictionEngagement(predictionEngagements.data["data"])
                                        );
                                    }
                                }
                            }
                        }

                        dispatch(
                            setStockPageSelectionSymbol(`${props.ticker}`)
                        );
                        dispatch(
                            setStockPageSelection(
                                {
                                    "type": "Prediction",
                                    "selectedDesc": {
                                        "prediction": response.data["data"],
                                        "markets": response.data["markets"]
                                    }
                                }
                            )
                        );
                        dispatch(
                            updateStockPageSelectionScrollTop(0)
                        );
                    }
                }
            )
        }
    }

    const [homePageMarketsBeingUpdated, setHomePageMarketsBeingUpdated] = useState(false);
    const pullMarkets = async (type, p_ninclude) => {
        if(visibleContentCount !== 0) {
            if(type === "primary" || stockPredictions["markets"]["predictions"].length < stockPredictions["markets"]["liveCount"]) {
                await generalOpx.axiosInstance.put(`/market/recommended`, 
                    {
                        "type": type,
                        "limit": visibleContentCount,
                        "p_ninclude": p_ninclude,
                        "interests": [],
                    }
                ).then(
                    async (response) => {
                        if(response.data["status"] === "success") {
                            let currentData = {...stockPredictions["markets"]};
                            
                            if(type === "primary") {
                                currentData = {
                                    "predictions": response.data["data"],
                                    "data": response.data["markets"],
                                    "liveCount": response.data["count"],
                                    "dataLoading": false
                                }

                                if(user && response.data["data"].length > 0) {
                                    /*
                                    if(u_marketHoldings.length === 0) {
                                        const predictionIds = [...response.data["data"].map(p_data => p_data._id)];
                                        const holdings = await generalOpx.axiosInstance.put(`/market/specific-holdings`, {"predictionIds": predictionIds});
                                        
                                        if(holdings.data["status"] === "success" && holdings.data["data"].length > 0) {
                                            dispatch(
                                                setMarketHoldings(holdings.data["data"])
                                            );
                                        }
                                    } else {
                                        const predictionIdsToEliminate = [...u_marketHoldings.map(h_data => h_data.predictionId)];
                                        const predictionIds = [...response.data["data"].filter(({_id}) => !predictionIdsToEliminate.includes(_id)).map(({_id}) => _id)];
                                        
                                        if(predictionIds.length > 0) {
                                            const holdings = await generalOpx.axiosInstance.put(`/market/specific-holdings`, {"predictionIds": predictionIds});

                                            if(holdings.data["status"] === "success" && holdings.data["data"].length > 0) {
                                                dispatch(
                                                    addToMarketHoldings(holdings.data["data"])
                                                );
                                            }
                                        }
                                    }
                                    */

                                    if(u_predictionEngagement.length === 0) {
                                        const predictionIds = [...response.data["data"].map(p_data => p_data._id)];
                                        const predictionEngagements = await generalOpx.axiosInstance.put(`/market/prediction-engagements`, {"predictionIds": predictionIds});

                                        if(predictionEngagements.data["status"] === "success" && predictionEngagements.data["data"].length > 0) {
                                            dispatch(
                                                setPredictionEngagement(predictionEngagements.data["data"])
                                            );
                                        }
                                    } else {
                                        const predictionIdsToEliminate = [...u_predictionEngagement.map(h_data => h_data.predictionId)];
                                        const predictionIds = [...response.data["data"].filter(({_id}) => !predictionIdsToEliminate.includes(_id)).map(({_id}) => _id)];

                                        if(predictionIds.length > 0) {
                                            const predictionEngagements = await generalOpx.axiosInstance.put(`/market/prediction-engagements`, {"predictionIds": predictionIds});

                                            if(predictionEngagements.data["status"] === "success" && predictionEngagements.data["data"].length > 0) {
                                                dispatch(
                                                    addToPredictionEngagement(predictionEngagements.data["data"])
                                                );
                                            }
                                        }
                                    }
                                }
                            } else {
                                currentData["predictions"] = [...currentData["predictions"]].concat(response.data["data"]);
                                currentData["data"] = [...currentData["data"]].concat(response.data["markets"]);

                                if(user && response.data["data"].length > 0) {
                                    /*
                                    const predictionIdsToEliminate = [...u_marketHoldings.map(h_data => h_data.predictionId)];
                                    const predictionIds = [...response.data["data"].filter(({_id}) => !predictionIdsToEliminate.includes(_id)).map(({_id}) => _id)];

                                    if(predictionIds.length > 0) {
                                        const holdings = await generalOpx.axiosInstance.put(`/market/specific-holdings`, {"predictionIds": predictionIds});

                                        if(holdings.data["status"] === "success" && holdings.data["data"].length > 0) {
                                            dispatch(
                                                addToMarketHoldings(holdings.data["data"])
                                            );
                                        }
                                    }
                                    */

                                    const engPredictionIdsToEliminate = [...u_predictionEngagement.map(h_data => h_data.predictionId)];
                                    const engPredictionIds = [...response.data["data"].filter(({_id}) => !engPredictionIdsToEliminate.includes(_id)).map(({_id}) => _id)];

                                    if(engPredictionIds.length > 0) {
                                        const predictionEngagements = await generalOpx.axiosInstance.put(`/market/prediction-engagements`, {"predictionIds": engPredictionIds});

                                        if(predictionEngagements.data["status"] === "success" && predictionEngagements.data["data"].length > 0) {
                                            dispatch(
                                                addToPredictionEngagement(predictionEngagements.data["data"])
                                            );
                                        }
                                    }
                                }
                            }

                            dispatch(
                                updateStockPredictions(currentData)
                            );

                            setHomePageMarketsBeingUpdated(false);
                        }
                    }
                );
            }
        }
    }

    const marketObserverRef = useRef();
    const lastMarketElementRef = useCallback(node => 
        {
            if(stockPredictions["markets"]["dataLoading"]) return;
            if(homePageMarketsBeingUpdated) return;
            if(marketObserverRef.current) marketObserverRef.current.disconnect();
            marketObserverRef.current = new IntersectionObserver(entries => 
                {
                    if(entries[0].isIntersecting && stockPredictions["markets"]["predictions"].length < stockPredictions["markets"]["liveCount"]) {
                        setHomePageMarketsBeingUpdated(true);

                        let p_ninclude = []
                        for(let i = 0; i < stockPredictions["markets"]["predictions"].length; i++) {
                            p_ninclude.push(stockPredictions["markets"]["predictions"][i]["_id"]);
                        }
                        pullMarkets("secondary", p_ninclude);
                    }
                }
            );
            if(node) marketObserverRef.current.observe(node);
        }, [stockPredictions, homePageMarketsBeingUpdated]
    );

    useEffect(() => {
        if(props.displayView === "markets") {
            if(stockPredictions["markets"]["predictions"].length === 0) {
                dispatch(
                    updateStockPredictionsSymbol(`${props.ticker}`)
                );
                dispatch(
                    updateStockPredictionsPosition({"visible": true, "scrollTop": 0})
                );

                if(contentRef.current) {
                    setTimeout(() => {
                        contentRef.current.scrollTop = 0;
                    }, 0);
                }
                pullMarkets("primary", []);
            } else {
                if(stockPredictions["symbol"] !== props.ticker) {
                    dispatch(
                        updateStockPredictionsSymbol(`${props.ticker}`)
                    );
                    dispatch(
                        updateStockPredictionsPosition({"visible": true, "scrollTop": 0})
                    );
                    dispatch(
                        updateStockPredictions(
                            {
                                "predictions": [],
                                "data": [],
                                "liveCount": 0,
                                "dataLoading": true
                            }
                        )
                    );

                    if(contentRef.current) {
                        setTimeout(() => {
                            contentRef.current.scrollTop = 0;
                        }, 0);
                    }
                    pullMarkets("primary", []);
                } else {
                    if(contentRef.current) {
                        setTimeout(() => {
                            if((contentRef.current?.scrollHeight - contentRef.current?.clientHeight) >= stockPredictions["position"]["scrollTop"]) {
                                contentRef.current.scrollTop = stockPredictions["position"]["scrollTop"];
                            }
                        }, 0);
                    }
                }
            }
        } else {
            if(!(props.predictionId === undefined || props.predictionId === null || props.predictionId === "")) {
                if(stockPageSelection["selection"]["type"] !== "Prediction") {
                    if(contentRef.current) {
                        setTimeout(() => {
                            if(contentRef.current) {
                                contentRef.current.scrollTop = 0;
                            }
                        }, 0);
                    }

                    pullSpecificPrediction();
                } else if(stockPageSelection["selection"]["selectedDesc"]["prediction"]["_id"] !== props.predictionId) {
                    dispatch(
                        setPredictionPlotData(
                            {
                                "labels": [],
                                "plotOne": [],
                                "plotTwo": [],
                                "dataLoading": true
                            }
                        )
                    );
                    dispatch(
                        updatePredictionPlotDataIndex(0)
                    );
    
                    if(contentRef.current) {
                        setTimeout(() => {
                            contentRef.current.scrollTop = 0;
                        }, 0);
                    }
    
                    pullSpecificPrediction();
                } else {
                    if(contentRef.current) {
                        setTimeout(() => {
                            if((contentRef.current?.scrollHeight - contentRef.current?.clientHeight) >= stockPageSelection["scrollTop"]) {
                                contentRef.current.scrollTop = 0; //stockPageSelection["scrollTop"];
                            }
                        }, 0);
                    }
                }
            }
        }
    }, [props.displayView, props.predictionId, contentRef.current, visibleContentCount]);

    const pullSpecificPost = async () => {
        if(stockPosts["posts"]["data"].some(doc => doc._id === props.postId)) {
            dispatch(
                setStockPageSelectionSymbol(`${props.ticker}`)
            );
            dispatch(
                setStockPageSelection(
                    {
                        "type": "Post",
                        "selectedDesc": {
                            "desc": stockPosts["posts"]["data"].filter(doc => doc._id === props.postId)[0]
                        }
                    }
                )
            );
            dispatch(
                updateStockPageSelectionScrollTop(0)
            );
        } else {
            await generalOpx.axiosInstance.put(`/content/posts/specific-post`, 
                {
                    "postId": props.postId
                }
            ).then(
                async (response) => {
                    if(response.data["status"] === "success") {
                        dispatch(
                            setStockPageSelectionSymbol(`${props.ticker}`)
                        );
                        dispatch(
                            setStockPageSelection(
                                {
                                    "type": "Post",
                                    "selectedDesc": {
                                        "desc": response.data["data"]
                                    }
                                }
                            )
                        );
                        dispatch(
                            updateStockPageSelectionScrollTop(0)
                        );

                        if(user && Object.keys(response.data["data"]).length > 0) {
                            if(u_postEngagement.length === 0) {
                                const postIds = [props.postId];
                                const postEngagements = await generalOpx.axiosInstance.put(`/content/posts/post-engagements`, {"postIds": postIds});

                                if(postEngagements.data["status"] === "success" && postEngagements.data["data"].length > 0) {
                                    dispatch(
                                        setPostEngagement(postEngagements.data["data"])
                                    );
                                }
                            } else {
                                const postIdsToEliminate = [...u_postEngagement.map(p_data => p_data.postId)];
                                const postIds = [...[props.postId].filter(({_id}) => !postIdsToEliminate.includes(_id)).map(({_id}) => _id)];

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
                    }
                }
            )
        }
    }

    const [homePagePostsBeingUpdated, setHomePagePostsBeingUpdated] = useState(false);
    const pullPosts = async (type, p_ninclude) => {
        if(visibleContentCount !== 0) {
            if(type === "primary" || stockPosts["posts"]["data"].length < stockPosts["posts"]["dataCount"]) {
                await generalOpx.axiosInstance.put(`/content/posts/asset-posts`, 
                    {
                        "type": type,
                        "limit": visibleContentCount,
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
        if(props.displayView === "posts") {
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

                if(contentRef.current) {
                    setTimeout(() => {
                        contentRef.current.scrollTop = 0;
                    }, 0);
                }

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

                    if(contentRef.current) {
                        setTimeout(() => {
                            contentRef.current.scrollTop = 0;
                        }, 0);
                    }
                    pullPosts("primary", []);
                } else {
                    if(contentRef.current) {
                        setTimeout(() => {
                            if((contentRef.current?.scrollHeight - contentRef.current?.clientHeight) >= stockPosts["position"]["scrollTop"]) {
                                contentRef.current.scrollTop = stockPosts["position"]["scrollTop"];
                            }
                        }, 0);
                    }
                }
            }
        } else {
            if(!(props.postId === undefined || props.postId === null || props.postId === "")) {
                if(stockPageSelection["selection"]["type"] !== "Post") {
                    if(contentRef.current) {
                        setTimeout(() => {
                            contentRef.current.scrollTop = 0;
                        }, 0);
                    }

                    pullSpecificPost();
                } else if(stockPageSelection["selection"]["selectedDesc"]["desc"]["_id"] !== props.postId) {
                    if(contentRef.current) {
                        setTimeout(() => {
                            contentRef.current.scrollTop = 0;
                        }, 0);
                    }
    
                    pullSpecificPost();
                } else {
                    if(contentRef.current) {
                        setTimeout(() => {
                            if((contentRef.current?.scrollHeight - contentRef.current?.clientHeight) >= stockPageSelection["scrollTop"]) {
                                contentRef.current.scrollTop = 0; //stockPageSelection["scrollTop"];
                            }
                        }, 0);
                    }
                }
            }
        }
    }, [props.displayView, props.postId, contentRef.current, visibleContentCount]);

    useEffect(() => {
        if(props.predictionId === undefined || props.predictionId === null || props.predictionId === "") {
            if(props.newsId === undefined || props.newsId === null || props.newsId === "") {
                if(props.postId === undefined || props.postId === null || props.postId === "") {
                    dispatch(
                        setStockPageSelectionSymbol("")
                    );
                    dispatch(
                        setStockPageSelection(
                            {
                                "type": "",
                                "selectedDesc": {}
                            }
                        )
                    );
                    dispatch(
                        updateStockPageSelectionScrollTop(0)
                    );
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

    const [addToWatchlistMarker, setAddToWatchlistMarker] = useState(0);
    const [addToWatchlistMarkerHide, setAddToWatchlistMarkerHide] = useState(true);
    const addRemoveFromWatchlist = async () => {
        const marketStocks = ["S:-DIA", "S:-QQQ", "S:-SPY", "S:-VXX"];

        let homePageWatchlistFunction = {...homePageWatchlist["watchlist"]}, 
        requestBody = {"symbol": props.ticker, "distinction": user ? "user" : "visitor"};
        if([...u_watchlist].includes(props.ticker)) {
            requestBody["action"] = "removed";

            setAddToWatchlistMarker(1);
            setAddToWatchlistMarkerHide(false);
            dispatch(
                removeFromWatchlist(props.ticker)
            );
            
            let pageDataFunction = {...pageData["page"]["data"], "watchedBy": pageData["page"]["data"]["watchedBy"] - 1}
            dispatch(
                updateStockPageData(
                    {
                        "data": pageDataFunction,
                        "dataLoading": false
                    }
                )
            );
            
            if(!marketStocks.includes(props.ticker)) {
                const u_setWatchlist = homePageWatchlistFunction["watching"].map(obj => `S:-${obj.symbol}`);
                if(u_setWatchlist.includes(props.ticker)) {
                    homePageWatchlistFunction["watching"] = homePageWatchlistFunction["watching"].filter(obj => `S:-${obj.symbol}` !== props.ticker)
                }

                dispatch(
                    updateHomePageWatchlist(homePageWatchlistFunction)
                );
            }
            

            setTimeout(() => {
                setAddToWatchlistMarkerHide(true);
                setTimeout(() => {
                    setAddToWatchlistMarker(0);
                }, 750);
            }, 2000);
        } else {
            requestBody["action"] = "add";

            setAddToWatchlistMarker(2);
            setAddToWatchlistMarkerHide(false);
            dispatch(
                addToWatchlist(props.ticker)
            );
            
            let pageDataFunction = {...pageData["page"]["data"], "watchedBy": pageData["page"]["data"]["watchedBy"] + 1}
            dispatch(
                updateStockPageData(
                    {
                        "data": pageDataFunction,
                        "dataLoading": false
                    }
                )
            );

            if(!marketStocks.includes(props.ticker)) {
                const today = new Date();
                const todayUnix = getUnixTime(today);

                const watchingStocks = homePageWatchlistFunction["stocks"].map(obj => `S:-${obj.symbol}`);
                if(watchingStocks.includes(props.ticker)) {
                    homePageWatchlistFunction["stocks"] = homePageWatchlistFunction["stocks"].filter(obj => `S:-${obj.symbol}` !== props.ticker);
                }

                const u_setWatchlist = homePageWatchlistFunction["watching"].map(obj => `S:-${obj.symbol}`);
                if(!u_setWatchlist.includes(props.ticker)) {
                    homePageWatchlistFunction["watching"] = [
                        ...homePageWatchlistFunction["watching"],
                        {
                            change: quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["open"],
                            changePerc: (quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["open"]) / quoteData["quote"]["data"]["open"],
                            close: quoteData["quote"]["data"]["close"],
                            high: quoteData["quote"]["data"]["high"],
                            low: quoteData["quote"]["data"]["low"],
                            marketCap: pageData["page"]["data"]["sharesOutstanding"] === 0 ? pageData["page"]["data"]["marketCap"] : quoteData["quote"]["data"]["close"] * pageData["page"]["data"]["sharesOutstanding"],
                            name: pageData["page"]["data"]["name"],
                            open: quoteData["quote"]["data"]["open"],
                            profileImage: pageData["page"]["data"]["profileImage"],
                            symbol: props.ticker.slice(3, props.ticker.length),
                            timeStamp: todayUnix,
                            type: "S",
                            volume: quoteData["quote"]["data"]["volume"],
                            _id: `finulab-just-addedToWatchlist-${props.ticker}`
                        }
                    ];
                }

                dispatch(
                    updateHomePageWatchlist(homePageWatchlistFunction)
                );
            }
            
            setTimeout(() => {
                setAddToWatchlistMarkerHide(true);
                setTimeout(() => {
                    setAddToWatchlistMarker(0);
                }, 750);
            }, 2000);
        }

        await generalOpx.axiosInstance.post(`/users/modify-watchlist`, requestBody);
    }

    const openSiteNewTab = (url) => {window.open(url, '_blank');};

    const handlePostMount = useCallback((node, index, picArr, vidArr) => {
        if(node && !stockPosts["processedHeights"]["processedRefs"][index]) {
            if(!(node === undefined || node === null)) {
                if(stockPosts["processedHeights"]["processedRefs"][index] === undefined || stockPosts["processedHeights"]["processedRefs"][index] === null) {
                    let timeOutTime = 0;
                    picArr.length + vidArr.length === 0 ? timeOutTime = 200 : vidArr.length > 0 ? timeOutTime = 2000 : timeOutTime = 1000;

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

    return(
        <div className="large-stocksPageWrapper">
            <div className="large-stocksPageChartandNewsWrapper">
                <div className="large-stocksChartHeader">
                    <div className="large-stocksProfileImgandPriceTodayContainer">
                        <div className="large-stocksProfileImgandPriceTodayInnerContainer">
                            {pageData["page"]["dataLoading"] ?
                                <div className="large-stocksProfileImageLoading"/> :
                                <img src={pageData["page"]["data"]["profileImage"]} alt="" className="large-stocksProfileImage" />
                            }
                            <div className="large-stocksPriceTodayContainer">
                                <div className="large-stocksTopTickerDesc">{`${props.ticker}`.slice(3, `${props.ticker}`.length)}</div>
                                <div className="large-stocksTodayPriceChangeContainer">
                                    {quoteData["quote"]["dataLoading"] ?
                                        <span className="large-stocksTodayPriceDescLoading"/> : 
                                        <span className="large-stocksTodayPriceDesc">${generalOpx.formatFigures.format(quoteData["quote"]["data"]["close"])}</span>
                                    }
                                    <span className="large-stocksTodayPriceChangeDesc">
                                        <ArrowDropUp className="large-stocksTodayPriceChangeDescIcon"
                                            style={quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["previousClose"] >= 0 ? 
                                                {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                            }
                                        />
                                        <span 
                                                style={quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["previousClose"] >= 0 ?
                                                    {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                }
                                            >
                                            {`${generalOpx.formatLargeFigures(Math.abs(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["previousClose"]), 2)}`}&nbsp;&nbsp;{`(${generalOpx.formatFigures.format(Math.abs((quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["previousClose"]) / quoteData["quote"]["data"]["previousClose"]))}%)`}
                                        </span>
                                    </span>
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
                                                style={{"left": `63px`}}
                                            />
                                        </div> : 
                                        <>
                                            {(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"]) <= 0.05 ?
                                                <div className="large-stocksProfilePriceChangeBarSectsContainer">
                                                    <div className="large-stocksProfilePriceChangeBarSectTwoFullyFilled"/>
                                                    <ArrowDropUp 
                                                        className="large-stocksProfilePriceChangeBarSectPointer"
                                                        style={{"left": `calc((${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])} * 75px) - 12px)`}}
                                                    />
                                                </div> : 
                                                <>
                                                    {(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"]) >= 0.95 ?
                                                        <div className="large-stocksProfilePriceChangeBarSectsContainer">
                                                            <div className="large-stocksProfilePriceChangeBarSectOneFullyFilled"/>
                                                            <ArrowDropUp 
                                                                className="large-stocksProfilePriceChangeBarSectPointer"
                                                                style={{"left": `calc((${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])} * 75px) - 12px)`}}
                                                            />
                                                        </div> : 
                                                        <div className="large-stocksProfilePriceChangeBarSectsContainer">
                                                            <div className="large-stocksProfilePriceChangeBarSectOne"
                                                                style={{
                                                                    "width": `calc(${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])} * 75px)`,
                                                                    "minWidth": `calc(${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])} * 75px)`,
                                                                    "maxWidth": `calc(${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])} * 75px)`
                                                                }}
                                                            />
                                                            <div className="large-stocksProfilePriceChangeBarSectTwo"
                                                                style={{
                                                                    "width": `calc((1 - ${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])}) * 75px)`,
                                                                    "minWidth": `calc((1 - ${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])}) * 75px)`,
                                                                    "maxWidth": `calc((1 - ${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])}) * 75px)`
                                                                }}
                                                            />
                                                            <ArrowDropUp 
                                                                className="large-stocksProfilePriceChangeBarSectPointer"
                                                                style={{"left": `calc((${(quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["low"]) / (quoteData["quote"]["data"]["high"] - quoteData["quote"]["data"]["low"])} * 75px) - 12px)`}}
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
                                        Div Yield
                                    </p>
                                </span>
                                <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                <span className="large-stocksHeaderQuoteSectionLineFigure">
                                    {quoteData["quote"]["dataLoading"] ?
                                        <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                        <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                style={{"textAlign": "right"}}
                                            >
                                            {pageData["page"]["data"]["dividendYield"] === 0 ? `-` : `${generalOpx.formatFigures.format(pageData["page"]["data"]["dividendYield"])}`}
                                        </p>
                                    }
                                </span>
                                <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                            </div>
                            <div className="large-stocksHeaderQuoteSectionLine">
                                <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                <span className="large-stocksHeaderQuoteSectionLineDesc">
                                    <p className="large-stocksHeaderQuoteSectionLineDescBlock">
                                        1-YR Low
                                    </p>
                                </span>
                                <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                <span className="large-stocksHeaderQuoteSectionLineFigure">
                                    {quoteData["quote"]["dataLoading"] ?
                                        <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                        <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                style={{"textAlign": "right"}}
                                            >
                                            ${generalOpx.formatFigures.format(quoteData["quote"]["data"]["yrLow"])}
                                        </p>
                                    }
                                </span>
                                <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                            </div>
                            <div className="large-stocksHeaderQuoteSectionLine">
                                <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                <span className="large-stocksHeaderQuoteSectionLineDesc">
                                    <p className="large-stocksHeaderQuoteSectionLineDescBlock">
                                        1-YR High
                                    </p>
                                </span>
                                <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                <span className="large-stocksHeaderQuoteSectionLineFigure">
                                    {quoteData["quote"]["dataLoading"] ?
                                        <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                        <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                style={{"textAlign": "right"}}
                                            >
                                            ${generalOpx.formatFigures.format(quoteData["quote"]["data"]["yrHigh"])}
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
                                        {pageData["page"]["data"]["assetType"] === "ETF" ? `Expense Ratio` : `P/E`}
                                    </p>
                                </span>
                                <span className="large-stocksHeaderQuoteSectionLineSpace"></span>
                                <span className="large-stocksHeaderQuoteSectionLineFigure">
                                    {quoteData["quote"]["dataLoading"] ?
                                        <p className="large-stocksHeaderQuoteSectionLineDescBlockLoading"/> :
                                        <p className="large-stocksHeaderQuoteSectionLineDescBlock"
                                                style={{"textAlign": "right"}}
                                            >
                                            {pageData["page"]["data"]["assetType"] === "ETF" ? 
                                                <>
                                                    {pageData["page"]["data"]["expenseRatio"] === 0 ? `-` : `${generalOpx.formatFigures.format(pageData["page"]["data"]["expenseRatio"])}`}
                                                </> : 
                                                <>
                                                    {pageData["page"]["data"]["priceToEarnings"] === 0 ? `-` : `${generalOpx.formatFigures.format(pageData["page"]["data"]["priceToEarnings"])}`}
                                                </>
                                            }
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
                                            {generalOpx.formatLargeFigures(quoteData["quote"]["data"]["averageVolume"], 2)}
                                        </p>
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="large-stocksChartDivider"/>
                <div className="large-stocksChartContainer">
                    {pageData["page"]["dataLoading"] || advancedChart === null ?
                        null: 
                        advancedChart
                    }
                </div>
                <div className="large-stocksChartDivider"/>
                <div className="large-stocksNewsContainer">
                    <div className="large-stocksNewsHeaderContainer">
                        <div className="large-stocksNewsHeader">
                            Market News&nbsp;&nbsp;•&nbsp;&nbsp;{pageData["page"]["data"]["name"]}
                            <div className="large-stocksNewsViewToggleInnerContainer">
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
                        <div className="large-stocksNewsTVNotice">
                            {`The charting technology is provided by`}&nbsp;
                            <button className="large-stocksNewsTVNoticeBtn" onClick={() => openSiteNewTab("https://www.tradingview.com")}>
                                TradingView
                            </button>
                            {`. Learn how to use the`}&nbsp;
                            <button className="large-stocksNewsTVNoticeBtn" onClick={() => openSiteNewTab("https://www.tradingview.com/screener/")}>
                                TradingView Stock Screener
                            </button>
                            {`.`}
                        </div>
                        {/*
                        <div className="large-stocksNewsHeaderOptnsContainer">
                            <button className="large-stocksNewsHeaderOptnBtn">Trending</button>
                            <button className="large-stocksNewsHeaderOptnBtn" style={{"color": "var(--primary-bg-10)", "backgroundColor": "var(--primary-bg-01)"}}>Popular</button>
                            <button className="large-stocksNewsHeaderOptnBtn">Latest</button>
                        </div>
                        */}
                    </div>
                    {newsData["news"]["dataLoading"] || newsData["news"]["data"].length === 0 || (newsData["news"]["data"].length <= newsData["index"])?
                        <div className="large-stocksNewsInnerContainer">
                            <div className="large-stocksNewsStoriesBlock">
                                <div className="large-stocksNewsSegment" style={{"marginRight": "20px", "borderBottom": "solid 1px var(--primary-bg-07)"}}>
                                    <MiniaturizedNews loading={true}/>
                                </div>
                                <div className="large-stocksNewsSegment" style={{"borderBottom": "solid 1px var(--primary-bg-07)"}}>
                                    <MiniaturizedNews loading={true}/>
                                </div>
                            </div>
                            <div className="large-stocksNewsStoriesBlock">
                                <div className="large-stocksNewsSegment" style={{"marginRight": "20px"}}>
                                    <MiniaturizedNews loading={true}/>
                                </div>    
                                <div className="large-stocksNewsSegment" style={{"marginRight": "20px"}}>
                                    <MiniaturizedNews loading={true}/>
                                </div>
                            </div>
                        </div> : 
                        <div className="large-stocksNewsInnerContainer">
                            <div className="large-stocksNewsStoriesBlock">
                                <div className="large-stocksNewsSegment" style={{"marginRight": "20px", "borderBottom": "solid 1px var(--primary-bg-07)"}}>
                                    <MiniaturizedNews  
                                        loading={false}
                                        type={"stockPage"}
                                        pred_ticker={props.ticker}
                                        user={user ? user.user : "visitor"}
                                        desc={newsData["news"]["data"][newsData["index"]][0]}
                                    />
                                </div>
                                <div className="large-stocksNewsSegment" style={{"borderBottom": "solid 1px var(--primary-bg-07)"}}>
                                    <MiniaturizedNews  
                                        loading={false}
                                        type={"stockPage"}
                                        pred_ticker={props.ticker}
                                        user={user ? user.user : "visitor"}
                                        desc={newsData["news"]["data"][newsData["index"]][1]}
                                    />
                                </div>
                            </div>
                            <div className="large-stocksNewsStoriesBlock">
                                <div className="large-stocksNewsSegment" style={{"marginRight": "20px"}}>
                                    <MiniaturizedNews  
                                        loading={false}
                                        type={"stockPage"}
                                        pred_ticker={props.ticker}
                                        user={user ? user.user : "visitor"}
                                        desc={newsData["news"]["data"][newsData["index"]][2]}
                                    />
                                </div>    
                                <div className="large-stocksNewsSegment" style={{"marginRight": "20px"}}>
                                    <MiniaturizedNews  
                                        loading={false}
                                        type={"stockPage"}
                                        pred_ticker={props.ticker}
                                        user={user ? user.user : "visitor"}
                                        desc={newsData["news"]["data"][newsData["index"]][3]}
                                    />
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </div>
            <div className="large-stocksPageMoreDataContainer">
                <div className="large-stocksPageMoreDataInnerContainer"
                        ref={contentRef} onScroll={handlePageScroll}
                    >
                    <div className="large-stocksPageMoreDataHeader">
                        {stockPageSelection["selection"]["type"] === "" ?
                            <>
                                <button className="large-stocksPageMoreDataOptnBtn"
                                        onClick={() => navigate(`/stocks/${props.ticker}`)}
                                        style={props.displayView === "" ? {"fontWeight": "500", "color": "var(--primary-bg-01)"} : {}}
                                    >
                                    Data
                                    {props.displayView === "" ?
                                        <div className="large-stocksPageMoreDataOptnUnderline" 
                                            style={{"backgroundColor": "var(--primary-blue-11)"}}
                                        /> : null
                                    }
                                </button>
                                <button className="large-stocksPageMoreDataOptnBtn"
                                        onClick={() => navigate(`/stocks/${props.ticker}/markets`)}
                                        style={props.displayView === "markets" ? {"fontWeight": "500", "color": "var(--primary-bg-01)"} : {}}
                                    >
                                    Markets
                                    {props.displayView === "markets" ?
                                        <div className="large-stocksPageMoreDataOptnUnderline" 
                                            style={{"backgroundColor": "var(--primary-blue-11)"}}
                                        /> : null
                                    }
                                </button>
                                <button className="large-stocksPageMoreDataOptnBtn"
                                        onClick={() => navigate(`/stocks/${props.ticker}/posts`)}
                                        style={props.displayView === "posts" ? {"fontWeight": "500", "color": "var(--primary-bg-01)"} : {}}
                                    >
                                    Posts
                                    {props.displayView === "posts" ?
                                        <div className="large-stocksPageMoreDataOptnUnderline" 
                                            style={{"backgroundColor": "var(--primary-blue-11)"}}
                                        /> : null
                                    }
                                </button>
                            </> : 
                            <div className="large-homePageNonHomeDescContainer"
                                    style={{"marginLeft": "10px", "width": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)"}}
                                >
                                <div className="large-homePageNonHomeDesc">
                                    <span className="large-homePageNonHomeDescTop">
                                        <button className="large-homePageBackBtn"
                                                onClick={() => navigate(-1)}
                                                style={{"marginLeft": "0px", "marginRight": "5px"}}
                                            >
                                            <KeyboardBackspace className="large-homePageBackBtnIcon"/>
                                        </button>
                                        {stockPageSelection["selection"]["type"]}
                                    </span>
                                </div>
                            </div>
                        }
                    </div>
                    <div className="large-stocksPageMoreDataHeaderMargin"/>
                    {stockPageSelection["selection"]["type"] === "" ?
                        <>
                            {props.displayView === "" ?
                                <>
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
                                        <div className="large-stocksPageMoreDataAboutMarketCapContainer">
                                            {pageData["page"]["data"]["assetType"] === "ETF" ? `AUM: ` : `Market Cap: `}
                                            {pageData["page"]["data"]["sharesOutstanding"] === 0 ? 
                                                generalOpx.formatLargeFigures(pageData["page"]["data"]["marketCap"], 2) : 
                                                generalOpx.formatLargeFigures(quoteData["quote"]["data"]["close"] * pageData["page"]["data"]["sharesOutstanding"], 2)
                                            }
                                            <button className="large-stocksAddToWatchlistBtn"
                                                    disabled={
                                                        pageData["page"]["dataLoading"] || quoteData["quote"]["dataLoading"]
                                                        || addToWatchlistMarker !== 0 || !addToWatchlistMarkerHide
                                                    }
                                                    onClick={() => addRemoveFromWatchlist()}
                                                >
                                                <Visibility className='large-stocksAddToWatchlistBtnIcon'/>
                                                Watching:&nbsp;
                                                {generalOpx.formatLargeFigures(pageData["page"]["data"]["watchedBy"], 2)}
                                                <div className="large-stocksAddToWatchlistBtnDivider"/>
                                                <div className="large-stocksAddToWatchlistInnerDesc">
                                                    {[...u_watchlist].includes(props.ticker) ?
                                                        <AddTask className='large-stocksAddToWatchlistBtnThirdIcon'/> :
                                                        <Add className='large-stocksAddToWatchlistBtnSecondIcon'/>
                                                    }
                                                    
                                                </div>
                                            </button>
                                        </div>
                                        <div className="large-stocksPageMoreDataAboutWatchlistAdditionDesc"
                                                style={addToWatchlistMarkerHide ?
                                                    {"transform": "translateX(calc(100% + 10px))"} : {"transform": "translateX(calc(0px))"}
                                                }
                                            >
                                            {addToWatchlistMarker === 1 ?
                                                <>
                                                    <Check className='large-stocksAddToWatchlistBtnFourthIcon'/>
                                                    <span style={{"fontWeight": "500"}}>{`${props.ticker.slice(3, props.ticker.length)}`}</span>&nbsp;is&nbsp;<span style={{"fontWeight": "500"}}>removed</span>&nbsp;from your watchlist
                                                </> : 
                                                <>
                                                    {addToWatchlistMarker === 2 ?
                                                        <>
                                                            <Check className='large-stocksAddToWatchlistBtnFourthIcon'/>
                                                            <span style={{"fontWeight": "500"}}>{`${props.ticker.slice(3, props.ticker.length)}`}</span>&nbsp;has been&nbsp;<span style={{"fontWeight": "500"}}>added</span>&nbsp;to your watchlist
                                                        </> : null
                                                    }
                                                </> 
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
                                        {pageData["page"]["data"]["assetType"] === "ETF" ?
                                            null : 
                                            <div className="large-stocksPageMoreDataAboutBodyCityanContactContainer">
                                                <div className="large-stocksPageMoreDataAboutBodyCityContainer">
                                                    {pageData["page"]["data"]["addressFlag"] === "" ?
                                                        null : 
                                                        <img src={pageData["page"]["data"]["addressFlag"]} alt="" className="large-stocksPageMoreDataAboutCityImg" />
                                                    }
                                                    <span className="large-stocksPageMoreDataAboutCityDesc">{pageData["page"]["data"]["address"]}</span>
                                                </div>
                                                <div className="large-stocksPageMoreDataAboutBodyCityContainer">
                                                    <button className="large-stocksPageMoreDataAboutWebsiteDescBtn" 
                                                        onClick={() => openSiteNewTab(pageData["page"]["data"]["website"])}
                                                        >
                                                        {pageData["page"]["data"]["website"]}
                                                    </button>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                    <RecommendationGraph 
                                        distinction={user ? "user" : "visitor"}
                                        asset={pageData["page"]["data"]["symbol"]} 
                                        a_recommendations={pageData["page"]["data"]["recommendations"]} 
                                    />
                                    <div className="large-stocksPageMoreDataAboutContainer">
                                        <PriceHistory asset={pageData["page"]["data"]["symbol"]} />
                                    </div>
                                </> :
                                <>
                                    {props.displayView === "markets" ?
                                        <>
                                            {stockPredictions["markets"]["dataLoading"] ?
                                                <>
                                                    {Array(visibleContentCount + 1).fill(0).map((desc, index) => (
                                                            <div className="large-homePageRightBarPredictionContainer" key={`predictions-loading-stocks-${index}`}>
                                                                <div className="large-homePageRightBarPredictionInnerContainer">
                                                                    <MiniaturizedPrediction loading={true}/>
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                </> : 
                                                <>
                                                    {stockPredictions["markets"]["predictions"].map((prediction_desc, index) => (
                                                            <div className="large-homePageRightBarPredictionContainer" 
                                                                    key={`stock-prediction-${prediction_desc._id}`}
                                                                    style={{"backgroundColor": "rgba(0, 0, 0, 1)"}}
                                                                >
                                                                <div className="large-dashboardRightBarPredictionInnerContainer"
                                                                        ref={index === (stockPredictions["markets"]["predictions"].length - 2) ? lastMarketElementRef : null}
                                                                    >
                                                                    <MiniaturizedPrediction 
                                                                        pred_ticker={props.ticker}
                                                                        pred_location={"stockPage"}
                                                                        mouseOnComponent={1}
                                                                        predictionDesc={prediction_desc} 
                                                                        user={user ? user.user : "visitor"}
                                                                        marketDesc={stockPredictions["markets"]["data"].filter(doc => doc.predictionId == prediction_desc._id)}
                                                                        ownership={u_marketHoldings.filter(doc => doc.predictionId === prediction_desc._id)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                    {homePageMarketsBeingUpdated ?
                                                        <>
                                                            {Array(visibleContentCount + 1).fill(0).map((desc, index) => (
                                                                    <div className="large-homePageRightBarPredictionContainer" key={`predictions-loading-stocks-${index}`}>
                                                                        <div className="large-homePageRightBarPredictionInnerContainer">
                                                                            <MiniaturizedPrediction loading={true}/>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            }
                                                        </> : null
                                                    }
                                                </>
                                            }
                                        </> : 
                                        <>
                                            {props.displayView === "posts" ?
                                                <>
                                                    {stockPosts["posts"]["dataLoading"] ?
                                                        <>
                                                            {Array(2 * (visibleContentCount + 1)).fill(0).map((desc, index) => (
                                                                    <div className="large-stocksPostContainer" key={`posts-loading-stocks-${index}`}>
                                                                        <Post loading={true}/>
                                                                    </div>
                                                                ))
                                                            }
                                                        </> : 
                                                        <>
                                                            {stockPosts["posts"]["data"].map((post_desc, index) => (
                                                                    <div className="large-stocksPostContainer" 
                                                                            key={`stock-post-${post_desc["_id"]}`}
                                                                            ref={stockPosts["processedHeights"]["postHeights"].length === 0 ? null : 
                                                                                (stockPosts["processedHeights"]["processedRefs"][index] === undefined || stockPosts["processedHeights"]["processedRefs"][index] === null
                                                                                    || stockPosts["processedHeights"]["processedRefs"][index] === false
                                                                                ) && stockPosts["processedHeights"]["postHeights"][index] === 0 ? null : index === (stockPosts["posts"]["data"].length - 2) ? lastPostElementRef : null
                                                                            }
                                                                        >
                                                                        <div className="large-stocksPostInnerContainer"
                                                                                key={`stock-inner-cont-post-${post_desc["_id"]}`}
                                                                                ref={stockPosts["processedHeights"]["postHeights"].length === 0 ? null :
                                                                                    (stockPosts["processedHeights"]["processedRefs"][index] === undefined || stockPosts["processedHeights"]["processedRefs"][index] === null
                                                                                        || stockPosts["processedHeights"]["processedRefs"][index] === false
                                                                                    ) && stockPosts["processedHeights"]["postHeights"][index] === 0 ? node => handlePostMount(node, index, post_desc["photos"], post_desc["videos"]) : null
                                                                                }
                                                                                style={stockPosts["processedHeights"]["postHeights"].length === stockPosts["posts"]["data"].length
                                                                                    && stockPosts["processedHeights"]["processedRefs"][index] && stockPosts["processedHeights"]["postHeights"][index] !== 0 ? 
                                                                                    {"height": `${stockPosts["processedHeights"]["postHeights"][index]}px`, "minHeight": `${stockPosts["processedHeights"]["postHeights"][index]}px`, "maxHeight": `${stockPosts["processedHeights"]["postHeights"][index][index]}px`} 
                                                                                    : {}
                                                                                }
                                                                            >
                                                                            <Post 
                                                                                user={user ? user.user : "visitor"}
                                                                                pred_ticker={props.ticker}
                                                                                type={"stockPage"}
                                                                                view={"mini"}
                                                                                details={post_desc} 
                                                                                loading={false} 
                                                                                borderBottom={index === (stockPosts["posts"]["data"].length - 1)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            }
                                                            {homePagePostsBeingUpdated ?
                                                                <>
                                                                    {Array(visibleContentCount + 1).fill(0).map((desc, index) => (
                                                                            <div className="large-stocksPostContainer" key={`posts-loading-stocks-${index}`}>
                                                                                <Post loading={true}/>
                                                                            </div>
                                                                        ))
                                                                    }
                                                                </> : null
                                                            }
                                                        </>
                                                    }
                                                </> : null
                                            }
                                        </>
                                    }
                                </>
                            }
                        </> : 
                        <>
                            {stockPageSelection["selection"]["type"] === "Prediction" ?
                                <Prediction
                                    pred_location={"stockPage"}
                                    user={user ? user.user : "visitor"}
                                    predictionDesc={stockPageSelection["selection"]["selectedDesc"]["prediction"]} 
                                    marketDesc={stockPageSelection["selection"]["selectedDesc"]["markets"]}
                                    ownership={u_marketHoldings.filter(doc => doc.predictionId === stockPageSelection["selection"]["selectedDesc"]["prediction"]["_id"])}
                                /> :
                                <>
                                    {stockPageSelection["selection"]["type"] === "News" ?
                                        <News 
                                            type={"stockPage"}
                                            pred_ticker={props.ticker}
                                            user={user ? user.user : "visitor"}
                                            desc={stockPageSelection["selection"]["selectedDesc"]["desc"]}
                                        /> : 
                                        <>
                                            {stockPageSelection["selection"]["type"] === "Post" ?
                                                <Post 
                                                    view={"max"}
                                                    type={"stockPage-selection"}
                                                    user={user ? user.user : "visitor"}
                                                    details={stockPageSelection["selection"]["selectedDesc"]["desc"]} 
                                                    loading={false} 
                                                /> : null
                                            }
                                        </>
                                    }
                                </>
                            }
                        </>
                    }
                </div>
            </div>
        </div>
    )
}