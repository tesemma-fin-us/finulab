const axios = require("axios");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");

dotenv.config();

const finux_network_connx = mongoose.createConnection(process.env.mongo_finux_network);

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

const validateFinuxRewards = async () => {
    const isProcessRunningDesc = await finuxRewardsProcesses.findOne({type: "yRewards"});
    const isProcessRunning = isProcessRunningDesc["validated"];

    if(!isProcessRunning) {
        await finuxRewardsProcesses.updateOne(
            {type: "yRewards"},
            {$set: {validated: true}}
        );
        
        const txsToValidate = await finuxRewardsDescs.find({sent: true, validated: false});
        if(txsToValidate.length > 0) {
            for(let i = 0; i < txsToValidate.length; i++) {
                if(txsToValidate[i]["validationAttempts"] >= 15) {
                    await finuxRewardsDescs.updateOne(
                        {_id: txsToValidate[i]["_id"]}, 
                        {$set: {sent: false, validationAttempts: 0}}
                    );
                } else {
                    const chainId = txsToValidate[i]["chainId"], chainwebSendURLpt1 = "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/", chainwebSendURLpt2 = "/pact/api/v1/poll";

                    try {
                        const pollReqKey = await axios.post(`${chainwebSendURLpt1}${chainId}${chainwebSendURLpt2}`, 
                            {
                                "requestKeys": [
                                    txsToValidate[i]["requestKey"]
                                ]
                            }
                        );

                        if(pollReqKey.status === 200) {
                            if(pollReqKey.data !== undefined && pollReqKey.data !== null) {
                                const resKeys = Object.keys(pollReqKey.data);
                                if(resKeys.includes(txsToValidate[i]["requestKey"])) {
                                    const result = pollReqKey.data[txsToValidate[i]["requestKey"]]["result"]["status"];

                                    if(result === "success") {
                                        const now = new Date();
                                        const nowUnix = datefns.getUnixTime(now);

                                        await finuxRewardsDescs.updateOne(
                                            {_id: txsToValidate[i]["_id"]}, 
                                            {$set: {validated: true, validatedTimestamp: nowUnix}}
                                        );
                                    } else if(result === "failure") {
                                        await finuxRewardsDescs.updateOne(
                                            {_id: txsToValidate[i]["_id"]}, 
                                            {$set: {sent: false, validationAttempts: 0}}
                                        );
                                    }
                                }
                            }
                        } else {
                            await finuxRewardsDescs.updateOne(
                                {_id: txsToValidate[i]["_id"]}, 
                                {$inc: {validationAttempts: 1}}
                            );
                        }
                    } catch(error) {
                        await finuxRewardsDescs.updateOne(
                            {_id: txsToValidate[i]["_id"]}, 
                            {$inc: {validationAttempts: 1}}
                        );
                    }
                }
            }
        }

        await finuxRewardsProcesses.updateOne(
            {type: "yRewards"},
            {$set: {validated: false}}
        );
    }
}

validateFinuxRewards().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);