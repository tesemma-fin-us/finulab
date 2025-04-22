const mongoose = require("mongoose");

const newsCommentsLikeDislikeDescsSchema = mongoose.Schema(
    {
        username: String,
        commentId: String,
        type: String,
        status: String,
        timeStamp: Number
    }
);

module.exports = mongoose.model("news-comments-like-dislike-descs", newsCommentsLikeDislikeDescsSchema, "news-comments-like-dislike-descs");