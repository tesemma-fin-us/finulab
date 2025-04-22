const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");
const {ObjectId} = require("mongodb");

dotenv.config();

const market_connx = mongoose.createConnection(process.env.mongo_prediction_market);

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

const modifyStatuses = async () => {
    const isProcessRunningDesc = await predictionsProcessesDesc.find({type: "sent"});
    const isProcessRunning = isProcessRunningDesc[0]["modifyStatuses"];

    if(!isProcessRunning) {
        await predictionsProcessesDesc.updateOne(
            {type: "sent"},
            {$set: {modifyStatuses: true}}
        );

        const now = new Date();
        const nowUnix = datefns.getUnixTime(now);

        const predictionsToEnd = await predictionsDesc.find(
            {
                continous: false,
                status: "live",
                endDate: {$lte: nowUnix}
            }
        );
        
        if(predictionsToEnd.length > 0) {
            let predictionIds = [];
            for(let i = 0; i < predictionsToEnd.length; i++) {
                predictionIds.push(String(predictionsToEnd[i]["_id"]));
            }
            
            const marketsToEnd = await marketDesc.find({}).where("predictionId").in(predictionIds);
            for(let j = 0; j < marketsToEnd.length; j++) {
                const idToFind = new ObjectId(String(marketsToEnd[j]["predictionId"]));
                const creatorDesc = predictionsToEnd.filter(doc => doc._id.equals(idToFind))[0];

                for(let k = 0; k < marketsToEnd[j]["chains"].length; k++) {
                    const newPredictionsResolutionDesc = new predictionsResolutionDesc(
                        {
                            predictionId: marketsToEnd[j]["predictionId"],
                            marketId: String(marketsToEnd[j]["_id"]),
                            creator: creatorDesc["username"],
                            chainId: marketsToEnd[j]["chains"][k],
                            outcome: marketsToEnd[j]["outcome"],
                            resolutionOutcome: "",
                    
                            readyForClose: true,
                            closeNotified: false,
                            closed: false, 
                            closeSent: false,
                            closeValidated: false,
                            closeRequestKey: "",
                            closeSentTimestamp: 0,
                            closeValidatedTimestamp: 0,
                            closeValidationAttempts: 0,
                    
                            readyForResolution: false,
                            resolveNotified: false,
                            resolved: false,
                            resolveSent: false,
                            resolveValidated: false,
                            resolveRequestKey: "",
                            resolveSentTimestamp: 0,
                            resolveValidatedTimestamp: 0,
                            resolveValidationAttempts: 0,
                    
                            portfolioSubmitted: false
                        }
                    );
                    await newPredictionsResolutionDesc.save();
                }

                await marketDesc.updateOne(
                    {_id: marketsToEnd[j]["_id"]}, 
                    {$set: {status: "ended"}}
                );
            }

            await predictionsDesc.updateMany(
                {continous: false, status: "live", endDate: {$lte: nowUnix}}, 
                {$set: {status: "ended"}}
            );
        }

        await predictionsProcessesDesc.updateOne(
            {type: "sent"},
            {$set: {modifyStatuses: false}}
        );
    }
}

modifyStatuses().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);