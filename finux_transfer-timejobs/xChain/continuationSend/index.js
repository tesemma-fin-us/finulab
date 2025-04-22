const axios = require("axios");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");
const pact = require("pact-lang-api");

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

const xChain_sendContinuation = async () => {
    const isProcessRunningDesc = await finuxTxProcesses.findOne({type: "xChain"});
    const isProcessRunning = isProcessRunningDesc["continuationSent"];

    if(!isProcessRunning) {
        await finuxTxProcesses.updateOne(
            {type: "xChain"},
            {$set: {continuationSent: true}}
        );

        const chainTxs = await finuxTxs.find({transferType: "xChain", sent: true, validated: true, spvProofReterived: true, txCompleted: false});
        if(chainTxs.length > 0) {
            const ttl = 28800;
            const gasLimit = 2320;
            const gasPrice = 0.0000010000;
            const gasStation = process.env.gas_station, gasAccount = `k:${pact.crypto.restoreKeyPairFromSecretKey(gasStation).publicKey}`;
            const networkId = "mainnet01", chainwebSendURLpt1 = "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/", chainwebSendURLpt2 = "/pact/api/v1/send";

            const capabilityData = {
                publicKey: pact.crypto.restoreKeyPairFromSecretKey(gasStation).publicKey,
                secretKey: gasStation,
                clist: [
                    {"name": "coin.GAS", "args": []},
                ]
            }

            for(let i = 0; i < chainTxs.length; i++) {
                const now = new Date();
                const creationTime = datefns.getUnixTime(now);
                const toChain = chainTxs[i]["toChain"], requestKey = chainTxs[i]["requestKey"], spvProof = chainTxs[i]["spvProof"];

                const pactContinueCmd = pact.simple.cont.createCommand([capabilityData],
                    undefined, 1, requestKey, false, null, pact.lang.mkMeta(gasAccount, toChain, gasPrice, gasLimit, creationTime, ttl),
                    spvProof, networkId
                );

                let utilizeRequestKey = "";
                try {
                    const chainwebResponse = await axios.post(`${chainwebSendURLpt1}${toChain}${chainwebSendURLpt2}`, pactContinueCmd);
                    if(chainwebResponse.status === 200) {
                        if(chainwebResponse.data !== undefined && chainwebResponse.data !== null) {
                            const resKeys = Object.keys(chainwebResponse.data);
                            if(resKeys.includes("requestKeys")) {
                                utilizeRequestKey = chainwebResponse.data["requestKeys"][0];
                            }
                        }
                    }
                } catch(error) {
                    try {
                        const chainwebResponse = await axios.post(`${chainwebSendURLpt1}${toChain}${chainwebSendURLpt2}`, pactContinueCmd);
                        if(chainwebResponse.status === 200) {
                            if(chainwebResponse.data !== undefined && chainwebResponse.data !== null) {
                                const resKeys = Object.keys(chainwebResponse.data);
                                if(resKeys.includes("requestKeys")) {
                                    utilizeRequestKey = chainwebResponse.data["requestKeys"][0];
                                }
                            }
                        }
                    } catch(error) {
                        utilizeRequestKey = ""
                    }
                }

                if(utilizeRequestKey !== "") {
                    await finuxTxs.updateOne(
                        {_id: chainTxs[i]["_id"]},
                        {$set: {continuationSent: true, continuationRequestKey: utilizeRequestKey, continuationSentTimestamp: creationTime}}
                    );
                }
            }
        }

        await finuxTxProcesses.updateOne(
            {type: "xChain"},
            {$set: {continuationSent: false}}
        );
    }
}

xChain_sendContinuation().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);