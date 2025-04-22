const axios = require("axios");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");
const pact = require("pact-lang-api");
const cryptoJS = require("crypto-js");

dotenv.config();

const network_connx = mongoose.createConnection(process.env.mongo_finux_network);
const market_connx = mongoose.createConnection(process.env.mongo_prediction_market);

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

const portfoliosResolutionSchema = mongoose.Schema(
    {
        predictionId: String,
        marketId: String,
        username: String,
        walletAddress: String,
        chainId: String,
        outcome: String,
        resolutionOutcome: String,

        yesQuantity: Number,
        noQuantity: Number,

        soldYesQuantity: Number,
        soldYesCollateral: Number,
        soldNoQuantity: Number,
        soldNoCollateral: Number,

        portfolioResolveSent: Boolean,
        portfolioResolveValidated: Boolean,
        portfolioResolveNotified: Boolean,
        portfolioResolveRequestKey: String,
        portfolioResolveSentTimestamp: Number,
        portfolioResolveValidatedTimestamp: Number,
        portfolioResolveValidationAttempts: Number,

        collateralResolveSent: Boolean,
        collateralResolveValidated: Boolean,
        collateralResolveNotified: Boolean,
        collateralResolveRequestKey: String,
        collateralResolveSentTimestamp: Number,
        collateralResolveValidatedTimeStamp: Number,
        collateralResolveValidationAttempts: Number
    }
);
const portfoliosResolutionDesc = market_connx.model("y-n-portfolios-resolution", portfoliosResolutionSchema, "y-n-portfolios-resolution");

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

const resolvePortfolio = async () => {
    const isProcessRunningDesc = await predictionsProcessesDesc.find({type: "sent"});
    const isProcessRunning = isProcessRunningDesc[0]["resolvePortfolio"];

    if(!isProcessRunning) {
        await predictionsProcessesDesc.updateOne(
            {type: "sent"},
            {$set: {resolvePortfolio: true}}
        );

        const portfoliosToResolve = await portfoliosResolutionDesc.find({portfolioResolveSent: false});
        if(portfoliosToResolve.length > 0) {
            let users = [];
            for(let i = 0; i < portfoliosToResolve.length; i++) {
                if(!users.includes(portfoliosToResolve[i]["username"])) {
                    users.push(portfoliosToResolve[i]["username"]);
                }
            }

            const finulab_walletAddressesDesc = await accountsWalletDescs.find({}).where("username").in(users);

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
            const generalCapabilityData = [capabilityData, capabilityDataOne];

            for(let j = 0; j < portfoliosToResolve.length; j++) {
                const now = new Date();
                const creationTime = datefns.getUnixTime(now);
                const chainId = portfoliosToResolve[j]["chainId"];

                const to = portfoliosToResolve[j]["walletAddress"];
                const to_publicKey = to.slice(2, to.length);
                const to_secret = finulab_walletAddressesDesc.filter(doc => doc.publicKey === to_publicKey)[0];

                const passPhrase = process.env.finux_key;
                const decrypted_from_secret = cryptoJS.AES.decrypt(to_secret["secretKey"], passPhrase).toString(cryptoJS.enc.Utf8);

                const envDataToUtilize = {
                    ...envData,
                    [to]: {
                        "keys": [
                            to_publicKey
                        ],
                        "pred": "keys-all"
                    }
                }

                let txAmount = 0, capabilityDataTwo = {};
                portfoliosToResolve[j]["resolutionOutcome"] === "yes" ? 
                txAmount = Number(formatPayoutBalance.format(portfoliosToResolve[j]["yesQuantity"])) : txAmount = Number(formatPayoutBalance.format(portfoliosToResolve[j]["noQuantity"]));
                if(txAmount > 0) {
                    capabilityDataTwo = {
                        publicKey: pact.crypto.restoreKeyPairFromSecretKey(escrow).publicKey,
                        secretKey: escrow,
                        clist: [
                            {"name": "free.finux.TRANSFER", "args": ["finulab-prediction-market-escrow-account", to, txAmount]}
                        ]
                    }
                } else {
                    capabilityDataTwo = {
                        publicKey: pact.crypto.restoreKeyPairFromSecretKey(escrow).publicKey,
                        secretKey: escrow
                    }
                }

                const capabilityDataThree = {
                    publicKey: to_publicKey,
                    secretKey: decrypted_from_secret
                }
                const capabilityDataToUtilize = [...generalCapabilityData, capabilityDataTwo, capabilityDataThree];

                const pactCmd = pact.simple.exec.createCommand(capabilityDataToUtilize, undefined,
                    `(free.finux.y-n-resolve-portfolio "${to}" "${portfoliosToResolve[j]["marketId"]}")`,
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
                } catch(error) {
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
                    } catch(error) {
                        utilizeRequestKey = "";
                    }
                }

                if(utilizeRequestKey !== "") {
                    await portfoliosResolutionDesc.updateOne(
                        {_id: portfoliosToResolve[j]["_id"]},
                        {$set: {portfolioResolveSent: true, portfolioResolveRequestKey: utilizeRequestKey, portfolioResolveSentTimestamp: creationTime}}
                    );
                }
            }
        }

        await predictionsProcessesDesc.updateOne(
            {type: "sent"},
            {$set: {resolvePortfolio: false}}
        );
    }
}

resolvePortfolio().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);