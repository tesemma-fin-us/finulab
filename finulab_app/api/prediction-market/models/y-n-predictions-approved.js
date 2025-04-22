const mongoose = require("mongoose");

const ynPredictionsApprovedSchema = mongoose.Schema(
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

module.exports = mongoose.model("y-n-predictions-approved", ynPredictionsApprovedSchema, "y-n-predictions-approved");