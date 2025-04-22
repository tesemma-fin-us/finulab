const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");

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

const marketNotify = async () => {
    const isProcessRunningDesc = await predictionsProcessesDesc.find({type: "notify"});
    const isProcessRunning = isProcessRunningDesc[0]["create"];

    if(!isProcessRunning) {
        await predictionsProcessesDesc.updateOne(
            {type: "notify"},
            {$set: {create: true}}
        );

        const predictionsInReview = await predictionsDesc.find({status: "in-review", finulabDecision: "pending-approval"});
        if(predictionsInReview.length > 0) {
            for(let i = 0; i < predictionsInReview.length; i++) {
                const marketsStatuses = await marketDesc.find({predictionId: predictionsInReview[i]["_id"]});
                
                let k = 0, utilizeRequestKeys = [];
                for(let j = 0; j < marketsStatuses.length; j++) {
                    if(marketsStatuses[j]["status"] === "live") {
                        k = k + 1;
                        utilizeRequestKeys.push(marketsStatuses[j]["requestKey"]);
                    }
                }
    
                if(k === marketsStatuses.length) {
                    const now = new Date();
                    const nowUnix = datefns.getUnixTime(now);
    
                    await predictionsDesc.updateOne(
                        {_id: predictionsInReview[i]["_id"]}, 
                        {$set: {status: "live", finulabDecision: "approved", requestKeys: utilizeRequestKeys, pendedBalance: 0, decisionTimestamp: nowUnix}}
                    );
    
                    const marketNotification = new notificationsDescs(
                        {
                            by: "finulab",
                            target: `${predictionsInReview[i]["username"]}`,
                            byProfileImage: "",
                            type: "payment",
                            message: `Your prediction is now live for trading!`,
                            secondaryMessage: `${predictionsInReview[i]["predictiveQuestion"]}`,
                            link: `/market/prediction/${predictionsInReview[i]["_id"]}`,
                            read: false,
                            timeStamp: nowUnix
                        }
                    );
                    await marketNotification.save();

                    for(let l = 0; l < marketsStatuses.length; l++) {
                        if(marketsStatuses[l]["quantityYes"] > 0 && marketsStatuses[l]["quantityNo"] > 0) {
                            const newActivityDesc = new activityDesc(
                                {
                                    predictionId: predictionsInReview[i]["_id"],
                                    predictiveImage: predictionsInReview[i]["predictiveImage"],
                                    predictiveQuestion: predictionsInReview[i]["predictiveQuestion"],
                                    marketId: marketsStatuses[l]["_id"],
                                    continous: marketsStatuses[l]["continous"],
                                    username: predictionsInReview[i]["username"],
                                    walletAddress: predictionsInReview[i]["creatorWalletAddress"],
                                    outcome: marketsStatuses[l]["outcome"],
                                    outcomeImage: marketsStatuses[l]["outcomeImage"],
                                    chainId: marketsStatuses[l]["chains"][0],
                                    selection: "yes",
                                    action: "buy",
                                    quantity: marketsStatuses[l]["quantityYes"],
                                    averagePrice: marketsStatuses[l]["priceYes"],
                                    fee: 0,
                                    collateral: 0,
                                    costFunctionDesc: {
                                        "quantityYes": marketsStatuses[l]["quantityYes"], 
                                        "quantityNo": marketsStatuses[l]["quantityNo"], 
                                        "priceYes": marketsStatuses[l]["priceYes"], 
                                        "priceNo": marketsStatuses[l]["priceNo"], 
                                        "costFunction": marketsStatuses[l]["costFunction"]
                                    },
                                    prevCostFunctionDesc: {
                                        "quantityYes": 0, 
                                        "quantityNo": 0, 
                                        "priceYes": 0, 
                                        "priceNo": 0, 
                                        "costFunction": 0
                                    },
                                    orderStatus: "validated",
                                    resolutionOutcome: "",
                                    requestKey: marketsStatuses[l]["requestKey"],
                                    openedTimestamp: marketsStatuses[l]["createdTimestamp"],
                                    sentTimestamp: marketsStatuses[l]["createdTimestamp"],
                                    validatedTimestamp: nowUnix
                                }
                            );
                            await newActivityDesc.save();

                            const newActivityNoDesc = new activityDesc(
                                {
                                    predictionId: predictionsInReview[i]["_id"],
                                    predictiveImage: predictionsInReview[i]["predictiveImage"],
                                    predictiveQuestion: predictionsInReview[i]["predictiveQuestion"],
                                    marketId: marketsStatuses[l]["_id"],
                                    continous: marketsStatuses[l]["continous"],
                                    username: predictionsInReview[i]["username"],
                                    walletAddress: predictionsInReview[i]["creatorWalletAddress"],
                                    outcome: marketsStatuses[l]["outcome"],
                                    outcomeImage: marketsStatuses[l]["outcomeImage"],
                                    chainId: marketsStatuses[l]["chains"][0],
                                    selection: "no",
                                    action: "buy",
                                    quantity: marketsStatuses[l]["quantityNo"],
                                    averagePrice: marketsStatuses[l]["priceNo"],
                                    fee: 0,
                                    collateral: 0,
                                    costFunctionDesc: {
                                        "quantityYes": marketsStatuses[l]["quantityYes"], 
                                        "quantityNo": marketsStatuses[l]["quantityNo"], 
                                        "priceYes": marketsStatuses[l]["priceYes"], 
                                        "priceNo": marketsStatuses[l]["priceNo"], 
                                        "costFunction": marketsStatuses[l]["costFunction"]
                                    },
                                    prevCostFunctionDesc: {
                                        "quantityYes": 0, 
                                        "quantityNo": 0, 
                                        "priceYes": 0, 
                                        "priceNo": 0, 
                                        "costFunction": 0
                                    },
                                    orderStatus: "validated",
                                    resolutionOutcome: "",
                                    requestKey: marketsStatuses[l]["requestKey"],
                                    openedTimestamp: marketsStatuses[l]["createdTimestamp"],
                                    sentTimestamp: marketsStatuses[l]["createdTimestamp"],
                                    validatedTimestamp: nowUnix
                                }
                            );
                            await newActivityNoDesc.save();
                        } else {
                            const newActivityDesc = new activityDesc(
                                {
                                    predictionId: predictionsInReview[i]["_id"],
                                    predictiveImage: predictionsInReview[i]["predictiveImage"],
                                    predictiveQuestion: predictionsInReview[i]["predictiveQuestion"],
                                    marketId: marketsStatuses[l]["_id"],
                                    continous: marketsStatuses[l]["continous"],
                                    username: predictionsInReview[i]["username"],
                                    walletAddress: predictionsInReview[i]["creatorWalletAddress"],
                                    outcome: marketsStatuses[l]["outcome"],
                                    outcomeImage: marketsStatuses[l]["outcomeImage"],
                                    chainId: marketsStatuses[l]["chains"][0],
                                    selection: marketsStatuses[l]["quantityYes"] === 0 ? "no" : "yes",
                                    action: "buy",
                                    quantity: marketsStatuses[l]["quantityYes"] === 0 ? marketsStatuses[l]["quantityNo"] : marketsStatuses[l]["quantityYes"],
                                    averagePrice: marketsStatuses[l]["quantityYes"] === 0 ? marketsStatuses[l]["priceNo"] : marketsStatuses[l]["priceYes"],
                                    fee: 0,
                                    collateral: 0,
                                    costFunctionDesc: {
                                        "quantityYes": marketsStatuses[l]["quantityYes"], 
                                        "quantityNo": marketsStatuses[l]["quantityNo"], 
                                        "priceYes": marketsStatuses[l]["priceYes"], 
                                        "priceNo": marketsStatuses[l]["priceNo"], 
                                        "costFunction": marketsStatuses[l]["costFunction"]
                                    },
                                    prevCostFunctionDesc: {
                                        "quantityYes": 0, 
                                        "quantityNo": 0, 
                                        "priceYes": 0, 
                                        "priceNo": 0, 
                                        "costFunction": 0
                                    },
                                    orderStatus: "validated",
                                    resolutionOutcome: "",
                                    requestKey: marketsStatuses[l]["requestKey"],
                                    openedTimestamp: marketsStatuses[l]["createdTimestamp"],
                                    sentTimestamp: marketsStatuses[l]["createdTimestamp"],
                                    validatedTimestamp: nowUnix
                                }
                            );
                            await newActivityDesc.save();
                        }

                        const newHoldings = new holdingsDesc(
                            {
                                predictionId: predictionsInReview[i]["_id"],
                                predictiveImage: predictionsInReview[i]["predictiveImage"],
                                predictiveQuestion: predictionsInReview[i]["predictiveQuestion"],
                                marketId: marketsStatuses[l]["_id"],
                                continous: marketsStatuses[l]["continous"],
                                username: predictionsInReview[i]["username"],
                                walletAddress: predictionsInReview[i]["creatorWalletAddress"],
                                outcome: marketsStatuses[l]["outcome"],
                                outcomeImage: marketsStatuses[l]["outcomeImage"],
                        
                                yesQuantity: marketsStatuses[l]["quantityYes"],
                                yesAveragePrice: marketsStatuses[l]["priceYes"],
                                yesQuantityDesc: marketsStatuses[l]["quantityYes"] === 0 ? [] : [[marketsStatuses[l]["chains"][0], marketsStatuses[l]["quantityYes"]]],
                                noQuantity: marketsStatuses[l]["quantityNo"],
                                noAveragePrice: marketsStatuses[l]["priceNo"],
                                noQuantityDesc: marketsStatuses[l]["quantityNo"] === 0 ? [] : [[marketsStatuses[l]["chains"][0], marketsStatuses[l]["quantityNo"]]],
                                boughtTimestamp: nowUnix,
                        
                                soldYesQuantity: 0,
                                soldYesCollateral: 0,
                                soldYesAveragePrice: 0,
                                soldYesQuantityDesc: [],
                                soldYesCollateralDesc: [],
                                soldNoQuantity: 0,
                                soldNoCollateral: 0,
                                soldNoAveragePrice: 0,
                                soldNoQuantityDesc: [],
                                soldNoCollateralDesc: [],
                                soldTimestamp: 0,
                                
                                resolutionOutcome: "",
                                resolutionRequestKeys: [],
                                earnings: 0,
                                predictionEndTimestamp: marketsStatuses[l]["endDate"],
                                resolvedTimestamp: 0
                            }
                        );
                        await newHoldings.save();
                    }
                    
                }
            }
        }

        await predictionsProcessesDesc.updateOne(
            {type: "notify"},
            {$set: {create: false}}
        );
    }
}

marketNotify().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);