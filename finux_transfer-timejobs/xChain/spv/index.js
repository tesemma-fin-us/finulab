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

const xChain_spvProofRetrieval = async () => {
    const isProcessRunningDesc = await finuxTxProcesses.findOne({type: "xChain"});
    const isProcessRunning = isProcessRunningDesc["spvProofReterived"];

    if(!isProcessRunning) {
        await finuxTxProcesses.updateOne(
            {type: "xChain"},
            {$set: {spvProofReterived: true}}
        );

        const chainTxs = await finuxTxs.find({transferType: "xChain", sent: true, validated: true, spvProofReterived: false, txCompleted: false});
        if(chainTxs.length > 0) {
            for(let i = 0; i < chainTxs.length; i++) {
                const spvProof = {"requestKey": chainTxs[i]["requestKey"], "targetChainId": chainTxs[i]["toChain"]};
                const chainId = chainTxs[i]["fromChain"], chainwebSpvURLpt1 = "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/", chainwebSpvURLpt2 = "/pact/spv";

                try {
                    const pollReqKey = await axios.post(`${chainwebSpvURLpt1}${chainId}${chainwebSpvURLpt2}`, spvProof);

                    if(pollReqKey.status === 200) {
                        await finuxTxs.updateOne(
                            {_id: chainTxs[i]["_id"]},
                            {$set: {spvProofReterived: true, spvProof: pollReqKey.data}}
                        );
                    }
                } catch(error) {continue;}
            }
        }

        await finuxTxProcesses.updateOne(
            {type: "xChain"},
            {$set: {spvProofReterived: false}}
        );
    }
}

xChain_spvProofRetrieval().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);