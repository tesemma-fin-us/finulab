const axios = require("axios");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");

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

const resolveMarketValidate = async () => {
    const isProcessRunningDesc = await predictionsProcessesDesc.find({type: "validated"});
    const isProcessRunning = isProcessRunningDesc[0]["resolveMarket"];

    if(!isProcessRunning) {
        await predictionsProcessesDesc.updateOne(
            {type: "validated"},
            {$set: {resolveMarket: true}}
        );

        const marketsToValidate = await predictionsResolutionDesc.find({resolveSent: true, resolveValidated: false});
        if(marketsToValidate.length > 0) {
            for(let i = 0; i < marketsToValidate.length; i++) {
                if(marketsToValidate[i]["resolveValidationAttempts"] >= 10) {
                    await predictionsResolutionDesc.updateOne(
                        {_id: marketsToValidate[i]["_id"]},
                        {$set: {resolveSent: false}}
                    );
                } else {
                    const chainId = String(marketsToValidate[i]["chainId"]), chainwebSendURLpt1 = "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/", chainwebSendURLpt2 = "/pact/api/v1/poll";

                    try {
                        const pollReqKey = await axios.post(`${chainwebSendURLpt1}${chainId}${chainwebSendURLpt2}`, 
                            {
                                "requestKeys": [
                                    marketsToValidate[i]["resolveRequestKey"]
                                ]
                            }
                        );

                        if(pollReqKey.status === 200) {
                            if(pollReqKey.data !== undefined && pollReqKey.data !== null) {
                                const resKeys = Object.keys(pollReqKey.data);
                                if(resKeys.includes(marketsToValidate[i]["resolveRequestKey"])) {
                                    const result = pollReqKey.data[marketsToValidate[i]["resolveRequestKey"]]["result"]["status"];

                                    if(result === "success") {
                                        const now = new Date();
                                        const nowUnix = datefns.getUnixTime(now);

                                        await predictionsResolutionDesc.updateOne(
                                            {_id: marketsToValidate[i]["_id"]},
                                            {$set: {resolveValidated: true, resolveValidatedTimestamp: nowUnix}}
                                        );
                                    } else if(result === "failure") {
                                        await predictionsResolutionDesc.updateOne(
                                            {_id: marketsToValidate[i]["_id"]},
                                            {$set: {resolveSent: false}}
                                        );
                                    }
                                }
                            }
                        } else {
                            await predictionsResolutionDesc.updateOne(
                                {_id: marketsToValidate[i]["_id"]},
                                {$inc: {resolveValidationAttempts: 1}}
                            );
                        }
                    } catch(error){
                        await predictionsResolutionDesc.updateOne(
                            {_id: marketsToValidate[i]["_id"]},
                            {$inc: {resolveValidationAttempts: 1}}
                        );
                    }
                }
            }
        }

        await predictionsProcessesDesc.updateOne(
            {type: "validated"},
            {$set: {resolveMarket: false}}
        );
    }
}

resolveMarketValidate().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);