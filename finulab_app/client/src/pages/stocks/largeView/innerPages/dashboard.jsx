import './stocks.css';
import './dashboard.css';
import '../../../home/largeView/home.css';
import '../../../../components/priceHistory/index.css';
import '../../../../components/recommendations/index.css';

import {useNavigate} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {useRef, useState, useEffect, useLayoutEffect, useCallback} from 'react';
import {List, ChevronLeft, ChevronRight, ArrowDropUp, Balance, Equalizer, TrendingUp, TrendingDown, Check, KeyboardBackspace} from '@mui/icons-material';

import News from '../../../../components/news/news';
import generalOpx from '../../../../functions/generalFunctions';
import Prediction from '../../../../components/prediction/prediction';
import MiniaturizedNews from '../../../../components/miniaturized/news/mini-news';
import MiniaturizedPrediction from '../../../../components/miniaturized/prediction/mini-prediction';

import {selectUser} from '../../../../reduxStore/user';
import {updatePredictionPlotDataIndex, setPredictionPlotData} from '../../../../reduxStore/predictionPlotData';
import {setMarketHoldings, addToMarketHoldings, selectMarketHoldings} from '../../../../reduxStore/marketHoldings';
import {setNewsEngagement, addToNewsEngagement, selectNewsEngagement} from '../../../../reduxStore/newsEngagement';
import {setPredictionEngagement, addToPredictionEngagement, selectPredictionEngagement} from '../../../../reduxStore/predictionEngagement';
import {updateStockDashboardNews, updateStockDashboardNewsIndex, selectStockDashboardNews} from '../../../../reduxStore/stockDashboardNews';
import {updateStockDashboardData, updateStockDashboardSelection, updateStockDashboardIndex, selectStockDashboardData} from '../../../../reduxStore/stockDashboardData';
import {
    setStockDashboardMarketsSelected, 
    updateStockDashboardMarkets, 
    updateStockDashboardMarketsScrollTop, 
    updateStockDashboardMarketsSelectedScrollTop, 
    updateStockDashboardMarketsProcessedHeight,
    clearStockDashboardMarketsProcessedHeight,
    selectStockDashboardMarkets
} from '../../../../reduxStore/stockDashboardMarkets';

export default function StockMarketDashboard(props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const user = useSelector(selectUser);
    const u_newsEngagement = useSelector(selectNewsEngagement);
    const u_marketHoldings = useSelector(selectMarketHoldings);
    const dashboardNews = useSelector(selectStockDashboardNews);
    const dashboardState = useSelector(selectStockDashboardData);
    const dashboardMarkets = useSelector(selectStockDashboardMarkets);
    const u_predictionEngagement = useSelector(selectPredictionEngagement);
    
    const rankingRef = useRef();
    const [visibleElementsCount, setVisibleElementsCount] = useState(0);
    useLayoutEffect(() => {
        const visibleRankingsCountResizeUpdater = () => {
            if(rankingRef.current) {
                const visibleTableElementsCount = Math.floor(rankingRef.current.clientHeight / 55);
                setVisibleElementsCount(visibleTableElementsCount);
            }
        }

        window.addEventListener('resize', visibleRankingsCountResizeUpdater);
        visibleRankingsCountResizeUpdater();
        return () => window.removeEventListener('resize', visibleRankingsCountResizeUpdater);
    }, []);

    const marketsRef = useRef();
    const [visibleMarketsCount, setVisibleMarketsCount] = useState(0);
    useLayoutEffect(() => {
        const visibleMarketsCountResizeUpdater = () => {
            if(marketsRef.current) {
                const visibleMarketsCountFunction = Math.floor(marketsRef.current.clientHeight / 216);
                setVisibleMarketsCount(visibleMarketsCountFunction);
            }
        }

        window.addEventListener('resize', visibleMarketsCountResizeUpdater);
        visibleMarketsCountResizeUpdater();
        return () => window.removeEventListener('resize', visibleMarketsCountResizeUpdater);
    }, []);

    const dashboardIndexUpdate = (type, selection) => {
        if(visibleElementsCount > 0) {
            let currentIndex = dashboardState["index"];

            if(type === "back" && currentIndex > 0) {
                dispatch(
                    updateStockDashboardIndex(currentIndex - 1)
                );
            } else if(type === "forward" && currentIndex < (Math.ceil(50 / visibleElementsCount) - 1)) {
                dispatch(
                    updateStockDashboardIndex(currentIndex + 1)
                );
            } else if(type === "set") {
                dispatch(
                    updateStockDashboardIndex(selection)
                );
            }
        }
    }

    const displaySortRef = useRef();
    const [pageError, setPageError] =  useState(false);
    const [displaySort, setDisplaySort] = useState(false);
    const [rankingsLoading, setRankingsLoading] = useState(false);
    const pullDashboardRankings = async (type, selection) => {
        setRankingsLoading(true);

        const dataKeys = Object.keys(dashboardState["page"]["data"]);
        if(!dataKeys.includes(selection)) {
            await generalOpx.axiosInstance.put(`/stock-market-data/rankings`, {"sortBy": selection}).then(
                (response) => {
                    if(response.data["status"] === "success") {
                        if(pageError) {
                            setPageError(false);
                        }
    
                        if(type === "primary") {
                            let dashboardRankingData = {
                                [selection] : response.data["data"]
                            }

                            dispatch(
                                updateStockDashboardData(
                                    {
                                        "data": dashboardRankingData, "dataLoading": false
                                    }
                                )
                            );
                        } else if(type === "secondary") {
                            let dashboardRankingData = {
                                ...dashboardState["page"]["data"], [selection] : response.data["data"]
                            }
    
                            dispatch(
                                updateStockDashboardData(
                                    {
                                        "data": dashboardRankingData, "dataLoading": false
                                    }
                                )
                            );
                        }

                        dispatch(
                            updateStockDashboardSelection(selection)
                        );
                        dispatch(
                            updateStockDashboardIndex(0)
                        );
                        setDisplaySort(false);
                        setRankingsLoading(false);
                    } else {
                        setPageError(true);
                    }
                }
            ).catch(
                () => {
                    setPageError(true);
                }
            );
        } else {
            dispatch(
                updateStockDashboardSelection(selection)
            );
            dispatch(
                updateStockDashboardIndex(0)
            );
            setDisplaySort(false);
            setRankingsLoading(false);
        }
    }
    const displaySortToggle = () => {
        displaySort ? setDisplaySort(false) : setDisplaySort(true);
    }

    const pullSpecificNews = async () => {
        if(dashboardNews["news"]["data"].flatMap(arr => arr).some(doc => doc._id === props.newsId)) {
            dispatch(
                setStockDashboardMarketsSelected(
                    {
                        "type": "News",
                        "scrollTop": 0,
                        "selectedDesc": {
                            "desc": dashboardNews["news"]["data"].flatMap(arr => arr).filter(doc => doc._id === props.newsId)[0]
                        }
                    }
                )
            );
            dispatch(
                clearStockDashboardMarketsProcessedHeight()
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
                            setStockDashboardMarketsSelected(
                                {
                                    "type": "News",
                                    "scrollTop": 0,
                                    "selectedDesc": {
                                        "desc": response.data["data"]
                                    }
                                }
                            )
                        );
                        dispatch(
                            clearStockDashboardMarketsProcessedHeight()
                        );
                    }
                }
            );
        }
    }

    const [dashboardNewsBeingUpdated, setDashboardNewsBeingUpdated] = useState(false);
    const pullDashboardNews = async (ninclude) => {
        const symbol = "finulab-general";
        await generalOpx.axiosInstance.put(`/content/news/assets/${symbol}`,
            {
                "ninclude": ninclude
            }
        ).then(
            async (response) => {
                if(response.data["status"] === "success") {
                    let currentData = [...dashboardNews["news"]["data"]].concat(response.data["data"]);

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
                        updateStockDashboardNews(
                            {
                                "data": currentData, "dataLoading": false
                            }
                        )
                    );
                }
            }
        );
    }
    const updateDashboardNewsView = async (type) => {
        const currentIndex = dashboardNews["index"];

        if(type === "forward") {
            dispatch(
                updateStockDashboardNewsIndex(currentIndex + 1)
            );

            if(currentIndex % 2 === 0) {
                let ninclude = [];
                for(let i = 0; i < dashboardNews["news"]["data"].length; i++) {
                    for(let j = 0; j < dashboardNews["news"]["data"][i].length; j++) {
                        ninclude.push(dashboardNews["news"]["data"][i][j]["_id"]);
                    }
                }

                setDashboardNewsBeingUpdated(true);
                pullDashboardNews(ninclude);
                setDashboardNewsBeingUpdated(false);
            }
        } else if(type === "back") {
            if(currentIndex !== 0) {
                dispatch(
                    updateStockDashboardNewsIndex(currentIndex - 1)
                );
            }
        }
    }

    const pullSpecificPrediction = async () => {
        if(dashboardMarkets["markets"]["predictions"].filter(doc => doc._id === props.predictionId).length === 0) {
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
                            setStockDashboardMarketsSelected(
                                {
                                    "type": "Prediction",
                                    "scrollTop": 0,
                                    "selectedDesc": {
                                        "prediction": response.data["data"],
                                        "markets": response.data["markets"]
                                    }
                                }
                            )
                        );
                        dispatch(
                            clearStockDashboardMarketsProcessedHeight()
                        );
                    }
                }
            );
        } else {
            dispatch(
                setStockDashboardMarketsSelected(
                    {
                        "type": "Prediction",
                        "scrollTop": 0,
                        "selectedDesc": {
                            "prediction": dashboardMarkets["markets"]["predictions"].filter(doc => doc._id === props.predictionId)[0],
                            "markets": dashboardMarkets["markets"]["data"].filter(doc => doc.predictionId == props.predictionId)
                        }
                    }
                )
            );
            dispatch(
                clearStockDashboardMarketsProcessedHeight()
            );
        }
    }

    const [homePageMarketsBeingUpdated, setHomePageMarketsBeingUpdated] = useState(false);
    const pullDashboardMarkets = async (type, p_ninclude) => {
        if(visibleMarketsCount !== 0) {
            if(type === "primary" || dashboardMarkets["markets"]["predictions"].length < dashboardMarkets["markets"]["liveCount"]) {
                await generalOpx.axiosInstance.put(`/market/recommended`, 
                    {
                        "type": type,
                        "limit": visibleMarketsCount,
                        "p_ninclude": p_ninclude,
                        "interests": [],
                    }
                ).then(
                    async (response) => {
                        if(response.data["status"] === "success") {
                            let currentData = {...dashboardMarkets["markets"]};
                            
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
                                updateStockDashboardMarkets(currentData)
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
            if(dashboardMarkets["markets"]["dataLoading"]) return;
            if(homePageMarketsBeingUpdated) return;
            if(marketObserverRef.current) marketObserverRef.current.disconnect();
            marketObserverRef.current = new IntersectionObserver(entries => 
                {
                    if(entries[0].isIntersecting && dashboardMarkets["markets"]["predictions"].length < dashboardMarkets["markets"]["liveCount"]) {
                        setHomePageMarketsBeingUpdated(true);

                        let p_ninclude = []
                        for(let i = 0; i < dashboardMarkets["markets"]["predictions"].length; i++) {
                            p_ninclude.push(dashboardMarkets["markets"]["predictions"][i]["_id"]);
                        }
                        pullDashboardMarkets("secondary", p_ninclude);
                    }
                }
            );
            if(node) marketObserverRef.current.observe(node);
        }, [dashboardMarkets, homePageMarketsBeingUpdated]
    );
    
    const marketSupportScrollRef = useRef();
    const handleScrollMarkets = (e) => {
        if(dashboardMarkets["selected"]["type"] === "") {
            dispatch(
                updateStockDashboardMarketsScrollTop(e.target.scrollTop)
            );
        } else {
            dispatch(
                updateStockDashboardMarketsSelectedScrollTop(e.target.scrollTop)
            );
        }
    }

    useEffect(() => {
        if(Object.keys(dashboardState["page"]["data"]).length === 0) {
            pullDashboardRankings("primary", "marketCap");
        }
    }, []);

    useEffect(() => {
        if(Object.keys(dashboardNews["news"]["data"]).length === 0) {
            pullDashboardNews([]);
        }

        if(!(props.newsId === undefined || props.newsId === null || props.newsId === "")) {
            if(dashboardMarkets["selected"]["type"] !== "News") {
                if(marketSupportScrollRef.current) {
                    setTimeout(() => {
                        marketSupportScrollRef.current.scrollTop = 0;
                    }, 0);
                }

                pullSpecificNews();
            } else if(dashboardMarkets["selected"]["selectedDesc"]["desc"]["_id"] !== props.newsId) {
                if(marketSupportScrollRef.current) {
                    setTimeout(() => {
                        marketSupportScrollRef.current.scrollTop = 0;
                    }, 0);
                }

                pullSpecificNews();
            } else {
                if(marketSupportScrollRef.current) {
                    setTimeout(() => {
                        if((marketSupportScrollRef.current.scrollHeight - marketSupportScrollRef.current.clientHeight) >= dashboardMarkets["selected"]["scrollTop"]) {
                            //marketSupportScrollRef.current.scrollTop = dashboardMarkets["selected"]["scrollTop"];
                            marketSupportScrollRef.current.scrollTop = 0;
                        }
                    }, 0);
                }
            }
        }
    }, [props.newsId, marketSupportScrollRef.current]);
    
    useEffect(() => {
        if(props.predictionId === undefined || props.predictionId === null || props.predictionId === "") {
            if(props.newsId === undefined || props.newsId === null || props.newsId === "") {
                dispatch(
                    setStockDashboardMarketsSelected(
                        {
                            "type": "",
                            "scrollTop": 0,
                            "selectedDesc": {}
                        }
                    )
                );
                dispatch(
                    clearStockDashboardMarketsProcessedHeight()
                );
            }

            if(dashboardMarkets["markets"]["predictions"].length === 0) {
                if(marketSupportScrollRef.current) {
                    setTimeout(() => {
                        marketSupportScrollRef.current.scrollTop = 0;
                    }, 0);
                }

                pullDashboardMarkets("primary", []);
            } else {
                setTimeout(() => {
                    if(marketSupportScrollRef.current) {
                        if((marketSupportScrollRef.current.scrollHeight - marketSupportScrollRef.current.clientHeight) >= dashboardMarkets["scrollTop"]) {
                            marketSupportScrollRef.current.scrollTop = dashboardMarkets["scrollTop"];
                        }
                    }
                }, 0);
            }
        } else {
            if(dashboardMarkets["selected"]["type"] !== "Prediction") {
                if(marketSupportScrollRef.current) {
                    setTimeout(() => {
                        marketSupportScrollRef.current.scrollTop = 0;
                    }, 0);
                }

                pullSpecificPrediction();
            } else if(dashboardMarkets["selected"]["selectedDesc"]["prediction"]["_id"] !== props.predictionId) {
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

                if(marketSupportScrollRef.current) {
                    setTimeout(() => {
                        marketSupportScrollRef.current.scrollTop = 0;
                    }, 0);
                }

                pullSpecificPrediction();
            } else {
                if(marketSupportScrollRef.current) {
                    setTimeout(() => {
                        if((marketSupportScrollRef.current.scrollHeight - marketSupportScrollRef.current.clientHeight) >= dashboardMarkets["selected"]["scrollTop"]) {
                            //marketSupportScrollRef.current.scrollTop = dashboardMarkets["selected"]["scrollTop"];
                            marketSupportScrollRef.current.scrollTop = 0;
                        }
                    }, 0);
                }
            }
        }
    }, [props.predictionId, marketSupportScrollRef.current, visibleMarketsCount]);

    useEffect(() => {
        if(displaySortRef.current) {
            const handleClickOutside = (event) => {
                if(displaySort) {
                    if(!displaySortRef.current?.contains(event?.target)) {
                        setDisplaySort(false);
                    }
                }
            }

            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            }
        }
    }, [displaySort]);

    /*
    const handleSelectionMount = useCallback((node) => {
        if(
            (props.predictionId === undefined || props.predictionId === null || props.predictionId === "")
                && (props.newsId === undefined || props.newsId === null || props.newsId === "")
        ) {return;}

        if(node && !dashboardMarkets["processedHeight"]["processedRef"]) {
            if(!(node === undefined || node === null)) {
                if(!dashboardMarkets["processedHeight"]["processedRef"]) {
                    setTimeout(() => {
                        const { height } = node.getBoundingClientRect();

                        if(!(height === undefined || height === null || height === 0) && (height > 0)) {
                            dispatch(
                                updateStockDashboardMarketsProcessedHeight({"postHeight": height, "processedRef": true})
                            );
                        }
                    }, 2000);
                }
            }
        }
    }, [dashboardMarkets["selected"]["selectedDesc"]]);
    */

    return(
        <div className="large-stocksPageWrapper">
            <div className="large-stocksPageChartandNewsWrapper">
                <div className="large-stockDashboardRankingsContainer">
                    <div className="large-stockDashboardHeader">
                        <div className="large-stocksDashboardHeaderFinulabLogoContainer">
                            <img src="/assets/Finulab_Logo.png" alt="" className="large-stocksDashboardHeaderFinulabLogo"/>
                        </div>
                        <button className="large-stocksDashboardRankSelectorBtn"
                                onClick={() => displaySortToggle()}
                            >
                            Sort
                            <List className="large-stocksDashboardRankSelectorBtnIcon"/>
                        </button>
                        <div className="large-stockDashboardRankByOptionsContainer"
                                ref={displaySortRef}
                                style={displaySort ? {"display": "flex"} : {"display": "none"}}
                            >
                            <button className="large-stocksDashboardRankByOptionBtn"
                                    onClick={() => pullDashboardRankings("secondary", "marketCap")}
                                    style={dashboardState["selection"] === "marketCap" ? 
                                        {"borderTopLeftRadius": "10px", "borderTopRightRadius": "10px", "color": "var(--primary-green-09)"} : 
                                        {"borderTopLeftRadius": "10px", "borderTopRightRadius": "10px"}
                                    }
                                >
                                <Balance 
                                    className="large-stocksDashboardRankByOptionBtnIcon"
                                    style={dashboardState["selection"] === "marketCap" ? 
                                        {"color": "var(--primary-green-09)"} : 
                                        {}
                                    }
                                />
                                Market Cap
                                {dashboardState["selection"] === "marketCap" ? 
                                    <Check className="large-stocksDashboardRankByOptionBtnSelectionIcon"/> : null
                                }
                            </button>
                            <button className="large-stocksDashboardRankByOptionBtn"
                                    onClick={() => pullDashboardRankings("secondary", "activity")}
                                    style={dashboardState["selection"] === "activity" ? 
                                        {"color": "var(--primary-green-09)"} : 
                                        {}
                                    }
                                >
                                <Equalizer 
                                    style={dashboardState["selection"] === "activity" ? 
                                        {"color": "var(--primary-green-09)"} : 
                                        {}
                                    }
                                    className="large-stocksDashboardRankByOptionBtnIcon"
                                />
                                Activity
                                {dashboardState["selection"] === "activity" ? 
                                    <Check className="large-stocksDashboardRankByOptionBtnSelectionIcon"/> : null
                                }
                            </button>
                            <button className="large-stocksDashboardRankByOptionBtn"
                                    onClick={() => pullDashboardRankings("secondary", "winners")}
                                    style={dashboardState["selection"] === "winners" ? 
                                        {"color": "var(--primary-green-09)"} : 
                                        {}
                                    }
                                >
                                <TrendingUp 
                                    style={dashboardState["selection"] === "winners" ? 
                                        {"color": "var(--primary-green-09)"} : 
                                        {}
                                    }
                                    className="large-stocksDashboardRankByOptionBtnIcon"
                                />
                                Winners
                                {dashboardState["selection"] === "winners" ?
                                    <Check className="large-stocksDashboardRankByOptionBtnSelectionIcon"/> : null
                                }
                            </button>
                            <button className="large-stocksDashboardRankByOptionBtn"
                                    onClick={() => pullDashboardRankings("secondary", "losers")}
                                    style={dashboardState["selection"] === "losers" ? 
                                        {"borderBottomLeftRadius": "10px", "borderBottomRightRadius": "10px", "borderBottom": "none", "color": "var(--primary-red-09)"} : 
                                        {"borderBottomLeftRadius": "10px", "borderBottomRightRadius": "10px", "borderBottom": "none"}
                                    }
                                >
                                <TrendingDown 
                                    style={dashboardState["selection"] === "losers" ? 
                                        {"color": "var(--primary-red-09)"} : 
                                        {}
                                    }
                                    className="large-stocksDashboardRankByOptionBtnIcon"
                                />
                                Losers
                                {dashboardState["selection"] === "losers" ? 
                                    <Check className="large-stocksDashboardRankByOptionBtnSelectionIcon" style={{"color": "var(--primary-red-09)"}}/> : null
                                }
                            </button>
                        </div>
                    </div>
                    <div className="large-stocksDashboardUnderlineHeader">
                        <div className="large-stocksDashboardUnderlineRank">Rank</div>
                        <div className="large-stocksDashboardUnderlineName">Name</div>
                        <div className="large-stocksDashboardUnderlineFigure">Market Cap</div>
                        <div className="large-stocksDashboardUnderlineVolume">Volume</div>
                        <div className="large-stocksDashboardUnderlineFigure">Price</div>
                    </div>
                    <div className="large-stocksDashboardBodyContainer" 
                            ref={rankingRef}
                            style={dashboardState["index"] === (Math.ceil(50 / visibleElementsCount) - 1) && (50 - (dashboardState["index"] * visibleElementsCount)) < visibleElementsCount ? 
                                {"justifyContent": "start"} : {}
                            }
                        >
                        {dashboardState["page"]["dataLoading"] || rankingsLoading ?
                            <div className="recommendation-GraphPieContainer" 
                                    style={{"width": "100%", "minWidth": "100%", "maxWidth": "100%"}}
                                >
                                <div className="finulab-chartLoading">
                                    <div className="finulab-chartLoadingSpinner"/>
                                    <img src="/assets/Finulab_Icon.png" alt="" className="finulab-chartLoadingImg" />
                                </div>
                            </div> : 
                            <>
                                {dashboardState["page"]["data"][dashboardState["selection"]].slice(dashboardState["index"] * visibleElementsCount, (visibleElementsCount * (dashboardState["index"] + 1))).map((desc, index) => (
                                        <div className="large-stocksDashboardBodyLine" key={desc["symbol"]}>
                                            <button className="large-stocksDashboardBodyLineBtn"
                                                    onClick={() => navigate(`/stocks/S:-${desc["symbol"]}`)}
                                                >
                                                <img src={desc["profileImage"]} alt="" className="large-stocksDashboardBodyLineImg" />
                                                <div className="large-stocksDashboardBodyLineRank">
                                                    <span className="large-stocksDashboardBodyLineDesc" style={{"textAlign": "center"}}>
                                                        {(index + 1 + (dashboardState["index"] * visibleElementsCount))}
                                                    </span>
                                                </div>
                                                <div className="large-stocksDashboardBodyLineName">
                                                    <span className="large-stocksDashboardBodyLineDesc">{desc["name"]}</span>
                                                </div>
                                                <div className="large-stocksDashboardBodyLineFigure">
                                                    <span className="large-stocksDashboardBodyLineDesc">
                                                    {`$${generalOpx.formatLargeFigures(desc["marketCap"], 2)}`}
                                                    </span>
                                                </div>
                                                <div className="large-stocksDashboardBodyLineVolume">
                                                    <span className="large-stocksDashboardBodyLineDesc">{generalOpx.formatLargeFigures(desc["volume"], 2)}</span>
                                                </div>
                                                <div className="large-stocksDashboardBodyLineFigure">
                                                    <span className="large-stocksDashboardBodyLineFigureDescOne">
                                                        {`$${generalOpx.formatFigures.format(desc["close"])}` }
                                                    </span>
                                                    <span className="large-stocksDashboardBodyLineFigureDescTwo" 
                                                            style={desc["changePerc"] >= 0 ? {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}}
                                                        >
                                                        {desc["changePerc"] >= 0 ?
                                                            <ArrowDropUp className="large-stocksDashboardBodyLineFigureDescTwoGreenIcon"/> :
                                                            <ArrowDropUp className="large-stocksDashboardBodyLineFigureDescRedGreenIcon"/>
                                                        }
                                                        {`${generalOpx.formatFigures.format(Math.abs(desc["changePerc"] * 100))}%`}
                                                    </span>
                                                </div>
                                            </button>
                                        </div>
                                    ))
                                }
                            </>
                        }
                    </div>
                    <div className="large-stocksDashboardBodyUnderline">
                        <div className="large-stocksDashboardUnderlineDesc">
                            Ranked By: Market Cap
                        </div>
                        {visibleElementsCount === 0 ?
                            null :
                            <div className="large-stocksDashboardBodyDisplayToggler">
                                {Math.ceil(50 / visibleElementsCount) >= 8 ?
                                    <button className="priceHistory-TranslateBtn"
                                            onClick={() => dashboardIndexUpdate("back", undefined)}
                                        >
                                        <ChevronLeft className="priceHistory-TranslateBtnIcon" />
                                    </button> : null
                                }
                                <div className="priceHistory-translateOptnsInnerContainer">
                                    {Math.ceil(50 / visibleElementsCount) <= 8 ?
                                        <>
                                            {Array(Math.ceil(50 / visibleElementsCount)).fill(0).map((e, i) => (
                                                    <button className="priceHistory-translateOptnBtn" 
                                                            key={`dashboard-stock-index-key-${i}`}
                                                            onClick={() => dashboardIndexUpdate("set", i)}
                                                            style={i === dashboardState["index"] ?
                                                                {"color": "var(--primary-bg-01)", "boxShadow": "0px 0px 2px var(--primary-bg-05)"} : {}
                                                            }
                                                        >
                                                        {i + 1}
                                                    </button>
                                                ))
                                            }
                                        </> : 
                                        <>
                                            {dashboardState["index"] === 0 || dashboardState["index"] === 1 || dashboardState["index"] === 2 ?
                                                <>
                                                    {Array(Math.ceil(50 / visibleElementsCount)).fill(0).map((e, i) => {
                                                            if(i === 0 || i === 1 || i === 2 || i === 3 || i === 4 || i === 5) {
                                                                return <button className="priceHistory-translateOptnBtn" 
                                                                        key={`dashboard-stock-index-key-${i}`}
                                                                        onClick={() => dashboardIndexUpdate("set", i)}
                                                                        style={i === dashboardState["index"] ?
                                                                            {"color": "var(--primary-bg-01)", "boxShadow": "0px 0px 2px var(--primary-bg-05)"} : {}
                                                                        }
                                                                    >
                                                                    {i + 1}
                                                                </button>
                                                            } else if(i === (Math.ceil(50 / visibleElementsCount) - 2)) {
                                                                return <button className="priceHistory-translateOptnBtn" 
                                                                        key={`dashboard-stock-index-key-${i}`}
                                                                    >
                                                                    ...
                                                                </button>
                                                            } else if(i === (Math.ceil(50 / visibleElementsCount) - 1)) {
                                                                return <button className="priceHistory-translateOptnBtn" 
                                                                        key={`dashboard-stock-index-key-${i}`}
                                                                        onClick={() => dashboardIndexUpdate("set", i)}
                                                                        style={i === dashboardState["index"] ?
                                                                            {"color": "var(--primary-bg-01)", "boxShadow": "0px 0px 2px var(--primary-bg-05)"} : {}
                                                                        }
                                                                    >
                                                                    {i + 1}
                                                                </button>
                                                            }
                                                        })
                                                    }
                                                </> : 
                                                <>
                                                    {dashboardState["index"] >= (Math.ceil(50 / visibleElementsCount) - 5) ?
                                                        <>
                                                            {Array(Math.ceil(50 / visibleElementsCount)).fill(0).map((e, i) => {
                                                                    if(i === Math.ceil(50 / visibleElementsCount) - 1 
                                                                        || i === Math.ceil(50 / visibleElementsCount) - 2 
                                                                        || i === Math.ceil(50 / visibleElementsCount) - 3 
                                                                        || i === Math.ceil(50 / visibleElementsCount) - 4 
                                                                        || i === Math.ceil(50 / visibleElementsCount) - 5 
                                                                        || i === Math.ceil(50 / visibleElementsCount) - 6
                                                                    ) {
                                                                        return <button className="priceHistory-translateOptnBtn" 
                                                                                key={`dashboard-stock-index-key-${i}`}
                                                                                onClick={() => dashboardIndexUpdate("set", i)}
                                                                                style={i === dashboardState["index"] ?
                                                                                    {"color": "var(--primary-bg-01)", "boxShadow": "0px 0px 2px var(--primary-bg-05)"} : {}
                                                                                }
                                                                            >
                                                                            {i + 1}
                                                                        </button>
                                                                    } else if(i === 1) {
                                                                        return <button className="priceHistory-translateOptnBtn" 
                                                                                key={`dashboard-stock-index-key-${i}`}
                                                                            >
                                                                            ...
                                                                        </button>
                                                                    } else if(i === 0) {
                                                                        return <button className="priceHistory-translateOptnBtn" 
                                                                                key={`dashboard-stock-index-key-${i}`}
                                                                                onClick={() => dashboardIndexUpdate("set", i)}
                                                                                style={i === dashboardState["index"] ?
                                                                                    {"color": "var(--primary-bg-01)", "boxShadow": "0px 0px 2px var(--primary-bg-05)"} : {}
                                                                                }
                                                                            >
                                                                            {i + 1}
                                                                        </button>
                                                                    }
                                                                })
                                                            }
                                                        </> : 
                                                        <>
                                                            {Array(Math.ceil(50 / visibleElementsCount)).fill(0).map((e, i) => {
                                                                    if(i === dashboardState["index"] - 1 
                                                                        || i === dashboardState["index"] 
                                                                        || i === dashboardState["index"] + 1 
                                                                        || i === dashboardState["index"] + 2
                                                                    ) {
                                                                        return <button className="priceHistory-translateOptnBtn" 
                                                                                key={`dashboard-stock-index-key-${i}`}
                                                                                onClick={() => dashboardIndexUpdate("set", i)}
                                                                                style={i === dashboardState["index"] ?
                                                                                    {"color": "var(--primary-bg-01)", "boxShadow": "0px 0px 2px var(--primary-bg-05)"} : {}
                                                                                }
                                                                            >
                                                                            {i + 1}
                                                                        </button>
                                                                    } else if(i === 1 || i === Math.ceil(50 / visibleElementsCount) - 2) {
                                                                        return <button className="priceHistory-translateOptnBtn" 
                                                                                key={`dashboard-stock-index-key-${i}`}
                                                                            >
                                                                            ...
                                                                        </button>
                                                                    } else if(i === 0 || i === Math.ceil(50 / visibleElementsCount) - 1) {
                                                                        return <button className="priceHistory-translateOptnBtn" 
                                                                                key={`dashboard-stock-index-key-${i}`}
                                                                                onClick={() => dashboardIndexUpdate("set", i)}
                                                                                style={i === dashboardState["index"] ?
                                                                                    {"color": "var(--primary-bg-01)", "boxShadow": "0px 0px 2px var(--primary-bg-05)"} : {}
                                                                                }
                                                                            >
                                                                            {i + 1}
                                                                        </button>
                                                                    }
                                                                })
                                                            }
                                                        </>
                                                    }
                                                </>
                                            }
                                        </>
                                    }
                                </div>
                                {Math.ceil(50 / visibleElementsCount) >= 8 ?
                                    <button className="priceHistory-TranslateBtn"
                                            onClick={() => dashboardIndexUpdate("forward", undefined)}
                                        >
                                        <ChevronRight className="priceHistory-TranslateBtnIcon" />
                                    </button> : null
                                }
                            </div>
                        }
                    </div>
                </div>
                <div className="large-stocksChartDivider"/>
                <div className="large-stocksNewsContainer">
                    <div className="large-stocksNewsHeaderContainer"
                            style={{"height": "25px", "minHeight": "25px", "maxHeight": "25px"}}
                        >
                        <div className="large-stocksNewsHeader">Market News
                            <div className="large-stocksNewsViewToggleInnerContainer">
                                <button className="large-stocksNewsViewToggleOutline" 
                                        onClick={() => updateDashboardNewsView("back")}
                                        style={dashboardNews["index"] === 0 ? {"display": "none"} : {"display": "flex"}}
                                    >
                                    <ChevronLeft className="large-stocksNewsViewToggleOutlineIcon"/>
                                </button>
                                <div className="large-stocksNewsViewToggleOutlineDivider" style={{"marginLeft": "10px", "marginRight": "10px"}}/>
                                <button className="large-stocksNewsViewToggleOutline" 
                                        disabled={dashboardNewsBeingUpdated || (dashboardNews["news"]["data"].length <= dashboardNews["index"])}
                                        onClick={() => updateDashboardNewsView("forward")}
                                        style={{"display": "flex"}}
                                    >
                                    <ChevronRight className="large-stocksNewsViewToggleOutlineIcon"/>
                                </button>
                            </div>
                        </div>
                        {/*
                        <div className="large-stocksNewsHeaderOptnsContainer">
                            <button className="large-stocksNewsHeaderOptnBtn">Trending</button>
                            <button className="large-stocksNewsHeaderOptnBtn" style={{"color": "var(--primary-bg-10)", "backgroundColor": "var(--primary-bg-01)"}}>Popular</button>
                            <button className="large-stocksNewsHeaderOptnBtn">Latest</button>
                        </div>
                        */}
                    </div>
                    {dashboardNews["news"]["dataLoading"] || dashboardNews["news"]["data"].length === 0 ||
                        (dashboardNews["news"]["data"].length <= dashboardNews["index"]) ?
                        <div className="large-stocksNewsInnerContainer"
                                style={{"height": "calc(100% - 50px)", "minHeight": "calc(100% - 50px)", "maxHeight": "calc(100% - 50px)"}}
                            >
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
                        <div className="large-stocksNewsInnerContainer"
                                style={{"height": "calc(100% - 50px)", "minHeight": "calc(100% - 50px)", "maxHeight": "calc(100% - 50px)"}}
                            >
                            <div className="large-stocksNewsStoriesBlock">
                                <div className="large-stocksNewsSegment" style={{"marginRight": "20px", "borderBottom": "solid 1px var(--primary-bg-07)"}}>
                                    <MiniaturizedNews  
                                        loading={false}
                                        type={"stock_dashboardPage"}
                                        pred_ticker={"S"}
                                        user={user ? user.user : "visitor"}
                                        desc={dashboardNews["news"]["data"][dashboardNews["index"]][0]}
                                    />
                                </div>
                                <div className="large-stocksNewsSegment" style={{"borderBottom": "solid 1px var(--primary-bg-07)"}}>
                                    <MiniaturizedNews  
                                        loading={false}
                                        type={"stock_dashboardPage"}
                                        pred_ticker={"S"}
                                        user={user ? user.user : "visitor"}
                                        desc={dashboardNews["news"]["data"][dashboardNews["index"]][1]}
                                    />
                                </div>
                            </div>
                            <div className="large-stocksNewsStoriesBlock">
                                <div className="large-stocksNewsSegment" style={{"marginRight": "20px"}}>
                                    <MiniaturizedNews  
                                        loading={false}
                                        type={"stock_dashboardPage"}
                                        pred_ticker={"S"}
                                        user={user ? user.user : "visitor"}
                                        desc={dashboardNews["news"]["data"][dashboardNews["index"]][2]}
                                    />
                                </div>    
                                <div className="large-stocksNewsSegment" style={{"marginRight": "20px"}}>
                                    <MiniaturizedNews  
                                        loading={false}
                                        type={"stock_dashboardPage"}
                                        pred_ticker={"S"}
                                        user={user ? user.user : "visitor"}
                                        desc={dashboardNews["news"]["data"][dashboardNews["index"]][3]}
                                    />
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </div>
            <div className="large-stocksPageMoreDataContainer">
                <div className="large-stocksPageMoreDataInnerContainer"
                        ref={marketSupportScrollRef} onScroll={handleScrollMarkets}
                    >
                    <div className="large-stocksPageMoreDataHeader">
                        <div className="large-homePageNonHomeDescContainer"
                                style={{"marginLeft": "10px", "width": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)"}}
                            >
                            <div className="large-homePageNonHomeDesc">
                                {dashboardMarkets["selected"]["type"] === "" ?
                                    <span className="large-homePageNonHomeDescTop">
                                        <img src="/assets/Finux_Token_Flow_Icon.png" alt="" className="large-homePageNonHomeDescTopImg" />
                                        Markets
                                    </span> :
                                    <span className="large-homePageNonHomeDescTop">
                                        <button className="large-homePageBackBtn"
                                                onClick={() => navigate(-1)}
                                                style={{"marginLeft": "0px", "marginRight": "5px"}}
                                            >
                                            <KeyboardBackspace className="large-homePageBackBtnIcon"/>
                                        </button>
                                        {dashboardMarkets["selected"]["type"]}
                                    </span>
                                }
                            </div>
                        </div>
                    </div>
                    <div className="large-stocksPageMoreDataHeaderMargin"/>
                    <div className="large-dashboardMarketsBody" 
                            ref={marketsRef}
                        >
                        {dashboardMarkets["selected"]["type"] === "" ?
                            <>
                                {dashboardMarkets["markets"]["dataLoading"] ?
                                    <>
                                        {Array(visibleMarketsCount + 1).fill(0).map((desc, index) => (
                                                <div className="large-homePageRightBarPredictionContainer" key={`predictions-loading-dashboard-${index}`}>
                                                    <div className="large-homePageRightBarPredictionInnerContainer">
                                                        <MiniaturizedPrediction loading={true}/>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </> : 
                                    <>
                                        {dashboardMarkets["markets"]["predictions"].map((prediction_desc, index) => (
                                                <div className="large-homePageRightBarPredictionContainer" 
                                                        key={`dashboard-prediction-${index}`}
                                                        style={{"backgroundColor": "rgba(0, 0, 0, 1)"}}
                                                    >
                                                    <div className="large-dashboardRightBarPredictionInnerContainer"
                                                            ref={index === (dashboardMarkets["markets"]["predictions"].length - 2) ? lastMarketElementRef : null}
                                                        >
                                                        <MiniaturizedPrediction 
                                                            pred_location={"dashboard"}
                                                            mouseOnComponent={1}
                                                            user={user ? user.user : "visitor"}
                                                            predictionDesc={prediction_desc} 
                                                            marketDesc={dashboardMarkets["markets"]["data"].filter(doc => doc.predictionId == prediction_desc._id)}
                                                            ownership={u_marketHoldings.filter(doc => doc.predictionId === prediction_desc._id)}
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        }
                                        {homePageMarketsBeingUpdated ?
                                            <>
                                                {Array(visibleMarketsCount + 1).fill(0).map((desc, index) => (
                                                        <div className="large-homePageRightBarPredictionContainer" key={`predictions-loading-dashboard-${index}`}>
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
                                {dashboardMarkets["selected"]["type"] === "Prediction" ?
                                    <Prediction 
                                        pred_location={"dashboard"}
                                        user={user ? user.user : "visitor"}
                                        predictionDesc={dashboardMarkets["selected"]["selectedDesc"]["prediction"]} 
                                        marketDesc={dashboardMarkets["selected"]["selectedDesc"]["markets"]}
                                        ownership={u_marketHoldings.filter(doc => doc.predictionId === dashboardMarkets["selected"]["selectedDesc"]["prediction"]["_id"])}
                                    /> :
                                    <>
                                        {dashboardMarkets["selected"]["type"] === "News" ?
                                            <News 
                                                pred_ticker={"S"}
                                                type={"stock_dashboardPage"}
                                                user={user ? user.user : "visitor"}
                                                desc={dashboardMarkets["selected"]["selectedDesc"]["desc"]}
                                            /> : null
                                        }
                                    </>
                                }
                                {/*dashboardMarkets["selected"]["type"] === "Prediction" ?
                                    <div className="large-stocksDashboardSelectedContainer"
                                            key={`stock-dashboard-selection-${dashboardMarkets["selected"]["selectedDesc"]["prediction"]["_id"]}`}
                                            ref={dashboardMarkets["processedHeight"]["postHeight"] === undefined || dashboardMarkets["processedHeight"]["postHeight"] === null ||
                                                dashboardMarkets["processedHeight"]["postHeight"] === 0 || dashboardMarkets["processedHeight"]["processedRef"] === undefined ||
                                                dashboardMarkets["processedHeight"]["processedRef"] === null || !dashboardMarkets["processedHeight"]["processedRef"] ?
                                                node => handleSelectionMount(node) : null
                                            }
                                            style={dashboardMarkets["processedHeight"]["postHeight"] === undefined || dashboardMarkets["processedHeight"]["postHeight"] === null ||
                                                dashboardMarkets["processedHeight"]["postHeight"] === 0 || dashboardMarkets["processedHeight"]["processedRef"] === undefined ||
                                                dashboardMarkets["processedHeight"]["processedRef"] === null || !dashboardMarkets["processedHeight"]["processedRef"] ?
                                                {} : {"height": `${dashboardMarkets["processedHeight"]["postHeight"]}px`, "minHeight": `${dashboardMarkets["processedHeight"]["postHeight"]}px`,
                                                    "maxHeight": `${dashboardMarkets["processedHeight"]["postHeight"]}px`, "overflow": "hidden"
                                                }
                                            }
                                        >
                                        <Prediction 
                                            pred_location={"dashboard"}
                                            user={user ? user.user : "visitor"}
                                            predictionDesc={dashboardMarkets["selected"]["selectedDesc"]["prediction"]} 
                                            marketDesc={dashboardMarkets["selected"]["selectedDesc"]["markets"]}
                                            ownership={u_marketHoldings.filter(doc => doc.predictionId === dashboardMarkets["selected"]["selectedDesc"]["prediction"]["_id"])}
                                        />
                                    </div> :
                                    <>
                                        {dashboardMarkets["selected"]["type"] === "News" ?
                                            <div className="large-stocksDashboardSelectedContainer"
                                                    key={`stock-dashboard-selection-${dashboardMarkets["selected"]["selectedDesc"]["desc"]["_id"]}`}
                                                    ref={dashboardMarkets["processedHeight"]["postHeight"] === undefined || dashboardMarkets["processedHeight"]["postHeight"] === null ||
                                                        dashboardMarkets["processedHeight"]["postHeight"] === 0 || dashboardMarkets["processedHeight"]["processedRef"] === undefined ||
                                                        dashboardMarkets["processedHeight"]["processedRef"] === null || !dashboardMarkets["processedHeight"]["processedRef"] ?
                                                        node => handleSelectionMount(node) : null
                                                    }
                                                    style={dashboardMarkets["processedHeight"]["postHeight"] === undefined || dashboardMarkets["processedHeight"]["postHeight"] === null ||
                                                        dashboardMarkets["processedHeight"]["postHeight"] === 0 || dashboardMarkets["processedHeight"]["processedRef"] === undefined ||
                                                        dashboardMarkets["processedHeight"]["processedRef"] === null || !dashboardMarkets["processedHeight"]["processedRef"] ?
                                                        {} : {"height": `${dashboardMarkets["processedHeight"]["postHeight"]}px`, "minHeight": `${dashboardMarkets["processedHeight"]["postHeight"]}px`,
                                                            "maxHeight": `${dashboardMarkets["processedHeight"]["postHeight"]}px`, "overflow": "hidden"
                                                        }
                                                    }
                                                >
                                                <News 
                                                    pred_ticker={"S"}
                                                    type={"stock_dashboardPage"}
                                                    user={user ? user.user : "visitor"}
                                                    desc={dashboardMarkets["selected"]["selectedDesc"]["desc"]}
                                                />
                                            </div> : null
                                        }
                                    </>
                                */}
                            </>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}