const axios = require("axios");
const dotenv = require("dotenv");
const dateFns = require("date-fns");
const pact = require("pact-lang-api");
const router = require("express").Router();

const finuxTxs = require("../models/finux-txs");
const accountsWalletDescs = require("../models/accounts-wallet-descs");
const usersVerifiedRecord = require("../models/users-verified-record");

dotenv.config();

const networkId = "mainnet01";
const privilegedAccounts = ["tesemma.fin-us"];
const chainIds = ["0", "1", "2", "3", "4", "5", "6", "7", "8", 
    "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"
];
const chainwebLocal_one = "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/", chainwebLocal_two = "/pact/api/v1/local";
const root_accounts = [
    "finulab-bank", "finulab-marketing-bank", "finulab-competition-bank", "finulab-account-creation-bonus-bank", "finulab-prediction-market-liquidity-pool",
    "finulab-prediction-market-escrow-account", "finulab-prediction-market-collateral-account", "finulab-prediction-market-fees", "finulab-monetization-vault", "finulab-subscriptions"
];

router.put("/pending-balance", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            await accountsWalletDescs.findOne(
                {
                    username: uniqueId
                }
            ).then(
                (walletData) => {
                    if(!walletData) {return res.status(200).json({"status": "error"});}

                    if(walletData) {return res.status(200).json({"status": "success", "data": walletData.pendingBalanceMorning + walletData.pendingBalanceEvening})}
                }
            )
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/specific-chain-balance", async (req, res) => 
    {
        try {
            const chainId = `${req.body.chainId}`;
            const uniqueId = `${req.body.uniqueId}`;
            const accountId = `${req.body.accountId}`;

            if(!chainIds.includes(chainId)) {return res.status(200).json({"status": "error"});}
            if(!(accountId.slice(0, 2) === "k:")) {return res.status(200).json({"status": "error"});}

            const accountDesc = await accountsWalletDescs.findOne(
                {
                    username: uniqueId
                }
            );
            if(!accountDesc) {return res.status(200).json({"status": "error"});}
            if(!(accountId === `k:${accountDesc["publicKey"]}`)) {return res.status(200).json({"status": "error"});}

            const ttl = 28800;
            const now = new Date();
            const creationTime = dateFns.getUnixTime(now);

            const gasLimit = 2320;
            const gasPrice = 0.000000010000;

            const sender = "chainweaver";
            const code = `{"${accountId}": (try false (free.finux.details "${accountId}"))}`;

            const pactCmd = pact.simple.exec.createCommand(undefined, undefined,
                code,
                undefined, pact.lang.mkMeta(sender, chainId, gasPrice, gasLimit, creationTime, ttl), networkId
            );

            let specific_balance = [];
            const chainResponse = await axios.post(`${chainwebLocal_one}${chainId}${chainwebLocal_two}`, pactCmd["cmds"][0]);
            if(chainResponse.data["result"]["status"] === "success"
                && chainResponse.data["result"]["data"][accountId] !== false
            ) {
                const valBal = Number(chainResponse.data["result"]["data"][accountId]["balance"]);
                if(isNaN(valBal) || !isFinite(valBal)) {
                    const s_valBal = Number(chainResponse.data["result"]["data"][accountId]["balance"]["decimal"]);
                    if(!isNaN(s_valBal) && isFinite(s_valBal)) {
                        specific_balance = [
                            chainResponse.data["metaData"]["publicMeta"]["chainId"],
                            chainResponse.data["result"]["data"][accountId]["balance"]["decimal"]
                        ];
                    }
                } else {
                    specific_balance = [
                        chainResponse.data["metaData"]["publicMeta"]["chainId"],
                        chainResponse.data["result"]["data"][accountId]["balance"]
                    ];
                }
            }

            if(specific_balance.length === 0) {
                return res.status(200).json({"status": "success", "data": 0});
            } else {
                const pendedTxBalanceDesc = await finuxTxs.find({from: accountId, fromChain: chainId, txCompleted: false});

                if(pendedTxBalanceDesc.length === 0) {
                    return res.status(200).json({"status": "success", "data": Number(specific_balance[1])});
                } else {
                    let pendedTxBalance = 0;
                    for(let i = 0; i < pendedTxBalanceDesc.length; i++) {
                        pendedTxBalance = pendedTxBalance + pendedTxBalanceDesc[i]["amount"];
                    }

                    return res.status(200).json({"status": "success", "data": Number(specific_balance[1]) - Number(pendedTxBalance)});
                }
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/chain-balance", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const accountId = `${req.body.accountId}`;
            if(!(accountId.slice(0, 2) === "k:")) {return res.status(200).json({"status": "error"});}

            const accountDesc = await accountsWalletDescs.findOne(
                {
                    username: uniqueId
                }
            );
            if(!accountDesc) {return res.status(200).json({"status": "error"});}
            if(!(accountId === `k:${accountDesc["publicKey"]}`)) {return res.status(200).json({"status": "error"});}

            let lastTxUnixTimestamp = 0;
            const url = `https://estats.chainweb.com/txs/account/${accountId}?limit=20&token=free.finux`;
            const txHistory = await axios.get(url);
            if(txHistory.data.length === 0) {
                lastTxUnixTimestamp = 0
            } else {
                const lastTxDateString = txHistory.data[0]["blockTime"];
                lastTxUnixTimestamp = dateFns.getUnixTime(dateFns.parseISO(lastTxDateString));
            }

            const chain_by_chain_keys = Object.keys(accountDesc["chain_by_chain"]);
            if(txHistory.data.length === 0) {
                if(chain_by_chain_keys.length === 0) {
                    await accountsWalletDescs.updateOne(
                        {username: uniqueId},
                        {$set: {chain_by_chain: {"initialized": true, "lastTxTimestamp": 0}}}
                    );
                }

                return res.status(200).json(
                    {
                        "status": "success", 
                        "data": {"initialized": true, "lastTxTimestamp": 0}, 
                        "pendingBalance": accountDesc["pendingBalanceMorning"] + accountDesc["pendingBalanceEvening"]
                    }
                );
            } else {
                const chain_by_chain_lstTxTS = accountDesc["chain_by_chain"]["lastTxTimestamp"] || 0;
                if(chain_by_chain_keys.length === 0 
                    || chain_by_chain_lstTxTS !== lastTxUnixTimestamp
                ) {
                    const ttl = 28800;
                    const now = new Date();
                    const creationTime = dateFns.getUnixTime(now);

                    const gasLimit = 2320;
                    const gasPrice = 0.000000010000;

                    const sender = "chainweaver";
                    const code = `{"${accountId}": (try false (free.finux.details "${accountId}"))}`;

                    let chainPromises = [];
                    for(let i = 0; i < chainIds.length; i++) {
                        const pactCmd = pact.simple.exec.createCommand(undefined, undefined,
                            code,
                            undefined, pact.lang.mkMeta(sender, chainIds[i], gasPrice, gasLimit, creationTime, ttl), networkId
                        );

                        chainPromises.push(
                            await axios.post(`${chainwebLocal_one}${chainIds[i]}${chainwebLocal_two}`, pactCmd["cmds"][0])
                        );
                    }
                    
                    let chain_by_chain_desc = [];
                    try {
                        const chainResponses = await Promise.all(chainPromises);
                        chainResponses.forEach((response, index) => 
                            {
                                try {
                                    if(response.data["result"]["status"] === "success"
                                        && response.data["result"]["data"][accountId] !== false
                                    ) {
                                        const valBal = Number(response.data["result"]["data"][accountId]["balance"]);
                                        if(isNaN(valBal) || !isFinite(valBal)) {
                                            const s_valBal = response.data["result"]["data"][accountId]["balance"]["decimal"];
                                            if(!isNaN(s_valBal) && isFinite(s_valBal)) {
                                                chain_by_chain_desc.push(
                                                    [
                                                        response.data["metaData"]["publicMeta"]["chainId"],
                                                        response.data["result"]["data"][accountId]["balance"]["decimal"]
                                                    ]
                                                );
                                            }
                                        } else {
                                            chain_by_chain_desc.push(
                                                [
                                                    response.data["metaData"]["publicMeta"]["chainId"],
                                                    response.data["result"]["data"][accountId]["balance"]
                                                ]
                                            );
                                        }
                                    }
                                } catch(err) {}
                            }
                        );
                    } catch(error) {}

                    if(chain_by_chain_desc.length === 0) {
                        await accountsWalletDescs.updateOne(
                            {username: uniqueId},
                            {$set: {chain_by_chain: {"initialized": true, "lastTxTimestamp": lastTxUnixTimestamp}}}
                        );

                        return res.status(200).json(
                            {
                                "status": "success", 
                                "data": {"initialized": true},
                                "pendingBalance": accountDesc["pendingBalanceMorning"] + accountDesc["pendingBalanceEvening"]
                            }
                        );
                    } else {
                        let chain_by_chain_set = {"initialized": true, "lastTxTimestamp": lastTxUnixTimestamp};
                        for(let j = 0; j < chain_by_chain_desc.length; j++) {
                            chain_by_chain_set = {
                                ...chain_by_chain_set,
                                [chain_by_chain_desc[j][0]]: chain_by_chain_desc[j][1]
                            };
                        }
                        await accountsWalletDescs.updateOne(
                            {username: uniqueId},
                            {$set: {chain_by_chain: chain_by_chain_set}}
                        );

                        return res.status(200).json(
                            {
                                "status": "success", 
                                "data": chain_by_chain_set,
                                "pendingBalance": accountDesc["pendingBalanceMorning"] + accountDesc["pendingBalanceEvening"]
                            }
                        );
                    }
                } else {
                    return res.status(200).json(
                        {
                            "status": "success", 
                            "data": accountDesc["chain_by_chain"], 
                            "pendingBalance": accountDesc["pendingBalanceMorning"] + accountDesc["pendingBalanceEvening"]
                        }
                    );
                }
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/refresh-balance", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const accountId = `${req.body.accountId}`;
            if(!(accountId.slice(0, 2) === "k:")) {return res.status(200).json({"status": "error"});}

            const accountDesc = await accountsWalletDescs.findOne(
                {
                    username: uniqueId
                }
            );
            if(!accountDesc) {return res.status(200).json({"status": "error"});}
            if(!(accountId === `k:${accountDesc["publicKey"]}`)) {return res.status(200).json({"status": "error"});}

            let lastTxUnixTimestamp = 0;
            const url = `https://estats.chainweb.com/txs/account/${accountId}?limit=20&token=free.finux`;
            const txHistory = await axios.get(url);
            if(txHistory.data.length === 0) {
                lastTxUnixTimestamp = 0
            } else {
                const lastTxDateString = txHistory.data[0]["blockTime"];
                lastTxUnixTimestamp = dateFns.getUnixTime(dateFns.parseISO(lastTxDateString));
            }

            const ttl = 28800;
            const now = new Date();
            const creationTime = dateFns.getUnixTime(now);

            const gasLimit = 2320;
            const gasPrice = 0.000000010000;

            const sender = "chainweaver";
            const code = `{"${accountId}": (try false (free.finux.details "${accountId}"))}`;

            let chainPromises = [];
            for(let i = 0; i < chainIds.length; i++) {
                const pactCmd = pact.simple.exec.createCommand(undefined, undefined,
                    code,
                    undefined, pact.lang.mkMeta(sender, chainIds[i], gasPrice, gasLimit, creationTime, ttl), networkId
                );

                chainPromises.push(
                    await axios.post(`${chainwebLocal_one}${chainIds[i]}${chainwebLocal_two}`, pactCmd["cmds"][0])
                );
            }
            
            let chain_by_chain_desc = [];
            try {
                const chainResponses = await Promise.all(chainPromises);
                chainResponses.forEach((response, index) => 
                    {
                        try {
                            if(response.data["result"]["status"] === "success"
                                && response.data["result"]["data"][accountId] !== false
                            ) {
                                const valBal = Number(response.data["result"]["data"][accountId]["balance"]);
                                if(isNaN(valBal) || !isFinite(valBal)) {
                                    const s_valBal = Number(response.data["result"]["data"][accountId]["balance"]["decimal"]);
                                    if(!isNaN(s_valBal) && isFinite(s_valBal)) {
                                        chain_by_chain_desc.push(
                                            [
                                                response.data["metaData"]["publicMeta"]["chainId"],
                                                response.data["result"]["data"][accountId]["balance"]["decimal"]
                                            ]
                                        );
                                    }
                                } else {
                                    chain_by_chain_desc.push(
                                        [
                                            response.data["metaData"]["publicMeta"]["chainId"],
                                            response.data["result"]["data"][accountId]["balance"]
                                        ]
                                    );
                                }
                            }
                        } catch(err) {}
                    }
                );
            } catch(error) {}

            if(chain_by_chain_desc.length === 0) {
                await accountsWalletDescs.updateOne(
                    {username: uniqueId},
                    {$set: {chain_by_chain: {"initialized": true, "lastTxTimestamp": lastTxUnixTimestamp}}}
                );

                return res.status(200).json(
                    {
                        "status": "success", 
                        "data": {"initialized": true},
                        "pendingBalance": accountDesc["pendingBalanceMorning"] + accountDesc["pendingBalanceEvening"]
                    }
                );
            } else {
                let chain_by_chain_set = {"initialized": true, "lastTxTimestamp": lastTxUnixTimestamp};
                for(let j = 0; j < chain_by_chain_desc.length; j++) {
                    chain_by_chain_set = {
                        ...chain_by_chain_set,
                        [chain_by_chain_desc[j][0]]: chain_by_chain_desc[j][1]
                    };
                }
                await accountsWalletDescs.updateOne(
                    {username: uniqueId},
                    {$set: {chain_by_chain: chain_by_chain_set}}
                );

                return res.status(200).json(
                    {
                        "status": "success", 
                        "data": chain_by_chain_set,
                        "pendingBalance": accountDesc["pendingBalanceMorning"] + accountDesc["pendingBalanceEvening"]
                    }
                );
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/tx-history", async (req, res) => 
    {
        try {
            const accountId = `${req.body.accountId}`;
            const url = `https://estats.chainweb.com/txs/account/${accountId}?limit=20&token=free.finux`;

            const txHistory = await axios.get(url);
            return res.status(200).json(
                {
                    "status": "success", 
                    "data": txHistory.data, 
                    "next": txHistory.headers["chainweb-next"] === undefined || txHistory.headers["chainweb-next"] === null ?
                    "" : `${txHistory.headers["chainweb-next"]}`
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/tx-history-expand", async (req, res) => 
    {
        try {
            const next = `${req.body.next}`;
            const accountId = `${req.body.accountId}`;
            const url = `https://estats.chainweb.com/txs/account/${accountId}?next=${next}&limit=20&token=free.finux`;
                    
            const txHistory = await axios.get(url);
            return res.status(200).json(
                {
                    "status": "success", 
                    "data": txHistory.data, 
                    "next": txHistory.headers["chainweb-next"] === undefined || txHistory.headers["chainweb-next"] === null ?
                    "" : `${txHistory.headers["chainweb-next"]}`
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/transfer-finux", async (req, res) => 
    {
        try {
            const to = `${req.body.to}`;
            const toChain = `${req.body.toChain}`;
            const amount = Number(req.body.amount);
            const fromChain = `${req.body.fromChain}`;

            if(to.length === 0) {return res.status(200).json({"status": "error"});}
            if(!chainIds.includes(toChain)) {return res.status(200).json({"status": "error"});}
            if(!chainIds.includes(fromChain)) {return res.status(200).json({"status": "error"});}
            if(isNaN(amount) || !isFinite(amount)) {return res.status(200).json({"status": "error"});}

            if(amount <= 0) {return res.status(200).json({"status": "error"});}

            const uniqueId = `${req.body.uniqueId}`;
            const accountId = `${req.body.accountId}`;

            const accountDesc = await accountsWalletDescs.findOne(
                {
                    username: uniqueId
                }
            );
            if(!accountDesc) {return res.status(200).json({"status": "error"});}
            if((accountId === to) && (fromChain === toChain)) {return res.status(200).json({"status": "error"});}
            if(!(accountId === `k:${accountDesc["publicKey"]}`)) {return res.status(200).json({"status": "error"});}

            const availableBalance = req.body.availableBalance;
            if(isNaN(availableBalance) || !isFinite(availableBalance)) {return res.status(200).json({"status": "error"});}

            const market_pendedBalanceDesc = await axios.put(`http://localhost:8901/api/market/chain-pended-balance`, {"uniqueId": uniqueId, "chainId": fromChain});
            const market_pendedBalance = Number(market_pendedBalanceDesc.data["data"]);

            if((availableBalance - market_pendedBalance) < amount) {return res.status(200).json({"status": "error"});}

            const newTx = new finuxTxs(
                {
                    username: uniqueId,
                    from: accountId,
                    fromChain: fromChain,
                    to: to,
                    toChain: toChain,
                    amount: amount,
                    transferType: fromChain === toChain ? "chain" : "xChain",
            
                    sent: false,
                    validated: false,
                    requestKey: "",
                    sentTimestamp: 0,
                    validatedTimestamp: 0,
                    validationAttempts: 0,
            
                    spvProofReterived: false,
                    spvProof: "",
            
                    continuationSent: false,
                    continuationValidated: false,
                    continuationRequestKey: "",
                    continuationSentTimestamp: 0,
                    continuationValidatedTimestamp: 0,
                    
                    txOutcome: "",
                    txCompleted: false
                }
            )
            await newTx.save();

            return res.status(200).json({"status": "success", "pollId": newTx["_id"]});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/privileged-transfer-finux", async (req, res) => 
    {
        try {
            const to = `${req.body.to}`;
            const from = `${req.body.from}`;
            const toChain = `${req.body.toChain}`;
            const amount = Number(req.body.amount);
            const fromChain = `${req.body.fromChain}`;

            if(to.length === 0) {return res.status(200).json({"status": "error"});}
            if(from.length === 0) {return res.status(200).json({"status": "error"});}
            if(!chainIds.includes(toChain)) {return res.status(200).json({"status": "error"});}
            if(!chainIds.includes(fromChain)) {return res.status(200).json({"status": "error"});}
            if(isNaN(amount) || !isFinite(amount)) {return res.status(200).json({"status": "error"});}
            if((from === to) && (fromChain === toChain)) {return res.status(200).json({"status": "error"});}
            if(!(root_accounts.includes(from) || root_accounts.includes(to))) {return res.status(200).json({"status": "error"});}

            if(amount <= 0) {return res.status(200).json({"status": "error"});}

            const uniqueId = `${req.body.uniqueId}`;
            if(!privilegedAccounts.includes(uniqueId)) {return res.status(200).json({"status": "error"});}

            const newTx = new finuxTxs(
                {
                    username: uniqueId,
                    from: from,
                    fromChain: fromChain,
                    to: to,
                    toChain: toChain,
                    amount: amount,
                    transferType: fromChain === toChain ? "chain" : "xChain",
            
                    sent: false,
                    validated: false,
                    requestKey: "",
                    sentTimestamp: 0,
                    validatedTimestamp: 0,
                    validationAttempts: 0,
            
                    spvProofReterived: false,
                    spvProof: "",
            
                    continuationSent: false,
                    continuationValidated: false,
                    continuationRequestKey: "",
                    continuationSentTimestamp: 0,
                    continuationValidatedTimestamp: 0,
                    
                    txOutcome: "",
                    txCompleted: false
                }
            )
            await newTx.save();

            return res.status(200).json({"status": "success", "pollId": newTx["_id"]});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/poll-tx", async (req, res) => 
    {
        try {
            const pollId = `${req.body.pollId}`;

            await finuxTxs.findById(pollId).then(
                async (finuxTxData) => {
                    if(!finuxTxData) {return res.status(200).json({"status": "error"});}

                    if(finuxTxData) {
                        return res.status(200).json({"status": "success", "data": finuxTxData});
                    }
                }
            )
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/get-verified", async (req, res) => 
    {
        try {
            const to = "finulab-subscriptions";
            const toChain = `${req.body.toChain}`;
            const amount = Number(req.body.amount);
            const fromChain = `${req.body.fromChain}`;
            const subscriptionType = `${req.body.subscriptionType}`;

            if(to.length === 0) {return res.status(200).json({"status": "error"});}
            if(!chainIds.includes(toChain)) {return res.status(200).json({"status": "error"});}
            if(!chainIds.includes(fromChain)) {return res.status(200).json({"status": "error"});}
            if(isNaN(amount) || !isFinite(amount)) {return res.status(200).json({"status": "error"});}
            if(!(subscriptionType === "annual" || subscriptionType === "monthly")) {return res.status(200).json({"status": "error"});}

            if(amount <= 0) {return res.status(200).json({"status": "error"});}

            const uniqueId = `${req.body.uniqueId}`;
            const accountId = `${req.body.accountId}`;

            const accountDesc = await accountsWalletDescs.findOne(
                {
                    username: uniqueId
                }
            );
            if(!accountDesc) {return res.status(200).json({"status": "error"});}
            if((accountId === to) && (fromChain === toChain)) {return res.status(200).json({"status": "error"});}
            if(!(accountId === `k:${accountDesc["publicKey"]}`)) {return res.status(200).json({"status": "error"});}

            const availableBalance = req.body.availableBalance;
            if(isNaN(availableBalance) || !isFinite(availableBalance)) {return res.status(200).json({"status": "error"});}

            const market_pendedBalanceDesc = await axios.put(`http://localhost:8901/api/market/chain-pended-balance`, {"uniqueId": uniqueId, "chainId": fromChain});
            const market_pendedBalance = Number(market_pendedBalanceDesc.data["data"]);

            if((availableBalance - market_pendedBalance) < amount) {return res.status(200).json({"status": "error"});}

            let finuxPurchasePrice = 0;
            const finuxOpen = req.body.finuxOpen;
            const finuxClose = req.body.finuxClose;
            if(isNaN(finuxOpen) || !isFinite(finuxOpen)
                || isNaN(finuxClose) || !isFinite(finuxClose)) {return res.status(200).json({"status": "error"});}
            if(subscriptionType === "annual") {
                finuxPurchasePrice = 98.95 / amount;
            } else if(subscriptionType === "monthly") {
                finuxPurchasePrice = 9.65 / amount;
            }

            let estimatedFinuxLow = finuxClose - (Math.abs(finuxClose - finuxOpen) * 5);
            if(finuxPurchasePrice < estimatedFinuxLow) {
                return res.status(200).json({"status": "error"});
            }

            const newTx = new finuxTxs(
                {
                    username: uniqueId,
                    from: accountId,
                    fromChain: fromChain,
                    to: to,
                    toChain: toChain,
                    amount: amount,
                    transferType: fromChain === toChain ? "chain" : "xChain",
            
                    sent: false,
                    validated: false,
                    requestKey: "",
                    sentTimestamp: 0,
                    validatedTimestamp: 0,
                    validationAttempts: 0,
            
                    spvProofReterived: false,
                    spvProof: "",
            
                    continuationSent: false,
                    continuationValidated: false,
                    continuationRequestKey: "",
                    continuationSentTimestamp: 0,
                    continuationValidatedTimestamp: 0,
                    
                    txOutcome: "",
                    txCompleted: false
                }
            )
            await newTx.save();

            const now = new Date();
            const nowFormatted = dateFns.format(now, "MM-dd-yyyy");
            let nextPayDate, nextPayDateFormatted;
            if(subscriptionType === "annual") {
                nextPayDate = dateFns.add(now, {"years": 1});
                nextPayDateFormatted = dateFns.format(nextPayDate, "MM-dd-yyyy");
            } else if(subscriptionType === "monthly") {
                nextPayDate = dateFns.add(now, {"months": 1});
                nextPayDateFormatted = dateFns.format(nextPayDate, "MM-dd-yyyy");
            }

            await usersVerifiedRecord.findOne(
                {
                    username: uniqueId
                }
            ).then(
                async (verifiedRecordData) => {
                    if(!verifiedRecordData) {
                        const newVerifiedUserRecord = new usersVerifiedRecord(
                            {
                                username: uniqueId,
                                walletAddress: accountId,
                                selectedChain: fromChain,
                                status: "active",
                                changeProcessed: false,
                                daysNotPaid: 0,
                                subscriptionType: subscriptionType,
                                verificationStartDate: nowFormatted,
                                verificationNextPayDate: nextPayDateFormatted,
                                verificationTerminationDate: ""
                            }
                        );
                        await newVerifiedUserRecord.save();
                    }

                    if(verifiedRecordData) {
                        await usersVerifiedRecord.updateOne(
                            {username: uniqueId},
                            {
                                $set: {
                                    selectedChain: fromChain,
                                    status: "active",
                                    changeProcessed: false,
                                    daysNotPaid: 0,
                                    subscriptionType: subscriptionType,
                                    verificationStartDate: nowFormatted,
                                    verificationNextPayDate: nextPayDateFormatted,
                                    verificationTerminationDate: ""
                                }
                            }
                        );
                    }
                }
            );

            return res.status(200).json({"status": "success", "pollId": newTx["_id"]});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

module.exports = router;