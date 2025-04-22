const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");
const {ObjectId} = require("mongodb");

dotenv.config();

const content_connx = mongoose.createConnection(process.env.mongo_content);
const market_connx = mongoose.createConnection(process.env.mongo_prediction_market);

const notificationsDescsSchema = mongoose.Schema(
    {
        by: String,
        target: String,
        byProfileImage: String,
        type: String,
        message: String,
        secondaryMessage: String,
        link: String,
        read: Boolean,
        timeStamp: Number
    }
);
const notificationsDescs = content_connx.model("notifications-descs", notificationsDescsSchema, "notifications-descs");

const predictionsSchema = mongoose.Schema(
    {
        username: String, 
        profileImage: String, 
        creatorWalletAddress: String,
        groupId: String,
        groupProfileImage: String,
        category: String,
        categoryImage: String,
        continous: Boolean,
        endDate: Number,
        predictiveImage: String,
        predictiveQuestion: String,
        language: String,
        translation: String,
        subjects: Array,
        taggedAssets: Array,
        outcomeType: String,
        outcomes: Array,
        topOutcomes: Array,
        resolutionOutcome: Array,
        officialValidationSource: String,
        participants: Number,
        volume: Number,
        liquidity: Number,
        status: String,
        finulabDecision: String,
        denialReason: String,
        likes: Number,
        validatedLikes: Number,
        dislikes: Number, 
        validatedDislikes: Number,
        validatedViews: Number,
        comments: Number,
        reposts: Number,
        trendingScore: Number,
        confidenceScore: Number, 
        earned: Number,
        finulabTake: Number,
        feesCollected: Number,
        userRewards: Number,
        communityRewards: Number,
        creationChain: String,
        costToCreate: Number,
        pendedBalance: Number,
        requestKeys: Array,
        createdTimestamp: Number,
        decisionTimestamp: Number
    }
);
const predictionsDesc = market_connx.model("y-n-predictions", predictionsSchema, "y-n-predictions");

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

const resolveMarketNotify = async () => {
    const isProcessRunningDesc = await predictionsProcessesDesc.find({type: "notify"});
    const isProcessRunning = isProcessRunningDesc[0]["resolveMarket"];

    if(!isProcessRunning) {
        await predictionsProcessesDesc.updateOne(
            {type: "notify"},
            {$set: {resolveMarket: true}}
        );

        const marketsToNotify = await predictionsResolutionDesc.find({resolveNotified: false, resolveSent: true, resolveValidated: true});
        if(marketsToNotify.length > 0) {
            let predictionIds = [], 
                stringified_predictionIds = [], marketIds = [], resolutionOutcomes = [];
            for(let i = 0; i < marketsToNotify.length; i++) {
                const idToPush = new ObjectId(String(marketsToNotify[i]["predictionId"]));
                if(!predictionIds.some(id => id.equals(idToPush))) {
                    predictionIds.push(idToPush);
                    stringified_predictionIds.push(marketsToNotify[i]["predictionId"]);
                }

                const marketIdToPush = new ObjectId(String(marketsToNotify[i]["marketId"]));
                if(!marketIds.some(id => id.equals(marketIdToPush))) {
                    marketIds.push(marketIdToPush);

                    resolutionOutcomes.push(
                        {
                            "predictionId": marketsToNotify[i]["predictionId"],
                            "marketId": marketsToNotify[i]["marketId"],
                            "resolutionTimeStamp": marketsToNotify[i]["resolveValidatedTimestamp"],
                            "resolutionOutcomeDesc": {
                                "outcome": marketsToNotify[i]["outcome"], 
                                "resolutionOutcome": marketsToNotify[i]["resolutionOutcome"],
                                "closeRequestKey": {[marketsToNotify[i]["chainId"]]: marketsToNotify[i]["closeRequestKey"]},
                                "resolutionRequestKey": {[marketsToNotify[i]["chainId"]]: marketsToNotify[i]["resolveRequestKey"]}
                            }
                        }
                    );
                } else {
                    const resolutionOutcomeIndex = resolutionOutcomes.findIndex(doc => doc.marketId === marketsToNotify[i]["marketId"]);
                    let resolutionOutcomeDuplicate = {
                        "predictionId": resolutionOutcomes[resolutionOutcomeIndex]["predictionId"],
                        "marketId": resolutionOutcomes[resolutionOutcomeIndex]["marketId"],
                        "resolutionTimeStamp": resolutionOutcomes[resolutionOutcomeIndex]["resolutionTimeStamp"],
                        "resolutionOutcomeDesc": {
                            "outcome": resolutionOutcomes[resolutionOutcomeIndex]["resolutionOutcomeDesc"]["outcome"], 
                            "resolutionOutcome": resolutionOutcomes[resolutionOutcomeIndex]["resolutionOutcomeDesc"]["resolutionOutcome"],
                            "closeRequestKey": {...resolutionOutcomes[resolutionOutcomeIndex]["resolutionOutcomeDesc"]["closeRequestKey"], [marketsToNotify[i]["chainId"]]: marketsToNotify[i]["closeRequestKey"]},
                            "resolutionRequestKey": {...resolutionOutcomes[resolutionOutcomeIndex]["resolutionOutcomeDesc"]["resolutionRequestKey"], [marketsToNotify[i]["chainId"]]: marketsToNotify[i]["resolveRequestKey"]}
                        }
                    };

                    resolutionOutcomes.push(resolutionOutcomeDuplicate);
                    resolutionOutcomes.splice(resolutionOutcomeIndex, 1);
                }
            }

            const supportingMarketData = await marketDesc.find({}).where("_id").in(marketIds);
            const marketsToNotify_predictions = await predictionsDesc.find({}).where("_id").in(predictionIds);
            const supportingMarketData_byPredictionIds = await marketDesc.find({}).where("predictionId").in(stringified_predictionIds);
            for(let j = 0; j < predictionIds.length; j++) {
                const now = new Date();
                const nowUnix = datefns.getUnixTime(now);

                const idToFind = predictionIds[j];
                const predictionId_stringified = String(predictionIds[j]);
                const id_predictionDesc = marketsToNotify_predictions.filter(doc => doc._id.equals(idToFind))[0];

                let countOfClosedMarkets = 0;
                const predictionId_markets = supportingMarketData_byPredictionIds.filter(doc => doc.predictionId === predictionId_stringified);
                for(let k_i = 0; k_i < predictionId_markets.length; k_i++) {
                    countOfClosedMarkets = countOfClosedMarkets + predictionId_markets[k_i]["chains"].length;
                }

                if(id_predictionDesc["outcomeType"] === "categorical") {
                    const id_predictionMarketsCount = id_predictionDesc["outcomes"].length;
                    const id_marketsToNotifyCount = marketsToNotify.filter(doc => doc["predictionId"] === predictionId_stringified).length;
                    
                    if(countOfClosedMarkets === id_marketsToNotifyCount) {
                        const marketsToLoop_through = resolutionOutcomes.filter(doc => doc.predictionId === predictionId_stringified);
                        if(marketsToLoop_through.length > 0) {
                            let prediction_resolution = [], resolution_TopOutcomes = [];
                            for(let k = 0; k < marketsToLoop_through.length; k++) {
                                await marketDesc.updateOne(
                                    {_id: marketsToLoop_through[k]["marketId"]}, 
                                    {$set: 
                                        {
                                            priceYes: marketsToLoop_through[k]["resolutionOutcomeDesc"]["resolutionOutcome"] === "yes" ? 1 : 0,
                                            priceNo: marketsToLoop_through[k]["resolutionOutcomeDesc"]["resolutionOutcome"] === "no" ? 1 : 0,
                                            probabilityYes: marketsToLoop_through[k]["resolutionOutcomeDesc"]["resolutionOutcome"] === "yes" ? 1 : 0,
                                            probabilityNo: marketsToLoop_through[k]["resolutionOutcomeDesc"]["resolutionOutcome"] === "no" ? 1 : 0,
                                            status: "resolved", 
                                            resolved: true, 
                                            resolutionOutcome: marketsToLoop_through[k]["resolutionOutcomeDesc"]["resolutionOutcome"], 
                                            resolutionTimeStamp: marketsToLoop_through[k]["resolutionTimeStamp"]
                                        }
                                    }
                                );
                                
                                const supportingMarketIdToFind = new ObjectId(`${marketsToLoop_through[k]["marketId"]}`);
                                const supportingMarketData_filtered = supportingMarketData.filter(doc => doc._id.equals(supportingMarketIdToFind))[0];
                                resolution_TopOutcomes.push(
                                    [
                                        marketsToLoop_through[k]["resolutionOutcomeDesc"]["outcome"], 
                                        supportingMarketData_filtered["outcomeImage"],
                                        marketsToLoop_through[k]["resolutionOutcomeDesc"]["resolutionOutcome"] === "yes" ? 1 : 0,
                                        marketsToLoop_through[k]["resolutionOutcomeDesc"]["resolutionOutcome"] === "yes" ? 1 : 0
                                    ]
                                );
                                prediction_resolution.push(
                                    marketsToLoop_through[k]["resolutionOutcomeDesc"]
                                );
                            }

                            resolution_TopOutcomes.sort((x, y) => y[3] - x[3]);
                            let resolution_TopOutcomesSliced = resolution_TopOutcomes.slice(0, 2);
                            await predictionsDesc.updateOne(
                                {_id: predictionId_stringified},
                                {$set: {topOutcomes: resolution_TopOutcomesSliced, resolutionOutcome: prediction_resolution, status: "resolved"}}
                            );

                            const marketNotification = new notificationsDescs(
                                {
                                    by: "finulab",
                                    target: `${id_predictionDesc["username"]}`,
                                    byProfileImage: "",
                                    type: "payment",
                                    message: `Your prediction is now resolved, every account will soon be paid out.`,
                                    secondaryMessage: `${id_predictionDesc["predictiveQuestion"]}`,
                                    link: `/market/prediction/${predictionId_stringified}`,
                                    read: false,
                                    timeStamp: nowUnix
                                }
                            );
                            await marketNotification.save();

                            await predictionsResolutionDesc.updateMany(
                                {predictionId: predictionId_stringified}, 
                                {$set: {resolveNotified: true, resolved: true}}
                            );
                        }
                    }
                } else if(id_predictionDesc["outcomeType"] === "yes-or-no") {
                    const id_marketsToNotifyCount = marketsToNotify.filter(doc => doc["predictionId"] === predictionId_stringified).length;
                    
                    if(countOfClosedMarkets === id_marketsToNotifyCount) {
                        const marketsToLoop_through = resolutionOutcomes.filter(doc => doc.predictionId === predictionId_stringified);
                        if(marketsToLoop_through.length > 0) {
                            let prediction_resolution = [];
                            for(let k = 0; k < marketsToLoop_through.length; k++) {
                                await marketDesc.updateOne(
                                    {_id: marketsToLoop_through[k]["marketId"]}, 
                                    {$set: 
                                        {
                                            priceYes: marketsToLoop_through[k]["resolutionOutcomeDesc"]["resolutionOutcome"] === "yes" ? 1 : 0,
                                            priceNo: marketsToLoop_through[k]["resolutionOutcomeDesc"]["resolutionOutcome"] === "no" ? 1 : 0,
                                            probabilityYes: marketsToLoop_through[k]["resolutionOutcomeDesc"]["resolutionOutcome"] === "yes" ? 1 : 0,
                                            probabilityNo: marketsToLoop_through[k]["resolutionOutcomeDesc"]["resolutionOutcome"] === "no" ? 1 : 0,
                                            status: "resolved", 
                                            resolved: true, 
                                            resolutionOutcome: marketsToLoop_through[k]["resolutionOutcomeDesc"]["resolutionOutcome"], 
                                            resolutionTimeStamp: marketsToLoop_through[k]["resolutionTimeStamp"]
                                        }
                                    }
                                );

                                prediction_resolution.push(
                                    marketsToLoop_through[k]["resolutionOutcomeDesc"]
                                );
                            }
                            
                            let resolution_TopOutcomes = [
                                [
                                    "yes", 
                                    marketsToLoop_through[0]["resolutionOutcomeDesc"]["resolutionOutcome"] === "yes" ? 1 : 0,
                                    marketsToLoop_through[0]["resolutionOutcomeDesc"]["resolutionOutcome"] === "yes" ? 1 : 0,
                                ], 
                                [
                                    "no",
                                    marketsToLoop_through[0]["resolutionOutcomeDesc"]["resolutionOutcome"] === "no" ? 1 : 0,
                                    marketsToLoop_through[0]["resolutionOutcomeDesc"]["resolutionOutcome"] === "no" ? 1 : 0,
                                ]
                            ];
                            resolution_TopOutcomes.sort((x, y) => y[2] - x[2]);
                            await predictionsDesc.updateOne(
                                {_id: predictionId_stringified},
                                {$set: {topOutcomes: resolution_TopOutcomes, resolutionOutcome: prediction_resolution, status: "resolved"}}
                            );

                            const marketNotification = new notificationsDescs(
                                {
                                    by: "finulab",
                                    target: `${id_predictionDesc["username"]}`,
                                    byProfileImage: "",
                                    type: "payment",
                                    message: `Your prediction is now resolved, every account will soon be paid out.`,
                                    secondaryMessage: `${id_predictionDesc["predictiveQuestion"]}`,
                                    link: `/market/prediction/${predictionId_stringified}`,
                                    read: false,
                                    timeStamp: nowUnix
                                }
                            );
                            await marketNotification.save();

                            await predictionsResolutionDesc.updateMany(
                                {predictionId: predictionId_stringified}, 
                                {$set: {resolveNotified: true, resolved: true}}
                            );
                        }
                    }
                }
            }
        }

        await predictionsProcessesDesc.updateOne(
            {type: "notify"},
            {$set: {resolveMarket: false}}
        );
    }
}

resolveMarketNotify().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);