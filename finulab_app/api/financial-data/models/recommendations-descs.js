const mongoose = require("mongoose");

const recommendationsDescsSchema = mongoose.Schema(
    {
        username: String,
        distinction: String,
        symbol: String,
        recommendation: String,
        recommendationChange: String,
        recommendationChangeIndicator: Boolean,
        timeStamp: Number
    }
);

module.exports = mongoose.model("recommendations-descs", recommendationsDescsSchema, "recommendations-descs");