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

const closeMarketNotify = async () => {
    const isProcessRunningDesc = await predictionsProcessesDesc.find({type: "notify"});
    const isProcessRunning = isProcessRunningDesc[0]["close"];

    if(!isProcessRunning) {
        await predictionsProcessesDesc.updateOne(
            {type: "notify"},
            {$set: {close: true}}
        );

        const marketsToNotify = await predictionsResolutionDesc.find({closeNotified: false, closeSent: true, closeValidated: true});
        if(marketsToNotify.length > 0) {
            let predictionIds = [], stringified_predictionIds = [];
            for(let i = 0; i < marketsToNotify.length; i++) {
                const idToPush = new ObjectId(String(marketsToNotify[i]["predictionId"]));
                if(!predictionIds.some(id => id.equals(idToPush))) {
                    predictionIds.push(idToPush);
                }

                const string_predictionId = String(marketsToNotify[i]["predictionId"]);
                if(!stringified_predictionIds.includes(string_predictionId)) {
                    stringified_predictionIds.push(string_predictionId);
                }
            }

            const marketsToNotify_predictions = await predictionsDesc.find({}).where("_id").in(predictionIds);
            const marketsToNotify_markets = await marketDesc.find({}).where("predictionId").in(stringified_predictionIds);
            for(let j = 0; j < predictionIds.length; j++) {
                const now = new Date();
                const nowUnix = datefns.getUnixTime(now);

                const idToFind = predictionIds[j];
                const predictionId_stringified = String(predictionIds[j]);

                let countOfClosedMarkets = 0;
                const predictionId_markets = marketsToNotify_markets.filter(doc => doc.predictionId === predictionId_stringified);
                for(let k = 0; k < predictionId_markets.length; k++) {
                    countOfClosedMarkets = countOfClosedMarkets + predictionId_markets[k]["chains"].length;
                }

                const id_predictionDesc = marketsToNotify_predictions.filter(doc => doc._id.equals(idToFind))[0];
                const id_marketsToNotifyCount = marketsToNotify.filter(doc => doc["predictionId"] === predictionId_stringified).length;
                if(countOfClosedMarkets === id_marketsToNotifyCount) {
                    const marketNotification = new notificationsDescs(
                        {
                            by: "finulab",
                            target: `${id_predictionDesc["username"]}`,
                            byProfileImage: "",
                            type: "payment",
                            message: `Your prediction is now closed, awaiting resolution.`,
                            secondaryMessage: `${id_predictionDesc["predictiveQuestion"]}`,
                            link: `/market/prediction/${predictionId_stringified}`,
                            read: false,
                            timeStamp: nowUnix
                        }
                    );
                    await marketNotification.save();

                    await predictionsResolutionDesc.updateMany(
                        {predictionId: predictionId_stringified}, 
                        {$set: {closeNotified: true, closed: true}}
                    );
                }
            }
        }

        await predictionsProcessesDesc.updateOne(
            {type: "notify"},
            {$set: {close: false}}
        );
    }
}

closeMarketNotify().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);