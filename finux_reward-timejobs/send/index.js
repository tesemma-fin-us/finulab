const axios = require("axios");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");
const pact = require("pact-lang-api");

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

const formatPayoutBalance = new Intl.NumberFormat(
    'en-US',
    {
        useGrouping: false,
        minimumFractionDigits: 2,
        maximumFractionDigits: 12
    }
);
const pactDecimalFormatter = (value) => {
    const amount = `${Number(formatPayoutBalance.format(value))}`;

    const regex = /\./g;
    const amountStringPreInterlude = amount;
    const amountStringInterlude = (amountStringPreInterlude.match(regex) || []).length;
    const amountString = amountStringInterlude === 1 ? amount : parseFloat(amount).toFixed(1);

    return amountString;
}

const sendFinuxRewards = async () => {
    const isProcessRunningDesc = await finuxRewardsProcesses.findOne({type: "yRewards"});
    const isProcessRunning = isProcessRunningDesc["sent"]
    
    if(!isProcessRunning) {
        await finuxRewardsProcesses.updateOne(
            {type: "yRewards"},
            {$set: {sent: true}}
        );

        const rewardTxs = await finuxRewardsDescs.find({sent: false});
        if(rewardTxs.length > 0) {
            const ttl = 28800;
            const gasLimit = 2320;
            const gasPrice = 0.0000010000;
            const finulab_bank = process.env.finulab_bank;
            const operations_admin = process.env.operations_admin;
            const gasStation = process.env.gas_station, gasAccount = `k:${pact.crypto.restoreKeyPairFromSecretKey(gasStation).publicKey}`;
            const networkId = "mainnet01", chainwebSendURLpt1 = "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/", chainwebSendURLpt2 = "/pact/api/v1/send";

            const envData = {
                "ks": {
                    "keys": [
                        pact.crypto.restoreKeyPairFromSecretKey(gasStation).publicKey
                    ],
                    "pred": "keys-all"
                }
            };
            const capabilityData = {
                publicKey: pact.crypto.restoreKeyPairFromSecretKey(gasStation).publicKey,
                secretKey: gasStation,
                clist: [
                    {"name": "coin.GAS", "args": []},
                ]
            };
            const capabilityDataOpx = {
                publicKey: pact.crypto.restoreKeyPairFromSecretKey(operations_admin).publicKey,
                secretKey: operations_admin
            }

            for(let i = 0; i < rewardTxs.length; i++) {
                const now = new Date();
                const creationTime = datefns.getUnixTime(now);

                const from = "finulab-bank";
                const to = rewardTxs[i]["address"];
                const chainId = rewardTxs[i]["chainId"];
                const txamount = Number(formatPayoutBalance.format(rewardTxs[i]["amount"]));

                const envDataToUtilize = {
                    ...envData,
                    [to]: {
                        "keys": [
                            to.slice(2, to.length)
                        ],
                        "pred": "keys-all"
                    }
                }
                const capabilityDataToUtilize = [
                    capabilityData,
                    capabilityDataOpx,
                    {
                        publicKey: pact.crypto.restoreKeyPairFromSecretKey(finulab_bank).publicKey,
                        secretKey: finulab_bank, 
                        clist: [
                            {"name": "free.finux.TRANSFER", "args": [from, to, txamount]}
                        ]
                    }
                ];
                
                const pactTxAmount = pactDecimalFormatter(rewardTxs[i]["amount"]);
                const pactCmd = pact.simple.exec.createCommand(capabilityDataToUtilize, undefined,
                    `(free.finux.transfer-create "${from}" "${to}" (read-keyset "${to}") ${pactTxAmount})`,
                    envDataToUtilize, pact.lang.mkMeta(gasAccount, chainId, gasPrice, gasLimit, creationTime, ttl), networkId
                );

                let utilizeRequestKey = "";
                try {
                    const chainwebResponse = await axios.post(`${chainwebSendURLpt1}${chainId}${chainwebSendURLpt2}`, pactCmd);
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
                        const chainwebResponse = await axios.post(`${chainwebSendURLpt1}${chainId}${chainwebSendURLpt2}`, pactCmd);
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
                    await finuxRewardsDescs.updateOne(
                        {_id: rewardTxs[i]["_id"]},
                        {$set: {sent: true, requestKey: utilizeRequestKey, sentTimestamp: creationTime}}
                    );
                }
            }
        }

        await finuxRewardsProcesses.updateOne(
            {type: "yRewards"},
            {$set: {sent: false}}
        );
    }
}

sendFinuxRewards().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);