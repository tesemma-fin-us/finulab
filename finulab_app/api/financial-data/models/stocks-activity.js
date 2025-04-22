const mongoose = require("mongoose");

const stocksActivitySchema = mongoose.Schema(
    {
        symbol: String,
        profileImage: String,
        open: Number,
        high: Number,
        low: Number,
        close: Number,
        volume: Number,
        change: Number,
        changePerc: Number,
        marketCap: Number,
        timeStamp: Number
    }
);

module.exports = mongoose.model("stocks-activity", stocksActivitySchema, "stocks-activity");