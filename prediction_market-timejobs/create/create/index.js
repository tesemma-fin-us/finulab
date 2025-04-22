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

const predictionsApprovedSchema = mongoose.Schema(
    {
        predictionId: String,
        marketId: String,
        creator: String,
        creatorWalletAddress: String,
        chainId: String,
        sent: Boolean,
        validated: Boolean,
        requestKey: String,
        sentTimestamp: Number,
        validatedTimestamp: Number,
        validationAttempts: Number
    }
);
const approvedPredictionsDesc = market_connx.model("y-n-predictions-approved", predictionsApprovedSchema, "y-n-predictions-approved");

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

const createMarket = async () => {
    const isProcessRunningDesc = await predictionsProcessesDesc.find({type: "sent"});
    const isProcessRunning = isProcessRunningDesc[0]["create"];

    if(!isProcessRunning) {
        await predictionsProcessesDesc.updateOne(
            {type: "sent"},
            {$set: {create: true}}
        );

        const finulab_newMarkets = await approvedPredictionsDesc.find({sent: false});
        if(finulab_newMarkets.length > 0) {
            let marketIds = [], walletAddresses = [];
            for(let i = 0; i < finulab_newMarkets.length; i++) {
                const address = String(finulab_newMarkets[i]["creatorWalletAddress"]);
    
                marketIds.push(finulab_newMarkets[i]["marketId"]);
                walletAddresses.push(address.slice(2, address.length));
            }
    
            const finulab_newMarketsDesc = await marketDesc.find({status: "in-review"}).where("_id").in(marketIds);
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
    
            for(let j = 0; j < finulab_newMarkets.length; j++) {
                const now = new Date();
                const creationTime = datefns.getUnixTime(now);
    
                const idToFind = new ObjectId(`${finulab_newMarkets[j]["marketId"]}`);
                const txDescSupport = finulab_newMarketsDesc.filter(doc => doc._id.equals(idToFind))[0];
                
                const chainId = String(txDescSupport["chains"][0]);
                const from = String(finulab_newMarkets[j]["creatorWalletAddress"]);
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
                
                const txamount = Number(formatPayoutBalance.format(txDescSupport["costFunction"]));
                const capabilityDataThree = {
                    publicKey: walletToFind,
                    secretKey: decrypted_from_secret, 
                    clist: [
                        {"name": "free.finux.TRANSFER", "args": [from, "finulab-prediction-market-escrow-account", txamount]}
                    ]
                }
                const capabilityDataToUtilize = [...generalCapabilityData, capabilityDataThree];
                
                const pactCmd = pact.simple.exec.createCommand(capabilityDataToUtilize, undefined,
                    `(free.finux.y-n-create-market "${from}" "${finulab_newMarkets[j]["marketId"]}" "${txDescSupport["predictiveQuestion"]}" "${txDescSupport["outcome"]}" ${txDescSupport["continous"]} ${txDescSupport["endDate"]} {"quantity-no": ${pactDecimalFormatter(txDescSupport["quantityNo"])}, "quantity-yes": ${pactDecimalFormatter(txDescSupport["quantityYes"])}, "cost": ${pactDecimalFormatter(txDescSupport["costFunction"])}})`,
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
                        utilizeRequestKey = ""
                    }
                }
    
                if(utilizeRequestKey !== "") {
                    await approvedPredictionsDesc.updateOne(
                        {predictionId: finulab_newMarkets[j]["predictionId"], marketId: finulab_newMarkets[j]["marketId"]},
                        {$set: {sent: true, requestKey: utilizeRequestKey, sentTimestamp: creationTime}}
                    );
                }
            }
        }

        await predictionsProcessesDesc.updateOne(
            {type: "sent"},
            {$set: {create: false}}
        );
    }
}

createMarket().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);