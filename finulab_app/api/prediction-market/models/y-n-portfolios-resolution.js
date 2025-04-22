const mongoose = require("mongoose");

const ynPortfoliosResolutionSchema = mongoose.Schema(
    {
        predictionId: String,
        marketId: String,
        username: String,
        walletAddress: String,
        chainId: String,
        outcome: String,
        resolutionOutcome: String,

        yesQuantity: Number,
        noQuantity: Number,

        soldYesQuantity: Number,
        soldYesCollateral: Number,
        soldNoQuantity: Number,
        soldNoCollateral: Number,

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

module.exports = mongoose.model("y-n-portfolios-resolution", ynPortfoliosResolutionSchema, "y-n-portfolios-resolution");