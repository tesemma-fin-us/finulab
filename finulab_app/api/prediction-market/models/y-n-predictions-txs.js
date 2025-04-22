const mongoose = require("mongoose");

const ynPredictionsTxsSchema = mongoose.Schema(
    {
        predictionId: String,
        marketId: String,
        activityId: String,
        username: String,
        walletAddress: String,
        continous: Boolean,
        chainId: String,
        type: String,
        function: String,
        txDesc: Object,
        pendedBalance: Number,
        sent: Boolean,
        validated: Boolean,
        notified: Boolean,
        requestKey: String,
        sentTimestamp: Number,
        validatedTimestamp: Number,
        validationAttempts: Number
    }
);

module.exports = mongoose.model("y-n-predictions-txs", ynPredictionsTxsSchema, "y-n-predictions-txs");