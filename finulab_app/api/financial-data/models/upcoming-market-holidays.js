const mongoose = require("mongoose");

const upcomingMarketHolidaysSchema = mongoose.Schema(
    {
        "upcoming-market-holidays": Array,
        timeStamp: Number
    }
);

module.exports = mongoose.model("upcoming-market-holidays", upcomingMarketHolidaysSchema, "upcoming-market-holidays");