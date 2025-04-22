import {useNavigate} from 'react-router-dom';
import {AssuredWorkload, Tsunami} from '@mui/icons-material';
import {useDispatch, useSelector} from 'react-redux';
import {useRef, useState, useMemo, useLayoutEffect, useEffect, useCallback} from 'react';

import generalOpx from '../../../../functions/generalFunctions';
import Prediction from '../../../../components/prediction/prediction';
import MiniaturizedPrediction from '../../../../components/miniaturized/prediction/mini-prediction';

import {selectUser} from '../../../../reduxStore/user';
import {selectInterests} from '../../../../reduxStore/interests';
import {setMarketConfig, selectMarketConfig} from '../../../../reduxStore/marketConfig';
import {setMarketHoldings, addToMarketHoldings, selectMarketHoldings} from '../../../../reduxStore/marketHoldings';
import {updateMarketPageInformationState, selectPageInformationState} from '../../../../reduxStore/pageInformation';
import {setPredictionEngagement, addToPredictionEngagement, selectPredictionEngagement} from '../../../../reduxStore/predictionEngagement';
import {updateQuery, setCategories, setSelectedView, setSelected, setDisplayData, setDataBank, selectMarketData} from '../../../../reduxStore/marketData';

const authorizedReviewers = ["tesemma.fin-us", "Rollwithdawinners", "Yanniyoh"];

export default function InnerMarketPage(props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const appState = useSelector(selectPageInformationState);
    
    const user = useSelector(selectUser);
    const u_interests = useSelector(selectInterests);
    const marketState = useSelector(selectMarketData);
    const marketConfig = useSelector(selectMarketConfig);
    const u_marketHoldings = useSelector(selectMarketHoldings);
    const u_predictionEngagement = useSelector(selectPredictionEngagement);
    //console.log(u_marketHoldings);
    const contentBodyRef = useRef();
    const [visibleContentCount, setVisibleContentCount] = useState(0);
    const [contentBodyWidth, setContentBodyWidth] = useState([0, false]);
    useLayoutEffect(() => {
        const contentBodyWidthFunction = () => {
            if(contentBodyRef.current) {
                const bodyWidth = contentBodyRef.current.getBoundingClientRect().width;
                setContentBodyWidth([bodyWidth, true]);

                const visibleContentCountFunction = Math.floor((contentBodyRef.current.clientHeight - 51) / 216);
                setVisibleContentCount(visibleContentCountFunction);
            }
        }

        window.addEventListener('resize', contentBodyWidthFunction);
        contentBodyWidthFunction();
        return () => window.removeEventListener('resize', contentBodyWidthFunction);
    }, []);

    const handleScrollMarketPage = (e) => {
        let marketPageInformation = {...appState["market"]};
        if(e.target.scrollTop - marketPageInformation["scrollTop"] >= 100) {
            if(marketPageInformation["visible"]) {
                marketPageInformation["visible"] = false;
                marketPageInformation["scrollTop"] = e.target.scrollTop;
            } else {
                marketPageInformation["scrollTop"] = e.target.scrollTop;
            }
        } else {
            if(marketPageInformation["scrollTop"] - e.target.scrollTop >= 50) {
                if(!marketPageInformation["visible"]) {
                    marketPageInformation["visible"] = true;
                    marketPageInformation["scrollTop"] = e.target.scrollTop;
                } else {
                    marketPageInformation["scrollTop"] = e.target.scrollTop;
                }
            }
        }

        dispatch(
            updateMarketPageInformationState(marketPageInformation)
        );
    }

    useMemo(() => {
        const setUpMarketCategories = async () => {
            const marketCategories = await generalOpx.axiosInstance.put(`/market/categories`, {});
            if(marketCategories.data["status"] === "success") {
                let categories = [["For You", '/assets/Favicon.png']];
                if(user) {
                    if(authorizedReviewers.includes(user.user)) {
                        categories.push(
                            ["For Review", '/assets/Favicon.png']
                        );
                        categories.push(
                            ["For Resolution", '/assets/Favicon.png']
                        );
                    }
                }

                for(let i = 0; i < marketCategories.data["data"].length; i++) {
                    categories.push(
                        [marketCategories.data["data"][i]["desc"], marketCategories.data["data"][i]["profileImage"]]
                    );
                }

                dispatch(
                    setCategories(
                        {
                            "data": categories,
                            "dataLoading": false
                        }
                    )
                )
            }

            if(marketConfig["dataLoading"]) {
                const marketConfig_call = await generalOpx.axiosInstance.put(`/market/config`);
                if(marketConfig_call.data["status"] === "success") {
                    dispatch(
                        setMarketConfig(
                            {
                                "data": {...marketConfig_call.data["data"]},
                                "dataLoading": false
                            }
                        )
                    );
                }
            }
        }

        if(marketState["categories"]["data"].length === 0) {
            setUpMarketCategories();
        }
    }, []);

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

    const pullSpecificPrediction = async () => {
        await generalOpx.axiosInstance.put(`/market/prediction`, {"predictionId": props.predictionId}).then(
            async (response) => {
                if(response.data["status"] === "success") {
                    if(user && Object.keys(response.data["data"]).length > 0) {
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
                        setSelected(
                            {
                                "type": "Prediction",
                                "selectedDesc": {
                                    "prediction": response.data["data"],
                                    "markets": response.data["markets"]
                                }
                            }
                        )
                    );
                }
            }
        );
    }

    const [primaryCalledFor, setPrimaryCalledFor] = useState([]);
    const [homePageMarketsBeingUpdated, setHomePageMarketsBeingUpdated] = useState(false);
    const pullMarkets = async (type, selection, p_ninclude) => {
        if(visibleContentCount !== 0) {
            if(!marketState["categories"]["data"].some(cat_desc => cat_desc[0] === selection)) {navigate("/market");}
            
            if(!(type === "primary" && primaryCalledFor.includes(selection))) {
                if(type === "primary" || marketState["displayData"]["predictions"].length < marketState["displayData"]["liveCount"]) {
                    setPrimaryCalledFor((prev) => [...prev, selection]);
    
                    if(selection === "For You") {
                        const selectedInterests = interestAssesser(u_interests);
                        await generalOpx.axiosInstance.put(`/market/recommended`, 
                            {
                                "type": type,
                                "limit": visibleContentCount === 0 ? visibleContentCountActingWeird : visibleContentCount,
                                "p_ninclude": p_ninclude,
                                "interests": selectedInterests["interests"]
                            }
                        ).then(
                            async (response) => {
                                if(response.data["status"] === "success") {
                                    if(type === "primary") {
                                        if(user && response.data["data"].length > 0) {
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
        
                                        dispatch(
                                            setDisplayData(
                                                {
                                                    "category": selection,
                                                    "predictions": response.data["data"],
                                                    "data": response.data["markets"],
                                                    "liveCount": response.data["count"],
                                                    "dataLoading": false
                                                }
                                            )
                                        );
                                    } else if(type === "secondary") {
                                        if(user && response.data["data"].length > 0) {
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
        
                                        dispatch(
                                            setDisplayData(
                                                {
                                                    "category": selection,
                                                    "predictions": [...marketState["displayData"]["predictions"], ...response.data["data"]],
                                                    "data": [...marketState["displayData"]["data"], ...response.data["markets"]],
                                                    "liveCount": marketState["displayData"]["liveCount"],
                                                    "dataLoading": false
                                                }
                                            )
                                        );
                                    }
                                }
                            }
                        );
                    } else {
                        await generalOpx.axiosInstance.put(`/market/category-predictions`, 
                            {
                                "type": type,
                                "limit": visibleContentCount === 0 ? visibleContentCountActingWeird : visibleContentCount,
                                "p_ninclude": p_ninclude,
                                "category": selection
                            }
                        ).then(
                            async (response) => {
                                if(response.data["status"] === "success") {
                                    if(type === "primary") {
                                        if(user && response.data["data"].length > 0) {
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
        
                                        dispatch(
                                            setDisplayData(
                                                {
                                                    "category": selection,
                                                    "predictions": response.data["data"],
                                                    "data": response.data["markets"],
                                                    "liveCount": response.data["count"],
                                                    "dataLoading": false
                                                }
                                            )
                                        );
                                    } else if(type === "secondary") {
                                        if(user && response.data["data"].length > 0) {
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
        
                                        dispatch(
                                            setDisplayData(
                                                {
                                                    "category": selection,
                                                    "predictions": [...marketState["displayData"]["predictions"], ...response.data["data"]],
                                                    "data": [...marketState["displayData"]["data"], ...response.data["markets"]],
                                                    "liveCount": marketState["displayData"]["liveCount"],
                                                    "dataLoading": false
                                                }
                                            )
                                        );
                                    }
                                }
                            }
                        );
                    }
                }
            }
            
            setHomePageMarketsBeingUpdated(false);
        }
    }
    const marketObserverRef = useRef();
    const lastMarketElementRef = useCallback(node => 
        {
            if(homePageMarketsBeingUpdated) return;
            if(marketState["displayData"]["dataLoading"]) return;
            if(marketState["displayData"]["category"] !== marketState["selectedView"]) return;
            
            if(marketObserverRef.current) marketObserverRef.current.disconnect();
            marketObserverRef.current = new IntersectionObserver(entries => 
                {
                    if(entries[0].isIntersecting && 
                        marketState["displayData"]["predictions"].length !== 0 &&
                        marketState["displayData"]["predictions"].length < marketState["displayData"]["liveCount"]
                    ) {
                        setHomePageMarketsBeingUpdated(true);

                        let p_ninclude = []
                        for(let i = 0; i < marketState["displayData"]["predictions"].length; i++) {
                            p_ninclude.push(marketState["displayData"]["predictions"][i]["_id"]);
                        }
                        pullMarkets("secondary", marketState["selectedView"], p_ninclude);
                    }
                }
            );
            if(node) marketObserverRef.current.observe(node);
        }, [marketState["selectedView"], marketState["displayData"], homePageMarketsBeingUpdated]
    );
    
    useEffect(() => {
        if(!marketState["categories"]["dataLoading"]) {
            let marketView = "";
            if(props.displayView !== "prediction") {
                if(!(props.marketType === null || props.marketType === undefined)) {
                    if(props.marketType === "") {
                        marketView = "For You";
                        if(marketState["selectedView"] !== "For You") {
                            dispatch(
                                setSelectedView("For You")
                            );
                        }
                    } else {
                        if(marketState["categories"]["data"].some(cat_desc => cat_desc[0].toLowerCase().replace(/\s/g, '') === props.marketType)) {
                            const selectedViewArr = marketState["categories"]["data"].filter(cat_desc => cat_desc[0].toLowerCase().replace(/\s/g, '') === props.marketType)[0];
        
                            marketView = selectedViewArr[0];
                            if(marketState["selectedView"] !== selectedViewArr[0]) {
                                dispatch(
                                    setSelectedView(selectedViewArr[0])
                                );
                            }
                        } else {
                            const pathname = window.location.pathname;
                            if(pathname !== "/market") {navigate("/market");}
                        }
                    }
                }
            }

            if(props.displayView === "prediction") {
                if(!(props.predictionId === undefined || props.predictionId === null || props.predictionId === "")) {
                    if(marketState["selected"]["type"] !== "Prediction") {
                        pullSpecificPrediction();
                    } else if(marketState["selected"]["selectedDesc"]["prediction"]["_id"] !== props.predictionId) {
                        pullSpecificPrediction();
                    }
                }
            } else {
                if(marketView !== "") {
                    if(marketState["displayData"]["dataLoading"]) {
                        pullMarkets("primary", marketView, []);
                    } else if(marketState["displayData"]["category"] !== marketView) {
                        //add scrollTop
                        if(marketState["displayData"]["category"] !== "") {
                            let dataBankFunction = [...marketState["dataBank"]];
                            if(marketState["dataBank"].some(pbnk_elm => pbnk_elm["category"] === marketView)) {
                                const targetBankElement = marketState["dataBank"].filter(pbnk_elm => pbnk_elm["category"] === marketView)[0];
                                dispatch(
                                    setDisplayData(
                                        {
                                            "category": targetBankElement["category"],
                                            "predictions": targetBankElement["predictions"],
                                            "data": targetBankElement["data"],
                                            "liveCount": targetBankElement["liveCount"],
                                            "dataLoading": targetBankElement["dataLoading"]
                                        }
                                    )
                                );

                                dataBankFunction = [
                                    ...dataBankFunction.filter(bnk_elm => bnk_elm["category"] !== marketState["displayData"]["category"]),
                                    {...marketState["displayData"]}
                                ];
                                dispatch(
                                    setDataBank(dataBankFunction)
                                );
                            } else {
                                dataBankFunction = [
                                    ...marketState["dataBank"].filter(bnk_elm => bnk_elm["category"] !== marketState["displayData"]["category"]),
                                    {...marketState["displayData"]}
                                ];
                                dispatch(
                                    setDataBank(dataBankFunction)
                                );

                                dispatch(
                                    setDisplayData(
                                        {
                                            "category": marketView,
                                            "predictions": [],
                                            "data": [],
                                            "liveCount": 0,
                                            "dataLoading": true
                                        }
                                    )
                                );

                                pullMarkets("primary", marketView, []);
                            }
                        }
                    }
                }
            }
        }
    }, [marketState["categories"]["data"], visibleContentCount, props.marketType, props.displayView, props.predictionId]);

    const marketQueryController = useRef(new AbortController());
    const [marketQuery, setMarketQuery] = useState({"predictions": [], "data": []});
    const [marketQueryTracker, setMarketQueryTracker] = useState({"query": "", "completed": false});
    useEffect(() => {
        const runQuery = async () => {
            marketQueryController.current.abort();
            marketQueryController.current = new AbortController();
            try {
                const query_forMarket = await generalOpx.axiosInstance.put(`/market/search?q=${marketState["query"]}`, {}, {signal: marketQueryController.current.signal});

                if(query_forMarket.data["status"] === "success") {
                    setMarketQuery(
                        {
                            "predictions": query_forMarket.data["data"], 
                            "data": query_forMarket.data["markets"]
                        }
                    );
                    setMarketQueryTracker(
                        {
                            "query": marketState["query"], 
                            "completed": true
                        }
                    );
                }
            } catch(err) {}
        }

        if(marketState["query"] === "") {
            setMarketQuery({"predictions": [], "data": []})
        } else {
            runQuery();
        }
    }, [marketState["query"]]);

    const marketTypeToggle = (desc) => {
        dispatch(
            updateQuery("")
        );

        desc === "For You" ? navigate(`/market`) : navigate(`/market/${desc.toLowerCase().replace(/\s/g, '')}`);
    }

    return(
        <div
            onScroll={props.f_viewPort === "small" ? null : handleScrollMarketPage}
            className={props.f_viewPort === "small" ? "small-homePageContentBodyWrapper" : "large-homePageContentBodyWrapper"}
            >
            <div 
                    ref={contentBodyRef}
                    className={props.f_viewPort === "small" ? "small-homePageContentBody" : "large-homePageContentBody"}
                >
                <div className="large-homePageContentBodyMargin"/>
                {props.displayView === "prediction" ?
                    <>
                        {marketState["selected"]["type"] === "Prediction" 
                            && marketState["selected"]["selectedDesc"]["prediction"]["_id"] === props.predictionId ?
                            <div className="large-homePagePostContainer" key={'home-page-post-full'}
                                    style={props.f_viewPort === "small" ?
                                        {"minHeight": "100%", "borderBottom": "none"} : 
                                        {"position": "absolute", "top": "51px", "minHeight": "100%", "borderBottom": "none"}
                                    }
                                >
                                <Prediction
                                    pred_location={"market"}
                                    user={user ? user.user : "visitor"}
                                    predictionDesc={marketState["selected"]["selectedDesc"]["prediction"]} 
                                    marketDesc={marketState["selected"]["selectedDesc"]["markets"]}
                                    ownership={u_marketHoldings.filter(doc => doc.predictionId === marketState["selected"]["selectedDesc"]["prediction"]["_id"])}
                                />
                            </div> : 
                            <div className="large-homePagePostContainer"
                                    style={props.f_viewPort === "small" ?
                                        {"minHeight": "calc(100% - 51px)"} : 
                                        {"position": "absolute", "top": "51px", "minHeight": "calc(100% - 51px)"}
                                    }
                                >
                                <div className="main-HomeLoadingContainer">
                                    <div className="finulab-chartLoading">
                                        <div className="finulab-chartLoadingSpinner"/>
                                        <img src="/assets/Finulab_Icon.png" alt="" className="finulab-chartLoadingImg" />
                                    </div>
                                </div> 
                            </div>
                        }
                    </> :
                    <>
                        {contentBodyWidth[1] === true ?
                            <>
                                <div className="large-marketPageInnerTopOptionsContainer"
                                        style={
                                            {"position": "fixed", "top": "51px", "width": `${contentBodyWidth[0]}px`, "minWidth": `${contentBodyWidth[0]}px`, "maxWidth": `${contentBodyWidth[0]}px`}
                                        }
                                    >
                                    <div className="large-marketPageInnerCategoryOptionsContainer">
                                        <div className="large-marketPageCategoryOptnsInnerContainer">
                                            {marketState["categories"]["dataLoading"] ?
                                                null : 
                                                <>
                                                    {marketState["categories"]["data"].map((desc, index) => (
                                                            <button className="large-marketPageCategoryOptnBtn"
                                                                    disabled={homePageMarketsBeingUpdated}
                                                                    key={`market-selected-view-optn-${index}`}
                                                                    style={desc[0] === marketState["selectedView"] && marketState["query"] === "" ?
                                                                        {"color": "var(--primary-bg-10)","backgroundColor": "var(--primary-bg-03)"} : {}
                                                                    }
                                                                    onClick={() => marketTypeToggle(desc[0])}
                                                                >
                                                                <div className="large-marketPageCategoryOptnBtnImgContainer"
                                                                        style={desc[1] === "" ?
                                                                            {"backgroundColor": "var(--secondary-bg-03)"} : {}
                                                                        }
                                                                    >
                                                                    {desc[0] === "For You" ||
                                                                        desc[0] === "For Review" || desc[0] === "For Resolution" || desc[1] === "" ?
                                                                        <div className="post-headerProfileImageNone"
                                                                                style={{"background": "var(--secondary-bg-03)"}}
                                                                            >
                                                                            <img src="/assets/Favicon.png" alt="" className="large-homePageHeaderProfileImgNonUserMarkCopy" />
                                                                        </div> :
                                                                        <img src={desc[1]} alt="" className="large-marketPageCategoryOptnBtnImg" />
                                                                    }
                                                                </div>
                                                                <span className="large-marketPageCategoryOpntBtnDesc">{desc[0]}</span>
                                                            </button>
                                                        ))
                                                    }
                                                </>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="large-marketPageInnerTopOptionsContainerMargin"/>
                            </> : null
                        }
                        <div className="large-homePageContentBodyOutline">
                            {marketState["query"] === "" ?
                                <>
                                    {marketState["displayData"]["dataLoading"] || 
                                        marketState["displayData"]["category"] !== marketState["selectedView"] ?
                                        <>
                                            {Array(visibleContentCount + 1).fill(0).map((desc, index) => (
                                                    <div className="large-homePageRightBarPredictionContainer" 
                                                            key={`market-loading-prediction-${index}`}
                                                            style={{"backgroundColor": "rgba(0, 0, 0, 1)"}}
                                                        >
                                                        <div className="large-dashboardRightBarPredictionInnerContainer">
                                                            <MiniaturizedPrediction loading={true}/>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </> : 
                                        <>
                                            {marketState["displayData"]["predictions"].length === 0 ?
                                                <div className="large-homePagePostContainer" key={'home-page-post-full'}
                                                        style={{"position": "absolute", "top": "96px", "minHeight": "calc(100% - 96px)"}}
                                                    >
                                                    {user ?
                                                        <>
                                                            {user.verified ?
                                                                <>
                                                                    <img src="/assets/Finulab_Icon.png" alt="" className="large-marketPageNoDateNoticeImg" />
                                                                    <div className="large-marketPageNoDataONotice">No predictions yet for this category.</div>
                                                                    <div className="large-marketPageNoDataTNotice">Click 'Pair' to create one and earn 50% of the collected fees.</div>
                                                                </> : 
                                                                <>
                                                                    <img src="/assets/Finulab_Icon.png" alt="" className="large-marketPageNoDateNoticeImg" />
                                                                    <div className="large-marketPageNoDataONotice">No predictions yet for this category.</div>
                                                                    <div className="large-marketPageNoDataTNotice">Get verified to create one and earn 50% of the collected fees.</div>
                                                                </>
                                                            }
                                                        </> : 
                                                        <>
                                                            <img src="/assets/Finulab_Icon.png" alt="" className="large-marketPageNoDateNoticeImg" />
                                                            <div className="large-marketPageNoDataONotice">No predictions yet for this category.</div>
                                                            <div className="large-marketPageNoDataTNotice">Sign-up and get verified to create one and earn 50% of the collected fees.</div>
                                                        </>
                                                    }
                                                </div> :
                                                <>
                                                    {marketState["displayData"]["predictions"].map((prediction_desc, index) => (
                                                            <div className="large-homePagePostContainer" key={`market-prediction-${prediction_desc._id}`}
                                                                    ref={
                                                                        marketState["displayData"]["predictions"].length < marketState["displayData"]["liveCount"] &&
                                                                        index === marketState["displayData"]["predictions"].length - 2 ? 
                                                                        lastMarketElementRef : null
                                                                    }
                                                                    style={
                                                                        {
                                                                            "backgroundColor": "rgba(0, 0, 0, 1)",
                                                                            "borderBottom": marketState["displayData"]["predictions"].length - 1 === index ? "none" : "solid 1px var(--primary-bg-08)"
                                                                        }
                                                                    }
                                                                >
                                                                <MiniaturizedPrediction 
                                                                    pred_location={"market"}
                                                                    mouseOnComponent={1}
                                                                    predictionDesc={prediction_desc} 
                                                                    user={user ? user.user : "visitor"}
                                                                    marketDesc={
                                                                        marketState["displayData"]["data"].filter(doc => doc.predictionId == prediction_desc._id)
                                                                    }
                                                                    ownership={u_marketHoldings.filter(doc => doc.predictionId === prediction_desc._id)}
                                                                />
                                                            </div>
                                                        ))
                                                    }
                                                    {/*
                                                            <div className="large-homePageRightBarPredictionContainer" 
                                                                    key={`market-prediction-${prediction_desc._id}`}
                                                                    style={
                                                                        {
                                                                            "backgroundColor": "rgba(0, 0, 0, 1)",
                                                                            "borderBottom": marketState["categoriesData"][marketState["selectedView"]]["predictions"].length - 1 === index ? "none" : "solid 1px var(--primary-bg-08)"
                                                                        }
                                                                    }
                                                                >
                                                                <div className="large-dashboardRightBarPredictionInnerContainer"
                                                                        ref={
                                                                            marketState["categoriesData"][marketState["selectedView"]]["predictions"].length < marketState["categoriesData"][marketState["selectedView"]]["liveCount"] &&
                                                                            index === marketState["categoriesData"][marketState["selectedView"]]["predictions"].length - 2 ? 
                                                                            lastMarketElementRef : null
                                                                        }
                                                                    >
                                                                    <MiniaturizedPrediction 
                                                                        pred_location={"market"}
                                                                        mouseOnComponent={1}
                                                                        predictionDesc={prediction_desc} 
                                                                        user={user ? user.user : "visitor"}
                                                                        marketDesc={
                                                                            marketState["categoriesData"][marketState["selectedView"]]["data"].filter(doc => doc.predictionId == prediction_desc._id)
                                                                        }
                                                                        ownership={u_marketHoldings.filter(doc => doc.predictionId === prediction_desc._id)}
                                                                    />
                                                                </div>
                                                            </div>
                                                    */}
                                                    <div className="large-homePageProfileNoDataContainer"
                                                        style={{
                                                            "minHeight": `calc(100vh - 51px - 36px)`
                                                        }}
                                                    />
                                                </>
                                            }
                                        </>
                                    }
                                </> : 
                                <> 
                                    {marketQuery.predictions.length === 0 ?
                                        <div className="large-homePagePostContainer" key={'home-page-post-full'}
                                                style={{"position": "absolute", "top": "96px", "minHeight": "calc(100% - 96px)"}}
                                            >
                                            {marketQueryTracker.query === marketState["query"] && marketQueryTracker.completed ?
                                                <>
                                                    {user ?
                                                        <>
                                                            {user.verified ?
                                                                <>
                                                                    <img src="/assets/Finulab_Icon.png" alt="" className="large-marketPageNoDateNoticeImg" />
                                                                    <div className="large-marketPageNoDataONotice">
                                                                        No predictions yet for "{marketState["query"].length > 15 ? `${marketState["query"].slice(0, 15)}...`: marketState["query"]}".
                                                                    </div>
                                                                    <div className="large-marketPageNoDataTNotice">Click 'Pair' to create one and earn 50% of the collected fees.</div>
                                                                </> : 
                                                                <>
                                                                    <img src="/assets/Finulab_Icon.png" alt="" className="large-marketPageNoDateNoticeImg" />
                                                                    <div className="large-marketPageNoDataONotice">
                                                                        No predictions yet for "{marketState["query"].length > 15 ? `${marketState["query"].slice(0, 15)}...`: marketState["query"]}".
                                                                    </div>
                                                                    <div className="large-marketPageNoDataTNotice">Get verified to create one and earn 50% of the collected fees.</div>
                                                                </>
                                                            }
                                                        </> : 
                                                        <>
                                                            <img src="/assets/Finulab_Icon.png" alt="" className="large-marketPageNoDateNoticeImg" />
                                                            <div className="large-marketPageNoDataONotice">
                                                                No predictions yet for "{marketState["query"].length > 15 ? `${marketState["query"].slice(0, 15)}...`: marketState["query"]}".
                                                            </div>
                                                            <div className="large-marketPageNoDataTNotice">Sign-up and get verified to create one and earn 50% of the collected fees.</div>
                                                        </>
                                                    }
                                                </> : null
                                            }
                                        </div> :
                                        <>
                                            {marketQuery.predictions.map((prediction_desc, index) => (
                                                    <div className="large-homePagePostContainer"
                                                            key={`market-prediction-${prediction_desc._id}`}
                                                            style={
                                                                {
                                                                    "backgroundColor": "rgba(0, 0, 0, 1)",
                                                                    "borderBottom": marketQuery.predictions.length - 1 === index ? "none" : "solid 1px var(--primary-bg-08)"
                                                                }
                                                            }
                                                        >
                                                        <MiniaturizedPrediction 
                                                            pred_location={"market"}
                                                            mouseOnComponent={1}
                                                            predictionDesc={prediction_desc} 
                                                            user={user ? user.user : "visitor"}
                                                            marketDesc={
                                                                marketQuery.data.filter(doc => doc.predictionId == prediction_desc._id)
                                                            }
                                                            ownership={u_marketHoldings.filter(doc => doc.predictionId === prediction_desc._id)}
                                                        />
                                                    </div>
                                                ))
                                            }
                                            {/*
                                            <div className="large-homePageRightBarPredictionContainer" 
                                                    key={`market-prediction-${prediction_desc._id}`}
                                                    style={
                                                        {
                                                            "backgroundColor": "rgba(0, 0, 0, 1)",
                                                            "borderBottom": marketQuery.predictions.length - 1 === index ? "none" : "solid 1px var(--primary-bg-08)"
                                                        }
                                                    }
                                                >
                                                <div className="large-dashboardRightBarPredictionInnerContainer">
                                                    <MiniaturizedPrediction 
                                                        pred_location={"market"}
                                                        mouseOnComponent={1}
                                                        predictionDesc={prediction_desc} 
                                                        user={user ? user.user : "visitor"}
                                                        marketDesc={
                                                            marketQuery.data.filter(doc => doc.predictionId == prediction_desc._id)
                                                        }
                                                        ownership={u_marketHoldings.filter(doc => doc.predictionId === prediction_desc._id)}
                                                    />
                                                </div>
                                            </div>
                                            */}
                                            <div className="large-homePageProfileNoDataContainer"
                                                style={{
                                                    "minHeight": `calc(100vh - 51px - 36px)`
                                                }}
                                            />
                                        </>
                                    }
                                </>
                            }
                        </div>
                        {/*contentBodyWidth[1] === true ?
                            <div className="large-marketPageContentCreateWrapper" 
                                    style={appState["market"]["visible"] ? 
                                        {"marginLeft": `${contentBodyWidth[0] - 60}px`, "backgroundColor": "rgba(0, 110, 230, 0.85)"} :
                                        {"marginLeft": `${contentBodyWidth[0] - 60}px`, "backgroundColor": "rgba(0, 110, 230, 0.05)"}
                                    }
                                >
                                <button className="large-marketPageContentCreateSection">
                                    <AssuredWorkload className="large-homePageContentCreateSectionIcon"/>
                                    <span className="large-homePageContentCreateSectionDesc">Pair</span>
                                </button>
                            </div> : null
                        */}
                    </>
                }
            </div>
        </div>
    )
}