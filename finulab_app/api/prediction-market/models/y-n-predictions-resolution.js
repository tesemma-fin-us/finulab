const mongoose = require("mongoose");

const ynPredictionsResolutionSchema = mongoose.Schema(
    {
        predictionId: String,
        marketId: String,
        creator: String,
        chainId: String,
        outcome: String,
        resolutionOutcome: String,

        readyForClose: Boolean,
        closeNotified: Boolean,
        closed: Boolean, 
        closeSent: Boolean,
        closeValidated: Boolean,
        closeRequestKey: String,
        closeSentTimestamp: Number,
        closeValidatedTimestamp: Number,
        closeValidationAttempts: Number,

        readyForResolution: Boolean,
        resolveNotified: Boolean,
        resolved: Boolean,
        resolveSent: Boolean,
        resolveValidated: Boolean,
        resolveRequestKey: String,
        resolveSentTimestamp: Number,
        resolveValidatedTimestamp: Number,
        resolveValidationAttempts: Number,

        portfolioSubmitted: Boolean
    }
);

module.exports = mongoose.model("y-n-predictions-resolution", ynPredictionsResolutionSchema, "y-n-predictions-resolution");