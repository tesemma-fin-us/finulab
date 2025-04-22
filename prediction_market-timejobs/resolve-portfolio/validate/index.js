const axios = require("axios");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");

dotenv.config();

const market_connx = mongoose.createConnection(process.env.mongo_prediction_market);

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

const resolvePortfolioValidate = async () => {
    const isProcessRunningDesc = await predictionsProcessesDesc.find({type: "validated"});
    const isProcessRunning = isProcessRunningDesc[0]["resolvePortfolio"];

    if(!isProcessRunning) {
        await predictionsProcessesDesc.updateOne(
            {type: "validated"},
            {$set: {resolvePortfolio: true}}
        );

        const resolvedPortfoliosToValidate = await portfoliosResolutionDesc.find({portfolioResolveSent: true, portfolioResolveValidated: false});
        if(resolvedPortfoliosToValidate.length > 0) {
            for(let i = 0; i < resolvedPortfoliosToValidate.length; i++) {
                if(resolvedPortfoliosToValidate[i]["portfolioResolveValidationAttempts"] >= 10) {
                    await portfoliosResolutionDesc.updateOne(
                        {_id: resolvedPortfoliosToValidate[i]["_id"]}, 
                        {$set: {portfolioResolveSent: false}}
                    );
                } else {
                    const chainId = String(resolvedPortfoliosToValidate[i]["chainId"]), chainwebSendURLpt1 = "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/", chainwebSendURLpt2 = "/pact/api/v1/poll";

                    try {
                        const pollReqKey = await axios.post(`${chainwebSendURLpt1}${chainId}${chainwebSendURLpt2}`, 
                            {
                                "requestKeys": [
                                    resolvedPortfoliosToValidate[i]["portfolioResolveRequestKey"]
                                ]
                            }
                        );

                        if(pollReqKey.status === 200) {
                            if(pollReqKey.data !== undefined && pollReqKey.data !== null) {
                                const resKeys = Object.keys(pollReqKey.data);
                                if(resKeys.includes(resolvedPortfoliosToValidate[i]["portfolioResolveRequestKey"])) {
                                    const result = pollReqKey.data[resolvedPortfoliosToValidate[i]["portfolioResolveRequestKey"]]["result"]["status"];

                                    if(result === "success") {
                                        const now = new Date();
                                        const nowUnix = datefns.getUnixTime(now);

                                        await portfoliosResolutionDesc.updateOne(
                                            {_id: resolvedPortfoliosToValidate[i]["_id"]}, 
                                            {$set: {portfolioResolveValidated: true, portfolioResolveValidatedTimestamp: nowUnix}}
                                        );
                                    } else if(result === "failure") {
                                        await portfoliosResolutionDesc.updateOne(
                                            {_id: resolvedPortfoliosToValidate[i]["_id"]}, 
                                            {$set: {portfolioResolveSent: false}}
                                        );
                                    }
                                }
                            }
                        } else {
                            await portfoliosResolutionDesc.updateOne(
                                {_id: resolvedPortfoliosToValidate[i]["_id"]}, 
                                {$inc: {portfolioResolveValidationAttempts: 1}}
                            );
                        }
                    } catch(error) {
                        await portfoliosResolutionDesc.updateOne(
                            {_id: resolvedPortfoliosToValidate[i]["_id"]}, 
                            {$inc: {portfolioResolveValidationAttempts: 1}}
                        );
                    }
                }
            }
        }

        await predictionsProcessesDesc.updateOne(
            {type: "validated"},
            {$set: {resolvePortfolio: false}}
        );
    }
}

resolvePortfolioValidate().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);