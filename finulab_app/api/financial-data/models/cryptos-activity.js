const mongoose = require("mongoose");

const cryptosActivitySchema = mongoose.Schema(
    {
        symbol: String,
        profileImage: String,
        open: Number,
        close: Number,
        volume: Number,
        change: Number,
        changePerc: Number,
        marketCap: Number,
        timeStamp: Number
    }
);

module.exports = mongoose.model("cryptos-activity", cryptosActivitySchema, "cryptos-activity");