const axios = require("axios");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");

dotenv.config();

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

const validateMarket = async () => {
    const isProcessRunningDesc = await predictionsProcessesDesc.find({type: "validated"});
    const isProcessRunning = isProcessRunningDesc[0]["create"];

    if(!isProcessRunning) {
        await predictionsProcessesDesc.updateOne(
            {type: "validated"},
            {$set: {create: true}}
        );

        const finulab_newMarkets = await approvedPredictionsDesc.find({sent: true, validated: false});
        if(finulab_newMarkets.length > 0) {
            for(let i = 0; i < finulab_newMarkets.length; i++) {
                if(finulab_newMarkets[i]["validationAttempts"] >= 10) {
                    await approvedPredictionsDesc.updateOne(
                        {predictionId: finulab_newMarkets[i]["predictionId"], marketId: finulab_newMarkets[i]["marketId"]},
                        {$set: {sent: false}}
                    );
                } else {
                    const chainId = String(finulab_newMarkets[i]["chainId"]), chainwebSendURLpt1 = "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/", chainwebSendURLpt2 = "/pact/api/v1/poll";

                    try {
                        const pollReqKey = await axios.post(`${chainwebSendURLpt1}${chainId}${chainwebSendURLpt2}`, 
                            {
                                "requestKeys": [
                                    finulab_newMarkets[i]["requestKey"]
                                ]
                            }
                        );
                        
                        if(pollReqKey.status === 200) {
                            if(pollReqKey.data !== undefined && pollReqKey.data !== null) {
                                const resKeys = Object.keys(pollReqKey.data);
                                if(resKeys.includes(finulab_newMarkets[i]["requestKey"])) {
                                    const result = pollReqKey.data[finulab_newMarkets[i]["requestKey"]]["result"]["status"];
                                    
                                    if(result === "success") {
                                        const now = new Date();
                                        const nowUnix = datefns.getUnixTime(now);
            
                                        await approvedPredictionsDesc.updateOne(
                                            {predictionId: finulab_newMarkets[i]["predictionId"], marketId: finulab_newMarkets[i]["marketId"]},
                                            {$set: {validated: true, validatedTimestamp: nowUnix}}
                                        );
            
                                        await marketDesc.updateOne(
                                            {_id: finulab_newMarkets[i]["marketId"]},
                                            {$set: {status: "live", requestKey: finulab_newMarkets[i]["requestKey"]}}
                                        )
                                    } else if(result === "failure") {
                                        await approvedPredictionsDesc.updateOne(
                                            {predictionId: finulab_newMarkets[i]["predictionId"], marketId: finulab_newMarkets[i]["marketId"]},
                                            {$set: {sent: false}}
                                        );
                                    }
            
                                }
                            }
                        } else {
                            await approvedPredictionsDesc.updateOne(
                                {predictionId: finulab_newMarkets[i]["predictionId"], marketId: finulab_newMarkets[i]["marketId"]},
                                {$inc: {validationAttempts: 1}}
                            );
                        }
                    } catch(error) {
                        await approvedPredictionsDesc.updateOne(
                            {predictionId: finulab_newMarkets[i]["predictionId"], marketId: finulab_newMarkets[i]["marketId"]},
                            {$inc: {validationAttempts: 1}}
                        );
                    }
                }
            }
        }

        await predictionsProcessesDesc.updateOne(
            {type: "validated"},
            {$set: {create: false}}
        );
    }
}

validateMarket().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);