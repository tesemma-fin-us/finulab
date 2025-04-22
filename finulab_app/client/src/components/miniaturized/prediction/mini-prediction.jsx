import '../../post/index.css';
import './mini-prediction.css';
import '../news/mini-news.css';

import {useNavigate} from 'react-router-dom';
import BeatLoader from 'react-spinners/BeatLoader';
import {useDispatch, useSelector} from 'react-redux';
import {useInView} from 'react-intersection-observer';
import {useRef, useState, useEffect, useLayoutEffect} from 'react';
import {ThumbUpOffAlt, ThumbDownOffAlt, Comment, Cached, ContentCopy, ShoppingBasket, ThumbUp, ThumbDown, Verified, TaskAltSharp, Add, Remove, ExpandMoreSharp, RepeatSharp, CheckCircle, CheckCircleOutline, HighlightOffOutlined, TrendingUp, TrendingDown, CloseSharp, GavelSharp, Check, Close} from "@mui/icons-material";

import generalOpx from '../../../functions/generalFunctions';
import ProbabilityGuage from '../probabilityGuage/probabilityGuage';
import ProbabilityHistoryChart from "../../probabilityHistory/probabilityHistory";

import {selectWalletDesc} from '../../../reduxStore/walletDesc';
import {selectMarketConfig} from '../../../reduxStore/marketConfig';
import {setMarketHoldings} from '../../../reduxStore/marketHoldings';
import {setMarkets, setEngaged, selectProfileData} from '../../../reduxStore/profileData';
import {updateStockPredictions, selectStockPredictions} from '../../../reduxStore/stockPredictions';
import {setStockPageSelection, selectStockPageSelection} from '../../../reduxStore/stockPageSelection';
import {setDisplayData, setDataBank, setSelected, selectMarketData} from '../../../reduxStore/marketData';
import {addToPredictionEngagement, removeFromPredictionEngagement, selectPredictionEngagement} from '../../../reduxStore/predictionEngagement';
import {updateStockDashboardMarkets, setStockDashboardMarketsSelected, selectStockDashboardMarkets} from '../../../reduxStore/stockDashboardMarkets';

const authorizedReviewers = process.env.REACT_AUTHORIZEDREVIEWERS;

export default function MiniaturizedPrediction(props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const u_engagement = useSelector(selectPredictionEngagement);

    const marketData = useSelector(selectMarketData);
    const walletDesc = useSelector(selectWalletDesc);
    const marketConfig = useSelector(selectMarketConfig);
    const profilePageData = useSelector(selectProfileData);
    const stockSelection = useSelector(selectStockPageSelection);
    const stockPredictions = useSelector(selectStockPredictions);
    const dashboardPredictions = useSelector(selectStockDashboardMarkets);

    const [marketDesc, setMarketDesc] = useState([]);
    const [ownershipDesc, setOwnershipDesc] = useState(0);
    const [ownershipBreakDown, setOwnershipBreakDown] = useState([]);

    const [repostCount, setRepostCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);
    const [engagementRatio, setEngagementRatio] = useState([0, 0]);
    const [categoricalHoveringState, setCategoricalHoveringState] = useState([]);
    useEffect(() => {
        if(props.marketDesc !== undefined && props.marketDesc !== null) {
            if(marketDesc.length === 0) {
                setMarketDesc(props.marketDesc.sort((a, b) => b.probabilityYes - a.probabilityYes));
                setCategoricalHoveringState(
                    Array(props.marketDesc.length).fill(undefined)
                );
            }
        }

        if(props.ownership !== undefined && props.ownership !== null) {
            if(ownershipDesc === 0 && props.ownership.length > 0) {
                const total = props.ownership.reduce((accumulator, currentValue) => 
                    {
                        return accumulator + currentValue.yesQuantity + currentValue.noQuantity;
                    }, 0
                );
                setOwnershipDesc(total);

                let ownershipBreakDownFunction = [];
                for(let i = 0; i < props.ownership.length; i++) {
                    ownershipBreakDownFunction.push(
                        {
                            "marketId": props.ownership[i]["marketId"],
                            "noQuantity": props.ownership[i]["noQuantityDesc"],
                            "yesQuantity": props.ownership[i]["yesQuantityDesc"]
                        }
                    );
                }
                setOwnershipBreakDown(ownershipBreakDownFunction);
            }
        }
    }, [props]);
    useEffect(() => {
        if(!(props.predictionDesc === undefined || props.predictionDesc === null)) {
            setRepostCount(props.predictionDesc.reposts);
            setCommentCount(props.predictionDesc.comments);
            setEngagementRatio([props.predictionDesc.likes, props.predictionDesc.dislikes]);
        }
    }, [props]);

    const updatePredictionStats = async () => {
        if(!(props.predictionDesc === undefined || props.predictionDesc === null)) {
            const update_rslts = await generalOpx.axiosInstance.put(`/market/update-stat`,
                {
                    "predictionId": props.predictionDesc._id
                }
            );

            if(update_rslts.data["status"] = "success") {
                if(marketData["displayData"]["predictions"].some(pred_desc => pred_desc._id === props.predictionDesc._id)) {
                    let displayPredictionsCopy = [...marketData["displayData"]["predictions"]];
                    const displayUpdateIndex = displayPredictionsCopy.findIndex(pred_desc => pred_desc._id === props.predictionDesc._id);
                    displayPredictionsCopy[displayUpdateIndex] = update_rslts.data["data"];

                    let displayPredsMarketsCopy = [
                        ...marketData["displayData"]["data"].filter(mrkt_desc => mrkt_desc.predictionId !== props.predictionDesc._id),
                        ...update_rslts.data["markets"]
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

                if(marketData["dataBank"].some(dta_bnk_elem => dta_bnk_elem.category === props.predictionDesc.category)) {
                    const dataBankUpdateIndex = marketData["dataBank"].findIndex(dta_bnk_elem => dta_bnk_elem.category === props.predictionDesc.category);
                    if(marketData["dataBank"][dataBankUpdateIndex]["predictions"].some(pred_desc => pred_desc._id === props.predictionDesc._id)) {
                        let displayPredictionsCopy = [...marketData["dataBank"][dataBankUpdateIndex]["predictions"]];
                        const displayUpdateIndex = displayPredictionsCopy.findIndex(pred_desc => pred_desc._id === props.predictionDesc._id);
                        displayPredictionsCopy[displayUpdateIndex] = update_rslts.data["data"];

                        let displayPredsMarketsCopy = [
                            ...marketData["dataBank"][dataBankUpdateIndex]["data"].filter(mrkt_desc => mrkt_desc.predictionId !== props.predictionDesc._id),
                            ...update_rslts.data["markets"]
                        ];

                        let updateDataBank_atIndex = {
                            "category": marketData["dataBank"][dataBankUpdateIndex]["category"],
                            "predictions": displayPredictionsCopy,
                            "data": displayPredsMarketsCopy,
                            "liveCount": marketData["dataBank"][dataBankUpdateIndex]["liveCount"],
                            "dataLoading": marketData["dataBank"][dataBankUpdateIndex]["dataLoading"]
                        };

                        let dataBankFunction = [
                            ...marketData["dataBank"].filter(bnk_elm => bnk_elm["category"] !== props.predictionDesc.category),
                            updateDataBank_atIndex
                        ];
                        dispatch(
                            setDataBank(dataBankFunction)
                        );
                    }
                }
            }
        }
    }

    const updateStatRef = useRef(null);
    const {ref, inView, entry} = useInView({});
    const [commitTxLoading, setCommitTxLoading] = useState(false);
    const [quickPurchasePos, setQuickPurchasePos] = useState("100%");
    useEffect(() => {
        let intervalId;
        let setTimeInterval = 0;
        if(!commitTxLoading) {
            if(updateStatRef.current
                && props.predictionDesc["status"] === "live"
            ) {
                if(inView) {
                    quickPurchasePos === "100%" ? setTimeInterval = 60 * 1000 : setTimeInterval = 10 * 1000;

                    intervalId = setInterval(updatePredictionStats, setTimeInterval);
                }
            }
        }

        return () => {
            if(intervalId) {clearInterval(intervalId);}
        }

    }, [inView, quickPurchasePos]);

    const [hoveringState, setHoveringState] = useState(undefined);
    const handleMouseLeave = () => {setHoveringState(undefined);}
    const handleMouseEnter = (type) => {type === "yes" ? setHoveringState(0) : setHoveringState(1);}
    
    const categoricalHandleMouseLeave = () => {
        setCategoricalHoveringState(
            Array(marketDesc.length).fill(undefined)
        );
    }
    const categoricalHandleMouseEnter = (i, type) => {
        let categoricalHoveringStateFunction = [...categoricalHoveringState];
        categoricalHoveringStateFunction[i] = type;

        setCategoricalHoveringState(categoricalHoveringStateFunction);
    }

    const setSideDisplaySelection = () => {
        if(props.pred_location === "dashboard") {
            navigate(`/stocks/prediction/${props.predictionDesc._id}`);
        } else if(props.pred_location === "stockPage") {
            if(!(props.pred_ticker === undefined || props.pred_ticker === null)) {
                navigate(`/stocks/${props.pred_ticker}/markets/${props.predictionDesc._id}`);
            }
        } else if(props.pred_location === "market") {
            navigate(`/market/prediction/${props.predictionDesc._id}`);
        }
    }

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

    const miniChartContainerRef = useRef();
    const [miniChartContainerWidth, setMiniChartContainerWidth] = useState(0);
    useLayoutEffect(() => {
        const getMiniChartContainerWidth = () => {
            if(miniChartContainerRef.current) {
                const miniChartContainerWidthFunction = miniChartContainerRef.current.getBoundingClientRect().width;
                setMiniChartContainerWidth(miniChartContainerWidthFunction);
            }
        }

        window.addEventListener('resize', getMiniChartContainerWidth);
        getMiniChartContainerWidth();
        return () => window.removeEventListener('resize', getMiniChartContainerWidth);
    }, [marketDesc]);

    const [quickPurchaseDesc, setQuickPurchaseDesc] = useState(
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

    const formatPurchaseQuantity = new Intl.NumberFormat(
        'en-US',
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    );
    const leastGreaterThanTarget = (arr, target) => 
        arr.reduce((min, current) => current > target && (min === null || current < min) ? current : min, null);

    const quickPurchaseDescSet = (pi, pt) => {
        if(quickPurchaseDesc["quantity"] === 0) {
            setQuickPurchasePos("0");
            setQuickPurchaseDesc(
                {
                    ...quickPurchaseDesc, "index": pi, "purchaseType": pt
                }
            );
        } else {
            let bq = 0, sectionOne = 0, quantity_yes = marketDesc[pi]["quantityYes"], quantity_no = marketDesc[pi]["quantityNo"];
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
                fee = (costFunctionCalc - marketDesc[pi]["costFunction"]) * (util_fee / 100);
                total = (costFunctionCalc - marketDesc[pi]["costFunction"]) * (1 + (util_fee / 100));


                isNaN((costFunctionCalc - marketDesc[pi]["costFunction"]) / quickPurchaseDesc["quantity"]) ? 
                    avg = 0 : isFinite((costFunctionCalc - marketDesc[pi]["costFunction"]) / quickPurchaseDesc["quantity"]) ? avg = (costFunctionCalc - marketDesc[pi]["costFunction"]) / quickPurchaseDesc["quantity"] : avg = 0;
                isNaN(1 - ((costFunctionCalc - marketDesc[pi]["costFunction"]) / quickPurchaseDesc["quantity"])) ? 
                    potentialReturn = 0 : isFinite(1 - ((costFunctionCalc - marketDesc[pi]["costFunction"]) / quickPurchaseDesc["quantity"])) ? potentialReturn = 1 - ((costFunctionCalc - marketDesc[pi]["costFunction"]) / quickPurchaseDesc["quantity"]) : potentialReturn = 0;
            } else if(quickPurchaseDesc["b_or_s"] === "sell") {
                isNaN((marketDesc[pi]["costFunction"] - costFunctionCalc) / quickPurchaseDesc["quantity"]) ? 
                    avg = 0 : isFinite((marketDesc[pi]["costFunction"] - costFunctionCalc) / quickPurchaseDesc["quantity"]) ? avg = (marketDesc[pi]["costFunction"] - costFunctionCalc) / quickPurchaseDesc["quantity"] : avg = 0;
                
                fee = 0;
                potentialReturn = 0;
                total = marketDesc[pi]["costFunction"] - costFunctionCalc;
            }

            setQuickPurchasePos("0");
            setQuickPurchaseDesc(
                {
                    ...quickPurchaseDesc, 
                    "index": pi, 
                    "purchaseType": pt,
                    "avg": avg,
                    "fee": fee,
                    "potentialReturn": potentialReturn,
                    "total": total
                }
            );
        }
    }
    const exitQuickPurchase = () => {
        quickPurchasePos === "0" ? setQuickPurchasePos("100%") : setQuickPurchasePos("0");
    }

    const adjustPurchaseType = () => {
        let pt = "";
        quickPurchaseDesc["purchaseType"] === "yes" ? pt = "no" : pt = "yes";
        let bq = 0, sectionOne = 0, quantity_yes = marketDesc[quickPurchaseDesc["index"]]["quantityYes"], quantity_no = marketDesc[quickPurchaseDesc["index"]]["quantityNo"];

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
            fee = (costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) * (util_fee / 100);
            total = (costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) * (1 + (util_fee / 100));


            isNaN((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / quickPurchaseDesc["quantity"]) ? 
                avg = 0 : isFinite((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / quickPurchaseDesc["quantity"]) ? avg = (costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / quickPurchaseDesc["quantity"] : avg = 0;
            isNaN(1 - ((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / quickPurchaseDesc["quantity"])) ? 
                potentialReturn = 0 : isFinite(1 - ((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / quickPurchaseDesc["quantity"])) ? potentialReturn = 1 - ((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / quickPurchaseDesc["quantity"]) : potentialReturn = 0;
        } else if(quickPurchaseDesc["b_or_s"] === "sell") {
            isNaN((marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc) / quickPurchaseDesc["quantity"]) ? 
                avg = 0 : isFinite((marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc) / quickPurchaseDesc["quantity"]) ? avg = (marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc) / quickPurchaseDesc["quantity"] : avg = 0;
            
            fee = 0;
            potentialReturn = 0;
            total = marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc;
        }

        setQuickPurchaseDesc(
            {
                ...quickPurchaseDesc, 
                "purchaseType": pt,
                "avg": avg,
                "fee": fee,
                "potentialReturn": potentialReturn,
                "total": total
            }
        );
    }

    const adjustBuyorSell = (pt) => {
        if(pt !== quickPurchaseDesc["b_or_s"]) {
            let bq = 0, sectionOne = 0, quantity_yes = marketDesc[quickPurchaseDesc["index"]]["quantityYes"], quantity_no = marketDesc[quickPurchaseDesc["index"]]["quantityNo"];

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
                fee = (costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) * (util_fee / 100);
                total = (costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) * (1 + (util_fee / 100));


                isNaN((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / quickPurchaseDesc["quantity"]) ? 
                    avg = 0 : isFinite((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / quickPurchaseDesc["quantity"]) ? avg = (costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / quickPurchaseDesc["quantity"] : avg = 0;
                isNaN(1 - ((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / quickPurchaseDesc["quantity"])) ? 
                    potentialReturn = 0 : isFinite(1 - ((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / quickPurchaseDesc["quantity"])) ? potentialReturn = 1 - ((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / quickPurchaseDesc["quantity"]) : potentialReturn = 0;
            } else if(pt === "sell") {
                isNaN((marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc) / quickPurchaseDesc["quantity"]) ? 
                    avg = 0 : isFinite((marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc) / quickPurchaseDesc["quantity"]) ? avg = (marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc) / quickPurchaseDesc["quantity"] : avg = 0;
                
                fee = 0;
                potentialReturn = 0;
                total = marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc;
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
        let bq = 0, sectionOne = 0, quantity_yes = marketDesc[quickPurchaseDesc["index"]]["quantityYes"], quantity_no = marketDesc[quickPurchaseDesc["index"]]["quantityNo"];

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
            fee = (costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) * (util_fee / 100);
            total = (costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) * (1 + (util_fee / 100));


            isNaN((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / sanitizedValue) ? 
                avg = 0 : isFinite((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / sanitizedValue) ? avg = (costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / sanitizedValue : avg = 0;
            isNaN(1 - ((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / sanitizedValue)) ? 
                potentialReturn = 0 : isFinite(1 - ((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / sanitizedValue)) ? potentialReturn = 1 - ((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / sanitizedValue) : potentialReturn = 0;
        } else if(quickPurchaseDesc["b_or_s"] === "sell") {
            isNaN((marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc) / sanitizedValue) ? 
                avg = 0 : isFinite((marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc) / sanitizedValue) ? avg = (marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc) / sanitizedValue : avg = 0;
            
            fee = 0;
            potentialReturn = 0;
            total = marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc;

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
        let bq = 0, sectionOne = 0, quantity_yes = marketDesc[quickPurchaseDesc["index"]]["quantityYes"], quantity_no = marketDesc[quickPurchaseDesc["index"]]["quantityNo"];

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
            fee = (costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) * (util_fee / 100);
            total = (costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) * (1 + (util_fee / 100));


            isNaN((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / sanitizedValue) ? 
                avg = 0 : isFinite((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / sanitizedValue) ? avg = (costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / sanitizedValue : avg = 0;
            isNaN(1 - ((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / sanitizedValue)) ? 
                potentialReturn = 0 : isFinite(1 - ((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / sanitizedValue)) ? potentialReturn = 1 - ((costFunctionCalc - marketDesc[quickPurchaseDesc["index"]]["costFunction"]) / sanitizedValue) : potentialReturn = 0;
        } else if(quickPurchaseDesc["b_or_s"] === "sell") {
            isNaN((marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc) / sanitizedValue) ? 
                avg = 0 : isFinite((marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc) / sanitizedValue) ? avg = (marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc) / sanitizedValue : avg = 0;
            
            fee = 0;
            potentialReturn = 0;
            total = marketDesc[quickPurchaseDesc["index"]]["costFunction"] - costFunctionCalc;

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
            if(ownershipBreakDown.some(ownrsp_desc => ownrsp_desc.marketId === marketDesc[quickPurchaseDesc["index"]]["_id"])) {
                if(
                    [...ownershipBreakDown.filter(
                            ownrsp_desc => ownrsp_desc.marketId === marketDesc[quickPurchaseDesc["index"]]["_id"]
                        )[0][`${quickPurchaseDesc["purchaseType"]}Quantity`]
                    ].some(ownrsp_chain_desc => ownrsp_chain_desc[0] === String(quickPurchaseDesc["chain"]))
                ) {
                    const availableShares = [...ownershipBreakDown.filter(
                            ownrsp_desc => ownrsp_desc.marketId === marketDesc[quickPurchaseDesc["index"]]["_id"]
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
                            remainderQuantity = marketDesc[quickPurchaseDesc["index"]]["quantityYes"] - quickPurchaseDesc["quantity"];
                        } else if(quickPurchaseDesc["purchaseType"] === "no") {
                            remainderQuantity = marketDesc[quickPurchaseDesc["index"]]["quantityNo"] - quickPurchaseDesc["quantity"];
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
                    "marketId": marketDesc[quickPurchaseDesc["index"]]["_id"],
                    "predictionId": marketDesc[quickPurchaseDesc["index"]]["predictionId"],

                    "chainId": `${quickPurchaseDesc["chain"]}`,
                }
            ).then(
                async (response) => {
                    if(response.data["status"] === "success") {
                        proceed_wAnimation = true;
                        await updatePredictionStats();

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
        }, 250);
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
                                setTimeout(() => {setAuth_decision("");}, 0);
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

    return(
        <div className="post-Wrapper" style={{"position": "relative", "overflow": "hidden"}}>
            {props.loading || props.predictionDesc === undefined || props.predictionDesc === null || marketDesc.length === 0 ?
                <div className="miniaturizedPrediction-QuestionLoading"/> :
                <div className="miniaturizedPrediction-Question">
                    <button className="miniaturizedPrediction-QuestionBtn" onClick={() => setSideDisplaySelection()}>
                        {props.predictionDesc["predictiveQuestion"]}
                    </button>
                </div>
            }
            {props.loading || props.predictionDesc === undefined || props.predictionDesc === null || marketDesc.length === 0 ?
                <div className="miniaturizedPrediction-ImgNewModLoading"/> : 
                <button className="miniaturizedPrediction-predImgBtn" onClick={() => setSideDisplaySelection()}>
                    <img src={props.predictionDesc["predictiveImage"]} alt="" className="miniaturizedPrediction-predImg"/>
                </button>
            }
            {props.loading || props.predictionDesc === undefined || props.predictionDesc === null || marketDesc.length === 0 ?
                null :
                <>
                    {props.predictionDesc["status"] === "live" ? 
                        <>
                            {props.predictionDesc["outcomeType"] === "yes-or-no" ?
                                <>
                                    <div className="miniaturized-PredictionOutcomeProbabilityDescContainerV1">
                                        <span
                                                style={{"color": hoveringState === 1 ? "var(--primary-bg-05)" : "var(--primary-bg-01)"}}
                                            >
                                            {generalOpx.formatPercentage.format(marketDesc[0]["probabilityYes"] * 100)}%
                                        </span>
                                        <span>&nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                        <span
                                                style={{"color": hoveringState === 0 ? "var(--primary-bg-05)" : "var(--primary-bg-01)"}}
                                            >
                                            {generalOpx.formatPercentage.format(marketDesc[0]["probabilityNo"] * 100)}%
                                        </span>
                                    </div>
                                    <div className="miniaturized-PredictionOutcomeProbabilityDescContainer" style={{"marginTop": "-12px"}}>
                                        <Check 
                                            className="miniaturized-PredictionOutcomeProbabilityDescIcon"
                                            style={{"color": hoveringState === 0 ? "rgba(46, 204, 113, 1)" : hoveringState === 1 ? "rgba(46, 204, 113, 0.35)" : "rgba(46, 204, 113, 1)"}}
                                        />
                                        <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualDescWrapper">
                                            <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualDescContainer">
                                                {Number(`${generalOpx.formatPercentage.format(marketDesc[0]["probabilityYes"] * 100)}`.replace(/,/g, "")) === 100 ?
                                                    <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualGreen"
                                                        style={{
                                                            "width": "calc(100%)",
                                                            "minWidth": "calc(100%)",
                                                            "maxWidth": "calc(100%)",
                                                            "backgroundColor": hoveringState === 0 ? "rgba(46, 204, 113, 1)" : hoveringState === 1 ? "rgba(46, 204, 113, 0.35)" : "rgba(46, 204, 113, 1)"
                                                        }}
                                                    /> : 
                                                    <>
                                                        {Number(`${generalOpx.formatPercentage.format(marketDesc[0]["probabilityYes"] * 100)}`.replace(/,/g, "")) === 0 ?
                                                            <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualRed"
                                                                style={{
                                                                    "width": "calc(100%)",
                                                                    "minWidth": "calc(100%)",
                                                                    "maxWidth": "calc(100%)",
                                                                    "backgroundColor": hoveringState === 0 ? "rgba(223, 83, 68, 0.35)" : hoveringState === 1 ? "rgba(223, 83, 68, 1)" : "rgba(223, 83, 68, 1)"
                                                                }}
                                                            /> : 
                                                            <>
                                                                {marketDesc[0]["probabilityYes"] * 100 >= 97 ?
                                                                    <>
                                                                        <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualGreen"
                                                                            style={{
                                                                                "width": "calc(100% - 4px - 5px)",
                                                                                "minWidth": "calc(100% - 4px - 5px)",
                                                                                "maxWidth": "calc(100% - 4px - 5px)",
                                                                                "backgroundColor": hoveringState === 0 ? "rgba(46, 204, 113, 1)" : hoveringState === 1 ? "rgba(46, 204, 113, 0.35)" : "rgba(46, 204, 113, 1)"
                                                                            }}
                                                                        />
                                                                        <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualRed"
                                                                            style={{
                                                                                "width": "5px",
                                                                                "minWidth": "5px",
                                                                                "maxWidth": "5px",
                                                                                "backgroundColor": hoveringState === 0 ? "rgba(223, 83, 68, 0.35)" : hoveringState === 1 ? "rgba(223, 83, 68, 1)" : "rgba(223, 83, 68, 1)"
                                                                            }}
                                                                        />
                                                                    </> :
                                                                    <>
                                                                        {marketDesc[0]["probabilityYes"] * 100 <= 3 ?
                                                                            <>
                                                                                <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualGreen"
                                                                                    style={{
                                                                                        "width": "5px",
                                                                                        "minWidth": "5px",
                                                                                        "maxWidth": "5px",
                                                                                        "backgroundColor": hoveringState === 0 ? "rgba(46, 204, 113, 1)" : hoveringState === 1 ? "rgba(46, 204, 113, 0.35)" : "rgba(46, 204, 113, 1)"
                                                                                    }}
                                                                                />
                                                                                <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualRed"
                                                                                    style={{
                                                                                        "width": "calc(100% - 4px - 5px)",
                                                                                        "minWidth": "calc(100% - 4px - 5px)",
                                                                                        "maxWidth": "calc(100% - 4px - 5px)",
                                                                                        "backgroundColor": hoveringState === 0 ? "rgba(223, 83, 68, 0.35)" : hoveringState === 1 ? "rgba(223, 83, 68, 1)" : "rgba(223, 83, 68, 1)"
                                                                                    }}
                                                                                />
                                                                            </> :
                                                                            <>
                                                                                <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualGreen"
                                                                                    style={{
                                                                                        "width": `calc(${marketDesc[0]["probabilityYes"] * 100}% - 2px)`,
                                                                                        "minWidth": `calc(${marketDesc[0]["probabilityYes"] * 100}% - 2px)`,
                                                                                        "maxWidth": `calc(${marketDesc[0]["probabilityYes"] * 100}% - 2px)`,
                                                                                        "backgroundColor": hoveringState === 0 ? "rgba(46, 204, 113, 1)" : hoveringState === 1 ? "rgba(46, 204, 113, 0.35)" : "rgba(46, 204, 113, 1)"
                                                                                    }}
                                                                                />
                                                                                <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualRed"
                                                                                    style={{
                                                                                        "width": `calc(${(1 - marketDesc[0]["probabilityYes"]) * 100}% - 2px)`,
                                                                                        "minWidth": `calc(${(1 - marketDesc[0]["probabilityYes"]) * 100}% - 2px)`,
                                                                                        "maxWidth": `calc(${(1 - marketDesc[0]["probabilityYes"]) * 100}% - 2px)`,
                                                                                        "backgroundColor": hoveringState === 0 ? "rgba(223, 83, 68, 0.35)" : hoveringState === 1 ? "rgba(223, 83, 68, 1)" : "rgba(223, 83, 68, 1)"
                                                                                    }}
                                                                                />
                                                                            </>
                                                                        }
                                                                    </>
                                                                }
                                                            </>
                                                        }
                                                    </>
                                                }
                                            </div>
                                            <div className="miniaturized-PredictionOutcomeProbabilityInnerDescTextV3">Chance</div>
                                        </div>
                                        <Close 
                                            className="miniaturized-PredictionOutcomeProbabilityDescIconV2"
                                            style={{"color": hoveringState === 0 ? "rgba(223, 83, 68, 0.35)" : hoveringState === 1 ? "rgba(223, 83, 68, 1)" : "rgba(223, 83, 68, 1)"}}
                                        />
                                    </div>
                                    <div className="miniaturized-PredictionOutcomeProbabilityDescContainer" style={{"marginTop": "5px"}}>
                                        <div className="miniaturized-PredictionOutcomeProbabilityInnerCont">
                                            <div className="miniaturized-PredictionOutcomeProbabilityInnerDescText">Yes</div>
                                            <div className="miniaturized-PredictionOutcomeProbabilityInnerDescTextV2">{generalOpx.formatLargeFigures(marketDesc[0]["quantityYes"] * marketDesc[0]["priceYes"], 2)} FINUX</div>
                                        </div>
                                        <div className="miniaturized-PredictionOutcomeProbabilityInnerCont" style={{"marginLeft": "auto"}}>
                                            <div className="miniaturized-PredictionOutcomeProbabilityInnerDescText" style={{"marginLeft": "auto"}}>No</div>
                                            <div className="miniaturized-PredictionOutcomeProbabilityInnerDescTextV2">{generalOpx.formatLargeFigures(marketDesc[0]["quantityNo"] * marketDesc[0]["priceNo"], 2)} FINUX</div>
                                        </div>
                                    </div>
                                </> : 
                                <div className="miniaturized-PredictionOutcomeCategorialProbabilityDescContainer">
                                    <div className="miniaturized-PredictionOutcomeCategoricalProbabilityDescHeader" ref={updateStatRef}>
                                        <span className="miniaturized-probDescHeaderOutcome">Outcome</span>
                                        <span className="miniaturized-probDescHeaderChance">Chance</span>
                                        <span className="miniaturized-probDescHeaderTrade">Quick Trade</span>
                                    </div>
                                    <div className="miniaturizedPrediction-OutcomesContainerScroll" ref={ref}>
                                        {marketDesc.length > 0 ?
                                            <>
                                                {marketDesc.map((outcomeDesc, index) => (
                                                        <div className="miniiaturizedPrediction-OutcomeElementLine" 
                                                                key={`home-bar-market-${index}`}
                                                                style={index === marketDesc.length - 1 ? {"marginBottom": "0px"} : {}}
                                                            >
                                                            <img src={outcomeDesc.outcomeImage} alt="" className="miniaturized-PredictionOutcomeImg" />
                                                            <div className="miniaturizedPrediction-OutcomeDescCont">
                                                                <span className="miniaturizedPrediction-OutcomeDesc">{outcomeDesc.outcome}</span>
                                                                <span className="miniaturizedPrediction-OutcomeDesc" style={{"color": "var(--primary-bg-05)"}}>{generalOpx.formatLargeFigures(
                                                                ( outcomeDesc["quantityYes"] * outcomeDesc["priceYes"]) + (outcomeDesc["quantityNo"] * outcomeDesc["priceNo"]), 2)} FINUX
                                                                </span>
                                                            </div>
                                                            <div className="miniaturizedPrediction-categoricalOutcomeProbabilityDescVisiual">
                                                                <div className="miniaturized-PredictionOutcomeProbabilityDescContainer">
                                                                    <span
                                                                            style={{"color": categoricalHoveringState[index] === 1 ? "var(--primary-bg-05)" : "var(--primary-bg-01)"}}
                                                                        >
                                                                        {generalOpx.formatPercentage.format(outcomeDesc["probabilityYes"] * 100)}%
                                                                    </span>
                                                                    <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualDescWrapperV2">
                                                                        <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualDescContainer" style={{"borderRadius": "0px"}}>
                                                                            {outcomeDesc["probabilityYes"] * 100 >= 97 ?
                                                                                <>
                                                                                    <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualGreen"
                                                                                        style={{
                                                                                            "width": "calc(100% - 4px - 5px)",
                                                                                            "minWidth": "calc(100% - 4px - 5px)",
                                                                                            "maxWidth": "calc(100% - 4px - 5px)",
                                                                                            "backgroundColor": categoricalHoveringState[index] === 1 ? "rgba(46, 204, 113, 0.35)" : "rgba(46, 204, 113, 1)"
                                                                                        }}
                                                                                    />
                                                                                    <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualRed"
                                                                                        style={{
                                                                                            "width": "5px",
                                                                                            "minWidth": "5px",
                                                                                            "maxWidth": "5px",
                                                                                            "backgroundColor": categoricalHoveringState[index] === 1 ? "rgba(223, 83, 68, 1)" : "rgba(0, 0, 0, 0)"
                                                                                        }}
                                                                                    />
                                                                                </> :
                                                                                <>
                                                                                    {outcomeDesc["probabilityYes"] * 100 <= 3 ?
                                                                                        <>
                                                                                            <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualGreen"
                                                                                                style={{
                                                                                                    "width": "5px",
                                                                                                    "minWidth": "5px",
                                                                                                    "maxWidth": "5px",
                                                                                                    "backgroundColor": categoricalHoveringState[index] === 1 ? "rgba(46, 204, 113, 0.35)" : "rgba(46, 204, 113, 1)"
                                                                                                }}
                                                                                            />
                                                                                            <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualRed"
                                                                                                style={{
                                                                                                    "width": "calc(100% - 4px - 5px)",
                                                                                                    "minWidth": "calc(100% - 4px - 5px)",
                                                                                                    "maxWidth": "calc(100% - 4px - 5px)",
                                                                                                    "backgroundColor": categoricalHoveringState[index] === 1 ? "rgba(223, 83, 68, 1)" : "rgba(0, 0, 0, 0)"
                                                                                                }}
                                                                                            />
                                                                                        </> :
                                                                                        <>
                                                                                            <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualGreen"
                                                                                                style={{
                                                                                                    "width": `calc(${outcomeDesc["probabilityYes"] * 100}% - 2px)`,
                                                                                                    "minWidth": `calc(${outcomeDesc["probabilityYes"] * 100}% - 2px)`,
                                                                                                    "maxWidth": `calc(${outcomeDesc["probabilityYes"] * 100}% - 2px)`,
                                                                                                    "backgroundColor": categoricalHoveringState[index] === 1 ? "rgba(46, 204, 113, 0.35)" : "rgba(46, 204, 113, 1)"
                                                                                                }}
                                                                                            />
                                                                                            <div className="miniaturized-PredictionOutcomeProbabilityDescVisiualRed"
                                                                                                style={{
                                                                                                    "width": `calc(${(1 - outcomeDesc["probabilityYes"]) * 100}% - 2px)`,
                                                                                                    "minWidth": `calc(${(1 - outcomeDesc["probabilityYes"]) * 100}% - 2px)`,
                                                                                                    "maxWidth": `calc(${(1 - outcomeDesc["probabilityYes"]) * 100}% - 2px)`,
                                                                                                    "backgroundColor": categoricalHoveringState[index] === 1 ? "rgba(223, 83, 68, 1)" : "rgba(0, 0, 0, 0)"
                                                                                                }}
                                                                                            />
                                                                                        </>
                                                                                    }
                                                                                </>
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="miniaturizedPrediction-categoricalOutcomeQuickPurchaseOptsContainer">
                                                                <button className="miniaturizedPrediction-OutcomeYesPurchBtn"
                                                                        disabled={quickTradeDisable}
                                                                        onClick={() => quickPurchaseDescSet(index, "yes")}
                                                                    >
                                                                    <span className="miniaturizedPrediction-OutcomePurchBtnDesc">Yes</span>
                                                                    <span className="miniaturizedPrediction-OutcomePurchBtnHoverDesc">
                                                                        {generalOpx.formatPercentage.format(outcomeDesc.probabilityYes * 100)}%
                                                                    </span>
                                                                </button>
                                                                <button className="miniaturizedPrediction-OutcomeNoPurchBtn"
                                                                        disabled={quickTradeDisable}
                                                                        onClick={() => quickPurchaseDescSet(index, "no")}
                                                                        onMouseEnter={() => categoricalHandleMouseEnter(index, 1)}
                                                                        onMouseLeave={() => categoricalHandleMouseLeave()}
                                                                    >
                                                                    <span className="miniaturizedPrediction-OutcomePurchBtnDesc">No</span>
                                                                    <span className="miniaturizedPrediction-OutcomePurchBtnHoverDesc">
                                                                        {generalOpx.formatPercentage.format(outcomeDesc.probabilityNo * 100)}%
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </> : null
                                        }
                                    </div>
                                </div>
                            }
                        </> : null
                    }
                </>
            }
            {props.loading || props.predictionDesc === undefined || props.predictionDesc === null || marketDesc.length === 0 ?
                null :
                <>
                    {props.predictionDesc["status"] === "live" && props.predictionDesc["outcomeType"] === "yes-or-no" ?
                        <div className="miniaturizedPrediction-PurchaseOptnsContainer" ref={updateStatRef}>
                            <button className="miniaturizedPrediction-purchaseYesBtn"
                                    disabled={quickTradeDisable}
                                    onClick={() => quickPurchaseDescSet(0, "yes")}
                                    onMouseEnter={() => handleMouseEnter("yes")}
                                    onMouseLeave={() => handleMouseLeave()}
                                    style={{"marginLeft": "-3px"}}
                                >
                                <span style={{"whiteSpace": "nowrap", "padding": "0px", "marginLeft": "5px"}} ref={ref}>Quick Trade Yes</span>
                                <span
                                        style={{"display": "flex", "alignItems": "center", "padding": "0px", "marginLeft": "auto", "marginRight": "2px", "height": "100%", "minHeight": "100%", "maxHeight": "100%"}}
                                    >
                                    {generalOpx.formatFiguresCrypto.format(marketDesc[0]["priceYes"])}
                                    <img src="/assets/Finux_Token_Icon.png" alt="" className="predictionPurchaseBtnImg" />
                                </span>
                            </button>
                            <button className="miniaturizedPrediction-purchaseNoBtn"
                                    disabled={quickTradeDisable}
                                    onClick={() => quickPurchaseDescSet(0, "no")}
                                    onMouseEnter={() => handleMouseEnter("no")}
                                    onMouseLeave={() => handleMouseLeave()}
                                    style={{"marginRight": "-3px"}}
                                >
                                <span style={{"whiteSpace": "nowrap", "padding": "0px", "marginLeft": "5px"}}>Quick Trade No</span>
                                <span 
                                        style={{"display": "flex", "alignItems": "center", "padding": "0px", "marginLeft": "auto", "marginRight": "2px", "height": "100%", "minHeight": "100%", "maxHeight": "100%"}}
                                    >
                                    {generalOpx.formatFiguresCrypto.format(marketDesc[0]["priceNo"])}
                                    <img src="/assets/Finux_Token_Icon.png" alt="" className="predictionPurchaseBtnImg" />
                                </span>
                            </button>
                        </div> : null
                    }
                </>
            }
            {props.loading || props.predictionDesc === undefined || props.predictionDesc === null || marketDesc.length === 0 ?
                null : 
                <>
                    {props.predictionDesc["status"] === "live" ? 
                        null :
                        <div className="miniaturized-predictionNonLiveStatusDescrptionContainer">
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
                                </div> : 
                                <>
                                    <div className="miniaturizedPredictionNonLiveStatHeader">
                                        Status:&nbsp;
                                        <span style={{"fontWeight": "500", "color": "var(--primary-bg-01)"}}>
                                            {props.predictionDesc["status"] === "in-review" ?
                                                `In Review` : props.predictionDesc["status"] === "denied" ? `Denied` :
                                                props.predictionDesc["status"] === "ended" ? "Ended" : "Resolved"
                                            }
                                        </span>
                                    </div>
                                    <span className="prediction-outcomeUnderlineCOntainerNoTradingInfoDesc" style={{"width": "100%", "minWidth": "100%", "maxWidth": "100%"}}>
                                        {props.predictionDesc["status"] === "in-review" ?
                                            `Market is under review, trading will commense once approved.` : props.predictionDesc["status"] === "denied" ? `Market is not available for trading.` :
                                            props.predictionDesc["status"] === "ended" ? "Market is under review for a resolution." : "This market is closed and resolved."
                                        }
                                    </span> 
                                </>
                            }
                        </div>
                    }
                </>
            }
            <div className="large-stocksNewsEngagementContainer" style={{"marginTop": "15px"}}>
                <div className="post-likeDislikeContainer">
                    <button className="post-likeDislikeBtn"
                            onClick={
                                (props.user === undefined || props.user === null || props.user === "visitor") ?
                                () => navigate("/login") : () => engagePrediction("like")
                            }
                        >
                        {props.loading ?
                            <TrendingUp className="large-stocksNewsEngagementIcon" 
                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px", "transform": "scale(1)"}}
                            /> :
                            <>
                                {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                    <TrendingUp className="large-stocksNewsEngagementIcon"
                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px", "transform": "scale(1)"}}    
                                    /> :
                                    <>
                                        {u_engagement.some(eng => eng.predictionId === props.predictionDesc._id) ?
                                            <>
                                                {u_engagement.filter(eng => eng.predictionId === props.predictionDesc._id)[0]["type"] === "like" ?
                                                    <TrendingUp className="large-stocksFullyLikedIcon"
                                                        style={{"stroke": "var(--primary-green-09)", "strokeWidth": "1px", "transform": "scale(1)"}}
                                                    /> :
                                                    <TrendingUp className="large-stocksNewsEngagementIcon"
                                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px", "transform": "scale(1)"}}
                                                    />
                                                }
                                            </> : 
                                            <TrendingUp className="large-stocksNewsEngagementIcon"
                                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px", "transform": "scale(1)"}}
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
                            {engagementRatio[0]- engagementRatio[1] > 0 ? "+ " : "-"}
                            {generalOpx.formatLargeFigures(Math.abs(engagementRatio[0]- engagementRatio[1]), 2)}
                        </span>
                    }
                    <button className="post-likeDislikeBtn"
                            onClick={
                                (props.user === undefined || props.user === null || props.user === "visitor") ?
                                () => navigate("/login") : () => engagePrediction("dislike")
                            }
                            style={{"marginRight": "10px"}}
                        >
                        {props.loading ?
                            <TrendingDown className="large-stocksNewsEngagementIcon"
                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px", "transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)"}}
                            /> :
                            <>
                                {(props.user === undefined || props.user === null || props.user === "visitor") ?
                                    <TrendingDown className="large-stocksNewsEngagementIcon"
                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px", "transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)"}}
                                    /> :
                                    <>
                                        {u_engagement.some(eng => eng.predictionId === props.predictionDesc._id) ?
                                            <>
                                                {u_engagement.filter(eng => eng.predictionId === props.predictionDesc._id)[0]["type"] === "dislike" ?
                                                    <TrendingDown className="large-stocksFullyDislikedIcon" 
                                                        style={{"stroke": "var(--primary-red-09)", "strokeWidth": "1px", "transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)"}}
                                                    /> :
                                                    <TrendingDown className="large-stocksNewsEngagementIcon"
                                                        style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px", "transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)"}}
                                                    />
                                                }
                                            </> : 
                                            <TrendingDown className="large-stocksNewsEngagementIcon"
                                                style={{"stroke": "var(--primary-bg-05)", "strokeWidth": "1px", "transform": "scaleX(-1)", "WebkitTransform": "scaleX(-1)"}}
                                            />
                                        }
                                    </>
                                }
                            </>
                        }
                    </button>
                </div>
                <div className="large-stocksNewsEngagementContainerFurtherOptn">
                    {/*
                    <div style={{"display": "flex", "alignItems": "center"}}>
                        <Cached className="large-stocksNewsEngagementIcon" style={{"transform": "scale(1)"}}/>
                        {props.loading || repostCount === 0?
                            null : 
                            <span className="post-additionalEngagementOptionsDescText">{generalOpx.formatLargeFigures(repostCount, 2)}</span>
                        }
                    </div>
                    */}
                    <div style={{"display": "flex", "alignItems": "center", "marginRight": "25px"}}>
                        <Comment className="large-stocksNewsEngagementIcon" style={{"transform": "scale(1)"}}/>
                        {props.loading || commentCount === 0?
                            null : 
                            <span className="post-additionalEngagementOptionsDescText">{generalOpx.formatLargeFigures(commentCount, 2)}</span>
                        }
                    </div>
                    <div style={{"display": "flex", "alignItems": "center", "marginRight": "0px"}}>
                        <ContentCopy className="large-stocksNewsEngagementIcon" style={{"transform": "scale(1)"}}/>
                    </div>
                </div>
            </div>

            {props.loading || props.predictionDesc === undefined || props.predictionDesc === null || marketDesc.length === 0 ?
                null : 
                <>
                    <div className="miniaturized-predictionPurchaseWrapper"
                            style={{"top": `${quickPurchasePos}`, "display": `${commitTxAnimationSupport["overllContainer"]}`}}
                        >
                        <div className="miniaturized-predictionPurchaseHeader">
                            {props.predictionDesc["outcomeType"] === "yes-or-no" ?
                                <img src={props.predictionDesc["predictiveImage"]} alt="" className="miniaturized-predictionPurchaseHeaderImg"/> :
                                <img src={marketDesc[quickPurchaseDesc["index"]]["outcomeImage"]} alt="" className="miniaturized-predictionPurchaseHeaderImg"/>
                            }
                            <div className="miniaturized-predictionPurchaseHeaderDescContainer">
                                <div className="miniaturized-predictionPurchaseHeaderChangeSelectionContainer">
                                    {props.predictionDesc["outcomeType"] === "yes-or-no" ?
                                        null :
                                        <span className="miniaturized-predictionPurchaseHeaderChangeSelectionOutcomeDesc">{marketDesc[quickPurchaseDesc["index"]]["outcome"]}</span>
                                    }
                                    {quickPurchaseDesc["purchaseType"] === "yes" ?
                                        <button className="miniaturized-predictionPurchaseChangeSelectionBtn"
                                                onClick={() => adjustPurchaseType()}
                                                style={
                                                    {
                                                        "marginLeft": props.predictionDesc["outcomeType"] === "yes-or-no" ? "0px" : "10px",
                                                        "color": "var(--primary-green-09)", 
                                                        "backgroundColor": "rgba(46, 204, 113, 0.15)"
                                                    }
                                                }
                                            >
                                            Yes <RepeatSharp className="miniaturized-predictionPurchaseChangeSelectionBtnIcon" style={{"color": "var(--primary-green-09)"}}/>
                                        </button> :
                                        <button className="miniaturized-predictionPurchaseChangeSelectionBtn"
                                                onClick={() => adjustPurchaseType()}
                                                style={
                                                    {
                                                        "marginLeft": props.predictionDesc["outcomeType"] === "yes-or-no" ? "0px" : "10px",
                                                        "color": "var(--primary-red-09)", 
                                                        "backgroundColor": "rgba(223, 83, 68, 0.15)"
                                                    }
                                                }
                                            >
                                            No <RepeatSharp className="miniaturized-predictionPurchaseChangeSelectionBtnIcon" style={{"color": "var(--primary-red-09)"}}/>
                                        </button> 
                                    }
                                </div>
                                <div className="miniaturized-predictionPurchaseHeaderDesc">{props.predictionDesc["predictiveQuestion"]}</div>
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
                                                    key={`mini-prediction-purch-chain-btn-${index}`}
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
                                                {ownershipBreakDown.some(ownrsp_desc => ownrsp_desc.marketId === marketDesc[quickPurchaseDesc["index"]]["_id"]) ?
                                                    <>
                                                        {[...ownershipBreakDown.filter(
                                                                ownrsp_desc => ownrsp_desc.marketId === marketDesc[quickPurchaseDesc["index"]]["_id"]
                                                            )[0][`${quickPurchaseDesc["purchaseType"]}Quantity`]].some(ownrsp_chain_desc => ownrsp_chain_desc[0] === String(quickPurchaseDesc["chain"])) ?
                                                            <>
                                                                Available: {[...ownershipBreakDown.filter(
                                                                        ownrsp_desc => ownrsp_desc.marketId === marketDesc[quickPurchaseDesc["index"]]["_id"]
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
                        <div className="miniaturized-predictionPurchaseSecondaryWrapper">
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
                </>
            }
        </div>
    )
}