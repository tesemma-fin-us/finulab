const axios = require("axios");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");
const pact = require("pact-lang-api");
const cryptoJS = require("crypto-js");

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

const privilegedAccounts = process.env.privilegedAccounts;
const root_accounts = process.env.root_accounts;
const root_accounts_keys = process.env.root_accounts_keys;

const xChain_sendFinux = async () => {
    const isProcessRunningDesc = await finuxTxProcesses.findOne({type: "xChain"});
    const isProcessRunning = isProcessRunningDesc["sent"];

    if(!isProcessRunning) {
        await finuxTxProcesses.updateOne(
            {type: "xChain"},
            {$set: {sent: true}}
        );

        const chainTxs = await finuxTxs.find({transferType: "xChain", sent: false, txCompleted: false});
        if(chainTxs.length > 0) {
            let publicKeys = [];
            for(let i = 0; i < chainTxs.length; i++) {
                const address = chainTxs[i]["from"];
                if(root_accounts.includes(address)) continue;
                publicKeys.push(address.slice(2, address.length))
            }

            const finulab_walletAddressesDesc = await accountsWalletDescs.find({}).where("publicKey").in(publicKeys);

            const ttl = 28800;
            const gasLimit = 2320;
            const gasPrice = 0.0000010000;
            const passPhrase = process.env.finux_key;
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
            }
            const capabilityDataOne = {
                publicKey: pact.crypto.restoreKeyPairFromSecretKey(gasStation).publicKey,
                secretKey: gasStation,
                clist: [
                    {"name": "coin.GAS", "args": []},
                ]
            }

            for(let j = 0; j < chainTxs.length; j++) {
                let continue_wTx = true;

                const now = new Date();
                const creationTime = datefns.getUnixTime(now);

                const to = chainTxs[j]["to"];
                const from = chainTxs[j]["from"];
                const chainId = chainTxs[j]["fromChain"];
                const toChainId = chainTxs[j]["toChain"];

                let envDataToUtilize = {};
                if(root_accounts.includes(to)) {
                    const root_accounts_toIndex = root_accounts.findIndex(desc => desc == to);
                    if(root_accounts_toIndex === -1) {
                        await finuxTxs.updateOne(
                            {_id: chainTxs[j]["_id"]},
                            {$set: {txOutcome: "error", txCompleted: true}}
                        );
                        continue_wTx = false;
                        continue;
                    } else {
                        envDataToUtilize = {
                            ...envData,
                            [to]: {
                                "keys": [
                                    pact.crypto.restoreKeyPairFromSecretKey(root_accounts_keys[root_accounts_toIndex]).publicKey,
                                ],
                                "pred": "keys-all"
                            }
                        }
                    }
                } else {
                    if(to.slice(0, 2) === "k:") {
                        envDataToUtilize = {
                            ...envData,
                            [to]: {
                                "keys": [
                                    to.slice(2, to.length)
                                ],
                                "pred": "keys-all"
                            }
                        }
                    } else {
                        await finuxTxs.updateOne(
                            {_id: chainTxs[j]["_id"]},
                            {$set: {txOutcome: "error", txCompleted: true}}
                        );
                        continue_wTx = false;
                        continue;
                    }
                }

                let capabilityDataToUtilize = [];
                const txamount = Number(formatPayoutBalance.format(chainTxs[j]["amount"]));
                if(root_accounts.includes(from)) {
                    if(!privilegedAccounts.includes(chainTxs[j]["username"])) {
                        await finuxTxs.updateOne(
                            {_id: chainTxs[j]["_id"]},
                            {$set: {txOutcome: "error", txCompleted: true}}
                        );
                        continue_wTx = false;
                        continue;
                    }

                    const root_accounts_fromIndex = root_accounts.findIndex(desc => desc == from);
                    if(root_accounts_fromIndex === -1) {
                        await finuxTxs.updateOne(
                            {_id: chainTxs[j]["_id"]},
                            {$set: {txOutcome: "error", txCompleted: true}}
                        );
                        continue_wTx = false;
                        continue;
                    } else {
                        const capabilityDataOpx = {
                            publicKey: pact.crypto.restoreKeyPairFromSecretKey(operations_admin).publicKey,
                            secretKey: operations_admin
                        };
                        const capabilityDataTwo = {
                            publicKey: pact.crypto.restoreKeyPairFromSecretKey(root_accounts_keys[root_accounts_fromIndex]).publicKey,
                            secretKey: root_accounts_keys[root_accounts_fromIndex], 
                            clist: [
                                {"name": "free.finux.DEBIT", "args": [from]},
                                {"name": "free.finux.DEBIT", "args": [to]}
                            ]
                        };
                        capabilityDataToUtilize = [capabilityDataOne, capabilityDataOpx, capabilityDataTwo];
                    }
                } else {
                    const walletToFind = from.slice(2, from.length);
                    if(finulab_walletAddressesDesc.some(doc => doc.publicKey === walletToFind)) {
                        const from_secret = finulab_walletAddressesDesc.filter(doc => doc.publicKey === walletToFind)[0];
                        const decrypted_from_secret = cryptoJS.AES.decrypt(from_secret["secretKey"], passPhrase).toString(cryptoJS.enc.Utf8);

                        const capabilityDataTwo = {
                            publicKey: walletToFind,
                            secretKey: decrypted_from_secret, 
                            clist: [
                                {"name": "free.finux.DEBIT", "args": [from]},
                                {"name": "free.finux.DEBIT", "args": [to]}
                            ]
                        }
                        capabilityDataToUtilize = [capabilityDataOne, capabilityDataTwo];
                    } else {
                        await finuxTxs.updateOne(
                            {_id: chainTxs[j]["_id"]},
                            {$set: {txOutcome: "error", txCompleted: true}}
                        );
                        continue_wTx = false;
                        continue;
                    }
                }

                if(continue_wTx) {
                    const pactTxAmount = pactDecimalFormatter(chainTxs[j]["amount"]);
                    const pactCmd = pact.simple.exec.createCommand(capabilityDataToUtilize, undefined,
                        `(free.finux.transfer-crosschain "${from}" "${to}" (read-keyset "${to}") "${toChainId}" ${pactTxAmount})`,
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
                        await finuxTxs.updateOne(
                            {_id: chainTxs[j]["_id"]},
                            {$set: {sent: true, requestKey: utilizeRequestKey, sentTimestamp: creationTime}}
                        );
                    }
                }
            }
        }

        await finuxTxProcesses.updateOne(
            {type: "xChain"},
            {$set: {sent: false}}
        );
    }
}

xChain_sendFinux().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);