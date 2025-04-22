const axios = require("axios");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");

dotenv.config();

const finux_network_connx = mongoose.createConnection(process.env.mongo_finux_network);

const finuxTxsSchema = mongoose.Schema(
    {
        username: String,
        from: String,
        fromChain: String,
        to: String,
        toChain: String,
        amount: Number,
        transferType: String,

        sent: Boolean,
        validated: Boolean,
        requestKey: String,
        sentTimestamp: Number,
        validatedTimestamp: Number,
        validationAttempts: Number,

        spvProofReterived: Boolean,
        spvProof: String,

        continuationSent: Boolean,
        continuationValidated: Boolean,
        continuationRequestKey: String,
        continuationSentTimestamp: Number,
        continuationValidatedTimestamp: Number,

        txOutcome: String,
        txCompleted: Boolean
    }
);
const finuxTxs = finux_network_connx.model("finux-txs", finuxTxsSchema, "finux-txs");

const finuxTxProcessesSchema = mongoose.Schema(
    {
        type: String,
        sent: Boolean,
        validated: Boolean,
        spvProofReterived: Boolean,
        continuationSent: Boolean,
        continuationValidated: Boolean
    }
);
const finuxTxProcesses = finux_network_connx.model("finux-tx-processes", finuxTxProcessesSchema, "finux-tx-processes");

const xChain_validateContinuation = async () => {
    const isProcessRunningDesc = await finuxTxProcesses.findOne({type: "xChain"});
    const isProcessRunning = isProcessRunningDesc["continuationValidated"];

    if(!isProcessRunning) {
        await finuxTxProcesses.updateOne(
            {type: "xChain"},
            {$set: {continuationValidated: true}}
        );

        const chainTxs = await finuxTxs.find({transferType: "xChain", sent: true, validated: true, spvProofReterived: true, continuationSent: true, continuationValidated: false, txCompleted: false});
        if(chainTxs.length > 0) {
            for(let i = 0; i < chainTxs.length; i++) {
                if(chainTxs[i]["validationAttempts"] >= 15) {
                    await finuxTxs.updateOne(
                        {_id: chainTxs[i]["_id"]},
                        {$set: {continuationSent: false, validationAttempts: 0}}
                    );
                } else {
                    const chainId = chainTxs[i]["toChain"], chainwebSendURLpt1 = "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/", chainwebSendURLpt2 = "/pact/api/v1/poll";

                    try {
                        const pollReqKey = await axios.post(`${chainwebSendURLpt1}${chainId}${chainwebSendURLpt2}`, 
                            {
                                "requestKeys": [
                                    chainTxs[i]["continuationRequestKey"]
                                ]
                            }
                        );

                        if(pollReqKey.status === 200) {
                            if(pollReqKey.data !== undefined && pollReqKey.data !== null) {
                                const resKeys = Object.keys(pollReqKey.data);
                                if(resKeys.includes(chainTxs[i]["continuationRequestKey"])) {
                                    const result = pollReqKey.data[chainTxs[i]["continuationRequestKey"]]["result"]["status"];

                                    if(result === "success") {
                                        const now = new Date();
                                        const nowUnix = datefns.getUnixTime(now);

                                        await finuxTxs.updateOne(
                                            {_id: chainTxs[i]["_id"]},
                                            {$set: {continuationValidated: true, continuationValidatedTimestamp: nowUnix, txOutcome: "success", txCompleted: true}}
                                        );
                                    } else if(result === "failure") {
                                        const error_msg = pollReqKey.data[chainTxs[i]["continuationRequestKey"]]["result"]["error"]["message"];
                                        const error_msg_parsed = error_msg.split(" ");
                                        
                                        if(error_msg_parsed.includes("completed:")) {
                                            const now = new Date();
                                            const nowUnix = datefns.getUnixTime(now);
                                            const continuation_requestKey = error_msg_parsed.at(-1);

                                            await finuxTxs.updateOne(
                                                {_id: chainTxs[i]["_id"]},
                                                {$set: {continuationRequestKey: continuation_requestKey, continuationValidated: true, continuationValidatedTimestamp: nowUnix, txOutcome: "success", txCompleted: true}}
                                            );
                                        } else {
                                            await finuxTxs.updateOne(
                                                {_id: chainTxs[i]["_id"]},
                                                {$set: {txOutcome: "error", txCompleted: true}}
                                            );
                                        }
                                    }
                                }
                            }
                        } else {
                            await finuxTxs.updateOne(
                                {_id: chainTxs[i]["_id"]},
                                {$inc: {validationAttempts: 1}}
                            );
                        }
                    } catch(error) {
                        await finuxTxs.updateOne(
                            {_id: chainTxs[i]["_id"]},
                            {$inc: {validationAttempts: 1}}
                        );
                    }
                }
            }
        }

        await finuxTxProcesses.updateOne(
            {type: "xChain"},
            {$set: {continuationValidated: false}}
        );
    }
}

xChain_validateContinuation().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);