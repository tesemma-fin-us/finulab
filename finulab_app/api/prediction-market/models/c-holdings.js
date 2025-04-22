const mongoose = require("mongoose");

const cHoldingsSchema = mongoose.Schema(
    {
        predictionId: String,
        predictiveImage: String,
        predictiveQuestion: String,
        marketId: String,
        continous: Boolean,
        username: String,
        walletAddress: String,
        outcomes: Array, 
        outcomeImages: Object,

        quantities: Object,
        averagePrices: Object,
        quantitiesDesc: Object,
        boughtTimestamp: Number,

        soldQuantities: Object,
        soldCollateral: Object,
        soldAveragePrices: Object,
        soldQuantitiesDesc: Object,
        soldCollateralDesc: Object,
        soldTimestamp: Number,

        resolutionOutcome: String,
        resolutionRequestKeys: Array,
        earnings: Number,
        predictionEndTimestamp: Number,
        resolvedTimestamp: Number
    }
);

module.exports = mongoose.model("c-holdings", cHoldingsSchema, "c-holdings");