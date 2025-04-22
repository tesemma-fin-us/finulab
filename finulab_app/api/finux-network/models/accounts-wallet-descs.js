const mongoose = require("mongoose");

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

module.exports = mongoose.model("accounts-wallet-descs", accountsWalletDescsSchema, "accounts-wallet-descs");