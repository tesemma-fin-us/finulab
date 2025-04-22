const mongoose = require("mongoose");

const ynHoldingsSchema = mongoose.Schema(
    {
        predictionId: String,
        predictiveImage: String,
        predictiveQuestion: String,
        marketId: String,
        continous: Boolean,
        username: String,
        walletAddress: String,
        outcome: String,
        outcomeImage: String,

        yesQuantity: Number,
        yesAveragePrice: Number,
        yesQuantityDesc: Array,
        noQuantity: Number,
        noAveragePrice: Number,
        noQuantityDesc: Array,
        boughtTimestamp: Number,

        soldYesQuantity: Number,
        soldYesCollateral: Number,
        soldYesAveragePrice: Number,
        soldYesQuantityDesc: Array,
        soldYesCollateralDesc: Array,
        soldNoQuantity: Number,
        soldNoCollateral: Number,
        soldNoAveragePrice: Number,
        soldNoQuantityDesc: Array,
        soldNoCollateralDesc: Array,
        soldTimestamp: Number,
        
        resolutionOutcome: String,
        resolutionRequestKeys: Array,
        earnings: Number,
        predictionEndTimestamp: Number,
        resolvedTimestamp: Number
    }
);

module.exports = mongoose.model("y-n-holdings", ynHoldingsSchema, "y-n-holdings");