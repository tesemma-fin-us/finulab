const axios = require("axios");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");
const pact = require("pact-lang-api");
const cryptoJS = require("crypto-js");
const {ObjectId} = require("mongodb");

dotenv.config();

const network_connx = mongoose.createConnection(process.env.mongo_finux_network);
const market_connx = mongoose.createConnection(process.env.mongo_prediction_market);

const marketSchema = mongoose.Schema(
    {
        predictionId: String,
        predictiveImage: String,
        predictiveQuestion: String,
        creator: String,
        creatorAccountType: String,
        creatorWalletAddress: String,
        outcome: String, 
        outcomeImage: String,
        continous: Boolean,
        chains: Array,
        participantsTotal: Number,
        participantsYes: Number,
        participantsNo: Number,
        quantityYes: Number,
        quantityNo: Number,
        priceYes: Number,
        priceNo: Number,
        probabilityYes: Number,
        probabilityNo: Number,
        costFunction: Number,
        costFunctionDesc: Object,
        rules: String,
        status: String,
        resolved: Boolean,
        resolutionOutcome: String,
        createdTimestamp: Number,
        requestKey: String,
        endDate: Number,
        resolutionTimeStamp: Number
    }
);
const marketDesc = market_connx.model("y-n-market", marketSchema, "y-n-market");

const predictionsTxsSchema = mongoose.Schema(
    {
        predictionId: String,
        marketId: String,
        activityId: String,
        username: String,
        walletAddress: String,
        continous: Boolean,
        chainId: String,
        type: String,
        function: String,
        txDesc: Object,
        pendedBalance: Number,
        sent: Boolean,
        validated: Boolean,
        notified: Boolean,
        requestKey: String,
        sentTimestamp: Number,
        validatedTimestamp: Number,
        validationAttempts: Number
    }
);
const predictionTxsDesc = market_connx.model("y-n-predictions-txs", predictionsTxsSchema, "y-n-predictions-txs");

const accountsWalletSchema = mongoose.Schema(
    {
        username: String,
        accountName: String,
        accountDesignation: String,
        publicKey: String,
        secretKey: String,
        aggregateBalance: Number,
        pendingBalanceMorning: Number,
        pendingBalanceEvening: Number,
        chain_by_chain: Object
    }
);
const accountsWalletDescs = network_connx.model("accounts-wallet-descs", accountsWalletSchema, "accounts-wallet-descs");

const predictionsProcessesSchema = mongoose.Schema(
    {
        type: String,
        create: Boolean,
        credit: Boolean,
        debit: Boolean,
        modifyStatuses: Boolean,
        close: Boolean,
        resolveMarketAlign: Boolean,
        resolveMarket: Boolean,
        resolvePortfolioAlign: Boolean,
        resolvePortfolio: Boolean
    }
);
const predictionsProcessesDesc = market_connx.model("y-n-processes", predictionsProcessesSchema, "y-n-processes");

const formatPayoutBalance = new Intl.NumberFormat(
    'en-US',
    {
        useGrouping: false,
        minimumFractionDigits: 2,
        maximumFractionDigits: 12
    }
);
const pactDecimalFormatter = (value) => {
    const amount = `${Number(formatPayoutBalance.format(value))}`;

    const regex = /\./g;
    const amountStringPreInterlude = amount;
    const amountStringInterlude = (amountStringPreInterlude.match(regex) || []).length;
    const amountString = amountStringInterlude === 1 ? amount : parseFloat(amount).toFixed(1);

    return amountString;
}

const portfolioCredit = async () => {
    const isProcessRunningDesc = await predictionsProcessesDesc.find({type: "sent"});
    const isProcessRunning = isProcessRunningDesc[0]["credit"];

    if(!isProcessRunning) {
        await predictionsProcessesDesc.updateOne(
            {type: "sent"},
            {$set: {credit: true}}
        );

        const finulab_newTxs = await predictionTxsDesc.find({function: "credit", sent: false});
        if(finulab_newTxs.length > 0) {
            let marketIds = [], walletAddresses = [];
            for(let i = 0; i < finulab_newTxs.length; i++) {
                const marketId = new ObjectId(String(finulab_newTxs[i]["marketId"]));
                marketIds.push(marketId);

                const address = String(finulab_newTxs[i]["walletAddress"]);
                walletAddresses.push(address.slice(2, address.length));
            }
            const finulab_marketData = await marketDesc.find({}).where("_id").in(marketIds);
            const finulab_walletAddressesDesc = await accountsWalletDescs.find({}).where("publicKey").in(walletAddresses);

            const ttl = 28800;
            const gasLimit = 2320;
            const gasPrice = 0.0000010000;
            const operationsAdmin = process.env.operations_admin;
            const escrow = process.env.prediction_market_escrow_account;
            const gasStation = process.env.gas_station, gasAccount = `k:${pact.crypto.restoreKeyPairFromSecretKey(gasStation).publicKey}`;
            const networkId = "mainnet01", chainwebSendURLpt1 = "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/", chainwebSendURLpt2 = "/pact/api/v1/send";

            const envData = {
                "ks": {
                    "keys": [
                        pact.crypto.restoreKeyPairFromSecretKey(gasStation).publicKey
                    ],
                    "pred": "keys-all"
                },
                "finux-operations-admin": {
                    "keys": [
                        pact.crypto.restoreKeyPairFromSecretKey(operationsAdmin).publicKey
                    ],
                    "pred": "keys-all"
                },
                "finulab-prediction-market-escrow-account": {
                    "keys": [
                        pact.crypto.restoreKeyPairFromSecretKey(escrow).publicKey
                    ],
                    "pred": "keys-all"
                }
            }

            const capabilityData = {
                publicKey: pact.crypto.restoreKeyPairFromSecretKey(gasStation).publicKey,
                secretKey: gasStation,
                clist: [
                    {"name": "coin.GAS", "args": []},
                ]
            }
            const capabilityDataOne = {
                publicKey: pact.crypto.restoreKeyPairFromSecretKey(operationsAdmin).publicKey,
                secretKey: operationsAdmin
            }
            const capabilityDataTwo = {
                publicKey: pact.crypto.restoreKeyPairFromSecretKey(escrow).publicKey,
                secretKey: escrow
            }
            const generalCapabilityData = [capabilityData, capabilityDataOne, capabilityDataTwo];

            for(let j = 0; j < finulab_newTxs.length; j++) {
                const now = new Date();
                const creationTime = datefns.getUnixTime(now);
                const chainId = String(finulab_newTxs[j]["chainId"]);

                const from = String(finulab_newTxs[j]["walletAddress"]);
                const walletToFind = from.slice(2, from.length);
                const from_secret = finulab_walletAddressesDesc.filter(doc => doc.publicKey === walletToFind)[0];
                
                const passPhrase = process.env.finux_key;
                const decrypted_from_secret = cryptoJS.AES.decrypt(from_secret["secretKey"], passPhrase).toString(cryptoJS.enc.Utf8);

                const envDataToUtilize = {
                    ...envData,
                    [from]: {
                        "keys": [
                            walletToFind
                        ],
                        "pred": "keys-all"
                    }
                }

                const marketIdToFind = new ObjectId(String(finulab_newTxs[j]["marketId"]));
                const supportiveDesc = finulab_marketData.filter(doc => doc._id.equals(marketIdToFind))[0];

                const type = String(finulab_newTxs[j]["type"]);
                const txQuantity = Number(formatPayoutBalance.format(finulab_newTxs[j]["txDesc"]["quantity"]));
                
                const txCost = Number(formatPayoutBalance.format(finulab_newTxs[j]["txDesc"]["cost"]));
                const txFee = Number(formatPayoutBalance.format(finulab_newTxs[j]["txDesc"]["fee"]));
                const txCreatorFee = Number(formatPayoutBalance.format(finulab_newTxs[j]["txDesc"]["creatorFee"]));

                const capabilityDataThree = {
                    publicKey: walletToFind,
                    secretKey: decrypted_from_secret,
                    clist: [
                        {"name": "free.finux.TRANSFER", "args": [from, "finulab-prediction-market-escrow-account", txCost]},
                        {"name": "free.finux.TRANSFER", "args": [from, "finulab-prediction-market-fees", txFee]},
                        {"name": "free.finux.TRANSFER", "args": [from, supportiveDesc["creatorWalletAddress"], txCreatorFee]}
                    ]
                }
                const capabilityDataToUtilize = [...generalCapabilityData, capabilityDataThree];

                const pactCmd = pact.simple.exec.createCommand(capabilityDataToUtilize, undefined,
                    `(free.finux.y-n-portfolio-credit "${from}" "${String(finulab_newTxs[j]["marketId"])}" "${type}" {"quantity": ${pactDecimalFormatter(txQuantity)}, "cost": ${pactDecimalFormatter(txCost)}} {"fee": ${pactDecimalFormatter(txFee)}, "creator-fee": ${pactDecimalFormatter(txCreatorFee)}, "creator-address": "${supportiveDesc["creatorWalletAddress"]}", "predictive-question": "${supportiveDesc["predictiveQuestion"]}", "outcome": "${supportiveDesc["outcome"]}", "continuous": ${supportiveDesc["continous"]}, "end-date": ${supportiveDesc["endDate"]}})`,
                    envDataToUtilize, pact.lang.mkMeta(gasAccount, chainId, gasPrice, gasLimit, creationTime, ttl), networkId
                );

                let utilizeRequestKey = "";
                try {
                    const chainwebResponse = await axios.post(`${chainwebSendURLpt1}${chainId}${chainwebSendURLpt2}`, pactCmd);
                    if(chainwebResponse.status === 200) {
                        if(chainwebResponse.data !== undefined && chainwebResponse.data !== null) {
                            const resKeys = Object.keys(chainwebResponse.data);
                            if(resKeys.includes("requestKeys")) {
                                utilizeRequestKey = chainwebResponse.data["requestKeys"][0];
                            }
                        }
                    }
                } catch(err) {
                    try {
                        const chainwebResponse = await axios.post(`${chainwebSendURLpt1}${chainId}${chainwebSendURLpt2}`, pactCmd);
                        if(chainwebResponse.status === 200) {
                            if(chainwebResponse.data !== undefined && chainwebResponse.data !== null) {
                                const resKeys = Object.keys(chainwebResponse.data);
                                if(resKeys.includes("requestKeys")) {
                                    utilizeRequestKey = chainwebResponse.data["requestKeys"][0];
                                }
                            }
                        }
                    } catch(err) {
                        utilizeRequestKey = "";
                    }
                }

                if(utilizeRequestKey !== "") {
                    await predictionTxsDesc.updateOne(
                        {_id: finulab_newTxs[j]["_id"]}, 
                        {$set: {sent: true, requestKey: utilizeRequestKey, sentTimestamp: creationTime}}
                    );
                }
            }
        }

        await predictionsProcessesDesc.updateOne(
            {type: "sent"},
            {$set: {credit: false}}
        );
    }
}

portfolioCredit().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);