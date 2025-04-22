import '../send/send.css';
import './sendVerification.css';
import '../receive/receive.css';

import Confetti from 'react-confetti';
import {useNavigate} from 'react-router-dom';
import BeatLoader from 'react-spinners/BeatLoader';
import {useDispatch, useSelector} from 'react-redux';
import {useRef, useState, useEffect, useLayoutEffect} from 'react';
import {CancelSharp, Check, CheckCircleOutline, CheckCircleSharp, ContentCopy, PersonPin, SendToMobile, Verified} from '@mui/icons-material';

import {login, selectUser} from '../../reduxStore/user';
import {selectWalletDesc} from '../../reduxStore/walletDesc';
import {setFinuxTxBeingSent} from '../../reduxStore/finuxTxBeingSent';
import {selectHomePageWatchlist} from '../../reduxStore/homePageWatchlist';
import {setWalletRefreshCounter, selectWalletRefreshCounter} from '../../reduxStore/walletRefreshCounter';

import generalOpx from '../../functions/generalFunctions';
import { add, format } from 'date-fns';

const privileged_accts = ["tesemma.fin-us"];
const finux_chainOptns = [
    "Chain 0", "Chain 1", "Chain 2", "Chain 3",
    "Chain 4", "Chain 5", "Chain 6", "Chain 7",
    "Chain 8", "Chain 9", "Chain 10", "Chain 11", 
    "Chain 12", "Chain 13", "Chain 14", "Chain 15", 
    "Chain 16", "Chain 17", "Chain 18", "Chain 19"
];

export default function FinulabGetVerified() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const user = useSelector(selectUser);
    const walletDesc = useSelector(selectWalletDesc);
    const homePageWatchlist = useSelector(selectHomePageWatchlist);
    const walletRefreshCounter = useSelector(selectWalletRefreshCounter);

    const contentBodyRef = useRef();
    const [confettiHeight, setConfettiHeight] = useState(0);
    const [isConfettiActive, setIsConfettiActive] = useState(false);
    const [contentBodyWidth, setContentBodyWidth] = useState([0, false]);
    useLayoutEffect(() => {
        const contentBodyWidthFunction = () => {
            if(contentBodyRef.current) {
                const bodyWidth = contentBodyRef.current.getBoundingClientRect().width;
                setContentBodyWidth([bodyWidth, true]);

                setConfettiHeight(window.innerHeight);
            }
        }

        window.addEventListener('resize', contentBodyWidthFunction);
        contentBodyWidthFunction();
        return () => window.removeEventListener('resize', contentBodyWidthFunction);
    }, []);

    const [pieceCount, setPieceCount] = useState(10000);
    const confettiToggle = () => {
        setPieceCount(4000);
        setIsConfettiActive(true);

        setTimeout(() => {
            const fadeOut = setInterval(() => {
                setPieceCount((prev) => {
                    if(prev <= 0) {
                        clearInterval(fadeOut);
                        setIsConfettiActive(false);
                        return 0;
                    }
                    return prev - 1000;
                });
            }, 200);
        }, 8000);
    }

    const [sendFinuxTranslateX, setSendFinuxTranslateX] = useState("0px");
    const [transferFinuxSupport, setTransferFinuxSupport] = useState(
        {
            "from": user.walletAddress,
            "fromChain": "0",
            "to": "finulab-subscriptions",
            "toChain": "0",
            "transferAmount": 0
        }
    );
    const transferFinuxSupportHandler = (e) => {
        const {name, value} = e.target;
        setTransferFinuxSupport(
            {
                ...transferFinuxSupport, [name]: value
            }
        );
    }
    const transferFinuxChainSelector = (e) => {
        const {name, value} = e.target;
        const clarifiedValue = value.split(" ")[1];
        setTransferFinuxSupport(
            {
                ...transferFinuxSupport, "fromChain": clarifiedValue, "toChain": clarifiedValue
            }
        );
    }

    const [subscriptionErrorCode, setSubscriptionErrorCode] = useState(0);
    const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState("annual");
    const selectedSubscriptionPlanToggle = (type) => {setSelectedSubscriptionPlan(type);}
    const paynSubscribe = () => {
        if(homePageWatchlist["watchlist"]["cryptoMarket"].length === 0) {
            setSubscriptionErrorCode(1);

            setTimeout(() => {setSubscriptionErrorCode(0);}, 2000);
        } else {
            if(homePageWatchlist["watchlist"]["cryptoMarket"].some(w_desc => w_desc.symbol === "FINUX")) {
                const finuxClose = homePageWatchlist["watchlist"]["cryptoMarket"].filter(w_desc => w_desc.symbol === "FINUX")[0]["close"];

                let transferAmount = 0;
                if(selectedSubscriptionPlan === "annual") {
                    let transferAmountSupport = Number(`${formatFinuxFigures.format(98.95 / finuxClose)}`.replace(/,/g, ""));
                    if(isNaN(transferAmountSupport) || !isFinite(transferAmountSupport)) {
                        transferAmount = 98.95 / finuxClose;
                    } else {
                        transferAmount = transferAmountSupport;
                    }
                } else {
                    let transferAmountSupport = Number(`${formatFinuxFigures.format(9.65 / finuxClose)}`.replace(/,/g, ""));
                    if(isNaN(transferAmountSupport) || !isFinite(transferAmountSupport)) {
                        transferAmount = 9.65 / finuxClose;
                    } else {
                        transferAmount = transferAmountSupport;
                    }
                }

                setTransferFinuxSupport(
                    {
                        ...transferFinuxSupport, "transferAmount": transferAmount
                    }
                );
                setSendFinuxTranslateX("-100% - 10px");
            } else {
                setSubscriptionErrorCode(1);

                setTimeout(() => {setSubscriptionErrorCode(0);}, 2000);
            }
        }
    }

    const [pollId, setPollId] = useState("");
    const [transferType, setTransferType] = useState("chain");
    const [transferStatusTracker, setTransferStatusTracker] = useState({"1": "", "2": ""});

    const [txSendLoading, setTxSendLoading] = useState(false);
    const [txSendErrorCode, setTxSendErrorCode] = useState(0);
    const [transferInProgress, setTransferInProgress] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(false);
    const commitTx = async () => {
        setTxSendLoading(true);

        let proceede_wTx = false;
        if(transferFinuxSupport.to !== "finulab-subscriptions") {
            setTxSendErrorCode(1);

            setTimeout(() => {
                setTxSendErrorCode(0);
                setTxSendLoading(false);
            }, 2000);
        } else if(transferFinuxSupport.from === transferFinuxSupport.to
            && transferFinuxSupport.fromChain === transferFinuxSupport.toChain
        ) {
            setTxSendErrorCode(2);

            setTimeout(() => {
                setTxSendErrorCode(0);
                setTxSendLoading(false);
            }, 2000);
        } else if(transferFinuxSupport.transferAmount <= 0) {
            setTxSendErrorCode(3);

            setTimeout(() => {
                setTxSendErrorCode(0);
                setTxSendLoading(false);
            }, 2000);
        } else {
            if(walletDesc["balance"]["data"].some(wlt_desc => wlt_desc[0] === transferFinuxSupport.fromChain)) {
                const availableBalance = walletDesc["balance"]["data"].filter(wlt_desc => wlt_desc[0] === transferFinuxSupport.fromChain)[0][1];

                if(transferFinuxSupport.transferAmount > availableBalance) {
                    setTxSendErrorCode(4);

                    setTimeout(() => {
                        setTxSendErrorCode(0);
                        setTxSendLoading(false);
                    }, 2000);
                } else {
                    proceede_wTx = true;
                }
            } else {
                setTxSendErrorCode(4);

                setTimeout(() => {
                    setTxSendErrorCode(0);
                    setTxSendLoading(false);
                }, 2000);
            }
        }
        
        if(proceede_wTx) {
            await generalOpx.axiosInstance.post(`/wallet/get-verified`, 
                {
                    "to": transferFinuxSupport.to,
                    "accountId": user.walletAddress,
                    "toChain": transferFinuxSupport.toChain,
                    "fromChain": transferFinuxSupport.fromChain,
                    "amount": transferFinuxSupport.transferAmount,
                    "subscriptionType": selectedSubscriptionPlan === "annual" ? "annual" : "monthly"
                }
            ).then(
                async (response) => {
                    if(response.data["status"] === "success") {
                        setPollId(response.data["pollId"]);

                        setTxSendLoading(false);
                        setTransferInProgress(true);

                        setSendFinuxTranslateX("-200% - 16px");
                        dispatch(
                            setFinuxTxBeingSent(true)
                        );

                        setTimeout(() => {
                            setTransferStatusTracker(
                                {
                                    "1": "complete",
                                    "2": "in-progress"
                                }
                            );
                        }, 0);
                    } else {
                        setTxSendErrorCode(5);

                        setTimeout(() => {
                            setTxSendErrorCode(0);
                            setTxSendLoading(false);
                        }, 2000);
                    }
                }
            ).catch(
                () => {
                    setTxSendErrorCode(5);

                    setTimeout(() => {
                        setTxSendErrorCode(0);
                        setTxSendLoading(false);
                    }, 2000);
                }
            );
        }
    }

    const done_wTx = () => {
        dispatch(
            setFinuxTxBeingSent(false)
        );
        setTimeout(() => {navigate(-1)}, 0);
    }

    const [txRequestKey, setTxRequestKey] = useState("");
    const [refreshAccountBalance, setRefreshAccountBalance] = useState(0);
    const pollTxStatus = async () => {
        if(pollId !== "") {
            const pollData = await generalOpx.axiosInstance.put(`/wallet/poll-tx`, {"pollId": pollId});
            if(pollData.data["status"] === "success") {
                if(txRequestKey === "") {setTxRequestKey(pollData.data["data"]["requestKey"]);}
                if(pollData.data["data"]["txCompleted"]) {
                    if(pollData.data["data"]["txOutcome"] === "success") {
                        setTransferStatusTracker(
                            {
                                "1": "complete",
                                "2": "complete"
                            }
                        );

                        setPollId("");
                        setTransferInProgress(false);
                        setRefreshAccountBalance(prevState => prevState + 1);
                        
                        const now = new Date();
                        const nowFormatted = format(now, "MM-dd-yyyy");
                        let nextPayDate, nextPayDateFormatted;
                        if(selectedSubscriptionPlan === "annual") {
                            nextPayDate = add(now, {"years": 1});
                            nextPayDateFormatted = format(nextPayDate, "MM-dd-yyyy");
                        } else {
                            nextPayDate = add(now, {"months": 1});
                            nextPayDateFormatted = format(nextPayDate, "MM-dd-yyyy");
                        }
                        
                        setVerificationStatus(true);
                        dispatch(
                            login(
                                {
                                    user: user.user,
                                    profilePicture: user.profilePicture,
                                    profileWallpaper: user.profileWallpaper,
                                    finuxEarned: user.finuxEarned,
                                    walletAddress: user.walletAddress,
                                    monetized: true,
                                    verified: true,
                                    verificationData: {"selectedChain": transferFinuxSupport.fromChain, "status": "active", "verificationStartDate": nowFormatted, "verificationNextPayDate": nextPayDateFormatted},
                                    createdAt: user.createdAt
                                }
                            )
                        );
                        confettiToggle();
                    } else {
                        setTransferStatusTracker(
                            {
                                "1": "complete",
                                "2": "error"
                            }
                        );

                        setPollId("");
                        setTransferInProgress(false);
                    }
                }
            }
        }
    }

    useEffect(() => {
        let intervalId;
        let setTimeInterval = 20 * 1000;
        if(pollId !== ""
            && transferInProgress
        ) {
            intervalId = setInterval(pollTxStatus, setTimeInterval);
        }

        return () => {
            if(intervalId) {clearInterval(intervalId);}
        }
    }, [pollId, transferInProgress, transferStatusTracker]);

    useEffect(() => {
        if(refreshAccountBalance === 1) {
            dispatch(
                setWalletRefreshCounter(walletRefreshCounter + 1)
            );
        }
    }, [refreshAccountBalance]);

    const unsecuredCopyToClipboard = (text) => {
        let textArea = document.createElement("textarea");
        textArea.value = text;
        
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
        } catch (err) {}

        document.body.removeChild(textArea);
    }

    const [txReqKeyCopied, setTxReqKeyCopied] = useState(false);
    const copyToClipboard = (content) => {
        if(window.isSecureContext && navigator.clipboard) {
          navigator.clipboard.writeText(txRequestKey);
        } else {
            unsecuredCopyToClipboard(txRequestKey);
        }

        setTxReqKeyCopied(true);
        setTimeout(() => {
            setTxReqKeyCopied(false);
        }, 2000);
    };

    const formatFinuxFigures =  new Intl.NumberFormat(
        'en-US',
        {
            useGrouping: true,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

    return(
        <div className="send-wrapper" ref={contentBodyRef}
                style={{"height": "548px", "minHeight": "548px", "maxHeight": "548px"}}
            >
            <div className="receive-header">
                <div className="send-verificationConfettiWrapper"
                        style={contentBodyWidth[1] ? 
                            {
                                "display": isConfettiActive ? "flex" : "none",
                                "width": `${contentBodyWidth[0]}px`, "minWidth": `${contentBodyWidth[0]}px`, "maxWidth": `${contentBodyWidth[0]}px`
                            } : {"display": "none"}
                        }
                    >
                    {isConfettiActive 
                        && contentBodyWidth[1] && confettiHeight !== 0 ? 
                        <Confetti width={contentBodyWidth[0]} height={confettiHeight} numberOfPieces={pieceCount} recycle={false} /> : null
                    }
                </div>
                <span className="receive-headerText" style={{"display": "flex", "alignItems": "center", "fontSize": "1.2rem"}}>
                    <Verified className='send-verifiedTopIcon'/>&nbsp;&nbsp;{verificationStatus ? `Congratulations!` : `Premium`}
                </span>
                {sendFinuxTranslateX === "-200% - 16px" ? 
                    <button className="transferFinux-ExitStatusBtn"
                            onClick={() => done_wTx()}
                            disabled={txSendLoading || transferInProgress}
                            style={txSendLoading || transferInProgress ? {"backgroundColor": "var(--primary-bg-05)"} : {}}
                        >
                        Done
                    </button> : null
                }
            </div>
            <div className="send-body">
                <div className="send-bodyInnerContainer"
                        style={{"translate": `calc(${sendFinuxTranslateX})`}}
                    >
                    <div className="send-bodyTxInfo">
                        <div className="send-verificationBodyHeader">
                            Enhanced Experience
                            {subscriptionErrorCode !== 0 ?
                                <span className="send-verificationBodyHeaderErrorDesc">Error occured, please try later.</span> : null
                            }
                        </div>
                        <div className="send-verificationBodyDescLine">
                            <span>Checkmark</span>
                            <span style={{"marginLeft": "auto"}}>
                                <Check
                                    className="send-verificationBodyDescLineIcon"
                                />
                            </span>
                        </div>
                        <div className="send-verificationBodyDescLine">
                            <span>Create Prediction Markets</span>
                            <span style={{"marginLeft": "auto"}}>
                                <Check
                                    className="send-verificationBodyDescLineIcon"
                                />
                            </span>
                        </div>
                        <div className="send-verificationBodyDescLine">
                            <span>Collect 50% of Fees made off Your Markets</span>
                            <span style={{"marginLeft": "auto"}}>
                                <Check
                                    className="send-verificationBodyDescLineIcon"
                                />
                            </span>
                        </div>
                        <div className="send-verificationBodyDescLine">
                            <span>Earn Finux from Your Created Communities</span>
                            <span style={{"marginLeft": "auto"}}>
                                <Check
                                    className="send-verificationBodyDescLineIcon"
                                />
                            </span>
                        </div>
                        <div className="send-verificationBodyDescLine">
                            <span>Large Visibility Boost on all Created Content</span>
                            <span style={{"marginLeft": "auto"}}>
                                <Check
                                    className="send-verificationBodyDescLineIcon"
                                />
                            </span>
                        </div>
                        <div className="send-verificationBodyDescLine">
                            <span>Earn Finux on Views, Likes, Dislikes, or Comments</span>
                            <span style={{"marginLeft": "auto"}}>
                                <Check
                                    className="send-verificationBodyDescLineIcon"
                                />
                            </span>
                        </div>
                        <div className="send-verificationBodySelectVerificationTypeContainer">
                            <div className="send-verificationBodySelectVerificationTypeBtnLine">
                                <button className="send-verificationTypeBtn"
                                        style={selectedSubscriptionPlan === "annual" ? 
                                            {
                                                "border": "solid 1px var(--primary-blue-10)",
                                                "boxShadow": "0px 0px 3px var(--primary-blue-10)"
                                            } : {}
                                        }
                                        onClick={() => selectedSubscriptionPlanToggle("annual")}
                                    >
                                    <span className='send-verificationTypeBtnDesc'>Annual Plan
                                        <div className="send-verificationAnnualSavingsCont">Save 15%</div>
                                    </span>
                                    <span className="send-verificationTypeBtnPriceDesc">$98.95 / year</span>
                                    <span className="send-verificationTypeBtnSecondaryDesc">
                                        $98.95 per year, billed annually in Finux 
                                        {homePageWatchlist["watchlist"]["cryptoMarket"].length > 0 ?
                                            ` (${formatFinuxFigures.format(98.95 / homePageWatchlist["watchlist"]["cryptoMarket"].filter(w_desc => w_desc.symbol === "FINUX")[0]["close"])}).` : `.`
                                        }
                                    </span>
                                </button>
                                <button className="send-verificationTypeBtn"
                                        style={selectedSubscriptionPlan === "monthly" ? 
                                            {
                                                "border": "solid 1px var(--primary-blue-10)",
                                                "boxShadow": "0px 0px 3px var(--primary-blue-10)"
                                            } : {}
                                        }
                                        onClick={() => selectedSubscriptionPlanToggle("monthly")}
                                    >
                                    <span className='send-verificationTypeBtnDesc'>Monthly Plan</span>
                                    <span className="send-verificationTypeBtnPriceDesc">$9.65 / month</span>
                                    <span className="send-verificationTypeBtnSecondaryDesc">
                                        $115.80 per year, $9.65 billed monthly in Finux
                                        {homePageWatchlist["watchlist"]["cryptoMarket"].length > 0 ?
                                            ` (${formatFinuxFigures.format(9.65 / homePageWatchlist["watchlist"]["cryptoMarket"].filter(w_desc => w_desc.symbol === "FINUX")[0]["close"])}).` : `.`
                                        }
                                    </span>
                                </button>
                            </div>
                            <button className="send-verificationSubnPayBtn"
                                    onClick={() => paynSubscribe()}
                                >
                                Subscribe & Pay
                            </button>
                        </div>
                    </div>
                    <div className="send-bodyTxInfo">
                        <div className="send-inputLineHeader">From Chain</div>
                        <select name='fromChain'
                                value={`Chain ${transferFinuxSupport.fromChain}`}
                                onChange={transferFinuxChainSelector}
                                style={{"height": "40px", "minHeight": "40px", "maxHeight": "40px"}}
                                className="finulab-createAccountBirthDayMonthSelect"
                            >
                            {finux_chainOptns.map((chain_desc, index) => (
                                    <option value={chain_desc} key={`from-Chain-${index}`}>{chain_desc}</option>
                                ))
                            }
                        </select>
                        <div className="send-inputLineHeader" style={{"marginTop": "30px"}}>To Address</div>
                        <div className="finulab-createAccountEmailUpdateInputCont"
                                style={{"width": "100%", "minWidth": "100%", "maxWidth": "100%"}}
                            >
                            <PersonPin className="main-loginbodyInputIcon"/>
                            <input type="text"
                                name='to'
                                disabled={true}
                                value={transferFinuxSupport.to}
                                onChange={transferFinuxSupportHandler}
                                placeholder='k:...'
                                autoCapitalize='off'
                                autoComplete='off'
                                className="finulab-sendFinuxToAddressInput" 
                                style={{"color": "var(--primary-bg-05)", "height": "40px", "minHeight": "40px", "maxHeight": "40px"}}
                            />
                            <select name='toChain'
                                    value={`Chain ${transferFinuxSupport.toChain}`}
                                    disabled={true}
                                    onChange={transferFinuxChainSelector}
                                    style={{"color": "var(--primary-bg-05)", "height": "40px", "minHeight": "40px", "maxHeight": "40px"}}
                                    className="finulab-sendFinuxToChainSelect"
                                >
                                {finux_chainOptns.map((chain_desc, index) => (
                                        <option value={chain_desc} key={`to-Chain-${index}`}>{chain_desc}</option>
                                    ))
                                }
                            </select>
                        </div>
                        <div className="send-inputLineHeader" style={{"marginTop": "6px"}}>
                            Transfer Amount
                            <div className="send-inputLineHeaderAvailableBalanceDesc"
                                    style={{"marginLeft": "auto"}}
                                >
                                {walletDesc["balance"]["data"].some(wlt_desc => wlt_desc[0] === transferFinuxSupport.fromChain) ?
                                    `Available: ${generalOpx.formatFiguresCrypto.format(walletDesc["balance"]["data"].filter(wlt_desc => wlt_desc[0] === transferFinuxSupport.fromChain)[0][1])} FINUX`: 
                                    `Available: 0.00 FINUX`
                                }
                            </div> 
                        </div>
                        <div className="main-loginInputCont"
                                style={{"marginTop": "0"}}
                            >
                            <SendToMobile className="main-loginbodyInputIcon"/>
                            <input type="number"
                                name='transferAmount'
                                disabled={true}
                                value={transferFinuxSupport.transferAmount}
                                onChange={transferFinuxSupportHandler}
                                placeholder='0'
                                autoCapitalize='off'
                                autoComplete='off'
                                className="main-createAccountInput" 
                                style={{"color": "var(--primary-bg-05)", "height": "40px", "minHeight": "40px", "maxHeight": "40px"}}
                            />
                        </div>
                        <div className="commit-txUnderlineContainer">
                            {txSendErrorCode === 1 ?
                                <div className="commit-txUnderlineErrorDesc">Transfer must be to finulab-subscriptions.</div> : 
                                <>
                                    {txSendErrorCode === 2 ?
                                        <div className="commit-txUnderlineErrorDesc">From and to account must be different.</div> : 
                                        <>
                                            {txSendErrorCode === 3 ?
                                                <div className="commit-txUnderlineErrorDesc">Transfer amount must be greater than 0.</div> : 
                                                <>
                                                    {txSendErrorCode === 4 ?
                                                        <div className="commit-txUnderlineErrorDesc">Insufficient funds to complete the tx.</div> :
                                                        <>
                                                            {txSendErrorCode === 5 ?
                                                                <div className="commit-txUnderlineErrorDesc">An error occured, please try again later.</div> : null
                                                            }
                                                        </>
                                                    }
                                                </>
                                            }
                                        </>
                                    }
                                </>
                            }
                            <button className="send-transferBtn"
                                    onClick={() => commitTx()}
                                    disabled={txSendLoading || transferInProgress}
                                >
                                {txSendLoading ?
                                    <BeatLoader 
                                        color='var(--primary-bg-10)'
                                        size={5}
                                    /> : `Commit Tx`
                                }
                            </button>
                        </div>
                    </div>
                    <div className="send-bodyTxInfo">
                        <div className="receive-secondaryHeader" style={{"position": "relative", "marginTop": "0"}}>
                            {verificationStatus ?
                                `Your account is now verified!` : 
                                <>
                                    Tx Information
                                    &nbsp;<span className="receive-secondaryHeaderUnderDesc">*Please don't close, tx may take up to 10 min.</span>
                                </>
                            }
                        </div>
                        <div className="send-bodyForTxStatus">
                            <div className="receive-bodyHeader">
                                <span className="receive-bodyHeaderText">Status</span>
                            </div>
                            <div className="send-bodyTxStatusContainer">
                                <div className="send-bodyTxStatusLine" style={{"marginTop": "12px"}}>
                                    <div className="send-txStatusStep">
                                        {transferStatusTracker["1"] === "" ?
                                            `1` : 
                                            <>
                                                {transferStatusTracker["1"] === "in-progress" ?
                                                    <BeatLoader
                                                        color='var(--primary-bg-01)'
                                                        size={3}
                                                    /> : 
                                                    <>
                                                        {transferStatusTracker["1"] === "error" ?
                                                            <CancelSharp className="send-txStatusStepRedIcon"/> : 
                                                            <>
                                                                {transferStatusTracker["1"] === "complete" ?
                                                                    <CheckCircleSharp className="send-txStatusStepGreenIcon"/> : null
                                                                }
                                                            </>
                                                        }
                                                    </>
                                                }
                                            </>
                                        }
                                    </div>
                                    <div className="send-txStatusStepDesc">Sent</div>
                                </div>
                                <div className="send-bodyTxStatusLineConnector">
                                    <div className="send-bodyTxStatusXChainLineConnectorFiller"
                                        style={{
                                            "height": transferStatusTracker["1"] === "complete" ? "100%" : "0%", 
                                            "minHeight": transferStatusTracker["1"] === "complete" ? "100%" : "0%", 
                                            "maxHeight": transferStatusTracker["1"] === "complete" ? "100%" : "0%"
                                        }}
                                    />
                                </div>
                                <div className="send-bodyTxStatusLine">
                                    <div className="send-txStatusStep">
                                        {transferStatusTracker["2"] === "" ?
                                            `2` : 
                                            <>
                                                {transferStatusTracker["2"] === "in-progress" ?
                                                    <BeatLoader
                                                        color='var(--primary-bg-01)'
                                                        size={3}
                                                    /> : 
                                                    <>
                                                        {transferStatusTracker["2"] === "error" ?
                                                            <CancelSharp className="send-txStatusStepRedIcon"/> : 
                                                            <>
                                                                {transferStatusTracker["2"] === "complete" ?
                                                                    <CheckCircleSharp className="send-txStatusStepGreenIcon"/> : null
                                                                }
                                                            </>
                                                        }
                                                    </>
                                                }
                                            </>
                                        }
                                    </div>
                                    <div className="send-txStatusStepDesc">Tx Successful</div>
                                </div>
                            </div>
                            <div className="send-bodyTxStatusReqKeyContainer">
                                <div className="send-bodyTxStatusReqKey">
                                    <span className="send-bodyTxStatusReqKeyDescOne">Request Key&nbsp;&nbsp;</span>
                                    <div className="send-bodyTxStatusReqKeyDescTwo">
                                        {txRequestKey === "" ? 
                                            "Retrieving from blockchain ..." : `${txRequestKey}`
                                        }
                                    </div>
                                </div>
                                <button className="send-bodyTxStatusReqKeyCopyContainer"
                                        onClick={() => copyToClipboard()}
                                    >
                                    {!txReqKeyCopied ?
                                        <ContentCopy className="send-bodyTxStatusReqKeyCopyContainerIcon"/> : 
                                        <CheckCircleOutline className="send-bodyTxStatusReqKeyCopyContainerIcon" style={{"color": "var(--primary-green-09)"}}/>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}