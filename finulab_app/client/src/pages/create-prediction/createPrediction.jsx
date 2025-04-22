import './createPrediction.css';
import '../../components/priceHistory/index.css';

import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import BeatLoader from 'react-spinners/BeatLoader';
import {useDispatch, useSelector} from 'react-redux';
import {parseISO, getYear, getMonth, getDate} from 'date-fns';
import {useRef, useState, useEffect, useLayoutEffect} from 'react';
import {PhotoCamera, Delete, Remove, Add, KeyboardArrowDown, ExpandMore, Verified, DeviceUnknownSharp, AssuredWorkloadSharp} from '@mui/icons-material';

import generalOpx from '../../functions/generalFunctions';

import {selectUser} from '../../reduxStore/user';
import {selectWalletDesc} from '../../reduxStore/walletDesc';
import {setCategories, selectMarketData} from '../../reduxStore/marketData';
import {setMarketConfig, selectMarketConfig} from '../../reduxStore/marketConfig';

const today = new Date();
const override = {
    display: "block",
    margin: "0 auto",
    borderColor: "red",
};

const finux_chainOptns = [
    "Chain 0", "Chain 1", "Chain 2", "Chain 3",
    "Chain 4", "Chain 5", "Chain 6", "Chain 7",
    "Chain 8", "Chain 9", "Chain 10", "Chain 11", 
    "Chain 12", "Chain 13", "Chain 14", "Chain 15", 
    "Chain 16", "Chain 17", "Chain 18", "Chain 19"
];

export default function FinulabCreatePrediction(props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const user = useSelector(selectUser);
    const walletDesc = useSelector(selectWalletDesc);
    const marketState = useSelector(selectMarketData);
    const marketConfig = useSelector(selectMarketConfig);

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

    const [prediction, setPrediction] = useState(
        {
            "username": "",
            "profileImage": "",
            "groupId": "",
            "groupProfileImage": "",
            "category": [],
            "endDate": "",
            "predictiveImage": "",
            "predictiveQuestion": "",
            "outcomeType": "yes-or-no",
            "officialValidationSource": "",
            "volume": 0,
            "liquidity": 0
        }
    );
    const [markets, setMarkets] = useState(
        [
            {
                "outcome": "",
                "outcomeImage": "",
                "rules": "",
                "participantsYes": 0,
                "participantsNo": 0,
                "quantityYes": 0,
                "quantityNo": 0,
                "priceYes": 0,
                "priceNo": 0,
                "probabilityYes": 0,
                "probabilityNo": 0,
                "costFunction": 0
            }
        ]
    );
    const [categoricalMarkets, setCategoricalMarkets] = useState(
        [
            {
                "outcome": "",
                "outcomeImage": "",
                "rules": "",
                "participantsYes": 0,
                "participantsNo": 0,
                "quantityYes": 0,
                "quantityNo": 0,
                "priceYes": 0,
                "priceNo": 0,
                "probabilityYes": 0,
                "probabilityNo": 0,
                "costFunction": 0
            }
        ]
    );
    const [generalMarketInfo, setGeneralMarketInfo] = useState(
        {
            "predictionId": "",
            "predictiveQuestion": "",
            "createdTimestamp": 0,
            "endDate": 0
        }
    );
    const [marketsCreationErrors, setMarketsCreationErrors] = useState(
        {
            "category": 0,
            "endDate": 0,
            "predictiveQuestion": 0,
            "predictiveImage": 0,
            "yn-quantities": 0,
            "yn-rules": 0,
            "c-0-outcomeImage": 0,
            "c-0-outcome": 0,
            "c-0-quantities": 0,
            "c-0-rules": 0,
            "validationLink": 0
        }
    );
    const [costFunction, setCostFunction] = useState(0);
    const [categoricalCostFunction, setCategoricalCostFunction] = useState(0);

    const predictionHandleChange = (event) => {
        const {name, value} = event.target;
        setPrediction(
            {
                ...prediction, [name]: value
            }
        );
    }

    const [selectedChain, setSelectedChain] = useState("0");
    const selectedChainHandler = (e) => {
        const {value} = e.target;
        const clarifiedValue = value.split(" ")[1];
        
        setSelectedChain(clarifiedValue);
    }
    
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState({});
    const [availableCategories, setAvailableCategories] = useState([]);
    useEffect(() => {
        const setUpCreatePrediction = async () => {
            if(marketState["categories"]["data"].length === 0) {
                const marketCategories = await generalOpx.axiosInstance.put(`/market/categories`, {});
                if(marketCategories.data["status"] === "success") {
                    let categories = [];
                    for(let i = 0; i < marketCategories.data["data"].length; i++) {
                        categories.push(
                            [marketCategories.data["data"][i]["desc"], marketCategories.data["data"][i]["profileImage"]]
                        );
                    }

                    let selectedCategoryFunction = {}, availableCategoriesFunction = [];
                    setPrediction(
                        {
                            ...prediction, username: user.user, profileImage: user.profilePicture
                        }
                    );
                    selectedCategoryFunction["desc"] = "select market";
                    selectedCategoryFunction["profileImage"] = '/assets/Favicon.png';

                    for(let j = 0; j < marketCategories.data["data"].length; j++) {
                        availableCategoriesFunction.push(
                            {"desc": marketCategories.data["data"][j]["desc"], "profileImage": marketCategories.data["data"][j]["profileImage"]}
                        );
                    }

                    setSelectedCategory(selectedCategoryFunction);
                    setAvailableCategories(availableCategoriesFunction);

                    dispatch(
                        setCategories(
                            {
                                "data": categories,
                                "dataLoading": false
                            }
                        )
                    );
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
            } else {
                if(Object.keys(selectedCategory).length === 0
                    || availableCategories.length === 0
                ) {
                    let selectedCategoryFunction = {}, availableCategoriesFunction = [];
                    setPrediction(
                        {
                            ...prediction, username: user.user, profileImage: user.profilePicture
                        }
                    );
                    selectedCategoryFunction["desc"] = "select market";
                    selectedCategoryFunction["profileImage"] = '/assets/Favicon.png';

                    for(let i = 0; i < marketState["categories"]["data"].length; i++) {
                        availableCategoriesFunction.push(
                            {"desc": marketState["categories"]["data"][i][0], "profileImage": marketState["categories"]["data"][i][1]}
                        );
                    }

                    setSelectedCategory(selectedCategoryFunction);
                    setAvailableCategories(availableCategoriesFunction);
                }
            }

            setLoading(true);
        }

        setUpCreatePrediction();
    }, [props]);

    const selectCategoryBtnRef = useRef(null);
    const selectCategoryOptnsRef = useRef(null);
    const [selectCategoryDisplay, setSelectCategoryDisplay] = useState(false);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if(selectCategoryDisplay) {
                if(!selectCategoryBtnRef.current?.contains(event?.target) && !selectCategoryOptnsRef.current?.contains(event?.target)) {
                    setSelectCategoryDisplay(false);
                }
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [selectCategoryDisplay, loading])

    const selectCategoryDisplayToggle = () => {
        selectCategoryDisplay ? setSelectCategoryDisplay(false) : setSelectCategoryDisplay(true);
    }
    const selectedCategoryToggle = (i) => {
        if(selectedCategory["desc"] !== availableCategories[i]["desc"]) {
            setSelectedCategory(availableCategories[i]);
            setSelectCategoryDisplay(false);
        }
    }
    
    let nowDate = "";
    const now = new Date();
    if(getMonth(now) + 1 < 10) {
        if(getDate(now) < 10) {
            nowDate = `${getYear(now)}-0${getMonth(now) + 1}-0${getDate(now)}`;
        } else {
            nowDate = `${getYear(now)}-0${getMonth(now) + 1}-${getDate(now)}`;
        }
    } else {
        if(getDate(now) < 10) {
            nowDate = `${getYear(now)}-${getMonth(now) + 1}-0${getDate(now)}`;
        } else {
            nowDate = `${getYear(now)}-${getMonth(now) + 1}-${getDate(now)}`;
        }
    }
    const [selectedEndDate, setSelectedEndDate] = useState(nowDate);
    const handleSelectedEndDateChange = (event) => {
        setSelectedEndDate(event.target.value);
    }

    const [predictiveImageError, setPredictiveImageError] = useState(0);
    const [predictiveImageLoading, setPredictiveImageLoading] = useState(false);
    const [hasPredictiveImageRendered, setHasPredictiveImageRendered] = useState(false);
    const predictiveImageHandler = async (event) => {
        if(event.target.files[0] !== undefined) {
            setPredictiveImageLoading(true);
            setHasPredictiveImageRendered(false);
            
            if(event.target.files[0].size === 0) {
                setPredictiveImageError(1);
                setTimeout(() => {
                    setPredictiveImageError(0);
                }, 1500);
            } else if(event.target.files[0].size / (1024 * 1024) > 8) {
                setPredictiveImageError(2);
                setTimeout(() => {
                    setPredictiveImageError(0);
                }, 1500);
            } else {
                await generalOpx.axiosInstance.put(`/content/posts/upload`, {"type": "image"}).then(
                    async (response) => {
                        if(response["data"]["status"] === "success") {
                            await axios.put(response["data"]["data"], event.target.files[0], {headers: {"Content-Type": "image/jpeg"}});
                            setPrediction(
                                {
                                    ...prediction, predictiveImage: String(response["data"]["data"].split('?')[0])
                                }
                            );
                        } else {
                            setPredictiveImageError(3);
                            setTimeout(() => {
                                setPredictiveImageError(0);
                            }, 1500);
                        }
                    }
                ).catch(
                    () => {
                        setPredictiveImageError(3);
                        setTimeout(() => {
                            setPredictiveImageError(0);
                        }, 1500);
                    }
                )
            }

            setPredictiveImageLoading(false);
        }
    }
    const predictiveImageonLoadHandler = () => {
        setHasPredictiveImageRendered(true);
    }

    const outcomeTypeToggle = (selection) => {
        setPrediction(
            {
                ...prediction, outcomeType: selection
            }
        );
    }

    const marketChangeHandler = (event) => {
        let marketsFunction = [];
        prediction.outcomeType === "yes-or-no" ?  marketsFunction = [...markets] : marketsFunction = [...categoricalMarkets];
        const {name, value} = event.target;

        const desc = name.split("-")[0];
        const index = Number(name.split("-")[1]);
        if(desc === "quantityYes" || desc === "quantityNo") {
            let summationCostFunction = 0;
            let sanitizedValue = Number(value.replace(/[^0-9]/g, ''));

            let bq = 0, sectionOne = 0, positiveNum_yes = 0,
                positiveNum_no = 0, negativeNum = 0, denominator = 0;

            let utilizeConfig = {};
            let configKeys = Object.keys(marketConfig["data"]);
            if(marketConfig["dataLoading"] || configKeys.length === 0) {
                utilizeConfig = {...generalOpx.marketConfigSupport};
            } else {
                utilizeConfig = {...marketConfig["data"]};
            }

            if(desc === "quantityYes") {
                bq = utilizeConfig.alpha * (sanitizedValue + marketsFunction[index]["quantityNo"]);
                sectionOne = Math.log(Math.exp(sanitizedValue / bq) + Math.exp(marketsFunction[index]["quantityNo"] / bq));
                positiveNum_yes = (sanitizedValue * Math.exp(sanitizedValue / bq)) + (marketsFunction[index]["quantityNo"] * Math.exp(sanitizedValue / bq));
                positiveNum_no = (sanitizedValue * Math.exp(marketsFunction[index]["quantityNo"] / bq)) + (marketsFunction[index]["quantityNo"] * Math.exp(marketsFunction[index]["quantityNo"] / bq));
                negativeNum = (sanitizedValue * Math.exp(sanitizedValue / bq)) + (marketsFunction[index]["quantityNo"] * Math.exp(marketsFunction[index]["quantityNo"] / bq));
                denominator = (sanitizedValue * (Math.exp(sanitizedValue / bq) + Math.exp(marketsFunction[index]["quantityNo"] / bq))) + (marketsFunction[index]["quantityNo"] * (Math.exp(sanitizedValue / bq) + Math.exp(marketsFunction[index]["quantityNo"] / bq)));   
                
                marketsFunction[index]["quantityYes"] = sanitizedValue;
            } else if(desc === "quantityNo") {
                bq = utilizeConfig.alpha * (marketsFunction[index]["quantityYes"] + sanitizedValue);
                sectionOne = Math.log(Math.exp(marketsFunction[index]["quantityYes"] / bq) + Math.exp(sanitizedValue / bq));
                positiveNum_yes = (marketsFunction[index]["quantityYes"] * Math.exp(marketsFunction[index]["quantityYes"] / bq)) + (sanitizedValue * Math.exp(marketsFunction[index]["quantityYes"] / bq));
                positiveNum_no = (marketsFunction[index]["quantityYes"] * Math.exp(sanitizedValue / bq)) + (sanitizedValue * Math.exp(sanitizedValue / bq));
                negativeNum = (marketsFunction[index]["quantityYes"] * Math.exp(marketsFunction[index]["quantityYes"] / bq)) + (sanitizedValue * Math.exp(sanitizedValue / bq));
                denominator = (marketsFunction[index]["quantityYes"] * (Math.exp(marketsFunction[index]["quantityYes"] / bq) + Math.exp(sanitizedValue / bq))) + (sanitizedValue * (Math.exp(marketsFunction[index]["quantityYes"] / bq) + Math.exp(sanitizedValue / bq)));
                
                marketsFunction[index]["quantityNo"] = sanitizedValue;
            }
            
            const priceYes = (utilizeConfig.alpha * sectionOne) + ((positiveNum_yes - negativeNum) / denominator);
            const priceNo = (utilizeConfig.alpha * sectionOne) + ((positiveNum_no - negativeNum) / denominator);
            const probabilityYes = priceYes / (priceYes + priceNo);
            const probabilityNo = priceNo / (priceYes + priceNo);
            const costFunctionCalc = bq * sectionOne;

            marketsFunction[index]["priceYes"] = isNaN(priceYes) ? 0 : priceYes;
            marketsFunction[index]["priceNo"] = isNaN(priceNo) ? 0 : priceNo;
            marketsFunction[index]["probabilityYes"] = isNaN(probabilityYes) ? 0 : probabilityYes;
            marketsFunction[index]["probabilityNo"] = isNaN(probabilityNo) ? 0 : probabilityNo;
            marketsFunction[index]["costFunction"] = isNaN(costFunctionCalc) ? 0 : costFunctionCalc;

            for(let i = 0; i < marketsFunction.length; i++) {
                summationCostFunction = summationCostFunction +  marketsFunction[i]["costFunction"]
            }
            
            if(prediction.outcomeType === "yes-or-no") {
                isNaN(summationCostFunction) ? setCostFunction(0) : setCostFunction(summationCostFunction);
            } else {
                isNaN(summationCostFunction) ? setCategoricalCostFunction(0) : setCategoricalCostFunction(summationCostFunction);
            }
        } else {
            marketsFunction[index][`${desc}`] = value;
        }

        prediction.outcomeType === "yes-or-no" ? setMarkets(marketsFunction) : setCategoricalMarkets(marketsFunction);
    }
    const marketPlusMinusChangeHandler = (i, type, selection) => {
        let marketsFunction = [];
        let summationCostFunction = 0;
        prediction.outcomeType === "yes-or-no" ? marketsFunction = [...markets] : marketsFunction = [...categoricalMarkets];
        
        let bq = 0, sectionOne = 0, positiveNum_yes = 0,
                positiveNum_no = 0, negativeNum = 0, denominator = 0;

        let utilizeConfig = {};
        let configKeys = Object.keys(marketConfig["data"]);
        if(marketConfig["dataLoading"] || configKeys.length === 0) {
            utilizeConfig = {...generalOpx.marketConfigSupport};
        } else {
            utilizeConfig = {...marketConfig["data"]};
        }

        if(type === "plus") {
            if(selection === "quantityYes") {
                marketsFunction[i]["quantityYes"] = marketsFunction[i]["quantityYes"] + 10;
            } else if(selection === "quantityNo") {
                marketsFunction[i]["quantityNo"] = marketsFunction[i]["quantityNo"] + 10;
            }
        } else if(type === "minus") {
            if(selection === "quantityYes") {
                marketsFunction[i]["quantityYes"] - 10 <= 0 ? marketsFunction[i]["quantityYes"] = 0 : marketsFunction[i]["quantityYes"] = marketsFunction[i]["quantityYes"] - 10;
            } else if(selection === "quantityNo") {
                marketsFunction[i]["quantityNo"] - 10 <= 0 ? marketsFunction[i]["quantityNo"] = 0 : marketsFunction[i]["quantityNo"] = marketsFunction[i]["quantityNo"] - 10;
            }
        }
        
        bq = utilizeConfig.alpha * (marketsFunction[i]["quantityYes"] + marketsFunction[i]["quantityNo"]);
        sectionOne = Math.log(Math.exp(marketsFunction[i]["quantityYes"] / bq) + Math.exp(marketsFunction[i]["quantityNo"] / bq));
        positiveNum_yes = (marketsFunction[i]["quantityYes"] * Math.exp(marketsFunction[i]["quantityYes"] / bq)) + (marketsFunction[i]["quantityNo"] * Math.exp(marketsFunction[i]["quantityYes"] / bq));
        positiveNum_no = (marketsFunction[i]["quantityYes"] * Math.exp(marketsFunction[i]["quantityNo"] / bq)) + (marketsFunction[i]["quantityNo"] * Math.exp(marketsFunction[i]["quantityNo"] / bq));
        negativeNum = (marketsFunction[i]["quantityYes"] * Math.exp(marketsFunction[i]["quantityYes"] / bq)) + (marketsFunction[i]["quantityNo"] * Math.exp(marketsFunction[i]["quantityNo"] / bq));
        denominator = (marketsFunction[i]["quantityYes"] * (Math.exp(marketsFunction[i]["quantityYes"] / bq) + Math.exp(marketsFunction[i]["quantityNo"] / bq))) + (marketsFunction[i]["quantityNo"] * (Math.exp(marketsFunction[i]["quantityYes"] / bq) + Math.exp(marketsFunction[i]["quantityNo"] / bq)));

        const priceYes = (utilizeConfig.alpha * sectionOne) + ((positiveNum_yes - negativeNum) / denominator);
        const priceNo = (utilizeConfig.alpha * sectionOne) + ((positiveNum_no - negativeNum) / denominator);
        const probabilityYes = priceYes / (priceYes + priceNo);
        const probabilityNo = priceNo / (priceYes + priceNo);
        const costFunctionCalc = bq * sectionOne;

        marketsFunction[i]["priceYes"] = isNaN(priceYes) ? 0 : priceYes;
        marketsFunction[i]["priceNo"] = isNaN(priceNo) ? 0 : priceNo;
        marketsFunction[i]["probabilityYes"] = isNaN(probabilityYes) ? 0 : probabilityYes;
        marketsFunction[i]["probabilityNo"] = isNaN(probabilityNo) ? 0 : probabilityNo;
        marketsFunction[i]["costFunction"] = isNaN(costFunctionCalc) ? 0 : costFunctionCalc;

        for(let j = 0; j < marketsFunction.length; j++) {
            summationCostFunction = summationCostFunction +  marketsFunction[j]["costFunction"]
        }
        
        if(prediction.outcomeType === "yes-or-no") {
            isNaN(summationCostFunction) ? setCostFunction(0) : setCostFunction(summationCostFunction);
        } else {
            isNaN(summationCostFunction) ? setCategoricalCostFunction(0) : setCategoricalCostFunction(summationCostFunction);
        }

        prediction.outcomeType === "yes-or-no" ? setMarkets(marketsFunction) : setCategoricalMarkets(marketsFunction);
    }

    const formatFigures = new Intl.NumberFormat(
        'en-US',
        {
            useGrouping: false,
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        }
    );
    const formatFiguresV2 = new Intl.NumberFormat(
        'en-US',
        {
            useGrouping: false,
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        }
    );
    const secondaryFormatFigures = new Intl.NumberFormat(
        'en-US',
        {
            useGrouping: false,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

    const [outcomeImageError, setOutcomeImageError] = useState(
        [
            0
        ]
    );
    const [outcomeImageLoading, setOutcomeImageLoading] = useState(
        [
            false
        ]
    );
    const categoricalAddOutcomeToggle = () => {
        let errorExists = 0;
        let outcomeImageErrorFunction = [...outcomeImageError];
        let outcomeImageLoadingFunction = [...outcomeImageLoading];

        let marketsFunction = [...categoricalMarkets];
        let marketsCreationErrorsFunction = {...marketsCreationErrors};
        for(let i = 0; i < marketsFunction.length; i++) {
            if(marketsFunction[i]["outcome"].trim() === "") {
                marketsCreationErrorsFunction[`c-${i}-outcome`] = 1;
                errorExists === 1 ? errorExists = 1 : errorExists = errorExists + 1;
            } else {marketsCreationErrorsFunction[`c-${i}-outcome`] = 0;}

            if(marketsFunction[i]["outcomeImage"].trim() === "") {
                marketsCreationErrorsFunction[`c-${i}-outcomeImage`] = 1; 
                errorExists === 1 ? errorExists = 1 : errorExists = errorExists + 1;
            } else {marketsCreationErrorsFunction[`c-${i}-outcomeImage`] = 0;}

            if(marketsFunction[i]["rules"].trim() === "") {
                marketsCreationErrorsFunction[`c-${i}-rules`] = 1; 
                errorExists === 1 ? errorExists = 1 : errorExists = errorExists + 1;
            } else {marketsCreationErrorsFunction[`c-${i}-rules`] = 0;}

            if(marketsFunction[i]["quantityYes"] + marketsFunction[i]["quantityNo"] === 0) {
                marketsCreationErrorsFunction[`c-${i}-quantities`] = 1; 
                errorExists === 1 ? errorExists = 1 : errorExists = errorExists + 1;
            } else {marketsCreationErrorsFunction[`c-${i}-quantities`] = 0;}
        }

        if(errorExists === 1) {
            setMarketsCreationErrors(marketsCreationErrorsFunction);
        } else {
            outcomeImageErrorFunction.push(0);
            outcomeImageLoadingFunction.push(false);

            marketsCreationErrorsFunction[`c-${marketsFunction.length}-outcome`] = 0; 
            marketsCreationErrorsFunction[`c-${marketsFunction.length}-outcomeImage`] = 0; 
            marketsCreationErrorsFunction[`c-${marketsFunction.length}-rules`] = 0;
            marketsCreationErrorsFunction[`c-${marketsFunction.length}-quantities`] = 0; 

            marketsFunction.push(
                {
                    "outcome": "",
                    "outcomeImage": "",
                    "rules": "",
                    "participantsYes": 0,
                    "participantsNo": 0,
                    "quantityYes": 0,
                    "quantityNo": 0,
                    "priceYes": 0,
                    "priceNo": 0,
                    "probabilityYes": 0,
                    "probabilityNo": 0,
                    "costFunction": 0
                }
            );

            setOutcomeImageError(outcomeImageErrorFunction);
            setOutcomeImageLoading(outcomeImageLoadingFunction);

            setMarketsCreationErrors(marketsCreationErrorsFunction);
            setCategoricalMarkets(marketsFunction);
        }
    }

    const outcomeImageHandler = async (event) => {
        const index = Number(event.target.name);
        let outcomeImageErrorFunction = [...outcomeImageError];
        let categoricalMarketsFunction = [...categoricalMarkets];
        let outcomeImageLoadingFunction = [...outcomeImageLoading];

        if(event.target.files[0] !== undefined) {
            outcomeImageLoadingFunction[index] = true;
            setOutcomeImageLoading(outcomeImageLoadingFunction);

            if(event.target.files[0].size === 0) {
                outcomeImageErrorFunction[index] = 1;
                setOutcomeImageError(outcomeImageErrorFunction);

                setTimeout(() => {
                    let secondaryOutcomeImageLoadingFunction = [...outcomeImageLoading];
                    secondaryOutcomeImageLoadingFunction[index] = 0
                    setOutcomeImageError(secondaryOutcomeImageLoadingFunction);
                }, 2000);
            } else if(event.target.files[0].size / (1024 * 1024) > 8) {
                outcomeImageErrorFunction[index] = 2;
                setOutcomeImageError(outcomeImageErrorFunction);
                
                setTimeout(() => {
                    let secondaryOutcomeImageLoadingFunction = [...outcomeImageLoading];
                    secondaryOutcomeImageLoadingFunction[index] = 0
                    setOutcomeImageError(secondaryOutcomeImageLoadingFunction);
                }, 2000);
            } else {
                await generalOpx.axiosInstance.put(`/content/posts/upload`, {"type": "image"}).then(
                    async (response) => {
                        if(response["data"]["status"] === "success") {
                            await axios.put(response["data"]["data"], event.target.files[0], {headers: {"Content-Type": "image/jpeg"}});
                            categoricalMarketsFunction[index]["outcomeImage"] = String(response["data"]["data"].split('?')[0]);
                            setCategoricalMarkets(categoricalMarketsFunction);
                        } else {
                            outcomeImageErrorFunction[index] = 3;
                            setOutcomeImageError(outcomeImageErrorFunction);
                            
                            setTimeout(() => {
                                let secondaryOutcomeImageLoadingFunction = [...outcomeImageLoading];
                                secondaryOutcomeImageLoadingFunction[index] = 0
                                setOutcomeImageError(secondaryOutcomeImageLoadingFunction);
                            }, 2000);
                        }
                    }
                ).catch(
                    () => {
                        outcomeImageErrorFunction[index] = 3;
                        setOutcomeImageError(outcomeImageErrorFunction);
                        
                        setTimeout(() => {
                            let secondaryOutcomeImageLoadingFunction = [...outcomeImageLoading];
                            secondaryOutcomeImageLoadingFunction[index] = 0
                            setOutcomeImageError(secondaryOutcomeImageLoadingFunction);
                        }, 2000);
                    }
                )
            }

            let outcomeImageLoadingSecondaryFunction = [...outcomeImageLoading];
            outcomeImageLoadingSecondaryFunction[index] = false;
            setOutcomeImageLoading(outcomeImageLoadingSecondaryFunction);
        }
    }

    const categoricalMarketDelete = (i) => {
        let limit = categoricalMarkets.length - 1;
        let marketsFunction = [...categoricalMarkets];
        let outcomeImageErrorFunction = [...outcomeImageError]
        let outcomeImageLoadingFunction = [...outcomeImageLoading];
        let marketsCreationErrorsFunction = {...marketsCreationErrors};
        

        marketsFunction.splice(i, 1);
        outcomeImageErrorFunction.splice(i, 1);
        outcomeImageLoadingFunction.splice(i, 1);

        let k = 0;
        let l = 0;
        let newMarketsCreationErrorsFunction = {};
        let marketsCreationErrorsFunctionKeys = Object.keys(marketsCreationErrorsFunction);
        
        marketsCreationErrorsFunctionKeys.sort();
        for(let j = 0; j < marketsCreationErrorsFunctionKeys.length; j++) {
            if(marketsCreationErrorsFunctionKeys[j].slice(0, 2) === "c-") {
                const error_desc = marketsCreationErrorsFunctionKeys[j].split("-");
                if(Number(error_desc[1]) !== i) {
                    newMarketsCreationErrorsFunction[`c-${k}-${error_desc[2]}`] = marketsCreationErrorsFunction[`${marketsCreationErrorsFunctionKeys[j]}`];
                    l = l + 1;

                    if(l === 4) { l = 0; k = k + 1;}
                }
            } else {
                newMarketsCreationErrorsFunction[`${marketsCreationErrorsFunctionKeys[j]}`] = marketsCreationErrorsFunction[`${marketsCreationErrorsFunctionKeys[j]}`];
            }
        }

        setCategoricalMarkets(marketsFunction);
        setOutcomeImageError(outcomeImageErrorFunction);
        setOutcomeImageLoading(outcomeImageLoadingFunction);
        setMarketsCreationErrors(newMarketsCreationErrorsFunction);
    }

    const convertStringToUnix = (dateStr) => {
        const dateObj = parseISO(dateStr);
        const unixTimestamp = Math.floor(dateObj.getTime() / 1000);

        return unixTimestamp;
    }
    
    const [disableBtnsonSubmit, setDisableBtnsonSubmit] = useState(false);
    const [predictionSubmissionError, setPredictionSubmissionError] = useState(0);
    const [predictionSubmissionLoading, setPredictionSubmissionLoading] = useState(false);
    const errorValidationForSubmission = () => {
        let errorsExist = 0,
            marketsCreationErrorsFunction = {...marketsCreationErrors};

        if(selectedCategory["desc"] === "select market") {
            marketsCreationErrorsFunction["category"] = 1;
            errorsExist === 1 ? errorsExist = 1 : errorsExist = errorsExist + 1;
        } else {marketsCreationErrorsFunction["category"] = 0;}

        const validationDate = new Date(selectedEndDate);
        const timeDifference = ((validationDate - today) / (1000 * 60 * 60 * 24));
        if(timeDifference < 7) {
            marketsCreationErrorsFunction["endDate"] = 1;
            errorsExist === 1 ? errorsExist = 1 : errorsExist = errorsExist + 1;
        } else {marketsCreationErrorsFunction["endDate"] = 0;}

        if(prediction.predictiveQuestion.trim() === "") {
            marketsCreationErrorsFunction["predictiveQuestion"] = 1;
            errorsExist === 1 ? errorsExist = 1 : errorsExist = errorsExist + 1;
        } else {marketsCreationErrorsFunction["predictiveQuestion"] = 0;}

        if(prediction.predictiveImage.trim() === "") {
            marketsCreationErrorsFunction["predictiveImage"] = 1;
            errorsExist === 1 ? errorsExist = 1 : errorsExist = errorsExist + 1;
        } else {marketsCreationErrorsFunction["predictiveImage"] = 0;}

        if(prediction.officialValidationSource.trim() === "") {
            marketsCreationErrorsFunction["validationLink"] = 1;
            errorsExist === 1 ? errorsExist = 1 : errorsExist = errorsExist + 1;
        } else {marketsCreationErrorsFunction["validationLink"] = 0;}

        if(prediction.outcomeType === "yes-or-no") {
            if(markets[0]["quantityYes"] + markets[0]["quantityNo"] === 0) {
                marketsCreationErrorsFunction["yn-quantities"] = 1;
                errorsExist === 1 ? errorsExist = 1 : errorsExist = errorsExist + 1;
            } else {marketsCreationErrorsFunction["yn-quantities"] = 0;}
    
            if(markets[0]["rules"].trim() === "") {
                marketsCreationErrorsFunction["yn-rules"] = 1;
                errorsExist === 1 ? errorsExist = 1 : errorsExist = errorsExist + 1;
            } else {marketsCreationErrorsFunction["yn-rules"] = 0;}
        } else {
            for(let i = 0; i < categoricalMarkets.length; i++) {
                if(categoricalMarkets[i]["outcome"].trim() === "") {
                    marketsCreationErrorsFunction[`c-${i}-outcome`] = 1;
                    errorsExist === 1 ? errorsExist = 1 : errorsExist = errorsExist + 1;
                } else {marketsCreationErrorsFunction[`c-${i}-outcome`] = 0;}

                if(categoricalMarkets[i]["outcomeImage"].trim() === "") {
                    marketsCreationErrorsFunction[`c-${i}-outcomeImage`] = 1;
                    errorsExist === 1 ? errorsExist = 1 : errorsExist = errorsExist + 1;
                } else {marketsCreationErrorsFunction[`c-${i}-outcomeImage`] = 0;}

                if(categoricalMarkets[i]["rules"].trim() === "") {
                    marketsCreationErrorsFunction[`c-${i}-rules`] = 1;
                    errorsExist === 1 ? errorsExist = 1 : errorsExist = errorsExist + 1;
                } else {marketsCreationErrorsFunction[`c-${i}-rules`] = 0;}

                if(categoricalMarkets[i]["quantityYes"] + categoricalMarkets[i]["quantityNo"] === 0) {
                    marketsCreationErrorsFunction[`c-${i}-quantities`] = 1;
                    errorsExist === 1 ? errorsExist = 1 : errorsExist = errorsExist + 1;
                } else {marketsCreationErrorsFunction[`c-${i}-quantities`] = 0;}
            }
        }

        setMarketsCreationErrors(marketsCreationErrorsFunction);
        return errorsExist;
    }
    
    const createTheMarkets = async () => {
        setDisableBtnsonSubmit(true);
        setPredictionSubmissionLoading(true);
        
        let mainWalletBalance = 0;
        if(walletDesc["balance"]["data"].some(wlt_desc => wlt_desc[0] === selectedChain)) {
            mainWalletBalance = walletDesc["balance"]["data"].filter(wlt_desc => wlt_desc[0] === selectedChain)[0][1];
        }
        
        if(prediction.outcomeType === "yes-or-no") {
            if(costFunction > mainWalletBalance
                || costFunction === 0
            ) {
                setPredictionSubmissionError(2);
                setTimeout(() => {
                    setPredictionSubmissionError(0);
                }, 1500);
            } else {
                const errorValidationResult = errorValidationForSubmission();
                if(errorValidationResult === 0) {
                    let curatedEndDate = convertStringToUnix(selectedEndDate), reqBody = {
                        "username": prediction.username,
                        "profileImage": prediction.profileImage,
                        "creatorWalletAddress": user.walletAddress,
                        "groupId": prediction.groupId,
                        "groupProfileImage": prediction.groupProfileImage,
                        "chainId": selectedChain,
                        "category": [selectedCategory["desc"], selectedCategory["profileImage"]],
                        "endDate": curatedEndDate,
                        "predictiveImage": prediction.predictiveImage,
                        "predictiveQuestion": prediction.predictiveQuestion,
                        "taggedAssets": [],
                        "outcomeType": "yes-or-no",
                        "outcomes": [],
                        "topOutcomes": markets[0]["probabilityYes"] >= markets[0]["probabilityNo"] ?
                            [
                                ["yes", markets[0]["priceYes"], markets[0]["probabilityYes"]], 
                                ["no", markets[0]["priceNo"], markets[0]["probabilityNo"]]
                            ] : [
                                ["no", markets[0]["priceNo"], markets[0]["probabilityNo"]],
                                ["yes", markets[0]["priceYes"], markets[0]["probabilityYes"]]
                            ],
                        "officialValidationSource": prediction.officialValidationSource,
                        "markets": [
                            {
                                "outcome": markets[0]["outcome"],
                                "outcomeImage": prediction.predictiveImage,
                                "participantsYes": markets[0]["quantityYes"] > 0 ? 1 : 0,
                                "participantsNo": markets[0]["quantityNo"] > 0 ? 1 : 0,
                                "quantityYes": markets[0]["quantityYes"],
                                "quantityNo": markets[0]["quantityNo"],
                                "priceYes": markets[0]["priceYes"],
                                "priceNo": markets[0]["priceNo"],
                                "probabilityYes": markets[0]["probabilityYes"],
                                "probabilityNo": markets[0]["probabilityNo"],
                                "costFunction": markets[0]["costFunction"],
                                "rules": markets[0]["rules"]
                            }
                        ],
                        "costToCreate": costFunction
                    }

                    await generalOpx.axiosInstance.post(`/market/create-prediction`, reqBody).then(
                        (response) => {
                            if(response.data["status"] === "success") {
                                setPredictionSubmissionError(4);
                                setTimeout(() => {
                                    setPredictionSubmissionError(0);
                                    navigate(`/market/prediction/${response.data["predictionId"]}`);
                                }, 1500);
                            } else {
                                setPredictionSubmissionError(1);
                                setTimeout(() => {
                                    setPredictionSubmissionError(0);
                                }, 1500);
                            }
                        }
                    ).catch(
                        () => {
                            setPredictionSubmissionError(1);
                            setTimeout(() => {
                                setPredictionSubmissionError(0);
                            }, 1500);
                        }
                    );
                } else {
                    setPredictionSubmissionError(3);
                    setTimeout(() => {
                        setPredictionSubmissionError(0);
                    }, 1500);
                }
            }
        } else {
            if(categoricalCostFunction > mainWalletBalance
                || categoricalCostFunction === 0
            ) {
                setPredictionSubmissionError(2);
                setTimeout(() => {
                    setPredictionSubmissionError(0);
                }, 1500);
            } else {
                const errorValidationResult = errorValidationForSubmission();
                if(errorValidationResult === 0) {
                    let curatedEndDate = convertStringToUnix(selectedEndDate),
                        curatedOutcomes = [], curatedTopOutcomes = categoricalMarkets.sort((a, b) => b.probabilityYes - a.probabilityYes), curatedCategoricalMarkets = [];
                    for(let k = 0; k < categoricalMarkets.length; k++) {
                        curatedOutcomes.push(categoricalMarkets[k]["outcome"]);
                        curatedCategoricalMarkets.push(
                            {
                                "outcome": categoricalMarkets[k]["outcome"],
                                "outcomeImage":categoricalMarkets[k]["outcomeImage"],
                                "participantsYes": categoricalMarkets[k]["quantityYes"] > 0 ? 1 : 0,
                                "participantsNo": categoricalMarkets[k]["quantityNo"] > 0 ? 1 : 0,
                                "quantityYes": categoricalMarkets[k]["quantityYes"],
                                "quantityNo": categoricalMarkets[k]["quantityNo"],
                                "priceYes": categoricalMarkets[k]["priceYes"],
                                "priceNo": categoricalMarkets[k]["priceNo"],
                                "probabilityYes": categoricalMarkets[k]["probabilityYes"],
                                "probabilityNo": categoricalMarkets[k]["probabilityNo"],
                                "costFunction": categoricalMarkets[k]["costFunction"],
                                "rules": categoricalMarkets[k]["rules"]
                            }
                        )
                    }

                    let topTwo = [];
                    curatedTopOutcomes.length === 1 ? 
                        topTwo = [[curatedTopOutcomes[0]["outcome"], curatedTopOutcomes[0]["outcomeImage"], curatedTopOutcomes[0]["priceYes"], curatedTopOutcomes[0]["probabilityYes"]]] : 
                        topTwo = [
                            [curatedTopOutcomes[0]["outcome"], curatedTopOutcomes[0]["outcomeImage"], curatedTopOutcomes[0]["priceYes"], curatedTopOutcomes[0]["probabilityYes"]],
                            [curatedTopOutcomes[1]["outcome"], curatedTopOutcomes[1]["outcomeImage"], curatedTopOutcomes[1]["priceYes"], curatedTopOutcomes[1]["probabilityYes"]]
                        ]
                    let reqBody = {
                        "username": prediction.username,
                        "profileImage": prediction.profileImage,
                        "creatorWalletAddress": user.walletAddress,
                        "groupId": prediction.groupId,
                        "groupProfileImage": prediction.groupProfileImage,
                        "chainId": selectedChain,
                        "category": [selectedCategory["desc"], selectedCategory["profileImage"]],
                        "endDate": curatedEndDate,
                        "predictiveImage": prediction.predictiveImage,
                        "predictiveQuestion": prediction.predictiveQuestion,
                        "taggedAssets": [],
                        "outcomeType": "categorical",
                        "outcomes": curatedOutcomes,
                        "topOutcomes": topTwo,
                        "officialValidationSource": prediction.officialValidationSource,
                        "markets": curatedCategoricalMarkets, 
                        "costToCreate": categoricalCostFunction
                    }

                    await generalOpx.axiosInstance.post(`/market/create-prediction`, reqBody).then(
                        (response) => {
                            if(response.data["status"] === "success") {
                                setPredictionSubmissionError(4);
                                setTimeout(() => {
                                    setPredictionSubmissionError(0);
                                    navigate(`/market/prediction/${response.data["predictionId"]}`);
                                }, 1500);
                            } else {
                                setPredictionSubmissionError(1);
                                setTimeout(() => {
                                    setPredictionSubmissionError(0);
                                }, 1500);
                            }
                        }
                    ).catch(
                        () => {
                            setPredictionSubmissionError(1);
                            setTimeout(() => {
                                setPredictionSubmissionError(0);
                            }, 1500);
                        }
                    );
                } else {
                    setPredictionSubmissionError(3);
                    setTimeout(() => {
                        setPredictionSubmissionError(0);
                    }, 1500);
                }
            }
        }
        
        setDisableBtnsonSubmit(false);
        setPredictionSubmissionLoading(false);
    }

    return(
        <div
            className={props.f_viewPort === "small" ? "small-homePageContentBodyWrapper" : "large-homePageContentBodyWrapper"}
            >
            <div ref={contentBodyRef}
                    className={props.f_viewPort === "small" ? "small-homePageContentBody" : "large-homePageContentBody"}
                >
                <div className="large-homePageContentBodyMargin"/>
                <div className="finulab-createPredictionWrapper">
                    <div className="finulab-createCommunityHeader"
                            style={contentBodyWidth[1] ? 
                                {
                                    "position": "fixed",
                                    "top": "0px",
                                    "width": `${contentBodyWidth[0]}px`,
                                    "minWidth": `${contentBodyWidth[0]}px`,
                                    "maxWidth": `${contentBodyWidth[0]}px`,
                                    "borderBottom": "none"
                                } : 
                                {
                                    "borderBottom": "none"
                                }
                            }
                        >
                        <div className="profile-setUpEditProfileSettingsImageHeaderDesc"
                                style={{"marginLeft": "10px", "fontSize": "1.15rem"}}
                            >
                            <AssuredWorkloadSharp />&nbsp;
                            Create Event Market
                        </div>
                        <button className="profile-setUpEditProfileSettingsImageHeaderApplyBtn"
                                disabled={disableBtnsonSubmit || !loading}
                                onClick={() => createTheMarkets()}
                                style={{
                                    "fontSize": "1rem",
                                    "width": "100px", "minWidth": "100px", "maxWidth": "100px",
                                    "height": "30px", "minHeight": "30px", "maxHeight": "30px"
                                }}
                            >
                            {predictionSubmissionLoading ?
                                <BeatLoader 
                                    color='var(--secondary-bg-03)'
                                    size={5}
                                /> : `Submit`
                            }
                        </button>
                    </div>
                    {loading ? 
                        <div className="finulab-createPredictionContainer">
                            <div className="finulab-createPredictionheaderWrapper">
                                <div className="finulab-createPredictionHeaderEndsDate">
                                    End Date:&nbsp;&nbsp;
                                    <input type={"date"} 
                                        disabled={disableBtnsonSubmit}
                                        value={selectedEndDate}
                                        onChange={handleSelectedEndDateChange}
                                        className="priceHistory-datesInput"
                                        style={marketsCreationErrors["endDate"] === 1 && ((new Date(selectedEndDate) - today) / (1000 * 60 * 60 * 24)) < 7 ? {"border": "solid 1px var(--primary-red-09)"} : {}}
                                    /> 
                                </div>
                                <div className="prediction-createSelectaCategoryDetailContainer" ref={selectCategoryOptnsRef} style={selectCategoryDisplay ? {"display": "flex"} : {"display": "none"}}>
                                    {availableCategories.length === 0 ?
                                        null : 
                                        <>
                                            {availableCategories.map((category, i) => (
                                                    <button className="prediction-createSelectaCategoryBtn" 
                                                            key={`${i}`} 
                                                            disabled={disableBtnsonSubmit}
                                                            onClick={() => selectedCategoryToggle(i)}
                                                            style={
                                                                {
                                                                    borderBottom: i !== availableCategories.length - 1 ? "solid 1px var(--primary-bg-07)" : "none",
                                                                    color: selectedCategory["desc"] === category.desc ? "var(--primary-bg-10)" : "var(--primary-bg-01)",
                                                                    backgroundColor: selectedCategory["desc"] === category.desc ? "var(--primary-bg-01)" : "var(--secondary-bg-03)"
                                                                }
                                                            }
                                                        >
                                                        <img src={category["profileImage"]} alt="" className="prediction-createSelectaCategoryImg" />
                                                        {category.desc}
                                                    </button>
                                                ))
                                            }
                                        </>
                                    }
                                </div>
                            </div>
                            {marketsCreationErrors["category"] === 1 || marketsCreationErrors["endDate"] === 1 ?
                                <>
                                    {selectedCategory["desc"] === "select market" && ((new Date(selectedEndDate) - today) / (1000 * 60 * 60 * 24)) < 7 ?
                                        <div className="prediction-createPredictionErrorOccuredNotice" style={{"marginTop": "5px", "marginLeft": "-5px"}}>{`Please select a market and date (provide at least 7 days).`}</div> : 
                                        <>
                                            {selectedCategory["desc"] === "select market" ? 
                                                <div className="prediction-createPredictionErrorOccuredNotice" style={{"marginTop": "5px", "marginLeft": "-5px"}}>{`Please select a market.`}</div> : 
                                                <>
                                                    {((new Date(selectedEndDate) - today) / (1000 * 60 * 60 * 24)) < 7 ?
                                                        <div className="prediction-createPredictionErrorOccuredNotice" style={{"marginTop": "5px", "marginLeft": "-5px"}}>{`Please select a date (provide at least 7 days).`}</div> : null
                                                    }
                                                </>
                                            }
                                        </>
                                    }
                                </> : null
                            }
                            <div className="prediction-createaMarketSubmitContainer">
                                {predictionSubmissionError === 1 ?
                                    <div className="prediction-createPredictionErrorOccuredNotice" style={{"marginTop": "5px", "marginLeft": "-5px"}}>{`An error occured, please try again later.`}</div> : 
                                    <>
                                        {predictionSubmissionError === 2 ?
                                            <div className="prediction-createPredictionErrorOccuredNotice" style={{"marginTop": "5px", "marginLeft": "-5px"}}>{`Insufficient Finux balance on chain ${selectedChain} to create market.`}</div> : 
                                            <>
                                                {predictionSubmissionError === 3 ?
                                                    <div className="prediction-createPredictionErrorOccuredNotice" style={{"marginTop": "5px", "marginLeft": "-5px"}}>{`Please fill in missing inputs.`}</div> : 
                                                    <>
                                                        {predictionSubmissionError === 4 ?
                                                            <div className="prediction-createPredictionErrorOccuredNotice" style={{"marginTop": "5px", "marginLeft": "-5px", "color": "var(--primary-green-09)"}}>{`Successfully Created!`}</div> : null
                                                        }
                                                    </>
                                                }
                                            </>
                                        }
                                    </>
                                }
                            </div>
                            <div className="finulab-createPredictionHeaderWrapperBorderBottom"/>
                            <div className="finulab-createPredictionBody">
                                <div className="finulab-CreatePredictionHeaderCostDesc">
                                    Liquidity To Create:&nbsp;
                                    <span style={{"color": "var(--primary-bg-01)"}}>
                                        {prediction.outcomeType === "yes-or-no" ?
                                            <>
                                                {costFunction === 0 ? `0.0` : `${formatFiguresV2.format(costFunction)}`} FINUX
                                            </> : 
                                            <>
                                                {categoricalCostFunction === 0 ? `0.0` : `${formatFiguresV2.format(categoricalCostFunction)}`} FINUX
                                            </>
                                        }
                                    </span>
                                </div>
                                <div className="finulab-createPredictionCreatorWrapper">
                                    <img src={prediction.profileImage} alt="" className="finulab-createPredictionCreatorImg" />
                                    <div className="finulab-createPredictionCreatorDescriptionContainer">
                                        <span className="finulab-createPredictionCreatorFullDesc">
                                            {prediction.username}
                                            {user.verified ? 
                                                <Verified className="finulab-createPredictionCreatorFullDescIcon"/> : null
                                            }
                                        </span>
                                        <div className="finulab-createPredictionCreatorCategorynChainSelectDiv">
                                            <button className="large-marketPageCategoryOptnBtn" 
                                                    ref={selectCategoryBtnRef} 
                                                    disabled={disableBtnsonSubmit}
                                                    onClick={() => selectCategoryDisplayToggle()}
                                                    style={marketsCreationErrors["category"] === 1 && selectedCategory["desc"] === "select market" ? 
                                                        {"color": "var(--primary-bg-01)", "backgroundColor": "var(--secondary-bg-03)", "border": "solid 1px var(--primary-red-09)",
                                                            "boxShadow": "none", "border": "solid 1px var(--primary-bg-08)"
                                                        } : 
                                                        {"color": "var(--primary-bg-01)", "backgroundColor": "var(--secondary-bg-03)", "border": "solid 1px var(--primary-bg-06)",
                                                            "boxShadow": "none", "border": "solid 1px var(--primary-bg-08)"
                                                        }
                                                    }
                                                >
                                                <div className="large-marketPageCategoryOptnBtnImgContainer"
                                                        style={{"backgroundColor": "var(--secondary-bg-03)"}}
                                                    >
                                                    {selectedCategory["desc"] === "select market" ?
                                                        <div className="post-headerProfileImageNone"
                                                                style={{"background": "var(--secondary-bg-03)"}}
                                                            >
                                                            <img src="/assets/Favicon.png" alt="" className="large-homePageHeaderProfileImgNonUserMarkCopy" />
                                                        </div> : <img src={selectedCategory["profileImage"]} alt="" className="large-marketPageCategoryOptnBtnImg" />
                                                    }
                                                </div>
                                                <span className="large-marketPageCategoryOpntBtnDesc" style={{"alignItems": "center", "fontSize": "1rem", "marginRight": "10px"}}>
                                                    {selectedCategory["desc"] === "select market" ? 
                                                        `Select Market` : `${selectedCategory["desc"]}`
                                                    }
                                                </span>
                                                <ExpandMore style={{"marginRight": "5px"}}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <select
                                        value={`Chain ${selectedChain}`}
                                        onChange={selectedChainHandler}
                                        className="finulab-createPredictionCreateChainSelect"
                                    >
                                    {finux_chainOptns.map((chain_desc, index) => (
                                            <option value={chain_desc} key={`creation-chain-${index}`}>{chain_desc}</option>
                                        ))
                                    }
                                </select>
                                <div className="finulab-createPredictionDescriptionWrapper">
                                    <div className="finulab-createPredictionDescAvailableBalanceDesc">
                                        {walletDesc["balance"]["data"].some(wlt_desc => wlt_desc[0] === selectedChain) ?
                                            `Available: ${generalOpx.formatFiguresCrypto.format(walletDesc["balance"]["data"].filter(wlt_desc => wlt_desc[0] === selectedChain)[0][1])} FINUX`: 
                                            `Available: 0.00 FINUX`
                                        }
                                    </div> 
                                    <div className="main-loginInputCont"
                                            style={{"marginTop": "0", "marginBottom": "16px"}}
                                        >
                                        <DeviceUnknownSharp className="main-loginbodyInputIcon"/>
                                        <input type="text"
                                            name="predictiveQuestion"
                                            disabled={disableBtnsonSubmit}
                                            value={prediction.predictiveQuestion}
                                            onChange={predictionHandleChange}
                                            placeholder='Short Predictive Question'
                                            autoCapitalize='off'
                                            autoComplete='off'
                                            className="main-createAccountInput" 
                                            style={marketsCreationErrors["predictiveQuestion"] === 1 && prediction.predictiveQuestion.trim() === "" ?
                                                {
                                                    "border": "solid 1px var(--primary-red-09)", "fontSize": "1rem", "height": "35px", "minHeight": "35px", "maxHeight": "35px"
                                                } : 
                                                {
                                                    "fontSize": "1rem", "height": "35px", "minHeight": "35px", "maxHeight": "35px"
                                                }
                                            }
                                        />
                                    </div>
                                    {prediction.predictiveImage === "" || predictiveImageLoading ?
                                        <>
                                            <input 
                                                type={"file"}
                                                accept="image/*" 
                                                onChange={predictiveImageHandler}
                                                disabled={predictiveImageLoading || disableBtnsonSubmit}
                                                id="prediction-predictiveImageHandler" 
                                            />
                                            <label htmlFor="prediction-predictiveImageHandler" 
                                                    className="prediction-createAPredictionImage" 
                                                    style={!predictiveImageLoading && marketsCreationErrors["predictiveImage"] === 1 &&  prediction.predictiveImage.trim() === "" ? {"border": "solid 1px var(--primary-red-09)"} : {}}
                                                >
                                                {predictiveImageLoading ? 
                                                    <BeatLoader
                                                        color='var(--primary-bg-01)'
                                                        cssOverride={override}
                                                        loading={true}
                                                        size={5}
                                                    /> : 
                                                    <>
                                                        <div className="prediction-createAPredictionImageNoticeContainer">
                                                            <Add className="prediction-createAPredictionImageNoticeIcon"/>
                                                        </div>
                                                        <span className="prediction-createAPredictionImageNoticeDesc">add an image</span>
                                                    </>
                                                }
                                            </label>
                                        </> : 
                                        <div className="prediction-descriptionImgCreateContainer">
                                            <img src={prediction.predictiveImage} alt="" onLoad={predictiveImageonLoadHandler} className="prediction-descriptionCreateImg"/>
                                            {hasPredictiveImageRendered ? 
                                                <>
                                                    <input 
                                                        type={"file"}
                                                        accept="image/*" 
                                                        onChange={predictiveImageHandler}
                                                        disabled={predictiveImageLoading || disableBtnsonSubmit}
                                                        id="prediction-predictiveChangeImageHandler" 
                                                    />
                                                    <label htmlFor="prediction-predictiveChangeImageHandler" className="prediction-descriptionImgCreateChangeLabel">
                                                        <PhotoCamera className='prediction-descriptionImgCreateChangeLabelIcon'/>
                                                    </label>
                                                </> : null
                                            }
                                        </div>
                                    }
                                </div>
                                {predictiveImageError === 1 || predictiveImageError === 2 || predictiveImageError === 3 ?
                                    <>
                                        {predictiveImageError === 1 ?
                                            <div className="prediction-createPredictionErrorOccuredNotice" style={{"marginTop": "5px"}}>{`Image is corrupted, please select another.`}</div> : 
                                            <>
                                                {predictiveImageError === 2 ?
                                                    <div className="prediction-createPredictionErrorOccuredNotice" style={{"marginTop": "5px"}}>{`Image must be less than 5MB.`}</div> : 
                                                    <>
                                                        {predictiveImageError === 3 ?
                                                            <div className="prediction-createPredictionErrorOccuredNotice" style={{"marginTop": "5px"}}>{`An error occured, please try again later.`}</div> : null
                                                        }
                                                    </>
                                                }
                                            </>
                                        }
                                    </> : 
                                    <>
                                        {marketsCreationErrors["predictiveQuestion"] === 1 || marketsCreationErrors["predictiveImage"] === 1 ?
                                            <>
                                                {prediction.predictiveQuestion.trim() === "" && prediction.predictiveImage.trim() === "" ?
                                                    <div className="prediction-createPredictionErrorOccuredNotice" style={{"marginTop": "5px"}}>{`Please input a predictive question and image.`}</div> : 
                                                    <>
                                                        {prediction.predictiveQuestion.trim() === "" ?
                                                            <div className="prediction-createPredictionErrorOccuredNotice" style={{"marginTop": "5px"}}>{`Please input a predictive question.`}</div> : 
                                                            <>
                                                                {prediction.predictiveImage.trim() === "" ?
                                                                    <div className="prediction-createPredictionErrorOccuredNotice" style={{"marginTop": "5px"}}>{`Please input a predictive image.`}</div> : null
                                                                }
                                                            </>
                                                        }
                                                    </>
                                                }
                                            </> : null
                                        }
                                    </>
                                }
                                <div className="finulab-createPredictionOutcomesWrapper">
                                    <div className="finulab-createPredictionOutcomesHeader"/>
                                    <div className="finulab-createPredictionOutcomesActualHeader">
                                        Type:
                                        <div className="prediction-outcomesSelectionBtnsContainer">
                                            <button 
                                                    disabled={disableBtnsonSubmit}
                                                    onClick={() => outcomeTypeToggle("yes-or-no")}
                                                    className={prediction.outcomeType === "yes-or-no" ? "prediction-outcomesSelectedBtn" : "prediction-outcomesUnselectedBtn"} style={{"marginRight": "10px"}}
                                                >
                                                Yes or No
                                            </button>
                                            <button 
                                                    disabled={disableBtnsonSubmit}
                                                    onClick={() => outcomeTypeToggle("categorical")}
                                                    className={prediction.outcomeType === "categorical" ? "prediction-outcomesSelectedBtn" : "prediction-outcomesUnselectedBtn"}
                                                >
                                                Categorical
                                            </button>
                                        </div>
                                    </div>
                                    <div className="finulab-createPredictionOutcomesHeaderV2"/>
                                    {prediction.outcomeType === "yes-or-no" ? 
                                        <div className="finulab-predictionOutcomeSpecificContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                            <div className="finulab-createPredictionspecificOutcomePurchaseOptionsContainer">
                                                <div className="prediction-createaMarketQuantitySpeciferOuterCont">
                                                    <div className="prediction-createaMarketQuantitySpecifierInnerContHeader">Quantity Yes</div>
                                                    <div className="prediction-createaMarketQuantitySpecifierInnerCont" 
                                                            style={marketsCreationErrors[`yn-quantities`] === 1 &&  markets[0]["quantityYes"] + markets[0]["quantityNo"] === 0 ? 
                                                                {"border": "solid 1px var(--primary-red-09)"} : {}
                                                            }
                                                        >
                                                        <button className="prediction-marketPurchaseAmountAdjustContainer"
                                                                disabled={disableBtnsonSubmit}
                                                                onClick={() => marketPlusMinusChangeHandler(0, "minus", "quantityYes")}
                                                            >
                                                            <Remove className="prediction-marketPurchaseAmountAdjustIcon"/>
                                                        </button>
                                                        <input type={"text"} 
                                                            name='quantityYes-0'
                                                            disabled={disableBtnsonSubmit}
                                                            value={markets[0]["quantityYes"]}
                                                            onChange={marketChangeHandler}
                                                            placeholder='0'
                                                            className="prediction-marketPurchaseAmountSpecifyDirect" 
                                                        />
                                                        <button className="prediction-marketPurchaseAmountAdjustContainer" 
                                                                disabled={disableBtnsonSubmit}
                                                                style={{"marginLeft": "auto"}}
                                                                onClick={() => marketPlusMinusChangeHandler(0, "plus", "quantityYes")}
                                                            >
                                                            <Add className="prediction-marketPurchaseAmountAdjustIcon"/>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="prediction-createaMarketQuantitySpeciferOuterCont">
                                                    <div className="prediction-createaMarketQuantitySpecifierInnerContHeader">Quantity No</div>
                                                    <div className="prediction-createaMarketQuantitySpecifierInnerCont" 
                                                            style={marketsCreationErrors[`yn-quantities`] === 1 &&  markets[0]["quantityYes"] + markets[0]["quantityNo"] === 0 ? 
                                                                {"border": "solid 1px var(--primary-red-09)"} : {}
                                                            }
                                                        >
                                                        <button className="prediction-marketPurchaseAmountAdjustContainer"
                                                                disabled={disableBtnsonSubmit}
                                                                onClick={() => marketPlusMinusChangeHandler(0, "minus", "quantityNo")}
                                                            >
                                                            <Remove className="prediction-marketPurchaseAmountAdjustIcon"/>
                                                        </button>
                                                        <input type={"text"} 
                                                            name='quantityNo-0'
                                                            disabled={disableBtnsonSubmit}
                                                            value={markets[0]["quantityNo"]}
                                                            onChange={marketChangeHandler}
                                                            placeholder='0'
                                                            className="prediction-marketPurchaseAmountSpecifyDirect" 
                                                        />
                                                        <button className="prediction-marketPurchaseAmountAdjustContainer" 
                                                                style={{"marginLeft": "auto"}}
                                                                disabled={disableBtnsonSubmit}
                                                                onClick={() => marketPlusMinusChangeHandler(0, "plus", "quantityNo")}
                                                            >
                                                            <Add className="prediction-marketPurchaseAmountAdjustIcon"/>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="prediction-createaMarketQuantitySpecifierInnerContHeader" style={{"marginTop": "24px"}}>Rules</div>
                                            <textarea name="rules-0" id="" 
                                                disabled={disableBtnsonSubmit}
                                                onChange={marketChangeHandler}
                                                value={markets[0]["rules"]}
                                                placeholder='what will determine whether the outcome is yes or no?'
                                                className="prediction-createaMarketRulesSpecification"
                                                style={marketsCreationErrors[`yn-rules`] === 1 && markets[0]["rules"].trim() === "" ? {"border": "solid 1px var(--primary-red-09)"} : {}}
                                            ></textarea>
                                            <div className="prediction-createaMarketSubmitContainer" 
                                                    style={{"paddingBottom": "3px", "fontWeight": "bold", "fontSize": "1rem", "color": "var(--primary-bg-01)"}}
                                                >
                                                Yes Probability:&nbsp;&nbsp; {secondaryFormatFigures.format(markets[0]["probabilityYes"] * 100)}%
                                            </div>
                                            {marketsCreationErrors[`yn-quantities`] === 1 ||  marketsCreationErrors[`yn-rules`] === 1 ?
                                                <>
                                                    {markets[0]["rules"].trim() === "" && markets[0]["quantityYes"] + markets[0]["quantityNo"] === 0 ?
                                                        <div className="prediction-createPredictionOutcomeErrorOccuredNotice">{`Please specify the quantities and rules.`}</div> : 
                                                        <>
                                                            {markets[0]["rules"].trim() === "" ?
                                                                <div className="prediction-createPredictionOutcomeErrorOccuredNotice">{`Please specify the rules.`}</div> : 
                                                                <>
                                                                    {markets[0]["quantityYes"] + markets[0]["quantityNo"] === 0 ?
                                                                        <div className="prediction-createPredictionOutcomeErrorOccuredNotice">{`Please specify the quantities.`}</div> : null
                                                                    }
                                                                </>
                                                            }
                                                        </>
                                                    }
                                                </> : null
                                            }
                                        </div> : 
                                        <>
                                            {categoricalMarkets.map((categoricalMarket, index) => (
                                                    <div className="prediction-outcomeSpecificContainer" style={{"borderBottom": "solid 1px var(--primary-bg-07)"}} key={`${index}`}>
                                                        <div className="prediction-outcomeSpecificHeaderContainer">
                                                            <input 
                                                                name={`${index}`}
                                                                type={"file"}
                                                                accept="image/*" 
                                                                onChange={outcomeImageHandler}
                                                                disabled={outcomeImageLoading[index] || disableBtnsonSubmit}
                                                                id={`prediction-outcomeImageHandlerId-${index}`} 
                                                            />
                                                            {categoricalMarkets[index]["outcomeImage"] === "" || outcomeImageLoading[index] ? 
                                                                <label htmlFor={`prediction-outcomeImageHandlerId-${index}`}
                                                                        className="prediction-outcomeSummarySupportnonImageUpload"
                                                                        style={!outcomeImageLoading[index] && marketsCreationErrors[`c-${index}-outcomeImage`] === 1 && categoricalMarkets[index]["outcomeImage"].trim() === "" ? 
                                                                            {"width": "34px", "minWidth": "34px", "maxWidth": "34px", "height": "34px", "minHeight": "34px", "maxHeight": "34px", "border": "solid 1px var(--primary-red-09)"} : {}
                                                                        }
                                                                    >
                                                                    {outcomeImageLoading[index] ?
                                                                        <BeatLoader
                                                                            color='var(--primary-bg-01)'
                                                                            cssOverride={override}
                                                                            loading={true}
                                                                            size={3}
                                                                        /> : 
                                                                        <div className="prediction-outcomeSummarySupportnonImageUploadIconContainer">
                                                                            <Add className="prediction-outcomeSummarySupportnonImageUploadIconContainerIcon"/>
                                                                        </div>
                                                                    }
                                                                </label> :
                                                                <img src={categoricalMarkets[index]["outcomeImage"]} alt="" className="prediction-outcomeSummarySupportImage" />
                                                            }
                                                            <div className="prediction-createaMarketOptionDescriptionandImageOptionsContainer">
                                                                <input type="text" 
                                                                    name={`outcome-${index}`}
                                                                    disabled={disableBtnsonSubmit}
                                                                    value={categoricalMarkets[index]["outcome"]}
                                                                    onChange={marketChangeHandler}
                                                                    placeholder={`Outcome No. ${index + 1}`}
                                                                    className="prediction-createaMarketInputOutcomeSpecify"
                                                                    style={marketsCreationErrors[`c-${index}-outcome`] === 1 && categoricalMarkets[index]["outcome"].trim() === "" ? 
                                                                        {"border": "solid 1px var(--primary-red-09)"} : {}
                                                                    }
                                                                />
                                                                <label htmlFor={`prediction-outcomeImageHandlerId-${index}`} className="prediction-createaMarketChangeOutcomesProfileImageBtn">
                                                                    {categoricalMarkets[index]["outcomeImage"] === "" ?
                                                                        `Add Image` : `Change Image`
                                                                    }
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="prediction-specificOutcomePurchaseOptionsContainer">
                                                            <div className="prediction-createaMarketQuantitySpeciferOuterCont">
                                                                <div className="prediction-createaMarketQuantitySpecifierInnerContHeader">Quantity Yes</div>
                                                                <div className="prediction-createaMarketQuantitySpecifierInnerCont" 
                                                                        style={marketsCreationErrors[`c-${index}-quantities`] === 1 && categoricalMarkets[index]["quantityYes"] + categoricalMarkets[index]["quantityNo"] === 0 ? 
                                                                            {"border": "solid 1px var(--primary-red-09)"} : {}
                                                                        }
                                                                    >
                                                                    <button className="prediction-marketPurchaseAmountAdjustContainer"
                                                                            disabled={disableBtnsonSubmit}
                                                                            onClick={() => marketPlusMinusChangeHandler(index, "minus", "quantityYes")}
                                                                        >
                                                                        <Remove className="prediction-marketPurchaseAmountAdjustIcon"/>
                                                                    </button>
                                                                    <input type={"text"} 
                                                                        name={`quantityYes-${index}`}
                                                                        disabled={disableBtnsonSubmit}
                                                                        value={categoricalMarkets[index]["quantityYes"]}
                                                                        onChange={marketChangeHandler}
                                                                        placeholder='0'
                                                                        className="prediction-marketPurchaseAmountSpecifyDirect" 
                                                                    />
                                                                    <button className="prediction-marketPurchaseAmountAdjustContainer" 
                                                                            style={{"marginLeft": "auto"}}
                                                                            disabled={disableBtnsonSubmit}
                                                                            onClick={() => marketPlusMinusChangeHandler(index, "plus", "quantityYes")}
                                                                        >
                                                                        <Add className="prediction-marketPurchaseAmountAdjustIcon"/>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="prediction-createaMarketQuantitySpeciferOuterCont">
                                                                <div className="prediction-createaMarketQuantitySpecifierInnerContHeader">Quantity No</div>
                                                                <div className="prediction-createaMarketQuantitySpecifierInnerCont" 
                                                                        style={marketsCreationErrors[`c-${index}-quantities`] === 1 && categoricalMarkets[index]["quantityYes"] + categoricalMarkets[index]["quantityNo"] === 0 ? 
                                                                            {"border": "solid 1px var(--primary-red-09)"} : {}
                                                                        }
                                                                    >
                                                                    <button className="prediction-marketPurchaseAmountAdjustContainer"
                                                                            disabled={disableBtnsonSubmit}
                                                                            onClick={() => marketPlusMinusChangeHandler(index, "minus", "quantityNo")}
                                                                        >
                                                                        <Remove className="prediction-marketPurchaseAmountAdjustIcon"/>
                                                                    </button>
                                                                    <input type={"text"} 
                                                                        name={`quantityNo-${index}`}
                                                                        disabled={disableBtnsonSubmit}
                                                                        value={categoricalMarkets[index]["quantityNo"]}
                                                                        onChange={marketChangeHandler}
                                                                        placeholder='0'
                                                                        className="prediction-marketPurchaseAmountSpecifyDirect" 
                                                                    />
                                                                    <button className="prediction-marketPurchaseAmountAdjustContainer" 
                                                                            disabled={disableBtnsonSubmit}
                                                                            style={{"marginLeft": "auto"}}
                                                                            onClick={() => marketPlusMinusChangeHandler(index, "plus", "quantityNo")}
                                                                        >
                                                                        <Add className="prediction-marketPurchaseAmountAdjustIcon"/>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="prediction-createaMarketQuantitySpecifierInnerContHeader" style={{"marginTop": "24px"}}>Rules</div>
                                                        <textarea name={`rules-${index}`} id="" 
                                                            value={categoricalMarkets[index]["rules"]}
                                                            onChange={marketChangeHandler}
                                                            disabled={disableBtnsonSubmit}
                                                            placeholder={`What will determine whether the outcome no. ${index + 1} is yes or no?`}
                                                            className="prediction-createaMarketRulesSpecification"
                                                            style={marketsCreationErrors[`c-${index}-rules`] === 1 && categoricalMarkets[index]["rules"].trim() === "" ? {"border": "solid 1px var(--primary-red-09)"} : {}}
                                                        ></textarea>
                                                        <div className="prediction-createaMarketSubmitContainer" 
                                                                style={{"paddingBottom": "3px", "fontWeight": "bold", "fontSize": "1rem", "color": "var(--primary-bg-01)"}}
                                                            >
                                                            Yes probability: {secondaryFormatFigures.format(categoricalMarkets[index]["probabilityYes"] * 100)}%
                                                            {categoricalMarkets.length <= 1 ? 
                                                                null : 
                                                                <button className="prediction-createDeleteOutcomeBtn" 
                                                                        disabled={disableBtnsonSubmit}
                                                                        onClick={() => categoricalMarketDelete(index)}
                                                                    >
                                                                    <Delete className="prediction-createDeleteOutcomeBtnIcon" />
                                                                    Delete
                                                                </button> 
                                                            }
                                                        </div>
                                                        {outcomeImageError[index] === 1 || outcomeImageError[index] === 2 || outcomeImageError[index] === 3 ?
                                                            <>
                                                                {outcomeImageError[index] === 1 ? 
                                                                    <div className="prediction-createPredictionOutcomeErrorOccuredNotice">{`Image is corrupted, please select another.`}</div> : 
                                                                    <>
                                                                        {outcomeImageError[index] === 2 ? 
                                                                            <div className="prediction-createPredictionOutcomeErrorOccuredNotice">{`Image must be less than 5MB.`}</div> : 
                                                                            <>
                                                                                {outcomeImageError[index] === 3 ? 
                                                                                    <div className="prediction-createPredictionOutcomeErrorOccuredNotice">{`An error occured, please try again later.`}</div> : null
                                                                                }
                                                                            </>
                                                                        }
                                                                    </>
                                                                }
                                                            </> : 
                                                            <>
                                                                {marketsCreationErrors[`c-${index}-outcomeImage`] === 1 ||  
                                                                    marketsCreationErrors[`c-${index}-outcome`] === 1 || marketsCreationErrors[`c-${index}-quantities`] === 1 || marketsCreationErrors[`c-${index}-rules`] === 1 ?
                                                                    <>
                                                                        {categoricalMarkets[index]["outcomeImage"].trim() === "" ||
                                                                            categoricalMarkets[index]["outcome"].trim() === "" || categoricalMarkets[index]["quantityYes"] + categoricalMarkets[index]["quantityNo"] === 0 || categoricalMarkets[index]["rules"].trim() === "" ?
                                                                            <div className="prediction-createPredictionOutcomeErrorOccuredNotice">{`Please add an image and fill out all inputs.`}</div> : null
                                                                        }
                                                                    </> : null
                                                                }
                                                            </>
                                                        }
                                                    </div>
                                                ))
                                            }
                                            <div className="prediction-outcomeSpecificContainer" style={{"marginTop": "8px", "borderBottom": "solid 1px var(--primary-bg-07)"}}>
                                                <button className="prediction-viewAllBtn" 
                                                        disabled={disableBtnsonSubmit}
                                                        onClick={() => categoricalAddOutcomeToggle()}
                                                        style={{"marginLeft": "auto", "marginRight": "auto"}}
                                                    >
                                                    Add an Outcome
                                                </button>
                                            </div>
                                        </>
                                    }
                                    <div className="prediction-createaMarketQuantitySpecifierInnerContHeader" style={{"marginTop": "16px"}}>Official Validation Source</div> 
                                    <input type="text" 
                                        disabled={disableBtnsonSubmit}
                                        name="officialValidationSource"
                                        onChange={predictionHandleChange}
                                        value={prediction.officialValidationSource}
                                        placeholder='Url which helps validate the outcome'
                                        className="prediction-createaMarketValidationLinkSpecifierInput" 
                                        style={marketsCreationErrors[`validationLink`] === 1 && prediction.officialValidationSource.trim() === "" ? {"border": "solid 1px var(--primary-red-09)"} : {}}
                                    />
                                    {marketsCreationErrors[`validationLink`] === 1 && prediction.officialValidationSource.trim() === "" ?
                                        <div className="prediction-createPredictionOutcomeErrorOccuredNotice" style={{"marginTop": "5px", "marginBottom": "0px"}}>{`Please add an image and fill out all inputs.`}</div> : null
                                    }
                                </div>
                            </div>
                        </div> : null
                    }
                </div>
            </div>
        </div>
    )
}