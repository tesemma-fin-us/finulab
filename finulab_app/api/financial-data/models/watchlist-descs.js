const mongoose = require("mongoose");

const watchlistDescsSchema = mongoose.Schema(
    {
        username: String,
        distinction: String,
        symbol: String,
        action: String,
        actionChangeIndicator: Boolean,
        timeStamp: Number
    }
);

module.exports = mongoose.model("watchlist-descs", watchlistDescsSchema, "watchlist-descs");