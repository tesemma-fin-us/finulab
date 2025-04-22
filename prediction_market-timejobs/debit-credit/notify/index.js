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

const notifyCreditDebit = async () => {
    const isProcessRunningDesc = await predictionsProcessesDesc.find({type: "notify"});
    const isProcessRunning = isProcessRunningDesc[0]["credit"];

    if(!isProcessRunning) {
        await predictionsProcessesDesc.updateOne(
            {type: "notify"},
            {$set: {credit: true}}
        );

        const finalizedTxs = await predictionTxsDesc.find({sent: true, validated: true, notified: false});
        if(finalizedTxs.length > 0) {
            const now = new Date();
            const nowUnix = datefns.getUnixTime(now);
            for(let j = 0; j < finalizedTxs.length; j++) {
                const marketNotification = new notificationsDescs(
                    {
                        by: "finulab",
                        target: `${finalizedTxs[j]["username"]}`,
                        byProfileImage: "",
                        type: "payment",
                        message: finalizedTxs[j]["function"] === "credit" ? `Your purchase is now on the blockchain!` : `Your sale is now on the blockchain!`,
                        secondaryMessage: finalizedTxs[j]["function"] === "credit" ?
                            `<p>You purchased <strong style="color: #2ecc71;"><a href="https://finulab.com/market/outcome/${finalizedTxs[j]["marketId"]}/${finalizedTxs[j]["type"]}">${finalizedTxs[j]["txDesc"]["quantity"]} Shares</a></strong></p>` :
                            `<p>You sold <strong style="color: #df5344;"><a href="https://finulab.com/market/outcome/${finalizedTxs[j]["marketId"]}/${finalizedTxs[j]["type"]}">${finalizedTxs[j]["txDesc"]["quantity"]} Shares</a></strong></p>`,
                        link: `https://explorer.chainweb.com/mainnet/txdetail/${finalizedTxs[j]["requestKey"]}`,
                        read: false,
                        timeStamp: nowUnix
                    }
                );
                await marketNotification.save();

                await predictionTxsDesc.updateOne(
                    {_id: finalizedTxs[j]["_id"]},
                    {$set: {notified: true}}
                );
            }
        }

        await predictionsProcessesDesc.updateOne(
            {type: "notify"},
            {$set: {credit: false}}
        );
    }
}

notifyCreditDebit().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);