const mongoose = require("mongoose");

const cPredictionsApprovedSchema = mongoose.Schema(
    {
        predictionId: String,
        marketId: String,
        creator: String,
        creatorWalletAddress: String,
        chainId: String,
        sent: Boolean,
        validated: Boolean,
        requestKey: String,
        sentTimestamp: Number,
        validatedTimestamp: Number,
        validationAttempts: Number
    }
);

module.exports = mongoose.model("c-predictions-approved", cPredictionsApprovedSchema, "c-predictions-approved");