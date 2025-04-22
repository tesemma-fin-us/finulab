const mongoose = require("mongoose");

const newsLikeDislikeDescsSchema = mongoose.Schema(
    {
        username: String,
        newsId: String,
        type: String,
        status: String,
        timeStamp: Number
    }
);

module.exports = mongoose.model("news-like-dislike-descs", newsLikeDislikeDescsSchema, "news-like-dislike-descs");