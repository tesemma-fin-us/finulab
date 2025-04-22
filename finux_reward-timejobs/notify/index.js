const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");

dotenv.config();

const content_connx = mongoose.createConnection(process.env.mongo_content);
const finux_network_connx = mongoose.createConnection(process.env.mongo_finux_network);

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

const accountsWalletDescsSchema = mongoose.Schema(
    {
        username: String,
        accountName: String,
        accountDesignation: String,
        publicKey: String,
        secretKey: String,
        aggregateBalance: Number,
        pendingBalanceMorning: Number,
        pendingBalanceEvening: Number,
        chain_by_chain: Object
    }
);
const accountsWalletDescs = finux_network_connx.model("accounts-wallet-descs", accountsWalletDescsSchema, "accounts-wallet-descs");

const finuxRewardsDescsSchema = mongoose.Schema(
    {
        username: String,

        address: String,
        chainId: String,
        category: String,

        amount: Number,

        sent: Boolean,
        validated: Boolean,
        requestKey: String,
        sentTimestamp: Number,
        validatedTimestamp: Number,
        validationAttempts: Number,

        notified: Boolean,
        notificationTimestamp: Number
    }
);
const finuxRewardsDescs = finux_network_connx.model("finux-rewards", finuxRewardsDescsSchema, "finux-rewards");

const finuxRewardsProcessesSchema = mongoose.Schema(
    {
        type: String,
        align: Boolean,
        sent: Boolean,
        validated: Boolean,
        notify: Boolean
    }
);
const finuxRewardsProcesses = finux_network_connx.model("finux-rewards-processes", finuxRewardsProcessesSchema, "finux-rewards-processes");

const notifyFinuxRewards = async () => {
    const isProcessRunningDesc = await finuxRewardsProcesses.findOne({type: "yRewards"});
    const isProcessRunning = isProcessRunningDesc["notify"];

    if(!isProcessRunning) {
        await finuxRewardsProcesses.updateOne(
            {type: "yRewards"},
            {$set: {notify: true}}
        );

        const txsToNotify = await finuxRewardsDescs.find({sent: true, validated: true, notified: false});
        if(txsToNotify.length > 0) {
            const now = new Date();
            const nowUnix = datefns.getUnixTime(now);

            for(let i = 0; i < txsToNotify.length; i++) {
                const newRewardNotification = new notificationsDescs(
                    {
                        by: "finulab",
                        target: `${txsToNotify[i]["username"]}`,
                        byProfileImage: "",
                        type: "payment",
                        message: txsToNotify[i]["category"] === "morning" ? `Morning-Rewards: Your FINUX rewards have been deposited into your account!` : `Evening-Rewards: Your FINUX rewards have been deposited into your account!`,
                        secondaryMessage: `<p>You received <strong style="color: #2ecc71;"><a href="https://finulab.com/wallet">${txsToNotify[i]["amount"]} FINUX</a></strong></p>`,
                        link: `https://explorer.chainweb.com/mainnet/txdetail/${txsToNotify[i]["requestKey"]}`,
                        read: false,
                        timeStamp: nowUnix
                    }
                );
                await newRewardNotification.save();

                if(txsToNotify[i]["category"] === "morning") {
                    await accountsWalletDescs.updateOne(
                        {username: txsToNotify[i]["username"]},
                        {$inc: {pendingBalanceMorning: -txsToNotify[i]["amount"]}}
                    );
                } else if(txsToNotify[i]["category"] === "evening") {
                    await accountsWalletDescs.updateOne(
                        {username: txsToNotify[i]["username"]},
                        {$inc: {pendingBalanceEvening: -txsToNotify[i]["amount"]}}
                    );
                }
                
                await finuxRewardsDescs.updateOne(
                    {_id: txsToNotify[i]["_id"]},
                    {$set: {notified: true, notificationTimestamp: nowUnix}}
                );
            }
        }

        await finuxRewardsProcesses.updateOne(
            {type: "yRewards"},
            {$set: {notify: false}}
        );
    }
}

notifyFinuxRewards().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);