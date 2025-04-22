const mongoose = require("mongoose");

const ynPredictionsLikeDislikeDescSchema = mongoose.Schema(
    {
        username: String,
        predictionId: String,
        type: String,
        status: String,
        timeStamp: Number
    }
);

module.exports = mongoose.model("y-n-predictions-like-dislike-desc", ynPredictionsLikeDislikeDescSchema, "y-n-predictions-like-dislike-desc");