const axios = require("axios");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");
const pact = require("pact-lang-api");

dotenv.config();

const market_connx = mongoose.createConnection(process.env.mongo_prediction_market);

const predictionsResolutionSchema = mongoose.Schema(
    {
        predictionId: String,
        marketId: String,
        creator: String,
        chainId: String,
        outcome: String,
        resolutionOutcome: String,

        readyForClose: Boolean,
        closeNotified: Boolean,
        closed: Boolean, 
        closeSent: Boolean,
        closeValidated: Boolean,
        closeRequestKey: String,
        closeSentTimestamp: Number,
        closeValidatedTimestamp: Number,
        closeValidationAttempts: Number,

        readyForResolution: Boolean,
        resolveNotified: Boolean,
        resolved: Boolean,
        resolveSent: Boolean,
        resolveValidated: Boolean,
        resolveRequestKey: String,
        resolveSentTimestamp: Number,
        resolveValidatedTimestamp: Number,
        resolveValidationAttempts: Number,

        portfolioSubmitted: Boolean
    }
);
const predictionsResolutionDesc = market_connx.model("y-n-predictions-resolution", predictionsResolutionSchema, "y-n-predictions-resolution");

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

const resolveMarket = async () => {
    const isProcessRunningDesc = await predictionsProcessesDesc.find({type: "sent"});
    const isProcessRunning = isProcessRunningDesc[0]["resolveMarket"];

    if(!isProcessRunning) {
        await predictionsProcessesDesc.updateOne(
            {type: "sent"},
            {$set: {resolveMarket: true}}
        );

        const marketsToResolve = await predictionsResolutionDesc.find({readyForResolution: true, resolveSent: false});
        if(marketsToResolve.length > 0) {
            const ttl = 28800;
            const gasLimit = 2320;
            const gasPrice = 0.0000010000;
            const operationsAdmin = process.env.operations_admin;
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
                }
            }

            const capabilityDataOne = {
                publicKey: pact.crypto.restoreKeyPairFromSecretKey(gasStation).publicKey,
                secretKey: gasStation,
                clist: [
                    {"name": "coin.GAS", "args": []},
                ]
            }
            const capabilityDataTwo = {
                publicKey: pact.crypto.restoreKeyPairFromSecretKey(operationsAdmin).publicKey,
                secretKey: operationsAdmin
            }
            const capabilityData = [capabilityDataOne, capabilityDataTwo];

            for(let i = 0; i < marketsToResolve.length; i++) {
                const now = new Date();
                const creationTime = datefns.getUnixTime(now);
                const chainId = marketsToResolve[i]["chainId"];

                const pactCmd = pact.simple.exec.createCommand(capabilityData, undefined,
                    `(free.finux.y-n-resolve-market "${marketsToResolve[i]["marketId"]}" "${marketsToResolve[i]["resolutionOutcome"]}")`, 
                    envData, pact.lang.mkMeta(gasAccount, chainId, gasPrice, gasLimit, creationTime, ttl), networkId
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
                    await predictionsResolutionDesc.updateOne(
                        {_id: marketsToResolve[i]["_id"]},
                        {$set: {resolveSent: true, resolveRequestKey: utilizeRequestKey, resolveSentTimestamp: creationTime}}
                    );
                }
            }
        }

        await predictionsProcessesDesc.updateOne(
            {type: "sent"},
            {$set: {resolveMarket: false}}
        );
    }
}

resolveMarket().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);