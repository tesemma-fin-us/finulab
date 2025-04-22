const mongoose = require("mongoose");

const cPortfoliosResolutionSchema = mongoose.Schema(
    {
        predictionId: String,
        marketId: String,
        username: String,
        walletAddress: String,
        chainId: String,
        resolutionOutcome: String,

        quantitiesDesc: Array,

        soldQuantitiesDesc: Array,
        soldCollateralDesc: Array,

        portfolioResolveSent: Boolean,
        portfolioResolveValidated: Boolean,
        portfolioResolveNotified: Boolean,
        portfolioResolveRequestKey: String,
        portfolioResolveSentTimestamp: Number,
        portfolioResolveValidatedTimestamp: Number,
        portfolioResolveValidationAttempts: Number,

        collateralResolveSent: Boolean,
        collateralResolveValidated: Boolean,
        collateralResolveNotified: Boolean,
        collateralResolveRequestKey: String,
        collateralResolveSentTimestamp: Number,
        collateralResolveValidatedTimeStamp: Number,
        collateralResolveValidationAttempts: Number
    }
);

module.exports = mongoose.model("c-portfolios-resolution", cPortfoliosResolutionSchema, "c-portfolios-resolution");