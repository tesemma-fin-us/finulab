const mongoose = require("mongoose");

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

module.exports = mongoose.model("finux-txs", finuxTxsSchema, "finux-txs");