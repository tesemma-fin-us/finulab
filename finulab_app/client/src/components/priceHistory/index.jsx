import './index.css';

import {CSVLink} from 'react-csv';
import {useState, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {format, fromUnixTime, getUnixTime, parse} from 'date-fns';
import {Update, BrowserUpdated, ChevronLeft, ChevronRight, Check, Close, Expand} from '@mui/icons-material';

import {
    updateStockPriceHistoryData, 
    updateStockPriceHistoryFrom, 
    updateStockPriceHistoryTo, 
    updateStockPriceHistoryIndex, 
    selectStockPriceHistory
} from '../../reduxStore/stockPriceHistory';
import generalOpx from '../../functions/generalFunctions';

export default function PriceHistory(props) {
    const dispatch = useDispatch();
    const priceHistoryState = useSelector(selectStockPriceHistory);
    
    const dateSelectionHandler = (e) => {
        const {name, value} = e.target;
        if(name === "from") {
            dispatch(
                updateStockPriceHistoryFrom(value)
            );
        } else if(name === "to") {
            dispatch(
                updateStockPriceHistoryTo(value)
            );
        }
    }

    const pullPriceHistory = async () => {
        if(`${props.asset}`.slice(0, 1) === "S") {
            const parsed_dtTo = parse(priceHistoryState["to"], 'yyyy-MM-dd', new Date());
            const parsed_dtFrom = parse(priceHistoryState["from"], 'yyyy-MM-dd', new Date());

            const dt_toUnix = parsed_dtTo.getTime();
            const dt_fromUnix = parsed_dtFrom.getTime();

            const dt_toUnix_s = Math.floor(dt_toUnix / 1000) + (86400 - 1);
            const dt_fromUnix_s = Math.floor(dt_fromUnix / 1000);

            await generalOpx.axiosInstance.put(`/stockDataFeed/price-history`, 
                {
                    "from": dt_fromUnix_s,
                    "to": dt_toUnix_s,
                    "symbol": `${props.asset}`.slice(3, `${props.asset}`.length),
                    "resolution": "1D"
                }
            ).then(
                (response) => {
                    if(response.data["status"] === "success") {
                        if(response.data["data"]["resultsCount"] > 0) {
                            let bars = [];
                            for(let i = 0; i < response.data["data"]["results"].length; i++) {
                                if(
                                    isNaN(response.data["data"]["results"][i]["t"]) ||
                                    isNaN(response.data["data"]["results"][i]["l"]) || 
                                    isNaN(response.data["data"]["results"][i]["h"]) ||
                                    isNaN(response.data["data"]["results"][i]["o"]) ||
                                    isNaN(response.data["data"]["results"][i]["c"]) ||
                                    isNaN(response.data["data"]["results"][i]["v"])
                                ) {continue;} else {
                                    bars.push(
                                        {
                                            "date": format(fromUnixTime(response.data["data"]["results"][i]["t"] / 1000), "M-dd-yyyy"),
                                            "open": response.data["data"]["results"][i]["o"],
                                            "high": response.data["data"]["results"][i]["h"],
                                            "low": response.data["data"]["results"][i]["l"],
                                            "close": response.data["data"]["results"][i]["c"],
                                            "volume": response.data["data"]["results"][i]["v"]
                                        }
                                    );
                                }
                            }
                            
                            dispatch(
                                updateStockPriceHistoryData(
                                    {
                                        "symbol": `${props.asset}`,
                                        "data": bars,
                                        "dataLoading": false
                                    }
                                )
                            );
                            if(priceHistoryState["index"] !== 0) {
                                dispatch(
                                    updateStockPriceHistoryIndex(0)
                                );
                            }
                        }
                    }
                }
            );
        } else if(`${props.asset}`.slice(0, 1) === "C") {
            const parsed_dtTo = parse(priceHistoryState["to"], 'yyyy-MM-dd', new Date());
            const parsed_dtFrom = parse(priceHistoryState["from"], 'yyyy-MM-dd', new Date());

            const dt_toUnix = parsed_dtTo.getTime();
            const dt_fromUnix = parsed_dtFrom.getTime();

            const dt_toUnix_s = Math.floor(dt_toUnix / 1000) + (86400 - 1);
            const dt_fromUnix_s = Math.floor(dt_fromUnix / 1000);

            await generalOpx.axiosInstance.put(`/crypto-market-data/historical`, 
                {
                    "from": dt_fromUnix_s,
                    "to": dt_toUnix_s,
                    "symbol": `${props.asset}`.slice(3, `${props.asset}`.length)
                }
            ).then(
                (response) => {
                    if(response.data["status"] === "success") {
                        if(response.data["data"].length > 0) {
                            let bars = [];
                            for(let i = 0; i < response.data["data"].length; i++) {
                                if(
                                    isNaN(response.data["data"][i]["t"]) ||
                                    isNaN(response.data["data"][i]["l"]) || 
                                    isNaN(response.data["data"][i]["h"]) ||
                                    isNaN(response.data["data"][i]["o"]) ||
                                    isNaN(response.data["data"][i]["c"]) ||
                                    isNaN(response.data["data"][i]["v"])
                                ) {continue;} else {
                                    bars.push(
                                        {
                                            "date": format(fromUnixTime(response.data["data"][i]["t"] / 1000), "M-dd-yyyy"),
                                            "open": response.data["data"][i]["o"],
                                            "high": response.data["data"][i]["h"],
                                            "low": response.data["data"][i]["l"],
                                            "close": response.data["data"][i]["c"],
                                            "volume": response.data["data"][i]["v"]
                                        }
                                    );
                                }
                            }
                            
                            dispatch(
                                updateStockPriceHistoryData(
                                    {
                                        "symbol": `${props.asset}`,
                                        "data": bars,
                                        "dataLoading": false
                                    }
                                )
                            );
                            if(priceHistoryState["index"] !== 0) {
                                dispatch(
                                    updateStockPriceHistoryIndex(0)
                                );
                            }
                        }
                    }
                }
            );
        }
    }
    useEffect(() => {
        if(priceHistoryState["priceHistory"]["data"].length === 0) {
            pullPriceHistory()
        } else {
            if(priceHistoryState["priceHistory"]['symbol'] !== `${props.asset}`) {
                dispatch(
                    updateStockPriceHistoryData(
                        {
                            "symbol": "",
                            "data": [],
                            "dataLoading": true
                        }
                    )
                );
                pullPriceHistory()
            }
        }
    }, [props]);

    const priceHistoryIndexUpdate = (type, selection) => {
        if(!(priceHistoryState["priceHistory"]["dataLoading"] || priceHistoryState["priceHistory"]["data"].length === 0)) {
            let currentIndex = priceHistoryState["index"];

            if(type === "back" && currentIndex > 0) {
                dispatch(
                    updateStockPriceHistoryIndex(currentIndex - 1)
                );
            } else if(type === "forward" && currentIndex < (Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15) - 1)) {
                dispatch(
                    updateStockPriceHistoryIndex(currentIndex + 1)
                );
            } else if(type === "set") {
                dispatch(
                    updateStockPriceHistoryIndex(selection)
                );
            }
        }
    }

    const [priceHistoryActionStat, setPriceHistoryActionStat] = useState(0)
    const updatePriceHisitory = async () => {
        const now = new Date();
        const nowUnix = getUnixTime(now);

        const parsed_dtTo = parse(priceHistoryState["to"], 'yyyy-MM-dd', new Date());
        const parsed_dtFrom = parse(priceHistoryState["from"], 'yyyy-MM-dd', new Date());

        const dt_toUnix = parsed_dtTo.getTime();
        const dt_fromUnix = parsed_dtFrom.getTime();

        const dt_toUnix_s = Math.floor(dt_toUnix / 1000) + (86400 - 1);
        const dt_fromUnix_s = Math.floor(dt_fromUnix / 1000);

        if(dt_fromUnix_s >= nowUnix && dt_toUnix_s >= nowUnix) {
            setPriceHistoryActionStat(2);

            setTimeout(() => {
                setPriceHistoryActionStat(0);
            }, 2500);
        } else if(dt_fromUnix_s > dt_toUnix_s) {
            setPriceHistoryActionStat(3);

            setTimeout(() => {
                setPriceHistoryActionStat(0);
            }, 2500);
        } else if(priceHistoryState["from"] === priceHistoryState["to"]) {
            setPriceHistoryActionStat(4);

            setTimeout(() => {
                setPriceHistoryActionStat(0);
            }, 2500);
        } else {
            let stockPriceHistoryDataFunction = [...priceHistoryState["priceHistory"]["data"]]
            dispatch(
                updateStockPriceHistoryData(
                    {
                        "symbol": `${props.asset}`,
                        "data": stockPriceHistoryDataFunction,
                        "dataLoading": true
                    }
                )
            );

            pullPriceHistory();
        }
    }

    const csvHeaders = [
        {label: "Date", key: "date" },
        {label: "Open", key: "open" },
        {label: "High", key: "high" },
        {label: "Low", key: "low" },
        {label: "Close", key: "close" },
        {label: "Volume", key: "volume" },
    ];

    const [priceHistoryHeight, setPriceHistoryHeight] = useState("20px");
    const priceHistoryHeightToggle = () => {
        priceHistoryHeight === "20px" ? setPriceHistoryHeight("630px") : setPriceHistoryHeight("20px");
    }

    return(
        <div className="large-stocksPageMoreDataPriceHistoryModContainer" 
             style={{"height": `${priceHistoryHeight}`, "minHeight": `${priceHistoryHeight}`, "maxHeight": `${priceHistoryHeight}`}}
            >
            <div className="large-stocksPageMoreDataAboutTitle" style={{"borderBottom":"none"}}>
                Price History
                <button className="large-stocksPageMoreDataAboutTitleExpander"
                        onClick={() => priceHistoryHeightToggle()}
                    >
                    <Expand className="large-stocksPageMoreDataAboutTitleExpanderIcon"/>
                </button>
            </div>
            <div className="large-stocksPageMoreDataAboutForPriceHistoryTitle">
                <div className="priceHistory-datesContainer">
                    <div className="priceHistory-datesInputInnerContainer">
                        <span className="priceHistory-datesInputDesc">From</span>
                        <input type="date" 
                            name={"from"}
                            onChange={dateSelectionHandler}
                            value={priceHistoryState["from"]}
                            className="priceHistory-datesInput" 
                        />
                    </div>
                    <span className='priceHistory-datesInputDivider'>•</span>
                    <div className="priceHistory-datesInputInnerContainer">
                        <span className="priceHistory-datesInputDesc">To</span>
                        <input type="date" 
                            name={"to"}
                            onChange={dateSelectionHandler}
                            value={priceHistoryState["to"]}
                            className="priceHistory-datesInput" 
                        />
                    </div>
                    <button className="priceHistory-datesBtn"
                            disabled={!(priceHistoryActionStat === 0) || priceHistoryState["priceHistory"]["dataLoading"]}
                            onClick={() => updatePriceHisitory()}
                        >
                        <Update className="priceHistory-datesBtnIcon" />
                    </button>
                    <button className="priceHistory-csvExportBtn">
                        <CSVLink
                                headers={csvHeaders}
                                data={priceHistoryState["priceHistory"]["data"]}
                                filename={`${priceHistoryState["priceHistory"]['symbol']}-price_history.csv`}
                            >
                            <BrowserUpdated className="priceHistory-csvExportBtnIcon" />
                        </CSVLink>
                    </button>
                </div>
                <div className="priceHistory-noticeProvider"
                        style={priceHistoryActionStat === 0 ?
                            {"transform": "translateX(calc(100% + 20px))"} : {"transform": "translateX(0px)"}
                        }
                    >
                    {priceHistoryActionStat === 1 ?
                        <>
                            <Check className='large-stocksAddToWatchlistBtnFourthIcon'/>
                            <span style={{"fontWeight": "500"}}>{symbol}</span>&nbsp;price history&nbsp;<span style={{"fontWeight": "500"}}>exported</span>
                        </> : 
                        <>
                            {priceHistoryActionStat === 2 ?
                                <>
                                    <Close className='large-stocksAddToWatchlistBtnFifthIcon' style={{"color": "var(--primary-red-09)"}}/>
                                    <span style={{"fontWeight": "500"}}>time frame</span>&nbsp;cannot be in the future
                                </> : 
                                <>
                                    {priceHistoryActionStat === 3 ?
                                        <>
                                            <Close className='large-stocksAddToWatchlistBtnFifthIcon' style={{"color": "var(--primary-red-09)"}}/>
                                            <span style={{"fontWeight": "500"}}>from date</span>&nbsp;must be less than&nbsp;<span style={{"fontWeight": "500"}}>to date</span>
                                        </> : 
                                        <>
                                            {priceHistoryActionStat === 4 ?
                                                <>
                                                    <Close className='large-stocksAddToWatchlistBtnFifthIcon' style={{"color": "var(--primary-red-09)"}}/>
                                                    <span style={{"fontWeight": "500"}}>from date</span>&nbsp;cannot equal&nbsp;<span style={{"fontWeight": "500"}}>to date</span>
                                                </> : null
                                            }
                                        </>
                                    }
                                </>
                            }
                        </>
                    }
                </div>
            </div>
            <div className="priceHistory-header" style={{"marginTop": "7px"}}>
                <div className="priceHistory-headerDateColumn">
                    <p className="priceHistory-headerColumnDesc">Date</p>
                </div>
                <div className="priceHistory-headerColumn">
                    <p className="priceHistory-headerColumnDesc">Open</p>
                </div>
                <div className="priceHistory-headerColumn">
                    <p className="priceHistory-headerColumnDesc">High</p>
                </div>
                <div className="priceHistory-headerColumn">
                    <p className="priceHistory-headerColumnDesc">Low</p>
                </div>
                <div className="priceHistory-headerColumn">
                    <p className="priceHistory-headerColumnDesc">Close</p>
                </div>
                <div className="priceHistory-headerColumn">
                    <p className="priceHistory-headerColumnDesc">Volume</p>
                </div>
            </div>
            <div className="priceHistory-headersContainer">
                {priceHistoryState["priceHistory"]["dataLoading"] ?
                    <>
                        {Array(15).fill(0).map((desc, index) => (
                                <div className="priceHistory-header" key={`stk-pg-pH-${index}`}>
                                    <div className="priceHistory-headerDateColumn">
                                        <div className="priceHistory-headerColumnDescLoading"/>
                                    </div>
                                    <div className="priceHistory-headerColumn">
                                        <div className="priceHistory-headerBodyDescLoading"/>
                                    </div>
                                    <div className="priceHistory-headerColumn">
                                        <div className="priceHistory-headerBodyDescLoading"/>
                                    </div>
                                    <div className="priceHistory-headerColumn">
                                        <div className="priceHistory-headerBodyDescLoading"/>
                                    </div>
                                    <div className="priceHistory-headerColumn">
                                        <div className="priceHistory-headerBodyDescLoading"/>
                                    </div>
                                    <div className="priceHistory-headerColumn">
                                        <div className="priceHistory-headerBodyDescLoading"/>
                                    </div>
                                </div>
                            ))
                        }
                    </> :
                    <>
                        {priceHistoryState["priceHistory"]["data"].slice(priceHistoryState["index"] * 15, (priceHistoryState["index"] + 1)* 15).map((desc, index) => (
                                <div className="priceHistory-header" key={`stk-pg-pH-${index}`}>
                                    <div className="priceHistory-headerDateColumn">
                                        <p className="priceHistory-headerColumnDesc">{desc["date"]}</p>
                                    </div>
                                    <div className="priceHistory-headerColumn">
                                        <p className="priceHistory-headerBodyDesc">${generalOpx.formatFigures.format(desc["open"])}</p>
                                    </div>
                                    <div className="priceHistory-headerColumn">
                                        <p className="priceHistory-headerBodyDesc">${generalOpx.formatFigures.format(desc["high"])}</p>
                                    </div>
                                    <div className="priceHistory-headerColumn">
                                        <p className="priceHistory-headerBodyDesc">${generalOpx.formatFigures.format(desc["low"])}</p>
                                    </div>
                                    <div className="priceHistory-headerColumn">
                                        <p className="priceHistory-headerBodyDesc">${generalOpx.formatFigures.format(desc["close"])}</p>
                                    </div>
                                    <div className="priceHistory-headerColumn">
                                        <p className="priceHistory-headerBodyDesc">{generalOpx.formatLargeFigures(desc["volume"], 1)}</p>
                                    </div>
                                </div>
                            ))
                        }
                    </>
                }
            </div>
            <div className="priceHistory-translateOptnsContainer">
                {priceHistoryState["priceHistory"]["dataLoading"] || priceHistoryState["priceHistory"]["data"].length === 0 ?
                    null : 
                    <>
                        {Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15) >= 8 ?
                            <button className="priceHistory-TranslateBtn"
                                    onClick={() => priceHistoryIndexUpdate("back", undefined)}
                                >
                                <ChevronLeft className="priceHistory-TranslateBtnIcon" />
                            </button> : null
                        }
                        <div className="priceHistory-translateOptnsInnerContainer">
                            {Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15) <= 8 ?
                                <>
                                    {Array(Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15)).fill(0).map((e, i) => (
                                            <button className="priceHistory-translateOptnBtn" 
                                                    key={`stk-pg-pH-viewSet-${i}`}
                                                    onClick={() => priceHistoryIndexUpdate("set", i)}
                                                    style={i === priceHistoryState["index"] ?
                                                        {"color": "var(--primary-bg-01)", "boxShadow": "0px 0px 2px var(--primary-bg-05)"} : {}
                                                    }
                                                >
                                                {i + 1}
                                            </button>
                                        ))
                                    }
                                </> : 
                                <>
                                    {priceHistoryState["index"] === 0 || priceHistoryState["index"] === 1 || priceHistoryState["index"] === 2 ?
                                        <>
                                            {Array(Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15)).fill(0).map((e, i) => {
                                                    if(i === 0 || i === 1 || i === 2 || i === 3 || i === 4 || i === 5) {
                                                        return <button className="priceHistory-translateOptnBtn" 
                                                                key={`stk-pg-pH-viewSet-${i}`}
                                                                onClick={() => priceHistoryIndexUpdate("set", i)}
                                                                style={i === priceHistoryState["index"] ?
                                                                    {"color": "var(--primary-bg-01)", "boxShadow": "0px 0px 2px var(--primary-bg-05)"} : {}
                                                                }
                                                            >
                                                            {i + 1}
                                                        </button>
                                                    } else if(i === (Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15) - 2)) {
                                                        return <button className="priceHistory-translateOptnBtn" 
                                                                key={`stk-pg-pH-viewSet-${i}`}
                                                            >
                                                            ...
                                                        </button>
                                                    } else if(i === (Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15) - 1)) {
                                                        return <button className="priceHistory-translateOptnBtn" 
                                                                key={`stk-pg-pH-viewSet-${i}`}
                                                                onClick={() => priceHistoryIndexUpdate("set", i)}
                                                                style={i === priceHistoryState["index"] ?
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
                                            {priceHistoryState["index"] >= (Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15) - 5) ?
                                                <>
                                                    {Array(Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15)).fill(0).map((e, i) => {
                                                            if(i === Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15) - 1 
                                                                || i === Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15) - 2 
                                                                || i === Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15) - 3 
                                                                || i === Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15) - 4 
                                                                || i === Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15) - 5 
                                                                || i === Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15) - 6
                                                            ) {
                                                                return <button className="priceHistory-translateOptnBtn" 
                                                                        key={`stk-pg-pH-viewSet-${i}`}
                                                                        onClick={() => priceHistoryIndexUpdate("set", i)}
                                                                        style={i === priceHistoryState["index"] ?
                                                                            {"color": "var(--primary-bg-01)", "boxShadow": "0px 0px 2px var(--primary-bg-05)"} : {}
                                                                        }
                                                                    >
                                                                    {i + 1}
                                                                </button>
                                                            } else if(i === 1) {
                                                                return <button className="priceHistory-translateOptnBtn" 
                                                                        key={`stk-pg-pH-viewSet-${i}`}
                                                                    >
                                                                    ...
                                                                </button>
                                                            } else if(i === 0) {
                                                                return <button className="priceHistory-translateOptnBtn" 
                                                                        key={`stk-pg-pH-viewSet-${i}`}
                                                                        onClick={() => priceHistoryIndexUpdate("set", i)}
                                                                        style={i === priceHistoryState["index"] ?
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
                                                    {Array(Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15)).fill(0).map((e, i) => {
                                                            if(i === priceHistoryState["index"] - 1 
                                                                || i === priceHistoryState["index"] 
                                                                || i === priceHistoryState["index"] + 1 
                                                                || i === priceHistoryState["index"] + 2
                                                            ) {
                                                                return <button className="priceHistory-translateOptnBtn" 
                                                                        key={`stk-pg-pH-viewSet-${i}`}
                                                                        onClick={() => priceHistoryIndexUpdate("set", i)}
                                                                        style={i === priceHistoryState["index"] ?
                                                                            {"color": "var(--primary-bg-01)", "boxShadow": "0px 0px 2px var(--primary-bg-05)"} : {}
                                                                        }
                                                                    >
                                                                    {i + 1}
                                                                </button>
                                                            } else if(i === 1 || i === Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15) - 2) {
                                                                return <button className="priceHistory-translateOptnBtn" 
                                                                        key={`stk-pg-pH-viewSet-${i}`}
                                                                    >
                                                                    ...
                                                                </button>
                                                            } else if(i === 0 || i === Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15) - 1) {
                                                                return <button className="priceHistory-translateOptnBtn" 
                                                                        key={`stk-pg-pH-viewSet-${i}`}
                                                                        onClick={() => priceHistoryIndexUpdate("set", i)}
                                                                        style={i === priceHistoryState["index"] ?
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
                        {Math.ceil(priceHistoryState["priceHistory"]["data"].length / 15) >= 8 ?
                            <button className="priceHistory-TranslateBtn"
                                    onClick={() => priceHistoryIndexUpdate("forward", undefined)}
                                >
                                <ChevronRight className="priceHistory-TranslateBtnIcon" />
                            </button> : null
                        }
                    </>
                }
            </div>
        </div>
    )
}