const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");
const datefns_tz = require("date-fns-tz");

dotenv.config();

const finux_network_connx = mongoose.createConnection(process.env.mongo_finux_network);

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

const determinePayoutCategory = () => {
    const now = new Date();
    const nowUnix = datefns.getUnixTime(now);
    const nowInEST = datefns_tz.toZonedTime(now, 'America/New_York');

    const todayEST = new Date(nowInEST);
    todayEST.setHours(0, 0, 0, 0);
    const todayUnix = datefns.getUnixTime(datefns_tz.fromZonedTime(todayEST, 'America/New_York'));

    const morningUnixCutoff = todayUnix + (6 * 60 * 60);
    const eveningUnixCutoff = todayUnix + (18 * 60 * 60);

    if(nowUnix <= morningUnixCutoff) {
        return "morning";
    } else if(nowUnix > morningUnixCutoff && nowUnix <= eveningUnixCutoff) {
        return "evening";
    } else if(nowUnix > eveningUnixCutoff) {
        return "morning";
    }
};

const alignFinuxRewards = async () => {
    const isProcessRunningDesc = await finuxRewardsProcesses.findOne({type: "yRewards"});
    const isProcessRunning = isProcessRunningDesc["align"];

    if(!isProcessRunning) {
        await finuxRewardsProcesses.updateOne(
            {type: "yRewards"},
            {$set: {align: true}}
        );
        
        let indexCategory = "";
        const notIndexCategory = determinePayoutCategory();
        notIndexCategory === "morning" ? indexCategory = "evening" : notIndexCategory === "evening" ? indexCategory = "morning" : indexCategory = "";

        if(indexCategory !== "") {
            if(indexCategory === "morning") {
                const rewardsToIndex = await accountsWalletDescs.find({accountDesignation: "validated", pendingBalanceMorning: {$gt: 0}});
                if(rewardsToIndex.length > 0) {
                    let insertRewards = [];
                    for(let i = 0; i < rewardsToIndex.length; i++) {
                        insertRewards.push(
                            {
                                username: rewardsToIndex[i]["username"],

                                address: `k:${rewardsToIndex[i]["publicKey"]}`,
                                chainId: "2",
                                category: indexCategory,

                                amount: rewardsToIndex[i]["pendingBalanceMorning"],

                                sent: false,
                                validated: false,
                                requestKey: "",
                                sentTimestamp: 0,
                                validatedTimestamp: 0,
                                validationAttempts: 0,

                                notified: false,
                                notificationTimestamp: 0
                            }
                        );
                    }

                    await finuxRewardsDescs.insertMany(insertRewards);
                }
            } else if(indexCategory === "evening") {
                const rewardsToIndex = await accountsWalletDescs.find({accountDesignation: "validated", pendingBalanceEvening: {$gt: 0}});
                if(rewardsToIndex.length > 0) {
                    let insertRewards = [];
                    for(let i = 0; i < rewardsToIndex.length; i++) {
                        insertRewards.push(
                            {
                                username: rewardsToIndex[i]["username"],
                        
                                address: `k:${rewardsToIndex[i]["publicKey"]}`,
                                chainId: "2",
                                category: indexCategory,
                        
                                amount: rewardsToIndex[i]["pendingBalanceEvening"],
                        
                                sent: false,
                                validated: false,
                                requestKey: "",
                                sentTimestamp: 0,
                                validatedTimestamp: 0,
                                validationAttempts: 0,
                        
                                notified: false,
                                notificationTimestamp: 0
                            }
                        );
                    }

                    await finuxRewardsDescs.insertMany(insertRewards);
                }
            }
        }

        await finuxRewardsProcesses.updateOne(
            {type: "yRewards"},
            {$set: {align: false}}
        );
    }
}

alignFinuxRewards().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);