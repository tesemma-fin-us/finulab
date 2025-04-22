import './send.css';
import '../receive/receive.css';
import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import BeatLoader from 'react-spinners/BeatLoader';
import {useDispatch, useSelector} from 'react-redux';
import {CancelSharp, CheckCircleOutline, CheckCircleSharp, ContentCopy, PersonPin, SendToMobile} from '@mui/icons-material';

import {selectUser} from '../../reduxStore/user';
import {selectWalletDesc} from '../../reduxStore/walletDesc';
import {setFinuxTxBeingSent} from '../../reduxStore/finuxTxBeingSent';
import {setWalletRefreshCounter, selectWalletRefreshCounter} from '../../reduxStore/walletRefreshCounter';

import generalOpx from '../../functions/generalFunctions';

const privileged_accts = process.env.REACT_PRIVILEGED_ACCTS;
const finux_chainOptns = [
    "Chain 0", "Chain 1", "Chain 2", "Chain 3",
    "Chain 4", "Chain 5", "Chain 6", "Chain 7",
    "Chain 8", "Chain 9", "Chain 10", "Chain 11", 
    "Chain 12", "Chain 13", "Chain 14", "Chain 15", 
    "Chain 16", "Chain 17", "Chain 18", "Chain 19"
];
const finux_root_accounts = [
    "finulab-bank", "finulab-marketing-bank", "finulab-competition-bank", "finulab-account-creation-bonus-bank", "finulab-prediction-market-liquidity-pool",
    "finulab-prediction-market-escrow-account", "finulab-prediction-market-collateral-account", "finulab-prediction-market-fees", "finulab-monetization-vault", "finulab-subscriptions"
];

export default function FinuxSend() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const user = useSelector(selectUser);
    const walletDesc = useSelector(selectWalletDesc);
    const walletRefreshCounter = useSelector(selectWalletRefreshCounter);

    const [privilegedType, setPrivilegedType] = useState("user");
    const [sendFinuxTranslateX, setSendFinuxTranslateX] = useState("0px");
   
    const privilegedTypeToggle = (selection) => {
        if(user) {
            if(privileged_accts.includes(user.user)) {
                setPrivilegedType(selection);
            }
        }
    }

    const [adminTransferFinuxSupport, setAdminTransferFinuxSupport] = useState(
        {
            "from": "",
            "fromChain": "0",
            "to": "",
            "toChain": "0",
            "transferAmount": 0
        }
    );
    const adminTransferFinuxSupportHandler = (e) => {
        const {name, value} = e.target;
        setAdminTransferFinuxSupport(
            {
                ...adminTransferFinuxSupport, [name]: value
            }
        );
    }
    const adminTransferFinuxChainSelector = (e) => {
        const {name, value} = e.target;
        const clarifiedValue = value.split(" ")[1];
        setAdminTransferFinuxSupport(
            {
                ...adminTransferFinuxSupport, [name]: clarifiedValue
            }
        );
    }

    const [transferFinuxSupport, setTransferFinuxSupport] = useState(
        {
            "from": user.walletAddress,
            "fromChain": "0",
            "to": "",
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
                ...transferFinuxSupport, [name]: clarifiedValue
            }
        );
    }

    const [pollId, setPollId] = useState("");
    const [transferType, setTransferType] = useState("chain");
    const [transferCalledBy, setTransferCalledBy] = useState("user");
    const [transferStatusTracker, setTransferStatusTracker] = useState({"1": "", "2": ""});
    const [xChainTransferStatusTracker, setXChainTransferStatusTracker] = useState({"1": "", "2": "", "3": "", "4": "", "5": ""});

    const [txSendLoading, setTxSendLoading] = useState(false);
    const [txSendErrorCode, setTxSendErrorCode] = useState(0);
    const [transferInProgress, setTransferInProgress] = useState(false);

    const adminCommitTx = async () => {
        setTxSendLoading(true);

        if(adminTransferFinuxSupport.from === adminTransferFinuxSupport.to
            && adminTransferFinuxSupport.fromChain === adminTransferFinuxSupport.toChain
        ) {
            setTxSendErrorCode(1);

            setTimeout(() => {
                setTxSendErrorCode(0);
                setTxSendLoading(false);
            }, 2000);
        } else if(adminTransferFinuxSupport.transferAmount <= 0) {
            setTxSendErrorCode(2);

            setTimeout(() => {
                setTxSendErrorCode(0);
                setTxSendLoading(false);
            }, 2000);
        } else {
            await generalOpx.axiosInstance.post(`/wallet/privileged-transfer-finux`,
                {
                    "to": adminTransferFinuxSupport.to,
                    "from": adminTransferFinuxSupport.from,
                    "toChain": adminTransferFinuxSupport.toChain,
                    "fromChain": adminTransferFinuxSupport.fromChain,
                    "amount": adminTransferFinuxSupport.transferAmount
                }
            ).then(
                async (response) => {
                    if(response.data["status"] === "success") {
                        setPollId(response.data["pollId"]);

                        setTxSendLoading(false);
                        setTransferInProgress(true);
                        setTransferCalledBy("admin");
                        adminTransferFinuxSupport.fromChain === adminTransferFinuxSupport.toChain ? setTransferType("chain") : setTransferType("xChain");


                        setSendFinuxTranslateX("-100% - 14px");
                        dispatch(
                            setFinuxTxBeingSent(true)
                        );

                        setTimeout(() => {
                            if(adminTransferFinuxSupport.fromChain === adminTransferFinuxSupport.toChain) {
                                setTransferStatusTracker(
                                    {
                                        "1": "complete",
                                        "2": "in-progress"
                                    }
                                );
                            } else {
                                setXChainTransferStatusTracker(
                                    {
                                        "1": "complete",
                                        "2": "in-progress", "3": "", "4": "", "5": ""
                                    }
                                );
                            }
                        }, 0);
                    } else {
                        setTxSendErrorCode(3);

                        setTimeout(() => {
                            setTxSendErrorCode(0);
                            setTxSendLoading(false);
                        }, 2000);
                    }
                }
            ).catch(
                () => {
                    setTxSendErrorCode(3);

                    setTimeout(() => {
                        setTxSendErrorCode(0);
                        setTxSendLoading(false);
                    }, 2000);
                }
            );
        }
    }

    const commitTx = async () => {
        setTxSendLoading(true);

        let proceede_wTx = false;
        if(transferFinuxSupport.to.slice(0, 2) !== "k:"
            && !finux_root_accounts.includes(transferFinuxSupport.to)
        ) {
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
            await generalOpx.axiosInstance.post(`/wallet/transfer-finux`, 
                {
                    "to": transferFinuxSupport.to,
                    "accountId": user.walletAddress,
                    "toChain": transferFinuxSupport.toChain,
                    "fromChain": transferFinuxSupport.fromChain,
                    "amount": transferFinuxSupport.transferAmount
                }
            ).then(
                async (response) => {
                    if(response.data["status"] === "success") {
                        setPollId(response.data["pollId"]);

                        setTxSendLoading(false);
                        setTransferInProgress(true);
                        setTransferCalledBy("user");
                        transferFinuxSupport.fromChain === transferFinuxSupport.toChain ? setTransferType("chain") : setTransferType("xChain");


                        setSendFinuxTranslateX("-100% - 14px");
                        dispatch(
                            setFinuxTxBeingSent(true)
                        );

                        setTimeout(() => {
                            if(transferFinuxSupport.fromChain === transferFinuxSupport.toChain) {
                                setTransferStatusTracker(
                                    {
                                        "1": "complete",
                                        "2": "in-progress"
                                    }
                                );
                            } else {
                                setXChainTransferStatusTracker(
                                    {
                                        "1": "complete",
                                        "2": "in-progress", "3": "", "4": "", "5": ""
                                    }
                                );
                            }
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

                if(transferType === "chain") {
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
                } else {
                    if(xChainTransferStatusTracker["2"] === "in-progress") {
                        if(pollData.data["data"]["validated"]) {
                            setXChainTransferStatusTracker(
                                {
                                    "1": "complete",
                                    "2": "complete", 
                                    "3": "in-progress", "4": "", "5": ""
                                }
                            );
                        } else {
                            if(pollData.data["data"]["txCompleted"]) {
                                setXChainTransferStatusTracker(
                                    {
                                        "1": "complete",
                                        "2": "error",
                                        "3": "", "4": "", "5": ""
                                    }
                                );

                                setPollId("");
                                setTransferInProgress(false);
                            }
                        }
                    } else if(xChainTransferStatusTracker["3"] === "in-progress") {
                        if(pollData.data["data"]["spvProofReterived"]) {
                            setXChainTransferStatusTracker(
                                {
                                    "1": "complete",
                                    "2": "complete", 
                                    "3": "complete", 
                                    "4": "in-progress", "5": ""
                                }
                            );
                        } else {
                            if(pollData.data["data"]["txCompleted"]) {
                                setXChainTransferStatusTracker(
                                    {
                                        "1": "complete",
                                        "2": "complete", 
                                        "3": "error", 
                                        "4": "", "5": ""
                                    }
                                );

                                setPollId("");
                                setTransferInProgress(false);
                            }
                        }
                    } else if(xChainTransferStatusTracker["4"] === "in-progress") {
                        if(pollData.data["data"]["continuationSent"]) {
                            setXChainTransferStatusTracker(
                                {
                                    "1": "complete",
                                    "2": "complete", 
                                    "3": "complete", 
                                    "4": "complete", 
                                    "5": "in-progress"
                                }
                            );
                        } else {
                            if(pollData.data["data"]["txCompleted"]) {
                                setXChainTransferStatusTracker(
                                    {
                                        "1": "complete",
                                        "2": "complete", 
                                        "3": "complete", 
                                        "4": "error", 
                                        "5": ""
                                    }
                                );

                                setPollId("");
                                setTransferInProgress(false);
                            }
                        }
                    } else if(xChainTransferStatusTracker["5"] === "in-progress") {
                        if(pollData.data["data"]["txCompleted"]) {
                            if(pollData.data["data"]["txOutcome"] === "success") {
                                setXChainTransferStatusTracker(
                                    {
                                        "1": "complete",
                                        "2": "complete", 
                                        "3": "complete", 
                                        "4": "complete", 
                                        "5": "complete"
                                    }
                                );

                                setPollId("");
                                setTransferInProgress(false);
                                setRefreshAccountBalance(prevState => prevState + 1);
                            } else {
                                setXChainTransferStatusTracker(
                                    {
                                        "1": "complete",
                                        "2": "complete", 
                                        "3": "complete", 
                                        "4": "complete", 
                                        "5": "error"
                                    }
                                );

                                setPollId("");
                                setTransferInProgress(false);
                            }
                        }
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
    }, [pollId, transferInProgress, transferStatusTracker, xChainTransferStatusTracker]);

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

    return(
        <div className="send-wrapper">
            <div className="receive-header">
                <span className="receive-headerText" style={{"fontSize": "1.2rem"}}>Send</span>
                {sendFinuxTranslateX === "0px" ?
                    <>
                        {user ?
                            <>
                                {privileged_accts.includes(user.user) ?
                                    <div className="type_OptnsModulator">
                                        <button className="type_optnsModulatorBtnV1"
                                                onClick={() => privilegedTypeToggle("admin")}
                                                style={privilegedType === "admin" ? {"color": "var(--primary-bg-10)", "backgroundColor": "var(--primary-bg-01)"} : {}}
                                            >
                                            Admin
                                        </button>
                                        <button className="type_optnsModulatorBtnV2"
                                                onClick={() => privilegedTypeToggle("user")}
                                                style={privilegedType === "user" ? {"color": "var(--primary-bg-10)", "backgroundColor": "var(--primary-bg-01)"} : {}}
                                            >
                                            User
                                        </button>
                                    </div> : null
                                }
                            </> : null
                        }
                    </> : 
                    <button className="transferFinux-ExitStatusBtn"
                            onClick={() => done_wTx()}
                            disabled={txSendLoading || transferInProgress}
                            style={txSendLoading || transferInProgress ? {"backgroundColor": "var(--primary-bg-05)"} : {}}
                        >
                        Done
                    </button>
                }
            </div>
            <div className="send-body">
                <div className="send-bodyInnerContainer"
                        style={{"translate": `calc(${sendFinuxTranslateX})`}}
                    >
                    <div className="send-bodyTxInfo">
                        {privilegedType === "admin" ?
                            <>
                                <div className="send-inputLineHeader">From</div>
                                <div className="finulab-createAccountEmailUpdateInputCont"
                                        style={{"marginBottom": "0", "width": "100%", "minWidth": "100%", "maxWidth": "100%"}}
                                    >
                                    <PersonPin className="main-loginbodyInputIcon"/>
                                    <input type="text"
                                        name='from'
                                        value={adminTransferFinuxSupport.from}
                                        onChange={adminTransferFinuxSupportHandler}
                                        placeholder='k:...'
                                        autoCapitalize='off'
                                        autoComplete='off'
                                        className="finulab-sendFinuxToAddressInput" 
                                        style={{"height": "40px", "minHeight": "40px", "maxHeight": "40px"}}
                                    />
                                    <select name='fromChain'
                                            value={`Chain ${adminTransferFinuxSupport.fromChain}`}
                                            onChange={adminTransferFinuxChainSelector}
                                            style={{"height": "40px", "minHeight": "40px", "maxHeight": "40px"}}
                                            className="finulab-sendFinuxToChainSelect"
                                        >
                                        {finux_chainOptns.map((chain_desc, index) => (
                                                <option value={chain_desc} key={`admin-from-Chain-${index}`}>{chain_desc}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div className="send-inputLineHeader" style={{"marginTop": "30px"}}>To</div>
                                <div className="finulab-createAccountEmailUpdateInputCont"
                                        style={{"width": "100%", "minWidth": "100%", "maxWidth": "100%"}}
                                    >
                                    <PersonPin className="main-loginbodyInputIcon"/>
                                    <input type="text"
                                        name='to'
                                        value={adminTransferFinuxSupport.to}
                                        onChange={adminTransferFinuxSupportHandler}
                                        placeholder='k:...'
                                        autoCapitalize='off'
                                        autoComplete='off'
                                        className="finulab-sendFinuxToAddressInput" 
                                        style={{"height": "40px", "minHeight": "40px", "maxHeight": "40px"}}
                                    />
                                    <select name='toChain'
                                            value={`Chain ${adminTransferFinuxSupport.toChain}`}
                                            onChange={adminTransferFinuxChainSelector} 
                                            style={{"height": "40px", "minHeight": "40px", "maxHeight": "40px"}}
                                            className="finulab-sendFinuxToChainSelect"
                                        >
                                        {finux_chainOptns.map((chain_desc, index) => (
                                                <option value={chain_desc} key={`admin-to-Chain-${index}`}>{chain_desc}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div className="send-inputLineHeader" style={{"marginTop": "6px"}}>Amount</div>
                                <div className="main-loginInputCont"
                                        style={{"marginTop": "0"}}
                                    >
                                    <SendToMobile className="main-loginbodyInputIcon"/>
                                    <input type="number"
                                        name='transferAmount'
                                        value={adminTransferFinuxSupport.transferAmount}
                                        onChange={adminTransferFinuxSupportHandler}
                                        placeholder='0'
                                        autoCapitalize='off'
                                        autoComplete='off'
                                        className="main-createAccountInput" 
                                        style={{"height": "40px", "minHeight": "40px", "maxHeight": "40px"}}
                                    />
                                </div>
                                <div className="commit-txUnderlineContainer">
                                    {txSendErrorCode === 1 ?
                                        <div className="commit-txUnderlineErrorDesc">From and to account must be different.</div> : 
                                        <>
                                            {txSendErrorCode === 2 ?
                                                <div className="commit-txUnderlineErrorDesc">Transfer amount must be greater than 0.</div> : 
                                                <>
                                                    {txSendErrorCode === 3 ?
                                                        <div className="commit-txUnderlineErrorDesc">An error occured, please try again later.</div> : null
                                                    }
                                                </>
                                            }
                                        </>
                                    }
                                    <button className="send-transferBtn"
                                            onClick={() => adminCommitTx()}
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
                            </> : 
                            <>
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
                                        value={transferFinuxSupport.to}
                                        onChange={transferFinuxSupportHandler}
                                        placeholder='k:...'
                                        autoCapitalize='off'
                                        autoComplete='off'
                                        className="finulab-sendFinuxToAddressInput" 
                                        style={{"height": "40px", "minHeight": "40px", "maxHeight": "40px"}}
                                    />
                                    <select name='toChain'
                                            value={`Chain ${transferFinuxSupport.toChain}`}
                                            onChange={transferFinuxChainSelector}
                                            style={{"height": "40px", "minHeight": "40px", "maxHeight": "40px"}}
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
                                        value={transferFinuxSupport.transferAmount}
                                        onChange={transferFinuxSupportHandler}
                                        placeholder='0'
                                        autoCapitalize='off'
                                        autoComplete='off'
                                        className="main-createAccountInput" 
                                        style={{"height": "40px", "minHeight": "40px", "maxHeight": "40px"}}
                                    />
                                </div>
                                <div className="commit-txUnderlineContainer">
                                    {txSendErrorCode === 1 ?
                                        <div className="commit-txUnderlineErrorDesc">Transfer must be to a 'k:' account.</div> : 
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
                            </>
                        }
                    </div>
                    <div className="send-bodyTxInfo">
                        <div className="receive-secondaryHeader" style={{"position": "relative", "marginTop": "0"}}>
                            Tx Information
                            &nbsp;<span className="receive-secondaryHeaderUnderDesc">*Please don't close, tx may take up to 10 min.</span>
                        </div>
                        <div className="send-bodyForTxStatus">
                            <div className="receive-bodyHeader">
                                <span className="receive-bodyHeaderText">Status</span>
                            </div>
                            {transferType === "chain" ?
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
                                </div> : 
                                <div className="send-bodyTxStatusContainer">
                                    <div className="send-bodyTxStatusLine" style={{"marginTop": "12px"}}>
                                        <div className="send-txStatusStep">
                                            {xChainTransferStatusTracker["1"] === "" ?
                                                `1` : 
                                                <>
                                                    {xChainTransferStatusTracker["1"] === "in-progress" ?
                                                        <BeatLoader
                                                            color='var(--primary-bg-01)'
                                                            size={3}
                                                        /> : 
                                                        <>
                                                            {xChainTransferStatusTracker["1"] === "error" ?
                                                                <CancelSharp className="send-txStatusStepRedIcon"/> : 
                                                                <>
                                                                    {xChainTransferStatusTracker["1"] === "complete" ?
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
                                    <div className="send-bodyTxStatusXChainLineConnector">
                                        <div className="send-bodyTxStatusXChainLineConnectorFiller"
                                            style={{
                                                "height": xChainTransferStatusTracker["1"] === "complete" ? "100%" : "0%", 
                                                "minHeight": xChainTransferStatusTracker["1"] === "complete" ? "100%" : "0%", 
                                                "maxHeight": xChainTransferStatusTracker["1"] === "complete" ? "100%" : "0%"
                                            }}
                                        />
                                    </div>
                                    <div className="send-bodyTxStatusLine">
                                        <div className="send-txStatusStep">
                                            {xChainTransferStatusTracker["2"] === "" ?
                                                `2` : 
                                                <>
                                                    {xChainTransferStatusTracker["2"] === "in-progress" ?
                                                        <BeatLoader
                                                            color='var(--primary-bg-01)'
                                                            size={3}
                                                        /> : 
                                                        <>
                                                            {xChainTransferStatusTracker["2"] === "error" ?
                                                                <CancelSharp className="send-txStatusStepRedIcon"/> : 
                                                                <>
                                                                    {xChainTransferStatusTracker["2"] === "complete" ?
                                                                        <CheckCircleSharp className="send-txStatusStepGreenIcon"/> : null
                                                                    }
                                                                </>
                                                            }
                                                        </>
                                                    }
                                                </>
                                            }
                                        </div>
                                        <div className="send-txStatusStepDesc">Got Continuation Response</div>
                                    </div>
                                    <div className="send-bodyTxStatusXChainLineConnector">
                                        <div className="send-bodyTxStatusXChainLineConnectorFiller"
                                            style={{
                                                "height": xChainTransferStatusTracker["2"] === "complete" ? "100%" : "0%", 
                                                "minHeight": xChainTransferStatusTracker["2"] === "complete" ? "100%" : "0%", 
                                                "maxHeight": xChainTransferStatusTracker["2"] === "complete" ? "100%" : "0%"
                                            }}
                                        />
                                    </div>
                                    <div className="send-bodyTxStatusLine">
                                        <div className="send-txStatusStep">
                                            {xChainTransferStatusTracker["3"] === "" ?
                                                `3` : 
                                                <>
                                                    {xChainTransferStatusTracker["3"] === "in-progress" ?
                                                        <BeatLoader
                                                            color='var(--primary-bg-01)'
                                                            size={3}
                                                        /> : 
                                                        <>
                                                            {xChainTransferStatusTracker["3"] === "error" ?
                                                                <CancelSharp className="send-txStatusStepRedIcon"/> : 
                                                                <>
                                                                    {xChainTransferStatusTracker["3"] === "complete" ?
                                                                        <CheckCircleSharp className="send-txStatusStepGreenIcon"/> : null
                                                                    }
                                                                </>
                                                            }
                                                        </>
                                                    }
                                                </>
                                            }
                                        </div>
                                        <div className="send-txStatusStepDesc">SPV Proof Retrieved</div>
                                    </div>
                                    <div className="send-bodyTxStatusXChainLineConnector">
                                        <div className="send-bodyTxStatusXChainLineConnectorFiller"
                                            style={{
                                                "height": xChainTransferStatusTracker["3"] === "complete" ? "100%" : "0%", 
                                                "minHeight": xChainTransferStatusTracker["3"] === "complete" ? "100%" : "0%", 
                                                "maxHeight": xChainTransferStatusTracker["3"] === "complete" ? "100%" : "0%"
                                            }}
                                        />
                                    </div>
                                    <div className="send-bodyTxStatusLine">
                                        <div className="send-txStatusStep">
                                            {xChainTransferStatusTracker["4"] === "" ?
                                                `4` : 
                                                <>
                                                    {xChainTransferStatusTracker["4"] === "in-progress" ?
                                                        <BeatLoader
                                                            color='var(--primary-bg-01)'
                                                            size={3}
                                                        /> : 
                                                        <>
                                                            {xChainTransferStatusTracker["4"] === "error" ?
                                                                <CancelSharp className="send-txStatusStepRedIcon"/> : 
                                                                <>
                                                                    {xChainTransferStatusTracker["4"] === "complete" ?
                                                                        <CheckCircleSharp className="send-txStatusStepGreenIcon"/> : null
                                                                    }
                                                                </>
                                                            }
                                                        </>
                                                    }
                                                </>
                                            }
                                        </div>
                                        <div className="send-txStatusStepDesc">
                                            Initiate Claim on Chain {transferCalledBy === "user" ? transferFinuxSupport.toChain : adminTransferFinuxSupport.toChain}
                                        </div>
                                    </div>
                                    <div className="send-bodyTxStatusXChainLineConnector">
                                        <div className="send-bodyTxStatusXChainLineConnectorFiller"
                                            style={{
                                                "height": xChainTransferStatusTracker["4"] === "complete" ? "100%" : "0%", 
                                                "minHeight": xChainTransferStatusTracker["4"] === "complete" ? "100%" : "0%", 
                                                "maxHeight": xChainTransferStatusTracker["4"] === "complete" ? "100%" : "0%"
                                            }}
                                        />
                                    </div>
                                    <div className="send-bodyTxStatusLine">
                                        <div className="send-txStatusStep">
                                            {xChainTransferStatusTracker["5"] === "" ?
                                                `5` : 
                                                <>
                                                    {xChainTransferStatusTracker["5"] === "in-progress" ?
                                                        <BeatLoader
                                                            color='var(--primary-bg-01)'
                                                            size={3}
                                                        /> : 
                                                        <>
                                                            {xChainTransferStatusTracker["5"] === "error" ?
                                                                <CancelSharp className="send-txStatusStepRedIcon"/> : 
                                                                <>
                                                                    {xChainTransferStatusTracker["5"] === "complete" ?
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
                            }
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
