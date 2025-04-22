const mongoose = require("mongoose");

const cActivitySchema = mongoose.Schema(
    {
        predictionId: String,
        predictiveImage: String,
        predictiveQuestion: String,
        marketId: String,
        continous: Boolean,
        username: String,
        walletAddress: String,
        outcome: String,
        outcomeDesc: String,
        outcomeImage: String,
        chainId: String,
        action: String,
        quantity: Number,
        averagePrice: Number,
        fee: Number,
        collateral: Number,
        costFunctionDesc: Object,
        prevCostFunctionDesc: Object,
        orderStatus: String,
        resolutionOutcome: String,
        requestKey: String,
        openedTimestamp: Number,
        sentTimestamp: Number,
        validatedTimestamp: Number
    }
);

module.exports = mongoose.model("c-activity", cActivitySchema, "c-activity");