import './home.css';
import '../../login/login.css';
import '../smallView/home.css';
import '../largeView/home.css';
import '../../stocks/largeView/innerPages/stocks.css';

import {format} from 'timeago.js';
import {getUnixTime} from 'date-fns';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigate, useLocation} from 'react-router-dom';
import {useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo} from 'react';
import {ChevronLeft, ChevronRight, ArrowDropUp, RadioButtonUnchecked, KeyboardBackspace, Whatshot, ExpandMore, Bookmark, Tsunami, Search, Cottage, AccountBalanceWallet, PersonSharp, AccountBalance, GroupAddSharp, Close, Verified, Newspaper, Apps, BookmarkAddSharp, PostAddSharp, AssuredWorkloadSharp, LogoutSharp, BookmarkAdded, SendSharp, ConnectWithoutContactSharp, Login, Send, Public, Notifications, BlurOn, CandlestickChart, Person, ReadMore} from '@mui/icons-material';

import Stock_Home from '../largeView/innerPages/stock';
import Crypto_Home from '../largeView/innerPages/crypto';
import InnerHomePage from '../largeView/innerPages/home';
import InnerWalletPage from '../largeView/innerPages/wallet';
import InnerMarketPage from '../largeView/innerPages/market';
import InnerProfilePage from '../largeView/innerPages/profile';
import SpecificMarketTV_Home from '../largeView/innerPages/marketTv';
import generalOpx from '../../../functions/generalFunctions';
import StockMarketDashboard_Home from '../largeView/innerPages/stockDashboard';
import CreateCommunity from '../../create-community/createCommunity';
import CryptoMarketDashboard_Home from '../largeView/innerPages/cryptoDashboard';
import InnerCommunityProfilePage from '../largeView/innerPages/communityProfile';
import FinulabCreatePost from '../../../components/createPost/createPost';
import MiniaturizedNews from '../../../components/miniaturized/news/mini-news';
import FinulabCreatePrediction from '../../create-prediction/createPrediction';
import MiniaturizedPrediction from '../../../components/miniaturized/prediction/mini-prediction';

import {selectUser} from '../../../reduxStore/user';
import {selectInterests} from '../../../reduxStore/interests';
import {selectStockQuote} from '../../../reduxStore/stockQuote';
import {selectWalletDesc} from '../../../reduxStore/walletDesc';
import {selectHomePageData} from '../../../reduxStore/homePageData';
import {selectModeratorStatus} from '../../../reduxStore/moderatorStatus';
import {updateQuery, selectMarketData} from '../../../reduxStore/marketData';
import {setLastVisited, selectLastVisited} from '../../../reduxStore/lastVisited';
import {setNotifications, selectProfileData} from '../../../reduxStore/profileData';
import {selectHomeFinancialScrollState} from '../../../reduxStore/homeFinancialScroll';
import {setUserQuickDesc, selectUserQuickDesc} from '../../../reduxStore/userQuickDesc';
import {updateStockPageData, selectStockPageData} from '../../../reduxStore/stockPageData';
import {setQuickNotifications, selectNotifications} from '../../../reduxStore/notifications';
import {addToWatchlist, removeFromWatchlist, selectWatchlist} from '../../../reduxStore/watchlist';
import {updateHomePageWatchlist, selectHomePageWatchlist} from '../../../reduxStore/homePageWatchlist';
import {updateHomePageCommunities, selectHomePageCommunities} from '../../../reduxStore/homePageCommunities';
import {setWalletRefreshCounter, selectWalletRefreshCounter} from '../../../reduxStore/walletRefreshCounter';
import {setMarketHoldings, addToMarketHoldings, selectMarketHoldings} from '../../../reduxStore/marketHoldings';

export default function MediumHomePage(props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const v_page = useLocation();
    const idPage = (pathname) => {
        const pathnameSplit = String(pathname).split("/");
        return pathnameSplit[1];
    }
    const idProfile = (pathname) => {
        const pathnameSplit = String(pathname).split("/");
        return pathnameSplit[2];
    }

    const user = useSelector(selectUser);
    const quoteData = useSelector(selectStockQuote);
    const u_watchlist = useSelector(selectWatchlist);
    const u_interests = useSelector(selectInterests);
    const marketData = useSelector(selectMarketData);
    const stockData = useSelector(selectStockPageData);
    const profileData = useSelector(selectProfileData);
    const u_walletDesc = useSelector(selectWalletDesc);
    const u_lastVisited = useSelector(selectLastVisited);
    const homePageData = useSelector(selectHomePageData);
    const u_quickDesc = useSelector(selectUserQuickDesc);
    const u_notifications = useSelector(selectNotifications);
    const u_marketHoldings = useSelector(selectMarketHoldings);
    const u_moderatorStatus = useSelector(selectModeratorStatus);
    const homePageWatchlist = useSelector(selectHomePageWatchlist);
    const homePageCommunities = useSelector(selectHomePageCommunities);
    const walletRefreshCounter = useSelector(selectWalletRefreshCounter);
    const homeFinancialScroll = useSelector(selectHomeFinancialScrollState);

    const [width, setWidth] = useState(0.0);
    useLayoutEffect(() => {
        const screenWidth = () => {setWidth(window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);}
        window.addEventListener('resize', screenWidth);
        screenWidth();
        return () => window.removeEventListener('resize', screenWidth);
    }, []);

    const leftBarBodyRef = useRef();
    const [visibleElementsCount, setVisibleElementsCount] = useState(0)
    useLayoutEffect(() => {
        const visibleNewsCountResizeUpdater = () => {
            if(leftBarBodyRef.current) {
                const visibleLeftBarElementsCount = Math.floor(leftBarBodyRef.current.clientHeight / 60);
                setVisibleElementsCount(visibleLeftBarElementsCount);
            }
        }

        window.addEventListener('resize', visibleNewsCountResizeUpdater);
        visibleNewsCountResizeUpdater();
        return () => window.removeEventListener('resize', visibleNewsCountResizeUpdater);
    }, []);

    const pullHomePageWatchlist = async () => {
        let watchlistSetUp = {
            "stocks": [],
            "stockMarket": [],

            "cryptos": [],
            "cryptoMarket": [],

            "watching": [],

            "loading": true
        };

        if(u_watchlist.length === 0) {
            const stocks = await generalOpx.axiosInstance.put(`/stock-market-data/watchlist`, {"watching": []});
            const cryptos = await generalOpx.axiosInstance.put(`/crypto-market-data/watchlist`, {"watching": []});

            if(stocks.data["status"] === "success") {
                watchlistSetUp = {
                    ...watchlistSetUp, 
                    "stocks": stocks.data["more"],
                    "stockMarket": stocks.data["market"]
                }
            }

            if(cryptos.data["status"] === "success") {
                watchlistSetUp = {
                    ...watchlistSetUp, 
                    "cryptos": cryptos.data["more"],
                    "cryptoMarket": cryptos.data["market"]
                }
            }

            watchlistSetUp = {
                ...watchlistSetUp, "loading": false
            }
        } else {
            let watchingStocks = [], watchingCryptos = [], 
                allWatching = [], allWatchingSupport = [];
            for(let i = 0; i < u_watchlist.length; i++) {
                if(String(u_watchlist[i]).slice(0, 1) === "S") {
                    if(!(String(u_watchlist[i]).slice(3, String(u_watchlist[i]).length) === "DIA"
                        || String(u_watchlist[i]).slice(3, String(u_watchlist[i]).length) === "QQQ"
                        || String(u_watchlist[i]).slice(3, String(u_watchlist[i]).length) === "SPY"
                        || String(u_watchlist[i]).slice(3, String(u_watchlist[i]).length) === "VXX")
                    ) {
                        allWatchingSupport.push(
                            String(u_watchlist[i]).slice(3, String(u_watchlist[i]).length)
                        );
                    }
                } else if(String(u_watchlist[i]).slice(0, 1) === "C") {
                    if(!(String(u_watchlist[i]).slice(3, String(u_watchlist[i]).length) === "BTC"
                        || String(u_watchlist[i]).slice(3, String(u_watchlist[i]).length) === "ETH"
                        || String(u_watchlist[i]).slice(3, String(u_watchlist[i]).length) === "KDA"
                        || String(u_watchlist[i]).slice(3, String(u_watchlist[i]).length) === "FINUX")
                    ) {
                        allWatchingSupport.push(
                            String(u_watchlist[i]).slice(3, String(u_watchlist[i]).length)
                        );
                    }
                }

                if(String(u_watchlist[i]).slice(0, 1) === "S") {
                    watchingStocks.push(
                        String(u_watchlist[i]).slice(3, String(u_watchlist[i]).length)
                    );
                } else if(String(u_watchlist[i]).slice(0, 1) === "C") {
                    watchingCryptos.push(
                        String(u_watchlist[i]).slice(3, String(u_watchlist[i]).length)
                    );
                }
            }
            const stocks = await generalOpx.axiosInstance.put(`/stock-market-data/watchlist`, {"watching": watchingStocks});
            const cryptos = await generalOpx.axiosInstance.put(`/crypto-market-data/watchlist`, {"watching": watchingCryptos});

            if(stocks.data["status"] === "success") {
                watchlistSetUp = {
                    ...watchlistSetUp, 
                    "stocks": stocks.data["more"],
                    "stockMarket": stocks.data["market"],
                }

                if(Object.keys(stocks.data).includes("watching")) {
                    for(let j = 0; j < stocks.data["watching"].length; j++) {
                        allWatching.push(stocks.data["watching"][j]);
                    }
                }
            }

            if(cryptos.data["status"] === "success") {
                watchlistSetUp = {
                    ...watchlistSetUp, 
                    "cryptos": cryptos.data["more"],
                    "cryptoMarket": cryptos.data["market"]
                }

                if(Object.keys(cryptos.data).includes("watching")) {
                    for(let k = 0; k < cryptos.data["watching"].length; k++) {
                        allWatching.push(cryptos.data["watching"][k]);
                    }
                }
            }

            allWatching = allWatching.sort((a, b) => 
                {
                    const indexA = allWatchingSupport.indexOf(a.symbol);
                    const indexB = allWatchingSupport.indexOf(b.symbol);

                    if(indexA === undefined) return 1;
                    if(indexB === undefined) return -1;

                    return indexA - indexB
                }
            );

            watchlistSetUp = {
                ...watchlistSetUp, "watching": allWatching, "loading": false
            }
        }

        dispatch(
            updateHomePageWatchlist(watchlistSetUp)
        );
    }

    const getRandomElements = (array, numElements) => {
        const shuffled = array.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, numElements);
    }

    const interestAssesser = (interests) => {
        if(interests.length === 0) return {"interests": [], "confidenceLevel": 0};
        if(interests.length <= 3) return {"interests": [...interests.map(i_desc => i_desc[0])], "confidenceLevel": 0};

        let critical = interests.sort((a, b) => b[1] - a[1]), criticalSubjects = critical.slice(0, 20);
        if(criticalSubjects.length === interests.length) {
            return {"interests": [...criticalSubjects.map(i_desc => i_desc[0])], "confidenceLevel": 0};
        } else {
            let selectPlus = [];
            critical.length - 20 > 10 ? selectPlus = getRandomElements([...critical.slice(20, critical.length)], 10) : selectPlus = [...critical.slice(20, critical.length)];
            const utilizedSubjects = [
                ...criticalSubjects.map(i_desc => i_desc[0]),
                ...selectPlus.map(i_desc => i_desc[0]),
            ];

            if(interests.length >= 50) {
                return {
                    "interests": utilizedSubjects, 
                    "confidenceLevel": 0
                };
            } else {
                const sumOfAll = interests.reduce((accumulator, currentValue) => {return accumulator + currentValue[1];}, 0);
                const sumofSelected = utilizedSubjects.reduce((accumulator, currentValue) => {return accumulator + currentValue[1];}, 0);

                return {
                    "interests": utilizedSubjects, 
                    "confidenceLevel": isNaN((sumofSelected / sumOfAll) * 100) || !isFinite((sumofSelected / sumOfAll) * 100) ? 0 : ((sumofSelected / sumOfAll) * 100)
                };
            }
        }
    }

    const pullHomePageCommunities = async (amount_toPull) => {
        const selectedInterests = interestAssesser(u_interests);
        await generalOpx.axiosInstance.put(`/communities/recommended`, {"limit": amount_toPull, "interests": selectedInterests["interests"]}).then(
            async (response) => {
                if(response.data["status"] === "success") {
                    let lastVisitedFunction = [
                        ...u_lastVisited,
                        ...response.data["data"]
                    ]
                    dispatch(
                        setLastVisited(lastVisitedFunction)
                    );
                }
            }
        );
    }

    useMemo(() => {
        if(homePageWatchlist["watchlist"]["stocks"].length === 0) {
            pullHomePageWatchlist();
        }
    }, []);
    useEffect(() => {
        if(visibleElementsCount !== 0) {
            if(user) {
                const pullCount = visibleElementsCount - 7;

                if(u_lastVisited.length < pullCount) {
                    pullHomePageCommunities(pullCount - u_lastVisited.length);
                }
            } else {
                const pullCount = visibleElementsCount - 5;

                if(u_lastVisited.length < pullCount) {
                    pullHomePageCommunities(pullCount - u_lastVisited.length);
                }
            }
        }
    }, [visibleElementsCount]);

    const [homeSearchQuery, setHomeSearchQuery] = useState("");
    const homeSearchQueryHandler = (e) => {
        const {value} = e.target;
        setHomeSearchQuery(value);
    }

    const [usersQuery, setUsersQuery] = useState([]);
    const [stocksQuery, setStocksQuery] = useState([]);
    const [cryptosQuery, setCryptosQuery] = useState([]);
    const [communitiesQuery, setCommunitiesQuery] = useState([]);

    const usersQueryController = useRef(new AbortController());
    const stocksQueryController = useRef(new AbortController());
    const cryptosQueryController = useRef(new AbortController());

    const [homeSearch, setHomeSearch] = useState(false);
    const [homeSearchDisplay, setHomeSearchDisplay] = useState("none");
    const homeSearchToggle = () => {
        homeSearch ? setHomeSearch(false) : setHomeSearch(true);
        if(homeSearch) {
            setHomeSearchQuery("");
        }
    }

    useEffect(() => {
        const runQuery = async () => {
            usersQueryController.current.abort();
            usersQueryController.current = new AbortController();

            try {
                const query_forUsers = await generalOpx.axiosInstance.put(`/users/search?q=${homeSearchQuery}`, {}, {signal: usersQueryController.current.signal});

                if(query_forUsers.data["status"] === "success") {
                    setUsersQuery(query_forUsers.data["data"]);
                }
            } catch(err) {}
        }

        if(homeSearchQuery === "") {
            setUsersQuery([]);
        } else {
            runQuery();
        }
    }, [homeSearchQuery]);
    useEffect(() => {
        const runQuery = async () => {
            stocksQueryController.current.abort();
            stocksQueryController.current = new AbortController();
            try {
                const query_forStocks = await generalOpx.axiosInstance.put(`/stockDataFeed/search?q=${homeSearchQuery}`, {}, {signal: stocksQueryController.current.signal});
                
                if(query_forStocks.data["status"] === "success") {
                    setStocksQuery(query_forStocks.data["data"]);
                }
            } catch(err) {}
        }

        if(homeSearchQuery === "") {
            setStocksQuery([]);
        } else {
            runQuery();
        }
    }, [homeSearchQuery]);
    useEffect(() => {
        const runQuery = async () => {
            cryptosQueryController.current.abort();
            cryptosQueryController.current = new AbortController();

            try {
                const query_forCryptos = await generalOpx.axiosInstance.put(`/cryptoDataFeed/search?q=${homeSearchQuery}`, {}, {signal: cryptosQueryController.current.signal});

                if(query_forCryptos.data["status"] === "success") {
                    setCryptosQuery(query_forCryptos.data["data"]);
                }
            } catch(err) {}
        }

        if(homeSearchQuery === "") {
            setCryptosQuery([]);
        } else {
            runQuery();
        }
    }, [homeSearchQuery]);

    const searchRef = useRef();
    const [homePageSearchWidth, setHomePageSearchWidth] = useState(0);
    useLayoutEffect(() => {
        const homePageSearchResizeUpdater = () => {
            if(searchRef.current) {
                const homePageSearchWidthFunction = Math.floor(0.9 * (searchRef.current.clientWidth - 57));
                setHomePageSearchWidth(homePageSearchWidthFunction);
            }
        }

        window.addEventListener('resize', homePageSearchResizeUpdater);
        homePageSearchResizeUpdater();
        return () => window.removeEventListener('resize', homePageSearchResizeUpdater);
    }, []);

    const [homeWatchlistQuery, setHomeWatchlistQuery] = useState("");
    const homeWatchlistQueryHandler = (e) => {
        const {value} = e.target;
        setHomeWatchlistQuery(value);
    }

    const [watchlistSearch, setWatchlistSearch] = useState(false);
    const watchlistSearchToggle = () => {
        watchlistSearch ? setWatchlistSearch(false) : setWatchlistSearch(true);
        if(watchlistSearch) {setHomeWatchlistQuery("");}
    }
    
    const [watchlistStocksQuery, setWatchlistStocksQuery] = useState([]);
    const [watchlistCryptosQuery, setWatchlistCryptosQuery] = useState([]);

    const watchlistStocksQueryController = useRef(new AbortController());
    const watchlistCryptosQueryController = useRef(new AbortController());

    useEffect(() => {
        const runQuery = async () => {
            watchlistStocksQueryController.current.abort();
            watchlistStocksQueryController.current = new AbortController();
            try {
                const w_query_forStocks = await generalOpx.axiosInstance.put(`/stockDataFeed/search?q=${homeWatchlistQuery}`, {}, {signal: watchlistStocksQueryController.current.signal});
                
                if(w_query_forStocks.data["status"] === "success") {
                    setWatchlistStocksQuery(w_query_forStocks.data["data"]);
                }
            } catch(err) {}
        }

        if(homeWatchlistQuery === "") {
            setWatchlistStocksQuery([]);
        } else {
            runQuery();
        }
    }, [homeWatchlistQuery]);
    useEffect(() => {
        const runQuery = async () => {
            watchlistCryptosQueryController.current.abort();
            watchlistCryptosQueryController.current = new AbortController();
            try {
                const w_query_forCryptos = await generalOpx.axiosInstance.put(`/cryptoDataFeed/search?q=${homeWatchlistQuery}`, {}, {signal: watchlistCryptosQueryController.current.signal});
                
                if(w_query_forCryptos.data["status"] === "success") {
                    setWatchlistCryptosQuery(w_query_forCryptos.data["data"]);
                }
            } catch(err) {}
        }

        if(homeWatchlistQuery === "") {
            setWatchlistCryptosQuery([]);
        } else {
            runQuery();
        }
    }, [homeWatchlistQuery]);

    const updateMarketQuery = (e) => {
        const {value} = e.target;
        dispatch(
            updateQuery(value)
        );
    }
    const clearMarketQuery = () => {
        dispatch(
            updateQuery("")
        );
    }

    const refreshWallet = () => {
        dispatch(
            setWalletRefreshCounter(walletRefreshCounter["state"] + 1)
        );
    }

    const addRemoveFromWatchlist = async () => {
        const marketStocks = ["S:-DIA", "S:-QQQ", "S:-SPY", "S:-VXX",
            "C:-BTC", "C:-ETH", "C:-KDA", "C:-FINUX"
        ];

        let homePageWatchlistFunction = {...homePageWatchlist["watchlist"]}, 
        requestBody = {"symbol": props.ticker, "distinction": user ? "user" : "visitor"};
        if([...u_watchlist].includes(props.ticker)) {
            requestBody["action"] = "removed";

            dispatch(
                removeFromWatchlist(props.ticker)
            );
            
            let pageDataFunction = {...stockData["page"]["data"], "watchedBy": stockData["page"]["data"]["watchedBy"] - 1}
            dispatch(
                updateStockPageData(
                    {
                        "data": pageDataFunction,
                        "dataLoading": false
                    }
                )
            );
            
            if(!marketStocks.includes(props.ticker)) {
                const u_setWatchlist = homePageWatchlistFunction["watching"].map(obj => `${`props.ticker`.slice(0, 1)}:-${obj.symbol}`);
                if(u_setWatchlist.includes(props.ticker)) {
                    homePageWatchlistFunction["watching"] = homePageWatchlistFunction["watching"].filter(obj => `${`props.ticker`.slice(0, 1)}:-${obj.symbol}` !== props.ticker)
                }

                dispatch(
                    updateHomePageWatchlist(homePageWatchlistFunction)
                );
            }
        } else {
            requestBody["action"] = "add";

            dispatch(
                addToWatchlist(props.ticker)
            );

            let pageDataFunction = {...stockData["page"]["data"], "watchedBy": stockData["page"]["data"]["watchedBy"] + 1}
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

                const watchingStocks = homePageWatchlistFunction["stocks"].map(obj => `${`props.ticker`.slice(0, 1)}:-${obj.symbol}`);
                if(watchingStocks.includes(props.ticker)) {
                    homePageWatchlistFunction["stocks"] = homePageWatchlistFunction["stocks"].filter(obj => `${`props.ticker`.slice(0, 1)}:-${obj.symbol}` !== props.ticker);
                }

                const u_setWatchlist = homePageWatchlistFunction["watching"].map(obj => `${`props.ticker`.slice(0, 1)}:-${obj.symbol}`);
                if(!u_setWatchlist.includes(props.ticker)) {
                    homePageWatchlistFunction["watching"] = [
                        ...homePageWatchlistFunction["watching"],
                        {
                            change: quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["open"],
                            changePerc: (quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["open"]) / quoteData["quote"]["data"]["open"],
                            close: quoteData["quote"]["data"]["close"],
                            high: quoteData["quote"]["data"]["high"],
                            low: quoteData["quote"]["data"]["low"],
                            marketCap: stockData["page"]["data"]["sharesOutstanding"] === 0 ? stockData["page"]["data"]["marketCap"] : quoteData["quote"]["data"]["close"] * stockData["page"]["data"]["sharesOutstanding"],
                            name: stockData["page"]["data"]["name"],
                            open: quoteData["quote"]["data"]["open"],
                            profileImage: stockData["page"]["data"]["profileImage"],
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
        }

        await generalOpx.axiosInstance.post(`/users/modify-watchlist`, requestBody);
    }

    const [v_display, setVDisplay] = useState(true);
    const [initialPosition, setInitialPosition] = useState(0);

    useEffect(() => {
        let debounceTimer;
        setInitialPosition(window.scrollY);
    
        const handleScroll = () => {
            const currentPosition = window.scrollY;

            if(currentPosition >= initialPosition + 75 && v_display) {
                setVDisplay(false);
            } else if (currentPosition <= initialPosition - 75 && !v_display) {
                setVDisplay(true);
            }

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                setInitialPosition(currentPosition);
            }, 100);
        };
    
        window.addEventListener('scroll', handleScroll);
    
        return () => {
          window.removeEventListener('scroll', handleScroll);
          clearTimeout(debounceTimer);
        };
    }, [v_display, initialPosition]);

    const [sm_viewLeftbarTop, setSm_viewLeftbarTop] = useState(0);
    const [sm_viewLeftbarWidth, setSm_viewLeftbarWidth] = useState(0);
    const sm_viewLeftbarWidthToggle = () => {
        if(sm_viewLeftbarWidth === 0) {
            const currentPosition = window.scrollY;

            setSm_viewLeftbarTop(currentPosition);
            setTimeout(() => {
                document.body.style.overflow = 'hidden';
                document.documentElement.style.overflow = 'hidden';
                
                document.body.scrollTop = currentPosition;
                setTimeout(() => {setSm_viewLeftbarWidth(300);}, 5);
            }, 0);
        }
    }
    const sm_viewSearchLeftbarWidthToggle = () => {
        if(sm_viewLeftbarWidth === 0) {
            const currentPosition = window.scrollY;

            setSm_viewLeftbarTop(currentPosition);
            setTimeout(() => {
                document.body.style.overflow = 'hidden';
                document.documentElement.style.overflow = 'hidden';
                
                document.body.scrollTop = currentPosition;
                homeSearchToggle();
                setTimeout(() => {setSm_viewLeftbarWidth(300);}, 5);
            }, 0);
        }
    }

    const [sm_viewRightbarTop, setSm_viewRightbarTop] = useState(0);
    const [sm_viewRightbarWidth, setSm_viewRightbarWidth] = useState(0);
    const setSm_viewRightbarWidthToggle = () => {
        if(sm_viewRightbarWidth === 0) {
            const currentPosition = window.scrollY;

            setSm_viewRightbarTop(currentPosition);
            setTimeout(() => {
                document.body.style.overflow = 'hidden';
                document.documentElement.style.overflow = 'hidden';
                
                document.body.scrollTop = currentPosition;
                setTimeout(() => {setSm_viewRightbarWidth(300);}, 5);
            }, 0);
        }
    }

    const sb_overlayRef = useRef();
    const sb_overlayContainerRef = useRef();

    const rsb_overlayRef = useRef();
    const rsb_overlayContainerRef = useRef();
    useEffect(() => {
        if(sb_overlayRef.current && sb_overlayContainerRef.current && sm_viewLeftbarWidth === 300) {
            const handleClickOutside = (event) => {
                if(sb_overlayRef) {
                    if(!sb_overlayContainerRef.current?.contains(event?.target) && !sb_overlayRef.current?.contains(event?.target)) {
                        setTimeout(() => {
                            document.body.style.overflow = 'visible';
                            document.documentElement.style.overflow = 'visible';

                            setTimeout(() => {
                                document.documentElement.scrollTop = sm_viewLeftbarTop;
                                setTimeout(() => {
                                    setSm_viewLeftbarWidth(0);
                                    if(homeSearch) {
                                        setTimeout(() => {homeSearchToggle();}, 145);
                                    }
                                }, 5);
                            }, 0);
                        }, 0);
                    }
                }
            }

            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            }
        }

        if(rsb_overlayRef.current && rsb_overlayContainerRef.current && sm_viewRightbarWidth === 300) {
            const handleClickOutside = (event) => {
                if(rsb_overlayRef) {
                    if(!rsb_overlayContainerRef.current?.contains(event?.target) && !rsb_overlayRef.current?.contains(event?.target)) {
                        setTimeout(() => {
                            document.body.style.overflow = 'visible';
                            document.documentElement.style.overflow = 'visible';

                            setTimeout(() => {
                                document.documentElement.scrollTop = sm_viewRightbarTop;
                                setTimeout(() => {setSm_viewRightbarWidth(0);}, 5);
                            }, 0);
                        }, 0);
                    }
                }
            }

            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            }
        }
    }, [sm_viewLeftbarTop, sm_viewLeftbarWidth, sm_viewRightbarTop, sm_viewRightbarWidth]);
    
    const homeSearchToggleClose = () => {
        if(sb_overlayRef.current && sb_overlayContainerRef.current && sm_viewLeftbarWidth === 300) {
            setTimeout(() => {
                document.body.style.overflow = 'visible';
                document.documentElement.style.overflow = 'visible';

                setTimeout(() => {
                    document.documentElement.scrollTop = sm_viewLeftbarTop;
                    setTimeout(() => {
                        setSm_viewLeftbarWidth(0);
                        if(homeSearch) {
                            setTimeout(() => {homeSearchToggle();}, 145);
                        }
                    }, 5);
                }, 0);
            }, 0);
        }
    }

    const homeSearchTogglenNavigate = (link) => {
        if(sb_overlayRef.current && sb_overlayContainerRef.current && sm_viewLeftbarWidth === 300) {
            setTimeout(() => {
                document.body.style.overflow = 'visible';
                document.documentElement.style.overflow = 'visible';

                setTimeout(() => {
                    document.documentElement.scrollTop = sm_viewLeftbarTop;
                    setTimeout(() => {
                        setSm_viewLeftbarWidth(0);
                        if(homeSearch) {
                            navigate(link);
                            setTimeout(() => {homeSearchToggle();}, 145);
                        }
                    }, 5);
                }, 0);
            }, 0);
        }
    }

    const leftBarButtonLinkNavigate = (link) => {
        if(sb_overlayRef.current && sb_overlayContainerRef.current && sm_viewLeftbarWidth === 300) {
            setTimeout(() => {
                document.body.style.overflow = 'visible';
                document.documentElement.style.overflow = 'visible';

                setTimeout(() => {
                    document.documentElement.scrollTop = sm_viewLeftbarTop;
                    setTimeout(() => {
                        setSm_viewLeftbarWidth(0);
                        navigate(link);
                    }, 5);
                }, 0);
            }, 0);
        }
    }

    const [communitiesQuickViewIndex, setCommunitiesQuickViewIndex] = useState(0);
    const communitiesQuickViewIndexToggle = (type) => {
        type === "forward" ? setCommunitiesQuickViewIndex(prevState => prevState + 1) : setCommunitiesQuickViewIndex(prevState => prevState - 1);
    }
    
    const updateNotifications = async () => {
        let communities = [];
        for(let i = 0; i < u_moderatorStatus.length; i++) {
            communities.push(u_moderatorStatus[i]["community"]);
        }

        await generalOpx.axiosInstance.put(`/notifications/latest`, 
            {
                "communities": communities
            }
        ).then(
            async (response) => {
                if(response.data["status"] === "success") {
                    let eliminateProfile = false, elimatedCommunity = "";
                    if(user.user === profileData["notifications"]["username"]) {
                        if(response.data["data"].length > 0) {
                            dispatch(
                                setNotifications(
                                    {
                                        "username": profileData["notifications"]["username"],
                                        "data": [...response.data["data"], ...profileData["notifications"]["data"]],
                                        "dataCount": response.data["data"].length + profileData["notifications"]["dataCount"],
                                        "dataLoading": profileData["notifications"]["dataLoading"]
                                    }
                                )
                            );
    
                            if(props.page === "profile" &&
                                props.userId === user.user && props.displayView === "notifications"
                            ) {
                                eliminateProfile = true;
                                await generalOpx.axiosInstance.post(`/notifications/mark-as-read`);
                            }
                        }
                    } else if(communities.some(comm_nTc => comm_nTc === profileData["notifications"]["username"])) {
                        if(response.data["communities"][profileData["notifications"]["username"]].length > 0) {
                            dispatch(
                                setNotifications(
                                    {
                                        "username": profileData["notifications"]["username"],
                                        "data": [...response.data["communities"][profileData["notifications"]["username"]], ...profileData["notifications"]["data"]],
                                        "dataCount": response.data["communities"][profileData["notifications"]["username"]].length + profileData["notifications"]["dataCount"],
                                        "dataLoading": profileData["notifications"]["dataLoading"]
                                    }
                                )
                            );

                            if(props.page === "profile" &&
                                props.userId === profileData["notifications"]["username"] && props.displayView === "notifications"
                            ) {
                                elimatedCommunity = profileData["notifications"]["username"];
                                await generalOpx.axiosInstance.post(`/notifications/community-mark-as-read`, {"community": profileData["notifications"]["username"]});
                            }
                        }
                    }

                    if(elimatedCommunity === "") {
                        dispatch(
                            setQuickNotifications(
                                {
                                    "unread": {
                                        "data": eliminateProfile ? [] : response.data["data"],
                                        "dataLoading": false
                                    },
                                    "communities": {
                                        "data": response.data["communities"],
                                        "dataLoading": false
                                    }
                                }
                            )
                        );
                    } else {
                        const {[elimatedCommunity]:_, ...cleaned_communitiesData} = response.data["communities"];
                        dispatch(
                            setQuickNotifications(
                                {
                                    "unread": {
                                        "data": eliminateProfile ? [] : response.data["data"],
                                        "dataLoading": false
                                    },
                                    "communities": {
                                        "data": {[elimatedCommunity]: [], ...cleaned_communitiesData},
                                        "dataLoading": false
                                    }
                                }
                            )
                        );
                    }
                }
            }
        ).catch(() => {});
    }

    
    useMemo(() => {
        if(user && 
            u_notifications["unread"]["dataLoading"]
        ) {
            setTimeout(() => {
                updateNotifications();
            }, 5000);
        }
    }, []);

    const intervalIdRef = useRef(null);
    useEffect(() => {
        if(!user) return;
        if(intervalIdRef.current) {clearInterval(intervalIdRef.current);}

        const intervalTime = 3 * 60 * 1000;
        intervalIdRef.current = setInterval(updateNotifications, intervalTime);

        return() => {
            if(intervalIdRef.current) {clearInterval(intervalIdRef.current);}
        };
    }, [user, props.page, props.userId, props.displayView]);
    
    const [walletTotal, setWalletTotal] = useState([0, true]);
    useMemo(() => {
        if(user
            && !u_walletDesc["balance"]["dataLoading"]
        ) {
            let u_accountBalance = 0;
            for(let i = 0; i < u_walletDesc["balance"]["data"].length; i++) {
                u_accountBalance = u_accountBalance + u_walletDesc["balance"]["data"][i][1];
            }

            setWalletTotal([u_accountBalance, false]);
        }
    }, []);

    const u_statDesc = async () => {
        await generalOpx.axiosInstance.put(`/users/stats-desc`,
            {
                "username": user.user
            }
        ).then(
            (response) => {
                if(response.data["status"] === "success") {
                    dispatch(
                        setUserQuickDesc(
                            {
                                "desc": {
                                    "data": response.data["data"],
                                    "dataLoading": false
                                }
                            }
                        )
                    );
                }
            }
        ).catch(() => {});
    }

    useMemo(() => {
        if(user) {
            u_statDesc();
        } else {
            dispatch(
                setUserQuickDesc(
                    {
                        "desc": {
                            "data": {},
                            "dataLoading": true
                        }
                    }
                )
            );
        }
    }, []);

    return(
        <div className="medium-homePageWrapper">
            <div className="medium-homePageNavigatorWrapper">
                <button className="large-homePageMainNavigationFinulabLogoContainerBtn">
                    <img src="/assets/Favicon.png" alt="" className="large-homePageMainNavigationFinulabLogo"/>
                </button>
                <div className="large-homePageMainNavigationIconContainerV2"/>
                <button className="large-homePageMainNavigationIconContainerBtn"
                        onClick={() => sm_viewSearchLeftbarWidthToggle()}
                    >
                    <Search className="large-homePageMainNavigationIcon"/>
                    <span className="large-homePageMainNavigationIconContainerBtnDesc">Search</span>
                </button>
                <button className="large-homePageMainNavigationIconContainerBtn"
                        onClick={() => navigate("/")}
                        style={idPage(v_page.pathname) === "" || idPage(v_page.pathname) === "post" ? {"backgroundColor": "var(--primary-bg-03)"} : 
                            idPage(v_page.pathname) !== "profile" ? {} : !user ? {"backgroundColor": "var(--primary-bg-03)"} : idProfile(v_page.pathname) !== user.user ? {"backgroundColor": "var(--primary-bg-03)"} : {}
                        }
                    >
                    <Cottage className="large-homePageMainNavigationIcon" 
                        style={idPage(v_page.pathname) === "" || idPage(v_page.pathname) === "post" ? {"color": "var(--secondary-bg-03)"} : 
                            idPage(v_page.pathname) !== "profile" ? {} : !user ? {"color": "var(--secondary-bg-03)"} : idProfile(v_page.pathname) !== user.user ? {"color": "var(--secondary-bg-03)"} : {}
                        }
                    />
                    <span className="large-homePageMainNavigationIconContainerBtnDesc"
                            style={idPage(v_page.pathname) === "" || idPage(v_page.pathname) === "post" ? {"color": "var(--secondary-bg-03)"} : 
                                idPage(v_page.pathname) !== "profile" ? {} : !user ? {"color": "var(--secondary-bg-03)"} : idProfile(v_page.pathname) !== user.user ? {"color": "var(--secondary-bg-03)"} : {}
                            }
                        >
                        Home
                    </span>
                </button>
                {user ?
                    <button className="large-homePageMainNavigationIconContainerBtn"
                            onClick={() => navigate(`/profile/${user.user}`)}
                            style={idPage(v_page.pathname) !== "profile" ? {} : idProfile(v_page.pathname) === user.user ? {"backgroundColor": "var(--primary-bg-03)"} : {}}
                        >
                        <PersonSharp className="large-homePageMainNavigationIcon"
                            style={idPage(v_page.pathname) !== "profile" ? {} : idProfile(v_page.pathname) === user.user ? {"color": "var(--secondary-bg-03)"} : {}}
                        />
                        <span className="large-homePageMainNavigationIconContainerBtnDesc"
                                style={idPage(v_page.pathname) !== "profile" ? {"marginTop": "1px"} : idProfile(v_page.pathname) === user.user ? {"marginTop": "1px", "color": "var(--secondary-bg-03)"} : {"marginTop": "1px"}}
                            >
                            Profile
                        </span>
                        {u_notifications["unread"]["data"].length > 0 ?
                            <span className="small-homePageLeftSideCommunityNotifsCounter"
                                    style={{"position": "absolute", "margin": "0", "top": "-1px", "right": "-1px"}}
                                >
                                {u_notifications["unread"]["data"].length > 5 ?
                                    `5+` : `${u_notifications["unread"]["data"].length}`
                                }
                            </span> : null
                        }
                    </button> : null
                }
                {user ?
                    <button className="large-homePageMainNavigationIconContainerBtn"
                            onClick={() => navigate("/wallet")}
                            style={idPage(v_page.pathname) === "wallet" ? {"backgroundColor": "var(--primary-bg-03)"} : {}}
                        >
                        <AccountBalanceWallet className="large-homePageMainNavigationIcon"
                            style={idPage(v_page.pathname) === "wallet" ? {"color": "var(--secondary-bg-03)"} : {}}
                        />
                        <span className="large-homePageMainNavigationIconContainerBtnDesc"
                                style={idPage(v_page.pathname) === "wallet" ? {"marginTop": "1px", "color": "var(--secondary-bg-03)"} : {"marginTop": "1px"}}
                            >
                            Wallet
                        </span>
                    </button> : null
                }
                <button className="large-homePageMainNavigationIconContainerBtn"
                        onClick={() => navigate("/stocks")}
                        style={idPage(v_page.pathname) === "stocks" ? {"backgroundColor": "var(--primary-bg-03)"} : {}}
                    >
                    <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                        <g 
                                stroke={idPage(v_page.pathname) === "stocks" ? "var(--secondary-bg-03)" : "#9E9E9E"} 
                                strokeLinejoin="round" strokeWidth="1.5"
                            >
                            <path d="m2.5 12c0-4.47834 0-6.71751 1.39124-8.10876 1.39125-1.39124 3.63042-1.39124 8.10876-1.39124 4.4783 0 6.7175 0 8.1088 1.39124 1.3912 1.39125 1.3912 3.63042 1.3912 8.10876 0 4.4783 0 6.7175-1.3912 8.1088-1.3913 1.3912-3.6305 1.3912-8.1088 1.3912-4.47834 0-6.71751 0-8.10876-1.3912-1.39124-1.3913-1.39124-3.6305-1.39124-8.1088z"/><path d="m2.5 14.5h.53875c.47231 0 .70846 0 .91381-.0987s.35288-.2831.64793-.6519l1.39951-1.7494 1.5 2.5 1.5-3.5 2.5 5 3.5-7 2 3.5 1.5-1.5 1.4453 2.168c.252.378.378.567.5621.6814.0366.0227.0746.0431.1138.0609.1973.0897.4245.0897.8788.0897"/>
                            <path d="m15 2.5v3m0 16v-7" strokeLinecap="round"/>
                            <circle cx="15" cy="9" r="1"/>
                        </g>
                    </svg>
                    <span className="large-homePageMainNavigationIconContainerBtnDesc"
                            style={idPage(v_page.pathname) === "stocks" ? {"marginTop": "1px", "color": "var(--secondary-bg-03)"} : {"marginTop": "1px"}}
                        >
                        Stocks
                    </span>
                </button>
                <button className="large-homePageMainNavigationIconContainerBtn"
                        onClick={() => navigate("/cryptos")}
                        style={idPage(v_page.pathname) === "cryptos" ? {"backgroundColor": "var(--primary-bg-03)"} : {}}
                    >
                    <svg viewBox="0 0 22 22"
                            focusable="false" aria-hidden="true"
                            style={{"width": "22px", "minWidth": "22px", "maxWidth": "22px", "height": "22px", "minHeight": "22px", "maxHeight": "22px"}}
                            className="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium large-homePageMainNavigationIcon css-1umw9bq-MuiSvgIcon-root" data-testid="NewspaperIcon"
                        >
                        <path d="M11 22C4.975 22 0 17.025 0 11S4.975 0 11 0s11 4.975 11 11-4.975 11-11 11zm3.438-15.222l.557-2.23-1.797-.444-.443 1.78a5.691 5.691 0 00-.894-.22l.444-1.78L10.176 3.3l-.557 2.23c-2.052.371-3.794 1.877-4.317 4.003s.278 4.283 1.833 5.555l-.557 2.23 1.797.444.443-1.78a5.691 5.691 0 00.894.22l-.444 1.78 1.797.443.557-2.23a5.512 5.512 0 003.57-2.328l-1.958-.472a3.715 3.715 0 01-3.534.966c-1.967-.486-3.176-2.45-2.683-4.383s2.473-3.108 4.44-2.622a3.702 3.702 0 012.65 2.517l1.958.472a5.525 5.525 0 00-2.062-3.728z" fill={idPage(v_page.pathname) === "cryptos" ? "var(--secondary-bg-03)" : "#9E9E9E"}/>
                    </svg>
                    <span className="large-homePageMainNavigationIconContainerBtnDesc"
                            style={idPage(v_page.pathname) === "cryptos" ? {"marginTop": "1px", "color": "var(--secondary-bg-03)"} : {"marginTop": "1px"}}
                        >
                        Cryptos
                    </span>
                </button>
                <button className="large-homePageMainNavigationIconContainerBtn"
                        onClick={() => navigate("/market")}
                        style={idPage(v_page.pathname) === "market" ? {"backgroundColor": "var(--primary-bg-03)"} : {}}
                    >
                    <AccountBalance className="large-homePageMainNavigationIcon"
                        style={idPage(v_page.pathname) === "market" ? {"color": "var(--secondary-bg-03)"} : {}}
                    />
                    <span className="large-homePageMainNavigationIconContainerBtnDesc"
                            style={idPage(v_page.pathname) === "market" ? {"marginTop": "1px", "color": "var(--secondary-bg-03)"} : {"marginTop": "1px"}}
                        >
                        Market
                    </span>
                </button>
                {user ?
                    <button className="large-homePageMainNavigationIconContainerBtn"
                            style={{"marginTop": "auto", "marginBottom": "10px"}}
                            onClick={() => navigate("/logout")}
                        >
                        <LogoutSharp className="large-homePageMainNavigationIcon"/>
                        <span className="large-homePageMainNavigationIconContainerBtnDesc"
                            
                            >
                            Exit
                        </span>
                    </button> : 
                    <button className="large-homePageMainNavigationIconContainerBtn"
                            style={{"marginTop": "auto", "marginBottom": "10px"}}
                            onClick={() => navigate("/main-login")}
                        >
                        <Login className="large-homePageMainNavigationIcon"/>
                        <span className="large-homePageMainNavigationIconContainerBtnDesc"
                            
                            >
                            Sign-In
                        </span>
                    </button>
                }
            </div>
            <div className="small-homePageLeftSideWrapperSupport"
                style={sm_viewLeftbarWidth === 0 ? {"display": "none"} : {"display": "flex"}}
            />
            <div className="small-homePageLeftSideWrapper"
                    ref={sb_overlayRef}
                    style={
                        {
                            "top": `${sm_viewLeftbarTop}px`,
                            "left": "56px",
                            "width": `${sm_viewLeftbarWidth}px`, 
                            "minWidth": `${sm_viewLeftbarWidth}px`, 
                            "maxWidth": `${sm_viewLeftbarWidth}px`, 
                            "borderRight": `solid ${sm_viewLeftbarWidth / 300}px var(--primary-bg-08)`
                        }
                    }
                >
                {homeSearch ? 
                    <div className="large-homePageMainNavigationSearchWrapper"
                            style={{"width": "300px", "minWidth": "300px", "maxWidth": "300px", "border": `none`}}
                        >
                        <div className="large-homePageSearchBarContainer"
                                ref={sb_overlayContainerRef}
                                style={{"width": `${90}%`, "minWidth": `${90}%`, "maxWidth": `${90}%`}}
                            >
                            <input type="text" 
                                placeholder="search"
                                value={homeSearchQuery}
                                onChange={homeSearchQueryHandler}
                                className="large-homePageSearchBarInput" 
                            />
                            <button className="large-homePageSearchBarInputBtn"
                                    onClick={() => homeSearchToggleClose()}
                                >
                                <Close className="large-homePageSearchBarWatchlistInputIcon"/>
                            </button>
                        </div>
                        <div className="large-homePageMainNavigationSearchResultsContainer">
                            {usersQuery.length === 0 ?
                                null : 
                                <>
                                    <div className="large-homePageSearchResultsSectionHeader">Users</div>
                                    {usersQuery.map((desc, index) => {
                                            if(desc.verified) {
                                                return <button className="large-homePageSearchResultsInnerDescContainer" 
                                                        key={`user-search-rslt-${index}`}
                                                        onClick={() => {homeSearchTogglenNavigate(`/profile/${desc.username}`);}}
                                                    >
                                                    <div className="large-homePageSearchResultsInnerDescInsideContainer">
                                                        <img src={desc.profilePicture} alt="" className="large-homePageMainNavigationAccountImg" />
                                                        <div className="large-homePageSearchResultsFullVerifiedTextCont">
                                                            <span className="large-homepageMainNavigationSrchrsultDescBlock">{desc.username}</span>
                                                        </div>
                                                        <Verified className="large-homePageMainNavigationAccountVerifiedIcon" />
                                                    </div>
                                                </button>
                                            } else {
                                                return <button className="large-homePageSearchResultsInnerDescContainer" 
                                                        key={`user-search-rslt-${index}`}
                                                        onClick={() => {homeSearchTogglenNavigate(`/profile/${desc.username}`);}}
                                                    >
                                                    <div className="large-homePageSearchResultsInnerDescInsideContainer">
                                                        {desc.profilePicture === "" ?
                                                            <div className="large-homepageMainNavigationSrchrsultNoPic"
                                                                    style={generalOpx.profilePictureGradients[index % 5]}
                                                                >
                                                                <img src="/assets/Favicon.png" alt="" className="large-homepageMainNavigationSrcrsultNoPicFinulabLogo" />
                                                            </div> :
                                                            <img src={desc.profilePicture} alt="" className="large-homePageMainNavigationAccountImg" />
                                                        }
                                                        <div className="large-homePageSearchResultsFullTextCont">
                                                            <span className="large-homepageMainNavigationSrchrsultDescBlock">{desc.username}</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            }
                                        })
                                    }
                                </>
                            }
                            {communitiesQuery.length === 0 ?
                                null : 
                                <>
                                    <div className="large-homePageSearchResultsSectionHeader">Communities</div>
                                    {communitiesQuery.map((desc, index) => (
                                            <div className="large-homePageSearchResultsInnerDescContainer" key={`community-search-rslt-${index}`}>
                                                <div className="large-homePageSearchResultsInnerDescInsideContainer">
                                                    <img src={desc.profilePicture} alt="" className="large-homePageMainNavigationAccountImg" />
                                                    <div className="large-homePageSearchResultsFullTextCont">
                                                        <span className="large-homepageMainNavigationSrchrsultDescBlock">{desc.communityName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </>
                            }
                            {stocksQuery.length === 0 ?
                                null : 
                                <>
                                    <div className="large-homePageSearchResultsSectionHeader">Stocks</div>
                                    {stocksQuery.map((desc, index) => (
                                            <button className="large-homePageSearchResultsInnerDescContainer" 
                                                    key={`stock-search-rslt-${index}`}
                                                    onClick={() => homeSearchTogglenNavigate(`/stocks/S:-${desc.symbol}`)}
                                                >
                                                <div className="large-homePageSearchResultsInnerDescInsideContainer">
                                                    <img src={desc.profileImage} alt="" className="large-homePageMainNavigationAccountImg" />
                                                    <div className="large-homePageSearchResultsTickerText">
                                                        <span className="large-homepageMainNavigationSrchrsultDescBlock">{desc.symbol}</span>
                                                    </div>
                                                    <div className="large-homePageSearchResultsNameText">
                                                        <span className="large-homepageMainNavigationSrchrsultDescBlock">
                                                            {(desc.alphaVantageName.length < desc.polygonIoName.length) && desc.alphaVantageName !== "" ?
                                                                `${desc.alphaVantageName}` : `${desc.polygonIoName}`
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    }
                                </>
                            }
                            {cryptosQuery.length === 0 ?
                                null : 
                                <>
                                    <div className="large-homePageSearchResultsSectionHeader">Cryptos</div>
                                    {cryptosQuery.map((desc, index) => (
                                            <button className="large-homePageSearchResultsInnerDescContainer" 
                                                    key={`crypto-search-rslt-${index}`}
                                                    onClick={() => homeSearchTogglenNavigate(`/cryptos/C:-${desc.symbol}`)}
                                                >
                                                <div className="large-homePageSearchResultsInnerDescInsideContainer">
                                                    <img src={desc.profileImage} alt="" className="large-homePageMainNavigationAccountImg" />
                                                    <div className="large-homePageSearchResultsTickerText">
                                                        <span className="large-homepageMainNavigationSrchrsultDescBlock">{desc.symbol}</span>
                                                    </div>
                                                    <div className="large-homePageSearchResultsNameText">
                                                        <span className="large-homepageMainNavigationSrchrsultDescBlock">{desc.name}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    }
                                </>
                            }
                        </div>
                    </div> : 
                    <>
                        {user ?
                            <>
                                <button className="large-homePageRightBarImgBtn"
                                        ref={sb_overlayContainerRef}
                                        onClick={u_notifications["unread"]["data"].length === 0 ?
                                            () => leftBarButtonLinkNavigate(`/profile/${user.user}`) : () => leftBarButtonLinkNavigate(`/profile/${user.user}/notifications`)
                                        }
                                    >
                                    {user.profilePicture === "" ?
                                        <div className="finulab-noProfileImagePlaceHolderImgRep"
                                                style={{...generalOpx.profilePictureGradients[`${user.user}`.length % 5], "marginTop": "5px", "marginLeft": "10px"}}
                                            >
                                            <BlurOn style={{"transform": "scale(1.5)", "color": `var(--primary-bg-${`${user.user}`.length % 5 === 0 ? `01` : `10`})`}}/>
                                        </div> : 
                                        <img src={user.profilePicture} alt="" className="small-homePageLeftSideProfileImg"/>
                                    }
                                    {u_notifications["unread"]["data"].length > 0 ?
                                        <span className="small-homePageLeftSideCommunityNotifsCounter"
                                                style={{"position": "absolute", "margin": "0", "top": "0", "right": "-5px"}}
                                            >
                                            {u_notifications["unread"]["data"].length > 5 ?
                                                `5+` : `${u_notifications["unread"]["data"].length}`
                                            }
                                        </span> : null
                                    }
                                </button>
                                <div className="small-homePageLeftSideInnerWrapper">
                                    <div className="small-homePageLeftSideUserDescContainer">
                                        <button className="large-homePageRightBarImgBtn"
                                                onClick={u_notifications["unread"]["data"].length === 0 ?
                                                    () => leftBarButtonLinkNavigate(`/profile/${user.user}`) : () => leftBarButtonLinkNavigate(`/profile/${user.user}/notifications`)
                                                }
                                            >
                                            <span style={{"fontSize": "1.05rem"}}>{user.user}</span>
                                        </button>
                                        {user.verified ?
                                            <Verified className="small-homePageLeftSideUserDescIcon"/> : 
                                            <button className="large-walletAccountOvrlAccountGetVerifiedBtn"
                                                    onClick={() => leftBarButtonLinkNavigate("/get-verified")}
                                                >
                                                <Verified className="large-walletAccountOvrlAccountGetVerifiedBtnIcon"/>
                                                Get Verified
                                            </button>
                                        }
                                    </div>
                                    <div className="small-homePageLeftSideUserDescContainer"
                                            style={{"marginTop": "10px"}}
                                        >
                                        <button className="large-homePageRightBarImgBtn"
                                                onClick={() => leftBarButtonLinkNavigate(`/wallet`)}
                                            >
                                            <span style={{"fontWeight": "normal", "color": "var(--primary-bg-05)"}}>Balance:</span>&nbsp;
                                            {walletTotal[1] ? 
                                                <span className="small-homePageLeftSideUserWalletBalanceLoading"/> :
                                                <span>{generalOpx.formatFigures.format(walletTotal[0])} FINUX</span>
                                            }
                                        </button>
                                    </div>
                                    <div className="small-homePageLeftSideUserDescContainer"
                                            style={{"marginTop": "5px", "marginBottom": "24px"}}
                                        >
                                        <button className="large-homePageRightBarImgBtn"
                                                onClick={() => leftBarButtonLinkNavigate(`/profile/${user.user}/following`)}
                                            >
                                            {u_quickDesc["desc"]["dataLoading"] ?
                                                <span className="small-homePageLeftSideUserWalletBalanceLoading"
                                                    style={{"width": "50px", "minWidth": "50px", "maxWidth": "50px"}}
                                                /> : 
                                                <span>{generalOpx.formatLargeFigures(u_quickDesc["desc"]["data"]["following"], 2)}</span>
                                            }&nbsp;
                                            <span style={{"fontWeight": "normal", "color": "var(--primary-bg-05)"}}>Following</span>
                                        </button>&nbsp;&nbsp;&nbsp;&nbsp;
                                        <button className="large-homePageRightBarImgBtn"
                                                onClick={() => leftBarButtonLinkNavigate(`/profile/${user.user}/followers`)}
                                            >
                                            {u_quickDesc["desc"]["dataLoading"] ?
                                                <span className="small-homePageLeftSideUserWalletBalanceLoading"
                                                    style={{"width": "50px", "minWidth": "50px", "maxWidth": "50px"}}
                                                /> : 
                                                <span>{generalOpx.formatLargeFigures(u_quickDesc["desc"]["data"]["followers"], 2)}</span>
                                            }&nbsp;
                                            <span style={{"fontWeight": "normal", "color": "var(--primary-bg-05)"}}>Followers</span>
                                        </button>
                                    </div>
                                    <div className="large-homePageRighBarCreateOptnsContainer">
                                        <button className="large-homePageRightBarCreateBtn"
                                                onClick={() => leftBarButtonLinkNavigate("/create-post")}
                                            >
                                            <SendSharp className="large-homePageRightBarCreateBtnIcon"/>
                                            Post
                                        </button>
                                        <button className="large-homePageRightBarCreateBtn"
                                                onClick={() => leftBarButtonLinkNavigate("/create-community")}
                                            >
                                            <GroupAddSharp className="large-homePageRightBarCreateBtnIcon"/>
                                            Group
                                        </button>
                                        {user.verified ?
                                            <button className="large-homePageRightBarCreateBtn"
                                                    onClick={() => leftBarButtonLinkNavigate("/create-prediction")}
                                                >
                                                <AssuredWorkloadSharp className="large-homePageRightBarCreateBtnIcon"/>
                                                Pair
                                            </button> : 
                                            <button className="large-homePageRightBarCreateBtn"
                                                    onClick={() => leftBarButtonLinkNavigate("/market")}
                                                >
                                                <CandlestickChart className="large-homePageRightBarCreateBtnIcon"/>
                                                Trade
                                            </button>
                                        }
                                    </div>
                                    <div className="small-homePageLeftSideDivider" style={{"marginTop": "24px", "marginBottom": u_moderatorStatus.length > 0 ? "12px" : "0px"}}/>
                                    {u_moderatorStatus.length > 0 ?
                                        <>
                                            <div className="small-homePageLeftSideMyCommunitiesContainer">
                                                <div className="small-homePageLeftSideUserDescContainer">
                                                    My Communities
                                                    {u_moderatorStatus.length === 1 ? 
                                                        null : 
                                                        <div className="small-homePageLeftSideUserDescCommunitiesToggleContainer">
                                                            {communitiesQuickViewIndex === 0 ?
                                                                null : 
                                                                <button className="small-homePageLeftSideUserDescMyCommunitiesToggleBtn"
                                                                        onClick={() => communitiesQuickViewIndexToggle("back")}
                                                                    >
                                                                    <ChevronLeft className="small-homePageLeftSideUserDescMyCommunitiesToggleBtnIcon"/>
                                                                </button>
                                                            }
                                                            &nbsp;&nbsp;|&nbsp;&nbsp;
                                                            {communitiesQuickViewIndex === u_moderatorStatus.length - 1 ? 
                                                                null : 
                                                                <button className="small-homePageLeftSideUserDescMyCommunitiesToggleBtn"
                                                                        onClick={() => communitiesQuickViewIndexToggle("forward")}
                                                                    >
                                                                    <ChevronRight className="small-homePageLeftSideUserDescMyCommunitiesToggleBtnIcon"/>
                                                                </button>
                                                            }
                                                        </div>
                                                    }
                                                </div>
                                                <div className="small-homePageLeftSideMyCommunitiesInsideContainerWrapper">
                                                    <div className="small-homePageLeftSideMyCommunitiesInsideContainerInsideWrapper"
                                                            style={{"transform": `translateX(calc(${communitiesQuickViewIndex} * -100%))`}}
                                                        >
                                                        {u_moderatorStatus.map((comm_desc, index) => (
                                                                <div className="small-homePageLeftSideMyCommunitiesInsideContainer" key={`community-quick-view-${index}`}>
                                                                    <button className="large-homePageRightBarImgBtn"
                                                                        onClick={u_notifications["communities"]["dataLoading"] ?
                                                                            () => leftBarButtonLinkNavigate(`/profile/${comm_desc["community"]}`) :
                                                                            u_notifications["communities"]["data"][comm_desc["community"]].length === 0 ?
                                                                            () => leftBarButtonLinkNavigate(`/profile/${comm_desc["community"]}`) : () => leftBarButtonLinkNavigate(`/profile/${comm_desc["community"]}/notifications`)
                                                                        }
                                                                    >
                                                                        {comm_desc["profileImage"]  === "" ?
                                                                            <div className="finulab-noProfileImagePlaceHolderImgRep"
                                                                                    style={{...generalOpx.profilePictureGradients[`${comm_desc["community"]}`.length % 5], "marginTop": "12px"}}
                                                                                >
                                                                                <BlurOn style={{"transform": "scale(1.5)", "color": `var(--primary-bg-${`${comm_desc["community"]}`.length % 5 === 0 ? `01` : `10`})`}}/>
                                                                            </div> :
                                                                            <img src={comm_desc["profileImage"]} alt="" className="small-homePageLeftSideCommunityImg"/>
                                                                        }
                                                                    </button>
                                                                    <div className="small-homePageLeftSideUserDescContainer" style={{"marginTop": "5px", "marginBottom": "12px"}}>
                                                                        <button className="large-homePageRightBarImgBtn"
                                                                                style={{"width": "100%", "minWidth": "100%", "maxWidth": "100%"}}
                                                                                onClick={u_notifications["communities"]["dataLoading"] ?
                                                                                    () => leftBarButtonLinkNavigate(`/profile/${comm_desc["community"]}`) :
                                                                                    u_notifications["communities"]["data"][comm_desc["community"]].length === 0 ?
                                                                                    () => leftBarButtonLinkNavigate(`/profile/${comm_desc["community"]}`) : () => leftBarButtonLinkNavigate(`/profile/${comm_desc["community"]}/notifications`)
                                                                                }
                                                                            >
                                                                            <span className="small-homePageLeftSideCommunityNameDesc" style={{"fontWeight": "normal"}}>{comm_desc["community"]}</span>
                                                                            {u_notifications["communities"]["dataLoading"] ? 
                                                                                null : 
                                                                                <>
                                                                                    {u_notifications["communities"]["data"][comm_desc["community"]].length > 0 ?
                                                                                        <span className="small-homePageLeftSideCommunityNotifsCounter">
                                                                                            {u_notifications["communities"]["data"][comm_desc["community"]].length > 5 ?
                                                                                                `5+` : `${u_notifications["communities"]["data"][comm_desc["community"]].length}`
                                                                                            }
                                                                                        </span> : null
                                                                                    }
                                                                                </>
                                                                            }
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            </div> 
                                        </> : null
                                    }
                                    {u_moderatorStatus.length > 0 ?
                                        <div className="small-homePageLeftSideDivider" style={{"marginTop": "12px", "marginBottom": u_moderatorStatus.length > 0 ? "12px" : "0px"}}/> : null
                                    }
                                    <div className="sm-viewLeftBarSearchContainer"
                                            style={u_moderatorStatus.length > 0 ?
                                                {"height": `calc(100vh - 457px)`, "minHeight": `calc(100vh - 457px)`, "maxHeight": `calc(100vh - 457px)`} : 
                                                {"height": `calc(100vh - 327px)`, "minHeight": `calc(100vh - 327px)`, "maxHeight": `calc(100vh - 327px)`}
                                            }
                                        >
                                        <div className="sm-viewLeftBarSearchSearchHidden">
                                            <div className="main-largeLoginInformationFinualbTxtContainer"
                                                    style={{"marginLeft": "10px"}}
                                                >
                                                <img src="/assets/Finulab_Logo.png" alt="" className="sm-headerLogoImg" />
                                            </div>
                                            <div className="main-largeLoginInformationFinulabMainDesc"
                                                    style={{
                                                        "marginLeft": "10px",
                                                        "fontSize": "1.5rem", "color": "var(--primary-bg-01)",
                                                        "width": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)", "maxWidth": "calc(100% - 20px)"
                                                    }}
                                                >
                                                <span className="main-largeLoginInformationFinulabMainDescReal">
                                                    Post
                                                </span>
                                                <span className="main-largeLoginInformationFinulabMainDescReal">
                                                    Predict
                                                </span>
                                                <span className="main-largeLoginInformationFinulabMainDescReal">
                                                    Profit
                                                </span>
                                            </div>
                                            <img src="/assets/Finux_Token_Flow_Icon.png" alt="" className="sm-FinuxFinulabLeftBarLoggedInImg" />
                                        </div>
                                    </div>
                                    <div className="login-bodyOtherGeneralDescContainer" style={{"marginTop": "auto"}}>
                                        <button className="login-bodyOtherGeneralDescBtn">About Us</button>
                                        &nbsp;&nbsp;|&nbsp;&nbsp;
                                        <button className="login-bodyOtherGeneralDescBtn">Terms of Service</button>
                                        &nbsp;&nbsp;|&nbsp;&nbsp;
                                        <button className="login-bodyOtherGeneralDescBtn">Privacy Policy</button>
                                    </div>
                                    <div className="login-bodyOtherGeneralDescContainer" style={{"marginTop": "3px", "marginBottom": "10px"}}>
                                        Finulab © 2024, All Rights Reserved
                                    </div>
                                    <div className="small-leftBarPaddingBottom"/>
                                </div>
                            </> : 
                            <>
                                <div className="main-largeLoginInformationFinualbTxtContainer"
                                        ref={sb_overlayContainerRef}
                                        style={{"marginLeft": "10px"}}
                                    >
                                    <img src="/assets/Finulab_Logo.png" alt="" className="login-headerLogoImg" />
                                </div>
                                <div className="main-largeLoginInformationFinulabMainDesc"
                                        style={{
                                            "marginLeft": "10px",
                                            "fontSize": "1.5rem", "color": "var(--primary-bg-01)",
                                            "width": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)", "maxWidth": "calc(100% - 20px)"
                                        }}
                                    >
                                    <span className="main-largeLoginInformationFinulabMainDescReal">
                                        Post
                                    </span>
                                    <span className="main-largeLoginInformationFinulabMainDescReal">
                                        Predict
                                    </span>
                                    <span className="main-largeLoginInformationFinulabMainDescReal">
                                        Profit
                                    </span>
                                </div>
                                <img src="/assets/Finux_Token_Flow_Icon.png" alt="" className="small-leftbarTokenFlowImg" />
                                <div className="main-loginOptnsContainer"
                                        style={{"marginLeft": "10px", "width": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)", "maxWidth": "calc(100% - 20px)"}}
                                    >
                                    <button className="main-login_loginBtn" 
                                            style={{"borderRadius": "45px"}}
                                            onClick={() => navigate('/main-login')}
                                        >
                                        Login
                                    </button>
                                </div>
                                <div className="main-loginInputHeader"
                                        style={{"marginTop": "48px", "marginLeft": "10px"}}
                                    >
                                    Not on Finulab?&nbsp;&nbsp;
                                    <button className="main-loginCreateanAccountBtn" onClick={() => navigate("/create-account")}>Create an account</button>
                                </div>
                                <div className="main-loginGeneralInfo"
                                        style={{"marginLeft": "10px"}}
                                    >
                                    Finulab © 2024, All Rights Reserved,&nbsp;
                                    <button className="main-loginTermsofServiceViewBtn">
                                        Terms
                                    </button>&nbsp;Apply
                                </div>
                                <div className="small-leftBarPaddingBottom" style={{"height": "83px", "minHeight": "83px", "maxHeight": "83px"}}/>
                            </>
                        }
                    </>
                }
                
            </div>
            <div className="medium-homePageContainer"
                    style={sm_viewRightbarWidth === 300 ? {"marginLeft": "-300"} : {}}
                >
                <div className="small-homePageVail"
                    style={sm_viewLeftbarWidth === 0 && sm_viewRightbarWidth === 0 ? 
                        {"display": "none"} : 
                        sm_viewLeftbarWidth === 300 ? {"display": "flex", "top": `${sm_viewLeftbarTop}px`, "left": "1px"} : 
                        sm_viewRightbarWidth === 300 ? {"display": "flex", "top": `${sm_viewRightbarTop}px`, "right": "1px"} : {"display": "none"}
                    }
                />
                <div className="medium-homePageContentHeader"
                        style={props.page !== "home" ? 
                            {"height": "50px", "minHeight": "50px", "maxHeight": "50px", "borderBottom": "solid 1px var(--primary-bg-08)"} :
                            (props.postId !== "" || props.newsId !== "") ? 
                            {"height": "50px", "minHeight": "50px", "maxHeight": "50px", "borderBottom": "solid 1px var(--primary-bg-08)"} :
                            v_display ?
                            {
                                "height": width < 933 && props.page === "home" && (props.displayView === undefined || props.displayView === null 
                                    || props.displayView === "" || props.displayView === "following") ? "100px" : "50px", 
                                "minHeight": width < 933 && props.page === "home" && (props.displayView === undefined || props.displayView === null 
                                    || props.displayView === "" || props.displayView === "following") ? "100px" : "50px", 
                                "maxHeight": width < 933 && props.page === "home" && (props.displayView === undefined || props.displayView === null 
                                    || props.displayView === "" || props.displayView === "following") ? "100px" : "50px"
                            } : {"height": "0px", "minHeight": "0px", "maxHeight": "0px", "borderBottom": "solid 0px var(--primary-bg-08)"}
                        }
                    >
                    {width >= 933 ?
                        null : 
                        <div className="small-homePageContentHeaderTop"
                                style={props.page === "home" && (props.displayView === undefined || props.displayView === null 
                                    || props.displayView === "" || props.displayView === "following") ?
                                    {"display": "flex"} : 
                                    {"display": "none"}
                                }
                            >
                            <div className="small-homeContentHeaderTopLeft">
                                <button className="small-homeCOntentHeaderLeftImgBtn"
                                        style={{"position": "relative"}}
                                        onClick={() => sm_viewLeftbarWidthToggle()}
                                    >
                                    {user ?
                                        <img src={user.profilePicture} alt="" className="small-homeCOntentHeaderLeftImg" style={{"marginTop": "5px"}}/> : 
                                        <div className="finulab-smViewWatchlistContainer"
                                                style={{"marginTop": "5px", "marginLeft": "10px"}}
                                            >
                                            <Person style={{"transform": "scale(1.5)", "color": `var(--primary-bg-01)`}}/>
                                        </div>
                                    }
                                    {user ? 
                                        <>
                                            {u_notifications["unread"]["data"].length > 0 ?
                                                <span className="small-homePageLeftSideCommunityNotifsCounter"
                                                        style={{"position": "absolute", "margin": "0", "top": "0", "right": "-5px"}}
                                                    >
                                                    {u_notifications["unread"]["data"].length > 5 ?
                                                        `5+` : `${u_notifications["unread"]["data"].length}`
                                                    }
                                                </span> : null
                                            }
                                        </> : null
                                    }
                                </button>
                            </div>
                            <div className="small-homeContentHeaderMiddle">
                                <img src="/assets/Favicon.png" alt="" className="small-homeCOntentHeaderMiddleLogoImg" />
                            </div>
                            <div className="small-homeContentHeaderTopRight">
                                {width >= 670 ? 
                                    null : 
                                    <button className="small-homeCOntentHeaderLeftImgBtn"
                                            ref={rsb_overlayContainerRef}
                                            onClick={() => setSm_viewRightbarWidthToggle()}
                                        >
                                        <div className="finulab-smViewWatchlistContainer"
                                                style={{"marginTop": "5px", "marginRight": "10px", "borderRadius": "50%"}}
                                            >
                                            <ReadMore style={{"transform": "scale(2)", "color": `var(--primary-bg-01)`}}/>
                                        </div>
                                    </button>
                                }
                            </div>
                        </div>   
                    }
                    <div className="small-homePageContentHeaderUnderline">
                        {props.page === "home" ?
                            <>
                                {props.displayView === undefined || props.displayView === null 
                                    || props.displayView === "" || props.displayView === "following" ?
                                    <>
                                        <button className="large-homePageContentHeaderBtn"
                                                onClick={() => navigate(`/`)}
                                                style={props.displayView === "" ? 
                                                    {"color": "var(--primary-bg-01)"} : {"color": "var(--primary-bg-05)"}
                                                }
                                            >
                                            For You
                                            {props.displayView === "" ?
                                                <div className="large-homePageContentHeaderBtnOutline"/> : null
                                            }
                                        </button>
                                        <button className="large-homePageContentHeaderBtn"
                                                onClick={user ? () => navigate(`/following`) : () => navigate(`/login`)}
                                                style={props.displayView === "following" ? 
                                                    {"color": "var(--primary-bg-01)"} : {"color": "var(--primary-bg-05)"}
                                                }
                                            >
                                            Following
                                            {props.displayView === "following" ?
                                                <div className="large-homePageContentHeaderBtnOutline"/> : null
                                            }
                                        </button>
                                    </> : 
                                    <>
                                        <button className="large-homePageBackBtn"
                                                onClick={() => navigate(-1)}
                                            >
                                            <KeyboardBackspace className="large-homePageBackBtnIcon"/>
                                        </button>
                                        <div className="large-homePageNonHomeDescContainer">
                                            <div className="large-homePageNonHomeDesc">
                                                <span className="large-homePageNonHomeDescTop">
                                                    {props.displayView}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                }
                            </> : 
                            <>
                                {props.page === "wallet" ?
                                    <div className="large-homePageNonHomeDescContainer"
                                            style={{"marginLeft": "10px", "width": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)"}}
                                        >
                                        <div className="large-homePageNonHomeDesc">
                                            <span className="large-homePageNonHomeDescTop">
                                                <img src="/assets/Finux_Token_Flow_Icon.png" alt="" className="large-homePageNonHomeDescTopImg" />
                                                Investing
                                            </span>
                                        </div>
                                        <button className="large-homePageWalletRefreshBtn"
                                                onClick={() => refreshWallet()}
                                            >
                                            Refresh
                                        </button>
                                    </div> : 
                                    <>
                                        {props.page === "market" ?
                                            <>
                                                {props.displayView === "prediction" ?
                                                    <>
                                                        <button className="large-homePageBackBtn"
                                                                onClick={() => navigate(-1)}
                                                            >
                                                            <KeyboardBackspace className="large-homePageBackBtnIcon"/>
                                                        </button>
                                                        <div className="large-homePageNonHomeDescContainer">
                                                            <div className="large-homePageNonHomeDesc">
                                                                <span className="large-homePageNonHomeDescTop">
                                                                    Prediction
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </> :
                                                    <>
                                                        {props.marketId === null || props.marketId === undefined || props.marketId === "" ?
                                                            <div className="large-homePageNonHomeDescContainer" 
                                                                    style={{"marginLeft": "10px", "width": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)"}}
                                                                >
                                                                <div className="large-homeMarketPageSearchBarContainer">
                                                                    <button className="large-homePageSearchBarInputBtn" style={{"zIndex": "9", "cursor": "auto"}}>
                                                                        <Search className="large-homePageSearchBarWatchlistInputIcon"/>
                                                                    </button>
                                                                    <input type="text" 
                                                                        value={marketData["query"]}
                                                                        onChange={updateMarketQuery}
                                                                        placeholder="search"
                                                                        className="large-homeMarketPageSearchBarInput"
                                                                    />
                                                                    {marketData["query"].length > 0 ?
                                                                        <button className="large-homePageSearchBarInputBtn" style={{"marginLeft": "auto"}} onClick={() => clearMarketQuery()}>
                                                                            <Close className="large-homePageSearchBarWatchlistInputIcon"/>
                                                                        </button> : null
                                                                    }
                                                                </div>
                                                            </div> : 
                                                            <>
                                                                <button className="large-homePageBackBtn" onClick={() => navigate(-1)}>
                                                                    <KeyboardBackspace className="large-homePageBackBtnIcon"/>
                                                                </button>
                                                                <div className="large-homePageNonHomeDescContainer">
                                                                    {stockData["page"]["dataLoading"] ?
                                                                        <div className="large-homePageStockProfileImgLoading"/> :
                                                                        <>
                                                                            {stockData["page"]["data"]["outcomeImage"] === "" ?
                                                                                <img src={stockData["page"]["data"]["predictiveImage"]} alt="" className="large-homePageStockProfileImg" /> :
                                                                                <img src={stockData["page"]["data"]["outcomeImage"]} alt="" className="large-homePageStockProfileImg" />
                                                                            }
                                                                        </>
                                                                    }
                                                                    <div className="large-homePageNonHomeDesc">
                                                                        <span className="large-homePageNonHomeDescTop">
                                                                            {stockData["page"]["dataLoading"] ?
                                                                                null : 
                                                                                <>
                                                                                    {stockData["page"]["data"]["outcome"] === "" ?
                                                                                        `${props.selection}`.toUpperCase() : 
                                                                                        `${stockData["page"]["data"]["outcome"]}, ${`${props.selection}`.toUpperCase()}`
                                                                                    }
                                                                                    {homeFinancialScroll["priceDisplay"] && !quoteData["quote"]["dataLoading"] 
                                                                                        && !(quoteData["quote"]["data"][props.selection] === undefined) ? 
                                                                                        `, ${generalOpx.formatFigures.format(quoteData["quote"]["data"][props.selection]["close"])} FINUX` : null
                                                                                    }
                                                                                </>
                                                                            }
                                                                        </span>
                                                                        <span className="large-homePageNonHomeDescUnderline">
                                                                            {stockData["page"]["dataLoading"] ?
                                                                                <div className="large-homePageNonHomeDescUnderlineLoading"/> :
                                                                                `Close: ${new Date(stockData["page"]["data"]["endDate"] * 1000).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })} | Market Cap: ${generalOpx.formatLargeFigures(stockData["page"]["data"]["costFunction"], 2)} FINUX`
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <div className="large-homePageProfileStreakContainer">
                                                                        
                                                                    </div>
                                                                </div>
                                                            </>
                                                        }
                                                    </>
                                                }
                                            </> : 
                                            <>
                                                {props.page === "profile" ?
                                                    <>
                                                        {user ?
                                                            <>
                                                                {user.user === props.userId ?
                                                                    null : 
                                                                    <button className="large-homePageBackBtn" onClick={() => navigate(-1)}>
                                                                        <KeyboardBackspace className="large-homePageBackBtnIcon"/>
                                                                    </button>
                                                                }
                                                            </> : 
                                                            <button className="large-homePageBackBtn" onClick={() => navigate(-1)}>
                                                                <KeyboardBackspace className="large-homePageBackBtnIcon"/>
                                                            </button>
                                                        }
                                                        {props.userId.slice(0, 3) === "f:-" ?
                                                            <div className="large-homePageNonHomeDescContainer">
                                                                <div className="large-homePageNonHomeDesc">
                                                                    <span className="large-homePageNonHomeDescTop">
                                                                        {props.userId}
                                                                    </span>
                                                                    <span className="large-homePageNonHomeDescUnderline">
                                                                        {profileData["profileDesc"]["dataLoading"] ?
                                                                            <div className="large-homePageNonHomeDescUnderlineLoading"/> :
                                                                            <>
                                                                                {generalOpx.formatLargeFigures(profileData["profileDesc"]["data"]["membersCount"], 2)}&nbsp;&nbsp;Members&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;{generalOpx.formatLargeFigures(profileData["profileDesc"]["data"]["postCount"], 2)}&nbsp;&nbsp;Posts
                                                                            </>
                                                                        }
                                                                    </span>
                                                                </div>
                                                                {/*
                                                                <div className="large-homePageProfileStreakContainer">
                                                                    367
                                                                    <Whatshot className='large-profilePageStreakIcon'/>
                                                                </div>
                                                                */}
                                                            </div> : 
                                                            <div className="large-homePageNonHomeDescContainer">
                                                                <div className="large-homePageNonHomeDesc">
                                                                    <span className="large-homePageNonHomeDescTop" style={{"marginLeft": "10px"}}>
                                                                        {props.userId}
                                                                    </span>
                                                                    <span className="large-homePageNonHomeDescUnderline" style={{"marginLeft": "10px"}}>
                                                                        {profileData["profileDesc"]["dataLoading"] ?
                                                                            <div className="large-homePageNonHomeDescUnderlineLoading"/> :
                                                                            <>
                                                                                {generalOpx.formatLargeFigures(profileData["profileDesc"]["data"]["postCount"], 2)}&nbsp;&nbsp;Posts&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;{generalOpx.formatLargeFigures(profileData["profileDesc"]["data"]["marketsCount"], 2)}&nbsp;&nbsp;Markets
                                                                            </>
                                                                        }
                                                                    </span>
                                                                </div>
                                                                {/*
                                                                <div className="large-homePageProfileStreakContainer">
                                                                    367
                                                                    <Whatshot className='large-profilePageStreakIcon'/>
                                                                </div>
                                                                */}
                                                            </div>
                                                        }
                                                    </> : 
                                                    <>
                                                        {props.page === "stocks" ?
                                                            <>
                                                                {props.ticker === null || props.ticker === undefined || props.ticker === "" ?
                                                                    <div className="large-homePageNonHomeDescContainer"
                                                                            style={{"marginLeft": "10px", "width": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)"}}
                                                                        >
                                                                        <div className="large-homePageNonHomeDesc">
                                                                            <span className="large-homePageNonHomeDescTop">
                                                                                <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                                                                                    <g stroke="#9E9E9E" strokeLinejoin="round" strokeWidth="1.5">
                                                                                        <path d="m2.5 12c0-4.47834 0-6.71751 1.39124-8.10876 1.39125-1.39124 3.63042-1.39124 8.10876-1.39124 4.4783 0 6.7175 0 8.1088 1.39124 1.3912 1.39125 1.3912 3.63042 1.3912 8.10876 0 4.4783 0 6.7175-1.3912 8.1088-1.3913 1.3912-3.6305 1.3912-8.1088 1.3912-4.47834 0-6.71751 0-8.10876-1.3912-1.39124-1.3913-1.39124-3.6305-1.39124-8.1088z"/><path d="m2.5 14.5h.53875c.47231 0 .70846 0 .91381-.0987s.35288-.2831.64793-.6519l1.39951-1.7494 1.5 2.5 1.5-3.5 2.5 5 3.5-7 2 3.5 1.5-1.5 1.4453 2.168c.252.378.378.567.5621.6814.0366.0227.0746.0431.1138.0609.1973.0897.4245.0897.8788.0897"/>
                                                                                        <path d="m15 2.5v3m0 16v-7" strokeLinecap="round"/>
                                                                                        <circle cx="15" cy="9" r="1"/>
                                                                                    </g>
                                                                                </svg>&nbsp;
                                                                                Stocks Dashboard
                                                                            </span>
                                                                        </div>
                                                                    </div> : 
                                                                    <>
                                                                        <button className="large-homePageBackBtn" onClick={() => navigate(-1)}>
                                                                            <KeyboardBackspace className="large-homePageBackBtnIcon"/>
                                                                        </button>
                                                                        <div className="large-homePageNonHomeDescContainer">
                                                                            {stockData["page"]["dataLoading"] ?
                                                                                <div className="large-homePageStockProfileImgLoading"/> :
                                                                                <img src={stockData["page"]["data"]["profileImage"]} alt="" className="large-homePageStockProfileImg" />
                                                                            }
                                                                            <div className="large-homePageNonHomeDesc">
                                                                                <span className="large-homePageNonHomeDescTop">
                                                                                    {`${props.ticker}`.slice(3, `${props.ticker}`.length)}
                                                                                    {homeFinancialScroll["priceDisplay"] ? 
                                                                                        `, $${generalOpx.formatFigures.format(quoteData["quote"]["data"]["close"])}` : null
                                                                                    }
                                                                                </span>
                                                                                <span className="large-homePageNonHomeDescUnderline">
                                                                                    {stockData["page"]["dataLoading"] ?
                                                                                        <div className="large-homePageNonHomeDescUnderlineLoading"/> :
                                                                                        `${stockData["page"]["data"]["name"]} | ${stockData["page"]["data"]["assetType"] === "ETF" ? `AUM: ` : `Market Cap: `} ${stockData["page"]["data"]["sharesOutstanding"] === 0 ? 
                                                                                            generalOpx.formatLargeFigures(stockData["page"]["data"]["marketCap"], 2) : 
                                                                                            generalOpx.formatLargeFigures(quoteData["quote"]["data"]["close"] * stockData["page"]["data"]["sharesOutstanding"], 2)
                                                                                        }`
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                            <div className="large-homePageProfileStreakContainer">
                                                                                {stockData["page"]["dataLoading"] ?
                                                                                    null :
                                                                                    <button className="large-homePageAssetBookmarketBtn"
                                                                                            onClick={() => addRemoveFromWatchlist()}
                                                                                        >
                                                                                        {[...u_watchlist].includes(`${stockData["page"]["data"]["symbol"]}`) ?
                                                                                            <BookmarkAdded className="large-homePageAssetBookmarketBtnIcon"
                                                                                                style={quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["previousClose"] >= 0 ?
                                                                                                    {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                                                }
                                                                                            /> :
                                                                                            <BookmarkAddSharp className="large-homePageAssetBookmarketBtnIcon"/>
                                                                                        }
                                                                                        <span className="large-homePageNonHomeDescUnderline">
                                                                                            By: {generalOpx.formatLargeFigures(stockData["page"]["data"]["watchedBy"], 2)}
                                                                                        </span>
                                                                                    </button>
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                }
                                                            </> : 
                                                            <>
                                                                {props.page === "cryptos" ?
                                                                    <>
                                                                        {props.ticker === null || props.ticker === undefined || props.ticker === "" ?
                                                                            <div className="large-homePageNonHomeDescContainer"
                                                                                    style={{"marginLeft": "10px", "width": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)"}}
                                                                                >
                                                                                <div className="large-homePageNonHomeDesc">
                                                                                    <span className="large-homePageNonHomeDescTop">
                                                                                        <svg viewBox="0 0 22 22"
                                                                                                focusable="false" aria-hidden="true"
                                                                                                style={{"width": "22px", "minWidth": "22px", "maxWidth": "22px", "height": "22px", "minHeight": "22px", "maxHeight": "22px"}}
                                                                                                className="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium large-homePageMainNavigationIcon css-1umw9bq-MuiSvgIcon-root" data-testid="NewspaperIcon"
                                                                                            >
                                                                                            <path d="M11 22C4.975 22 0 17.025 0 11S4.975 0 11 0s11 4.975 11 11-4.975 11-11 11zm3.438-15.222l.557-2.23-1.797-.444-.443 1.78a5.691 5.691 0 00-.894-.22l.444-1.78L10.176 3.3l-.557 2.23c-2.052.371-3.794 1.877-4.317 4.003s.278 4.283 1.833 5.555l-.557 2.23 1.797.444.443-1.78a5.691 5.691 0 00.894.22l-.444 1.78 1.797.443.557-2.23a5.512 5.512 0 003.57-2.328l-1.958-.472a3.715 3.715 0 01-3.534.966c-1.967-.486-3.176-2.45-2.683-4.383s2.473-3.108 4.44-2.622a3.702 3.702 0 012.65 2.517l1.958.472a5.525 5.525 0 00-2.062-3.728z" fill="#9E9E9E"/>
                                                                                        </svg>&nbsp;
                                                                                        Cryptos Dashboard
                                                                                    </span>
                                                                                </div>
                                                                            </div> :
                                                                            <>
                                                                                <button className="large-homePageBackBtn" onClick={() => navigate(-1)}>
                                                                                    <KeyboardBackspace className="large-homePageBackBtnIcon"/>
                                                                                </button>
                                                                                <div className="large-homePageNonHomeDescContainer">
                                                                                    {stockData["page"]["dataLoading"] ?
                                                                                        <div className="large-homePageStockProfileImgLoading"/> :
                                                                                        <img src={stockData["page"]["data"]["profileImage"]} alt="" className="large-homePageStockProfileImg" />
                                                                                    }
                                                                                    <div className="large-homePageNonHomeDesc">
                                                                                        <span className="large-homePageNonHomeDescTop">
                                                                                            {`${props.ticker}`.slice(3, `${props.ticker}`.length)}
                                                                                            {homeFinancialScroll["priceDisplay"] ? 
                                                                                                `, $${generalOpx.formatFiguresCrypto.format(quoteData["quote"]["data"]["close"])}` : null
                                                                                            }
                                                                                        </span>
                                                                                        <span className="large-homePageNonHomeDescUnderline">
                                                                                            {stockData["page"]["dataLoading"] ?
                                                                                                <div className="large-homePageNonHomeDescUnderlineLoading"/> :
                                                                                                `${stockData["page"]["data"]["name"]} | Market Cap: ${stockData["page"]["data"]["circulatingSupply"] === 0 ? 
                                                                                                    generalOpx.formatLargeFigures(quoteData["quote"]["data"]["close"] * stockData["page"]["data"]["totalSupply"], 2) : 
                                                                                                    generalOpx.formatLargeFigures(quoteData["quote"]["data"]["close"] * stockData["page"]["data"]["circulatingSupply"], 2)
                                                                                                }`
                                                                                            }
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="large-homePageProfileStreakContainer">
                                                                                        {stockData["page"]["dataLoading"] ?
                                                                                            null :
                                                                                            <button className="large-homePageAssetBookmarketBtn"
                                                                                                    onClick={() => addRemoveFromWatchlist()}
                                                                                                >
                                                                                                {[...u_watchlist].includes(`${stockData["page"]["data"]["symbol"]}`) ?
                                                                                                    <BookmarkAdded className="large-homePageAssetBookmarketBtnIcon"
                                                                                                        style={quoteData["quote"]["data"]["close"] - quoteData["quote"]["data"]["previousClose"] >= 0 ?
                                                                                                            {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                                                        }
                                                                                                    /> :
                                                                                                    <BookmarkAddSharp className="large-homePageAssetBookmarketBtnIcon"/>
                                                                                                }
                                                                                                <span className="large-homePageNonHomeDescUnderline">
                                                                                                    By: {generalOpx.formatLargeFigures(stockData["page"]["data"]["watchedBy"], 2)}
                                                                                                </span>
                                                                                            </button>
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                            </>
                                                                        }
                                                                    </> : 
                                                                    <>
                                                                        {props.page === "create-post" ?
                                                                            <div className="large-homePageNonHomeDescContainer"
                                                                                    style={{"marginLeft": "10px", "width": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)", "minWidth": "calc(100% - 20px)"}}
                                                                                >
                                                                                <div className="large-homePageNonHomeDesc">
                                                                                    <span className="large-homePageNonHomeDescTop">
                                                                                        <SendSharp />&nbsp;
                                                                                        Create Post
                                                                                    </span>
                                                                                </div>
                                                                            </div> : null
                                                                        }
                                                                    </>
                                                                }
                                                            </>
                                                        }
                                                    </>
                                                }
                                            </>
                                        }
                                    </>
                                }
                            </>
                        }
                    </div>
                </div>
                
                {props.page === "home" ?
                    <InnerHomePage 
                        f_viewPort={"small"}
                        displayView={props.displayView} postId={props.postId} newsId={props.newsId}
                    /> : 
                    <>
                        {props.page === "wallet" ?
                            <InnerWalletPage 
                                f_viewPort={"small"}
                                displayView={props.displayView} 
                            /> :
                            <>
                                {props.page === "market" ?
                                    <>
                                        {props.marketId === null || props.marketId === undefined || props.marketId === "" ?
                                            <InnerMarketPage 
                                                f_viewPort={"small"}
                                                displayView={props.displayView} marketType={props.marketType} predictionId={props.predictionId} 
                                            /> : 
                                            <SpecificMarketTV_Home 
                                                f_viewPort={"small"}
                                                displayView={props.displayView} marketId={props.marketId} selection={props.selection} 
                                            />
                                        }
                                    </> : 
                                    <>
                                        {props.page === "profile" ?
                                            <>
                                                {props.userId.slice(0, 3) === "f:-" ?
                                                    <InnerCommunityProfilePage 
                                                        f_viewPort={"small"}
                                                        userId={props.userId} displayView={props.displayView}
                                                    /> :
                                                    <InnerProfilePage 
                                                        f_viewPort={"small"}
                                                        userId={props.userId} displayView={props.displayView}
                                                    />
                                                }
                                            </> : 
                                            <>
                                                {props.page === "stocks" ?
                                                    <>
                                                        {props.ticker === null || props.ticker === undefined || props.ticker === "" ?
                                                            <StockMarketDashboard_Home 
                                                                f_viewPort={"small"}
                                                            /> : 
                                                            <Stock_Home 
                                                                f_viewPort={"small"}
                                                                displayView={props.displayView} ticker={props.ticker}
                                                            />
                                                        }
                                                    </> : 
                                                    <>
                                                        {props.page === "cryptos" ?
                                                            <>
                                                                {props.ticker === null || props.ticker === undefined || props.ticker === "" ?
                                                                    <CryptoMarketDashboard_Home 
                                                                        f_viewPort={"small"}
                                                                    /> : 
                                                                    <Crypto_Home 
                                                                        f_viewPort={"small"}
                                                                        displayView={props.displayView} ticker={props.ticker} 
                                                                    />
                                                                }
                                                            </> : 
                                                            <>
                                                                {props.page === "create-post" ?
                                                                    <FinulabCreatePost /> : 
                                                                    <>
                                                                        {props.page === "create-community" ?
                                                                            <CreateCommunity /> : 
                                                                            <>
                                                                                {props.page === "create-prediction" ?
                                                                                    <FinulabCreatePrediction /> : null
                                                                                }
                                                                            </>
                                                                        }
                                                                    </>
                                                                }
                                                            </>
                                                        }
                                                    </>
                                                }
                                            </>
                                        }
                                    </>
                                }
                            </>
                        }
                    </>
                }

                {user && width < 933 ? 
                    <>
                        {((props.page === "profile" && props.displayView === "") || props.page === "home") ? 
                            <div className="large-secondaryhomePageContentCreateWrapper"
                                    style={width < 600 ? 
                                        {
                                            ...{"right": `${sm_viewLeftbarWidth === 0 && sm_viewRightbarWidth === 0 ?
                                                    0 : sm_viewLeftbarWidth === 300 ? sm_viewLeftbarWidth : sm_viewRightbarWidth === 300 ? -sm_viewRightbarWidth : 0
                                                }px`
                                            },
                                            ...{
                                                "opacity": v_display ? "1" : "0",
                                                "pointerEvents": v_display ? "auto" : "none"
                                            }
                                        } : 
                                        {
                                            ...{"left": `${sm_viewLeftbarWidth === 0 && sm_viewRightbarWidth === 0 ?
                                                    538 : sm_viewLeftbarWidth === 300 ? sm_viewLeftbarWidth + 538 : sm_viewRightbarWidth === 300 ? -sm_viewRightbarWidth + 538 : 538
                                                }px`
                                            },
                                            "bottom": "5px",
                                            ...{
                                                "opacity": v_display ? "1" : "0",
                                                "pointerEvents": v_display ? "auto" : "none"
                                            }
                                        } 
                                    }
                                >
                                <button className="small-homeCOntentHeaderLeftImgBtn"
                                        style={{
                                            "width": "60px", "minWidth": "60px", "maxWidth": "60px",
                                            "height": "60px", "minHeight": "60px", "maxHeight": "60px"
                                        }}
                                        onClick={() => navigate("/create-post")}
                                    >
                                    <SendSharp style={{"marginLeft": "3px", "transform": "scale(1.5)"}}/>
                                </button>
                            </div> : 
                            <>
                                {user.verified && ((props.page === "profile" && props.displayView === "markets") || props.page === "market") && props.marketId === "" ? 
                                    <div className="large-secondaryhomePageContentCreateWrapper"
                                            style={width < 600 ? 
                                                {
                                                    ...{"right": `${sm_viewLeftbarWidth === 0 && sm_viewRightbarWidth === 0 ?
                                                            0 : sm_viewLeftbarWidth === 300 ? sm_viewLeftbarWidth : sm_viewRightbarWidth === 300 ? -sm_viewRightbarWidth : 0
                                                        }px`
                                                    },
                                                    ...{
                                                        "opacity": v_display ? "1" : "0",
                                                        "pointerEvents": v_display ? "auto" : "none"
                                                    }
                                                } : 
                                                {
                                                    ...{"left": `${sm_viewLeftbarWidth === 0 && sm_viewRightbarWidth === 0 ?
                                                            538 : sm_viewLeftbarWidth === 300 ? sm_viewLeftbarWidth + 538 : sm_viewRightbarWidth === 300 ? -sm_viewRightbarWidth + 538 : 538
                                                        }px`
                                                    },
                                                    "bottom": "5px",
                                                    ...{
                                                        "opacity": v_display ? "1" : "0",
                                                        "pointerEvents": v_display ? "auto" : "none"
                                                    }
                                                } 
                                            }
                                        >
                                        <button className="small-homeCOntentHeaderLeftImgBtn"
                                                style={{
                                                    "width": "60px", "minWidth": "60px", "maxWidth": "60px",
                                                    "height": "60px", "minHeight": "60px", "maxHeight": "60px"
                                                }}
                                                onClick={() => navigate("/create-prediction")}
                                            >
                                            <AssuredWorkloadSharp style={{"marginTop": "-3px", "transform": "scale(1.5)"}}/>
                                        </button>
                                    </div> : null
                                }
                            </>
                        }
                    </> : null
                }
            </div>
            {width < 933 ?
                <>
                    <div className="small-homePageRightSideWrapper"
                            ref={rsb_overlayRef}
                            style={
                                {
                                    "top": `${sm_viewRightbarTop}px`,
                                    "width": `${sm_viewRightbarWidth}px`, 
                                    "minWidth": `${sm_viewRightbarWidth}px`, 
                                    "maxWidth": `${sm_viewRightbarWidth}px`, 
                                    "borderLeft": `solid ${sm_viewRightbarWidth / 300}px var(--primary-bg-08)`
                                }
                            }
                        >
                        <div className="large-homePageLeftBarInnerBodyElementsContainer">
                            <div className="large-homePageLeftBarHeader"
                                    style={{"top": `${0}px`, "width": `${sm_viewRightbarWidth}px`, "minWidth": `${sm_viewRightbarWidth}px`, "maxWidth": `${sm_viewRightbarWidth}px`}}
                                >
                                <div className="large-homePageLeftBarInnerHeader" 
                                        style={{"alignItems": "flex-start", "marginLeft": "5px", "height": "25px", "minHeight": "25px", "maxHeight": "25px"}}
                                    >
                                    Watchlist
                                </div>
                                <div className="large-homePageBarWatchlistLine">
                                    <div className="large-homePageBarWatchlistSymbolLine">
                                        <div className="large-homePageBarWatchlistContainerIconContainer">
                                            <Bookmark className="large-homePageBarWatchlistContainerIcon"/>
                                        </div>
                                        <span className="large-homePageBarWatchlistSymbolDesc">Symbol</span>
                                    </div>
                                    <div className="large-homePageBarWatchlistFiguresLine">
                                        <span className="large-homePageBarWatchlistFiguresDesc">Last</span>
                                    </div>
                                    <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                        <span className="large-homePageBarWatchlistFiguresDesc">Chg-$</span>
                                    </div>
                                    <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                        <span className="large-homePageBarWatchlistFiguresDesc">Chg-%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="large-homePageLeftBarHeaderUnderLayer"/>
                            <div className="large-homePageBarWatchlistContainer">
                                {/*
                                <div className="large-homePageWatchlistSearchWrapper">
                                    <div className="large-homePageWatchlistSearchBarContainer"
                                            style={watchlistSearch ?
                                                {} : {"width": "25px", "minWidth": "25px", "maxWidth": "25px"}
                                            }
                                        >
                                        <button className="large-homePageSearchBarInputBtn"
                                                style={{"marginLeft": "0.5px"}}
                                                onClick={() => watchlistSearchToggle()}
                                            >
                                            <Search className="large-homePageSearchBarWatchlistInputIcon"/>
                                        </button>
                                        <input type="text" 
                                            placeholder="add to watchlist"
                                            value={homeWatchlistQuery}
                                            onChange={homeWatchlistQueryHandler}
                                            className="large-homePageSearchBarInput" 
                                            style={{"marginLeft": "0px"}}
                                        />
                                    </div>
                                    <button className="large-homePageWatchlistSearchBarInputBtn"
                                            style={watchlistSearch ?
                                                {} : {"display": "none"}
                                            }
                                            onClick={() => watchlistSearchToggle()}
                                        >
                                        <Close className="large-homePageSearchBarWatchlistInputIcon"/>
                                    </button>
                                </div>
                                */}
                                {watchlistSearch ?
                                    <>
                                        {watchlistStocksQuery.length === 0 ?
                                            null : 
                                            <>
                                                <div className="large-homePageSearchResultsSectionHeader">Stocks</div>
                                                {watchlistStocksQuery.map((desc, index) => (
                                                        <div className="large-homePageSearchResultsInnerDescContainer" key={`stock-search-rslt-${index}`}>
                                                            <div className="large-homePageSearchResultsInnerDescInsideContainer">
                                                                <img src={desc.profileImage} alt="" className="large-homePageMainNavigationAccountImg" />
                                                                <div className="large-homePageSearchResultsTickerText">
                                                                    <span className="large-homepageMainNavigationSrchrsultDescBlock">{desc.symbol}</span>
                                                                </div>
                                                                <div className="large-homePageSearchResultsNameText">
                                                                    <span className="large-homepageMainNavigationSrchrsultDescBlock">
                                                                        {(desc.alphaVantageName.length < desc.polygonIoName.length) && desc.alphaVantageName !== "" ?
                                                                            `${desc.alphaVantageName}` : `${desc.polygonIoName}`
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </>
                                        }
                                        {watchlistCryptosQuery.length === 0 ?
                                            null : 
                                            <>
                                                <div className="large-homePageSearchResultsSectionHeader">Cryptos</div>
                                                {watchlistCryptosQuery.map((desc, index) => (
                                                        <div className="large-homePageSearchResultsInnerDescContainer" key={`crypto-search-rslt-${index}`}>
                                                            <div className="large-homePageSearchResultsInnerDescInsideContainer">
                                                                <img src={desc.profileImage} alt="" className="large-homePageMainNavigationAccountImg" />
                                                                <div className="large-homePageSearchResultsTickerText">
                                                                    <span className="large-homepageMainNavigationSrchrsultDescBlock">{desc.symbol}</span>
                                                                </div>
                                                                <div className="large-homePageSearchResultsNameText">
                                                                    <span className="large-homepageMainNavigationSrchrsultDescBlock">{desc.name}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </>
                                        }
                                    </> : 
                                    <>
                                        <div className="large-homepageBarWatchlistSeperationLine" style={{"marginTop": "5px"}}>
                                            <span className="large-homePageBarWatchlistSeperationLineDesc">Stock Market</span>
                                        </div>
                                        {homePageWatchlist["watchlist"]["loading"] ?
                                            <>
                                                {Array(4).fill(0).map((desc, desc_index) => (
                                                        <div className="large-homePageBarWatchlistLine" key={`stockMarket-watchlist-${desc_index}`}>
                                                            <div className="large-homePageBarWatchlistSymbolLine">
                                                                <div className="large-homePageBarWatchlistContainerIconContainer">
                                                                    <Bookmark className="large-homePageBarWatchlistContainerIcon" 
                                                                        style={{"color": "rgba(0, 0, 0, 0)"}}
                                                                    />
                                                                </div>
                                                                <div className="large-homePageBarWatchlistSymbolImgLoading"/>
                                                                <span className="large-homePageBarWatchlistSymbolDescACT">
                                                                    <div className="large-homePageBarWatchlistSymbolDescACTLoading"/>
                                                                </span>
                                                            </div>
                                                            <div className="large-homePageBarWatchlistFiguresLine">
                                                                <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                    <div className="large-homePageBarWatchlistFiguresDescACTPrimaryLoading"/>
                                                                </span>
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                    <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                </span>
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                    <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </> : 
                                            <>
                                                {homePageWatchlist["watchlist"]["stockMarket"].length > 0  ?
                                                    <>
                                                        {homePageWatchlist["watchlist"]["stockMarket"].map((desc, desc_index) => (
                                                                <div className="large-homePageBarWatchlistLine" 
                                                                        key={`${desc.type}:-${desc.symbol}`}
                                                                    >
                                                                    <div className="large-homePageBarWatchlistSymbolLine">
                                                                        <div className="large-homePageBarWatchlistContainerIconContainer">
                                                                            <Bookmark className="large-homePageBarWatchlistContainerIcon" 
                                                                                style={[...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                                    desc.changePerc >= 0 ? {"color": "var(--primary-green-09)"} : 
                                                                                    [...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                                    desc.changePerc < 0 ? {"color": "var(--primary-red-09)"} : {"color": "rgba(0, 0, 0, 0)"}
                                                                                }
                                                                            />
                                                                        </div>
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <div className="large-homePageBarWatchlistSymbolImgLoading"/> :
                                                                            <img src={desc.profileImage} alt="" className="large-homePageBarWatchlistSymbolImg" />
                                                                        }
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistSymbolDescACT">
                                                                                <div className="large-homePageBarWatchlistSymbolDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistSymbolDescACTSecondary">{desc.symbol}</span>
                                                                        }
                                                                    </div>
                                                                    <div className="large-homePageBarWatchlistFiguresLine">
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistFiguresDescACTSecondary">${generalOpx.formatFigures.format(desc.close)}</span>
                                                                        }
                                                                    </div>
                                                                    <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                                    style={desc.changePerc >= 0 ? 
                                                                                        {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                                    }
                                                                                >
                                                                                ${generalOpx.formatFigures.format(Math.abs(desc.change))}
                                                                            </span>
                                                                        }
                                                                    </div>
                                                                    <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                                    style={desc.changePerc >= 0 ? 
                                                                                        {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                                    }
                                                                                >
                                                                                
                                                                                {generalOpx.formatFigures.format(Math.abs(desc.changePerc * 100))}%
                                                                            </span>
                                                                        }
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                    </> : null
                                                }
                                            </>
                                        }
                                        <div className="large-homepageBarWatchlistSeperationLine">
                                            <span className="large-homePageBarWatchlistSeperationLineDesc">Crypto Market</span>
                                        </div>
                                        {homePageWatchlist["watchlist"]["loading"] ?
                                            <>
                                            {Array(4).fill(0).map((desc, desc_index) => (
                                                    <div className="large-homePageBarWatchlistLine" key={`cryptoMarket-watchlist-${desc_index}`}>
                                                        <div className="large-homePageBarWatchlistSymbolLine">
                                                            <div className="large-homePageBarWatchlistContainerIconContainer">
                                                                <Bookmark className="large-homePageBarWatchlistContainerIcon" 
                                                                    style={{"color": "rgba(0, 0, 0, 0)"}}
                                                                />
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSymbolImgLoading"/>
                                                            <span className="large-homePageBarWatchlistSymbolDescACT">
                                                                <div className="large-homePageBarWatchlistSymbolDescACTLoading"/>
                                                            </span>
                                                        </div>
                                                        <div className="large-homePageBarWatchlistFiguresLine">
                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                <div className="large-homePageBarWatchlistFiguresDescACTPrimaryLoading"/>
                                                            </span>
                                                        </div>
                                                        <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                            </span>
                                                        </div>
                                                        <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                            </> : 
                                            <>
                                                {homePageWatchlist["watchlist"]["cryptoMarket"].length > 0 ?
                                                    <>
                                                        {homePageWatchlist["watchlist"]["cryptoMarket"].map((desc, desc_index) => (
                                                                <div className="large-homePageBarWatchlistLine" 
                                                                        key={`${desc.type}:-${desc.symbol}`}
                                                                        style={desc_index == 2 ? {"transform": "translateX(0%)"} : {}}
                                                                    >
                                                                    <div className="large-homePageBarWatchlistSymbolLine">
                                                                        <div className="large-homePageBarWatchlistContainerIconContainer">
                                                                            <Bookmark className="large-homePageBarWatchlistContainerIcon" 
                                                                                style={[...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                                    desc.changePerc >= 0 ? {"color": "var(--primary-green-09)"} : 
                                                                                    [...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                                    desc.changePerc < 0 ? {"color": "var(--primary-red-09)"} : {"color": "rgba(0, 0, 0, 0)"}
                                                                                }
                                                                            />
                                                                        </div>
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <div className="large-homePageBarWatchlistSymbolImgLoading"/> :
                                                                            <img src={desc.profileImage} alt="" 
                                                                                className="large-homePageBarWatchlistSymbolImg" 
                                                                                style={desc.symbol === "FINUX" ? {transform: "scale(1.5)"} : {}}
                                                                            />
                                                                        }
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistSymbolDescACT">
                                                                                <div className="large-homePageBarWatchlistSymbolDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistSymbolDescACTSecondary">{desc.symbol}</span>
                                                                        }
                                                                    </div>
                                                                    <div className="large-homePageBarWatchlistFiguresLine">
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistFiguresDescACTSecondary">${generalOpx.formatFiguresCrypto.format(desc.close)}</span>
                                                                        }
                                                                    </div>
                                                                    <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                                    style={desc.changePerc >= 0 ? 
                                                                                        {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                                    }
                                                                                >
                                                                                ${generalOpx.formatLargeFigures(Math.abs(desc.change), 2)}
                                                                            </span>
                                                                        }
                                                                    </div>
                                                                    <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                                    style={desc.changePerc >= 0 ? 
                                                                                        {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                                    }
                                                                                >
                                                                                {generalOpx.formatFigures.format(Math.abs(desc.changePerc * 100))}%
                                                                            </span>
                                                                        }
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                    </> : null
                                                }
                                            </>
                                        }
                                        {u_watchlist.length !== 0 ?
                                            <div className="large-homepageBarWatchlistSeperationLine">
                                                <span className="large-homePageBarWatchlistSeperationLineDesc">Your Watchlist</span>
                                            </div> : null
                                        }
                                        {homePageWatchlist["watchlist"]["watching"].length > 0 ?
                                            <>
                                                {homePageWatchlist["watchlist"]["watching"].map((desc) => (
                                                        <div className="large-homePageBarWatchlistLine" key={`${desc.type}:-${desc.symbol}`}>
                                                            <div className="large-homePageBarWatchlistSymbolLine">
                                                                <div className="large-homePageBarWatchlistContainerIconContainer">
                                                                    <Bookmark className="large-homePageBarWatchlistContainerIcon" 
                                                                        style={[...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                            desc.changePerc >= 0 ? {"color": "var(--primary-green-09)"} : 
                                                                            [...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                            desc.changePerc < 0 ? {"color": "var(--primary-red-09)"} : {"color": "rgba(0, 0, 0, 0)"}
                                                                        }
                                                                    />
                                                                </div>
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <div className="large-homePageBarWatchlistSymbolImgLoading"/> :
                                                                    <img src={desc.profileImage} alt="" 
                                                                        className="large-homePageBarWatchlistSymbolImg" 
                                                                        style={desc.symbol === "FINUX" ? {transform: "scale(1.5)"} : {}}
                                                                    />
                                                                }
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistSymbolDescACT">
                                                                        <div className="large-homePageBarWatchlistSymbolDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistSymbolDescACTSecondary">{desc.symbol}</span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary">${generalOpx.formatFiguresCrypto.format(desc.close)}</span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                            style={desc.changePerc >= 0 ? 
                                                                                {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                            }
                                                                        >
                                                                        ${generalOpx.formatLargeFigures(Math.abs(desc.change), 2)}
                                                                    </span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                            style={desc.changePerc >= 0 ? 
                                                                                {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                            }
                                                                        >
                                                                        {generalOpx.formatFigures.format(Math.abs(desc.changePerc * 100))}%
                                                                    </span>
                                                                }
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </> : null
                                        }
                                        {!homePageWatchlist["watchlist"]["loading"] ?
                                            <div className="large-homepageBarWatchlistSeperationLine">
                                                <span className="large-homePageBarWatchlistSeperationLineDesc">More Stocks</span>
                                            </div> : null
                                        }
                                        {homePageWatchlist["watchlist"]["stocks"].length > 0 ?
                                            <>
                                                {homePageWatchlist["watchlist"]["stocks"].map((desc) => (
                                                        <div className="large-homePageBarWatchlistLine" key={`${desc.type}:-${desc.symbol}`}>
                                                            <div className="large-homePageBarWatchlistSymbolLine">
                                                                <div className="large-homePageBarWatchlistContainerIconContainer">
                                                                    <Bookmark className="large-homePageBarWatchlistContainerIcon" 
                                                                        style={[...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                            desc.changePerc >= 0 ? {"color": "var(--primary-green-09)"} : 
                                                                            [...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                            desc.changePerc < 0 ? {"color": "var(--primary-red-09)"} : {"color": "rgba(0, 0, 0, 0)"}
                                                                        }
                                                                    />
                                                                </div>
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <div className="large-homePageBarWatchlistSymbolImgLoading"/> :
                                                                    <img src={desc.profileImage} alt="" 
                                                                        className="large-homePageBarWatchlistSymbolImg" 
                                                                        style={desc.symbol === "FINUX" ? {transform: "scale(1.5)"} : {}}
                                                                    />
                                                                }
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistSymbolDescACT">
                                                                        <div className="large-homePageBarWatchlistSymbolDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistSymbolDescACTSecondary">{desc.symbol}</span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary">${generalOpx.formatFiguresCrypto.format(desc.close)}</span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                            style={desc.changePerc >= 0 ? 
                                                                                {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                            }
                                                                        >
                                                                        ${generalOpx.formatLargeFigures(Math.abs(desc.change), 2)}
                                                                    </span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                            style={desc.changePerc >= 0 ? 
                                                                                {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                            }
                                                                        >
                                                                        {generalOpx.formatFigures.format(Math.abs(desc.changePerc * 100))}%
                                                                    </span>
                                                                }
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </> : null
                                        }
                                        {!homePageWatchlist["watchlist"]["loading"] ?
                                            <div className="large-homepageBarWatchlistSeperationLine">
                                                <span className="large-homePageBarWatchlistSeperationLineDesc">More Cryptos</span>
                                            </div> : null
                                        }
                                        {homePageWatchlist["watchlist"]["cryptos"].length > 0 ?
                                            <>
                                                {homePageWatchlist["watchlist"]["cryptos"].map((desc, index) => (
                                                        <div className="large-homePageBarWatchlistLine" 
                                                                key={`${desc.type}:-${desc.symbol}`}
                                                                style={index === homePageWatchlist["watchlist"]["cryptos"].length - 1 ? {"borderBottom": "none"} : {}}
                                                            >
                                                            <div className="large-homePageBarWatchlistSymbolLine">
                                                                <div className="large-homePageBarWatchlistContainerIconContainer">
                                                                    <Bookmark className="large-homePageBarWatchlistContainerIcon" 
                                                                        style={[...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                            desc.changePerc >= 0 ? {"color": "var(--primary-green-09)"} : 
                                                                            [...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                            desc.changePerc < 0 ? {"color": "var(--primary-red-09)"} : {"color": "rgba(0, 0, 0, 0)"}
                                                                        }
                                                                    />
                                                                </div>
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <div className="large-homePageBarWatchlistSymbolImgLoading"/> :
                                                                    <img src={desc.profileImage} alt="" 
                                                                        className="large-homePageBarWatchlistSymbolImg" 
                                                                        style={desc.symbol === "FINUX" ? {transform: "scale(1.5)"} : {}}
                                                                    />
                                                                }
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistSymbolDescACT">
                                                                        <div className="large-homePageBarWatchlistSymbolDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistSymbolDescACTSecondary">{desc.symbol}</span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary">${generalOpx.formatFiguresCrypto.format(desc.close)}</span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                            style={desc.changePerc >= 0 ? 
                                                                                {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                            }
                                                                        >
                                                                        ${generalOpx.formatLargeFigures(Math.abs(desc.change), 2)}
                                                                    </span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                            style={desc.changePerc >= 0 ? 
                                                                                {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                            }
                                                                        >
                                                                        {generalOpx.formatFigures.format(Math.abs(desc.changePerc * 100))}%
                                                                    </span>
                                                                }
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </> : null
                                        }
                                    </>
                                }
                            </div>
                            <div className="small-leftBarPaddingBottom" style={{"height": "85px", "minHeight": "85px", "maxHeight": "85px"}}/>
                        </div>
                    </div>
                    <div className="small-homePageLeftSideWrapperSupport"
                        style={sm_viewRightbarWidth === 0 ? {"display": "none"} : {"display": "flex"}}
                    />
                    {width >= 670 && width < 933 ?
                        <div className="medium-homePageRightNonAwkNavWrapper">
                            <button className="small-homeCOntentHeaderLeftImgBtn"
                                    ref={rsb_overlayContainerRef}
                                    style={{"margin": "auto"}}
                                    onClick={() => setSm_viewRightbarWidthToggle()}
                                >
                                <div className="finulab-smViewWatchlistContainer"
                                        style={{"marginTop": "5px", "marginRight": "10px", "borderRadius": "50%"}}
                                    >
                                    <ReadMore style={{"transform": "scale(2)", "color": `var(--primary-bg-01)`}}/>
                                </div>
                            </button>
                        </div> : null
                    }
                </> : 
                <div className="small-homePageRightSideWrapper"
                        style={
                            {
                                "position": "fixed",
                                "top": `${0}px`,
                                "width": `${330}px`, 
                                "minWidth": `${330}px`, 
                                "maxWidth": `${330}px`, 
                                "borderLeft": `solid 1px var(--primary-bg-08)`
                            }
                        }
                    >
                    <div className="large-homePageRightBarBody">
                        {user ?
                            <div className="large-homePageRightBarUserDescContainer">
                                <button className="large-homePageRightBarImgBtn"
                                        onClick={u_notifications["unread"]["data"].length === 0 ?
                                            () => {navigate(`/profile/${user.user}`)} : () => {navigate(`/profile/${user.user}/notifications`)}
                                        }
                                    >
                                    {user.profilePicture === "" ?
                                        <div className="finulab-noProfileImagePlaceHolderImgRep"
                                                style={{...generalOpx.profilePictureGradients[`${user.user}`.length % 5], "marginTop": "5px", "marginLeft": "10px"}}
                                            >
                                            <BlurOn style={{"transform": "scale(1.5)", "color": `var(--primary-bg-${`${user.user}`.length % 5 === 0 ? `01` : `10`})`}}/>
                                        </div> : 
                                        <img src={user.profilePicture} alt="" className="small-homePageLeftSideProfileImg"/>
                                    }
                                    {u_notifications["unread"]["data"].length > 0 ?
                                        <span className="small-homePageLeftSideCommunityNotifsCounter"
                                                style={{"position": "absolute", "margin": "0", "top": "0", "right": "-5px"}}
                                            >
                                            {u_notifications["unread"]["data"].length > 5 ?
                                                `5+` : `${u_notifications["unread"]["data"].length}`
                                            }
                                        </span> : null
                                    }
                                </button>
                                <div className="small-homePageLeftSideInnerWrapper">
                                    <div className="small-homePageLeftSideUserDescContainer">
                                        <button className="large-homePageRightBarImgBtn"
                                                onClick={u_notifications["unread"]["data"].length === 0 ?
                                                    () => {navigate(`/profile/${user.user}`)} : () => {navigate(`/profile/${user.user}/notifications`)}
                                                }
                                            >
                                            <span style={{"fontSize": "1.05rem"}}>{user.user}</span>
                                        </button>
                                        {user.verified ?
                                            <Verified className="small-homePageLeftSideUserDescIcon"/> : 
                                            <button className="large-walletAccountOvrlAccountGetVerifiedBtn"
                                                    onClick={() => navigate("/get-verified")}
                                                >
                                                <Verified className="large-walletAccountOvrlAccountGetVerifiedBtnIcon"/>
                                                Get Verified
                                            </button>
                                        }
                                    </div>
                                    <div className="small-homePageLeftSideUserDescContainer"
                                            style={{"marginTop": "10px"}}
                                        >
                                        <button className="large-homePageRightBarImgBtn"
                                                onClick={() => {navigate(`/wallet`)}}
                                            >
                                            <span style={{"fontWeight": "normal", "color": "var(--primary-bg-05)"}}>Balance:</span>&nbsp;
                                            {walletTotal[1] ? 
                                                <span className="small-homePageLeftSideUserWalletBalanceLoading"/> :
                                                <span>{generalOpx.formatFigures.format(walletTotal[0])} FINUX</span>
                                            }
                                        </button>
                                    </div>
                                    <div className="small-homePageLeftSideUserDescContainer"
                                            style={{"marginTop": "5px", "marginBottom": "24px"}}
                                        >
                                        <button className="large-homePageRightBarImgBtn"
                                                onClick={() => {navigate(`/profile/${user.user}/following`)}}
                                            >
                                            {u_quickDesc["desc"]["dataLoading"] ?
                                                <span className="small-homePageLeftSideUserWalletBalanceLoading"
                                                    style={{"width": "50px", "minWidth": "50px", "maxWidth": "50px"}}
                                                /> : 
                                                <span>{generalOpx.formatLargeFigures(u_quickDesc["desc"]["data"]["following"], 2)}</span>
                                            }&nbsp;
                                            <span style={{"fontWeight": "normal", "color": "var(--primary-bg-05)"}}>Following</span>
                                        </button>&nbsp;&nbsp;&nbsp;&nbsp;
                                        <button className="large-homePageRightBarImgBtn"
                                                onClick={() =>{ navigate(`/profile/${user.user}/followers`)}}
                                            >
                                            {u_quickDesc["desc"]["dataLoading"] ?
                                                <span className="small-homePageLeftSideUserWalletBalanceLoading"
                                                    style={{"width": "50px", "minWidth": "50px", "maxWidth": "50px"}}
                                                /> : 
                                                <span>{generalOpx.formatLargeFigures(u_quickDesc["desc"]["data"]["followers"], 2)}</span>
                                            }&nbsp;
                                            <span style={{"fontWeight": "normal", "color": "var(--primary-bg-05)"}}>Followers</span>
                                        </button>
                                    </div>
                                    <div className="large-homePageRighBarCreateOptnsContainer">
                                        <button className="large-homePageRightBarCreateBtn"
                                                onClick={() => navigate("/create-post")}
                                            >
                                            <SendSharp className="large-homePageRightBarCreateBtnIcon"/>
                                            Post
                                        </button>
                                        <button className="large-homePageRightBarCreateBtn"
                                                onClick={() => navigate("/create-community")}
                                            >
                                            <GroupAddSharp className="large-homePageRightBarCreateBtnIcon"/>
                                            Group
                                        </button>
                                        {user.verified ?
                                            <button className="large-homePageRightBarCreateBtn"
                                                    onClick={() => navigate("/create-prediction")}
                                                >
                                                <AssuredWorkloadSharp className="large-homePageRightBarCreateBtnIcon"/>
                                                Pair
                                            </button> : 
                                            <button className="large-homePageRightBarCreateBtn"
                                                    onClick={() => navigate("/market")}
                                                >
                                                <CandlestickChart className="large-homePageRightBarCreateBtnIcon"/>
                                                Trade
                                            </button>
                                        }
                                    </div>
                                    <div className="small-homePageLeftSideDivider" style={{"marginTop": "24px", "marginBottom": u_moderatorStatus.length > 0 ? "12px" : "0px"}}/>
                                    {u_moderatorStatus.length > 0 ?
                                        <>
                                            <div className="small-homePageLeftSideMyCommunitiesContainer">
                                                <div className="small-homePageLeftSideUserDescContainer">
                                                    My Communities
                                                    {u_moderatorStatus.length === 1 ? 
                                                        null : 
                                                        <div className="small-homePageLeftSideUserDescCommunitiesToggleContainer">
                                                            {communitiesQuickViewIndex === 0 ?
                                                                null : 
                                                                <button className="small-homePageLeftSideUserDescMyCommunitiesToggleBtn"
                                                                        onClick={() => communitiesQuickViewIndexToggle("back")}
                                                                    >
                                                                    <ChevronLeft className="small-homePageLeftSideUserDescMyCommunitiesToggleBtnIcon"/>
                                                                </button>
                                                            }
                                                            &nbsp;&nbsp;|&nbsp;&nbsp;
                                                            {communitiesQuickViewIndex === u_moderatorStatus.length - 1 ? 
                                                                null : 
                                                                <button className="small-homePageLeftSideUserDescMyCommunitiesToggleBtn"
                                                                        onClick={() => communitiesQuickViewIndexToggle("forward")}
                                                                    >
                                                                    <ChevronRight className="small-homePageLeftSideUserDescMyCommunitiesToggleBtnIcon"/>
                                                                </button>
                                                            }
                                                        </div>
                                                    }
                                                </div>
                                                <div className="small-homePageLeftSideMyCommunitiesInsideContainerWrapper">
                                                    <div className="small-homePageLeftSideMyCommunitiesInsideContainerInsideWrapper"
                                                            style={{"transform": `translateX(calc(${communitiesQuickViewIndex} * -100%))`}}
                                                        >
                                                        {u_moderatorStatus.map((comm_desc, index) => (
                                                                <div className="small-homePageLeftSideMyCommunitiesInsideContainer" key={`community-quick-view-${index}`}>
                                                                    <button className="large-homePageRightBarImgBtn"
                                                                        onClick={u_notifications["communities"]["dataLoading"] ?
                                                                            () => {navigate(`/profile/${comm_desc["community"]}`)} :
                                                                            u_notifications["communities"]["data"][comm_desc["community"]].length === 0 ?
                                                                            () => {navigate(`/profile/${comm_desc["community"]}`)} : () => {navigate(`/profile/${comm_desc["community"]}/notifications`)}
                                                                        }
                                                                    >
                                                                        {comm_desc["profileImage"]  === "" ?
                                                                            <div className="finulab-noProfileImagePlaceHolderImgRep"
                                                                                    style={{...generalOpx.profilePictureGradients[`${comm_desc["community"]}`.length % 5], "marginTop": "12px"}}
                                                                                >
                                                                                <BlurOn style={{"transform": "scale(1.5)", "color": `var(--primary-bg-${`${comm_desc["community"]}`.length % 5 === 0 ? `01` : `10`})`}}/>
                                                                            </div> :
                                                                            <img src={comm_desc["profileImage"]} alt="" className="small-homePageLeftSideCommunityImg"/>
                                                                        }
                                                                    </button>
                                                                    <div className="small-homePageLeftSideUserDescContainer" style={{"marginTop": "5px", "marginBottom": "12px"}}>
                                                                        <button className="large-homePageRightBarImgBtn"
                                                                                style={{"width": "100%", "minWidth": "100%", "maxWidth": "100%"}}
                                                                                onClick={u_notifications["communities"]["dataLoading"] ?
                                                                                    () => {navigate(`/profile/${comm_desc["community"]}`)} :
                                                                                    u_notifications["communities"]["data"][comm_desc["community"]].length === 0 ?
                                                                                    () => {navigate(`/profile/${comm_desc["community"]}`)} : () => {navigate(`/profile/${comm_desc["community"]}/notifications`)}
                                                                                }
                                                                            >
                                                                            <span className="small-homePageLeftSideCommunityNameDesc" style={{"fontWeight": "normal"}}>{comm_desc["community"]}</span>
                                                                            {u_notifications["communities"]["dataLoading"] ? 
                                                                                null : 
                                                                                <>
                                                                                    {u_notifications["communities"]["data"][comm_desc["community"]].length > 0 ?
                                                                                        <span className="small-homePageLeftSideCommunityNotifsCounter">
                                                                                            {u_notifications["communities"]["data"][comm_desc["community"]].length > 5 ?
                                                                                                `5+` : `${u_notifications["communities"]["data"][comm_desc["community"]].length}`
                                                                                            }
                                                                                        </span> : null
                                                                                    }
                                                                                </>
                                                                            }
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            </div> 
                                        </> : null
                                    }
                                </div>
                            </div> : null
                        }
                        <div className="large-homePageLeftBarInnerBodyElementsContainer"
                                style={!user ? 
                                    {"height": "100%", "minHeight": "100%", "maxHeight": "100%"} : 
                                    u_moderatorStatus.length > 0 ? 
                                    {"height": "calc(100% - 307px)", "minHeight": "calc(100% - 307px)", "maxHeight": "calc(100% - 307px)"}:
                                    {"height": "calc(100% - 190px)", "minHeight": "calc(100% - 190px)", "maxHeight": "calc(100% - 190px)"}
                                }
                            >
                            <div className="large-homePageLeftBarHeader"
                                    style={{
                                        "width": `${330}px`, "minWidth": `${330}px`, "maxWidth": `${330}px`,
                                        "borderTop": !user ? "none" : u_moderatorStatus.length > 0 ? "solid 1px var(--primary-bg-08)" : "none"
                                    }}
                                >
                                <div className="large-homePageLeftBarInnerHeader" 
                                        style={{
                                            "marginTop": "10px",
                                            "alignItems": "flex-start", "marginLeft": "10px", "height": "25px", "minHeight": "25px", "maxHeight": "25px"
                                        }}
                                    >
                                    Watchlist
                                </div>
                                <div className="large-homePageBarWatchlistLine" >
                                    <div className="large-homePageBarWatchlistSymbolLine">
                                        <div className="large-homePageBarWatchlistContainerIconContainer">
                                            <Bookmark className="large-homePageBarWatchlistContainerIcon"/>
                                        </div>
                                        <span className="large-homePageBarWatchlistSymbolDesc">Symbol</span>
                                    </div>
                                    <div className="large-homePageBarWatchlistFiguresLine">
                                        <span className="large-homePageBarWatchlistFiguresDesc">Last</span>
                                    </div>
                                    <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                        <span className="large-homePageBarWatchlistFiguresDesc">Chg-$</span>
                                    </div>
                                    <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                        <span className="large-homePageBarWatchlistFiguresDesc">Chg-%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="large-homePageLeftBarHeaderUnderLayer" style={{"height": "72px", "minHeight": "72px", "maxHeight": "72px"}}/>
                            <div className="large-homePageBarWatchlistContainer">
                                {watchlistSearch ?
                                    <>
                                        {watchlistStocksQuery.length === 0 ?
                                            null : 
                                            <>
                                                <div className="large-homePageSearchResultsSectionHeader">Stocks</div>
                                                {watchlistStocksQuery.map((desc, index) => (
                                                        <div className="large-homePageSearchResultsInnerDescContainer" key={`stock-search-rslt-${index}`}>
                                                            <div className="large-homePageSearchResultsInnerDescInsideContainer">
                                                                <img src={desc.profileImage} alt="" className="large-homePageMainNavigationAccountImg" />
                                                                <div className="large-homePageSearchResultsTickerText">
                                                                    <span className="large-homepageMainNavigationSrchrsultDescBlock">{desc.symbol}</span>
                                                                </div>
                                                                <div className="large-homePageSearchResultsNameText">
                                                                    <span className="large-homepageMainNavigationSrchrsultDescBlock">
                                                                        {(desc.alphaVantageName.length < desc.polygonIoName.length) && desc.alphaVantageName !== "" ?
                                                                            `${desc.alphaVantageName}` : `${desc.polygonIoName}`
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </>
                                        }
                                        {watchlistCryptosQuery.length === 0 ?
                                            null : 
                                            <>
                                                <div className="large-homePageSearchResultsSectionHeader">Cryptos</div>
                                                {watchlistCryptosQuery.map((desc, index) => (
                                                        <div className="large-homePageSearchResultsInnerDescContainer" key={`crypto-search-rslt-${index}`}>
                                                            <div className="large-homePageSearchResultsInnerDescInsideContainer">
                                                                <img src={desc.profileImage} alt="" className="large-homePageMainNavigationAccountImg" />
                                                                <div className="large-homePageSearchResultsTickerText">
                                                                    <span className="large-homepageMainNavigationSrchrsultDescBlock">{desc.symbol}</span>
                                                                </div>
                                                                <div className="large-homePageSearchResultsNameText">
                                                                    <span className="large-homepageMainNavigationSrchrsultDescBlock">{desc.name}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </>
                                        }
                                    </> : 
                                    <>
                                        <div className="large-homepageBarWatchlistSeperationLine" style={{"marginTop": "5px"}}>
                                            <span className="large-homePageBarWatchlistSeperationLineDesc">Stock Market</span>
                                        </div>
                                        {homePageWatchlist["watchlist"]["loading"] ?
                                            <>
                                                {Array(4).fill(0).map((desc, desc_index) => (
                                                        <div className="large-homePageBarWatchlistLine" key={`stockMarket-watchlist-${desc_index}`}>
                                                            <div className="large-homePageBarWatchlistSymbolLine">
                                                                <div className="large-homePageBarWatchlistContainerIconContainer">
                                                                    <Bookmark className="large-homePageBarWatchlistContainerIcon" 
                                                                        style={{"color": "rgba(0, 0, 0, 0)"}}
                                                                    />
                                                                </div>
                                                                <div className="large-homePageBarWatchlistSymbolImgLoading"/>
                                                                <span className="large-homePageBarWatchlistSymbolDescACT">
                                                                    <div className="large-homePageBarWatchlistSymbolDescACTLoading"/>
                                                                </span>
                                                            </div>
                                                            <div className="large-homePageBarWatchlistFiguresLine">
                                                                <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                    <div className="large-homePageBarWatchlistFiguresDescACTPrimaryLoading"/>
                                                                </span>
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                    <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                </span>
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                    <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </> : 
                                            <>
                                                {homePageWatchlist["watchlist"]["stockMarket"].length > 0  ?
                                                    <>
                                                        {homePageWatchlist["watchlist"]["stockMarket"].map((desc, desc_index) => (
                                                                <div className="large-homePageBarWatchlistLine" 
                                                                        key={`${desc.type}:-${desc.symbol}`}
                                                                    >
                                                                    <div className="large-homePageBarWatchlistSymbolLine">
                                                                        <div className="large-homePageBarWatchlistContainerIconContainer">
                                                                            <Bookmark className="large-homePageBarWatchlistContainerIcon" 
                                                                                style={[...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                                    desc.changePerc >= 0 ? {"color": "var(--primary-green-09)"} : 
                                                                                    [...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                                    desc.changePerc < 0 ? {"color": "var(--primary-red-09)"} : {"color": "rgba(0, 0, 0, 0)"}
                                                                                }
                                                                            />
                                                                        </div>
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <div className="large-homePageBarWatchlistSymbolImgLoading"/> :
                                                                            <img src={desc.profileImage} alt="" className="large-homePageBarWatchlistSymbolImg" />
                                                                        }
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistSymbolDescACT">
                                                                                <div className="large-homePageBarWatchlistSymbolDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistSymbolDescACTSecondary">{desc.symbol}</span>
                                                                        }
                                                                    </div>
                                                                    <div className="large-homePageBarWatchlistFiguresLine">
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistFiguresDescACTSecondary">${generalOpx.formatFigures.format(desc.close)}</span>
                                                                        }
                                                                    </div>
                                                                    <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                                    style={desc.changePerc >= 0 ? 
                                                                                        {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                                    }
                                                                                >
                                                                                ${generalOpx.formatFigures.format(Math.abs(desc.change))}
                                                                            </span>
                                                                        }
                                                                    </div>
                                                                    <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                                    style={desc.changePerc >= 0 ? 
                                                                                        {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                                    }
                                                                                >
                                                                                
                                                                                {generalOpx.formatFigures.format(Math.abs(desc.changePerc * 100))}%
                                                                            </span>
                                                                        }
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                    </> : null
                                                }
                                            </>
                                        }
                                        <div className="large-homepageBarWatchlistSeperationLine">
                                            <span className="large-homePageBarWatchlistSeperationLineDesc">Crypto Market</span>
                                        </div>
                                        {homePageWatchlist["watchlist"]["loading"] ?
                                            <>
                                            {Array(4).fill(0).map((desc, desc_index) => (
                                                    <div className="large-homePageBarWatchlistLine" key={`cryptoMarket-watchlist-${desc_index}`}>
                                                        <div className="large-homePageBarWatchlistSymbolLine">
                                                            <div className="large-homePageBarWatchlistContainerIconContainer">
                                                                <Bookmark className="large-homePageBarWatchlistContainerIcon" 
                                                                    style={{"color": "rgba(0, 0, 0, 0)"}}
                                                                />
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSymbolImgLoading"/>
                                                            <span className="large-homePageBarWatchlistSymbolDescACT">
                                                                <div className="large-homePageBarWatchlistSymbolDescACTLoading"/>
                                                            </span>
                                                        </div>
                                                        <div className="large-homePageBarWatchlistFiguresLine">
                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                <div className="large-homePageBarWatchlistFiguresDescACTPrimaryLoading"/>
                                                            </span>
                                                        </div>
                                                        <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                            </span>
                                                        </div>
                                                        <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                            </> : 
                                            <>
                                                {homePageWatchlist["watchlist"]["cryptoMarket"].length > 0 ?
                                                    <>
                                                        {homePageWatchlist["watchlist"]["cryptoMarket"].map((desc, desc_index) => (
                                                                <div className="large-homePageBarWatchlistLine" 
                                                                        key={`${desc.type}:-${desc.symbol}`}
                                                                        style={desc_index == 2 ? {"transform": "translateX(0%)"} : {}}
                                                                    >
                                                                    <div className="large-homePageBarWatchlistSymbolLine">
                                                                        <div className="large-homePageBarWatchlistContainerIconContainer">
                                                                            <Bookmark className="large-homePageBarWatchlistContainerIcon" 
                                                                                style={[...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                                    desc.changePerc >= 0 ? {"color": "var(--primary-green-09)"} : 
                                                                                    [...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                                    desc.changePerc < 0 ? {"color": "var(--primary-red-09)"} : {"color": "rgba(0, 0, 0, 0)"}
                                                                                }
                                                                            />
                                                                        </div>
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <div className="large-homePageBarWatchlistSymbolImgLoading"/> :
                                                                            <img src={desc.profileImage} alt="" 
                                                                                className="large-homePageBarWatchlistSymbolImg" 
                                                                                style={desc.symbol === "FINUX" ? {transform: "scale(1.5)"} : {}}
                                                                            />
                                                                        }
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistSymbolDescACT">
                                                                                <div className="large-homePageBarWatchlistSymbolDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistSymbolDescACTSecondary">{desc.symbol}</span>
                                                                        }
                                                                    </div>
                                                                    <div className="large-homePageBarWatchlistFiguresLine">
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistFiguresDescACTSecondary">${generalOpx.formatFiguresCrypto.format(desc.close)}</span>
                                                                        }
                                                                    </div>
                                                                    <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                                    style={desc.changePerc >= 0 ? 
                                                                                        {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                                    }
                                                                                >
                                                                                ${generalOpx.formatLargeFigures(Math.abs(desc.change), 2)}
                                                                            </span>
                                                                        }
                                                                    </div>
                                                                    <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                        {homePageWatchlist["watchlist"]["loading"] ?
                                                                            <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                                <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                            </span> :
                                                                            <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                                    style={desc.changePerc >= 0 ? 
                                                                                        {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                                    }
                                                                                >
                                                                                {generalOpx.formatFigures.format(Math.abs(desc.changePerc * 100))}%
                                                                            </span>
                                                                        }
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                    </> : null
                                                }
                                            </>
                                        }
                                        {u_watchlist.length !== 0 ?
                                            <div className="large-homepageBarWatchlistSeperationLine">
                                                <span className="large-homePageBarWatchlistSeperationLineDesc">Your Watchlist</span>
                                            </div> : null
                                        }
                                        {homePageWatchlist["watchlist"]["watching"].length > 0 ?
                                            <>
                                                {homePageWatchlist["watchlist"]["watching"].map((desc) => (
                                                        <div className="large-homePageBarWatchlistLine" key={`${desc.type}:-${desc.symbol}`}>
                                                            <div className="large-homePageBarWatchlistSymbolLine">
                                                                <div className="large-homePageBarWatchlistContainerIconContainer">
                                                                    <Bookmark className="large-homePageBarWatchlistContainerIcon" 
                                                                        style={[...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                            desc.changePerc >= 0 ? {"color": "var(--primary-green-09)"} : 
                                                                            [...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                            desc.changePerc < 0 ? {"color": "var(--primary-red-09)"} : {"color": "rgba(0, 0, 0, 0)"}
                                                                        }
                                                                    />
                                                                </div>
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <div className="large-homePageBarWatchlistSymbolImgLoading"/> :
                                                                    <img src={desc.profileImage} alt="" 
                                                                        className="large-homePageBarWatchlistSymbolImg" 
                                                                        style={desc.symbol === "FINUX" ? {transform: "scale(1.5)"} : {}}
                                                                    />
                                                                }
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistSymbolDescACT">
                                                                        <div className="large-homePageBarWatchlistSymbolDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistSymbolDescACTSecondary">{desc.symbol}</span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary">${generalOpx.formatFiguresCrypto.format(desc.close)}</span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                            style={desc.changePerc >= 0 ? 
                                                                                {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                            }
                                                                        >
                                                                        ${generalOpx.formatLargeFigures(Math.abs(desc.change), 2)}
                                                                    </span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                            style={desc.changePerc >= 0 ? 
                                                                                {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                            }
                                                                        >
                                                                        {generalOpx.formatFigures.format(Math.abs(desc.changePerc * 100))}%
                                                                    </span>
                                                                }
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </> : null
                                        }
                                        {!homePageWatchlist["watchlist"]["loading"] ?
                                            <div className="large-homepageBarWatchlistSeperationLine">
                                                <span className="large-homePageBarWatchlistSeperationLineDesc">More Stocks</span>
                                            </div> : null
                                        }
                                        {homePageWatchlist["watchlist"]["stocks"].length > 0 ?
                                            <>
                                                {homePageWatchlist["watchlist"]["stocks"].map((desc) => (
                                                        <div className="large-homePageBarWatchlistLine" key={`${desc.type}:-${desc.symbol}`}>
                                                            <div className="large-homePageBarWatchlistSymbolLine">
                                                                <div className="large-homePageBarWatchlistContainerIconContainer">
                                                                    <Bookmark className="large-homePageBarWatchlistContainerIcon" 
                                                                        style={[...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                            desc.changePerc >= 0 ? {"color": "var(--primary-green-09)"} : 
                                                                            [...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                            desc.changePerc < 0 ? {"color": "var(--primary-red-09)"} : {"color": "rgba(0, 0, 0, 0)"}
                                                                        }
                                                                    />
                                                                </div>
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <div className="large-homePageBarWatchlistSymbolImgLoading"/> :
                                                                    <img src={desc.profileImage} alt="" 
                                                                        className="large-homePageBarWatchlistSymbolImg" 
                                                                        style={desc.symbol === "FINUX" ? {transform: "scale(1.5)"} : {}}
                                                                    />
                                                                }
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistSymbolDescACT">
                                                                        <div className="large-homePageBarWatchlistSymbolDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistSymbolDescACTSecondary">{desc.symbol}</span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary">${generalOpx.formatFiguresCrypto.format(desc.close)}</span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                            style={desc.changePerc >= 0 ? 
                                                                                {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                            }
                                                                        >
                                                                        ${generalOpx.formatLargeFigures(Math.abs(desc.change), 2)}
                                                                    </span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                            style={desc.changePerc >= 0 ? 
                                                                                {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                            }
                                                                        >
                                                                        {generalOpx.formatFigures.format(Math.abs(desc.changePerc * 100))}%
                                                                    </span>
                                                                }
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </> : null
                                        }
                                        {!homePageWatchlist["watchlist"]["loading"] ?
                                            <div className="large-homepageBarWatchlistSeperationLine">
                                                <span className="large-homePageBarWatchlistSeperationLineDesc">More Cryptos</span>
                                            </div> : null
                                        }
                                        {homePageWatchlist["watchlist"]["cryptos"].length > 0 ?
                                            <>
                                                {homePageWatchlist["watchlist"]["cryptos"].map((desc, index) => (
                                                        <div className="large-homePageBarWatchlistLine" 
                                                                key={`${desc.type}:-${desc.symbol}`}
                                                                style={index === homePageWatchlist["watchlist"]["cryptos"].length - 1 ? {"borderBottom": "none"} : {}}
                                                            >
                                                            <div className="large-homePageBarWatchlistSymbolLine">
                                                                <div className="large-homePageBarWatchlistContainerIconContainer">
                                                                    <Bookmark className="large-homePageBarWatchlistContainerIcon" 
                                                                        style={[...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                            desc.changePerc >= 0 ? {"color": "var(--primary-green-09)"} : 
                                                                            [...u_watchlist].includes(`${desc.type}:-${desc.symbol}`) &&
                                                                            desc.changePerc < 0 ? {"color": "var(--primary-red-09)"} : {"color": "rgba(0, 0, 0, 0)"}
                                                                        }
                                                                    />
                                                                </div>
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <div className="large-homePageBarWatchlistSymbolImgLoading"/> :
                                                                    <img src={desc.profileImage} alt="" 
                                                                        className="large-homePageBarWatchlistSymbolImg" 
                                                                        style={desc.symbol === "FINUX" ? {transform: "scale(1.5)"} : {}}
                                                                    />
                                                                }
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistSymbolDescACT">
                                                                        <div className="large-homePageBarWatchlistSymbolDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistSymbolDescACTSecondary">{desc.symbol}</span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary">${generalOpx.formatFiguresCrypto.format(desc.close)}</span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                            style={desc.changePerc >= 0 ? 
                                                                                {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                            }
                                                                        >
                                                                        ${generalOpx.formatLargeFigures(Math.abs(desc.change), 2)}
                                                                    </span>
                                                                }
                                                            </div>
                                                            <div className="large-homePageBarWatchlistSecondaryFiguresLine">
                                                                {homePageWatchlist["watchlist"]["loading"] ?
                                                                    <span className="large-homePageBarWatchlistFiguresDescACT">
                                                                        <div className="large-homePageBarWatchlistFiguresDescACTLoading"/>
                                                                    </span> :
                                                                    <span className="large-homePageBarWatchlistFiguresDescACTSecondary"
                                                                            style={desc.changePerc >= 0 ? 
                                                                                {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                                                            }
                                                                        >
                                                                        {generalOpx.formatFigures.format(Math.abs(desc.changePerc * 100))}%
                                                                    </span>
                                                                }
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </> : null
                                        }
                                    </>
                                }
                            </div>
                        </div>

                    </div>
                </div>
            }
        </div>
    )
}