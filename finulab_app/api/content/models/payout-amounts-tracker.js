const mongoose = require("mongoose");

const payoutAmountsTrackerSchema = mongoose.Schema(
    {
        postLiked: Number,
        postDisliked: Number,
        commentLiked: Number,
        commentDisliked: Number,
        postViewed: Number,
        commentViewed: Number,
        priceTargetSubmission: Number,
        recommendationSubmission: Number,
        timeStamp: Number
    }
);

module.exports = mongoose.model("payout-amounts-tracker", payoutAmountsTrackerSchema, "payout-amounts-tracker");