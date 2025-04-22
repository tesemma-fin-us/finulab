import {useNavigate} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {useRef, useState, useLayoutEffect, useEffect} from 'react';
import {ArrowDropUp, AssuredWorkload, ChevronLeft, ChevronRight, PostAdd, Verified} from '@mui/icons-material';

import Post from '../../../../components/post';
import generalOpx from '../../../../functions/generalFunctions';
import MiniaturizedNews from '../../../../components/miniaturized/news/mini-news';

//critical
import {updateProfilePageInformationState, selectPageInformationState} from '../../../../reduxStore/pageInformation';
//critical

import {selectUser} from '../../../../reduxStore/user';
import {setNewsEngagement, addToNewsEngagement, selectNewsEngagement} from '../../../../reduxStore/newsEngagement';
import {clearStockDashboardNews, updateStockDashboardNews, updateStockDashboardNewsIndex, selectStockDashboardNews} from '../../../../reduxStore/stockDashboardNews';
import {clearStockDashboardData, updateStockDashboardData, updateStockDashboardSelection, updateStockDashboardIndex, selectStockDashboardData} from '../../../../reduxStore/stockDashboardData';


export default function CryptoMarketDashboard_Home(props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const appState = useSelector(selectPageInformationState);

    const user = useSelector(selectUser);
    const u_newsEngagement = useSelector(selectNewsEngagement);
    const dashboardNews = useSelector(selectStockDashboardNews);
    const dashboardState = useSelector(selectStockDashboardData);

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
        if(!dataKeys.includes(selection) || dashboardState["type"] !== "cryptos") {
            await generalOpx.axiosInstance.put(`/crypto-market-data/rankings`, {"sortBy": selection}).then(
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

    useEffect(() => {
        if(dashboardState["type"] !== "cryptos") {
            dispatch(
                clearStockDashboardData("cryptos")
            );
            pullDashboardRankings("primary", "marketCap");
        }
    }, []);

    const [dashboardNewsBeingUpdated, setDashboardNewsBeingUpdated] = useState(false);
    const pullDashboardNews = async (ninclude) => {
        const symbol = "c_finulab-general";
        await generalOpx.axiosInstance.put(`/content/news/assets/${symbol}`,
            {
                "ninclude": ninclude
            }
        ).then(
            async (response) => {
                if(response.data["status"] === "success") {
                    let currentData = [];
                    
                    if(ninclude.length === 0) {
                        currentData = [...response.data["data"]];
                    } else {
                        currentData = [...dashboardNews["news"]["data"]].concat(response.data["data"]);
                    }

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

    useEffect(() => {
        if(dashboardNews["type"] !== "cryptos") {
            dispatch(
                clearStockDashboardNews("cryptos")
            );

            pullDashboardNews([]);
        }
        /*
        if(Object.keys(dashboardNews["news"]["data"]).length === 0) {
            pullDashboardNews([]);
        }
        */
        
        /*
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
        */
    }, []);

    /*
    const handleScrollHomePage = (e) => {
        let profilePageInformation = {...appState["profile"]};
        if(e.target.scrollTop - profilePageInformation["scrollTop"] >= 100) {
            if(profilePageInformation["visible"]) {
                profilePageInformation["visible"] = false;
                profilePageInformation["scrollTop"] = e.target.scrollTop;
            } else {
                profilePageInformation["scrollTop"] = e.target.scrollTop;
            }
        } else {
            if(profilePageInformation["scrollTop"] - e.target.scrollTop >= 50) {
                if(!profilePageInformation["visible"]) {
                    profilePageInformation["visible"] = true;
                    profilePageInformation["scrollTop"] = e.target.scrollTop;
                } else {
                    profilePageInformation["scrollTop"] = e.target.scrollTop;
                }
            }
        }

        if(e.target.scrollTop >= (((1/3) * contentBodyWidth[0]) + 177.5)) {
            profilePageInformation["fixed"] = true;
        } else {
            profilePageInformation["fixed"] = false;
        }

        dispatch(
            updateProfilePageInformationState(profilePageInformation)
        );
    }
    */

    return(
        <div
                className={props.f_viewPort === "small" ? "small-homePageContentBodyWrapper" : "large-homePageContentBodyWrapper"}
            >
            {/* onScroll={handleScrollHomePage} */}
            <div 
                    ref={contentBodyRef}
                    className={props.f_viewPort === "small" ? "small-homePageContentBody" : "large-homePageContentBody"}
                >
                <div className="large-homePageContentBodyMargin"/>
                <div className="large-stocksDashboardUnderlineHeader">
                    <div className="large-stocksDashboardUnderlineRank">Rank</div>
                    <div className="large-stocksDashboardUnderlineName">Name</div>
                    <div className="large-stocksDashboardUnderlineFigure"
                            style={props.f_viewPort === "small" ? 
                                {
                                    "width": "calc(100% - 45px - 70px - 25% - 40px)", "minWidth": "calc(100% - 45px - 70px - 25% - 40px)", "maxWidth": "calc(100% - 45px - 70px - 25% - 40px)"
                                } : {}
                            }
                        >
                        Market Cap
                    </div>
                    {props.f_viewPort === "small" ? 
                        null : 
                        <div className="large-stocksDashboardUnderlineFigure">Price</div>
                    }
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
                                                onClick={() => navigate(`/cryptos/C:-${desc["symbol"]}`)}
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
                                            <div className="large-stocksDashboardBodyLineFigure"
                                                    style={props.f_viewPort === "small" ? 
                                                        {
                                                            "width": "calc(100% - 45px - 70px - 25% - 40px)", "minWidth": "calc(100% - 45px - 70px - 25% - 40px)", "maxWidth": "calc(100% - 45px - 70px - 25% - 40px)"
                                                        } : {}
                                                    }
                                                >
                                                {props.f_viewPort === "small" ? 
                                                    <>
                                                        <span className="large-stocksDashboardBodyLineFigureDescOne">
                                                            {`$${generalOpx.formatLargeFigures(desc["marketCap"], 2)}`}
                                                        </span>
                                                        <span className="large-stocksDashboardBodyLineFigureDescTwo" 
                                                                style={desc["changePerc"] >= 0 ? {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}}
                                                            >
                                                            {desc["changePerc"] >= 0 ?
                                                                <ArrowDropUp className="large-stocksDashboardBodyLineFigureDescTwoGreenIcon"/> :
                                                                <ArrowDropUp className="large-stocksDashboardBodyLineFigureDescTwoGreenIcon" style={{"color": "var(--primary-red-09)", "rotate": "180deg"}}/>
                                                            }
                                                            {`${generalOpx.formatFigures.format(Math.abs(desc["changePerc"] * 100))}%`}
                                                        </span>
                                                    </> : 
                                                    <span className="large-stocksDashboardBodyLineDesc">
                                                        {`$${generalOpx.formatLargeFigures(desc["marketCap"], 2)}`}
                                                    </span>
                                                }
                                            </div>
                                            {props.f_viewPort === "small" ? 
                                                null : 
                                                <div className="large-stocksDashboardBodyLineFigure">
                                                    <span className="large-stocksDashboardBodyLineFigureDescOne">
                                                        {`$${generalOpx.formatFigures.format(desc["close"])}` }
                                                    </span>
                                                    <span className="large-stocksDashboardBodyLineFigureDescTwo" 
                                                            style={desc["changePerc"] >= 0 ? {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}}
                                                        >
                                                        {desc["changePerc"] >= 0 ?
                                                            <ArrowDropUp className="large-stocksDashboardBodyLineFigureDescTwoGreenIcon"/> :
                                                            <ArrowDropUp className="large-stocksDashboardBodyLineFigureDescTwoGreenIcon" style={{"color": "var(--primary-red-09)", "rotate": "180deg"}}/>
                                                        }
                                                        {`${generalOpx.formatFigures.format(Math.abs(desc["changePerc"] * 100))}%`}
                                                    </span>
                                                </div>
                                            }
                                        </button>
                                    </div>
                                ))
                            }
                        </>
                    }
                </div>
                <div className="large-stocksDashboardBodyUnderline">
                    {/*
                    <div className="large-stocksDashboardUnderlineDesc">
                        Ranked By: Market Cap
                    </div>
                    */}
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
                            <div className="priceHistory-translateOptnsInnerContainer"
                                    style={Math.ceil(50 / visibleElementsCount) >= 8 ?
                                        {} : {"marginLeft": "auto"}
                                    }
                                >
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
                <div className="assetMainPageNewsContainer">
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
                    </div>

                    {dashboardNews["news"]["dataLoading"] || dashboardNews["news"]["data"].length === 0 ||
                        (dashboardNews["news"]["data"].length <= dashboardNews["index"]) ?
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
                                        type={"stock_dashboardPage"}
                                        pred_ticker={"C"}
                                        user={user ? user.user : "visitor"}
                                        desc={dashboardNews["news"]["data"][dashboardNews["index"]][0]}
                                    />
                                </div>
                                <div className="asset-dashboardNewsElementSecond">
                                    <MiniaturizedNews  
                                        loading={false}
                                        type={"stock_dashboardPage"}
                                        pred_ticker={"C"}
                                        user={user ? user.user : "visitor"}
                                        desc={dashboardNews["news"]["data"][dashboardNews["index"]][1]}
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
                                        type={"stock_dashboardPage"}
                                        pred_ticker={"C"}
                                        user={user ? user.user : "visitor"}
                                        desc={dashboardNews["news"]["data"][dashboardNews["index"]][2]}
                                    />
                                </div>
                                <div className="asset-dashboardNewsElementSecond">
                                    <MiniaturizedNews  
                                        loading={false}
                                        type={"stock_dashboardPage"}
                                        pred_ticker={"C"}
                                        user={user ? user.user : "visitor"}
                                        desc={dashboardNews["news"]["data"][dashboardNews["index"]][3]}
                                    />
                                </div>
                            </div>
                        </>
                    }
                </div>
                {/*contentBodyWidth[1] === true ?
                    <div className="large-homePageContentCreateWrapper" 
                            style={appState["profile"]["visible"] ? 
                                {"marginLeft": `${contentBodyWidth[0] - 110}px`, "backgroundColor": "rgba(0, 110, 230, 0.85)"} :
                                {"marginLeft": `${contentBodyWidth[0] - 110}px`, "backgroundColor": "rgba(0, 110, 230, 0.05)"}
                            }
                        >
                        <button className="large-homePageContentCreateSection">
                            <PostAdd className="large-homePageContentCreateSectionIcon"/>
                            <span className="large-homePageContentCreateSectionDesc">Post</span>
                        </button>
                        <div className="large-homePageContentCreateSectionDivider"/>
                        <button className="large-homePageContentCreateSection">
                            <AssuredWorkload className="large-homePageContentCreateSectionIcon"/>
                            <span className="large-homePageContentCreateSectionDesc">Pair</span>
                        </button>
                    </div> : null
                */}
            </div>
        </div>
    )
}