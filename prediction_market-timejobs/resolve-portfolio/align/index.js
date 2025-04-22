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

const holdingsSchema = mongoose.Schema(
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

        yesQuantity: Number,
        yesAveragePrice: Number,
        yesQuantityDesc: Array,
        noQuantity: Number,
        noAveragePrice: Number,
        noQuantityDesc: Array,
        boughtTimestamp: Number,

        soldYesQuantity: Number,
        soldYesCollateral: Number,
        soldYesAveragePrice: Number,
        soldYesQuantityDesc: Array,
        soldYesCollateralDesc: Array,
        soldNoQuantity: Number,
        soldNoCollateral: Number,
        soldNoAveragePrice: Number,
        soldNoQuantityDesc: Array,
        soldNoCollateralDesc: Array,
        soldTimestamp: Number,
        
        resolutionOutcome: String,
        resolutionRequestKeys: Array,
        earnings: Number,
        predictionEndTimestamp: Number,
        resolvedTimestamp: Number
    }
);
const holdingsDesc = market_connx.model("y-n-holdings", holdingsSchema, "y-n-holdings");

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

const chainIds = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"];
const resolvePortfolioAlign = async () => {
    const isProcessRunningDesc = await predictionsProcessesDesc.find({type: "sent"});
    const isProcessRunning = isProcessRunningDesc[0]["resolvePortfolioAlign"];

    if(!isProcessRunning) {
        await predictionsProcessesDesc.updateOne(
            {type: "sent"},
            {$set: {resolvePortfolioAlign: true}}
        );

        const portfoliosToAlign = await predictionsResolutionDesc.find({closed: true, resolved: true, portfolioSubmitted: false});
        if(portfoliosToAlign.length > 0) {
            for(let i = 0; i < portfoliosToAlign.length; i++) {
                await activityDesc.updateMany(
                    {predictionId: portfoliosToAlign[i]["predictionId"], marketId: portfoliosToAlign[i]["marketId"]}, 
                    {$set: {resolutionOutcome: portfoliosToAlign[i]["resolutionOutcome"]}}
                );

                await holdingsDesc.updateMany(
                    {predictionId: portfoliosToAlign[i]["predictionId"], marketId: portfoliosToAlign[i]["marketId"]},
                    {$set: {resolutionOutcome: `${portfoliosToAlign[i]["resolutionOutcome"]}`}}
                );

                let portfolioResolutionDocs = [];
                const holdingsToResolve = await holdingsDesc.find({predictionId: portfoliosToAlign[i]["predictionId"], marketId: portfoliosToAlign[i]["marketId"]});
                for(let j = 0; j < holdingsToResolve.length; j++) {
                    const noQuantityDesc_arr = [...holdingsToResolve[j]["noQuantityDesc"]];
                    const yesQuantityDesc_arr = [...holdingsToResolve[j]["yesQuantityDesc"]];
                    
                    for(let k = 0; k < chainIds.length; k++) {
                        if(yesQuantityDesc_arr.some(doc => doc[0] === chainIds[k]) || noQuantityDesc_arr.some(doc => doc[0] === chainIds[k])) {
                            const io_noQuantity = noQuantityDesc_arr.some(doc => doc[0] === chainIds[k]) ? noQuantityDesc_arr.filter(doc => doc[0] === chainIds[k])[0][1] : 0;
                            const io_yesQuantity = yesQuantityDesc_arr.some(doc => doc[0] === chainIds[k]) ? yesQuantityDesc_arr.filter(doc => doc[0] === chainIds[k])[0][1] : 0;
                            
                            if(io_yesQuantity + io_noQuantity > 0) {
                                portfolioResolutionDocs.push(
                                    {
                                        predictionId: portfoliosToAlign[i]["predictionId"],
                                        marketId: portfoliosToAlign[i]["marketId"],
                                        username: holdingsToResolve[j]["username"],
                                        walletAddress: holdingsToResolve[j]["walletAddress"],
                                        chainId: chainIds[k],
                                        outcome: holdingsToResolve[j]["outcome"],
                                        resolutionOutcome: portfoliosToAlign[i]["resolutionOutcome"],
                                
                                        yesQuantity: io_yesQuantity,
                                        noQuantity: io_noQuantity,
                                
                                        soldYesQuantity: 0,
                                        soldYesCollateral: 0,
                                        soldNoQuantity: 0,
                                        soldNoCollateral: 0,
                                
                                        portfolioResolveSent: false,
                                        portfolioResolveValidated: false,
                                        portfolioResolveNotified: false,
                                        portfolioResolveRequestKey: "",
                                        portfolioResolveSentTimestamp: 0,
                                        portfolioResolveValidatedTimestamp: 0,
                                        portfolioResolveValidationAttempts: 0,
                                
                                        collateralResolveSent: false,
                                        collateralResolveValidated: false,
                                        collateralResolveNotified: false,
                                        collateralResolveRequestKey: "",
                                        collateralResolveSentTimestamp: 0,
                                        collateralResolveValidatedTimeStamp: 0,
                                        collateralResolveValidationAttempts: 0
                                    }
                                );
                            }
                        }
                    }
                }
                await portfoliosResolutionDesc.insertMany(portfolioResolutionDocs);
            }

            await predictionsResolutionDesc.updateMany(
                {closed: true, resolved: true, portfolioSubmitted: false},
                {$set: {portfolioSubmitted: true}}
            );
        }

        await predictionsProcessesDesc.updateOne(
            {type: "sent"},
            {$set: {resolvePortfolioAlign: false}}
        );
    }
}

resolvePortfolioAlign().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);