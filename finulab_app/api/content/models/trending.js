const mongoose = require("mongoose");

const trendingSchema = mongoose.Schema(
    {
        subjects: Array,
        timeStamp: Number
    }
);

module.exports = mongoose.model("trending", trendingSchema, "trending");