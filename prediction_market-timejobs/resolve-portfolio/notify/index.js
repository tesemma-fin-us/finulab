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

const resolvePortfolioNotify = async () => {
    const isProcessRunningDesc = await predictionsProcessesDesc.find({type: "notify"});
    const isProcessRunning = isProcessRunningDesc[0]["resolvePortfolio"];

    if(!isProcessRunning) {
        await predictionsProcessesDesc.updateOne(
            {type: "notify"},
            {$set: {resolvePortfolio: true}}
        );

        const portfoliosToNotify = await portfoliosResolutionDesc.find({portfolioResolveSent: true, portfolioResolveValidated: true, portfolioResolveNotified: false});
        if(portfoliosToNotify.length > 0) {
            let marketIds = [], marketIds_desc = [];
            for(let i = 0; i < portfoliosToNotify.length; i++) {
                if(!marketIds.includes(portfoliosToNotify[i]["marketId"])) {
                    marketIds.push(portfoliosToNotify[i]["marketId"]);
                }
            }

            for(let j = 0; j < marketIds.length; j++) {
                const latest_activityEntry = await activityDesc.find({marketId: `${marketIds[j]}`}).sort({openedTimestamp: -1}).limit(1);
                if(latest_activityEntry.length > 0) {
                    marketIds_desc.push(latest_activityEntry[0]);
                }
            }

            let covered_marketIds = [];
            for(let k = 0; k < portfoliosToNotify.length; k++) {
                const price_no = portfoliosToNotify[k]["resolutionOutcome"] === "no" ? 1 : 0;
                const price_yes = portfoliosToNotify[k]["resolutionOutcome"] === "yes" ? 1 : 0;
                const earnings_inc = (portfoliosToNotify[k]["yesQuantity"] * price_yes) + (portfoliosToNotify[k]["noQuantity"] * price_no);

                await holdingsDesc.updateOne(
                    {predictionId: portfoliosToNotify[k]["predictionId"], marketId: portfoliosToNotify[k]["marketId"], username: portfoliosToNotify[k]["username"]}, 
                    {
                        $inc: {earnings: earnings_inc},
                        $push: {resolutionRequestKeys: [portfoliosToNotify[k]["chainId"], portfoliosToNotify[k]["portfolioResolveRequestKey"]]}
                    }
                );

                const reference_activity = marketIds_desc.filter(doc => doc.marketId === portfoliosToNotify[k]["marketId"])[0];
                if(covered_marketIds.includes(portfoliosToNotify[k]["marketId"])) {
                    if(portfoliosToNotify[k]["yesQuantity"] > 0) {
                        const yesResolutionActivity = new activityDesc(
                            {
                                predictionId: portfoliosToNotify[k]["predictionId"],
                                predictiveImage: reference_activity["predictiveImage"],
                                predictiveQuestion: reference_activity["predictiveQuestion"],
                                marketId: portfoliosToNotify[k]["marketId"],
                                continous: false,
                                username: portfoliosToNotify[k]["username"],
                                walletAddress: portfoliosToNotify[k]["walletAddress"],
                                outcome: portfoliosToNotify[k]["outcome"],
                                outcomeImage: reference_activity["outcomeImage"],
                                chainId: portfoliosToNotify[k]["chainId"],
                                selection: "yes",
                                action: "resolve",
                                quantity: portfoliosToNotify[k]["yesQuantity"],
                                averagePrice: price_yes,
                                fee: 0,
                                collateral: 0,
                                costFunctionDesc: {
                                    "quantityYes": reference_activity["costFunctionDesc"]["quantityYes"], 
                                    "quantityNo": reference_activity["costFunctionDesc"]["quantityNo"], 
                                    "priceYes": price_yes, 
                                    "priceNo": price_no, 
                                    "costFunction": reference_activity["costFunctionDesc"]["costFunction"]
                                },
                                prevCostFunctionDesc: {
                                    "quantityYes": reference_activity["costFunctionDesc"]["quantityYes"], 
                                    "quantityNo": reference_activity["costFunctionDesc"]["quantityNo"], 
                                    "priceYes": price_yes, 
                                    "priceNo": price_no, 
                                    "costFunction": reference_activity["costFunctionDesc"]["costFunction"]
                                },
                                orderStatus: "validated",
                                resolutionOutcome: portfoliosToNotify[k]["resolutionOutcome"],
                                requestKey: portfoliosToNotify[k]["portfolioResolveRequestKey"],
                                openedTimestamp: portfoliosToNotify[k]["portfolioResolveSentTimestamp"],
                                sentTimestamp: portfoliosToNotify[k]["portfolioResolveSentTimestamp"],
                                validatedTimestamp: portfoliosToNotify[k]["portfolioResolveValidatedTimestamp"]
                            }
                        );
                        await yesResolutionActivity.save();
                    }

                    if(portfoliosToNotify[k]["noQuantity"] > 0) {
                        const noResolutionActivity = new activityDesc(
                            {
                                predictionId: portfoliosToNotify[k]["predictionId"],
                                predictiveImage: reference_activity["predictiveImage"],
                                predictiveQuestion: reference_activity["predictiveQuestion"],
                                marketId: portfoliosToNotify[k]["marketId"],
                                continous: false,
                                username: portfoliosToNotify[k]["username"],
                                walletAddress: portfoliosToNotify[k]["walletAddress"],
                                outcome: portfoliosToNotify[k]["outcome"],
                                outcomeImage: reference_activity["outcomeImage"],
                                chainId: portfoliosToNotify[k]["chainId"],
                                selection: "no",
                                action: "resolve",
                                quantity: portfoliosToNotify[k]["noQuantity"],
                                averagePrice: price_no,
                                fee: 0,
                                collateral: 0,
                                costFunctionDesc: {
                                    "quantityYes": reference_activity["costFunctionDesc"]["quantityYes"], 
                                    "quantityNo": reference_activity["costFunctionDesc"]["quantityNo"], 
                                    "priceYes": price_yes, 
                                    "priceNo": price_no, 
                                    "costFunction": reference_activity["costFunctionDesc"]["costFunction"]
                                },
                                prevCostFunctionDesc: {
                                    "quantityYes": reference_activity["costFunctionDesc"]["quantityYes"], 
                                    "quantityNo": reference_activity["costFunctionDesc"]["quantityNo"], 
                                    "priceYes": price_yes, 
                                    "priceNo": price_no, 
                                    "costFunction": reference_activity["costFunctionDesc"]["costFunction"]
                                },
                                orderStatus: "validated",
                                resolutionOutcome: portfoliosToNotify[k]["resolutionOutcome"],
                                requestKey: portfoliosToNotify[k]["portfolioResolveRequestKey"],
                                openedTimestamp: portfoliosToNotify[k]["portfolioResolveSentTimestamp"],
                                sentTimestamp: portfoliosToNotify[k]["portfolioResolveSentTimestamp"],
                                validatedTimestamp: portfoliosToNotify[k]["portfolioResolveValidatedTimestamp"]
                            }
                        );
                        await noResolutionActivity.save();
                    }
                } else {
                    if(portfoliosToNotify[k]["yesQuantity"] > 0) {
                        const yesResolutionActivity = new activityDesc(
                            {
                                predictionId: portfoliosToNotify[k]["predictionId"],
                                predictiveImage: reference_activity["predictiveImage"],
                                predictiveQuestion: reference_activity["predictiveQuestion"],
                                marketId: portfoliosToNotify[k]["marketId"],
                                continous: false,
                                username: portfoliosToNotify[k]["username"],
                                walletAddress: portfoliosToNotify[k]["walletAddress"],
                                outcome: portfoliosToNotify[k]["outcome"],
                                outcomeImage: reference_activity["outcomeImage"],
                                chainId: portfoliosToNotify[k]["chainId"],
                                selection: "yes",
                                action: "resolve",
                                quantity: portfoliosToNotify[k]["yesQuantity"],
                                averagePrice: price_yes,
                                fee: 0,
                                collateral: 0,
                                costFunctionDesc: {
                                    "quantityYes": reference_activity["costFunctionDesc"]["quantityYes"], 
                                    "quantityNo": reference_activity["costFunctionDesc"]["quantityNo"], 
                                    "priceYes": price_yes, 
                                    "priceNo": price_no, 
                                    "costFunction": reference_activity["costFunctionDesc"]["costFunction"]
                                },
                                prevCostFunctionDesc: reference_activity["costFunctionDesc"],
                                orderStatus: "validated",
                                resolutionOutcome: portfoliosToNotify[k]["resolutionOutcome"],
                                requestKey: portfoliosToNotify[k]["portfolioResolveRequestKey"],
                                openedTimestamp: portfoliosToNotify[k]["portfolioResolveSentTimestamp"],
                                sentTimestamp: portfoliosToNotify[k]["portfolioResolveSentTimestamp"],
                                validatedTimestamp: portfoliosToNotify[k]["portfolioResolveValidatedTimestamp"]
                            }
                        );
                        await yesResolutionActivity.save();
                    }

                    if(portfoliosToNotify[k]["noQuantity"] > 0) {
                        const noResolutionActivity = new activityDesc(
                            {
                                predictionId: portfoliosToNotify[k]["predictionId"],
                                predictiveImage: reference_activity["predictiveImage"],
                                predictiveQuestion: reference_activity["predictiveQuestion"],
                                marketId: portfoliosToNotify[k]["marketId"],
                                continous: false,
                                username: portfoliosToNotify[k]["username"],
                                walletAddress: portfoliosToNotify[k]["walletAddress"],
                                outcome: portfoliosToNotify[k]["outcome"],
                                outcomeImage: reference_activity["outcomeImage"],
                                chainId: portfoliosToNotify[k]["chainId"],
                                selection: "no",
                                action: "resolve",
                                quantity: portfoliosToNotify[k]["noQuantity"],
                                averagePrice: price_no,
                                fee: 0,
                                collateral: 0,
                                costFunctionDesc: {
                                    "quantityYes": reference_activity["costFunctionDesc"]["quantityYes"], 
                                    "quantityNo": reference_activity["costFunctionDesc"]["quantityNo"], 
                                    "priceYes": price_yes, 
                                    "priceNo": price_no, 
                                    "costFunction": reference_activity["costFunctionDesc"]["costFunction"]
                                },
                                prevCostFunctionDesc: reference_activity["costFunctionDesc"],
                                orderStatus: "validated",
                                resolutionOutcome: portfoliosToNotify[k]["resolutionOutcome"],
                                requestKey: portfoliosToNotify[k]["portfolioResolveRequestKey"],
                                openedTimestamp: portfoliosToNotify[k]["portfolioResolveSentTimestamp"],
                                sentTimestamp: portfoliosToNotify[k]["portfolioResolveSentTimestamp"],
                                validatedTimestamp: portfoliosToNotify[k]["portfolioResolveValidatedTimestamp"]
                            }
                        );
                        await noResolutionActivity.save();
                    }

                    covered_marketIds.push(portfoliosToNotify[k]["marketId"]);
                }

                const now = new Date();
                const nowUnix = datefns.getUnixTime(now);

                const resolutionNotification = new notificationsDescs(
                    {
                        by: "finulab",
                        target: `${portfoliosToNotify[k]["username"]}`,
                        byProfileImage: "",
                        type: "payment",
                        message: `Your portfolio is now resolved.`,
                        secondaryMessage: "",
                        link: `https://explorer.chainweb.com/mainnet/txdetail/${portfoliosToNotify[k]["portfolioResolveRequestKey"]}`,
                        read: false,
                        timeStamp: nowUnix
                    }
                );
                await resolutionNotification.save();

                await portfoliosResolutionDesc.updateOne(
                    {
                        predictionId: portfoliosToNotify[k]["predictionId"], 
                        marketId: portfoliosToNotify[k]["marketId"], 
                        username: portfoliosToNotify[k]["username"], 
                        walletAddress: portfoliosToNotify[k]["walletAddress"],
                        portfolioResolveSent: true, 
                        portfolioResolveValidated: true, 
                        portfolioResolveNotified: false
                    }, 
                    {$set: {portfolioResolveNotified: true}}
                );
            }
        }

        await predictionsProcessesDesc.updateOne(
            {type: "notify"},
            {$set: {resolvePortfolio: false}}
        );
    }
}

resolvePortfolioNotify().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);