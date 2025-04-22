const mongoose = require("mongoose");

const cMarketSchema = mongoose.Schema(
    {
        predictionId: String,
        predictiveImage: String,
        predictiveQuestion: String,
        creator: String,
        creatorAccountType: String,
        creatorWalletAddress: String,
        outcomes: Array, 
        outcomesMap: Array,
        outcomeImages: Object,
        continous: Boolean,
        chains: Array,
        participantsTotal: Number,
        participantsDesc: Object,
        quantityDesc: Object,
        priceDesc: Object,
        probabilityDesc: Object,
        costFunction: Number,
        costFunctionDesc: Object,
        rules: String,
        status: String,
        resolved: Boolean,
        resolutionOutcome: String,
        createdTimestamp: Number,
        requestKey: String,
        endDate: Number,
        resolutionTimeStamp: Number
    }
);

module.exports = mongoose.model("c-market", cMarketSchema, "c-market");