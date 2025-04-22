const axios = require("axios");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");

dotenv.config();

const market_connx = mongoose.createConnection(process.env.mongo_prediction_market);

const activitySchema = mongoose.Schema(
    {
        predictionId: String,
        predictiveImage: String,
        predictiveQuestion: String,
        marketId: String,
        continous: Boolean,
        username: String,
        walletAddress: String,
        outcome: String,
        outcomeImage: String,
        chainId: String,
        selection: String,
        action: String,
        quantity: Number,
        averagePrice: Number,
        fee: Number,
        collateral: Number,
        costFunctionDesc: Object,
        prevCostFunctionDesc: Object,
        orderStatus: String,
        resolutionOutcome: String,
        requestKey: String,
        openedTimestamp: Number,
        sentTimestamp: Number,
        validatedTimestamp: Number
    }
);
const activityDesc = market_connx.model("y-n-activity", activitySchema, "y-n-activity");

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

const validateCreditDebit = async () => {
    const isProcessRunningDesc = await predictionsProcessesDesc.find({type: "validated"});
    const isProcessRunning = isProcessRunningDesc[0]["credit"];

    if(!isProcessRunning) {
        await predictionsProcessesDesc.updateOne(
            {type: "validated"},
            {$set: {credit: true}}
        );

        const finulab_newTxs = await predictionTxsDesc.find({sent: true, validated: false});
        if(finulab_newTxs.length > 0) {
            for(let i = 0; i < finulab_newTxs.length; i++) {
                if(finulab_newTxs[i]["validationAttempts"] >= 10) {
                    await predictionTxsDesc.updateOne(
                        {_id: finulab_newTxs[i]["_id"]}, 
                        {$set: {sent: false}}
                    );
                } else {
                    const chainId = String(finulab_newTxs[i]["chainId"]), chainwebSendURLpt1 = "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/", chainwebSendURLpt2 = "/pact/api/v1/poll";

                    try {
                        const pollReqKey = await axios.post(`${chainwebSendURLpt1}${chainId}${chainwebSendURLpt2}`, 
                            {
                                "requestKeys": [
                                    finulab_newTxs[i]["requestKey"]
                                ]
                            }
                        );

                        if(pollReqKey.status === 200) {
                            if(pollReqKey.data !== undefined && pollReqKey.data !== null) {
                                const resKeys = Object.keys(pollReqKey.data);
                                if(resKeys.includes(finulab_newTxs[i]["requestKey"])) {
                                    const result = pollReqKey.data[`${finulab_newTxs[i]["requestKey"]}`]["result"]["status"];

                                    if(result === "success") {
                                        const now = new Date();
                                        const nowUnix = datefns.getUnixTime(now);

                                        await predictionTxsDesc.updateOne(
                                            {_id: finulab_newTxs[i]["_id"]}, 
                                            {$set: {pendedBalance: 0, validated: true, validatedTimestamp: nowUnix}}
                                        );
                                        
                                        await activityDesc.updateOne(
                                            {_id: finulab_newTxs[i]["activityId"]}, 
                                            {$set: {orderStatus: "validated", requestKey: finulab_newTxs[i]["requestKey"], sentTimestamp: finulab_newTxs[i]["sentTimestamp"], validatedTimestamp: nowUnix}}
                                        );
                                    } else if(result === "failure") {
                                        await predictionTxsDesc.updateOne(
                                            {_id: finulab_newTxs[i]["_id"]}, 
                                            {$set: {sent: false}}
                                        );
                                    }
                                }
                            }
                        } else {
                            await predictionTxsDesc.updateOne(
                                {_id: finulab_newTxs[i]["_id"]}, 
                                {$inc: {validationAttempts: 1}}
                            );
                        }
                    } catch(err) {
                        await predictionTxsDesc.updateOne(
                            {_id: finulab_newTxs[i]["_id"]}, 
                            {$inc: {validationAttempts: 1}}
                        );
                    }
                }
            }
        }

        await predictionsProcessesDesc.updateOne(
            {type: "validated"},
            {$set: {credit: false}}
        );
    }
}

validateCreditDebit().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);