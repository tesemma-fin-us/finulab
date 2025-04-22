const mongoose = require("mongoose");

const commentsLikeDislikeDescsSchema = mongoose.Schema(
    {
        username: String,
        commentId: String,
        type: String,
        status: String,
        timeStamp: Number
    }
);

module.exports = mongoose.model("comments-like-dislike-descs", commentsLikeDislikeDescsSchema, "comments-like-dislike-descs");