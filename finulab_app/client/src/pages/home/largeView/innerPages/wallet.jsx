import {getUnixTime} from 'date-fns';
import {useNavigate} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {useRef, useState, useLayoutEffect, useEffect, useCallback} from 'react';
import {AccountBalanceWallet, ArrowDropUp, ContentCopy, ExpandMoreSharp, ExploreSharp, PointOfSale, PriceCheckSharp, SendSharp, SouthSharp, Verified, WorkHistory} from '@mui/icons-material';

import generalOpx from '../../../../functions/generalFunctions';
import FinulabTxs from '../../../../components/miniaturized/activity/txs';
import BalanceChart from '../../../../components/balanceChart/balanceChart';
import FinulabChains from '../../../../components/miniaturized/activity/chains';
import MiniPortfolio from '../../../../components/miniaturized/portfolio/mini-portfolio';
import FinulabMarketActivity from '../../../../components/miniaturized/activity/activity';

import {selectUser} from '../../../../reduxStore/user';
import {selectMarketHoldings} from '../../../../reduxStore/marketHoldings';
import {setBalance, selectWalletDesc} from '../../../../reduxStore/walletDesc';
import {setPosition, selectWalletData} from '../../../../reduxStore/walletData';
import {selectWalletRefreshCounter} from '../../../../reduxStore/walletRefreshCounter';
import {setClosed, setHistory, setTxs, selectWalletSupportData} from '../../../../reduxStore/walletSupportData';

export default function InnerWalletPage(props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const now = new Date();
    const nowUnix = getUnixTime(now);

    const user = useSelector(selectUser);
    const walletDesc = useSelector(selectWalletDesc);
    const walletData = useSelector(selectWalletData);
    const u_marketHoldings = useSelector(selectMarketHoldings);
    const walletSupportData = useSelector(selectWalletSupportData);
    const walletRefreshCounter = useSelector(selectWalletRefreshCounter);

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

    const handleScrollWalletPage = (e) => {
        let walletPageInformation = {...walletData["position"]};
        if(e.target.scrollTop >= 476) {
            walletPageInformation["fixed"] = true;
            walletPageInformation["scrollTop"] = e.target.scrollTop;
        } else {
            if(e.target.scrollTop < 476) {
                walletPageInformation["fixed"] = false;
                walletPageInformation["scrollTop"] = e.target.scrollTop;
            } else {
                walletPageInformation["scrollTop"] = e.target.scrollTop;
            }
        }

        dispatch(
            setPosition(walletPageInformation)
        );
    }

    const pullClosedPositions = async () => {
        const closedPositions = await generalOpx.axiosInstance.put(`/market/closed-holdings`, {});
        if(closedPositions.data["status"] === "success") {
            dispatch(
                setClosed(
                    {
                        "data": closedPositions.data["data"],
                        "dataLoading": false
                    }
                )
            );
        }
    }

    const [historyBeingUpdated, setHistoryBeingUpdated] = useState(true);
    const pullHistory = async (type, ids_ninclude) => {
        await generalOpx.axiosInstance.put(`/market/pull-history`,
            {
                "type": type,
                "ids_ninclude": ids_ninclude
            }
        ).then(
            (response) => {
                if(response.data["status"] === "success") {
                    let history_desc = {...walletSupportData["history"]};

                    if(type === "primary") {
                        history_desc["data"] = response.data["data"];
                        history_desc["dataCount"] = response.data["dataCount"];
                        history_desc["dataLoading"] = false;

                        dispatch(
                            setHistory(history_desc)
                        );
                    } else {
                        history_desc["data"] = [...history_desc["data"]].concat(response.data["data"]);

                        dispatch(
                            setHistory(history_desc)
                        );
                    }
                }
            }
        );

        setHistoryBeingUpdated(false);
    }

    const historyObserverRef = useRef();
    const lastPostElementRef = useCallback(node => 
        {
            if(walletSupportData["history"]["dataLoading"]) return;
            if(historyBeingUpdated) return;
            if(historyObserverRef.current) historyObserverRef.current.disconnect();
            historyObserverRef.current = new IntersectionObserver(entries => 
                {
                    if(entries[0].isIntersecting) {
                        setHistoryBeingUpdated(true);

                        let p_ninclude = [];
                        for(let i = 0; i < walletSupportData["history"]["data"].length; i++) {
                            p_ninclude.push(walletSupportData["history"]["data"][i]["_id"]);
                        }
                        pullHistory("secondary", p_ninclude);
                    }
                }
            );
            if(node) historyObserverRef.current.observe(node);
        }, [props.displayView, historyBeingUpdated]
    );

    const [txsBeingUpdated, setTxsBeingUpdated] = useState(true);
    const pullTxs = async (type) => {
        if(type === "primary") {
            const txHistory = await generalOpx.axiosInstance.put(`/wallet/tx-history`, {"accountId": user.walletAddress});

            if(txHistory.data["status"] === "success") {
                dispatch(
                    setTxs(
                        {
                            "data": txHistory.data["data"],
                            "next": txHistory.data["next"],
                            "dataLoading": false
                        }
                    )
                );
            }
        } else if(type === "secondary") {
            let txsFunction = {...walletSupportData["txs"]};
            const txHistoryUpdate = await generalOpx.axiosInstance.put(`/wallet/tx-history-expand`, {"accountId": user.walletAddress, "next": walletSupportData["txs"]["next"]});
            
            if(txHistoryUpdate.data["status"] === "success") {
                txsFunction["next"] = txHistoryUpdate.data["next"];
                txsFunction["data"] = [...txsFunction["data"]].concat(txHistoryUpdate.data["data"]);
                dispatch(
                    setTxs(txsFunction)
                );
            }
        }

        setTxsBeingUpdated(false);
    }

    const txObserverRef = useRef();
    const lastTxElementRef = useCallback(node => 
        {
            if(walletSupportData["txs"]["dataLoading"]) return;
            if(walletSupportData["txs"]["next"] === "") return;
            if(txsBeingUpdated) return;
            if(txObserverRef.current) txObserverRef.current.disconnect();
            txObserverRef.current = new IntersectionObserver(entries => 
                {
                    if(entries[0].isIntersecting) {
                        setTxsBeingUpdated(true);
                        pullTxs("secondary");
                    }
                }
            );
            if(node) txObserverRef.current.observe(node);
        }, [props.displayView, txsBeingUpdated]
    );

    const pullBalance = async () => {
        const balanceDesc = await generalOpx.axiosInstance.put(`/wallet/chain-balance`, {"accountId": user.walletAddress});
        if(balanceDesc.data["status"] === "success") {
            let bal_data = [];
            const balanceDescKeys = Object.keys(balanceDesc.data["data"]);
            if(balanceDescKeys.length > 0) {
                for(let i = 0; i < balanceDescKeys.length; i++) {
                    if(balanceDescKeys[i]=== "initialized") continue;
                    if(balanceDescKeys[i]=== "lastTxTimestamp") continue;
                    
                    const bal = Number(balanceDesc.data["data"][balanceDescKeys[i]]);
                    if(isNaN(bal)) continue;

                    bal_data.push([balanceDescKeys[i], bal])
                }
            }

            dispatch(
                setBalance(
                    {
                        "data": bal_data,
                        "dataLoading": false
                    } 
                )
            );
        }
    }

    useEffect(() => {
        if(props.displayView === "closed") {
            if(walletSupportData["closed"]["dataLoading"]) {
                pullClosedPositions();
            }
        }

        if(props.displayView === "history") {
            if(walletSupportData["history"]["dataLoading"]) {
                pullHistory("primary", []);
            }
        }

        if(props.displayView === "txs") {
            if(walletSupportData["txs"]["dataLoading"]) {
                pullTxs("primary");
            }
        }

        if(props.displayView === "chains") {
            if(walletDesc["balance"]["dataLoading"]) {
                pullBalance();
            }
        }
    }, [props.displayView]);

    return(
        <div onScroll={handleScrollWalletPage}
                className={props.f_viewPort === "small" ? "small-homePageContentBodyWrapper" : "large-homePageContentBodyWrapper"}
            >
            <div 
                    ref={contentBodyRef}
                    className={props.f_viewPort === "small" ? "small-homePageContentBody" : "large-homePageContentBody"}
                >
                <div className="large-homePageContentBodyMargin"/>
                <div className="large-walletAccountnBalanceWrapper">
                    {user ?
                        <BalanceChart 
                            user={user.user} 
                            userVerification={user.verified}
                            accountId={user.walletAddress} 
                            profilePicture={user.profilePicture} 
                            navigateToSend={navigate}
                            refreshStat={walletRefreshCounter["state"]}
                        /> : null
                    }
                </div>
                {contentBodyWidth[1] === true ?
                    <>
                        <div className="large-homePageInnerTopOptionsContainer"
                                style={{
                                        ...{"width": `${contentBodyWidth[0]}px`, "minWidth": `${contentBodyWidth[0]}px`, "maxWidth": `${contentBodyWidth[0]}px`},
                                        ...(walletData["position"]["fixed"] ? {"position": "fixed", "top": "51px"} : {})
                                    }
                                }
                            >
                            <button className="large-homePageInnerTopOptionsBtn"
                                    onClick={() => navigate(`/wallet`)}
                                    style={{"width": "calc((100% / 5) - 20px)", "minWidth": "calc((100% / 5) - 20px)", "maxWidth": "calc((100% / 5) - 20px)"}}
                                >
                                <span className="large-homePageInnerTopOptionsBtnDesc" 
                                        style={props.displayView === "" ?
                                            {"color": "var(--primary-bg-01)"} : {}
                                        }
                                    >
                                    Live
                                    {props.displayView === "" ?
                                        <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                    }
                                </span>
                            </button>
                            <button className="large-homePageInnerTopOptionsBtn"
                                    onClick={() => navigate(`/wallet/closed`)}
                                    style={{"width": "calc((100% / 5) - 20px)", "minWidth": "calc((100% / 5) - 20px)", "maxWidth": "calc((100% / 5) - 20px)"}}
                                >
                                <span className="large-homePageInnerTopOptionsBtnDesc"
                                        style={props.displayView === "closed" ?
                                            {"color": "var(--primary-bg-01)"} : {}
                                        }
                                    >
                                    Closed
                                    {props.displayView === "closed" ?
                                        <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                    }
                                </span>
                            </button>
                            <button className="large-homePageInnerTopOptionsBtn"
                                    onClick={() => navigate(`/wallet/history`)}
                                    style={{"width": "calc((100% / 5) - 20px)", "minWidth": "calc((100% / 5) - 20px)", "maxWidth": "calc((100% / 5) - 20px)"}}
                                >
                                <span className="large-homePageInnerTopOptionsBtnDesc"
                                        style={props.displayView === "history" ?
                                            {"color": "var(--primary-bg-01)"} : {}
                                        }
                                    >
                                    History
                                    {props.displayView === "history" ?
                                        <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                    }
                                </span>
                            </button>
                            <button className="large-homePageInnerTopOptionsBtn"
                                    onClick={() => navigate(`/wallet/txs`)}
                                    style={{"width": "calc((100% / 5) - 20px)", "minWidth": "calc((100% / 5) - 20px)", "maxWidth": "calc((100% / 5) - 20px)"}}
                                >
                                <span className="large-homePageInnerTopOptionsBtnDesc"
                                        style={props.displayView === "txs" ?
                                            {"color": "var(--primary-bg-01)"} : {}
                                        }
                                    >
                                    Txs
                                    {props.displayView === "txs" ?
                                        <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                    }
                                </span>
                            </button>
                            <button className="large-homePageInnerTopOptionsBtn"
                                    onClick={() => navigate(`/wallet/chains`)}
                                    style={{"width": "calc((100% / 5) - 20px)", "minWidth": "calc((100% / 5) - 20px)", "maxWidth": "calc((100% / 5) - 20px)"}}
                                >
                                <span className="large-homePageInnerTopOptionsBtnDesc"
                                        style={props.displayView === "chains" ?
                                            {"color": "var(--primary-bg-01)"} : {}
                                        }
                                    >
                                    Chains
                                    {props.displayView === "chains" ?
                                        <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                    }
                                </span>
                            </button>
                        </div>
                        {walletData["position"]["fixed"] ?
                            <div className="large-homePageInnerTopOptionsContainerMargin"/> : null
                        }
                    </> : null
                }
                <div className="large-homePageContentBodyOutline">
                    {props.displayView === "" ?
                        <>
                            {u_marketHoldings.filter(u_hlds => u_hlds["_id"] !== "finulab_alreadySet").length === 0 ? 
                                <div className="large-homePageProfileNoDataContainer"
                                        style={{
                                            "minHeight": walletData["position"]["fixed"] ? 
                                                `calc(100vh - 51px - 36px)` : 
                                                `calc(100vh - (476px + 36px) + ${walletData["position"]["scrollTop"]}px)`
                                        }}
                                    >
                                    <div className="large-marketPageNoDataONotice">
                                        <div className="prediction-noTradingStatusInfoContainer">
                                            <div className="prediction-noTradingStatusInfoGraphicContainer">
                                                <AccountBalanceWallet className="prediction-noTradingStatusInfoGraphicIcon"/>
                                            </div>
                                            <div className="prediction-noTradingStatusInfoTopLine">No live holdings.</div>
                                            <div className="prediction-noTradingStatusInfoSecondLine">Start trading to build up your portfolio.</div>
                                        </div>
                                    </div>
                                </div> : 
                                <>
                                    {u_marketHoldings.filter(u_hlds => u_hlds["_id"] !== "finulab_alreadySet").map((hld_desc, index) => {
                                            const elements = [];

                                            if(hld_desc["predictionEndTimestamp"] > nowUnix) {
                                                if(hld_desc["yesQuantity"] > 0) {
                                                    elements.push(
                                                        <div className="large-homePagePostContainer" key={`${hld_desc["marketId"]}-yes`}
                                                                style={index === u_marketHoldings.filter(u_hlds => u_hlds["_id"] !== "finulab_alreadySet").length - 1 ? 
                                                                    {"borderBottom": "none"} : {"borderBottom": "solid 1px var(--primary-bg-08)"}
                                                                }
                                                            >
                                                            <MiniPortfolio 
                                                                type={"yes"}
                                                                loading={false}
                                                                holding={hld_desc}
                                                                status={"open"}
                                                                f_viewPort={props.f_viewPort}
                                                                priceHistory={walletData["portfolioPlots"]["dataLoading"] ? 
                                                                    null :
                                                                    walletData["portfolioPlots"]["data"].filter(port_plot => port_plot["marketId"] === hld_desc["marketId"] && port_plot["selection"] === "priceYes")
                                                                }
                                                            />
                                                        </div>
                                                    )
                                                }

                                                if(hld_desc["noQuantity"] > 0) {
                                                    elements.push(
                                                        <div className="large-homePagePostContainer" key={`${hld_desc["marketId"]}-no`}
                                                                style={index === u_marketHoldings.filter(u_hlds => u_hlds["_id"] !== "finulab_alreadySet").length - 1 ? 
                                                                    {"borderBottom": "none"} : {"borderBottom": "solid 1px var(--primary-bg-08)"}
                                                                }
                                                            >
                                                            <MiniPortfolio 
                                                                type={"no"}
                                                                loading={false}
                                                                holding={hld_desc} 
                                                                status={"open"}
                                                                f_viewPort={props.f_viewPort}
                                                                priceHistory={walletData["portfolioPlots"]["dataLoading"] ? 
                                                                    null :
                                                                    walletData["portfolioPlots"]["data"].filter(port_plot => port_plot["marketId"] === hld_desc["marketId"] && port_plot["selection"] === "priceNo")
                                                                }
                                                            />
                                                        </div>
                                                    )
                                                }
                                            }

                                            return elements;
                                        })
                                    }
                                    <div className="large-homePageProfileNoDataContainer"
                                        style={{
                                            "minHeight": walletData["position"]["fixed"] ? 
                                                `calc(100vh - 51px - 36px)` : 
                                                `calc(100vh - (476px + 36px) + ${walletData["position"]["scrollTop"]}px)`
                                        }}
                                    />
                                </>
                            }
                        </> :
                        <>
                            {props.displayView === "closed" ?
                                <>
                                    {u_marketHoldings.filter(u_hlds => u_hlds["_id"] !== "finulab_alreadySet").map((hld_desc, index) => {
                                            const elements = [];

                                            if(hld_desc["predictionEndTimestamp"] <= nowUnix) {
                                                if(hld_desc["yesQuantity"] > 0) {
                                                    elements.push(
                                                        <div className="large-homePagePostContainer" key={`${hld_desc["marketId"]}-yes`}
                                                                style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                            >
                                                            <MiniPortfolio 
                                                                type={"yes"}
                                                                loading={false}
                                                                holding={hld_desc}
                                                                status={"open"}
                                                                f_viewPort={props.f_viewPort}
                                                                priceHistory={walletData["portfolioPlots"]["dataLoading"] ? 
                                                                    null :
                                                                    walletData["portfolioPlots"]["data"].filter(port_plot => port_plot["marketId"] === hld_desc["marketId"] && port_plot["selection"] === "priceYes")
                                                                }
                                                            />
                                                        </div>
                                                    )
                                                }

                                                if(hld_desc["noQuantity"] > 0) {
                                                    elements.push(
                                                        <div className="large-homePagePostContainer" key={`${hld_desc["marketId"]}-no`}
                                                                style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                            >
                                                            <MiniPortfolio 
                                                                type={"no"}
                                                                loading={false}
                                                                holding={hld_desc} 
                                                                status={"open"}
                                                                f_viewPort={props.f_viewPort}
                                                                priceHistory={walletData["portfolioPlots"]["dataLoading"] ? 
                                                                    null :
                                                                    walletData["portfolioPlots"]["data"].filter(port_plot => port_plot["marketId"] === hld_desc["marketId"] && port_plot["selection"] === "priceNo")
                                                                }
                                                            />
                                                        </div>
                                                    )
                                                }
                                            }

                                            return elements;
                                        })
                                    }
                                    {walletSupportData["closed"]["dataLoading"] ?
                                        <>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <MiniPortfolio 
                                                    loading={true}
                                                />
                                            </div>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <MiniPortfolio 
                                                    loading={true}
                                                />
                                            </div>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <MiniPortfolio 
                                                    loading={true}
                                                />
                                            </div>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <MiniPortfolio 
                                                    loading={true}
                                                />
                                            </div>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <MiniPortfolio 
                                                    loading={true}
                                                />
                                            </div>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <MiniPortfolio 
                                                    loading={true}
                                                />
                                            </div>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <MiniPortfolio 
                                                    loading={true}
                                                />
                                            </div>
                                        </> :
                                        <>
                                            {walletSupportData["closed"]["data"].map((hld_desc, index) => {
                                                    const elements = [];
                                                    if(hld_desc["yesQuantity"] > 0) {
                                                        elements.push(
                                                            <div className="large-homePagePostContainer" key={`${hld_desc["marketId"]}-yes`}
                                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                                >
                                                                <MiniPortfolio 
                                                                    type={"yes"}
                                                                    loading={false}
                                                                    holding={hld_desc}
                                                                    status={"closed"}
                                                                    f_viewPort={props.f_viewPort}
                                                                    priceHistory={[]}
                                                                />
                                                            </div>
                                                        )
                                                    }
    
                                                    if(hld_desc["noQuantity"] > 0) {
                                                        elements.push(
                                                            <div className="large-homePagePostContainer" key={`${hld_desc["marketId"]}-no`}
                                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                                >
                                                                <MiniPortfolio 
                                                                    type={"no"}
                                                                    loading={false}
                                                                    holding={hld_desc} 
                                                                    status={"closed"}
                                                                    f_viewPort={props.f_viewPort}
                                                                    priceHistory={[]}
                                                                />
                                                            </div>
                                                        )
                                                    }
        
                                                    return elements;
                                                })
                                            }
                                        </>
                                    }
                                    {walletSupportData["closed"]["data"].length === 0 &&
                                        u_marketHoldings.filter(u_hlds => u_hlds["predictionEndTimestamp"] <= nowUnix).length === 0 ?
                                        <div className="large-homePageProfileNoDataContainer"
                                                style={{
                                                    "minHeight": walletData["position"]["fixed"] ? 
                                                        `calc(100vh - 51px - 36px)` : 
                                                        `calc(100vh - (476px + 36px) + ${walletData["position"]["scrollTop"]}px)`
                                                }}
                                            >
                                            <div className="large-marketPageNoDataONotice">
                                                <div className="prediction-noTradingStatusInfoContainer">
                                                    <div className="prediction-noTradingStatusInfoGraphicContainer">
                                                        <WorkHistory className="prediction-noTradingStatusInfoGraphicIcon"/>
                                                    </div>
                                                    <div className="prediction-noTradingStatusInfoTopLine">No closed positions.</div>
                                                    <div className="prediction-noTradingStatusInfoSecondLine">Start trading to build up your portfolio.</div>
                                                </div>
                                            </div>
                                        </div> : 
                                        <div className="large-homePageProfileNoDataContainer"
                                            style={{
                                                "minHeight": walletData["position"]["fixed"] ? 
                                                    `calc(100vh - 51px - 36px)` : 
                                                    `calc(100vh - (476px + 36px) + ${walletData["position"]["scrollTop"]}px)`
                                            }}
                                        />
                                    }
                                </> :
                                <>
                                    {props.displayView === "history" ?
                                        <>
                                            {walletSupportData["history"]["data"].map((hist_desc, index) => (
                                                    <div className="large-homePagePostContainer" key={`${hist_desc["_id"]}`}
                                                            ref={walletSupportData["history"]["data"].length === walletSupportData["history"]["dataCount"] ? null :
                                                                walletSupportData["history"]["data"].length - 1 === index ? lastPostElementRef : null}
                                                            style={index === walletSupportData["history"]["data"].length - 1 ?
                                                                {"borderBottom": "none"} : {"borderBottom": "solid 1px var(--primary-bg-08)"}
                                                            }
                                                        >
                                                        <FinulabMarketActivity 
                                                            hist_desc={hist_desc}
                                                            f_viewPort={props.f_viewPort}
                                                        />
                                                    </div>
                                                ))
                                            }
                                            {walletSupportData["history"]["data"].length === 0 ?
                                                <div className="large-homePageProfileNoDataContainer"
                                                        style={{
                                                            "minHeight": walletData["position"]["fixed"] ? 
                                                                `calc(100vh - 51px - 36px)` : 
                                                                `calc(100vh - (476px + 36px) + ${walletData["position"]["scrollTop"]}px)`
                                                        }}
                                                    >
                                                    <div className="large-marketPageNoDataONotice">
                                                        <div className="prediction-noTradingStatusInfoContainer">
                                                            <div className="prediction-noTradingStatusInfoGraphicContainer">
                                                                <WorkHistory className="prediction-noTradingStatusInfoGraphicIcon"/>
                                                            </div>
                                                            <div className="prediction-noTradingStatusInfoTopLine">No trading history.</div>
                                                            <div className="prediction-noTradingStatusInfoSecondLine">Start trading to build up your portfolio.</div>
                                                        </div>
                                                    </div>
                                                </div> : 
                                                <div className="large-homePageProfileNoDataContainer"
                                                    style={{
                                                        "minHeight": walletData["position"]["fixed"] ? 
                                                            `calc(100vh - 51px - 36px)` : 
                                                            `calc(100vh - (476px + 36px) + ${walletData["position"]["scrollTop"]}px)`
                                                    }}
                                                />
                                            }
                                        </> : 
                                        <>
                                            {props.displayView === "txs" ?
                                                <>
                                                    {walletSupportData["txs"]["data"].map((tx_desc, index) => (
                                                            <div className="large-homePagePostContainer" key={`tx-desc-${index}`}
                                                                    ref={walletSupportData["txs"]["next"] === "" ? null :
                                                                        walletSupportData["txs"]["data"].length - 1 === index ? lastTxElementRef : null}
                                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                                >
                                                                <FinulabTxs 
                                                                    tx_desc={tx_desc}
                                                                />
                                                            </div>
                                                        ))
                                                    }
                                                    {walletSupportData["txs"]["data"].length === 0 ?
                                                        <div className="large-homePageProfileNoDataContainer"
                                                                style={{
                                                                    "minHeight": walletData["position"]["fixed"] ? 
                                                                        `calc(100vh - 51px - 36px)` : 
                                                                        `calc(100vh - (476px + 36px) + ${walletData["position"]["scrollTop"]}px)`
                                                                }}
                                                            >
                                                            <div className="large-marketPageNoDataONotice">
                                                                <div className="prediction-noTradingStatusInfoContainer">
                                                                    <div className="prediction-noTradingStatusInfoGraphicContainer">
                                                                        <PointOfSale className="prediction-noTradingStatusInfoGraphicIcon"/>
                                                                    </div>
                                                                    <div className="prediction-noTradingStatusInfoTopLine">No transaction history.</div>
                                                                    <div className="prediction-noTradingStatusInfoSecondLine">Start trading to build up your portfolio.</div>
                                                                </div>
                                                            </div>
                                                        </div> : 
                                                        <div className="large-homePageProfileNoDataContainer"
                                                            style={{
                                                                "minHeight": walletData["position"]["fixed"] ? 
                                                                    `calc(100vh - 51px - 36px)` : 
                                                                    `calc(100vh - (476px + 36px) + ${walletData["position"]["scrollTop"]}px)`
                                                            }}
                                                        />
                                                    }
                                                </> : 
                                                <>
                                                    {props.displayView === "chains" ?
                                                        <>
                                                            {Array(20).fill(null).map((val, index) => (
                                                                    <div className="large-homePagePostContainer" key={`tx-desc-${index}`}
                                                                            ref={walletSupportData["txs"]["next"] === "" ? null :
                                                                                walletSupportData["txs"]["data"].length - 1 === index ? lastTxElementRef : null}
                                                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                                        >
                                                                        <FinulabChains 
                                                                            chainId={index}
                                                                        />
                                                                    </div>
                                                                ))
                                                            }
                                                        </> : null
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
        </div>
    )
}